'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const runner=require('../runner/local-runner.cjs');
test('bundled compiler selection fails explicitly if bundle is missing',async(t)=>{if((process.platform==='darwin'&&(await runner.detectCompilers()).some(x=>x.bundled))||(process.platform==='win32'&&runner.bundledCompilerCandidates().some(x=>require('node:fs').existsSync(x)))){t.skip('bundled compiler is present');return;}await assert.rejects(runner.chooseCompiler('bundled'),/内置 GCC/);});
test('system compiler is never selected in Windows builds',async(t)=>{if(process.platform==='win32'){await assert.rejects(runner.chooseCompiler('system'),/仅支持安装包自带/);return;}const c=(await runner.detectCompilers()).filter(x=>!x.bundled);if(!c.length){t.skip('no system compiler');return;}const chosen=await runner.chooseCompiler('system');assert.equal(chosen,c[0].path);});
