'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const diag=require('../renderer/inline-diagnostics.js');
const registry=require('../renderer/contest-registry.js');
test('GCC warnings and errors from paths with spaces and Windows drive letters parse',()=>{
 const data='C:/Users/Alice/App Data/main.cpp:12:5: error: expected ";" before "return"\nC:\\Contest\\A.cpp:7: warning: unused variable x\n';
 const d=diag.parse(data);assert.equal(d.length,2);assert.deepEqual(d.map(x=>x.line),[12,7]);assert.deepEqual(d.map(x=>x.severity),['error','warning']);
});
test('Compiler diagnostics are deduplicated and limited',()=>{const data='main.cpp:3:4: error: broken';assert.equal(diag.parse(data+'\n'+data).length,1);assert.equal(diag.parse(data,{max:1}).length,1);});
test('Diagnostic markers only target current file or sandbox main.cpp',()=>{const x=diag.parse('other.cpp:1:2: error: wrong\nmain.cpp:4:2: error: syntax');assert.equal(diag.filterForSource(x,'A.cpp').length,1);});
test('Contest registry stores multiple independent workspaces per mode',()=>{const a={icpc:[],oi:[]};const m1={folder:'C:\\Rounds\\RoundA'},m2={folder:'C:\\Rounds\\RoundB'};registry.add(a,m1,'icpc');registry.add(a,m2,'icpc');assert.equal(a.icpc.length,2);assert.equal(a.icpc[0].folder,m2.folder);registry.add(a,{...m1,label:'updated'},'icpc');assert.equal(a.icpc.length,2);assert.equal(a.icpc[0].label,'updated');});
test('Older single workspace migrates, OI and ICPC lists remain separate',()=>{const a=registry.migrate({icpc:[{folder:'/tmp/CF'}]},{icpc:{folder:'/tmp/CF'},oi:{folder:'/tmp/CSP',exam:true}});assert.equal(a.icpc.length,1);assert.equal(a.oi.length,1);registry.remove(a,'/tmp/CF','icpc');assert.equal(a.icpc.length,0);assert.equal(a.oi.length,1);});
