'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs/promises');const os=require('node:os');const path=require('node:path');
const {plan,normalizeMode}=require('../renderer/performance-policy.js');
const {keepClangd,stageClangd}=require('../build/prepare-clangd.cjs');
const pkg=require('../package.json');

test('default clangd smart policy delays creation and sleeps after idle',()=>{
 assert.deepEqual(plan('smart'),{mode:'smart',autoStart:false,autoSleep:true,debounceMs:850,idleMs:120000,hiddenMs:12000});
 assert.equal(normalizeMode('invalid'),'smart');
 assert.equal(plan('always').autoStart,true);
 assert.equal(plan('always').autoSleep,false);
 assert.equal(plan('off').autoStart,false);
});
test('runtime clangd pack keeps clangd exe and runtime DLLs, not static PDBs',()=>{
 for(const x of ['bin/clangd.exe','bin/libstdc++-6.dll','lib/clang/22/include/stddef.h','LICENSE.TXT'])assert.equal(keepClangd(x,false),true,x);
 for(const x of ['bin/clangd-indexer.exe','bin/clangd.pdb','docs/tutorial.md','share/icons/foo.svg','lib/clang/22/static.lib'])assert.equal(keepClangd(x,false),false,x);
});
test('clangd stage produces a reusable, non-destructive layout',async()=>{
 const base=await fs.mkdtemp(path.join(os.tmpdir(),'yanpb-clangd-stage-'));
 try{
  const src=path.join(base,'clangd'),dst=path.join(base,'staged','clangd');
  for(const [rel,content] of [['bin/clangd.exe','a'],['bin/needed.dll','b'],['bin/clangd-indexer.exe','big executable'],['lib/clang/22/include/stddef.h','header'],['LICENSE.TXT','license'],['docs/README.md','big docs']]){
   const file=path.join(src,rel);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,content);
  }
  const a=await stageClangd(src,dst);assert.ok(a.savedBytes>0);
  assert.equal(await fs.readFile(path.join(dst,'bin','clangd.exe'),'utf8'),'a');
  await assert.rejects(fs.stat(path.join(dst,'bin','clangd-indexer.exe')));
  assert.equal(await fs.readFile(path.join(src,'bin','clangd-indexer.exe'),'utf8'),'big executable');
  assert.equal((await stageClangd(src,dst)).cached,true);
 }finally{await fs.rm(base,{recursive:true,force:true});}
});
test('installer includes staged clangd and GCC rather than full downloads',()=>{
 const packs=pkg.build.extraResources;
 assert.ok(packs.some(x=>x.to==='clangd'&&x.from==='toolchain-runtime/clangd'));
 assert.ok(packs.some(x=>x.to==='toolchain/mingw64'&&x.from==='toolchain-runtime/mingw64'));
 assert.match(pkg.scripts['build:win'],/prepare:clangd/);
});
