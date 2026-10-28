'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {getAliasPlan,hasSpaces}=require('../runner/winlibs-path.cjs');

test('A spaced Windows installation gets a space-free junction plan',()=>{
 const raw='C:\\Users\\Hetao\\AppData\\Local\\Programs\\Yanpb CodeLab Local\\resources\\toolchain\\mingw64\\bin\\g++.exe';
 const p=getAliasPlan(raw,'C:\\Users\\Hetao\\AppData\\Local');
 assert.equal(p.root,'C:\\Users\\Hetao\\AppData\\Local\\Programs\\Yanpb CodeLab Local\\resources\\toolchain\\mingw64');
 assert.ok(p.compiler.startsWith('C:\\Users\\Hetao\\AppData\\Local\\YanpbCL-GCC\\gcc-'));
 assert.equal(hasSpaces(p.compiler),false);
 assert.equal(path.win32.basename(p.compiler),'g++.exe');
});
test('A fixed target always produces the same junction alias',()=>{
 const a='C:\\Program Files\\Yanpb CodeLab Local\\resources\\toolchain\\mingw64\\bin\\g++.exe';
 assert.deepEqual(getAliasPlan(a,'C:\\LocalApps'),getAliasPlan(a,'C:\\LocalApps'));
});
test('A profile path containing spaces fails with an actionable message',()=>{
 const compiler='C:\\Program Files\\Yanpb CodeLab Local\\resources\\toolchain\\mingw64\\bin\\g++.exe';
 assert.throws(()=>getAliasPlan(compiler,'C:\\Users\\Full Name\\AppData\\Local'),/Install CodeLab to a path without spaces/);
});
test('Windows compiler path must be absolute',()=>{
 assert.throws(()=>getAliasPlan('g++.exe','C:\\LocalApps'),/Invalid bundled GCC path/);
});
