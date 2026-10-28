'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const os=require('node:os');const fs=require('node:fs/promises');const path=require('node:path');
const cp=require('node:child_process');const {LspFrames,encode,mapDiagnostics,ClangdSession}=require('../language/clangd.cjs');
test('LSP reads fragmented UTF-8 Content-Length frames and multiple messages',()=>{
 const found=[],p=new LspFrames(x=>found.push(x));const a=encode({jsonrpc:'2.0',method:'clangd/tip',params:{text:'中文✓'}}),b=encode({jsonrpc:'2.0',id:5,result:true});
 const joined=Buffer.concat([a,b]);for(const n of [1,2,8,19,33,joined.length]){if(!joined.length)break;}
 for(let i=0;i<joined.length;i+=5)p.push(joined.subarray(i,i+5));
 assert.equal(found.length,2);assert.equal(found[0].params.text,'中文✓');assert.equal(found[1].id,5);
});
test('LSP diagnostics preserve positions and severity',()=>{const result=mapDiagnostics([{range:{start:{line:4,character:8},end:{line:4,character:12}},severity:1,message:'unknown symbol'},{range:{start:{line:2,character:1}},severity:2,message:'unused'}]);assert.deepEqual(result.map(x=>[x.line,x.column,x.severity]),[[5,9,'error'],[3,2,'warning']]);});
test('LSP real clangd edits trigger diagnostics, if clangd installed',{skip:!!process.env.CI},async t=>{const find=cp.spawnSync('clangd',['--version'],{encoding:'utf8',timeout:3000});if(find.error||find.status!==0){t.skip('clangd not installed in test machine');return;}
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'yanpb-lsp-test-'));const session=new ClangdSession({workspace:dir,compiler:'g++'});
 try{await session.start();const diagnostics=[];session.on('diagnostics',d=>diagnostics.push(d));session.open('int main(){return missing_symbol;}');
  const deadline=Date.now()+12000;while(!diagnostics.some(x=>x.diagnostics.some(d=>d.message.includes('missing_symbol'))) && Date.now()<deadline)await new Promise(r=>setTimeout(r,150));
  assert.ok(diagnostics.some(x=>x.diagnostics.some(d=>d.message.includes('missing_symbol'))),'clangd published missing symbol error');
  session.change('int main(){return 0;}');const expected=session.version;while(!diagnostics.some(x=>x.version>=expected&&x.diagnostics.length===0)&&Date.now()<deadline+5000)await new Promise(r=>setTimeout(r,150));
  assert.ok(diagnostics.some(x=>x.version>=expected&&x.diagnostics.length===0),'clangd cleared diagnostics after fix');
 }finally{await session.stop();await fs.rm(dir,{recursive:true,force:true});}
});
