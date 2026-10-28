'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const runner=require('../runner/local-runner.cjs');
const root=path.join(__dirname,'..');

test('Bundled-only policy accepts only auto and bundled compiler in strict mode',()=>{
  for(const request of [undefined,null,'','auto','bundled'])assert.equal(runner.assertBundledRequest(request,{strict:true}),'bundled');
  for(const request of ['system','clang++','g++','C:\\Other\\bin\\g++.exe','/usr/bin/g++'])
    assert.throws(()=>runner.assertBundledRequest(request,{strict:true}),/仅支持安装包自带的 GCC/);
});
test('GUI never exposes a system or custom compiler choice',()=>{
  const js=fs.readFileSync(path.join(root,'renderer/app.js'),'utf8');
  const html=fs.readFileSync(path.join(root,'renderer/index.html'),'utf8');
  assert.ok(!js.includes('id="compilerMode"'));
  assert.ok(!js.includes('id="compilerPath"'));
  assert.ok(html.includes('id="compilerChip"'));
  assert.ok(html.includes('id="toolbarMoreBtn"'));
});
test('Settings contain the four independent sections and compact toolbar commands',()=>{
  const src=fs.readFileSync(path.join(root,'renderer/app.js'),'utf8');
  const html=fs.readFileSync(path.join(root,'renderer/index.html'),'utf8');
  for(const name of ['appearance','editor','performance','environment'])assert.ok(src.includes(`data-settings-page="${name}"`));
  for(const id of ['moreCreateContestBtn','editorOpenFile','editorSaveFile','editorInsertTemplate'])assert.ok(html.includes(`id="${id}"`));
});
test('Windows Electron handlers force GCC for compile, clangd, GDB and stress',()=>{
  const main=fs.readFileSync(path.join(root,'electron/main.cjs'),'utf8');
  for(const op of ['local:run','local:stress','local:clangStart','local:debugStart','local:contestCheck'])assert.ok(main.includes(`'${op}'`));
  assert.match(main,/runner\.assertBundledRequest\(p\?\.compiler,\{strict:true\}\)/);
  assert.match(main,/compiler:'bundled'/);
});
