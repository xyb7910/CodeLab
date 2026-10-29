'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const mac=require('../runner/mac-toolchain.cjs');
const root=path.resolve(__dirname,'..');
const pkg=require('../package.json');

test('macOS Apple Clang detection uses xcrun, never a random PATH compiler',()=>{
 const value=mac.findMacTool('clang++',{execFileSync:(exe,args)=>{assert.equal(exe,'/usr/bin/xcrun');assert.deepEqual(args,['--find','clang++']);return '/Library/Developer/Toolchains/Clang\n';},existsSync:()=>true});
 assert.equal(value,'/Library/Developer/Toolchains/Clang');
 assert.throws(()=>mac.findMacTool('bash'),/Unsupported/);
 assert.throws(()=>mac.findMacTool('clang++',{execFileSync:()=>{throw Error('CLT missing')}}),/xcode-select --install/);
});
test('macOS C++17 bits/std++.h shim imports standard headers and compiles',t=>{
 const header=path.join(root,'mac-compat','bits','stdc++.h');assert.ok(fs.existsSync(header));
 if(process.platform!=='darwin'){t.skip('macOS-only compiler smoke test');return;}
 const result=cp.spawnSync('g++',['-x','c++','-std=c++17','-I',path.join(root,'mac-compat'),'-fsyntax-only','-'],{input:'#include <bits/stdc++.h>\nusing namespace std;int main(){vector<int> a={1,2};return accumulate(a.begin(),a.end(),0)-3;}\n',encoding:'utf8',timeout:20000});
 if(result.error?.code==='ENOENT'){t.skip('g++ unavailable');return;}
 assert.equal(result.status,0,result.stderr);
});
test('macOS packaging excludes Windows MinGW runtime, includes compatibility resources',()=>{
 const text=fs.readFileSync(path.join(root,'build','mac.builder.cjs'),'utf8');
 assert.match(text,/extraResources/);assert.match(text,/mac-compat/);assert.match(text,/dmg/);assert.match(text,/zip/);
 assert.match(text,/const \{extraResources,\.\.\.shared\}=base;/);
 assert.match(fs.readFileSync(path.join(root,'.github','workflows','windows-build.yml'),'utf8'),/macos:\s*\n/);
 assert.equal(pkg.version,'5.10.10');assert.ok(fs.existsSync(path.join(root,'build','icon.icns')));
});
test('macOS runner verification smoke test and signing guidance included',()=>{
 assert.match(fs.readFileSync(path.join(root,'build','verify-macos.cjs'),'utf8'),/xcode-select|findMacTool/);
 assert.match(fs.readFileSync(path.join(root,'build-macos.sh'),'utf8'),/verify-macos/);
 assert.match(fs.readFileSync(path.join(root,'MACOS-README.md'),'utf8'),/Gatekeeper/);
});
