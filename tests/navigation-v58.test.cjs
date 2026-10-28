'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../renderer/index.html'),'utf8');
const js=fs.readFileSync(path.join(__dirname,'../renderer/app.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../renderer/style.css'),'utf8');
test('Theme control is visible in the right side of the titlebar, not hidden in activity rail',()=>{
 const t=html.match(/<div class="title-actions">([\s\S]*?)<div class="window-controls"/);
 assert.ok(t?.[1].includes('id="themeBtn"'));
 assert.ok(!t[1].includes('id="themeBtn" class="hidden"'));
 assert.match(js,/function syncThemeButton\(/);
 assert.match(js,/icon\.setAttribute\('href',dark\?'#i-sun':'#i-moon'\)/);
});
test('Active contest ribbon depends on selected work and contest navigation, not only stored contest',()=>{
 assert.match(js,/function contestRibbonVisible\(contest, file, sidebar\)/);
 assert.match(js,/if\(!contest\)return false/);
 assert.match(js,/return sidebar==='contest'\|\|!!\(file\?\.fullPath/);
 assert.match(js,/contestRibbonVisible\(m,activeFile\(\),state\.sidebar\)/);
});
test('Every primary action has a single visible entry and duplicate scene controls remain hidden',()=>{
 for(const id of ['fastOjBtn','allCasesBtn','runBtn','themeBtn']){
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 }
 const action=html.split('<div class="actionbar-right">')[1].split('<div class="toolbar-more-anchor">')[0];
 assert.ok(!action.includes('id="localSubmitBtn"'));
 assert.ok(!action.includes('id="ojSubmitBtn"'));
 assert.ok(!html.includes('id="localSubmitBtn"'));
 assert.ok(!js.includes('function submitLocally('));
 for(const id of ['sceneOjSubmitBtn','sceneNextBtn','scenePreflightBtn']) assert.match(css,new RegExp('#'+id));
});
test('Ctrl+Alt+T toggles color theme and remains persistent',()=>{
 assert.match(js,/e\.altKey&&e\.key\.toLowerCase\(\)==='t'/);
 assert.match(js,/function updateTheme\(theme\).*persistSoon\(\)/);
});
