'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {createStore,keyForFile}=require('../history/store.cjs');
test('version history stores snapshots, deduplicates and restores original bytes',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'history-test-'));try{
  const h=createStore(dir);let a=await h.commit('C:\\demo\\a.cpp','int main() {return 1;}','initial');assert.equal(a.created,true);
  assert.equal((await h.commit('C:\\demo\\a.cpp','int main() {return 1;}')).created,false);
  let b=await h.commit('C:\\demo\\a.cpp','int main() {return 2;}','before refactor');assert.equal((await h.list('C:\\demo\\a.cpp')).length,2);
  assert.equal((await h.read('C:\\demo\\a.cpp',a.entry.id)).content,'int main() {return 1;}');
  assert.equal((await h.read('C:\\demo\\a.cpp',b.entry.id)).entry.label,'before refactor');
  await assert.rejects(h.read('C:\\demo\\a.cpp','../../'),/非法/);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('snapshot queue survives concurrent saves, bounded at 32 versions',async()=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'history-test-'));try{const h=createStore(dir);await Promise.all(Array.from({length:38},(_,i)=>h.commit('main.cpp','a='+i)));const list=await h.list('main.cpp');assert.equal(list.length,32);for(const v of list){assert.ok((await h.read('main.cpp',v.id)).content.startsWith('a='));}}finally{await fs.rm(dir,{recursive:true,force:true});}});
test('identity hashed rather than becoming filesystem paths',()=>{assert.match(keyForFile('../secret.cpp'),/^[a-f0-9]{64}$/);});

test('history migration from unsaved id to saved path preserves prior revisions',async()=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'history-test-'));try{const h=createStore(dir);const a=await h.commit('unsaved:file-123','int x=1;');assert.equal(await h.migrate('unsaved:file-123','C:\\home\\test.cpp'),true);assert.equal((await h.read('C:\\home\\test.cpp',a.entry.id)).content,'int x=1;');assert.equal((await h.list('unsaved:file-123')).length,0);}finally{await fs.rm(dir,{recursive:true,force:true});}});
