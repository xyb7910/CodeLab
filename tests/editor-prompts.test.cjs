'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
require('../renderer/editor-prompts.js');
const pm=globalThis.YanpbEditorPrompts;
test('Four builtin prompts with editable body and categories',()=>{assert.equal(pm.normalize().length,4);assert.ok(pm.normalize()[0].body.includes('{errors}'));});
test('Insert, edit and delete custom code editing prompts',()=>{
 let list=pm.upsert([], {title:'DP review',category:'OI',body:'Code: {selection}'});
 assert.equal(list.length,1);const id=list[0].id;
 list=pm.upsert(list,{title:'DP review v2',category:'OI',body:'Code {code}'},id);
 assert.equal(list.length,1);assert.equal(list[0].title,'DP review v2');
 list=pm.remove(list,id);assert.equal(list.length,0);
});
test('Prompt placeholders insert literal source without executing JavaScript',()=>{
 const x=pm.expand({title:'X',body:'{file} {task} {selection} {errors} {code} {unknown}'},{file:'A.cpp',task:'A',selection:'dp[i]',errors:'expected ;',code:'if(x){y();}'});
 assert.match(x,/A.cpp A dp\[i\] expected ; if\(x\)\{y\(\);\} \{unknown\}/);
});
test('Limit prompt length to avoid bloated local storage',()=>{
 assert.throws(()=>pm.upsert([],{title:'',body:'text'}),/标题/);
 assert.throws(()=>pm.upsert([],{title:'Long',body:'x'.repeat(10001)}),/长度/);
});
