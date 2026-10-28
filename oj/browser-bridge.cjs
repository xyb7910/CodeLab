'use strict';
// Localhost browser-extension bridge. Competitive Companion continues to import
// problem samples on port 10043; Yanpb's opt-in extension submits in Chrome.
const http=require('node:http');
const crypto=require('node:crypto');
const {routeProblem}=require('./submit-bridge.cjs');
const DEFAULT_PORT=10045,MAX_BODY=8192,JOB_TTL_MS=10*60_000,WATCH_TTL_MS=6*60*60_000;
const extensionOrigin=/^chrome-extension:\/\/[a-p]{32}$/;
const isUUID=s=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const responseHeaders=origin=>({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(origin&&origin.startsWith('chrome-extension:')?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{})});
function safeMatch(job,detail){
 if(!detail || detail.platform!==job.platform) return false;
 if(detail.kind==='receipt'||detail.kind==='verdict'){
   const {asOfficialLink}=require('./official-session.cjs');
   try{const parsed=asOfficialLink(job.platform,detail.url);
     if(job.platform==='codeforces' && String(parsed.contestId)!==String(job.contestId))return false;
     if(job.platform==='atcoder' && String(parsed.contestId)!==String(job.contestId))return false;
     if(detail.kind==='verdict') {
       const {normalizeOfficialStatus}=require('./official-session.cjs');
       const {routeProblem}=require('./submit-bridge.cjs');
       if(!['atcoder','luogu'].includes(job.platform))return false;
       if(!normalizeOfficialStatus(detail.verdict)||!detail.problemUrl)return false;
       const target=routeProblem(detail.problemUrl);
       return target.platform===job.platform&&target.problemId===job.problemId;
     }
     return true;
   }catch{return false;}
 }
 return ['filled','attempted','blocked','awaiting-user','error'].includes(detail.kind);
}
function createBrowserBridge({port=DEFAULT_PORT,onEvent=()=>{},onPaired=()=>{},credentials=null,now=Date.now,random=crypto.randomBytes}={}){
 let server,clientOrigin=credentials?.origin||'',authToken=credentials?.token||'',pin='',pinExpires=0,pairAttempts=0,lastActivity=0;
 const jobs=new Map(),order=[];
 const json=(res,code,data,origin)=>{res.writeHead(code,responseHeaders(origin));res.end(JSON.stringify(data));};
 function status(){const pending=order.filter(id=>{const j=jobs.get(id);return j&&j.expiresAt>now()&&j.state==='queued';}).length;
  const watching=[...jobs.values()].filter(j=>j.kind==='watch'&&j.expiresAt>now()&&['queued','claimed','receipt'].includes(j.state)).length;
  return {connected:!!authToken&&now()-lastActivity<90_000,paired:!!authToken,pending,watching,port:server?.address()?.port??port,active:!!server?.listening,lastSeenAt:lastActivity||null};}
 function pair(){pin=String(100000+crypto.randomInt(900000));pinExpires=now()+5*60_000;pairAttempts=0;return {pin,expiresIn:300,port:server?.address()?.port??port};}
 function queueWatch(info){
  const route=routeProblem(info?.problemUrl);
  if(!route.supported || !['codeforces','atcoder','luogu'].includes(route.platform))throw Error('不支持此 OJ 的直接浏览器提交页');
  if(typeof info.id!=='string'||!isUUID(info.id))throw Error('无效的浏览器监听任务 ID');
  let previousReceipt=null;
  if(info.receiptUrl){
   const {asOfficialLink}=require('./official-session.cjs');
   const link=asOfficialLink(route.platform,info.receiptUrl);
   const contest=route.platform==='codeforces'?route.problemId.split('/')[0]:route.platform==='atcoder'?route.problemId.split('_').slice(0,-1).join('_'):null;
   if(contest!=null&&String(link.contestId)!==String(contest))throw Error('恢复的官方记录比赛不匹配');
   previousReceipt=link.url;
  }
  const job={id:info.id,kind:'watch',platform:route.platform,
    contestId:route.platform==='codeforces'?route.problemId.split('/')[0]:route.platform==='atcoder'?route.problemId.split('_').slice(0,-1).join('_'):null,
    problemId:route.problemId,submitUrl:route.url,problemUrl:info.problemUrl,
    expiresAt:now()+WATCH_TTL_MS,state:previousReceipt?'receipt':'queued',previousReceipt,createdAt:now()};
  if(jobs.has(job.id)){const existing=jobs.get(job.id);if(existing.kind==='watch'&&existing.expiresAt>now())return {id:job.id,url:existing.submitUrl,queued:existing.state==='queued',existing:true,expiresIn:Math.ceil((existing.expiresAt-now())/1000)};throw Error('此任务已被使用');}
  jobs.set(job.id,job);if(job.state==='queued')order.push(job.id);
  if(order.length>100){const old=order.shift();jobs.delete(old);}
  return {id:job.id,url:job.submitUrl,queued:job.state==='queued',expiresIn:Math.ceil(WATCH_TTL_MS/1000)};
 }
 function queue(info){const route=routeProblem(info?.problemUrl);
  if(!route.supported||!['codeforces','atcoder','luogu'].includes(route.platform))throw Error('该题目不支持浏览器极速提交');
  if(typeof info?.id!=='string'||!isUUID(info.id))throw Error('无效的提交任务');
  if(typeof info.code!=='string'||!info.code.trim()||Buffer.byteLength(info.code,'utf8')>250000)throw Error('源码无效或过大');
  const job={id:info.id,platform:route.platform,contestId:route.platform==='codeforces'?route.problemId.split('/')[0]:route.platform==='atcoder'?route.problemId.split('_').slice(0,-1).join('_'):null,problemId:route.problemId,submitUrl:route.url,problemUrl:info.problemUrl,code:info.code,oneClick:info.oneClick===true,expiresAt:now()+JOB_TTL_MS,state:'queued',createdAt:now()};
  if(jobs.has(job.id))throw Error('此任务已排队，请先核对状态');jobs.set(job.id,job);order.push(job.id);
  if(order.length>100){const old=order.shift();jobs.delete(old);}return {id:job.id,port:server?.address()?.port??port,queued:true,expiresIn:600};
 }
 async function read(req){let count=0,items=[];for await(const buf of req){count+=buf.length;if(count>MAX_BODY)throw Error('payload-too-large');items.push(buf);}return JSON.parse(Buffer.concat(items).toString('utf8')||'{}');}
 const handler=async(req,res)=>{
  const incoming=req.headers.origin||'';const origin=incoming || (req.headers['x-yanpb-extension']==='1'?'extension-background':'');
  if(!extensionOrigin.test(origin)&&origin!=='extension-background')return json(res,403,{error:'extension origin required'},'*');
  // New browser installations have a different extension ID. Explicit PIN re-pair
  // must be possible without trusting or reusing the old extension credentials.
  if(clientOrigin && clientOrigin!==origin && new URL(req.url,'http://127.0.0.1:'+port).pathname!=='/pair')return json(res,403,{error:'different browser extension; re-pair in CodeLab'},origin);
  if(req.method==='OPTIONS'){res.writeHead(204,{...responseHeaders(origin),'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization,X-Yanpb-Extension'});return res.end();}
  if(req.method!=='POST')return json(res,405,{error:'POST required'},origin);
  const pathname=new URL(req.url,'http://127.0.0.1:'+port).pathname;
  let body;try{body=await read(req);}catch(e){return json(res,400,{error:e.message},origin);}
  if(pathname==='/pair'){
    // Pair button in CodeLab explicitly authorizes credential rotation. Existing
    // token remains valid until a new browser proves possession of the PIN.
    if(!pin||pinExpires<now()||++pairAttempts>5)return json(res,403,{error:'pairing expired or attempt limit'},origin);
    if(typeof body.pin!=='string'||body.pin!==pin)return json(res,403,{error:'invalid pairing code'},origin);
    authToken=random(32).toString('hex');clientOrigin=origin;pin='';lastActivity=now();await onPaired({token:authToken,origin});return json(res,200,{token:authToken,port:server?.address()?.port??port},origin);
  }
  const bearer=/^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization||'');
  if(!authToken||!bearer||!crypto.timingSafeEqual(Buffer.from(bearer[1]),Buffer.from(authToken)))return json(res,401,{error:'not authenticated'},origin);
  lastActivity=now();
  if(pathname==='/heartbeat'){return json(res,200,{ok:true,port:server?.address()?.port??port,pending:status().pending,watching:status().watching},origin);}
  if(pathname==='/next'){
   while(order.length){const id=order[0],j=jobs.get(id);order.shift();if(!j||j.state!=='queued'||j.expiresAt<now()){if(j)j.state='expired';continue;}j.state='claimed';return json(res,200,{job:{...j}},origin);}
   return json(res,200,{job:null},origin);
  }
  if(pathname==='/retry'){
   const j=jobs.get(body.id);if(!j||j.expiresAt<now()||j.state!=='claimed')return json(res,409,{error:'job not retryable'},origin);
   j.retries=(j.retries||0)+1;
   if(j.retries>3){j.state='blocked';return json(res,429,{error:'retry limit reached'},origin);}
   j.state='queued';order.push(j.id);return json(res,200,{ok:true,retries:j.retries},origin);
  }
  if(pathname==='/event'){
   const j=jobs.get(body.id);if(!j||j.expiresAt<now()||(j.state==='queued'&&j.kind!=='watch'))return json(res,404,{error:'unknown or expired job'},origin);
   const event={kind:body.kind,platform:j.platform,url:body.url||'',reason:String(body.reason||'').slice(0,160),id:j.id,attempted:body.kind==='attempted',verdict:String(body.verdict||'').slice(0,80),problemUrl:String(body.problemUrl||'').slice(0,1000)};
   if(!safeMatch(j,event))return json(res,403,{error:'invalid event or receipt'},origin);
   if(j.kind==='watch'&&j.state==='queued')j.state='claimed'; // Browser had an active watched tab before IDE restart.
   if(j.state==='receipt'&&!['receipt','verdict'].includes(event.kind))return json(res,409,{error:'receipt already recorded'},origin);
   if(event.kind==='verdict'&&j.state!=='receipt')return json(res,409,{error:'receipt required before verdict'},origin);
   // Commit queue state only after the persistent ledger accepts the event.
   try{await onEvent(event);}catch(e){return json(res,409,{error:'ledger rejected event: '+String(e.message).slice(0,100)},origin);}
   if(event.kind==='receipt')j.state='receipt';
   else if(event.kind==='blocked'||event.kind==='error')j.state='blocked';
   else if(event.kind==='attempted')j.state='attempted';
   return json(res,200,{ok:true},origin);
  }
  return json(res,404,{error:'unknown endpoint'},origin);
 };
 server=http.createServer((req,res)=>{void handler(req,res).catch(err=>{if(!res.headersSent)json(res,500,{error:'internal error'},req.headers.origin||'*');});});
 return {async start(){if(server.listening)return status();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',()=>{server.off('error',reject);resolve();});});return status();},
  async stop(){if(server.listening)await new Promise(resolve=>server.close(resolve));},pair,queue,queueWatch,status,
  reset(){authToken='';clientOrigin='';pin='';lastActivity=0;jobs.clear();order.length=0;},_jobs:jobs};
}
module.exports={createBrowserBridge,safeMatch,extensionOrigin,DEFAULT_PORT};
