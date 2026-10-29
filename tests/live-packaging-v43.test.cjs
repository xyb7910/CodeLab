'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const pkg=require('../package.json');
test('Win64 installer bundles clangd and GDB/Clangd implementation files',()=>{
 assert.equal(pkg.version,'5.10.10');
 assert.ok(pkg.build.files.includes('language/**/*'));
 assert.ok(pkg.build.files.includes('debug/**/*'));
 assert.ok(pkg.build.extraResources.some(x=>x.to==='clangd'&&x.from==='toolchain-runtime/clangd'));
 assert.match(pkg.scripts['build:win'],/verify:clangd/);
 assert.ok(fs.existsSync(path.resolve(__dirname,'..','scripts/install-clangd.ps1')));
});
test('Clangd compiler download pinned to version and verified SHA256, no silently missing distribution',()=>{
 const ps=fs.readFileSync(path.resolve(__dirname,'..','scripts/install-clangd.ps1'),'utf8');
 assert.match(ps,/clangd-windows-22\.1\.6\.zip/);
 assert.match(ps,/ce54f16e0b4fd76d450eeda9664420b195360b73febcfe40e661108fa57f2ce1/);
 assert.match(ps,/Get-FileHash/);
});
