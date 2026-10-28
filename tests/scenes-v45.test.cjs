'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {classify}=require('../renderer/editor-scene.js');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..','renderer');

test('ICPC free coding has correct mode watermark and no scorecard in inspector',()=>{
 const s=classify({mode:'icpc',language:'zh',samples:2});
 assert.equal(s.watermark,'ICPC');assert.equal(s.scene,'coding');assert.equal(s.showPreflight,false);
 const source=fs.readFileSync(path.join(root,'app.js'),'utf8');
 const modePanel=source.slice(source.indexOf('function renderModePanel(){'),source.indexOf('function initTerminalResize(){'));
 assert.doesNotMatch(modePanel,/记录 WA \/ AC|Record WA \/ AC|mode-score-stats|Manual AC/);
 assert.match(modePanel,/classList\.toggle\('hidden',!csp\)/);
});
test('CSP exam scene exposes file I/O context and submission preflight',()=>{
 const s=classify({mode:'oi',contest:{platform:'cspj',exam:true,contestName:'CSP 2026',files:[{task:'apple'},{task:'pear'}]},task:{task:'apple'},samples:3,language:'zh'});
 assert.equal(s.scene,'csp');assert.match(s.detail,/apple\.in → apple\.out/);assert.equal(s.showPreflight,true);assert.equal(s.showNext,true);assert.equal(s.watermark,'OI');
});
test('OI training without a CSP contest cannot show submission preflight',()=>{
 const s=classify({mode:'oi',contest:{platform:'custom',exam:false,contestName:'OI training',files:[{task:'T1'}]},task:{task:'T1'},language:'en'});
 assert.equal(s.scene,'oi-contest');assert.equal(s.showPreflight,false);assert.equal(s.watermark,'OI');
});
test('Debug scene takes priority and replaces snippets with step controls',()=>{
 const s=classify({mode:'icpc',contest:{platform:'icpc',exam:false,files:[{task:'A'},{task:'B'}]},task:{task:'B'},debugStatus:'paused',language:'en'});
 assert.equal(s.scene,'debug');assert.equal(s.showDebug,true);assert.equal(s.showSnippet,false);assert.equal(s.showNext,false);
});
test('Mode watermark stays visible without a minimap',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(html,/id="modeWatermark"/);
 assert.doesNotMatch(html,/editorMinimap/);
});
test('Editor scene actions are wired into the actual HTML toolbar',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),app=fs.readFileSync(path.join(root,'app.js'),'utf8');
 for(const id of ['editorContextBar','sceneNextBtn','scenePreflightBtn','sceneDebugBtn','sceneSnippetBtn','modeWatermark']){
  assert.match(html,new RegExp(`id="${id}"`));
 }
 assert.match(app,/window\.YanpbEditorScene\.classify/);
 assert.doesNotMatch(app,/minimapController/);
});
