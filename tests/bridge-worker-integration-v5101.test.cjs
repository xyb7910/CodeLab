'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createBrowserBridge}=require('../oj/browser-bridge.cjs');
function mockStorage(){const data={};return {data,async get(keys){if(typeof keys==='string')return {[keys]:data[keys]};if(Array.isArray(keys))return Object.fromEntries(keys.map(k=>[k,data[k]]));return data;},async set(values){Object.assign(data,values);}};}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
test('Chrome MV3 background can pair, WATCH existing submit tab, and return official ID without opening a duplicate tab',async()=>{
 const events=[];const bridge=createBrowserBridge({port:10045,onEvent:event=>events.push(event)});
 // Port 10045 is the production fixed port; skip if used by another process.
 try{await bridge.start();}catch(e){if(e.code==='EADDRINUSE')return;throw e;}
 try{
  const id=crypto.randomUUID();bridge.queueWatch({id,problemUrl:'https://atcoder.jp/contests/abc371/tasks/abc371_a'});
  const local=mockStorage(),session=mockStorage(),listeners={};let created=0;
  function event(name){return {addListener:fn=>{listeners[name]=fn;}};}
  const chrome={
    storage:{local,session},tabs:{query:async()=>[],get:async tabId=>({id:tabId,status:'complete'}),create:async()=>{created++;throw Error('watch task must NOT create a browser tab');},
      onUpdated:event('updated'),onCreated:event('created'),onRemoved:event('removed')},
    runtime:{onMessage:event('message'),onStartup:event('startup'),onInstalled:event('installed')},
    alarms:{create:()=>{},onAlarm:event('alarm')},
    notifications:{create:()=>{}},scripting:{executeScript:async()=>[{result:{text:'WA',urls:['https://atcoder.jp/contests/abc371/tasks/abc371_a'],currentUrl:'https://atcoder.jp/contests/abc371/submissions/112233'}}]}
  };
  const dir=path.join(__dirname,'../oj/submit-extension');
  const sandbox={chrome,URL,Date,fetch,AbortSignal,console,Promise,setInterval:()=>1,setTimeout,clearTimeout,importScripts:()=>{}};
  const context=vm.createContext(sandbox);
  sandbox.importScripts=(file)=>vm.runInContext(fs.readFileSync(path.join(dir,file),'utf8'),context,{filename:file});
  vm.runInContext(fs.readFileSync(path.join(dir,'worker.js'),'utf8'),context,{filename:'worker.js'});
  const pair=b=>new Promise(resolve=>listeners.message({op:'pair',pin:b},null,resolve));
  const response=await pair(bridge.pair().pin);
  assert.equal(response.paired,true);await sleep(100);
  assert.equal(created,0,'Result watcher must not open a second tab');
  assert.ok(Object.keys(session.data.pendingOJWatches||{}).includes(id));
  listeners.updated(17,{url:'https://atcoder.jp/contests/abc371/submit'},{id:17,status:'loading',url:'https://atcoder.jp/contests/abc371/submit'});
  await sleep(100);
  assert.equal((session.data.activeOJTabs||{})['17'].jobId,id);
  listeners.updated(17,{url:'https://atcoder.jp/contests/abc371/submissions/112233'},{id:17,status:'loading',url:'https://atcoder.jp/contests/abc371/submissions/112233'});
  await sleep(150);
  assert.ok(events.some(x=>x.kind==='receipt'&&x.id===id&&x.url.endsWith('/112233')));
  listeners.updated(17,{status:'complete'},{id:17,status:'complete',url:'https://atcoder.jp/contests/abc371/submissions/112233'});
  await sleep(100);
  assert.ok(events.some(x=>x.kind==='verdict'&&x.id===id&&x.verdict==='WA'),'official WA should travel back through authenticated bridge');
 }finally{await bridge.stop();}
});
