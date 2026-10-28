'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createBrowserBridge}=require('../oj/browser-bridge.cjs');
const ROOT=path.resolve(__dirname,'..');
const src=(f)=>fs.readFileSync(path.join(ROOT,f),'utf8');
const problem='https://atcoder.jp/contests/abc371/tasks/abc371_a';

test('Browser-watch queue transports NO source and only accepts official targets',async()=>{
 const bridge=createBrowserBridge({port:0});await bridge.start();
 try{
  const id=crypto.randomUUID(),info=bridge.queueWatch({id,problemUrl:problem});
  assert.equal(info.queued,true);assert.ok(info.url.startsWith('https://atcoder.jp/'));
  const j=bridge._jobs.get(id);assert.equal(j.kind,'watch');assert.equal(j.code,undefined);assert.equal(j.platform,'atcoder');
  assert.throws(()=>bridge.queueWatch({id:crypto.randomUUID(),problemUrl:'https://evil.test/submit'}),/不支持/);
  assert.equal(bridge.queueWatch({id,problemUrl:problem}).existing,true);
 }finally{await bridge.stop();}
});
test('Watch-only receipt still requires extension authorization and cannot forge a verdict',async()=>{
 let t=1000;const bridge=createBrowserBridge({port:0,now:()=>t});await bridge.start();
 const port=bridge.status().port,base=`http://127.0.0.1:${port}`;
 const post=async(path,data,token='')=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json','X-Yanpb-Extension':'1',...(token?{'Authorization':'Bearer '+token}:{})},body:JSON.stringify(data)});
 try{
  const id=crypto.randomUUID();bridge.queueWatch({id,problemUrl:problem});
  assert.equal((await post('/next')).status,401);
  const pair=await post('/pair',{pin:bridge.pair().pin}),token=(await pair.json()).token;
  assert.equal((await post('/next',{},token)).status,200);
  const detail='https://atcoder.jp/contests/abc371/submissions/1122';
  assert.equal((await post('/event',{id,kind:'verdict',url:detail,problemUrl:problem,verdict:'AC'},token)).status,409);
  assert.equal((await post('/event',{id,kind:'receipt',url:detail},token)).status,200);
  assert.equal((await post('/event',{id,kind:'verdict',url:detail,problemUrl:'https://atcoder.jp/contests/abc371/tasks/abc371_b',verdict:'AC'},token)).status,403);
  t+=6*60*60_000+1000;
  assert.equal((await post('/event',{id,kind:'verdict',url:detail,problemUrl:problem,verdict:'AC'},token)).status,404);
 }finally{await bridge.stop();}
});
test('WA test result shows ORIGINAL input and not only answer difference',()=>{
 const app=src('renderer/app.js');assert.match(app,/className='failed-input-data'/);
 assert.match(app,/r\.input\?\?state\.cases\[i\]\?\.input/);
 assert.ok(app.indexOf('className=\'failed-input-data\'')<app.indexOf("window.YanpbLearningTools.linesDiff(r.expected"));
});
test('File tabs support reordering, context menus, middle mouse and persistence',()=>{
 const app=src('renderer/app.js');assert.match(app,/function reorderFileTabs\(/);
 for(const fragment of ['b.draggable=true','addEventListener(\'dragstart\'','addEventListener(\'drop\'','addEventListener(\'auxclick\'','state.files.splice(dest+','saveState();renderTabs()'])assert.ok(app.includes(fragment),fragment);
});
test('No local compiler submission and browser extension watches WITHOUT clicking submit',()=>{
 const app=src('renderer/app.js'),main=src('electron/main.cjs'),html=src('renderer/index.html'),worker=src('oj/submit-extension/worker.js');
 assert.doesNotMatch(app,/function submitLocally\(|function showLocalSubmissionHistory\(/);
 assert.doesNotMatch(main,/local:submissionCreate/);
 assert.doesNotMatch(html,/id="localSubmitBtn"/);
 assert.match(worker,/async function runJob\(job,token\)/);
 assert.doesNotMatch(worker,/officialFormScript|\.click\(\).*submit/);
 assert.match(worker,/kind:'awaiting-user'/);
 assert.match(main,/shell\.openExternal\(route\.url\)/);
});
