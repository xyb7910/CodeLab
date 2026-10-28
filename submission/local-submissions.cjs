'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const MAX_HISTORY=50, MAX_SOURCE=500000, MAX_CASES=30;
function checkRequest(p){
 if(!p||typeof p!=='object'||Array.isArray(p))throw Error('Invalid local submission');
 if(typeof p.code!=='string'||!p.code.trim()||Buffer.byteLength(p.code,'utf8')>MAX_SOURCE)throw Error('Source must be 1–500000 bytes');
 if(typeof p.fileKey!=='string'||!p.fileKey||p.fileKey.length>1400)throw Error('Invalid file identity');
 if(!Array.isArray(p.cases)||p.cases.length>MAX_CASES)throw Error('Too many test cases');
 const cases=p.cases.map((c,i)=>{
   if(!c||typeof c.input!=='string'||typeof c.expected!=='string')throw Error('Invalid case '+(i+1));
   if(Buffer.byteLength(c.input)>256000||Buffer.byteLength(c.expected)>256000)throw Error('Test case too large');
   return {name:String(c.name||'Case '+(i+1)).slice(0,90),input:c.input,expected:c.expected};
 });
 return {...p,mode:p.mode==='csp'?'csp':'standard',cases};
}
function identity(key){return crypto.createHash('sha256').update(key).digest('hex');}
function calculateVerdict(result,cases){
 const list=Array.isArray(result?.results)?result.results:[];
 const first=['CE','TLE','RE','OLE','WA','NO_OUTPUT','ERROR','MISSING'].find(v=>result.status===v) || list.find(x=>x.status!=='OK')?.status;
 if(first)return {verdict:first,tested:list.length,passed:list.filter(x=>x.status==='OK').length,fullyChecked:false};
 const fullyChecked=cases.length>0&&cases.every(c=>c.expected.length>0)&&list.length===cases.length;
 return {verdict:fullyChecked?'LOCAL_PASS':'UNCHECKED',tested:list.length,passed:list.filter(x=>x.status==='OK').length,fullyChecked};
}
function store(dir,runStandard,runCsp){
 async function list(key){const filename=path.join(dir,identity(key)+'.json');let data=[];try{data=JSON.parse(await fs.readFile(filename,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
  if(!Array.isArray(data))throw Error('Corrupt submission history');return data;
 }
 async function submit(raw,job,progress=()=>{}){
  const p=checkRequest(raw);
  if(p.mode==='csp'){
   if(!p.contest||!p.task||typeof runCsp!=='function')throw Error('CSP context is missing');
  }
  const result=p.mode==='csp'?await runCsp(p,job,progress):await runStandard(p,job,progress);
  const verdict=calculateVerdict(result,p.cases);
  const item={id:crypto.randomUUID(),at:new Date().toISOString(),fileKey:p.fileKey,fileName:String(p.fileName||'main.cpp').slice(0,180),
   mode:p.mode,contestName:String(p.contest?.contestName||'').slice(0,160),task:p.task||'',standard:p.standard||'c++17',source:p.code,
   sha256:crypto.createHash('sha256').update(p.code).digest('hex'),verdict:verdict.verdict,passed:verdict.passed,tested:verdict.tested,
   fullyChecked:verdict.fullyChecked,compileMs:result.compileMs||0,
   cases:(result.results||[]).slice(0,MAX_CASES).map(x=>({name:String(x.name||'Sample').slice(0,90),status:x.status,timeMs:x.timeMs||0})),
   diagnostic:String(result.stderr||result.compiler||'').slice(0,8000)};
  await fs.mkdir(dir,{recursive:true});
  const filename=path.join(dir,identity(p.fileKey)+'.json');
  // Ensure sequential writes per file even if the caller bypasses the UI guard.
  const previous=await list(p.fileKey),updated=[item,...previous].slice(0,MAX_HISTORY),temp=filename+'.'+item.id+'.tmp';
  try{await fs.writeFile(temp,JSON.stringify(updated),'utf8');await fs.rename(temp,filename);}finally{await fs.rm(temp,{force:true}).catch(()=>{});}
  return {...item,source:undefined};
 }
 async function read(key,id){if(!/^[0-9a-f-]{36}$/i.test(String(id)))throw Error('Invalid submission ID');const items=await list(key);return items.find(x=>x.id===id)||null;}
 async function migrate(from,to){
  if(typeof from!=='string'||typeof to!=='string'||!from||!to||from===to)return false;
  const old=await list(from);if(!old.length)return false;
  const combined=[...old,...await list(to)].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).slice(0,MAX_HISTORY);
  await fs.mkdir(dir,{recursive:true});
  const dest=path.join(dir,identity(to)+'.json'),tmp=dest+'.migrate.tmp';
  try{await fs.writeFile(tmp,JSON.stringify(combined),'utf8');await fs.rename(tmp,dest);await fs.rm(path.join(dir,identity(from)+'.json'),{force:true});}
  finally{await fs.rm(tmp,{force:true}).catch(()=>{});}
  return true;
 }
 async function summaries(key){return (await list(key)).map(({source,diagnostic,...other})=>other);}
 return {submit,read,summaries,migrate};
}
module.exports={checkRequest,calculateVerdict,store,identity};
