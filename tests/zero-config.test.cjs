'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const runner=require('../runner/local-runner.cjs');
const {normalizeLineEndings}=require('./test-utils.cjs');
const root=path.resolve(__dirname,'..');
const pkg=require('../package.json');
test('Windows installer explicitly packages the full MinGW64 tree',()=>{
  assert.equal(pkg.version,'5.10.5');
  assert.equal(pkg.build.productName, 'YanpbCodeLab', 'New default installer directory must have no spaces');
  assert.ok(pkg.build.extraResources.some(o=>o.from==='toolchain-runtime/mingw64' && o.to==='toolchain/mingw64'));
  assert.match(pkg.scripts['build:win'],/verify:toolchain/);
  assert.ok(pkg.build.extraResources.some(o=>o.from==='toolchain/THIRD-PARTY.txt'));
  assert.match(pkg.build.nsis.artifactName,/Setup/);
  assert.match(pkg.build.portable.artifactName,/Portable/);
});
test('Bundled GCC discovery is first priority on Windows',async()=>{
  const candidates=runner.bundledCompilerCandidates();
  if(process.platform==='win32'){
    assert.ok(candidates.length>=1);
    assert.ok(candidates[0].includes(path.join('toolchain','mingw64','bin','g++.exe')));
    const found=await runner.detectCompilers();
    if(fs.existsSync(candidates[0])){
      assert.equal(found[0].bundled,true);
      assert.equal(found[0].bundled,true);
      assert.ok(found[0].path.toLowerCase().endsWith('\\bin\\g++.exe'));
      assert.ok(!/\s/.test(found[0].path), 'Bundled compiler invocation must be space-free');
    }
  } else assert.deepEqual(candidates,[]);
});
test('The source-only project cannot accidentally produce a GCC-less Windows build',()=>{
  if(process.platform==='win32' && fs.existsSync(path.join(root,'toolchain','mingw64','bin','g++.exe'))) return;
  const run=cp.spawnSync(process.execPath,['build/verify-toolchain.cjs'],{cwd:root,encoding:'utf8',timeout:10000});
  assert.notEqual(run.status,0);
  assert.match(run.stderr,/Missing/);
});
test('Automatic compiler option compiles without manual compiler path when a compiler is available',async(t)=>{
  const detected=await runner.detectCompilers();
  if(!detected.length){t.skip('No compiler found for the current test platform');return;}
  const r=await runner.execute({code:'#include <bits/stdc++.h>\nint main(){std::cout<<"ready\\n";}',compiler:'auto',timeoutMs:5000});
  assert.equal(r.status,'OK');assert.equal(normalizeLineEndings(r.results[0].stdout),'ready\n');
});
