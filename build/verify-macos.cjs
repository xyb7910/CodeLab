'use strict';
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const cp=require('node:child_process');
const mac=require('../runner/mac-toolchain.cjs');
function main(){
 if(process.platform!=='darwin')throw Error('Mac toolchain check must run on macOS.');
 const compiler=mac.findMacTool('clang++');
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'yanpb-mac-check-'));
 try{
  const source=path.join(tmp,'smoke.cpp'),binary=path.join(tmp,'smoke');
  fs.writeFileSync(source,'#include <bits/stdc++.h>\nusing namespace std;int main(){vector<int> a={2026};cout<<a[0]<<"\\n";}\n','utf8');
  const flags=['-std=c++17','-O2','-I',path.join(__dirname,'..','mac-compat'),source,'-o',binary];
  const build=cp.spawnSync(compiler,flags,{timeout:60000,encoding:'utf8'});
  if(build.status!==0||build.error)throw Error('Apple Clang compilation failed: '+(build.stderr||build.error?.message||''));
  const run=cp.spawnSync(binary,[],{timeout:5000,encoding:'utf8'});
  if(run.status!==0||run.stdout.trim()!=='2026')throw Error('macOS compiled program execution failed: '+(run.stderr||run.stdout||''));
  console.log('[macOS] Clang + C++17 + bits/stdc++.h shim: PASS');
 } finally{fs.rmSync(tmp,{recursive:true,force:true});}
}
if(require.main===module){try{main();}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={main};
