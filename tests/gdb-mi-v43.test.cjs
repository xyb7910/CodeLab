'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {parseMI,parseFields,quoteMI,GdbSession}=require('../debug/mi-session.cjs');
test('GDB MI parse breakpoints and current C++ source line with Windows drive spaces',()=>{
 const m=parseMI('*stopped,reason="breakpoint-hit",frame={addr="0x12",func="main",file="debug.cpp",fullname="C:\\\\My Project\\\\debug.cpp",line="12"},thread-id="1"');
 assert.equal(m.type,'*');assert.equal(m.status,'stopped');assert.equal(m.fields.frame.line,'12');assert.equal(m.fields.frame.func,'main');
});
test('GDB MI parser collects variable, nested frames, escaped output and errors',()=>{
 const p=parseFields('variables=[{name="i",value="7"},{name="s",value="\\\"hi\\\""}],stack=[frame={level="0",func="main",line="12"},frame={level="1",func="solve",line="4"}]');
 assert.equal(p.variables.length,2);assert.equal(p.variables[0].value,'7');assert.equal(p.stack[0].frame.func,'main');assert.equal(p.stack[1].frame.line,'4');
 assert.equal(parseMI('31^error,msg="No breakpoint"').fields.msg,'No breakpoint');
 assert.equal(quoteMI('C:\\My Project\\main.cpp:4'),'"C:\\\\My Project\\\\main.cpp:4"');
});
test('GDB MI controlled state snapshots read locals and stack on same session',async()=>{
 const db=new GdbSession();db.state='running';db.source='C:\\debug.cpp';
 const commands=[];db.send=async command=>{commands.push(command);return command.startsWith('-stack-list-variables')?{fields:{variables:[{name:'x',value:'42'}]}}:{fields:{stack:[{frame:{level:'0',func:'main',line:'5'}}]}};};
 const snapshots=[];db.on('state',s=>snapshots.push(s));db.handle('*stopped,reason="breakpoint-hit",frame={func="main",file="debug.cpp",line="5"}');
 await new Promise(r=>setTimeout(r,10));assert.equal(db.state,'paused');assert.equal(snapshots[0].variables[0].value,'42');assert.equal(snapshots[0].stack[0].func,'main');assert.equal(commands.length,2);
});
