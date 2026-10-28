'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {createReceiver,parseProblem,validOrigin}=require('../cph/receiver.cjs');
const payload={name:'A. Two Sum',group:'Codeforces Round',url:'https://codeforces.com/problemset/problem/4/A',tests:[{input:'4\n',output:'YES\n'},{input:'1\n',output:'NO\n'}]};
test('CPH payload parser validates samples',()=>{const p=parseProblem(payload);assert.equal(p.tests.length,2);assert.equal(p.tests[1].expected,'NO\n');assert.equal(parseProblem({...payload,tests:[]}).tests.length,0);assert.throws(()=>parseProblem({...payload,tests:null}),/0 to 40/);});
test('CPH rejects ordinary webpage origins',()=>{assert.equal(validOrigin('https://untrusted.example'),false);assert.equal(validOrigin('chrome-extension://abcdefghijklmnopabcdefghijklmnop'),true);assert.equal(validOrigin(undefined),true);});
test('loopback receiver accepts Companion POST, blocks browser origins and can be stopped',async()=>{
 const got=[],receiver=createReceiver(async p=>got.push(p),0);const port=await receiver.start();
 try{
  const url=`http://127.0.0.1:${port}/`;
  const blocked=await fetch(url,{method:'POST',headers:{'origin':'https://example.com','content-type':'application/json'},body:JSON.stringify(payload)});assert.equal(blocked.status,403);
  const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});assert.equal(response.status,200);assert.equal(got.length,1);assert.equal(got[0].name,'A. Two Sum');
  const bad=await fetch(url,{method:'POST',body:'{bad'});assert.equal(bad.status,400);
  const get=await fetch(url);assert.equal(get.status,404);
 }finally{await receiver.stop();}
});
test('strict output comparison differs from trimmed comparison',()=>{
 const {compareOutput}=require('../runner/local-runner.cjs');
 assert.equal(compareOutput('ok\r\n','ok\n','strict'),true);
 assert.equal(compareOutput('ok \n','ok\n','strict'),false);
 assert.equal(compareOutput('ok \n','ok\n','trim'),true);
});
