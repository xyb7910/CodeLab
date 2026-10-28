'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parseTrace,buildScript}=require('../debug/trace.cjs');
test('gdb trace output includes real locals and source line',()=>{
 const sample='Breakpoint 1, main () at /tmp/trace.cpp:7\n===YANPB_STEP_BEGIN:0===\n#0  main () at /tmp/trace.cpp:7\n7     int ans=0;\nans = 0\ni = 1\n===YANPB_STEP_END===\n===YANPB_STEP_BEGIN:1===\n#0 main () at /tmp/trace.cpp:9\n9    ++ans;\nans = 4\ni = 2\n===YANPB_STEP_END===\n';
 const values=parseTrace(sample);assert.equal(values.length,2);assert.equal(values[1].line,9);assert.deepEqual(values[1].variables,[{name:'ans',value:'4'},{name:'i',value:'2'}]);
});
test('GDB trace script has bounded stepping and standard input',()=>{const script=buildScript(16);assert.match(script,/while \$yanpb_step < 16/);assert.match(script,/run < stdin.txt/);assert.match(script,/info locals/);assert.doesNotMatch(script,/shell\s/);});
