'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const api=require('../oj/official-session.cjs');
const browserFile=fs.readFileSync(path.join(__dirname,'../oj/official-browser.cjs'),'utf8');
test('Only exact HTTPS official hostnames allowed',()=>{
 for(const [p,url] of [['codeforces','https://codeforces.com/contest/111/submit'],['atcoder','https://atcoder.jp/contests/abc371/submit'],['luogu','https://www.luogu.com.cn/problem/P1001']])assert.equal(api.officialHost(p,url),true);
 for(const url of ['http://codeforces.com','https://codeforces.com.evil.org','https://evil.org','https://user:pass@codeforces.com/contest/111/submit','https://codeforces.com:444/'])assert.equal(api.officialHost('codeforces',url),false);
});
test('Official submission detail URLs must be exact platform patterns',()=>{
 const cf=api.asOfficialLink('codeforces','https://codeforces.com/contest/1976/submission/286123111');assert.deepEqual({id:cf.id,contestId:cf.contestId},{id:'286123111',contestId:1976});
 assert.equal(api.asOfficialLink('atcoder','https://atcoder.jp/contests/abc371/submissions/99999999').id,'99999999');
 assert.equal(api.asOfficialLink('luogu','https://www.luogu.com.cn/record/888999').id,'888999');
 assert.throws(()=>api.asOfficialLink('atcoder','https://atcoder.jp/contests/abc371/submit'));
 assert.throws(()=>api.asOfficialLink('codeforces','https://atcoder.jp/contests/a/submissions/1'));
});
test('Official verdict parsing never treats absent text as accepted',()=>{
 for(const empty of [null,'','Contest Problems','Submission detail'])assert.equal(api.normalizeOfficialStatus(empty),null);
 assert.equal(api.normalizeOfficialStatus('Wrong Answer'),'WA');assert.equal(api.normalizeOfficialStatus('Accepted'),'AC');assert.equal(api.normalizeOfficialStatus('Waiting'),'PENDING');
 assert.equal(api.normalizeOfficialStatus('Waiting for Judging'),'PENDING');assert.equal(api.normalizeOfficialStatus('Internal Error'),'IE');assert.equal(api.normalizeOfficialStatus('Idleness Limit Exceeded'),'IDLENESS');
});
test('Codeforces official API record must match exact submission ID and contest ID',()=>{
 const res={status:'OK',result:[{id:987,contestId:371,verdict:'OK',problem:{index:'B'},passedTestCount:42,timeConsumedMillis:17,memoryConsumedBytes:999999}]};
 assert.equal(api.readCodeforcesRecord(res,'987',371).verdict,'AC');
 assert.equal(api.readCodeforcesRecord(res,'988',371),null);
 assert.equal(api.readCodeforcesRecord(res,'987',123),null);
});
test('Codeforces query sends only public handle; never passwords or cookies',async()=>{
 const seen=[];const fake=async(url,opts)=>{seen.push({url,opts});return {ok:true,json:async()=>({status:'OK',result:[{id:123,contestId:1976,verdict:'WRONG_ANSWER'}]})};};
 const out=await api.pollCodeforces('contestUser',{platform:'codeforces',id:'123',contestId:1976},fake);
 assert.equal(out.verdict,'WA');assert.match(seen[0].url,/user\.status\?handle=contestUser/);assert.doesNotMatch(JSON.stringify(seen),/cookie|password|apiKey/i);
 await assert.rejects(()=>api.pollCodeforces('bad handle',{platform:'codeforces',id:'123'},fake));
});
test('Browser only attempts an official click behind user-directed one-click guards; never reads credentials',()=>{
 assert.match(browserFile,/nodeIntegration:false/);assert.match(browserFile,/contextIsolation:true/);assert.match(browserFile,/sandbox:true/);
 assert.doesNotMatch(browserFile,/document\.cookie|password\.value/);
 assert.match(browserFile,/guardedSubmitScript/);
 assert.match(browserFile,/captcha-required/);
 assert.match(browserFile,/oneClickPending/);
 assert.doesNotMatch(browserFile,/document\.cookie|password\.value/);
 assert.match(browserFile,/fillSource/);
});
test('Electron bridge packages official adapters and no longer needs extension pairing',()=>{
 const pkg=require('../package.json');assert.equal(pkg.version,'5.10.9');assert.ok(pkg.build.files.includes('oj/*.cjs'));
 assert.ok(!pkg.build.extraResources.some(x=>x.to==='oj-browser-extension'));
 const main=fs.readFileSync(path.join(__dirname,'../electron/main.cjs'),'utf8');assert.match(main,/local:ojOpenInApp/);assert.match(main,/local:ojPollCodeforces/);assert.doesNotMatch(main,/local:ojPrepare/);
});
