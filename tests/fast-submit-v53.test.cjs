'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {store,parseTarget,comparable}=require('../oj/fast-submit.cjs');
const code='#include <bits/stdc++.h>\nint main(){return 0;}\n';
async function withStore(task){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'yanpb-fast-test-'));try{return await task(store(dir),dir);}finally{await fs.rm(dir,{recursive:true,force:true});}}
test('Fast OJ target routing rejects unsupported links and preserves contest problem',()=>{
 assert.deepEqual(['codeforces','1976/B'],[parseTarget('https://codeforces.com/contest/1976/problem/B').platform,parseTarget('https://codeforces.com/contest/1976/problem/B').problemId]);
 assert.equal(parseTarget('https://atcoder.jp/contests/abc371/tasks/abc371_c').contestId,'abc371');
 assert.equal(parseTarget('https://www.luogu.com.cn/problem/P1001').problemId,'P1001');
 assert.throws(()=>parseTarget('https://evil.test/problem/1'));
});
test('Fast preparation freezes source, avoids accidental duplicates and survives reload',()=>withStore(async(s,dir)=>{
 const meta={url:'https://codeforces.com/contest/1976/problem/B',code,fileName:'B.cpp',fileKey:'C:\\work\\B.cpp'};
 const first=await s.prepare(meta);assert.equal(first.state,'prepared');assert.ok(!('code' in first));
 assert.equal(await s.readSource(first.id),code);
 const duplicate=await s.prepare(meta);assert.equal(duplicate.id,first.id);assert.equal(duplicate.duplicate,true);
 const second=await s.prepare({...meta,overrideDuplicate:true});assert.notEqual(second.id,first.id);
 const reopened=store(dir);assert.equal((await reopened.list()).length,2);
 assert.equal((await reopened.readSource(second.id)),code);
}));
test('Receipt validation prevents cross-platform, cross-contest and no-record false success',()=>withStore(async s=>{
 const x=await s.prepare({url:'https://codeforces.com/contest/1976/problem/B',code});
 await assert.rejects(()=>s.linkReceipt(x.id,'https://atcoder.jp/contests/abc371/submissions/55'));
 await assert.rejects(()=>s.linkReceipt(x.id,'https://codeforces.com/contest/1980/submission/999'));
 const r=await s.linkReceipt(x.id,'https://codeforces.com/contest/1976/submission/999');assert.equal(r.state,'receipt_pending');
 await assert.rejects(()=>s.applyVerdict(x.id,{confirmed:true,platform:'codeforces',id:'888',problem:'B',verdict:'AC'}));
 const wrong=await s.applyVerdict(x.id,{confirmed:true,platform:'codeforces',id:'999',problem:'A',contestId:1976,verdict:'AC'});
 assert.equal(wrong.officialVerified,false);assert.equal(wrong.state,'unverified');
 const ok=await s.applyVerdict(x.id,{confirmed:true,platform:'codeforces',id:'999',problem:'B',contestId:1976,verdict:'AC'});
 assert.equal(ok.officialVerified,true);assert.equal(ok.state,'verified');
}));
test('AtCoder and Luogu detail page statuses are not automatically attributed to a problem',()=>withStore(async s=>{
 for(const [url,receipt,p] of [
  ['https://atcoder.jp/contests/abc371/tasks/abc371_c','https://atcoder.jp/contests/abc371/submissions/22','atcoder'],
  ['https://www.luogu.com.cn/problem/P1001','https://www.luogu.com.cn/record/333','luogu']]){
  const x=await s.prepare({url,code});await s.linkReceipt(x.id,receipt);const a=await s.applyVerdict(x.id,{confirmed:true,platform:p,id:p==='atcoder'?'22':'333',verdict:'AC'});
  assert.equal(a.officialVerified,false);assert.equal(a.state,'unverified');
 }
}));
test('Fast submit static checks reject empty source, suspicious URL and no main',()=>withStore(async s=>{
 for(const c of ['', 'int foo(){}'])await assert.rejects(()=>s.prepare({url:'https://codeforces.com/contest/1976/problem/B',code:c}));
 await assert.rejects(()=>s.prepare({url:'https://evil.example/contest/1976/problem/B',code}));
}));
test('Codeforces judged status remains judging until an actual verdict is returned',()=>withStore(async s=>{
 const x=await s.prepare({url:'https://codeforces.com/contest/1976/problem/B',code});await s.markFilled(x.id,true);await s.linkReceipt(x.id,'https://codeforces.com/contest/1976/submission/999');
 const y=await s.applyVerdict(x.id,{confirmed:true,platform:'codeforces',id:'999',contestId:1976,problem:'B',verdict:'PENDING'});
 assert.equal(y.state,'judging');assert.equal(y.officialVerified,false);
}));
test('Codeforces testset cannot be mistaken for a final verdict',()=>{
 const {readCodeforcesRecord}=require('../oj/official-session.cjs');
 const r=readCodeforcesRecord({status:'OK',result:[{id:12,contestId:19,testset:'TESTS',problem:{index:'A'}}]},12,19);
 assert.equal(r.verdict,'PENDING');
});
test('Official form click is only in the guarded one-click path',()=>{
 const fs=require('node:fs');const path=require('node:path');
 const file=fs.readFileSync(path.join(__dirname,'../oj/official-browser.cjs'),'utf8');
 assert.match(file,/autoFillPending/);
 assert.match(file,/submittedProblemIndex/);
 assert.match(file,/TaskScreenName/);
 assert.match(file,/guardedSubmitScript/);
 assert.match(file,/captcha-required/);
 assert.match(file,/task-unverified/);
 assert.match(file,/cpp17-language-unavailable/);
});

test('Repeated navigation to the same official detail never loses verified state',()=>withStore(async s=>{
 const x=await s.prepare({url:'https://codeforces.com/contest/1976/problem/B',code});
 const url='https://codeforces.com/contest/1976/submission/999';await s.linkReceipt(x.id,url);
 await s.applyVerdict(x.id,{confirmed:true,platform:'codeforces',id:'999',contestId:1976,problem:'B',verdict:'AC'});
 const after=await s.linkReceipt(x.id,url);assert.equal(after.state,'verified');assert.equal(after.officialVerified,true);
}));
