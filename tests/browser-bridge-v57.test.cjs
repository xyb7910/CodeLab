'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');
const {createBrowserBridge}=require('../oj/browser-bridge.cjs');
const EXT='chrome-extension://abcdefghijklmnopabcdefghijklmnop';
const CF='https://codeforces.com/contest/1976/problem/B';
const A='https://atcoder.jp/contests/abc371/tasks/abc371_c';
async function setup(fn){const received=[];const b=createBrowserBridge({port:0,onEvent:async event=>received.push(event)});await b.start();const port=b.status().port;
 const req=async(path,body={},token='',origin=EXT)=>{const response=await fetch(`http://127.0.0.1:${port}${path}`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});return {status:response.status,body:await response.json()};};
 try{return await fn({b,req,received});}finally{await b.stop();}}
test('Browser pairing blocks arbitrary websites and requires a one-time PIN',()=>setup(async({b,req})=>{
 const pairing=b.pair();assert.match(pairing.pin,/^\d{6}$/);
 const fromWeb=await req('/pair',{pin:pairing.pin},'','https://attacker.example');assert.equal(fromWeb.status,403);
 const wrong=await req('/pair',{pin:'000000'});assert.equal(wrong.status,403);
 const ok=await req('/pair',{pin:pairing.pin});assert.equal(ok.status,200);assert.match(ok.body.token,/^[a-f0-9]{64}$/);
 assert.equal((await req('/pair',{pin:pairing.pin})).status,403);
 assert.equal((await req('/next',{})).status,401);
 assert.equal((await req('/next',{},ok.body.token)).status,200);
}));
test('A frozen source is delivered only once to the paired browser',()=>setup(async({b,req,received})=>{
 const token=(await req('/pair',{pin:b.pair().pin})).body.token;
 const id=crypto.randomUUID();const task=b.queue({id,problemUrl:CF,code:'int main(){}',oneClick:true});assert.equal(task.queued,true);
 const next=(await req('/next',{},token)).body.job;assert.equal(next.id,id);assert.equal(next.platform,'codeforces');assert.equal(next.problemId,'1976/B');assert.equal(next.code,'int main(){}');assert.equal(next.oneClick,true);
 assert.equal((await req('/next',{},token)).body.job,null);
 const mismatched=await req('/event',{id,kind:'receipt',url:'https://codeforces.com/contest/999/submission/111'},token);assert.equal(mismatched.status,403);
 const good=await req('/event',{id,kind:'receipt',url:'https://codeforces.com/contest/1976/submission/555'},token);assert.equal(good.status,200);
 assert.equal(received[0].kind,'receipt');assert.equal(received[0].url,'https://codeforces.com/contest/1976/submission/555');
 assert.equal((await req('/event',{id,kind:'blocked'},token)).status,409);
}));
test('AtCoder accepts only same-contest official record; other origins cannot access jobs',()=>setup(async({b,req})=>{
 const token=(await req('/pair',{pin:b.pair().pin})).body.token;
 const id=crypto.randomUUID();b.queue({id,problemUrl:A,code:'int main(){}'});
 assert.equal((await req('/next',{},token,'https://evil.example')).status,403);
 assert.equal((await req('/next',{},token)).body.job.platform,'atcoder');
 assert.equal((await req('/event',{id,kind:'receipt',url:'https://atcoder.jp/contests/abc370/submissions/123'},token)).status,403);
 assert.equal((await req('/event',{id,kind:'receipt',url:'https://atcoder.jp/contests/abc371/submissions/123'},token)).status,200);
}));
test('Unauthenticated or unapproved jobs cannot expose source',()=>setup(async({b,req})=>{
 const token=(await req('/pair',{pin:b.pair().pin})).body.token;
 assert.throws(()=>b.queue({id:crypto.randomUUID(),problemUrl:'https://attacker.example',code:'secret'}),/不支持/);
 b.queue({id:crypto.randomUUID(),problemUrl:CF,code:'int main(){}'});
 assert.equal((await req('/next',{},'a'.repeat(64))).status,401);
 assert.equal(b.status().pending,1);
 assert.equal((await req('/next',{},token)).status,200);
}));
test('Build bundles the browser extension and replaces embedded submit windows',()=>{
 const fs=require('node:fs'),p=require('node:path');const pkg=require('../package.json');
 assert.equal(pkg.version,'5.10.7');assert.ok(pkg.build.extraResources.some(x=>x.from==='oj/submit-extension'));
 const app=fs.readFileSync(p.join(__dirname,'../renderer/app.js'),'utf8');
 assert.match(app,/async function prepareOfficialSubmission\(\)\{return openBrowserSubmission\(\);\}/);
 assert.doesNotMatch(app,/id="ojOpenEmbedded"/);
 const main=fs.readFileSync(p.join(__dirname,'../electron/main.cjs'),'utf8');
 assert.match(main,/setupOJBridge/);assert.match(main,/delivery:'browser-extension'/);
});
test('AtCoder official verdict must match an already-linked ID and exact task URL',()=>setup(async({b,req,received})=>{
 const token=(await req('/pair',{pin:b.pair().pin})).body.token;
 const id=crypto.randomUUID();b.queue({id,problemUrl:A,code:'int main(){}'});
 await req('/next',{},token);
 const receipt='https://atcoder.jp/contests/abc371/submissions/5678';
 assert.equal((await req('/event',{id,kind:'verdict',url:receipt,problemUrl:A,verdict:'AC'},token)).status,409);
 assert.equal((await req('/event',{id,kind:'receipt',url:receipt},token)).status,200);
 const wrong=await req('/event',{id,kind:'verdict',url:receipt,problemUrl:'https://atcoder.jp/contests/abc371/tasks/abc371_b',verdict:'AC'},token);assert.equal(wrong.status,403);
 const right=await req('/event',{id,kind:'verdict',url:receipt,problemUrl:A,verdict:'Accepted'},token);assert.equal(right.status,200);
 assert.equal(received.at(-1).kind,'verdict');assert.equal(received.at(-1).problemUrl,A);
}));
