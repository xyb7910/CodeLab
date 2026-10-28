'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const m=require('../renderer/mode-logic.js');
test('Manual ICPC WA/AC scoring has been removed',()=>{assert.equal('icpcSummary' in m,false);});
test('OI checklist distinguishes actual local preflight and sample run from mere filename',()=>{
 const task={task:'apple',source:'C:/Mock/apple/apple.cpp'};
 assert.equal(m.oiChecklist(task,'apple.cpp',null,null).complete,false);
 assert.equal(m.oiChecklist(task,'apple.cpp',{checked:true},{testCount:1}).complete,true);
 assert.equal(m.oiChecklist(task,'APPLE.cpp',{checked:true},{testCount:1}).complete,false);
});
test('Terminal drag clamp respects minimal console and editor working space',()=>{
 assert.equal(m.clampTerminal(0,900),220);
 assert.equal(m.clampTerminal(800,700),490);
 assert.equal(m.clampTerminal(10,700),110);
});
test('Independent mode state, mode cards and accessible terminal handle exist',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'../renderer/index.html'),'utf8');
 const js=fs.readFileSync(path.join(__dirname,'../renderer/app.js'),'utf8');
 for(const id of ['modePanel','modeQuickBtn','terminalResize'])assert.match(ui,new RegExp('id="'+id+'"'));
 assert.match(ui,/aria-orientation="horizontal"/);
 assert.match(js,/state\.terminalHeights\[state\.competitionMode\]/);
 assert.doesNotMatch(js,/state\.icpcAttempts/);
 assert.match(js,/state\.oiAudits/);
 assert.match(js,/initTerminalResize\(\)/);
});
