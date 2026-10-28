'use strict';
// Competition-oriented local submission ledger. This module prepares frozen
// source snapshots and correlates OFFICIAL records, but NEVER submits to the OJ.
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const {routeProblem}=require('./submit-bridge.cjs');
const {asOfficialLink}=require('./official-session.cjs');
const {decideAutoReceipt}=require('./submission-detector.cjs');
const LIMIT=80, MAX_CODE=250000, DUPLICATE_WINDOW_MS=90000;
function hash(code){return crypto.createHash('sha256').update(code,'utf8').digest('hex');}
function parseTarget(url){
 const p=routeProblem(url);
 if(!p.supported || !['codeforces','atcoder','luogu'].includes(p.platform))throw Error('暂不支持直接快速提交该题目，请复制代码并使用官网');
 const part=p.problemId.split('/');
 return {...p,contestId:p.platform==='codeforces'?part[0]:p.platform==='atcoder'?p.problemId.split('_').slice(0,-1).join('_'):null,
  index:p.platform==='codeforces'?part[1]:null};
}
function statusLabel(state){return ({prepared:'准备中',form_filled:'表单已填充',receipt_pending:'官方记录待核对',judging:'官方评测中',verified:'官方结果已核对',unverified:'官方记录关联待核对',failed:'失败'})[state]||'未知';}
function comparable(result,task){
 if(!result||!result.confirmed||!result.id||result.platform!==task.platform)return {match:false,reason:'官方记录尚未确认或平台不一致'};
 if(task.receipt?.id!==String(result.id))return {match:false,reason:'提交记录编号与当前任务不一致'};
 if(task.platform==='codeforces'){
  if(result.contestId!=null && String(result.contestId)!==String(task.contestId))return {match:false,reason:'比赛 ID 不一致'};
  if(result.problem !==task.index)return {match:false,reason:'Codeforces 题号不一致'};
  return {match:true,confidence:'official-api-problem-matched'};
 }
 if(result.problemId && result.problemId===task.problemId)return {match:true,confidence:'official-detail-problem-matched'};
 return {match:false,reason:'提交详情缺少可核对的题号，请在官网人工确认'};
}
function store(directory){
 const base=path.resolve(directory);
 const recordsFile=path.join(base,'ledger.json');
 let cache=null,chain=Promise.resolve();
 async function load(){if(cache)return cache;try{const raw=JSON.parse(await fs.readFile(recordsFile,'utf8'));cache=Array.isArray(raw)?raw:[];}catch(e){if(e.code!=='ENOENT')throw e;cache=[];}return cache;}
 async function save(rows){await fs.mkdir(base,{recursive:true});const tmp=recordsFile+'.tmp';await fs.writeFile(tmp,JSON.stringify(rows,null,2),'utf8');await fs.rename(tmp,recordsFile);}
 function serialize(fn){const p=chain.then(fn);chain=p.catch(()=>{});return p;}
 function publicRow(row){const {code,...rest}=row;return structuredClone(rest);}
 async function prepare(info){return serialize(async()=>{
  const target=parseTarget(info?.url);const code=info?.code;
  if(typeof code!=='string'||!code.trim()||Buffer.byteLength(code,'utf8')>MAX_CODE)throw Error('源码为空或超过 250KB');
  if(!/\bmain\s*\(/.test(code))throw Error('未找到 main 函数，请确认要提交的代码');
  const now=Date.now(),digest=hash(code),rows=await load();
  const previous=rows.find(x=>x.platform===target.platform&&x.problemId===target.problemId&&x.sourceHash===digest&&now-x.createdAt<DUPLICATE_WINDOW_MS&&['prepared','form_filled','receipt_pending','judging','unverified'].includes(x.state));
  if(previous&&!info.overrideDuplicate)return {...publicRow(previous),duplicate:true};
  const id=crypto.randomUUID(),row={id,platform:target.platform,problemId:target.problemId,contestId:target.contestId,index:target.index,problemUrl:String(info.url),submitUrl:target.url,fileName:String(info.fileName||'main.cpp').slice(0,128),fileKey:String(info.fileKey||'').slice(0,1000),sourceHash:digest,createdAt:now,updatedAt:now,state:'prepared',receipt:null,verdict:null,officialVerified:false,notes:[]};
  await fs.mkdir(base,{recursive:true});await fs.writeFile(path.join(base,id+'.cpp'),code,{flag:'wx',encoding:'utf8'});
  rows.unshift(row);if(rows.length>LIMIT){for(const old of rows.slice(LIMIT))await fs.rm(path.join(base,old.id+'.cpp'),{force:true});rows.length=LIMIT;}
  await save(rows);return publicRow(row);
 });}
 async function update(id,change){return serialize(async()=>{const rows=await load(),x=rows.find(x=>x.id===id);if(!x)throw Error('找不到本地提交任务');await change(x);x.updatedAt=Date.now();await save(rows);return publicRow(x);});}
 async function markFilled(id,filled){return update(id,x=>{if(!['prepared','form_filled'].includes(x.state))throw Error('当前提交已进入其他阶段');if(filled)x.state='form_filled';});}
 async function linkReceipt(id,url){return update(id,x=>{const detail=asOfficialLink(x.platform,url);
  if(x.platform==='codeforces'&&String(detail.contestId)!==String(x.contestId))throw Error('提交记录比赛 ID 与题目不匹配');
  if(x.platform==='atcoder' && detail.contestId!==x.contestId)throw Error('AtCoder 比赛不一致');
  // Navigation can fire several times for one detail URL. Keep an already
  // verified verdict when this is the exact same official record.
  if(x.receipt?.id===String(detail.id)&&x.receipt?.url===detail.url)return;
  x.receipt={id:String(detail.id),url:detail.url,linkedAt:Date.now()};x.state='receipt_pending';x.verdict=null;x.officialVerified=false;
 });}
 async function detectReceipts(id,events){return update(id,x=>{
  const result=decideAutoReceipt(x,events);
  x.detectedCandidates=result.candidates.map(c=>({id:String(c.id),url:c.url,problemId:c.problemId,identity:c.identity,source:c.source}));
  x.detectionReason=result.reason;
  if(result.status==='linked'){
   x.receipt={id:String(result.receipt.id),url:result.receipt.url,linkedAt:Date.now(),source:'auto-detected'};
   x.state='receipt_pending';x.officialVerified=false;x.verdict=null;
  }
 });}
 async function applyVerdict(id,result){return update(id,x=>{
  if(!x.receipt)throw Error('请先关联官方提交详情链接');
  const check=comparable(result,x);
  if(!result?.confirmed||String(result.id)!==x.receipt.id||result.platform!==x.platform)throw Error('官方结果与本地任务不一致');
  const incoming=String(result.verdict||'UNKNOWN').slice(0,64);
  const waiting=['PENDING','TESTING','SUBMITTED','RUNNING','JUDGING'].includes(incoming);
  if(x.officialVerified && waiting)return; // A stale page cannot roll back an already verified AC/WA.
  x.verdict=incoming;
  x.state=check.match?(waiting?'judging':'verified'):'unverified';
  x.officialVerified=check.match && x.state==='verified';x.confidence=check.match?check.confidence:null;
  if(!check.match)x.notes=[check.reason];
 });}
 async function markWatching(id){return update(id,x=>{x.browserWatch=true;});}
 async function list(){return (await load()).map(publicRow);}
 async function get(id){return publicRow((await load()).find(x=>x.id===id)||{});}
 async function readSource(id){const x=(await load()).find(x=>x.id===id);if(!x)throw Error('找不到提交任务');return fs.readFile(path.join(base,id+'.cpp'),'utf8');}
 return {prepare,list,get,markWatching,markFilled,linkReceipt,detectReceipts,applyVerdict,readSource};
}
module.exports={store,hash,parseTarget,statusLabel,comparable};
