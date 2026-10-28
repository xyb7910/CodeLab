'use strict';
const test=require('node:test'),assert=require('node:assert/strict');const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {ClangdSession}=require('../language/clangd.cjs');
const code=fs.readFileSync(path.resolve(__dirname,'../renderer/code-completion.js'),'utf8'),ctx={};ctx.globalThis=ctx;vm.runInNewContext(code,ctx);
const completion=ctx.YanpbCodeCompletion;
test('Offline fallback suggests variables and vector names',()=>{
 const text='int score=1; vector<int> dis(4); for(int index=0;index<3;index++){}\nsc';
 assert.ok(completion.fallback(text,'sc',2).some(x=>x.label==='score'));
 assert.ok(completion.identify(text).includes('dis'));
 assert.ok(completion.identify(text).includes('index'));
});
test('LSP suggestions include details but reject old positions and snippet markers',()=>{
 const r=completion.normalizeLsp([{label:'distance',detail:'int',insertText:'distance'},{label:'distance',insertText:'distance'},{label:'disjoint',insertText:'disjoint'}],'dis');
 assert.deepEqual(Array.from(r.map(x=>x.label)),['distance','disjoint']);
 assert.equal(r[0].detail,'int');
});
test('Stale version never returns completion result',async()=>{
 const s=new ClangdSession({workspace:'/tmp/notused'});s.ready=true;s.version=5;
 assert.deepEqual(await s.completion(0,0,4),{stale:true,items:[]});
 await assert.rejects(()=>s.completion(-1,0,5),/Invalid completion/);
});
test('Real clangd completes a local variable (when available)',{skip:!!process.env.CI},async t=>{
 const cp=require('node:child_process'),os=require('node:os');const probe=cp.spawnSync('clangd',['--version'],{timeout:2500});if(probe.status!==0){t.skip('clangd unavailable');return;}
 const dir=await require('node:fs/promises').mkdtemp(path.join(os.tmpdir(),'yanpb-completion-'));
 const s=new ClangdSession({workspace:dir,compiler:'g++'});
 try{
  await s.start();const text='int main(){ int sampleValue=5; int t= sam; return t; }';s.open(text);
  const result=await s.completion(0,text.indexOf('sam;')+3,s.version);
  assert.ok(result.items.some(x=>x.label?.includes('sampleValue')),'clangd should suggest a local variable');
 }finally{await s.stop();await require('node:fs/promises').rm(dir,{recursive:true,force:true});}
});
