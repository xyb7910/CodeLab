'use strict';
// Electron-only module. A one-click action uses the user's authenticated official
// form and fails closed on task/language/CAPTCHA ambiguity. No cookie extraction.
// A click is an ATTEMPT, not an official accepted submission or verdict.
const {BrowserWindow,session}=require('electron');
const {sourcePayload,officialHost,asOfficialLink,normalizeOfficialStatus}=require('./official-session.cjs');
const {submissionCandidatesScript,detailProblemScript,problemFromURL}=require('./submission-detector.cjs');
const active=new Map();
const platformNames={codeforces:'Codeforces',atcoder:'AtCoder',luogu:'洛谷'};
function emit(parent,name,data){if(parent&&!parent.isDestroyed())parent.webContents.send('local:ojOfficialEvent',{kind:name,...data});}
function ensureOfficial(browser,platform){if(!browser||browser.isDestroyed()||!officialHost(platform,browser.webContents.getURL()))throw Error('当前页面不是受信任的官方 OJ 页面');}
function selectedSourceScript(code,platform,problemId){
 // JSON literals are serialized before the script crosses to the untrusted OJ page.
 const payload=JSON.stringify({code,platform,problemId});
 return `(()=>{ const data=${payload};let method='';let box=null;
  // Select only the exact task in the official form. Never guess a different
  // target and never submit the form programmatically.
  const taskId=data.platform==='codeforces'?data.problemId.split('/').pop():data.problemId;
  const taskField=data.platform==='atcoder'?document.querySelector('select[name="data.TaskScreenName"]'):
    data.platform==='codeforces'?document.querySelector('select[name="submittedProblemIndex"],select[name="problemIndex"]'):null;
  let taskSelection='manual-check-required';
  if(taskField){const option=Array.from(taskField.options).find(o=>o.value===taskId);
    if(!option)return {filled:false,taskSelection:'mismatch',message:'当前官方页面未提供目标题号，请检查比赛与题目，暂不填充代码。'};
    if(taskField.value!==option.value){taskField.value=option.value;taskField.dispatchEvent(new Event('change',{bubbles:true}));}
    taskSelection='selected';}

  // Official forms can change at any time; fill only and never press submit.
  const cm=document.querySelector('.CodeMirror')?.CodeMirror;
  if(cm?.setValue){cm.setValue(data.code);cm.focus();method='CodeMirror';}
  else if(globalThis.monaco?.editor?.getEditors?.()?.length){
    const monacoEditor=globalThis.monaco.editor.getEditors()[0];monacoEditor.setValue(data.code);monacoEditor.focus();method='Monaco';
  }
  else {
    const selectors={codeforces:'textarea[name="source"],textarea[name="sourceCode"],textarea#sourceCodeTextarea,textarea#source',atcoder:'textarea#plain-textarea,textarea[name="sourceCode"],textarea#sourceCode',luogu:'textarea[name="code"],textarea#code'};
    box=document.querySelector(selectors[data.platform]||'');
    if(box){const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')?.set;setter?.call(box,data.code);if(!setter)box.value=data.code;box.dispatchEvent(new Event('input',{bubbles:true}));box.dispatchEvent(new Event('change',{bubbles:true}));box.focus();method='textarea';}
  }
  if(!method)return {filled:false,message:'未找到网站的可编辑源码控件。可从 CodeLab 复制源码后手动粘贴。'};
  // Do not auto-choose a compiler language or submit the form: OJ languages
  // and authentication/captcha are subject to ongoing site changes.
  return {filled:true,method,taskSelection,message:taskSelection==='selected'?'已选择目标题号并填入源码；请核对 C++ 语言并亲自提交。':'源码已填入，题号需在官网人工核对，然后亲自提交。'};
 })()`;
}
function guardedSubmitScript(platform,problemId){
 const payload=JSON.stringify({platform,problemId});
 return String.raw`(()=>{const info=${payload};
   if(!['codeforces','atcoder'].includes(info.platform))return {attempted:false,reason:'unsupported-platform'};
   const page=location.pathname;
   const expectedContest=info.platform==='codeforces'?info.problemId.split('/')[0]:info.problemId.replace(/_[^_]+$/,'');
   const actualContest=info.platform==='codeforces'?page.match(/^\/(?:contest|gym)\/(\d+)\/submit\/?$/)?.[1]:page.match(/^\/contests\/([\w-]+)\/submit\/?$/)?.[1];
   if(!actualContest||actualContest!==expectedContest)return {attempted:false,reason:'contest-unverified'};
   if(info.platform==='codeforces'&&!/^\/(?:contest|gym)\/\d+\/submit\/?$/.test(page))return {attempted:false,reason:'not-submit-form'};
   if(info.platform==='atcoder'&&!/^\/contests\/[\w-]+\/submit\/?$/.test(page))return {attempted:false,reason:'not-submit-form'};
   // If any human verification is shown, the user must handle it personally.
   const verify=document.querySelector('iframe[src*="recaptcha"],iframe[src*="hcaptcha"],.g-recaptcha,.h-captcha,[data-sitekey],#cf-turnstile');
   if(verify)return {attempted:false,reason:'captcha-required'};
   const taskName=info.platform==='codeforces'?info.problemId.split('/').pop():info.problemId;
   const task=document.querySelector(info.platform==='codeforces'?'select[name="submittedProblemIndex"],select[name="problemIndex"]':'select[name="data.TaskScreenName"]');
   if(!task||task.value!==taskName)return {attempted:false,reason:'task-unverified'};
   const source=document.querySelector(info.platform==='codeforces'?'textarea[name="source"],textarea[name="sourceCode"],#sourceCodeTextarea':'textarea#plain-textarea,textarea[name="sourceCode"],textarea#sourceCode');
   // CodeMirror often keeps its source in an underlying textarea. Never submit
   // if there is no positive evidence of a populated code widget.
   const cm=document.querySelector('.CodeMirror')?.CodeMirror;
   if(!(cm?.getValue?.()?.trim()||source?.value?.trim()))return {attempted:false,reason:'source-missing'};
   const lang=document.querySelector(info.platform==='codeforces'?'select[name="programTypeId"]':'select[name="data.LanguageId"]');
   if(!lang)return {attempted:false,reason:'language-unverified'};
   const selected=[...lang.options].find(o=>/(?:GNU C\+\+\s*17|C\+\+\s*17|G\+\+\s*17)/i.test(o.textContent||''));
   if(!selected)return {attempted:false,reason:'cpp17-language-unavailable'};
   if(lang.value!==selected.value){lang.value=selected.value;lang.dispatchEvent(new Event('change',{bubbles:true}));}
   const picked=lang.selectedOptions?.[0];
   if(!picked||!/C\+\+\s*17/i.test(picked.textContent||''))return {attempted:false,reason:'cpp-language-unverified'};
   const form=task.closest('form')||lang.closest('form');
   if(!form)return {attempted:false,reason:'submit-form-missing'};
   const buttons=[...form.querySelectorAll('button[type="submit"],input[type="submit"]')].filter(el=>!el.disabled);
   if(buttons.length!==1)return {attempted:false,reason:'submit-button-ambiguous'};
   const button=buttons[0];
   // Human confirmation was the explicit "One-click Submit" action in CodeLab.
   // We do not bypass CAPTCHAs, login or rate limits, nor claim server success.
   button.click();return {attempted:true,reason:'official-button-clicked',language:picked.textContent?.trim().slice(0,90)};
 })()`;
}
function statusReadScript(platform){
 return `(()=>{const roots=${JSON.stringify(platform==='atcoder'?['#judge-status','[data-submission-status]','.judge-status','.submission-status','.status']:['[data-record-status]','.record-status','.status','.judge-status'])};
  let found=null;
  for(const sel of roots){for(const el of document.querySelectorAll(sel)){const t=el.textContent?.trim().slice(0,120);if(t&&el.getClientRects().length){found=t;break;}}if(found)break;}
  return {text:found||null,title:document.title.slice(0,180),url:location.href};
 })()`;
}
function createOfficialBrowser(parent,raw,options={}){
 const data=sourcePayload(raw);
 if(!platformNames[data.platform]||!data.supported)throw Error('该 OJ 暂不支持内嵌提交，仅提供复制源码和官方网页链接');
 const old=active.get(data.platform);if(old&&!old.window.isDestroyed())old.window.close();
 const notify=(kind,detail={})=>{const msg={platform:data.platform,fastId:options.fastId||'',...detail};emit(parent,kind,msg);if(options.onEvent)Promise.resolve().then(()=>options.onEvent({kind,...msg})).catch(()=>{});};
 const profile=session.fromPartition('persist:yanpb-oj-'+data.platform,{cache:true});
 profile.setPermissionRequestHandler((_w,_permission,callback)=>callback(false));
 const browser=new BrowserWindow({parent,width:1110,height:810,minWidth:800,minHeight:620,show:false,
  title:'Yanpb CodeLab · '+platformNames[data.platform]+' 官方提交',
  webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,webviewTag:false,partition:'persist:yanpb-oj-'+data.platform,spellcheck:false}});
 browser.webContents.on('before-input-event',(event,input)=>{
   if(input.type==='keyDown'&&input.control&&input.shift&&input.key==='Enter'){event.preventDefault();void fillSource(data.platform).catch(err=>notify('fill-error',{message:err.message}));}
 });
 browser.webContents.setWindowOpenHandler(({url})=>{if(officialHost(data.platform,url)){void browser.loadURL(url);return {action:'deny'};}notify('external-navigation-blocked');return {action:'deny'};});
 browser.webContents.on('will-navigate',(e,url)=>{if(!officialHost(data.platform,url)){e.preventDefault();notify('external-navigation-blocked');}});
 browser.webContents.on('did-navigate',(_e,url)=>{notify('navigation',{url});});
 browser.webContents.on('did-navigate-in-page',(_e,url)=>notify('navigation',{url}));
 let autoFillPending=options.autoFill===true;
 let oneClickPending=options.oneClick===true;
 browser.webContents.on('did-finish-load',()=>{
   if(autoFillPending){
    const current=browser.webContents.getURL();
    const currentPath=(()=>{try{return new URL(current).pathname;}catch{return '';}})();
    const onForm=officialHost(data.platform,current)&&(
      data.platform==='luogu'?/^\/problem\/[PBTU]\d+\/?$/i.test(currentPath):/\/submit\/?$/.test(currentPath));
    if(onForm){
      // Only fill a form; do not select final submit or circumvent login/CAPTCHA.
      setTimeout(()=>{if(browser.isDestroyed())return;
        void fillSource(data.platform).then(result=>{
          if(result.filled){autoFillPending=false;notify('auto-fill',result);
            if(oneClickPending){oneClickPending=false;
              void browser.webContents.executeJavaScript(guardedSubmitScript(data.platform,data.problemId),true)
                .then(outcome=>notify(outcome.attempted?'official-submit-attempt':'official-submit-blocked',outcome))
                .catch(e=>notify('official-submit-blocked',{attempted:false,reason:e.message}));
            }
          }
        }).catch(e=>notify('fill-error',{message:e.message}));
      },500);
    }
   }
   // An official /submissions/:id or /record/:id detail page can provide the
   // verdict. Do not treat a loaded submit form as a successful submission.
   void inspectCurrent(data.platform).then(result=>{if(result?.confirmed)notify('verdict',result);}).catch(()=>{});
   // On the official submission list, discover candidates rather than assuming
   // the latest row belongs to the code just submitted. The ledger chooses only
   // unambiguous, task-compatible records; otherwise the user sees candidates.
   if(options.fastId)void discoverCurrentSubmissions(data.platform).then(result=>{
      if(result.candidates.length)notify('submission-candidates',result);
   }).catch(()=>{});
 });
 browser.webContents.on('did-fail-load',(_e,code,description,url)=>{if(code!==-3)notify('navigation-error',{message:description,url});});
 browser.on('closed',()=>{if(active.get(data.platform)?.window===browser)active.delete(data.platform);notify('closed');});
 browser.once('ready-to-show',()=>browser.show());
 active.set(data.platform,{window:browser,data,fastId:options.fastId||'',onEvent:options.onEvent});
 void browser.loadURL(data.url).catch(e=>notify('navigation-error',{message:e.message}));
 return {platform:data.platform,problemId:data.problemId,url:data.url,login:'on-official-page',flow:'embedded-official-browser'};
}
async function discoverCurrentSubmissions(platform){
 const entry=active.get(platform);if(!entry)throw Error('Official window closed');
 ensureOfficial(entry.window,platform);
 const url=entry.window.webContents.getURL();
 let receipt=null;try{receipt=asOfficialLink(platform,url);}catch{}
 if(receipt){
  const result=await entry.window.webContents.executeJavaScript(detailProblemScript(platform),true);
  // Trust the page only for suggestions, not as proof of a successful submit.
  const matched=(result?.problemUrls||[]).map(link=>problemFromURL(platform,link)).filter(Boolean);
  return {pageUrl:url,candidates:[{url:receipt.url,problemId:new Set(matched).size===1?matched[0]:null,source:'detail'}]};
 }
 const pathname=new URL(url).pathname;
 const allowed=platform==='codeforces'?/^\/(?:contest|gym)\/\d+\/(?:my|status)\/?$/.test(pathname):
   platform==='atcoder'?/^\/contests\/[\w-]+\/submissions(?:\/me)?\/?$/.test(pathname):
   /^\/(?:record|user)\//.test(pathname);
 if(!allowed)return {pageUrl:url,candidates:[]};
 const result=await entry.window.webContents.executeJavaScript(submissionCandidatesScript(platform),true);
 if(result?.pageUrl!==url || !officialHost(platform,result.pageUrl))return {pageUrl:url,candidates:[]};
 const candidates=(result?.candidates||[]).slice(0,20).filter(x=>typeof x.url==='string').map(x=>({url:x.url,problemId:problemFromURL(platform,x.problemUrl),source:'list'}));
 return {pageUrl:url,candidates};
}
async function fillSource(platform){
 const entry=active.get(platform);if(!entry)throw Error('请先打开 OJ 官方提交窗口');
 ensureOfficial(entry.window,platform);
 const pathname=new URL(entry.window.webContents.getURL()).pathname;
 const permitted=platform==='luogu'?/^\/problem\/[PBTU]\d+\/?$/i.test(pathname):/\/submit\/?$/.test(pathname);
 if(!permitted)throw Error('只有在官方提交页面才能填入代码，禁止将代码写入题解或提交详情页');
 const result=await entry.window.webContents.executeJavaScript(selectedSourceScript(entry.data.code,platform,entry.data.problemId),true);
 emit(entry.window.getParentWindow(),'fill',{platform,fastId:entry.fastId||'',...result});
 if(entry.onEvent)await entry.onEvent({kind:'fill',platform,fastId:entry.fastId||'',...result});return result;
}
async function inspectCurrent(platform){
 const entry=active.get(platform);if(!entry)throw Error('OJ 页面尚未打开');
 ensureOfficial(entry.window,platform);const url=entry.window.webContents.getURL();
 let detail;try{detail=asOfficialLink(platform,url);}catch{return {confirmed:false,reason:'not-submission-detail',url};}
 if(platform==='codeforces')return {confirmed:false,reason:'requires-handle-for-api',detail};
 const raw=await entry.window.webContents.executeJavaScript(statusReadScript(platform),true);
 const identity=await entry.window.webContents.executeJavaScript(detailProblemScript(platform),true);
 const observed=(identity?.problemUrls||[]).map(link=>problemFromURL(platform,link)).filter(Boolean);
 const problemId=new Set(observed).size===1?observed[0]:null;
 if(!officialHost(platform,raw.url)||raw.url!==url)throw Error('官方页面在读取过程中发生变化');
 const verdict=normalizeOfficialStatus(raw.text);
 return {confirmed:!!verdict,platform,id:detail.id,verdict,rawText:raw.text||'',problemId,sourceUrl:url,method:'official-dom',reason:verdict?'':'status-not-found'};
}
async function navigate(platform,url){const entry=active.get(platform);if(!entry||entry.window.isDestroyed())throw Error('OJ 页面尚未打开');if(!officialHost(platform,url))throw Error('禁止跳转到非官方地址');await entry.window.loadURL(url);return true;}
function getCurrent(platform){const x=active.get(platform);return x&&!x.window.isDestroyed()?x.window.webContents.getURL():null;}
function closeAll(){for(const x of active.values())if(!x.window.isDestroyed())x.window.close();active.clear();}
module.exports={guardedSubmitScript,createOfficialBrowser,fillSource,inspectCurrent,discoverCurrentSubmissions,getCurrent,navigate,closeAll,selectedSourceScript,statusReadScript};
