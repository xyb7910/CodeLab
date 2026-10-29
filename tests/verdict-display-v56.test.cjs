'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const js=fs.readFileSync(path.join(__dirname,'../renderer/app.js'),'utf8');
const start=js.indexOf('function officialVerdictPresentation('),end=js.indexOf('function renderOfficialVerdictHero(',start);
assert.ok(start>=0&&end>start);
const fn=vm.runInNewContext(js.slice(start,end)+'\nofficialVerdictPresentation',{}, {timeout:1000});
test('Only validated official AC renders as a green AC card',()=>{const ok=fn({officialVerified:true,verdict:'AC'});assert.equal(ok.verdict,'AC');assert.equal(ok.tone,'success');assert.equal(fn({officialVerified:false,verdict:'AC'}).verdict,'UNVERIFIED');});
test('Official WA/TLE/RE and CE render conspicuous error cards',()=>{for(const v of ['WA','TLE','RE','CE']){const r=fn({officialVerified:true,verdict:v});assert.equal(r.verdict,v);assert.equal(r.tone,'danger');}});
test('Extended official errors and partial results remain visible',()=>{for(const v of ['IE','IDLENESS','REJECTED'])assert.equal(fn({officialVerified:true,verdict:v}).tone,'danger');assert.equal(fn({officialVerified:true,verdict:'PARTIAL'}).verdict,'PARTIAL');});
test('Matching official pending verdict is not shown as AC',()=>{const result=fn({state:'judging',officialVerified:false,confidence:'official-api-problem-matched',receipt:{id:'1'},verdict:'PENDING'});assert.equal(result.verdict,'JUDGING');assert.equal(result.tone,'pending');});
const noticeStart=js.indexOf('function browserResultPresentation('),noticeEnd=js.indexOf('function showBrowserResultNotice(',noticeStart);
assert.ok(noticeStart>=0&&noticeEnd>noticeStart);
const notice=vm.runInNewContext(js.slice(noticeStart,noticeEnd)+'\nbrowserResultPresentation',{}, {timeout:1000});
test('Verified AC offers next problem while errors ask for a correction',()=>{
 const ac=notice({officialVerified:true,state:'verified',verdict:'AC'});assert.equal(ac.canAdvance,true);assert.equal(ac.reminder,'');
 for(const verdict of ['WA','TLE','MLE','RE','CE','IE']){const failed=notice({officialVerified:true,state:'verified',verdict});assert.equal(failed.canAdvance,false);assert.match(failed.reminder,/修改代码/);}
});
test('Official verdict notice automatically closes after two seconds',()=>{assert.match(js,/browserResultNoticeTimer=setTimeout\(\(\)=>el\.classList\.add\('hidden'\),2000\)/);});
