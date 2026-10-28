'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const editor=require('../renderer/editor-commands.js');const workflow=require('../renderer/contest-workflow.js');
test('contest progress keys isolate identically named contests in different folders',()=>{
 const p={};p[workflow.key('C:/round1/A','A')]={status:'OK',testCount:2};p[workflow.key('C:/round2/A','A')]={status:'WA',testCount:4};
 assert.equal(workflow.read(p,{folder:'C:/round1/A',contestName:'round'},'A').status,'OK');
 assert.equal(workflow.read(p,{folder:'C:/round2/A',contestName:'round'},'A').status,'WA');
});
test('old contest test records still display in v4 before first fresh result',()=>{
 const m={folder:'/mock',contestName:'OLD',files:[{task:'A'},{task:'B'}]};
 const p={'OLD:A':{status:'OK',testCount:1}};const s=workflow.summarize(m,p);
 assert.equal(s.tested,1);assert.equal(s.rows[0].testStatus,'OK');assert.equal(s.rows[0].verdict,null);
});
test('A sample verdict is never an official ICPC accepted submission',()=>{
 const m={folder:'/mock',contestName:'ICPC',files:[{task:'A'}]};const p={[workflow.key('/mock','A')]:{status:'OK',testCount:3}};
 assert.equal(workflow.summarize(m,p).rows[0].displayStatus,'OK (samples)');
});
test('workflow actions correspond to lifecycle and finished contests are read-only',()=>{
 assert.equal(workflow.nextAction('ready'),'start');assert.equal(workflow.nextAction('running'),'pause');
 assert.equal(workflow.nextAction('paused'),'resume');assert.equal(workflow.nextAction('finished'),null);
});
test('editor literal search counts overlapping? no: progresses without getting stuck',()=>{
 assert.deepEqual(editor.matches('Abc abc aBC','ABC').map(x=>x.start),[0,4,8]);
 assert.deepEqual(editor.matches('hello','',''),[]);
 assert.deepEqual(editor.matches('aaaa','aa').map(x=>x.start),[0,2]);
});
