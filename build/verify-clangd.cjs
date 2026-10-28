'use strict';
const fs=require('node:fs');const path=require('node:path');const cp=require('node:child_process');
const exe=path.resolve(__dirname,'..','toolchain-runtime','clangd','bin','clangd.exe');
if(!fs.existsSync(exe)){console.error('Missing packaged clangd:',exe,'\nRun scripts/install-clangd.ps1 and npm run prepare:clangd on Windows.');process.exit(1);}
if(process.platform==='win32'){
 const r=cp.spawnSync(exe,['--version'],{encoding:'utf8',timeout:12000});
 if(r.status!==0||r.error||!/clangd version/i.test(r.stdout||'')){console.error('clangd smoke test failed:',r.error||r.stderr);process.exit(1);}
}
console.log('Bundled clangd available.');
