'use strict';
const {app,BrowserWindow,Menu,dialog,ipcMain,shell,session,clipboard} = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const syncFs = require('node:fs');
const runner=require('../runner/local-runner.cjs');
const fileOps=require('./file-operations.cjs');
const {createReceiver}=require('../cph/receiver.cjs');
const {createInbox}=require('../cph/inbox.cjs');
const competition=require('../contest/competition.cjs');
const {createStore}=require('../history/store.cjs');
const debugTrace=require('../debug/trace.cjs');
const {ClangdSession,bundledPath}=require('../language/clangd.cjs');
const {GdbSession}=require('../debug/mi-session.cjs');
const macTools=require('../runner/mac-toolchain.cjs');
const {routeProblem}=require('../oj/submit-bridge.cjs');
const official=require('../oj/official-session.cjs');
const officialWindow=require('../oj/official-browser.cjs');
const fastSubmit=require('../oj/fast-submit.cjs');
const {createBrowserBridge}=require('../oj/browser-bridge.cjs');
let win=null,task=null,companion=null,liveLanguage=null,interactiveDebug=null,ojBridge=null,ojBridgeStartupError='';
const companionInbox=createInbox(40);
let lastCodeforcesRequest=0;
const root=path.join(__dirname,'..','renderer');
// Preserve existing v3.3 editor drafts and preferences after shortening the
// installer product name to avoid GCC linker paths containing spaces.
const legacyProfile=path.join(app.getPath('appData'),'Yanpb CodeLab Local');
if(syncFs.existsSync(legacyProfile))app.setPath('userData',legacyProfile);
app.setAppUserModelId('cn.yanpb.codelab.local');
const hasLock=app.requestSingleInstanceLock();
if(!hasLock)app.quit();
else app.on('second-instance',()=>{if(win){win.restore();win.focus();}});
function isTrusted(event) { return win && !win.isDestroyed() && event.sender===win.webContents && event.senderFrame?.url?.startsWith('file://') && event.senderFrame.url.endsWith('/renderer/index.html'); }
function trusted(event) {if(!isTrusted(event))throw Error('未经授权的页面调用');}
function prefsFile(){return path.join(app.getPath('userData'),'local-ide-settings.json');}
async function getPrefs(){let p={};try{p=JSON.parse(await fs.readFile(prefsFile(),'utf8'));}catch{}return {...p,compiler:'bundled',std:runner.cleanedStandard(p.std||'c++17'),theme:['dark','light'].includes(p.theme)?p.theme:'dark'};}
async function savePrefs(p){const old=await getPrefs();runner.assertBundledRequest(p.compiler,{strict:true});const next={compiler:'bundled',std:runner.cleanedStandard(p.std),theme:['dark','light'].includes(p.theme)?p.theme:'dark'};await fs.mkdir(path.dirname(prefsFile()),{recursive:true});await fs.writeFile(prefsFile(),JSON.stringify({...old,...next},null,2),'utf8');return next;}
const revisions=createStore(path.join(app.getPath('userData'),'code-history'));
const fastLedger=fastSubmit.store(path.join(app.getPath('userData'),'oj-fast-submit'));
function desktopEvent(name,data){if(win&&!win.isDestroyed())win.webContents.send(name,data);}
async function clearLanguage(){if(liveLanguage){const x=liveLanguage;liveLanguage=null;await x.stop();}}
async function clearDebug(){if(interactiveDebug){const x=interactiveDebug;interactiveDebug=null;await x.stop();}}
async function fastOfficialEvent(event){
 if(!event.fastId)return;
 try{
  if((event.kind==='auto-fill'||event.kind==='fill')&&event.filled){
   const updated=await fastLedger.markFilled(event.fastId,true);
   desktopEvent('local:fastReceiptDetected',{kind:'filled',row:updated});
   return;
  }
  if(event.kind==='official-submit-attempt'||event.kind==='official-submit-blocked'){
   desktopEvent('local:fastReceiptDetected',{kind:event.kind,id:event.fastId,reason:event.reason,attempted:!!event.attempted});return;
  }
  if(event.kind==='submission-candidates'){
   const row=await fastLedger.detectReceipts(event.fastId,event.candidates);
   desktopEvent('local:fastReceiptDetected',{kind:'candidates',row});
   // Official DOM verdict remains provisional until problem identity matches.
   if(row.receipt&&row.platform!=='codeforces'){
    const detail=await officialWindow.inspectCurrent(row.platform).catch(()=>null);
    if(detail?.confirmed&&String(detail.id)===String(row.receipt.id)){
     const checked=await fastLedger.applyVerdict(row.id,detail);
     desktopEvent('local:fastReceiptDetected',{kind:'verdict',row:checked});
    }
   }
  }
 }catch(err){desktopEvent('local:fastReceiptDetected',{kind:'warning',id:event.fastId,message:err.message});}
}

