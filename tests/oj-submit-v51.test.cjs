'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {routeProblem,sourcePayload,createSubmitBridge}=require('../oj/submit-bridge.cjs');
const extOrigin='chrome-extension://'+'a'.repeat(32);
test('OJ routing uses official hosts and verified patterns only',()=>{
 assert.deepEqual(routeProblem('https://codeforces.com/contest/1976/problem/B1'),{platform:'codeforces',problemId:'1976/B1',url:'https://codeforces.com/contest/1976/submit',supported:true});
 assert.equal(routeProblem('https://codeforces.com/problemset/problem/4/A').url,'https://codeforces.com/contest/4/submit');
 assert.equal(routeProblem('https://atcoder.jp/contests/abc371/tasks/abc371_c').url,'https://atcoder.jp/contests/abc371/submit');
 assert.equal(routeProblem('https://www.luogu.com.cn/problem/P1001').platform,'luogu');
 assert.equal(routeProblem('https://judge.example.com/p/42').supported,false);
 assert.throws(()=>routeProblem('javascript:alert(1)'));
 assert.throws(()=>routeProblem('https://admin:password@atcoder.jp/contests/a/tasks/b'));
});
test('Staged source validates size, no credentials or cookie are needed',()=>{
 assert.throws(()=>sourcePayload({code:'',url:'https://atcoder.jp/contests/abc371/tasks/abc371_c'}));
 assert.throws(()=>sourcePayload({code:'x'.repeat(250001),url:'https://atcoder.jp/contests/abc371/tasks/abc371_c'}));
 assert.match(sourcePayload({code:'int main(){}',url:'https://codeforces.com/contest/1976/problem/B1'}).url,/\/submit$/);
});
test('Submission pairing is one-shot, rejects normal webpages, supports no-network loopback',async()=>{
 const bridge=createSubmitBridge(0);const port=await bridge.start();
 try{
  const pair=bridge.prepare({url:'https://codeforces.com/contest/1976/problem/B1',code:'int main(){return 0;}'});
  const url=`http://127.0.0.1:${port}/claim?ticket=${pair.ticket}`;
  const blocked=await fetch(url,{headers:{Origin:'https://codeforces.com'}});assert.equal(blocked.status,403);
  const wrong=await fetch(`http://127.0.0.1:${port}/claim?ticket=abc`,{headers:{Origin:extOrigin}});assert.equal(wrong.status,403);
  const ok=await fetch(url,{headers:{Origin:extOrigin}});assert.equal(ok.status,200);assert.equal((await ok.json()).code,'int main(){return 0;}');
  assert.equal((await fetch(url,{headers:{Origin:extOrigin}})).status,410);
 }finally{await bridge.stop();}
});
test('Extension never automatically clicks submit or requests login information',()=>{
 const ext=fs.readFileSync(path.resolve(__dirname,'../oj/browser-extension/popup.js'),'utf8');
 assert.match(ext,/chrome\.scripting\.executeScript/);
 assert.doesNotMatch(ext,/\.submit\(\)/);
 assert.doesNotMatch(ext,/\.click\(\)/);
 const manifest=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../oj/browser-extension/manifest.json')));
 assert.deepEqual(manifest.host_permissions,['http://127.0.0.1:10044/*']);
});
test('Installer now includes in-app OJ browser and no longer requires browser helper',()=>{
 const pkg=require('../package.json');
 assert.equal(pkg.version,'5.10.9');
 assert.equal(pkg.build.extraResources.some(x=>x.from==='oj/browser-extension'),false);
 assert.ok(pkg.build.files.includes('oj/*.cjs'));
});
