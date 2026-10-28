'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const js=fs.readFileSync(path.join(__dirname,'../renderer/app.js'),'utf8');
const start=js.indexOf('function officialVerdictPresentation('),end=js.indexOf('function renderOfficialVerdictHero(',start);
assert.ok(start>=0&&end>start);
const fn=vm.runInNewContext(js.slice(start,end)+'\nofficialVerdictPresentation',{}, {timeout:1000});
test('Only validated official AC renders as a green AC card',()=>{const ok=fn({officialVerified:true,verdict:'AC'});assert.equal(ok.verdict,'AC');assert.equal(ok.tone,'success');assert.equal(fn({officialVerified:false,verdict:'AC'}).verdict,'UNVERIFIED');});
test('Official WA/TLE/RE and CE render conspicuous error cards',()=>{for(const v of ['WA','TLE','RE','CE']){const r=fn({officialVerified:true,verdict:v});assert.equal(r.verdict,v);assert.equal(r.tone,'danger');}});
test('Matching official pending verdict is not shown as AC',()=>{const result=fn({state:'judging',officialVerified:false,confidence:'official-api-problem-matched',receipt:{id:'1'},verdict:'PENDING'});assert.equal(result.verdict,'JUDGING');assert.equal(result.tone,'pending');});