// Browser submission is a separate trusted opt-in extension, NOT Competitive
// Companion. Auth persists between restarts; no password/cookie is handled.
const bridgeAuthFile=path.join(app.getPath('userData'),'oj-browser-bridge-auth.json');
async function setupOJBridge(){
 let saved=null;try{const v=JSON.parse(await fs.readFile(bridgeAuthFile,'utf8'));if(/^[a-f0-9]{64}$/.test(v.token||'')&&typeof v.origin==='string')saved=v;}catch{}
 ojBridge=createBrowserBridge({credentials:saved,onPaired:async creds=>{await fs.mkdir(path.dirname(bridgeAuthFile),{recursive:true});await fs.writeFile(bridgeAuthFile,JSON.stringify(creds),{encoding:'utf8',mode:0o600});},onEvent:async event=>{
  try{let row;
    if(event.kind==='filled')row=await fastLedger.markFilled(event.id,true);
    else if(event.kind==='awaiting-user')desktopEvent('local:fastReceiptDetected',{kind:'awaiting-user',id:event.id});
    else if(event.kind==='receipt')row=await fastLedger.linkReceipt(event.id,event.url);
    else if(event.kind==='verdict') {
      const current=await fastLedger.get(event.id);
      const receipt=official.asOfficialLink(event.platform,event.url);
      if(!current.receipt||current.receipt.id!==receipt.id)throw Error('官方状态的提交 ID 不匹配');
      const parsed=routeProblem(event.problemUrl);
      const verdict=official.normalizeOfficialStatus(event.verdict);
      if(parsed.problemId!==current.problemId||!verdict)throw Error('官方题目或评测状态不匹配');
      row=await fastLedger.applyVerdict(event.id,{platform:event.platform,confirmed:true,id:receipt.id,problemId:parsed.problemId,verdict,sourceUrl:receipt.url});
    }
    if(row)desktopEvent('local:fastReceiptDetected',{kind:event.kind==='receipt'?'receipt':event.kind==='verdict'?'verdict':'filled',row});
    else desktopEvent('local:fastReceiptDetected',{kind:event.kind==='attempted'?'official-submit-attempt':'official-submit-blocked',id:event.id,reason:event.reason,attempted:event.attempted});
  }catch(err){desktopEvent('local:fastReceiptDetected',{kind:'warning',id:event.id,message:err.message});throw err;}
 }});
 try{
  await ojBridge.start();ojBridgeStartupError='';
  // Rebuild watch identities after an IDE restart; browser tabs can survive.
  // Only records that are still awaiting a verified verdict are requeued.
  const rows=(await fastLedger.list()).filter(r=>r?.browserWatch).slice(0,12);
  for(const row of rows){
   if(!row?.id||!row.problemUrl||row.officialVerified||Date.now()-row.createdAt>6*60*60_000)continue;
   try{ojBridge.queueWatch({id:row.id,problemUrl:row.problemUrl,receiptUrl:row.receipt?.url});}catch{}
  }
 }catch(err){ojBridgeStartupError=String(err.message||err);desktopEvent('local:fastReceiptDetected',{kind:'warning',message:'OJ 浏览器桥接启动失败：'+ojBridgeStartupError});}
}

