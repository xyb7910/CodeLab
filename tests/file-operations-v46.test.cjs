'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const actions=require('../renderer/file-actions.js');
const ops=require('../electron/file-operations.cjs');

test('Source file name validator blocks traversal, devices and bad extensions',()=>{
 for(const bad of ['','../other.cpp','a\\b.cpp','a/b.cpp','CON.cpp','nul.h','a.exe','bad?.cpp','test.cpp.',' test.cpp ']){
  if(bad===' test.cpp ')continue; // leading/trailing outer whitespace is normalized
  assert.throws(()=>actions.checkName(bad),undefined,bad);
 }
 assert.equal(actions.checkName(' accepted.cpp '),'accepted.cpp');
 assert.equal(actions.checkName('solution.hpp'),'solution.hpp');
});
test('Copy names are unique even when duplicates already exist',()=>{
 assert.equal(actions.copyName('main.cpp',['main.cpp']),'main-copy.cpp');
 assert.equal(actions.copyName('main.cpp',['main.cpp','MAIN-copy.CPP']),'main-copy-2.cpp');
 assert.equal(actions.copyName('main-copy.cpp',['main.cpp','main-copy.cpp']),'main-copy-2.cpp');
});
async function withDir(run){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'yanpb-v46-'));try{return await run(dir);}finally{await fs.rm(dir,{recursive:true,force:true});}}
test('Rename is non-destructive and cannot overwrite an existing source',async()=>withDir(async dir=>{
 const a=path.join(dir,'A.cpp'),b=path.join(dir,'B.cpp');await fs.writeFile(a,'int a=1;');await fs.writeFile(b,'int b=2;');
 await assert.rejects(()=>ops.renameFile(a,'B.cpp'),/exists|存在/);
 assert.equal(await fs.readFile(a,'utf8'),'int a=1;');
 const renamed=await ops.renameFile(a,'solution.cpp');
 assert.equal(renamed.fullPath,path.join(dir,'solution.cpp'));
 assert.equal(await fs.readFile(renamed.fullPath,'utf8'),'int a=1;');
 assert.equal(await fs.readFile(b,'utf8'),'int b=2;');
}));
test('Trash requires an ordinary source file and delegates to recycle bin',async()=>withDir(async dir=>{
 const src=path.join(dir,'main.cpp');await fs.writeFile(src,'int main(){}');
 let moved=null;await ops.trashFile(src,async path=>{moved=path;});assert.equal(moved,src);
 await assert.rejects(()=>ops.trashFile(dir,async()=>{}),/regular source file/i);
 await assert.rejects(()=>ops.renameFile(src,'../bad.cpp'));
}));
test('Minimap DOM, controls and listeners are removed from app',()=>{
 const fsSync=require('node:fs'),root=path.resolve(__dirname,'..','renderer');
 const html=fsSync.readFileSync(path.join(root,'index.html'),'utf8'),app=fsSync.readFileSync(path.join(root,'app.js'),'utf8');
 assert.doesNotMatch(html,/editorMinimap|editor-surface\.js|class="editor-minimap"/);
 assert.doesNotMatch(app,/minimapController|editorMinimap|prefMinimap/);
 assert.match(app,/\.side-file,\.file-tab/);
 assert.match(html,/src="file-actions\.js"/);
});
