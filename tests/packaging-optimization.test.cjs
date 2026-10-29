'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs/promises');const path=require('node:path');const os=require('node:os');
const pkg=require('../package.json');
const {keep,stage,sizeTree}=require('../build/prepare-toolchain.cjs');
const {pruneElectronLocales}=require('../build/after-pack.cjs');

test('Fast installer and compact installer have explicit trade-off',()=>{
 assert.equal(pkg.version,'5.10.8');
 assert.equal(pkg.build.nsis.useZip,true);
 assert.equal(pkg.build.nsis.differentialPackage,false);
 const compact=require('../build/compact.builder.cjs');
 assert.equal(compact.nsis.useZip,false);
 assert.equal(compact.compression,'maximum');
 assert.equal(pkg.build.extraResources[0].from,'toolchain-runtime/mingw64');
 assert.equal(pkg.build.extraResources[0].to,'toolchain/mingw64');
});
test('GCC/GDB and runtime dlls preserved; unused bin frontends filtered',()=>{
 for(const f of ['bin/gcc.exe','bin/g++.exe','bin/gdb.exe','bin/as.exe','bin/ld.exe','bin/libstdc++-6.dll','bin/python3.12.dll','libexec/gcc/cc1plus.exe','lib/gcc/x86_64/version/default-manifest.o','include/c++/version/bits/stdc++.h','share/licenses/COPYING'])
  assert.equal(keep(f,false),true,f);
 for(const f of ['bin/gfortran.exe','bin/gcov-dump.exe','share/doc/gpl.txt','share/man/man1/gdb.1','share/locale/zh_CN.po'])
  assert.equal(keep(f,false),false,f);
 assert.equal(keep('COPYING',false),true);
});
test('Staging saves space without deleting full GCC source and caches subsequent builds',async()=>{
 const base=await fs.mkdtemp(path.join(os.tmpdir(),'yanpb-stage-test-'));
 const src=path.join(base,'full'),dst=path.join(base,'slim');
 async function put(rel,val='x'){const f=path.join(src,rel);await fs.mkdir(path.dirname(f),{recursive:true});await fs.writeFile(f,val);}
 try{
  for(const f of ['bin/gcc.exe','bin/g++.exe','bin/gdb.exe','bin/libstdc++-6.dll','lib/gcc/15/cc1.o','include/c++/15/bits/stdc++.h','share/licenses/LICENSE','COPYING'])await put(f,'required');
  await put('bin/gfortran.exe','unused binary');await put('share/doc/readme.txt','excluded documentation');
  const r=await stage(src,dst);
  assert.ok(r.savedBytes>0);assert.ok(r.slim.bytes<r.full.bytes);
  assert.equal(await fs.readFile(path.join(src,'bin','gfortran.exe'),'utf8'),'unused binary');
  await assert.rejects(fs.access(path.join(dst,'bin','gfortran.exe')));
  await assert.rejects(fs.access(path.join(dst,'share','doc','readme.txt')));
  assert.equal(await fs.readFile(path.join(dst,'share','licenses','LICENSE'),'utf8'),'required');
  const second=await stage(src,dst);assert.equal(second.cached,true);
  const measured=await sizeTree(dst);assert.equal(measured.bytes,r.slim.bytes);
 }finally{await fs.rm(base,{recursive:true,force:true});}
});
test('Do not ship a partial toolchain with missing compiler or debugger',async()=>{
 const base=await fs.mkdtemp(path.join(os.tmpdir(),'yanpb-stage-incomplete-'));
 try{await assert.rejects(stage(base,path.join(base,'stage')),/Missing full toolchain component/);}finally{await fs.rm(base,{force:true,recursive:true});}
});
test('Electron locale cleanup retains en-US and zh-CN only',async()=>{
 const base=await fs.mkdtemp(path.join(os.tmpdir(),'yanpb-locales-'));
 try{const dir=path.join(base,'locales');await fs.mkdir(dir);for(const name of ['en-US.pak','zh-CN.pak','ja.pak','de.pak'])await fs.writeFile(path.join(dir,name),'mock');
 const r=await pruneElectronLocales(base,'win32');assert.equal(r.removed,2);assert.ok(r.bytesSaved>0);
 assert.deepEqual((await fs.readdir(dir)).sort(),['en-US.pak','zh-CN.pak']);
 }finally{await fs.rm(base,{recursive:true,force:true});}
});
