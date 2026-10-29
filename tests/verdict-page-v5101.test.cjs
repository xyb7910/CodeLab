'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {inspectVerdictPage}=require('../oj/submit-extension/page-inspector.js');
function node(text,links=[]){return {textContent:text,nextElementSibling:null,querySelectorAll(selector){return links.map(href=>({href}));}};}
function withPage({url,rows,extraStatuses=[]},fn){
 const oldDoc=global.document,oldLoc=global.location;
 const cells=[];for(const [key,value,link] of rows){const label=node(key);label.nextElementSibling=node(value,link?[link]:[]);cells.push(label);}
 global.location=new URL(url);global.document={querySelectorAll(selector){return selector==='th,td,dt'?cells:extraStatuses.map(x=>node(x));},querySelector(){return null;}};
 try{return fn();}finally{global.document=oldDoc;global.location=oldLoc;}
}
test('AtCoder Task + Status table reports the exact official result and task URL',()=>{
 const r=withPage({url:'https://atcoder.jp/contests/abc371/submissions/12345',rows:[['Task','A','https://atcoder.jp/contests/abc371/tasks/abc371_a'],['Status','Wrong Answer']]},inspectVerdictPage);
 assert.equal(r.text,'Wrong Answer');assert.deepEqual(r.urls,['https://atcoder.jp/contests/abc371/tasks/abc371_a']);
});
test('Codeforces submission detail reports pending and final verdicts with exact problem URL',()=>{
 const pending=withPage({url:'https://codeforces.com/contest/1976/submission/555',rows:[['Problem','B','https://codeforces.com/contest/1976/problem/B'],['Verdict','Testing']]},inspectVerdictPage);
 assert.equal(pending.text,'Testing');assert.deepEqual(pending.urls,['https://codeforces.com/contest/1976/problem/B']);
 const done=withPage({url:'https://codeforces.com/contest/1976/submission/555',rows:[['Problem','B','https://codeforces.com/contest/1976/problem/B'],['Verdict','Accepted']]},inspectVerdictPage);
 assert.equal(done.text,'Accepted');
});
test('OJ detail reader accepts extended official pending and failure statuses',()=>{
 const waiting=withPage({url:'https://atcoder.jp/contests/abc371/submissions/12345',rows:[['Task','A','https://atcoder.jp/contests/abc371/tasks/abc371_a'],['Status','Waiting for Judging']]},inspectVerdictPage);
 assert.equal(waiting.text,'Waiting for Judging');
 const failed=withPage({url:'https://codeforces.com/contest/1976/submission/555',rows:[['Problem','B','https://codeforces.com/contest/1976/problem/B'],['Verdict','Idleness Limit Exceeded']]},inspectVerdictPage);
 assert.equal(failed.text,'Idleness Limit Exceeded');
});
test('Luogu record status can be read only with a unique corresponding problem',()=>{
 const r=withPage({url:'https://www.luogu.com.cn/record/1122',rows:[['题目','P1001','https://www.luogu.com.cn/problem/P1001'],['评测状态','Accepted']]},inspectVerdictPage);
 assert.equal(r.text,'Accepted');assert.equal(r.urls.length,1);
});
test('Incomplete or ambiguous OJ page does not invent an AC',()=>{
 const result=withPage({url:'https://atcoder.jp/contests/abc371/submissions/12345',rows:[['Status','AC'],['Status','WA'],['Task','A','https://atcoder.jp/contests/abc371/tasks/abc371_a']]},inspectVerdictPage);
 assert.equal(result,null);
 const absent=withPage({url:'https://atcoder.jp/contests/abc371/submissions/12345',rows:[['Status','AC']]},inspectVerdictPage);
 assert.equal(absent,null);
});
