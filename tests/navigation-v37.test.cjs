'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'renderer','index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'renderer','app.js'),'utf8');
const css=fs.readFileSync(path.join(root,'renderer','style.css'),'utf8');
test('primary controls and mode switch remain part of one compact navigation',()=>{
 for(const id of ['modeICPC','modeOI','paletteBtn','stdSelect','optSelect','runBtn','allCasesBtn','compilerChip','contestCreateBtn']) assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/id="toolbarMoreMenu" role="menu"/);
 assert.match(html,/id="editorMoreMenu" role="menu"/);
});
test('auxiliary actions retain stable element IDs and existing command handlers',()=>{
 for(const id of ['contestCheckBtn','contestNextBtn','versionsBtn','checkpointBtn','traceBtn','moreStressBtn','moreSettingsBtn']) assert.match(html,new RegExp('id="'+id+'"'));
 for(const callback of ['showVersionHistory','showVariableTrace','manualCheckpoint','showSubmissionReview','showStress'])assert.ok(js.includes(callback));
 assert.match(js,/initToolbarMenus\(\)/);
});
test('narrow editor area uses container queries while menus stay keyboard accessible',()=>{
 assert.match(css,/@container \(max-width:710px\)/);
 assert.match(css,/\.center-stack\{container-type:inline-size\}/);
 assert.match(js,/e\.key==='ArrowDown'/);
 assert.match(js,/e\.key==='Escape'/);
 assert.match(html,/aria-expanded="false"/);
});
