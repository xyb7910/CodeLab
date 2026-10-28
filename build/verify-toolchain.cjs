'use strict';
// Guardrail: never ship an installer that claims to be zero-configuration
// when the GCC headers/libraries/executables are missing.
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const mingw=path.join(root,'toolchain-runtime','mingw64');
const exists=p=>fs.existsSync(path.join(mingw,p));
const required=['bin/g++.exe','bin/gdb.exe','bin/gcc.exe','bin/as.exe','bin/ld.exe','bin/libstdc++-6.dll','include/c++','lib/gcc'];
let missing=required.filter(p=>!exists(p));
if(!missing.length){
 const headers=path.join(mingw,'include','c++');
 const versions=fs.readdirSync(headers).filter(x=>fs.statSync(path.join(headers,x)).isDirectory());
 if(!versions.length)missing.push('include/c++/<gcc-version>');
}
if(missing.length){
 console.error('[Toolchain] Missing:',missing.join(', '));
 console.error('Run npm run prepare:toolchain (or build-windows.bat) first. Never ship an unverified toolchain.');
 process.exit(1);
}
async function verifyOnWindows() {
if(process.platform==='win32'){
 const compilerOriginal=path.join(mingw,'bin','g++.exe');
 const compiler=await require('../runner/winlibs-path.cjs').resolveBundledCompiler(compilerOriginal);
 const env={...process.env};
 const old=Object.entries(env).find(([k])=>k.toLowerCase()==='path')?.[1]||'';
 for(const k of Object.keys(env))if(k.toLowerCase()==='path')delete env[k];
 env.Path=path.dirname(compiler)+';'+old;
 const gd=cp.spawnSync(path.join(mingw,'bin','gdb.exe'),['--version'],{env,encoding:'utf8',timeout:12000});
 if(gd.error||gd.status!==0)throw Error('Bundled GDB debugger verification failed: '+(gd.stderr||gd.error?.message||gd.status));
 const t=fs.mkdtempSync(path.join(os.tmpdir(),'yanpb-gcc-check-'));
 try{
  const input=path.join(t,'test.cpp'),output=path.join(t,'test.exe');
  fs.writeFileSync(input,'#include <bits/stdc++.h>\nint main(){std::cout << 2026 << "\\n";}\n');
  const c=cp.spawnSync(compiler,['-std=c++17','-O2','-static-libgcc','-static-libstdc++',input,'-o',output],{env,encoding:'utf8',timeout:60000});
  if(c.error||c.status!==0)throw Error('Compiler smoke test failed: '+(c.stderr||c.error?.message||c.status));
  const run=cp.spawnSync(output,[],{env,encoding:'utf8',timeout:5000});
  if(run.error||run.status!==0||run.stdout.trim()!=='2026')throw Error('Compiled executable smoke test failed: '+(run.stderr||run.error?.message||run.status));
  // Verify real line-break debugging, not merely that gdb --version starts.
  const debugExe=path.join(t,'debug-test.exe');
  const debugBuild=cp.spawnSync(compiler,['-std=c++17','-O0','-g',input,'-o',debugExe],{env,encoding:'utf8',timeout:60000});
  if(debugBuild.error||debugBuild.status!==0)throw Error('Debug build failed: '+(debugBuild.stderr||debugBuild.error?.message||debugBuild.status));
  const gdbPath=path.join(path.dirname(compiler),'gdb.exe');
  const debugRun=cp.spawnSync(gdbPath,['--batch','--quiet','-ex','set pagination off','-ex','break main','-ex','run','-ex','info locals','--args',debugExe],{env,encoding:'utf8',timeout:25000,maxBuffer:1024*1024});
  if(debugRun.error || debugRun.status!==0 || !/Breakpoint\s+\d+/i.test(debugRun.stdout||'')){
    throw Error('Bundled GDB breakpoint test failed: '+(debugRun.stderr||debugRun.stdout||debugRun.error?.message||debugRun.status));
  }
 } finally{fs.rmSync(t,{recursive:true,force:true});}
}
}
verifyOnWindows().then(()=>console.log('[Toolchain] OK: complete bundled GCC detected'+(process.platform==='win32'?' and compile/run smoke test passed':' (file check only)'))).catch(e=>{console.error('[Toolchain]',e.message);process.exitCode=1;});
