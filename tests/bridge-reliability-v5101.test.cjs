'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {createBrowserBridge}=require('../oj/browser-bridge.cjs');
const {store}=require('../oj/fast-submit.cjs');
const A='https://atcoder.jp/contests/abc371/tasks/abc371_a';
const B='https://atcoder.jp/contests/abc371/submissions/12345';
const OLD='chrome-extension://abcdefghijklmnopabcdefghijklmnop';
const NEW='chrome-extension://ponmlkjihgfedcbaponmlkjihgfedcba';
async function bridgeHarness(fn){const events=[],b=createBrowserBridge({port:0,onEvent:e=>events.push(e)});await b.start();
 const post=async(p,data={},token='',origin=OLD)=>{const r=await fetch(`http://127.0.0.1:${b.status().port}${p}`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(data)});return {status:r.status,body:await r.json()};};
 try{await fn({b,post,events});}finally{await b.stop();}}
test('The extension can re-pair after reinstall without deleting IDE preferences',()=>bridgeHarness(async({b,post})=>{
 const first=await post('/pair',{pin:b.pair().pin});assert.equal(first.status,200);
 assert.equal((await post('/heartbeat',{},first.body.token)).status,200);
 const newPIN=b.pair().pin;
 assert.equal((await post('/pair',{pin:'111111'},'',NEW)).status,403);
 const fresh=await post('/pair',{pin:newPIN},'',NEW);assert.equal(fresh.status,200);
 assert.notEqual(fresh.body.token,first.body.token);
 assert.equal((await post('/heartbeat',{},first.body.token,OLD)).status,403);
 assert.equal((await post('/heartbeat',{},fresh.body.token,NEW)).body.ok,true);
}));
test('Restarted watch can accept an official record before background worker reclaims it',()=>bridgeHarness(async({b,post})=>{
 const id=crypto.randomUUID();b.queueWatch({id,problemUrl:A});const token=(await post('/pair',{pin:b.pair().pin})).body.token;
 const first=await post('/event',{id,kind:'receipt',url:B},token);
 assert.equal(first.status,200);assert.equal(b._jobs.get(id).state,'receipt');
 assert.equal((await post('/event',{id,kind:'verdict',url:B,problemUrl:A,verdict:'AC'},token)).status,200);
}));
test('Failed tab creation can requeue the watch task but cannot create unlimited retries',()=>bridgeHarness(async({b,post})=>{
 const id=crypto.randomUUID();b.queueWatch({id,problemUrl:A});const token=(await post('/pair',{pin:b.pair().pin})).body.token;
 for(let i=0;i<3;i++){const j=(await post('/next',{},token)).body.job;assert.equal(j.id,id);assert.equal((await post('/retry',{id},token)).status,200);}
 assert.equal((await post('/next',{},token)).body.job.id,id);
 assert.equal((await post('/retry',{id},token)).status,429);
}));
test('Watch flag remains on persistent ledger and not accidentally on unrelated tasks',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'yanpb-watch-'));
 try{const db=store(dir);const row=await db.prepare({url:A,code:'int main(){return 0;}',fileName:'a.cpp'});
  assert.equal((await db.get(row.id)).browserWatch,undefined);
  await db.markWatching(row.id);assert.equal((await store(dir).get(row.id)).browserWatch,true);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('The bundled extension has the actual connection and verdict inspector scripts',async()=>{
 const base=path.join(__dirname,'../oj/submit-extension');
 const worker=await fs.readFile(path.join(base,'worker.js'),'utf8');
 const manifest=JSON.parse(await fs.readFile(path.join(base,'manifest.json'),'utf8'));
 assert.match(worker,/importScripts\('page-inspector\.js'\)/);
 assert.match(worker,/\/heartbeat/);assert.match(worker,/\/retry/);
 assert.ok(manifest.host_permissions.includes('http://127.0.0.1:10045/*'));
});

test('A restarted IDE restores an already linked receipt so later final verdict can arrive',()=>bridgeHarness(async({b,post})=>{
 const id=crypto.randomUUID();b.queueWatch({id,problemUrl:A,receiptUrl:B});
 assert.equal(b._jobs.get(id).state,'receipt');
 const token=(await post('/pair',{pin:b.pair().pin})).body.token;
 assert.equal((await post('/event',{id,kind:'verdict',url:B,problemUrl:A,verdict:'WA'},token)).status,200);
 assert.throws(()=>b.queueWatch({id:crypto.randomUUID(),problemUrl:A,receiptUrl:'https://atcoder.jp/contests/abc372/submissions/10'}),/比赛不匹配/);
}));
