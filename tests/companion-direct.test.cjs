'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {taskIdentity,matchContestFile,lookupExistingFile}=require('../cph/linkage.cjs');
const {createInbox}=require('../cph/inbox.cjs');
const {createReceiver}=require('../cph/receiver.cjs');
test('Codeforces contest, gym, problemset URL derive stable task identifiers',()=>{
 for(const url of ['https://codeforces.com/contest/2040/problem/B','https://codeforces.com/problemset/problem/2040/B','https://codeforces.com/gym/2040/problem/B']){
  const i=taskIdentity({url});assert.equal(i.key,'cf:2040:B');assert.equal(i.task,'B');
 }
});
test('AtCoder and Luogu URL matching identifies task names',()=>{
 assert.deepEqual([taskIdentity({url:'https://atcoder.jp/contests/abc405/tasks/abc405_c'}).task,taskIdentity({url:'https://www.luogu.com.cn/problem/P1000'}).task],['C','P1000']);
});
test('Contest source file association requires verified contest identity',()=>{
 const p={url:'https://codeforces.com/contest/2040/problem/B'};
 const good={platform:'codeforces',contestName:'CF_2040',files:[{task:'B',source:'B.cpp'}]};
 assert.equal(matchContestFile(p,good).source,'B.cpp');
 assert.equal(matchContestFile(p,{...good,contestName:'CF_2041'}),null);
 assert.equal(matchContestFile(p,{...good,contestName:'Contest_001'}),null);
});
test('Repeated same-url imports map to existing file, independent of display name',()=>{
 const p={url:'https://codeforces.com/contest/2040/problem/B'};
 const files=[{name:'B.cpp',problemInfo:{cphKey:'cf:2040:B'}}];
 assert.equal(lookupExistingFile(p,files),files[0]);
});
test('IPC inbox survives missing renderer, requires per-item ack, and is bounded',()=>{
 const q=createInbox(2);let x=q.push({name:'A'});q.push({name:'B'});q.push({name:'C'});
 assert.deepEqual(q.pending().map(x=>x.name),['B','C']);assert.equal(q.ack(x.deliveryId),false);
 const id=q.pending()[0].deliveryId;assert.equal(q.ack(id),true);assert.equal(q.size,1);
});
test('Companion POST with extension origin accepts a task and no-sample task',async()=>{
 const got=[],s=createReceiver(p=>{got.push(p);},0);const port=await s.start();
 try{
  const url=`http://127.0.0.1:${port}/`;
  for(const tests of [[],[{input:'1\n',output:'2\n'}]]){
   const r=await fetch(url,{method:'POST',headers:{origin:'chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef','content-type':'application/json'},body:JSON.stringify({name:'C',url:'https://atcoder.jp/contests/abc405/tasks/abc405_c',tests})});
   assert.equal(r.status,200);
  }
  assert.equal(got.length,2);
  const blocked=await fetch(url,{method:'POST',headers:{origin:'https://evil.example'},body:'{}'});assert.equal(blocked.status,403);
 }finally{await s.stop();}
});
