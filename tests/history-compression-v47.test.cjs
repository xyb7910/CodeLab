'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {createStore,keyForFile}=require('../history/store.cjs');
test('new source snapshots use gzip when it saves disk, without losing content',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'yanpb-compressed-history-'));
 try{const store=createStore(root),content='#include <bits/stdc++.h>\n'.repeat(2000)+'int main(){return 0;}\n';
  const r=await store.commit('a.cpp',content);assert.equal(r.entry.compression,'gzip');assert.ok(r.entry.storedBytes<r.entry.bytes*0.3);
  const actual=await store.read('a.cpp',r.entry.id);assert.equal(actual.content,content);
  const again=await store.commit('a.cpp',content);assert.equal(again.created,false);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('old pre-4.7 uncompressed history entries still restore correctly',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'yanpb-old-history-'));
 try{
  const source='int main(){return 7;}';const id=crypto.randomUUID();const base=path.join(root,keyForFile('legacy.cpp'));
  await fs.mkdir(base);await fs.writeFile(path.join(base,id+'.cpp'),source);
  const entry={id,createdAt:new Date().toISOString(),label:'old',sha:crypto.createHash('sha256').update(source).digest('hex'),bytes:source.length};
  await fs.writeFile(path.join(base,'index.json'),JSON.stringify([entry]));
  assert.equal((await createStore(root).read('legacy.cpp',id)).content,source);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
