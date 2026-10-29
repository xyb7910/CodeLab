'use strict';
// MV3 browser worker: source transfer occurs only after an explicit CodeLab job
// and prior one-time pairing. No credential/cookie reading and no CAPTCHA bypass.
importScripts('page-inspector.js');
const BASE='http://127.0.0.1:10045';
let busy=false,lastStatus='未连接';
const verdictInspections=new Set(),observerTabs=new Set();
const activeTabs=new Map(),pendingWatches=new Map();
let restorePromise=null;
async function restoreTabs(){
 if(restorePromise)return restorePromise;
 restorePromise=(async()=>{try{
   const data=await chrome.storage.session.get(['activeOJTabs','pendingOJWatches']);
   for(const [id,value] of Object.entries(data.activeOJTabs||{}))if(Date.now()-(value.at||0)<6*60*60_000)activeTabs.set(Number(id),value);
   for(const [id,value] of Object.entries(data.pendingOJWatches||{}))if(Date.now()-(value.at||0)<6*60*60_000)pendingWatches.set(id,value);
  }catch{} })();return restorePromise;
}
async function saveTabs(){const data={};for(const [id,ctx] of activeTabs)if(Date.now()-ctx.at<6*60*60_000)data[id]=ctx;try{await chrome.storage.session.set({activeOJTabs:data});}catch{}}
async function saveWatches(){const data={};for(const [id,ctx] of pendingWatches)if(Date.now()-ctx.at<6*60*60_000)data[id]=ctx;try{await chrome.storage.session.set({pendingOJWatches:data});}catch{}}
async function post(path,payload={},token=''){
 const response=await fetch(BASE+path,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','X-Yanpb-Extension':'1',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(payload),signal:AbortSignal.timeout(9000)});
 const data=await response.json();if(!response.ok)throw Error(data.error||('HTTP '+response.status));return data;
}
async function getAuth(){return (await chrome.storage.local.get('bridgeToken')).bridgeToken||'';}
async function pair(pin){const r=await post('/pair',{pin});await chrome.storage.local.set({bridgeToken:r.token});lastStatus='授权成功 · 已连接 CodeLab';void poll();return lastStatus;}
function allowedTab(platform,url){try{const u=new URL(url);return u.protocol==='https:'&&({'codeforces':['codeforces.com','www.codeforces.com'],'atcoder':['atcoder.jp','www.atcoder.jp'],'luogu':['www.luogu.com.cn','luogu.com.cn']}[platform]||[]).includes(u.hostname);}catch{return false;}}
function targetPath(job){const u=new URL(job.submitUrl);return u.origin+u.pathname;}
async function awaitLoaded(tabId,timeout=22000){const start=Date.now();while(Date.now()-start<timeout){const t=await chrome.tabs.get(tabId);if(t.status==='complete')return t;await new Promise(r=>setTimeout(r,400));}throw Error('官网页面加载超时');}
// The browser extension never fills source code or clicks official submission.
// It only connects an already-opened official submission page to a verified
// submission-detail watcher. User auth/CAPTCHA/submit remain in the browser.
async function attachPendingTab(tabId,url){
 await restoreTabs();
 const matches=[...pendingWatches.entries()].filter(([,ctx])=>allowedTab(ctx.platform,url)&&new URL(url).pathname===new URL(ctx.target).pathname);
 if(matches.length!==1)return false; // Never guess between two source/contest tasks.
 const [id,ctx]=matches[0];pendingWatches.delete(id);
 activeTabs.set(tabId,{jobId:id,kind:'watch',allowReceipt:true,platform:ctx.platform,contestId:ctx.contestId,token:ctx.token,at:ctx.at});
 await Promise.all([saveTabs(),saveWatches()]);
 await post('/event',{id,kind:'awaiting-user',reason:'official-submit-tab-attached'},ctx.token).catch(()=>{});
 lastStatus='已连接官方提交页；等待用户提交及官方判题';
 return true;
}
// If the browser worker wakes only AFTER a successful submission redirect,
// accept the detail page only if its official Task row proves exact identity.
// Never associate a Codeforces detail by contest alone, or guess among jobs.
async function attachPendingDetailTab(tabId,url){
 await restoreTabs();
 const candidates=[...pendingWatches.entries()].filter(([,ctx])=>ctx.platform!=='codeforces'&&allowedTab(ctx.platform,url));
 if(!candidates.length)return false;
 const current=new URL(url),path=current.pathname;
 const isDetail=candidates.some(([,ctx])=>ctx.platform==='atcoder'?/^\/contests\/[\w-]+\/submissions\/\d+\/?$/.test(path):/^\/record\/\d+\/?$/.test(path));
 if(!isDetail)return false;
 let raw;
 try{raw=(await chrome.scripting.executeScript({target:{tabId},world:'MAIN',func:inspectVerdictPage}))[0]?.result;}catch{return false;}
 if(!raw||raw.urls?.length!==1||!raw.text)return false;
 const matches=candidates.filter(([,ctx])=>{
   try{const task=new URL(raw.urls[0]);return ctx.problemId&&ctx.problemId===(ctx.platform==='atcoder'?task.pathname.split('/').pop():task.pathname.split('/').pop())&&(!ctx.contestId||ctx.platform!=='atcoder'||path.startsWith('/contests/'+ctx.contestId+'/'));}catch{return false;}
 });
 if(matches.length!==1)return false;
 const [id,ctx]=matches[0];
 pendingWatches.delete(id);
 const entry={jobId:id,kind:'watch',allowReceipt:true,platform:ctx.platform,contestId:ctx.contestId,token:ctx.token,at:ctx.at};
 activeTabs.set(tabId,entry);
 await Promise.all([saveTabs(),saveWatches()]);
 await tryReceipt(tabId,url); // Service will still verify ID, contest and exact task.
 return true;
}
async function runJob(job,token){
 await restoreTabs();
 if(job.kind==='watch'){
  // CodeLab opens the website in the DEFAULT browser. Do not create a second
  // tab: an unwatched duplicate was the chief cause of missing verdicts.
  pendingWatches.set(job.id,{platform:job.platform,contestId:job.contestId,problemId:job.problemId,token,target:targetPath(job),at:Date.now()});
  await saveWatches();
  const tabs=await chrome.tabs.query({});
  for(const tab of tabs){if(tab.id&&(await attachPendingTab(tab.id,tab.url||'')||await attachPendingDetailTab(tab.id,tab.url||'')))break;}
  if(pendingWatches.has(job.id))lastStatus='已收到 CodeLab 监听任务，等待浏览器打开官方提交页';
  return;
 }
 const tabs=await chrome.tabs.query({});
 const target=targetPath(job);
 let tab=tabs.find(t=>allowedTab(job.platform,t.url||'')&&(t.url||'').split('?')[0]===target);
 if(!tab)tab=await chrome.tabs.create({url:target,active:true});
 await awaitLoaded(tab.id);
 activeTabs.set(tab.id,{jobId:job.id,kind:'watch',allowReceipt:true,platform:job.platform,
   contestId:job.contestId,token,at:Date.now()});
 await saveTabs();
 await post('/event',{id:job.id,kind:'awaiting-user',reason:'official-browser-submit-page-open'},token);
 const current=await chrome.tabs.get(tab.id).catch(()=>null);
 if(current?.url)void tryReceipt(tab.id,current.url);
 lastStatus='已打开官网提交页；提交需用户确认，插件只监测官方结果';
}
async function poll(){if(busy)return lastStatus;busy=true;let claimed=null,token='';
 try{
  token=await getAuth();if(!token){lastStatus='未授权：先在 CodeLab 获取配对码';return lastStatus;}
  const data=await post('/next',{},token);claimed=data.job;
  if(claimed)await runJob(claimed,token);
  else lastStatus='已连接 CodeLab，等待官网提交任务';
 }catch(e){
  const problem=e?.message||String(e);
  lastStatus=/fetch failed|Failed to fetch|NetworkError|timed out|Timeout/i.test(problem)?'无法访问 127.0.0.1:10045，请先启动 CodeLab':
  /different browser extension|not authenticated|401|403/i.test(problem)?'浏览器授权已失效：在 CodeLab 重新配对':'连接/监听异常：'+problem;
  if(claimed&&token)await post('/retry',{id:claimed.id},token).catch(()=>{});
 }finally{busy=false;}return lastStatus;
}
async function getConnection(){
 const token=await getAuth();if(!token)return {status:'未配对',paired:false,detail:'在 CodeLab 极速 OJ → 连接浏览器扩展中获取 6 位 PIN。'};
 try{const x=await post('/heartbeat',{},token);return {status:'✓ CodeLab 已连接',paired:true,detail:'桥接端口 '+x.port+' · 待领取 '+x.pending+' 条 · 当前监听 '+x.watching+' 条 · '+lastStatus};}
 catch(e){const msg=String(e.message||e);return {status:/not authenticated|different browser extension|401|403/.test(msg)?'授权失效，需要重新配对':'本机桥接不可用',paired:!/not authenticated|different browser extension|401|403/.test(msg),detail:msg+'；检查 CodeLab 是否运行，以及端口 10045 是否被占用。'};}
}
async function inspectOfficialVerdict(tabId,ctx,url){
 if(ctx.finalVerdict)return;
 if(verdictInspections.has(tabId))return;
 verdictInspections.add(tabId);
 try{const [result]=await chrome.scripting.executeScript({target:{tabId},world:'MAIN',func:inspectVerdictPage});
  const raw=result?.result;
  if(!raw||!raw.currentUrl||raw.urls?.length!==1||!raw.text){lastStatus='尚未读到唯一的官方状态和题目：请打开本次 Submission 详情页';return;}
  // Query strings, locale parameters and anchors don't change the record identity.
  const actual=new URL(raw.currentUrl),expected=new URL(url);
  if(actual.origin!==expected.origin||actual.pathname.replace(/\/$/,'')!==expected.pathname.replace(/\/$/,''))return;
  if(ctx.lastVerdict===raw.text&&Date.now()-(ctx.lastVerdictAt||0)<25000)return;
  const reply=await post('/event',{id:ctx.jobId,kind:'verdict',url,problemUrl:raw.urls[0],verdict:raw.text},ctx.token);
  if(reply?.ok){
   ctx.lastVerdict=raw.text;ctx.lastVerdictAt=Date.now();
   if(/^(?:AC|WA|TLE|MLE|RE|CE|OLE|PE|IE|UKE|Accepted|Wrong Answer|Time Limit Exceeded|Memory Limit Exceeded|Runtime Error|Compilation Error|Compile Error|Output Limit Exceeded|Partially Correct|System Error|Internal Error|Idleness Limit Exceeded|Security Violated|Skipped|Rejected|Failed|Challenged)$/i.test(raw.text))ctx.finalVerdict=raw.text;
   await saveTabs();
   lastStatus='官方状态已同步：'+raw.text+' · '+ctx.platform.toUpperCase();
   await chrome.storage.local.set({lastOfficialSync:{platform:ctx.platform,verdict:raw.text,url,at:Date.now()}}).catch(()=>{});
  }
  if(reply?.ok&&/^(?:AC|WA|TLE|MLE|RE|CE|OLE|Accepted|Wrong Answer|Time Limit Exceeded|Memory Limit Exceeded|Runtime Error|Compilation Error|Compile Error|Output Limit Exceeded)$/i.test(raw.text)){
    const notifyEnabled=(await chrome.storage.local.get('notifyVerdicts')).notifyVerdicts!==false;
    if(!notifyEnabled)return;
    const key='official-alert-'+ctx.platform+':'+url+':'+raw.text;
    const cache=await chrome.storage.session.get(key);
    if(!cache[key]){
      await chrome.storage.session.set({[key]:true});
      chrome.notifications?.create(key,{type:'basic',iconUrl:'icons/48.png',title:'Yanpb CodeLab · 官方结果',message:ctx.platform.toUpperCase()+'：'+raw.text.trim().slice(0,65)},()=>{});
    }
  }
 }catch(e){lastStatus='官网结果暂未核对：'+e.message;}finally{verdictInspections.delete(tabId);}
}
async function tryReceipt(tabId,url){
 await restoreTabs();const ctx=activeTabs.get(tabId);if(!ctx||!ctx.allowReceipt||ctx.receiptUrl||Date.now()-ctx.at>6*60*60_000)return;
 try{const u=new URL(url);if(!allowedTab(ctx.platform,u.toString()))return;
  const pathname=u.pathname;
  const parsed=ctx.platform==='codeforces'?pathname.match(/^\/(?:contest|gym)\/(\d+)\/submission\/(\d+)\/?$/)||pathname.match(/^\/problemset\/submission\/(\d+)\/(\d+)\/?$/):ctx.platform==='atcoder'?pathname.match(/^\/contests\/([\w-]+)\/submissions\/(\d+)\/?$/):pathname.match(/^\/record\/(\d+)\/?$/);
  if(!parsed)return;
  if(ctx.platform!=='luogu'&&String(parsed[1])!==String(ctx.contestId))return;
  const receiptUrl=u.origin+pathname;
  const response=await post('/event',{id:ctx.jobId,kind:'receipt',url:receiptUrl},ctx.token);
  if(!response?.ok)return;
  ctx.receiptUrl=receiptUrl;await saveTabs();
  await installResultObserver(tabId,ctx);
  lastStatus='已回传官方 Submission ID，等待题号与评测核对';
  setTimeout(()=>void inspectOfficialVerdict(tabId,ctx,receiptUrl),1200);
 }catch(e){lastStatus='Submission ID 回传失败：'+e.message;}
}
// Lightweight MutationObserver wakes the MV3 service worker when a dynamic OJ
// replaces Judging with AC. No polling of hidden account data or cookies.
async function installResultObserver(tabId,ctx){
 if(observerTabs.has(tabId))return;
 try{
  await chrome.scripting.executeScript({target:{tabId},files:['detail-observer.js']});
  observerTabs.add(tabId);
 }catch(e){lastStatus='网页实时提醒不可用，仍会定期检查：'+e.message;}
}
// Recover navigations missed while Chrome's MV3 worker was asleep. Also read
// the same submission detail again after a page updates in place.
async function recoverWatchedPages(){
 await restoreTabs();
 if(pendingWatches.size){for(const tab of await chrome.tabs.query({}).catch(()=>[])){if(!activeTabs.has(tab.id)&&tab.url)await attachPendingDetailTab(tab.id,tab.url);}}
 for(const [tabId,ctx] of activeTabs){
  if(Date.now()-ctx.at>6*60*60_000)continue;
  const tab=await chrome.tabs.get(tabId).catch(()=>null);
  if(!tab?.url||!allowedTab(ctx.platform,tab.url))continue;
  if(!ctx.receiptUrl){await tryReceipt(tabId,tab.url);}
  else {
   const actual=new URL(tab.url),receipt=new URL(ctx.receiptUrl);
   if(actual.origin===receipt.origin&&actual.pathname.replace(/\/$/,'')===receipt.pathname.replace(/\/$/,'')){
    await installResultObserver(tabId,ctx);
    await inspectOfficialVerdict(tabId,ctx,ctx.receiptUrl);
   }
  }
 }
}
// Track a new official tab opened by the OJ submit flow from an observed tab.
chrome.tabs.onCreated.addListener(tab=>{
 void (async()=>{await restoreTabs();const previous=activeTabs.get(tab.openerTabId);if(!previous)return; // The new tab may initially be about:blank; URL validated at receipt time.
  activeTabs.set(tab.id,{...previous,receiptUrl:null,at:Date.now()});await saveTabs();
 })();
});
chrome.tabs.onUpdated.addListener((id,change,tab)=>{
 void (async()=>{await restoreTabs();let ctx=activeTabs.get(id);
  const currentUrl=change.url||tab?.url||'';
  if(!ctx&&currentUrl){if(!await attachPendingTab(id,currentUrl))await attachPendingDetailTab(id,currentUrl);ctx=activeTabs.get(id);}
  if(!ctx)return;
  // Some sites finish navigation before the listener attaches. Retry on complete.
  if(change.url)observerTabs.delete(id);
  if(currentUrl && !ctx.receiptUrl)await tryReceipt(id,currentUrl);
  if(change.status==='complete'&&ctx.receiptUrl){await installResultObserver(id,ctx);await inspectOfficialVerdict(id,ctx,ctx.receiptUrl);}
 })();
});
chrome.tabs.onRemoved.addListener(id=>{activeTabs.delete(id);observerTabs.delete(id);void saveTabs();});
chrome.runtime.onMessage.addListener((message,_sender,respond)=>{
 (async()=>{if(message.op==='pair')return {status:await pair(message.pin),paired:true};
  if(message.op==='status')return getConnection();
  if(message.op==='poll'){await poll();await recoverWatchedPages();return {...await getConnection(),detail:lastStatus};}
  if(message.op==='page-verdict-changed'){
   const tabId=_sender?.tab?.id,ctx=activeTabs.get(tabId);
   if(!ctx||!ctx.receiptUrl||!allowedTab(ctx.platform,_sender?.tab?.url||''))return {ok:false};
   await inspectOfficialVerdict(tabId,ctx,ctx.receiptUrl);
   return {ok:true};
  }
  return {error:'unknown operation'};})().then(respond,e=>respond({error:e.message}));return true;
});
chrome.alarms.create('yanpb-bridge-wake',{periodInMinutes:0.5});
chrome.alarms.onAlarm.addListener(a=>{if(a.name==='yanpb-bridge-wake'){void poll();void recoverWatchedPages();}});
chrome.runtime.onStartup.addListener(()=>void poll());
chrome.runtime.onInstalled.addListener(()=>void poll());
// Fast polling while the browser service worker is alive; 30-second alarm is
// a fallback when Chrome suspends this worker. Extensions cannot promise a
// guaranteed 1-second delivery while background workers are suspended.
setInterval(()=>void poll(),2500);
setInterval(()=>void recoverWatchedPages(),7000);
void poll();