function register() {
  ipcMain.handle('local:clangStart',async(e,args)=>{
    trusted(e);await clearLanguage();
    if(typeof args?.code!=='string'||args.code.length>300000)throw Error('Invalid source');
    runner.assertBundledRequest(args.compiler,{strict:true});
    const cc=await runner.chooseCompiler('bundled');
    const compiler=await runner.compilerPathForUse(cc);
    const tool=process.platform==='win32'?(app.isPackaged?bundledPath():path.join(__dirname,'..','toolchain-clangd','bin','clangd.exe')):process.platform==='darwin'?macTools.findMacTool('clangd'):undefined;
    const w=path.join(app.getPath('userData'),'clangd-workspace');
    const session=new ClangdSession({binary:tool,workspace:w,compiler,standard:runner.cleanedStandard(args.standard)});
    liveLanguage=session;
    session.on('diagnostics',d=>desktopEvent('local:clangDiagnostics',d));
    session.on('warning',message=>desktopEvent('local:clangStatus',{status:'warning',message}));
    session.on('failure',message=>{if(liveLanguage===session)desktopEvent('local:clangStatus',{status:'error',message});});
    try{const info=await session.start();session.open(args.code);return info;}
    catch(err){await clearLanguage();throw err;}
  });
  ipcMain.handle('local:clangChange',async(e,code)=>{
    trusted(e);if(!liveLanguage||!liveLanguage.ready)throw Error('clangd not available');return liveLanguage.change(code);
  });
  ipcMain.handle('local:clangComplete',async(e,args)=>{
    trusted(e);
    if(!liveLanguage?.ready)return {stale:true,items:[]};
    return liveLanguage.completion(args?.line,args?.character,args?.version);
  });
  ipcMain.handle('local:clangStop',async e=>{trusted(e);await clearLanguage();return true;});
  ipcMain.handle('local:debugStart',async(e,args)=>{
    trusted(e);if(task||interactiveDebug)throw Error('Finish the current run/debug session first');
    runner.assertBundledRequest(args?.compiler,{strict:true});
    if(process.platform==='darwin')throw Error('macOS 尚未提供兼容的 GDB/MI 断点会话；请先使用编译运行与 clangd。原生 LLDB 调试将单独适配。');
    const debuggerSession=new GdbSession({...args,compiler:'bundled',breakpoints:args?.breakpoints||[]});interactiveDebug=debuggerSession;
    debuggerSession.on('state',d=>{desktopEvent('local:debugState',d);if(d.status==='exited'&&interactiveDebug===debuggerSession)void clearDebug();});
    debuggerSession.on('console',s=>desktopEvent('local:debugConsole',s));
    debuggerSession.on('warning',s=>desktopEvent('local:debugWarning',s));
    try{const r=await debuggerSession.start();if(r.status==='CE'){await clearDebug();}return r;}
    catch(err){await clearDebug();throw err;}
  });
  ipcMain.handle('local:debugAction',async(e,type,line,detail)=>{trusted(e);if(!interactiveDebug)throw Error('No debugger active');return interactiveDebug.action(type,line,detail);});
  ipcMain.handle('local:debugStop',async e=>{trusted(e);await clearDebug();return true;});
  ipcMain.handle('local:historyCommit',async(e,identity,content,label)=>{trusted(e);return revisions.commit(identity,content,label);});
  ipcMain.handle('local:historyList',async(e,identity)=>{trusted(e);return revisions.list(identity);});
  ipcMain.handle('local:historyMigrate',async(e,from,to)=>{trusted(e);return revisions.migrate(from,to);});
  ipcMain.handle('local:historyRead',async(e,identity,version)=>{trusted(e);return revisions.read(identity,version);});
  ipcMain.handle('local:trace',async(e,params)=>{trusted(e);if(task)throw Error('已有其他编译或运行任务');const job=runner.jobContext();task=job;try{if(process.platform==='darwin')throw Error('macOS 不支持现有 GDB 变量追踪模块；需要 LLDB 专属实现。');runner.assertBundledRequest(params?.compiler,{strict:true});return await debugTrace.trace({...params,compiler:'bundled'},job,d=>{if(win&&!win.isDestroyed())win.webContents.send('local:progress',d);});}finally{task=null;}});
  ipcMain.handle('local:autoSave',async(e,payload)=>{trusted(e);const {filePath,content}=payload||{};if(typeof filePath!=='string'||!path.isAbsolute(filePath)||typeof content!=='string'||Buffer.byteLength(content)>500000)throw Error('自动保存路径或文件大小无效');await fs.writeFile(filePath,content,'utf8');return true;});
  ipcMain.handle('local:contestPresets',async e=>{trusted(e);return competition.PRESETS;});
  ipcMain.handle('local:contestSelectDirectory',async e=>{
    trusted(e);const result=await dialog.showOpenDialog(win,{title:'Select contest workspace folder',properties:['openDirectory','createDirectory']});
    return result.canceled?null:result.filePaths[0];
  });
  ipcMain.handle('local:contestCreate',async(e,base,options)=>{
    trusted(e);return competition.createContest(base,options);
  });
  ipcMain.handle('local:contestOpen',async e=>{
    trusted(e);const r=await dialog.showOpenDialog(win,{title:'Open a Yanpb contest directory',properties:['openDirectory']});
    if(r.canceled)return null;
    return competition.openContest(r.filePaths[0]);
  });
  ipcMain.handle('local:contestRead',async(e,m)=>{
    trusted(e);const verified=await competition.openContest(m.folder);const files=[];
    for(const entry of verified.files){
      let code='';try{code=await fs.readFile(entry.source,'utf8');}catch(err){if(err.code!=='ENOENT')throw err;}
      if(Buffer.byteLength(code)>1024*1024)throw Error('Contest source exceeds 1MB');
      files.push({name:entry.task+'.cpp',fullPath:entry.source,content:code,task:entry.task});
    }
    return {manifest:verified,files};
  });
  ipcMain.handle('local:contestTransition',async(e,m,action)=>{trusted(e);if(!m?.folder)throw Error('Missing contest');return competition.changeContestStatus(m.folder,action);});
  ipcMain.handle('local:contestAudit',async(e,m)=>{trusted(e);return competition.auditSubmission(m);});
  ipcMain.handle('local:contestCheck',async(e,m,taskName,cases,options)=>{
    trusted(e);if(task)throw Error('Another task is running');
    const contestManifest=await competition.openContest(m.folder);competition.assertCspContest(contestManifest);
    runner.assertBundledRequest(options?.compiler,{strict:true});
    const job=runner.jobContext();task=job;
    try{return await competition.verifySubmission(m,taskName,cases,options||{},job,d=>{if(!win?.isDestroyed())win.webContents.send('local:progress',d);});}
    finally{task=null;}
  });
  ipcMain.handle('local:ojBrowserOpen',async(e,info)=>{
    trusted(e);
    const route=routeProblem(info?.url);
    if(!route.supported||!['codeforces','atcoder','luogu'].includes(route.platform))throw Error('当前题目没有受支持的官方提交页面');
    // Prepare an immutable source fingerprint and verified problem association.
    // This is NOT a local judging/submission action and never uploads the code.
    const row=await fastLedger.prepare({url:info.url,code:info.code,fileKey:info.fileKey,fileName:info.fileName});
    let watching=false,reason='';
    if(ojBridge?.status().active){
      try{ojBridge.queueWatch({id:row.id,problemUrl:info.url});watching=true;await fastLedger.markWatching(row.id);}
      catch(err){reason=err.message;}
    } else reason='浏览器监听插件不可用，仍可在官网提交，稍后手动关联记录';
    await shell.openExternal(route.url);
    return {...row,url:route.url,watching,warning:reason};
  });
  ipcMain.handle('local:fastPrepare',async(e,info)=>{
    trusted(e);
    const prepared=await fastLedger.prepare(info);
    if(info?.oneClick && prepared.duplicate)throw Error('同一题目的相同源码在 90 秒内已准备过，已阻止重复一键提交。请先核对提交记录。');
    const code=await fastLedger.readSource(prepared.id);
    if(!ojBridge?.status().active)throw Error('浏览器扩展桥接未运行；请检查本机端口 10045');
    const queued=ojBridge.queue({id:prepared.id,problemUrl:prepared.problemUrl,code,oneClick:info?.oneClick===true});
    return {...prepared,delivery:'browser-extension',browser:queued,bridge:ojBridge.status()};
  });
  ipcMain.handle('local:fastReopen',async(e,id)=>{
    trusted(e);
    const r=await fastLedger.get(id);
    if(!r.id)throw Error('找不到提交快照');
    const code=await fastLedger.readSource(id);
    if(!ojBridge?.status().active)throw Error('浏览器桥接未运行');
    return {delivery:'browser-extension',...ojBridge.queue({id:r.id,problemUrl:r.problemUrl,code,oneClick:false})};
  });
  ipcMain.handle('local:browserBridgeStatus',async e=>{trusted(e);return {...(ojBridge?.status()||{active:false,connected:false,paired:false,pending:0,port:10045}),startupError:ojBridgeStartupError};});
  ipcMain.handle('local:browserBridgePair',async e=>{trusted(e);if(!ojBridge?.status().active)throw Error('OJ Bridge 没有运行');return ojBridge.pair();});
  ipcMain.handle('local:browserBridgeReset',async e=>{trusted(e);ojBridge?.reset();await fs.rm(bridgeAuthFile,{force:true});return true;});
  ipcMain.handle('local:browserBridgeFolder',async e=>{trusted(e);
    const dir=app.isPackaged?path.join(process.resourcesPath,'oj-submit-extension'):path.join(__dirname,'..','oj','submit-extension');
    await fs.access(path.join(dir,'manifest.json'));await shell.openPath(dir);return dir;
  });
  ipcMain.handle('local:fastList',async e=>{trusted(e);return fastLedger.list();});
  ipcMain.handle('local:fastMarkFilled',async(e,id,filled)=>{trusted(e);return fastLedger.markFilled(id,filled);});
  ipcMain.handle('local:fastReceipt',async(e,id,detail)=>{trusted(e);return fastLedger.linkReceipt(id,detail);});
  ipcMain.handle('local:fastVerdict',async(e,id,handle)=>{
    trusted(e);
    const record=await fastLedger.get(id);
    if(!record.id||!record.receipt)throw Error('尚未关联官方提交详情');
    let result;
    if(record.platform==='codeforces'){
      const now=Date.now();if(now-lastCodeforcesRequest<2300)throw Error('Codeforces API 限频，请至少间隔 2.3 秒');
      lastCodeforcesRequest=now;
      result=await official.pollCodeforces(handle,official.asOfficialLink('codeforces',record.receipt.url));
    }else{
      const current=officialWindow.getCurrent(record.platform);
      if(!current)return {unavailable:true,message:'当前使用外部浏览器，请打开官方详情页核对 AtCoder / 洛谷结果；Codeforces 支持自动 API 核对。'};
      if(current!==record.receipt.url)await officialWindow.navigate(record.platform,record.receipt.url);
      result=await officialWindow.inspectCurrent(record.platform);
    }
    if(!result)return {unavailable:true,message:'尚未查到官方记录，请稍后重试'};
    return fastLedger.applyVerdict(id,result);
  });
  ipcMain.handle('local:ojOpenInApp',async(e,payload)=>{
    trusted(e);throw Error('内嵌官网已停用。请使用 Yanpb 浏览器扩展提交。');
  });
  ipcMain.handle('local:ojFillInApp',async(e,platform)=>{
    trusted(e);throw Error('请在浏览器扩展中完成填表');
  });
  ipcMain.handle('local:ojInspectInApp',async(e,platform)=>{
    trusted(e);throw Error('请使用外部浏览器官方详情页');
  });
  ipcMain.handle('local:ojPollCodeforces',async(e,handle,recordLink)=>{
    trusted(e);const detail=official.asOfficialLink('codeforces',recordLink);
    const now=Date.now();if(now-lastCodeforcesRequest<2300)throw Error('Codeforces 官方 API 请至少间隔约 2 秒查询');
    lastCodeforcesRequest=now;return official.pollCodeforces(handle,detail);
  });
  ipcMain.handle('local:ojCurrent',async(e,platform)=>{trusted(e);return null;});
  ipcMain.handle('local:ojNavigate',async(e,platform,link)=>{
    trusted(e);const detail=official.asOfficialLink(platform,link);
    // Browse the official detail page inside CodeLab; never send credentials.
    throw Error('内嵌窗口已停用，请在浏览器中访问官方链接');
  });
  ipcMain.handle('local:ojOpen',async(e,url,allowUnverified=false)=>{
    trusted(e);const route=routeProblem(url);
    if(!route.supported&&!allowUnverified)throw Error('该网站尚无内置提交页面适配');
    if(!/^https:\/\//.test(route.url))throw Error('只允许打开 HTTPS OJ 页面');
    await shell.openExternal(route.url);return true;
  });
  ipcMain.handle('local:clipboardRead',async e=>{trusted(e);return clipboard.readText().slice(0,500000);});
  ipcMain.handle('local:clipboardWrite',async(e,text)=>{trusted(e);if(typeof text!=='string'||text.length>500000)throw Error('Clipboard text too long');clipboard.writeText(text);return true;});
  ipcMain.handle('local:compilerDetect',async e=>{trusted(e);const pref=await getPrefs();return (await runner.detectCompilers('bundled')).filter(c=>c.bundled);});
  ipcMain.handle('local:getPrefs',async e=>{trusted(e);return getPrefs();});
  ipcMain.handle('local:setPrefs',async(e,p)=>{trusted(e);return savePrefs(p||{});});
  ipcMain.handle('local:run',async(e,p)=>{
    trusted(e);if(task||interactiveDebug)throw Error('Stop existing run or debugger before compiling');
    const job=runner.jobContext();task=job;
    try {runner.assertBundledRequest(p?.compiler,{strict:true});return await runner.execute({...p,compiler:'bundled'},job,(detail)=>{if(!win?.isDestroyed())win.webContents.send('local:progress',detail);});}
    finally {task=null;}
  });
  ipcMain.handle('local:stress',async(e,p)=>{
    trusted(e);if(task||interactiveDebug)throw Error('Stop existing run or debugger before compiling');
    const job=runner.jobContext();task=job;
    try{runner.assertBundledRequest(p?.compiler,{strict:true});return await runner.stress({...p,compiler:'bundled'},job,(detail)=>{if(!win?.isDestroyed())win.webContents.send('local:progress',detail);});}
    finally {task=null;}
  });
  ipcMain.handle('local:cancel',async e=>{trusted(e);if(task){task.cancel();return true;}return false;});
  ipcMain.handle('local:open',async e=>{
    trusted(e);const res=await dialog.showOpenDialog(win,{title:'打开 C++ 代码',properties:['openFile'],filters:[{name:'C++ 源文件',extensions:['cpp','cc','cxx','h','hpp','txt']},{name:'所有文件',extensions:['*']}]});
    if(res.canceled||!res.filePaths[0])return null;
    const file=res.filePaths[0];const st=await fs.stat(file);if(st.size>500000)throw Error('文件超出 500 KB 上限');
    return {name:path.basename(file),fullPath:file,content:await fs.readFile(file,'utf8')};
  });
  ipcMain.handle('local:save',async(e,p)=>{
    trusted(e);if(typeof p?.content!=='string'||Buffer.byteLength(p.content,'utf8')>500000)throw Error('文件体积超过 500 KB');
    const name=String(p.name||'main.cpp').replace(/[\\/\x00-\x1f:*?"<>|]/g,'_').slice(0,100);
    let target=p.fullPath;
    if(!target||p.saveAs) {
      const res=await dialog.showSaveDialog(win,{title:'保存 C++ 文件',defaultPath:name,filters:[{name:'C++ 源文件',extensions:['cpp','cc','cxx','h','hpp']},{name:'所有文件',extensions:['*']}]});
      if(res.canceled||!res.filePath)return null;target=res.filePath;
    }
    await fs.writeFile(target,p.content,'utf8');return {name:path.basename(target),fullPath:target};
  });
  ipcMain.handle('local:fileRename',async(e,filePath,name)=>{trusted(e);return fileOps.renameFile(filePath,name);});
  ipcMain.handle('local:fileReveal',async(e,filePath)=>{trusted(e);await fileOps.verifiedFile(filePath);shell.showItemInFolder(filePath);return true;});
  ipcMain.handle('local:fileTrash',async(e,filePath)=>{trusted(e);return fileOps.trashFile(filePath,p=>shell.trashItem(p));});
  ipcMain.handle('local:cphToggle',async(e,enabled,port=10043)=>{
    trusted(e);
    port=Number(port);
    if(!Number.isSafeInteger(port)||port<1024||port>65535)throw Error('Competitive Companion port must be 1024–65535');
    if(!enabled){if(companion){await companion.stop();companion=null;}return {enabled:false,port};}
    if(companion?.listening&&companion.port===port)return {enabled:true,port};
    // Do not tear down an existing working connection until the new one binds.
    let next=createReceiver(async problem=>{
      const item=companionInbox.push(problem);
      desktopEvent('local:cphProblem',item);
    },port);
    try {await next.start();}
    catch(err){throw Error(`Competitive Companion 端口 ${port} 被占用或无法监听：${err.message}。请在浏览器扩展设置 Custom ports 与 CodeLab 中填写相同的空闲端口。`);}
    const old=companion;companion=next;if(old)await old.stop();
    return {enabled:true,port};
  });
  ipcMain.handle('local:cphPending',async e=>{trusted(e);return companionInbox.pending();});
  ipcMain.handle('local:cphAck',async(e,id)=>{trusted(e);return companionInbox.ack(id);});
  ipcMain.handle('local:cphStatus',async e=>{trusted(e);return {enabled:!!companion?.listening,port:companion?.port??10043,pending:companionInbox.size};});
  ipcMain.handle('local:exportSettings',async(e,text)=>{
    trusted(e);
    if(typeof text!=='string'||Buffer.byteLength(text)>100000)throw Error('Settings file too large');
    const result=await dialog.showSaveDialog(win,{title:'Export Preferences',defaultPath:'yanpb-preferences.json',filters:[{name:'JSON',extensions:['json']}]});
    if(result.canceled||!result.filePath)return false;
    await fs.writeFile(result.filePath,text,'utf8');return true;
  });
  ipcMain.handle('local:importSettings',async e=>{
    trusted(e);
    const r=await dialog.showOpenDialog(win,{title:'Import Preferences',properties:['openFile'],filters:[{name:'JSON',extensions:['json']}]});
    if(r.canceled||!r.filePaths?.[0])return null;
    const f=r.filePaths[0],stat=await fs.stat(f);if(stat.size>100000)throw Error('Settings file too large');
    return fs.readFile(f,'utf8');
  });
  ipcMain.handle('local:folder'  ,async e=>{trusted(e);return shell.openPath(app.getPath('userData'));});
  ipcMain.handle('local:window',async(e,action)=>{trusted(e);if(action==='min')win.minimize();else if(action==='max'){if(win.isMaximized())win.unmaximize();else win.maximize();}else if(action==='close')win.close();});
}
function sendCommand(command) {win?.webContents.send('local:command',command);}
function createWindow() {
  win=new BrowserWindow({width:1580,height:960,minWidth:980,minHeight:620,show:false,frame:process.platform==='darwin',...(process.platform==='darwin'?{titleBarStyle:'hiddenInset',trafficLightPosition:{x:16,y:14}}:{}),backgroundColor:'#0b1019',title:'Yanpb CodeLab Local v5.10',icon:process.platform==='darwin'?path.join(__dirname,'..','build','icon.icns'):path.join(__dirname,'..','build','icon.ico'),
    webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webviewTag:false,preload:path.join(__dirname,'preload.cjs'),devTools:!app.isPackaged}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',(e,url)=>{if(url!==win.webContents.getURL())e.preventDefault();});
  win.once('ready-to-show',()=>win.show());
  win.on('closed',()=>{officialWindow.closeAll();if(task)task.cancel();void clearLanguage();void clearDebug();win=null;});
  win.loadFile(path.join(root,'index.html'));
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {label:'文件',submenu:[{label:'新建文件',accelerator:'CmdOrCtrl+N',click:()=>sendCommand('new')},{label:'打开文件',accelerator:'CmdOrCtrl+O',click:()=>sendCommand('open')},{label:'保存文件',accelerator:'CmdOrCtrl+S',click:()=>sendCommand('save')},{label:'另存为',accelerator:'CmdOrCtrl+Shift+S',click:()=>sendCommand('saveAs')},{type:'separator'},{role:'quit',label:'退出'}]},
    {label:'模式',submenu:[{label:'ICPC / ACM 模式',accelerator:'Alt+1',click:()=>sendCommand('icpc')},{label:'OI / CSP 模式',accelerator:'Alt+2',click:()=>sendCommand('oi')}]},
    {label:'调试',submenu:[{label:process.platform==='darwin'?'GDB 交互调试（暂不支持）':'启动交互式 GDB',enabled:process.platform!=='darwin',accelerator:'F11',click:()=>sendCommand('debugStart')},{label:'GDB 单步跳过',accelerator:'F10',click:()=>sendCommand('debugNext')},{label:'GDB 继续运行',accelerator:'F12',click:()=>sendCommand('debugContinue')},{label:'停止 GDB',click:()=>sendCommand('debugStop')},{type:'separator'},{label:'变量值追踪 (GDB)',click:()=>sendCommand('trace')},{label:'代码历史版本',accelerator:'CmdOrCtrl+H',click:()=>sendCommand('versions')},{label:'保存历史快照',accelerator:'CmdOrCtrl+Alt+S',click:()=>sendCommand('snapshot')}]},
    {label:'运行',submenu:[{label:'编译并运行',accelerator:'F5',click:()=>sendCommand('run')},{label:'所有样例',accelerator:'F7',click:()=>sendCommand('samples')},{label:'开始对拍',accelerator:'F9',click:()=>sendCommand('stress')},{label:'浏览器官方 OJ 提交',accelerator:'CmdOrCtrl+Alt+U',click:()=>sendCommand('ojSubmit')},{label:'停止运行',accelerator:'F6',click:()=>sendCommand('cancel')}]},
    {label:'编辑',submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]},
    {label:'比赛',submenu:[{label:'创建比赛文件夹',accelerator:'CmdOrCtrl+Shift+N',click:()=>sendCommand('contestCreate')},{label:'打开比赛工作区',click:()=>sendCommand('contestOpen')},{label:'比赛开始/暂停/继续',click:()=>sendCommand('contestLifecycle')},{label:'结束比赛',click:()=>sendCommand('contestFinish')},{label:'CSP 提交检查',accelerator:'F8',click:()=>sendCommand('contestCheck')}]},
    {label:'工具',submenu:[{label:'Competitive Companion 接收',click:()=>sendCommand('cph')},{label:'OJ 浏览器连接（6 位授权码）',click:()=>sendCommand('browserBridge')},{label:'竞赛模板管理',click:()=>sendCommand('templateManager')},{label:'快捷插入模板',click:()=>sendCommand('templateInsert')},{label:'个人偏好设置',click:()=>sendCommand('preferences')} ]},
    {label:'视图',submenu:[{role:'togglefullscreen'},{role:'reload'},{role:'zoomIn'},{role:'zoomOut'},{role:'resetZoom'}]},
    {label:'帮助',submenu:[{label:'关于 Yanpb CodeLab',click:()=>dialog.showMessageBox(win,{title:'Yanpb CodeLab Local',message:'Yanpb CodeLab Local v5.10.1',detail:'本地 C++ IDE / CPH 样例接收 / 中英文 / 自定义配置\n编译和运行发生在本机，不访问云端 Judge0。\n作者：Yanpb'})}]}
  ]));
}
app.whenReady().then(async()=>{register();session.defaultSession.setPermissionRequestHandler((_w,_permission,callback)=>callback(false));await setupOJBridge();createWindow();}).catch(err=>{console.error('Startup failed:',err);app.quit();});
app.on('window-all-closed',()=>app.quit());
app.on('before-quit',()=>{void clearLanguage();void clearDebug();if(task)task.cancel();if(companion?.listening)void companion.stop();officialWindow.closeAll();if(ojBridge)void ojBridge.stop();});
