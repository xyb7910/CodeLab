'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs/promises');const os=require('node:os');const path=require('node:path');
const backend=require('../contest/competition.cjs');const lifecycle=require('../contest/lifecycle.cjs');const browser=require('../renderer/contest-lifecycle.js');
const tpl=require('../renderer/template-logic.js');
test('contest timer start/pause/resume/finish excludes paused time and freezes at end',()=>{
 let c={duration:90,status:'ready',startedAt:null,elapsedBeforeMs:0};
 assert.equal(lifecycle.remainingMs(c,10000),5400000);
 c=lifecycle.transition(c,'start',10000);assert.equal(lifecycle.elapsedMs(c,20000),10000);
 c=lifecycle.transition(c,'pause',20000);assert.equal(lifecycle.elapsedMs(c,50000),10000);
 c=lifecycle.transition(c,'resume',50000);assert.equal(lifecycle.elapsedMs(c,55000),15000);
 c=lifecycle.transition(c,'finish',55000);assert.equal(lifecycle.elapsedMs(c,90000),15000);
 assert.throws(()=>lifecycle.transition(c,'resume',95000),/already finished/);
 assert.deepEqual(browser.transition({duration:90,status:'running',startedAt:10000,elapsedBeforeMs:0},'pause',20000),lifecycle.transition({duration:90,status:'running',startedAt:10000,elapsedBeforeMs:0},'pause',20000));
});
test('illegal lifecycle transitions cannot bypass state machine',()=>{
 const c={duration:3,status:'ready',startedAt:null,elapsedBeforeMs:0};
 for(const action of ['pause','resume','finish'])assert.throws(()=>lifecycle.transition(c,action,100));
 const r=lifecycle.transition(c,'start',100);assert.throws(()=>lifecycle.transition(r,'start',101));
 const p=lifecycle.transition(r,'pause',500);assert.throws(()=>lifecycle.transition(p,'pause',501));
});
test('existing v3.8 projects with startedAt remain readable',()=>{
 const old={duration:120,startedAt:10000};assert.equal(lifecycle.normalize(old).status,'running');assert.equal(lifecycle.elapsedMs(old,20000),10000);
});
test('contest lifecycle persists on disk and can be restored',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'yanpb39-'));
 try{
  const m=await backend.createContest(dir,{platform:'codeforces',contestName:'ROUND2026',tasks:['A','B']});assert.equal(m.status,'ready');
  const x=await backend.changeContestStatus(m.folder,'start');assert.equal(x.status,'running');
  const opened=await backend.openContest(m.folder);assert.equal(opened.status,'running');
  const z=await backend.changeContestStatus(m.folder,'pause');assert.equal(z.status,'paused');
  const f=await backend.changeContestStatus(m.folder,'finish');assert.equal(f.status,'finished');
  assert.throws(()=>lifecycle.transition(f,'start'));
 }finally{await fs.rm(dir,{force:true,recursive:true});}
});
test('submission audit is strictly CSP-J / CSP-S only, including forged custom exam',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'yanpb39-'));
 try{
  const icpc=await backend.createContest(dir,{platform:'icpc',contestName:'ICPC',tasks:['A']});
  await assert.rejects(()=>backend.auditSubmission(icpc),/only for CSP/);
  const forged=await backend.createContest(dir,{platform:'custom',contestName:'CUSTOM',tasks:['apple'],exam:true,candidateId:'TEST'});
  await assert.rejects(()=>backend.auditSubmission(forged),/only for CSP/);
  const csp=await backend.createContest(dir,{platform:'cspj',contestName:'CSP',tasks:['apple'],candidateId:'TEST'});
  assert.equal((await backend.auditSubmission(csp)).reports.length,1);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('template CRUD validates shortcuts, deduplicates and expands only complete abbreviations',()=>{
 let list=[];list=tpl.insertOrUpdate(list,{name:'Binary Search',category:'Search',shortcut:'bisect',code:'while(l<r){}'});
 assert.equal(list.length,1);let a=tpl.expandAbbreviation('int a = bisect',14,list);assert.equal(a.code,'while(l<r){}');
 assert.equal(tpl.expandAbbreviation('bisectX',7,list),null);
 assert.throws(()=>tpl.insertOrUpdate(list,{name:'Other',category:'Search',shortcut:'bisect',code:'hello'}),/already used/);
 const id=list[0].id;list=tpl.insertOrUpdate(list,{name:'Binary Search V2',category:'Search',shortcut:'binary',code:'for(;;){}'},id);
 assert.equal(list[0].code,'for(;;){}');assert.equal(tpl.expandAbbreviation('binary',6,list).code,'for(;;){}');
 list=tpl.remove(list,id);assert.equal(list.length,0);
});
test('template rejects unsafe lengths and malformed ids',()=>{
 assert.throws(()=>tpl.insertOrUpdate([],{name:'x',category:'test',shortcut:'bad-key',code:'int x;'}));
 assert.throws(()=>tpl.insertOrUpdate([],{name:'x',category:'test',shortcut:'xx',code:''}));
 assert.throws(()=>tpl.remove([],'missing'));
});
