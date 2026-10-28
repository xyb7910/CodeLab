'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const runner=require('../runner/local-runner.cjs');
const {normalizeLineEndings}=require('./test-utils.cjs');
// Windows only supports the bundled WinLibs GCC. Never gate these tests on
// an unrelated system g++ being installed in PATH. The full build script
// installs the bundled toolchain before running this suite.
let available=false;
if(process.platform==='win32') {
  available=runner.bundledCompilerCandidates().some(candidate=>fs.existsSync(candidate));
} else {
  try{execFileSync('g++',['--version'],{timeout:3500,stdio:'ignore'});available=true;}catch{}
}
const compiler=available?test:test.skip;
const good='#include <bits/stdc++.h>\nusing namespace std; int main(){int x;cin>>x;cout<<x*2<<"\\n";}';
compiler('检测到可用的 C++ 编译器',async()=>{
  const info=await runner.detectCompilers();
  assert.ok(info.length>0,'预期检测到至少一个可运行的 C++ 编译器');
  if(process.platform==='win32'){
    assert.ok(info.every(x=>x.bundled===true),'Windows 版只能检测并使用内置 GCC');
    assert.ok(info.some(x=>path.win32.basename(x.path).toLowerCase()==='g++.exe'),'内置编译器必须是有效的 g++.exe 路径');
  }else{
    assert.ok(info.some(x=>['g++','clang++'].includes(path.basename(x.path))),'预期 Linux/macOS 编译器路径以 g++ 或 clang++ 结尾');
  }
});
compiler('本机编译 + 标准输入输出',async()=>{const r=await runner.execute({code:good,stdin:'21\n',standard:'c++17',timeoutMs:2000});assert.equal(r.status,'OK');assert.equal(normalizeLineEndings(r.results[0].stdout),'42\n');});
compiler('样例比较可区分 AC 与 WA',async()=>{const r=await runner.execute({code:good,cases:[{name:'A',input:'7\n',expected:'14\n'},{name:'B',input:'6\n',expected:'99\n'}]});assert.equal(r.status,'WA');assert.deepEqual(r.results.map(x=>x.status),['OK','WA']);});
compiler('编译错误报告',async()=>{const r=await runner.execute({code:'int main() { this is broken }'});assert.equal(r.status,'CE');assert.match(r.stderr,/error:/i);});
compiler('运行超时后进程终止',async()=>{const r=await runner.execute({code:'int main(){while(true) {}}',timeoutMs:250});assert.equal(r.status,'TLE');});
compiler('对拍成功',async()=>{const gen='#include <iostream>\nusing namespace std;int main(int argc,char**argv){cout<<argc<<"\\n";}';const r=await runner.stress({generator:gen,code:good,brute:good,iterations:3});assert.equal(r.status,'PASS');assert.equal(r.rounds,3);});
compiler('对拍发现第一组反例',async()=>{const gen='#include <iostream>\nusing namespace std;int main(){cout<<"5\\n";}';const bad='int main(){return 0;}';const r=await runner.stress({generator:gen,code:bad,brute:good,iterations:5});assert.equal(r.status,'MISMATCH');assert.equal(r.round,1);assert.equal(normalizeLineEndings(r.input),'5\n');});
test('输出规范化：忽略 CRLF 和末尾空白',()=>{assert.equal(runner.normalizedOutput('hi\r\n'),'hi');assert.notEqual(runner.normalizedOutput('1  2'),'1 2');});
test('编译参数白名单',()=>{assert.equal(runner.cleanedStandard('-fexec-charset=??'),'c++17');assert.equal(runner.cleanedOpt('O100'),'O2');});
test('校验空代码',async()=>{await assert.rejects(()=>runner.execute({code:''}),/为空/);});
