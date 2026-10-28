'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const {sizeTree}=require('./prepare-toolchain.cjs');
const root=path.resolve(__dirname,'..');
const mib=n=>(n/1048576).toFixed(2)+' MiB';
async function info(rel){const p=path.join(root,rel);try{
 const st=await fs.stat(p);return st.isDirectory()?await sizeTree(p):{files:1,bytes:st.size};
}catch(e){if(e.code==='ENOENT')return null;throw e;}}
async function report(){
 const [original,staged,clangdOriginal,clangdStaged,app]=await Promise.all(['toolchain/mingw64','toolchain-runtime/mingw64','toolchain-clangd','toolchain-runtime/clangd','dist-windows/win-unpacked'].map(info));
 const entries=[];
 try{for(const name of await fs.readdir(path.join(root,'dist-windows'))){if(name.endsWith('.exe')){
  const st=await fs.stat(path.join(root,'dist-windows',name));entries.push({name,bytes:st.size});
 }}}catch(e){if(e.code!=='ENOENT')throw e;}
 const result={generatedAt:new Date().toISOString(),original,staged,clangdOriginal,clangdStaged,installedApp:app,installers:entries};
 console.log('\n=== Yanpb CodeLab Windows disk footprint ===');
 for(const [name,value] of [['Full WinLibs',original],['Slim GCC+GDB',staged],['Full clangd',clangdOriginal],['Slim clangd',clangdStaged],['Unpacked Electron app',app]]){
  console.log(name.padEnd(24),value?`${mib(value.bytes)} / ${value.files} files`:'Not available');
 }
 if(original&&staged)console.log('Toolchain reduction'.padEnd(24),mib(original.bytes-staged.bytes),`(${((1-staged.bytes/original.bytes)*100).toFixed(1)}%)`);
 if(clangdOriginal&&clangdStaged)console.log('clangd reduction'.padEnd(24),mib(clangdOriginal.bytes-clangdStaged.bytes),`(${((1-clangdStaged.bytes/clangdOriginal.bytes)*100).toFixed(1)}%)`);
 entries.forEach(x=>console.log(x.name,':',mib(x.bytes)));
 const out=path.join(root,'dist-windows','size-report.json');
 await fs.mkdir(path.dirname(out),{recursive:true});await fs.writeFile(out,JSON.stringify(result,null,2)+'\n');
 console.log('Saved:',out);
 return result;
}
if(require.main===module)report().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={report};
