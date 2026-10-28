'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {createBrowserBridge}=require('../oj/browser-bridge.cjs');
const {store}=require('../oj/fast-submit.cjs');
const {routeProblem}=require('../oj/submit-bridge.cjs');
const {normalizeOfficialStatus,asOfficialLink}=require('../oj/official-session.cjs');
const os=require('node:os');
const tick=ms=>new Promise(r=>setTimeout(r,ms));
const P='https://atcoder.jp/contests/abc371/tasks/abc371_a';
const S='https://atcoder.jp/contests/abc371/submissions/112233';
function fakeStorage(){const data={};return {data,async get(keys){return typeof keys==='string'?{[keys]:data[keys]}:Array.isArray(keys)?Object.fromEntries(keys.map(k=>[k,data[k]])):data;},async set(x){Object.assign(data,x);}};}
test('A browser showing AC without a second navigation synchronizes to the actual verified ledger',async t=>{
 const directory=await fs.promises.mkdtemp(path.join(os.tmpdir(),'yanpb-ac-sync-'));
 const db=store(directory);const row=await db.prepare({url:P,code:'int main(){return 0;}'});await db.markWatching(row.id);
 const receiptLink=asOfficialLink('atcoder',S);
 const events=[];
 const bridge=createBrowserBridge({port:10045,onEvent:async event=>{
  events.push(event.kind+':'+(event.verdict||''));
  if(event.kind==='receipt')await db.linkReceipt(event.id,event.url);
  if(event.kind==='verdict'){
   const p=routeProblem(event.problemUrl),code=normalizeOfficialStatus(event.verdict);
   await db.applyVerdict(event.id,{platform:event.platform,confirmed:true,id:receiptLink.id,problemId:p.problemId,verdict:code});
  }
 }});
 try{await bridge.start();}catch(e){await fs.promises.rm(directory,{recursive:true,force:true});if(e.code==='EADDRINUSE')return t.skip('Port used by another test');throw e;}
 try{
  bridge.queueWatch({id:row.id,problemUrl:P});
  const listeners={},local=fakeStorage(),session=fakeStorage(),url=S+'?lang=en';
  let status='Judging',currentTab={id:20,url:'https://atcoder.jp/contests/abc371/submit',status:'complete'};
  const evt=name=>({addListener:fn=>{listeners[name]=fn;}});
  const chrome={storage:{local,session},runtime:{onMessage:evt('message'),onStartup:evt('startup'),onInstalled:evt('installed')},alarms:{create(){},onAlarm:evt('alarm')},
   tabs:{query:async()=>[currentTab],get:async()=>currentTab,create:async()=>{throw Error('Must not open duplicate tab');},onUpdated:evt('updated'),onCreated:evt('created'),onRemoved:evt('removed')},
   scripting:{executeScript:async args=>args.files?[{result:null}]:[{result:{currentUrl:url,urls:[P],text:status}}]},notifications:{create(){}}};
  const base=path.join(__dirname,'..','oj','submit-extension');
  const ctx={chrome,URL,Date,fetch,AbortSignal,Promise,console,setTimeout,clearTimeout,setInterval:()=>0,importScripts:null};
  const context=vm.createContext(ctx);
  ctx.importScripts=file=>vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),context);
  vm.runInContext(fs.readFileSync(path.join(base,'worker.js'),'utf8'),context);
  const message=op=>new Promise(resolve=>listeners.message(op,{tab:currentTab},resolve));
  const paired=await message({op:'pair',pin:bridge.pair().pin});assert.equal(paired.paired,true);
  await tick(90);
  currentTab={...currentTab,url};listeners.updated(20,{url},{...currentTab,status:'loading'});await tick(120);
  assert.ok((await db.get(row.id)).receipt,'receipt must match even with locale query');
  // Official page dynamically updates its text from Judging to AC; no URL change.
  status='AC';const result=await message({op:'page-verdict-changed'});
  assert.equal(result.ok,true);await tick(40);
  const final=await db.get(row.id);
  assert.equal(final.verdict,'AC');assert.equal(final.officialVerified,true);
  assert.ok(events.includes('verdict:AC'));
  // An old cached Judging page can never overwrite the final AC.
  status='Judging';await message({op:'page-verdict-changed'});
  assert.equal((await db.get(row.id)).verdict,'AC');
 }finally{await bridge.stop();await fs.promises.rm(directory,{recursive:true,force:true});}
});
test('Late browser worker can associate unique AtCoder detail by exact task rather than arbitrary latest record',async t=>{
 const bridge=createBrowserBridge({port:10045});
 try{await bridge.start();}catch(e){if(e.code==='EADDRINUSE')return t.skip('Port used');throw e;}
 try{
  const id=crypto.randomUUID();bridge.queueWatch({id,problemUrl:P});
  const listeners={},local=fakeStorage(),session=fakeStorage();let tab={id:30,url:S,status:'complete'};
  const evt=n=>({addListener:fn=>{listeners[n]=fn;}});
  const chrome={storage:{local,session},tabs:{query:async()=>[tab],get:async()=>tab,create:async()=>{throw Error('must not open tab')},onUpdated:evt('updated'),onCreated:evt('created'),onRemoved:evt('removed')},
   runtime:{onMessage:evt('message'),onStartup:evt('startup'),onInstalled:evt('installed')},alarms:{create(){},onAlarm:evt('alarm')},notifications:{create(){}},
   scripting:{executeScript:async args=>[{result:args.files?null:{text:'AC',urls:[P],currentUrl:S}}]}};
  const base=path.join(__dirname,'..','oj','submit-extension');
  const ctx={chrome,URL,Date,fetch,AbortSignal,Promise,console,setTimeout,clearTimeout,setInterval:()=>0,importScripts:null};const context=vm.createContext(ctx);
  ctx.importScripts=file=>vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),context);
  vm.runInContext(fs.readFileSync(path.join(base,'worker.js'),'utf8'),context);
  await new Promise(resolve=>listeners.message({op:'pair',pin:bridge.pair().pin},{},resolve));
  await tick(120);
  assert.equal(bridge._jobs.get(id).state,'receipt');
  assert.ok(session.data.activeOJTabs['30']);
 }finally{await bridge.stop();}
});
