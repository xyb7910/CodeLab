'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const c=require('../contest/competition.cjs');
const runner=require('../runner/local-runner.cjs');
const {normalizeLineEndings}=require('./test-utils.cjs');
async function temp(fn){const p=await fs.mkdtemp(path.join(os.tmpdir(),'yanpb-test-contest-'));try{return await fn(p);}finally{await fs.rm(p,{recursive:true,force:true});}}
function sample(){return [{name:'case 1',input:'7\n',expected:'14\n'},{name:'case 2',input:'8\n',expected:'16\n'}];}
test('platform presets cover CF AtCoder Luogu ICPC CSP and custom',()=>{for(const x of ['codeforces','atcoder','luogu','icpc','cspj','csps','custom'])assert.ok(c.PRESETS[x]);});
test('reject directory traversal, reserved names, duplicates',()=>{for(const name of ['../other','', 'a/b','CON','a\\b'])assert.throws(()=>c.validateOptions({platform:'custom',contestName:name,tasks:['A']}));assert.throws(()=>c.validateOptions({contestName:'round',tasks:['A','a']}));});
test('create independent CF contest with ABC cpp in a directory',async()=>temp(async p=>{const m=await c.createContest(p,{platform:'codeforces',contestName:'CF_1100',tasks:['A','B','C']});assert.deepEqual(m.files.map(x=>x.relative),['A.cpp','B.cpp','C.cpp']);assert.match(await fs.readFile(m.files[0].source,'utf8'),/main/);const reopened=await c.openContest(m.folder);assert.equal(reopened.platform,'codeforces');await assert.rejects(()=>c.createContest(p,{platform:'codeforces',contestName:'CF_1100',tasks:['A']}),{code:'EEXIST'});}));
test('CSP directories are candidate/task/task.cpp with actual freopen',async()=>temp(async p=>{const m=await c.createContest(p,{platform:'cspj',contestName:'CSPJ_mock',candidateId:'SN-J0001',tasks:['apple','pear']});assert.equal(m.files[0].relative,path.join('apple','apple.cpp'));assert.equal(path.basename(m.submissionDir),'SN-J0001');const x=await c.auditSubmission(m);assert.equal(x.passed,true);assert.match(x.reports[0].code,/freopen\("apple.in"/);}));
test('missing freopen, commented-out freopen and dangerous Windows code detected',()=>{const m={io:'file',maxSourceBytes:1024};const s='int main(){ // freopen("apple.in","r",stdin)\n/*freopen("apple.out","w",stdout);*/__int64 x;return 0;}';const checks=c.checkCode(s,'apple',m);assert.equal(checks.find(x=>x.id==='file-input').ok,false);assert.equal(checks.find(x=>x.id==='file-output').ok,false);assert.equal(checks.find(x=>x.id==='windows-portability').ok,false);});
test('CSP submission audit identifies extra files and missing source',async()=>temp(async p=>{const m=await c.createContest(p,{platform:'cspj',contestName:'Mock',candidateId:'GD-J001',tasks:['apple']});await fs.writeFile(path.join(m.submissionDir,'apple','solution.exe'),'junk');let x=await c.auditSubmission(m);assert.equal(x.reports[0].checks.find(v=>v.id==='extra-files').ok,false);await fs.rm(m.files[0].source);x=await c.auditSubmission(m);assert.equal(x.passed,false);}));
test('CSP file IO checks real .out, not stdout, for sample judging',async(t)=>temp(async p=>{const found=await runner.detectCompilers();if(!found.length){t.skip('g++ is absent');return;}const m=await c.createContest(p,{platform:'cspj',contestName:'Mock',candidateId:'GD-J001',tasks:['apple']});const code='#include <bits/stdc++.h>\nusing namespace std;int main(){freopen("apple.in","r",stdin);freopen("apple.out","w",stdout);int x;cin>>x;cout<<x*2<<"\\n";}';await fs.writeFile(m.files[0].source,code);const r=await c.verifySubmission(m,'apple',sample());assert.equal(r.status,'OK');assert.deepEqual(r.results.map(x=>normalizeLineEndings(x.output)),['14\n','16\n']);}));
test('CSP file IO reports NO_OUTPUT if only stdout used',async(t)=>temp(async p=>{const found=await runner.detectCompilers();if(!found.length){t.skip('g++ is absent');return;}const m=await c.createContest(p,{platform:'csps',contestName:'Mock',candidateId:'GD-S001',tasks:['pear']});await fs.writeFile(m.files[0].source,'#include <iostream>\nint main(){std::cout<<14<<"\\n";}');const r=await c.verifySubmission(m,'pear',[{input:'7\n',expected:'14\n'}]);assert.equal(r.results[0].status,'NO_OUTPUT');}));

test('ifstream/ofstream are valid file I/O alternatives; comments alone never count',()=>{
 const m={io:'file',maxSourceBytes:1024};
 const good='#include <fstream>\nint main(){std::ifstream fin("apple.in");std::ofstream fout("apple.out");int x;fin>>x;fout<<x;}';
 const res=c.checkCode(good,'apple',m);
 assert.equal(res.find(x=>x.id==='file-input').ok,true);assert.equal(res.find(x=>x.id==='file-output').ok,true);
 const bad=c.checkCode('// freopen("apple.in","r",stdin)\nint main(){}','apple',m);
 assert.equal(bad.find(x=>x.id==='file-input').ok,false);
});
test('DO NOT mark unimplemented source templates as ready',()=>{const cfg={io:'file',maxSourceBytes:1024};const list=c.checkCode(c.sourceTemplate('apple',cfg),'apple',cfg);assert.equal(list.find(x=>x.id==='unfinished-template').ok,false);});

test('2026 provincial-style upload uses flat per-task sources rather than candidate folders',async()=>temp(async p=>{const m=await c.createContest(p,{platform:'cspj',contestName:'LiaoningMock',submissionMethod:'upload',tasks:['apple','pear']});assert.equal(m.submissionMethod,'upload');assert.equal(m.candidateId,'');assert.equal(m.files[0].relative,'apple.cpp');const a=await c.auditSubmission(m);assert.deepEqual(a.extraRoot,[]);assert.equal(a.passed,true);}));
