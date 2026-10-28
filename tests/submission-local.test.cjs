'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const os=require('node:os'),path=require('node:path'),fs=require('node:fs/promises');
const {store,calculateVerdict,checkRequest,identity}=require('../submission/local-submissions.cjs');
const standard=async p=>({status:'OK',compileMs:24,results:p.cases.map(x=>({name:x.name,status:'OK',timeMs:2}))});
async function withStore(fn){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'yanpb-submissions-test-'));try{return await fn(store(dir,standard));}finally{await fs.rm(dir,{force:true,recursive:true});}}
const data={fileKey:'C:\\My code\\ContestA\\A.cpp',fileName:'A.cpp',code:'int main(){return 0;}',cases:[{input:'1\n',expected:'2\n'}]};
test('Local submission records source snapshot and verifiable sample count',async()=>withStore(async s=>{
 const result=await s.submit(data);assert.equal(result.verdict,'LOCAL_PASS');assert.equal(result.source,undefined);
 const hist=await s.summaries(data.fileKey);assert.equal(hist.length,1);assert.ok(!Object.hasOwn(hist[0],'source'));
 const full=await s.read(data.fileKey,result.id);assert.equal(full.source,data.code);assert.equal(full.passed,1);
}));
test('Submission is not an official AC if expected output is empty or missing',async()=>withStore(async s=>{
 const a=await s.submit({...data,cases:[{input:'1\n',expected:''}]});assert.equal(a.verdict,'UNCHECKED');assert.equal(a.fullyChecked,false);
 const b=calculateVerdict({status:'OK',results:[]},[]);assert.equal(b.verdict,'UNCHECKED');
}));
test('WA, CE and run failures retain honest local verdict',()=>{
 assert.equal(calculateVerdict({status:'WA',results:[{status:'WA'}]},data.cases).verdict,'WA');
 assert.equal(calculateVerdict({status:'CE',results:[]},data.cases).verdict,'CE');
 assert.equal(calculateVerdict({status:'RE',results:[]},data.cases).verdict,'RE');
});
test('Separate files have separate histories',async()=>withStore(async s=>{
 await s.submit(data);await s.submit({...data,fileKey:'C:\\Another contest\\A.cpp'});
 assert.equal((await s.summaries(data.fileKey)).length,1);
 assert.notEqual(identity(data.fileKey),identity('C:\\Another contest\\A.cpp'));
}));
test('Reject invalid source, tests and malformed snapshot IDs',async()=>withStore(async s=>{
 assert.throws(()=>checkRequest({...data,code:''}),/Source/);
 assert.throws(()=>checkRequest({...data,cases:Array(31).fill({input:'',expected:''})}),/Too many/);
 assert.throws(()=>checkRequest({...data,cases:[{input:23,expected:'1'}]}),/Invalid case/);
 await assert.rejects(()=>s.read(data.fileKey,'../../malicious'),/Invalid submission ID/);
}));
test('Retain only fifty submissions per source',async()=>withStore(async s=>{
 for(let i=0;i<52;i++)await s.submit({...data,code:'int main(){return '+i+';}'});
 assert.equal((await s.summaries(data.fileKey)).length,50);
}));
test('CSP file-based submission validates context and uses separate judge',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'yanpb-submissions-csp-'));
 try{let wasCalled=false;const service=store(dir,standard,async p=>{wasCalled=true;assert.equal(p.task,'apple');return {status:'NO_OUTPUT',results:[{name:'1',status:'NO_OUTPUT'}]};});
  const r=await service.submit({...data,mode:'csp',contest:{folder:'C:\\Fake',contestName:'Mock'},task:'apple'});assert.equal(r.verdict,'NO_OUTPUT');assert.ok(wasCalled);
  await assert.rejects(()=>service.submit({...data,mode:'csp',contest:null,task:'apple'}),/CSP context/);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});

test('Draft submissions migrate to a disk path when saved as CPP',async()=>withStore(async s=>{
 const old='draft:abc123',newKey='C:\\Contest\\A.cpp';await s.submit({...data,fileKey:old});
 assert.equal(await s.migrate(old,newKey),true);assert.equal((await s.summaries(old)).length,0);assert.equal((await s.summaries(newKey)).length,1);
}));
