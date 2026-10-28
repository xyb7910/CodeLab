'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const model=require('../debug/debug-model.cjs');
const {GdbSession,quoteMI}=require('../debug/mi-session.cjs');
test('preloaded stdin runs in the inferior, not through the GDB/MI command stream',()=>{
 assert.equal(model.runCommand(true),'-interpreter-exec console "run < yanpb-debug-input.txt"');
 assert.equal(model.runCommand(false),'-exec-run');
 assert.equal(quoteMI('a[0]'), '"a[0]"');
});
test('watch and array inputs are bounded, reject control commands and invalid ranges',()=>{
 assert.deepEqual(model.normalizeWatches(['i','dp[i]','i']),['i','dp[i]']);
 assert.throws(()=>model.normalizeWatches(['i;shell rm -rf /']),/Invalid/);
 assert.throws(()=>model.normalizeWatches(Array(17).fill('a')),/Maximum 16/);
 assert.deepEqual(model.normalizeArrays([{expression:'a',start:2,length:4}]),[{expression:'a',start:2,length:4}]);
 assert.throws(()=>model.normalizeArrays([{expression:'a',length:41}]),/1–40/);
 assert.throws(()=>model.normalizeArrays([{expression:'a();evil',length:4}]),/Invalid|Array view/);
});
test('conditional breakpoints validate membership and disallow control characters',()=>{
 assert.deepEqual(model.normalizeConditions({'7':'i == 5','8':'x>3'},[7]),{'7':'i == 5'});
 assert.throws(()=>model.cleanCondition('x==1\ninterpreter-exec'),/Invalid/);
 assert.throws(()=>model.cleanCondition('system("calc")'),/unsafe/);
});
test('numerical arrays support negatives, zeros, and nonnumeric values',()=>{
 const b=model.numericBars([{index:0,value:'-10'},{index:1,value:'5'},{index:2,value:'0'},{index:3,value:'<error>'}]);
 assert.equal(b[0].percent,100);assert.equal(b[0].negative,true);assert.equal(b[1].percent,50);assert.equal(b[2].numeric,true);assert.equal(b[3].numeric,false);
});
test('GDB async paused event evaluates watches and 3 array elements on the same session',async()=>{
 const s=new GdbSession({watches:['i','dp[i]'],arrays:[{expression:'dp',start:0,length:3}]});s.state='running';const sent=[];
 s.send=async cmd=>{sent.push(cmd);
  if(cmd.startsWith('-stack-list-variables'))return {fields:{variables:[{name:'i',value:'2'}]}};
  if(cmd.startsWith('-stack-list-frames'))return {fields:{stack:[{frame:{level:'0',func:'main',line:'11'}}]}};
  const m=cmd.match(/\[(\d+)\]/);if(m)return {fields:{value:String(Number(m[1])*10)}};
  return {fields:{value:cmd.includes('dp[i]')?'20':'2'}};
 };
 const snapshots=[];s.on('state',x=>snapshots.push(x));s.handle('*stopped,reason="breakpoint-hit",frame={func="main",file="debug.cpp",line="11"}');
 await new Promise(ok=>setTimeout(ok,50));const result=snapshots.find(x=>x.status==='paused');
 assert.equal(result.watches.length,2);assert.equal(result.watches[1].value,'20');
 assert.deepEqual(result.arrays[0].items.map(x=>x.value),['0','10','20']);
 assert.equal(result.stack[0].func,'main');assert.ok(sent.some(x=>x.includes('dp[2]')));
});
test('conditional breakpoint updates a paused GDB breakpoint without restarting',async()=>{
 const s=new GdbSession({breakpoints:[12]});s.state='paused';const sent=[];s.send=async cmd=>{sent.push(cmd);return cmd==='-break-list'?{fields:{BreakpointTable:{body:[{bkpt:{number:'1',line:'12'}}]}}}:{fields:{}};};
 const r=await s.action('condition',12,'i == 4');assert.equal(r.conditions[12],'i == 4');
 assert.ok(sent.some(x=>x.startsWith('-break-condition 1')));
 await assert.rejects(()=>s.action('condition',13,'i == 7'),/not found/);
});
test('snapshot ignores stale session state and stale output',async()=>{
 const s=new GdbSession({watches:['i']});s.state='paused';s.snapshotId=1;s.send=async()=>{s.snapshotId=2;return {fields:{variables:[]}};};
 let called=0;s.on('state',()=>called++);await s.snapshot(1,{frame:{line:'2'}});assert.equal(called,0);
});
