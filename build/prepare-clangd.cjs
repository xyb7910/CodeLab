'use strict';
/* Stage only clangd's runtime files. Keep its original download untouched. */
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const {sizeTree}=require('./prepare-toolchain.cjs');
const ROOT=path.resolve(__dirname,'..');
const SOURCE=path.join(ROOT,'toolchain-clangd');
const DEST=path.join(ROOT,'toolchain-runtime','clangd');
const PROFILE='clangd-runtime-lean-v1';
const isNotice=name=>/^(?:LICENSE|LICENCE|COPYING|NOTICE|THIRD-PARTY|AUTHORS)/i.test(name);
function keepClangd(rel,isDirectory){
 const parts=rel.replace(/\\/g,'/').split('/');
 if(parts.length===1){
  return parts[0]==='bin' || parts[0]==='lib' || isNotice(parts[0]);
 }
 if(parts[0]==='bin'){
  if(isDirectory)return true;
  return (parts.at(-1).toLowerCase()==="clangd.exe" || /\.dll$/i.test(parts.at(-1)) || isNotice(parts.at(-1)));
 }
 if(parts[0]==='lib'){
  // Clang's builtin includes may be required to parse system headers.
  if(isDirectory)return true;
  return !/\.(?:a|lib|pdb|map)$/i.test(parts.at(-1));
 }
 return false;
}
async function stageClangd(source=SOURCE,dest=DEST,options={}){
 const exe=path.join(source,'bin','clangd.exe');
 const st=await fs.stat(exe).catch(()=>{throw Error('Missing standalone clangd. Run scripts/install-clangd.ps1');});
 const fingerprint=crypto.createHash('sha256').update(JSON.stringify([PROFILE,path.resolve(source),st.size,st.mtimeMs])).digest('hex');
 const infoPath=path.join(path.dirname(dest),'clangd-stage-info.json');
 try{const old=JSON.parse(await fs.readFile(infoPath,'utf8'));
  if(!options.force&&old.fingerprint===fingerprint){await fs.access(path.join(dest,'bin','clangd.exe'));return {...old,cached:true};}}
 catch{}
 const staging=dest+'.staging-'+process.pid;
 await fs.rm(staging,{recursive:true,force:true});await fs.mkdir(staging,{recursive:true});
 async function copyTree(dir,relative=''){
  for(const item of await fs.readdir(dir,{withFileTypes:true})){
   const rel=relative?path.join(relative,item.name):item.name;
   if(!keepClangd(rel,item.isDirectory()))continue;
   if(item.isSymbolicLink())throw Error('Unsafe symlink in clangd package');
   const target=path.join(staging,rel),original=path.join(dir,item.name);
   if(item.isDirectory()){await fs.mkdir(target,{recursive:true});await copyTree(original,rel);}
   else if(item.isFile())await fs.copyFile(original,target);
  }
 }
 try{
  await copyTree(source);
  await fs.access(path.join(staging,'bin','clangd.exe'));
  const [full,slim]=await Promise.all([sizeTree(source),sizeTree(staging)]);
  if(slim.bytes>full.bytes)throw Error('Clangd stage is larger than source');
  await fs.rm(dest,{recursive:true,force:true});await fs.mkdir(path.dirname(dest),{recursive:true});await fs.rename(staging,dest);
  const data={profile:PROFILE,fingerprint,createdAt:new Date().toISOString(),full,slim,savedBytes:full.bytes-slim.bytes};
  await fs.writeFile(infoPath,JSON.stringify(data,null,2));return data;
 }catch(err){await fs.rm(staging,{recursive:true,force:true});throw err;}
}
if(require.main===module)stageClangd().then(x=>console.log('[clangd stage]',JSON.stringify(x,null,2))).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={keepClangd,stageClangd};
