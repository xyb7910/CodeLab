'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {store}=require('../oj/fast-submit.cjs');
const {decideAutoReceipt,validateDetected,problemFromURL,submissionCandidatesScript}=require('../oj/submission-detector.cjs');
const code='#include <bits/stdc++.h>\nint main(){return 0;}';
const cf='https://codeforces.com/contest/1976/submission/112233';
async function fresh(fn){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'yanpb-id-v54-'));try{return await fn(store(dir));}finally{await fs.rm(dir,{recursive:true,force:true});}}
test('Recognizes exact Codeforces, AtCoder, Luogu official records and problem link identities',()=>{
 assert.equal(problemFromURL('codeforces','https://codeforces.com/contest/1976/problem/B'),'B');
 assert.equal(problemFromURL('atcoder','https://atcoder.jp/contests/abc371/tasks/abc371_c'),'abc371_c');
 assert.equal(problemFromURL('luogu','https://www.luogu.com.cn/problem/P1001'),'P1001');
 assert.equal(problemFromURL('luogu','https://untrusted.site/problem/P1001'),null);
});
test('Auto detection is provisional after source fill and only for a single same-contest record',()=>fresh(async s=>{
 const x=await s.prepare({url:'https://codeforces.com/contest/1976/problem/B',code});
 let r=await s.detectReceipts(x.id,[{url:cf,source:'detail'}]);assert.equal(r.receipt,null);assert.equal(r.detectedCandidates.length,1);
 await s.markFilled(x.id,true);
 r=await s.detectReceipts(x.id,[{url:cf,source:'detail'}]);assert.equal(r.receipt.id,'112233');assert.equal(r.state,'receipt_pending');assert.equal(r.officialVerified,false);
 const again=await s.detectReceipts(x.id,[{url:cf,source:'detail'}]);assert.equal(again.receipt.id,'112233');
}));
test('Wrong contest, wrong problem, foreign host, ambiguous IDs do not autolink',()=>fresh(async s=>{
 const x=await s.prepare({url:'https://codeforces.com/contest/1976/problem/B',code});await s.markFilled(x.id,true);
 const candidates=[{url:cf,problemUrl:'https://codeforces.com/contest/1976/problem/A'},{url:'https://codeforces.com/contest/1980/submission/999'},{url:'https://evil.com/contest/1976/submission/44'}];
 let r=await s.detectReceipts(x.id,candidates);assert.equal(r.receipt,null);assert.equal(r.detectedCandidates.length,0);
 r=await s.detectReceipts(x.id,[{url:cf,problemId:'B',source:'detail'},{url:'https://codeforces.com/contest/1976/submission/2222',problemId:'B',source:'detail'}]);
 assert.equal(r.receipt,null);assert.equal(r.detectedCandidates.length,2);assert.equal(r.detectionReason,'ambiguous-multiple-records');
}));
test('AtCoder and Luogu need exact problem identity, not just a detail URL',()=>fresh(async s=>{
 const a=await s.prepare({url:'https://atcoder.jp/contests/abc371/tasks/abc371_c',code});await s.markFilled(a.id,true);
 let r=await s.detectReceipts(a.id,[{url:'https://atcoder.jp/contests/abc371/submissions/111',source:'detail'}]);assert.equal(r.receipt,null);
 r=await s.detectReceipts(a.id,[{url:'https://atcoder.jp/contests/abc371/submissions/111',problemId:'abc371_c',source:'detail'}]);assert.equal(r.receipt.id,'111');
 const b=await s.prepare({url:'https://www.luogu.com.cn/problem/P1001',code});await s.markFilled(b.id,true);
 r=await s.detectReceipts(b.id,[{url:'https://www.luogu.com.cn/record/4455',problemId:'P1002',source:'detail'}]);assert.equal(r.receipt,null);
 r=await s.detectReceipts(b.id,[{url:'https://www.luogu.com.cn/record/4455',problemId:'P1001',source:'detail'}]);assert.equal(r.receipt.id,'4455');
}));
test('Official AtCoder/Luogu verdict is verified only with matching detail problem',()=>fresh(async s=>{
 const x=await s.prepare({url:'https://atcoder.jp/contests/abc371/tasks/abc371_c',code});await s.linkReceipt(x.id,'https://atcoder.jp/contests/abc371/submissions/101');
 let r=await s.applyVerdict(x.id,{platform:'atcoder',id:'101',confirmed:true,problemId:'abc371_a',verdict:'AC'});assert.equal(r.officialVerified,false);
 r=await s.applyVerdict(x.id,{platform:'atcoder',id:'101',confirmed:true,problemId:'abc371_c',verdict:'AC'});assert.equal(r.officialVerified,true);
}));
test('Expired or idle prepared task cannot auto-claim arbitrary record',()=>{
 const x={platform:'codeforces',contestId:'1976',index:'B',problemId:'1976/B',state:'form_filled',createdAt:Date.now()-40*60000};
 const d=decideAutoReceipt(x,[{url:cf,source:'detail'}]);assert.equal(d.status,'suggested');assert.equal(d.reason,'not-recent-filled-task');
});
test('Submission list extractor never fetches credentials, automatically submits or guesses results',()=>{
 const script=submissionCandidatesScript('codeforces');assert.doesNotMatch(script,/\.submit\(|\.requestSubmit\(|\.fetch\(|cookie|localStorage/);
 assert.match(script,/submission/);
});

test('Listing page IDs remain suggestions even when only one task-matching row exists',()=>{
 const row={platform:'codeforces',contestId:'1976',problemId:'1976/B',index:'B',state:'form_filled',createdAt:Date.now()};
 const d=decideAutoReceipt(row,[{url:cf,problemId:'B',source:'list'}]);
 assert.equal(d.status,'suggested');assert.equal(d.reason,'list-needs-confirmation');assert.equal(d.candidates[0].id,'112233');
});
