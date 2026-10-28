'use strict';
/**
 * Build a reduced WinLibs C++/GDB runtime from the *original* verified tree.
 * Never alter the original distribution. Fail closed if a required component
 * is absent; the Windows builder then runs compile/link/GDB smoke tests.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const SOURCE_DIR = path.resolve(__dirname,'..','toolchain','mingw64');
const DIST_DIR = path.resolve(__dirname,'..','toolchain-runtime','mingw64');
const PROFILE = 'cpp-gdb-lean-v1';

// Target directories are kept complete: GCC internals, headers and lib search
// paths MUST NOT be flattened or renamed. Preserve GDB Python and scripts.
const KEEP_TOP = new Set(['bin','include','lib','libexec','x86_64-w64-mingw32','etc','share','opt']);
const OMIT_SHARE = new Set(['doc','man','info','locale','icons','applications','bash-completion','zsh','fish','gtk-doc','aclocal','vim','emacs','mime','pixmaps']);
const CORE_EXE = new Set([
  'gcc.exe','g++.exe','c++.exe','cc.exe','cpp.exe','gdb.exe','gdbserver.exe',
  'as.exe','ld.exe','ld.bfd.exe','ar.exe','ranlib.exe','nm.exe','objcopy.exe',
  'objdump.exe','strip.exe','readelf.exe','strings.exe','size.exe','dlltool.exe',
  'windres.exe','windmc.exe','addr2line.exe','c++filt.exe','mingw32-make.exe',
  'make.exe','python.exe','python3.exe'
]);
const TARGET_PREFIX = /^x86_64-w64-mingw32-(?:gcc|g\+\+|c\+\+|cpp|ar|as|ld|ld\.bfd|nm|objcopy|objdump|ranlib|strip|windres|dlltool|readelf|gdb)\.exe$/i;
function keep(relative, isDirectory) {
  const p=relative.split(/[\\/]/).filter(Boolean);
  if(!p.length)return true;
  const top=p[0].toLowerCase();
  if(!KEEP_TOP.has(top))return p.length===1 && !isDirectory; // keep root notices/licenses
  if(top==='share' && p.length>=2 && OMIT_SHARE.has(p[1].toLowerCase()))return false;
  if(top==='bin' && p.length===2 && !isDirectory){
    const base=p[1].toLowerCase();
    if(base.endsWith('.exe'))return CORE_EXE.has(base)||TARGET_PREFIX.test(base)|| /^python3\.\d+\.exe$/i.test(base);
  }
  return true;
}
async function sizeTree(dir) {
  let files=0,bytes=0;
  async function walk(folder){for(const entry of await fs.readdir(folder,{withFileTypes:true})){
    const f=path.join(folder,entry.name);
    if(entry.isSymbolicLink())continue;
    if(entry.isDirectory())await walk(f);
    else if(entry.isFile()){files++;bytes+=(await fs.stat(f)).size;}
  }}
  await walk(dir);return {files,bytes};
}
async function stage(source=SOURCE_DIR,dest=DIST_DIR,options={}) {
  const exists=async f=>fs.access(f).then(()=>true,()=>false);
  for(const f of ['bin/g++.exe','bin/gdb.exe','bin/gcc.exe','lib/gcc','include/c++']){
    if(!await exists(path.join(source,...f.split('/'))))throw Error('Missing full toolchain component: '+f);
  }
  const fingerprint=crypto.createHash('sha256').update(JSON.stringify([
    PROFILE,(await fs.stat(path.join(source,'bin','g++.exe'))).size,
    (await fs.stat(path.join(source,'bin','g++.exe'))).mtimeMs,
    (await fs.stat(path.join(source,'bin','gdb.exe'))).size,
    path.resolve(source)
  ])).digest('hex');
  const stampFile=path.join(dest,'..','stage-info.json');
  if(!options.force && await exists(stampFile)) {
    try{const stamp=JSON.parse(await fs.readFile(stampFile,'utf8'));
      if(stamp.fingerprint===fingerprint && await exists(path.join(dest,'bin','g++.exe')) && await exists(path.join(dest,'bin','gdb.exe')))
        return {...stamp,cached:true};
    }catch{}
  }
  const staging=dest+'.staging-'+process.pid;
  await fs.rm(staging,{recursive:true,force:true});
  await fs.mkdir(staging,{recursive:true});
  // A small queue avoids opening thousands of files at once on Windows.
  const pending=[];
  const MAX_PENDING=48;
  async function walk(folder,relative='') {
    for(const entry of await fs.readdir(folder,{withFileTypes:true})){
      const rel=relative?path.join(relative,entry.name):entry.name;
      if(!keep(rel,entry.isDirectory()))continue;
      const src=path.join(folder,entry.name),target=path.join(staging,rel);
      if(entry.isSymbolicLink())throw Error('Unexpected symlink in toolchain: '+rel);
      if(entry.isDirectory()){await fs.mkdir(target,{recursive:true});await walk(src,rel);}
      else if(entry.isFile()){
        pending.push(fs.copyFile(src,target));
        if(pending.length>=MAX_PENDING)await Promise.all(pending.splice(0));
      }
    }
  }
  try{
    await walk(source);
    await Promise.all(pending);
    const [full,slim]=await Promise.all([sizeTree(source),sizeTree(staging)]);
    if(slim.bytes<=0 || slim.bytes>full.bytes)throw Error('Invalid staged toolchain size');
    // Preserve upstream licenses and copyright notices, even when docs/man are omitted.
    const info={profile:PROFILE,fingerprint,createdAt:new Date().toISOString(),full,slim,
      savedBytes:full.bytes-slim.bytes,percentSaved:+((1-slim.bytes/full.bytes)*100).toFixed(2)};
    await fs.rm(dest,{recursive:true,force:true});
    await fs.mkdir(path.dirname(dest),{recursive:true});
    await fs.rename(staging,dest);
    await fs.writeFile(stampFile,JSON.stringify(info,null,2)+'\n');
    return info;
  }catch(error){await Promise.allSettled(pending);await fs.rm(staging,{recursive:true,force:true});throw error;}
}
if(require.main===module){
  stage().then(s=>console.log('[Toolchain stage]',JSON.stringify(s,null,2))).catch(e=>{console.error('[Toolchain stage]',e.message);process.exitCode=1;});
}
module.exports={stage,keep,sizeTree,CORE_EXE};
