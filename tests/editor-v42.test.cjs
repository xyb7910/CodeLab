'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const diag=require('../renderer/diagnostic-engine.js');
test('Windows and Linux compiler diagnostics parse, dedupe and group by source line',()=>{
 const raw='C:\\Users\\Alice\\My Project\\main.cpp:3:5: error: expected ‘;’ before ‘return’\r\nC:\\Users\\Alice\\My Project\\main.cpp:3:5: error: expected ‘;’ before ‘return’\r\nC:\\Users\\Alice\\My Project\\main.cpp:3:5: note: original statement here\r\nC:\\Users\\Alice\\My Project\\other.cpp:9:2: warning: unused variable\r\n';
 const x=diag.parse(raw,{source:'solution.cpp'});
 assert.equal(x.length,2);assert.deepEqual(diag.summary(x),{errors:1,warnings:0,notes:1});
 assert.equal(diag.lineGroups(x).length,1);assert.equal(diag.lineGroups(x)[0].diagnostics[0].severity,'error');
});
test('Compiler errors and warnings sorted by source location and severity',()=>{
 const r=diag.parse('main.cpp:7:1: warning: caution\nmain.cpp:2:2: error: first\nmain.cpp:2:2: note: detail\n');
 assert.deepEqual(r.map(x=>x.line),[2,2,7]);assert.deepEqual(r.map(x=>x.severity),['error','note','warning']);
});
test('Quick fix only proposes adding a semicolon to simple previous statement',()=>{
 const d={line:3,message:'expected ‘;’ before return'};
 const ok=diag.proposeFix(d,['int main(){','  cout << 1','  return 0;','}']);
 assert.ok(ok);assert.equal(ok.line,2);assert.equal(ok.after,'  cout << 1;');
 assert.equal(diag.validateFix(ok,'  cout << 1'),true);
 assert.equal(diag.validateFix(ok,'  cout << 7'),false);
 assert.equal(diag.proposeFix(d,['int main(){','for (int i=0;i<2;i++)',' return 0;']),null);
 assert.equal(diag.proposeFix(d,['int main(){',' cout << 1;',' return 0;']),null);
});
test('Diagnoses common beginner failures in Chinese and English without auto-changing source',()=>{
 const item={message:'‘foo’ was not declared in this scope'};
 assert.match(diag.advice(item,'zh').text,/变量/);assert.match(diag.advice(item,'en').text,/variable/i);
 assert.equal(diag.proposeFix(item,['foo;']),null);
});
test('Editor has no minimap runtime or overlay',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const html=fs.readFileSync(path.join(__dirname,'../renderer/index.html'),'utf8');
 assert.doesNotMatch(html,/editorMinimap|editor-surface\.js/);
});
