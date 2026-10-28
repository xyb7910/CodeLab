'use strict';
// Remove Chromium translations unused by the bilingual Chinese/English GUI.
// Only application-local Electron files are touched, never user's data.
const fs=require('node:fs/promises');
const path=require('node:path');
const LOCALES=new Set(['en-US.pak','zh-CN.pak']);
async function pruneElectronLocales(appOutDir, platform='win32') {
 if(platform!=='win32')return {removed:0,bytesSaved:0};
 const dir=path.join(appOutDir,'locales');
 let entries=[];
 try{entries=await fs.readdir(dir,{withFileTypes:true});}catch(e){if(e.code==='ENOENT')return {removed:0,bytesSaved:0};throw e;}
 let removed=0,bytesSaved=0;
 for(const e of entries){
   if(!e.isFile() || !e.name.endsWith('.pak') || LOCALES.has(e.name))continue;
   const file=path.join(dir,e.name);bytesSaved+=(await fs.stat(file)).size;
   await fs.unlink(file);removed++;
 }
 return {removed,bytesSaved};
}
module.exports=async context=>{
 const r=await pruneElectronLocales(context.appOutDir,context.electronPlatformName);
 if(r.removed)console.log(`[Yanpb build] Removed ${r.removed} unused Electron locale packs (${(r.bytesSaved/1048576).toFixed(1)} MiB)`);
};
module.exports.pruneElectronLocales=pruneElectronLocales;
