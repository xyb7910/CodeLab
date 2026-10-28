'use strict';
(function(root){
function create(options){
 const {editor,activeFile,getStandard,getCompiler,onDiagnostics,onProblemRefresh,showConsole,toast,getDebugInput=()=>'',setDebugInput=()=>{}}=options;
 const api=root.yanpb;
 let clangVersion=0,clangFile='',clangReady=false,liveTimer=null,wakeTimer=null,sleepTimer=null,starting=0,booting=false,clangMode='smart',lastActivity=0,debugFile=null,debugState={status:'idle'},debugConsole='',stoppedLine=null,autoExpanded=false;
 const breaks=new Map(),statusEl=document.getElementById('clangdStatus');
 const storageKey='yanpb.debug.options.v44';let stored={};try{stored=JSON.parse(localStorage.getItem(storageKey)||'{}');}catch{}
 if(!stored || typeof stored!=='object')stored={};
 const cfg=id=>{if(!stored[id])stored[id]={breakpoints:[],conditions:{},watches:[],arrays:[]};return stored[id];};
 const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify(stored));}catch{}};
 const getSet=id=>{if(!breaks.has(id))breaks.set(id,new Set(cfg(id).breakpoints||[]));return breaks.get(id);};
 const setConfig=(id,key,value)=>{cfg(id)[key]=value;save();};
 function notify(text){toast(text);}

 function status(text,level='idle'){if(statusEl){statusEl.textContent=text;statusEl.dataset.level=level;}}
 // A single line-number gutter: breakpoints appear on the numeral itself,
 // without introducing another 19px strip to the left of the code.
 const breakpointHandles=new Set();
 function marker(line,enabled){
  if(!editor||line<0||line>=editor.lineCount())return;
  const handle=editor.getLineHandle(line);if(!handle)return;
  if(enabled){editor.addLineClass(handle,'gutter','yanpb-breakpoint-number');breakpointHandles.add(handle);}
  else{editor.removeLineClass(handle,'gutter','yanpb-breakpoint-number');breakpointHandles.delete(handle);}
 }
 function refreshBreakpoints(){
  editor.operation(()=>{
   for(const handle of breakpointHandles){try{editor.removeLineClass(handle,'gutter','yanpb-breakpoint-number');}catch{}}
   breakpointHandles.clear();
   for(const line of getSet(activeFile().id))if(line>0&&line<=editor.lineCount())marker(line-1,true);
  });
 }
 async function toggleBreakpoint(line){const f=activeFile(),set=getSet(f.id),n=line+1;if(set.has(n)){set.delete(n);delete cfg(f.id).conditions[n];}else set.add(n);setConfig(f.id,'breakpoints',[...set]);marker(line,set.has(n));
  if(debugFile===f.id&&debugState.status==='paused'&&api?.debugAction){try{await api.debugAction('breakpoint',n);}catch(e){notify(e.message);}}
 }
 editor.on('gutterClick',(cm,line,gutter,event)=>{
  if(gutter!=='CodeMirror-linenumbers')return;
  // Use Alt+click to fold a block without reserving a separate fold column.
  if(event?.altKey){cm.foldCode({line,ch:0});return;}
  void toggleBreakpoint(line);
 });
 function powerPlan(){return root.YanpbPerformancePolicy.plan(clangMode);}
 function armIdle(){clearTimeout(sleepTimer);const p=powerPlan();if(!p.autoSleep)return;
  sleepTimer=setTimeout(()=>{void sleepLanguage('idle');},document.hidden?p.hiddenMs:p.idleMs);
 }
 async function sleepLanguage(reason='idle'){
  clearTimeout(liveTimer);clearTimeout(wakeTimer);clearTimeout(sleepTimer);
  ++starting;clangReady=false;clangVersion=0;
  const old=clangFile;clangFile='';
  if(old)onDiagnostics(old,[]);
  status(reason==='hidden'?'clangd · sleeping':'clangd · on demand','idle');
  try{await api?.clangStop?.();}catch{}
 }
 function wakeLanguage(delay=0){
  if(clangMode==='off'||!api?.clangStart)return;
  clearTimeout(wakeTimer);clearTimeout(sleepTimer);lastActivity=Date.now();
  if(clangReady){armIdle();return;}
  if(booting)return;
  wakeTimer=setTimeout(()=>{void restartLanguage();},delay);
 }
 async function restartLanguage(){
  clearTimeout(liveTimer);clearTimeout(wakeTimer);
  if(clangMode==='off'||!api?.clangStart)return;
  if(clangReady||booting){armIdle();return;}
  booting=true;const token=++starting;clangReady=false;clangVersion=0;clangFile=activeFile().id;
  const openingCode=activeFile().content;
  status('clangd · starting…');onDiagnostics(clangFile,[]);
  try{
   await api.clangStart({code:openingCode,compiler:getCompiler(),standard:getStandard()});
   booting=false;
   if(token!==starting){await api.clangStop?.().catch(()=>{});if(clangMode!=='off'&&!document.hidden&&(clangMode==='always'||Date.now()-lastActivity<3500))wakeLanguage(250);return;}
   clangReady=true;clangVersion=1;status('clangd · LIVE','ready');armIdle();
   if(activeFile().content!==openingCode)changed();
  }catch(e){
   booting=false;
   if(token===starting){clangReady=false;status('clangd · unavailable','error');
    toast((document.body.dataset.lang==='en'?'clangd unavailable: ':'clangd 启动失败：')+e.message);}
  }
 }
 async function completeAt(line,character){
   if(clangMode==='off'||!api?.clangComplete)return null;
   if(!clangReady||!clangFile||clangFile!==activeFile().id){wakeLanguage(0);return null;}
   if(liveTimer){clearTimeout(liveTimer);liveTimer=null;
    try{clangVersion++;await api.clangChange(activeFile().content);}catch{return null;}}
   const requestedFile=activeFile().id,version=clangVersion;
   try{const result=await api.clangComplete({line,character,version});
    if(result?.stale||clangVersion!==version||activeFile().id!==requestedFile)return null;
    armIdle();return result?.items||[];
   }catch{return null;}
 }
 function changed(){
  const id=activeFile().id;onDiagnostics(id,[]);if(!api?.clangChange||clangMode==='off')return;
  clearTimeout(liveTimer);clearTimeout(wakeTimer);clearTimeout(sleepTimer);
  lastActivity=Date.now();
  const delay=powerPlan().debounceMs;
  liveTimer=setTimeout(async()=>{
   if(id!==activeFile().id||document.hidden)return;
   if(!clangReady){wakeLanguage(0);return;}
   try{clangVersion++;await api.clangChange(activeFile().content);armIdle();}
   catch(e){clangReady=false;status('clangd · stopped','error');}
  },delay);
 }
 function setPerformanceMode(value){
  const next=root.YanpbPerformancePolicy.normalizeMode(value);const before=clangMode;clangMode=next;
  if(next==='off'){void sleepLanguage('disabled');status('clangd · disabled','idle');}
  else if(next==='always'){wakeLanguage(0);}
  else if(before==='always'){armIdle();}
  else if(!clangReady)status('clangd · on demand','idle');
 }
 function updateDiagnostics(data){if(!clangReady||clangFile!==activeFile().id)return;
  if(data.version!=null&&data.version<clangVersion)return;
  const items=(data.diagnostics||[]).map(d=>({...d,file:activeFile().name,source:'clangd'}));onDiagnostics(clangFile,items);onProblemRefresh();
  status('clangd · '+items.filter(i=>i.severity==='error').length+' errors',items.some(i=>i.severity==='error')?'warning':'ready');
 }
 function gotoDebugLine(n){if(stoppedLine!=null){editor.removeLineClass(stoppedLine-1,'background','debug-stopped-line');stoppedLine=null;}if(Number.isInteger(n)&&n>0&&n<=editor.lineCount()){stoppedLine=n;editor.addLineClass(n-1,'background','debug-stopped-line');editor.scrollIntoView({line:n-1,ch:0},120);editor.setCursor(n-1,0);}}
 function createElement(tag,className,text){const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;}
 function inputField(placeholder,value='',type='text'){const el=createElement('input','gdb-input');el.type=type;el.placeholder=placeholder;el.value=value;return el;}
 function labelSection(text){return createElement('h4','gdb-section-title',text);}
 function watchConfig(){return cfg(debugFile||activeFile().id);}
 function renderDebug(){const area=document.getElementById('terminalOutput');if(!area)return;if(!autoExpanded){const pane=document.getElementById('terminalPane');if(pane&&!pane.classList.contains('is-collapsed')&&pane.getBoundingClientRect().height<330){pane.style.height=Math.min(480,Math.round(window.innerHeight*0.48))+'px';autoExpanded=true;}}area.replaceChildren();const wrap=createElement('div','gdb-dashboard');const en=document.body.dataset.lang==='en';
 const t=(english,chinese)=>en?english:chinese;
 const toolbar=createElement('div','gdb-controls');const commands=[['start',t('Start F11','启动 F11')],['continue',t('Continue F12','继续 F12')],['next',t('Step Over F10','单步跳过 F10')],['step',t('Step Into','单步进入')],['finish',t('Step Out','跳出函数')],['stop',t('Stop','终止')]];
 commands.forEach(([action,title])=>{const b=createElement('button','',title);b.disabled=action==='start'?!['idle','exited','stopped'].includes(debugState.status):action==='stop'?!['starting','running','paused','error'].includes(debugState.status):debugState.status!=='paused';b.onclick=()=>action==='start'?startDebug():action==='stop'?stopDebug():perform(action);toolbar.appendChild(b);});wrap.appendChild(toolbar);
 const header=createElement('div','gdb-status','GDB/MI · '+debugState.status+(debugState.reason?' · '+debugState.reason:'')+(debugState.line?' · Line '+debugState.line:''));wrap.appendChild(header);
 const io=createElement('div','gdb-stdin');io.appendChild(labelSection(t('Standard input for this debug run','本次调试的标准输入')));
 const input=createElement('textarea','gdb-stdin-editor');input.rows=3;input.spellcheck=false;input.value=getDebugInput()||'';input.placeholder=t('Enter cin data before starting. The inferior reads from an input file.','在启动前填入 cin 数据；程序从临时输入文件读取。');input.disabled=!['idle','exited','stopped'].includes(debugState.status);input.oninput=()=>setDebugInput(input.value);io.appendChild(input);
 io.appendChild(createElement('p','gdb-hint',t('Input is preloaded before execution. Live terminal input after start is not supported yet.','标准输入在开始调试前提供；暂不支持程序运行期间追加交互式输入。')));wrap.appendChild(io);
 const pan=createElement('div','gdb-panels');const local=createElement('section'),stack=createElement('section');local.appendChild(labelSection(t('Local variables','局部变量')));stack.appendChild(labelSection(t('Call stack','调用栈')));
 for(const v of debugState.variables||[]){const row=createElement('div','gdb-data');row.append(createElement('strong','',v.name),createElement('code','',v.value));local.append(row);}
 for(const frame of debugState.stack||[]){const row=createElement('div','gdb-data','#'+frame.level+' '+frame.func+' · '+frame.line);row.onclick=()=>{if(frame.line)gotoDebugLine(frame.line);};stack.append(row);}
 pan.append(local,stack);wrap.append(pan);
 const watched=createElement('section','gdb-watch-panel');watched.appendChild(labelSection(t('Watch expressions · evaluated at each pause','监视表达式 · 每次暂停重新求值')));
 const watchEntry=createElement('div','gdb-add-row'),expression=inputField(t('e.g. i, dp[i], ver[u].size()','如 i、dp[i]、ver[u].size()'));
 const watchBtn=createElement('button','',t('+ Watch','＋ 监视'));const addWatch=async()=>{const x=expression.value.trim();if(!x)return;try{if((watchConfig().watches||[]).includes(x))return;const watches=[...(watchConfig().watches||[]),x];if(watches.length>16)throw Error('Maximum 16 watches');if(api?.debugAction&&debugState.status==='paused')await api.debugAction('watch-add',null,x);setConfig(activeFile().id,'watches',watches);if(api?.debugAction&&debugState.status==='paused')await api.debugAction('refresh');renderDebug();}catch(e){notify(e.message);}};watchBtn.onclick=addWatch;expression.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();void addWatch();}};watchEntry.append(expression,watchBtn);watched.appendChild(watchEntry);
 for(const x of watchConfig().watches||[]){const actual=(debugState.watches||[]).find(w=>w.expression===x);const row=createElement('div','gdb-data gdb-watch-row');row.append(createElement('strong','',x),createElement('code',actual?(actual.ok?actual.value:'⚠ '+actual.value):'—'));const del=createElement('button','gdb-delete','×');del.title=t('Remove watch','删除监视');del.onclick=async()=>{if(api?.debugAction&&debugState.status==='paused')await api.debugAction('watch-remove',null,x).catch(e=>notify(e.message));setConfig(activeFile().id,'watches',(watchConfig().watches||[]).filter(y=>y!==x));renderDebug();};row.append(del);watched.appendChild(row);}
 wrap.appendChild(watched);
 const arrays=createElement('section','gdb-array-panel');arrays.appendChild(labelSection(t('Array & vector visualizer · max 40 cells','数组与 vector 可视化 · 最多 40 项')));
 const arrayEntry=createElement('div','gdb-add-row'),arrayExpr=inputField('a / dp / ver'),arrayStart=inputField(t('start','起点'),'0','number'),arrayLen=inputField(t('length','长度'),'12','number'),arrayBtn=createElement('button','',t('+ Array','＋ 数组'));
 arrayStart.min='0';arrayLen.min='1';arrayLen.max='40';arrayStart.title=t('First index','起始下标');arrayLen.title=t('Number of elements (1–40)','展示数量 (1–40)');
 const addArray=async()=>{const entry={expression:arrayExpr.value.trim(),start:Number(arrayStart.value),length:Number(arrayLen.value)};try{if(!/^[A-Za-z_]\w*(?:(?:\.|->)[A-Za-z_]\w*|\[(?:\d+|[A-Za-z_]\w*)\])*$/.test(entry.expression)||!Number.isInteger(entry.start)||entry.start<0||!Number.isInteger(entry.length)||entry.length<1||entry.length>40)throw Error('Invalid array expression or range');if((watchConfig().arrays||[]).length>=8)throw Error('Maximum 8 arrays');if(api?.debugAction&&debugState.status==='paused')await api.debugAction('array-add',null,entry);setConfig(activeFile().id,'arrays',[...(watchConfig().arrays||[]),entry]);if(api?.debugAction&&debugState.status==='paused')await api.debugAction('refresh');renderDebug();}catch(e){notify(e.message);}};
 arrayBtn.onclick=addArray;arrayEntry.append(arrayExpr,arrayStart,arrayLen,arrayBtn);arrays.appendChild(arrayEntry);
 for(const view of watchConfig().arrays||[]){const box=createElement('div','gdb-array-card'),top=createElement('div','gdb-array-heading'),title=createElement('strong','',view.expression+' ['+view.start+' … '+(view.start+view.length-1)+']'),del=createElement('button','gdb-delete','×');del.onclick=async()=>{if(api?.debugAction&&debugState.status==='paused')await api.debugAction('array-remove',null,view.expression).catch(e=>notify(e.message));setConfig(activeFile().id,'arrays',(watchConfig().arrays||[]).filter(x=>x!==view));renderDebug();};top.append(title,del);box.append(top);
  const actual=(debugState.arrays||[]).find(x=>x.expression===view.expression);if(actual){for(const cell of actual.items||[]){const row=createElement('div','gdb-array-row'),index=createElement('span','gdb-array-index','['+cell.index+']'),track=createElement('div','gdb-bar-track'),bar=createElement('div','gdb-bar'+(cell.negative?' negative':''));bar.style.width=(cell.percent||0)+'%';track.append(bar);row.append(index,track,createElement('code','',cell.value));box.append(row);}}else box.append(createElement('p','gdb-hint',t('Values appear at the next breakpoint.','下次在断点暂停时显示数值。')));if(actual?.truncated)box.append(createElement('p','gdb-hint',t('Paused-view cap: 80 total sampled cells.','单次暂停最多采样 80 个单元。')));arrays.append(box);}
 wrap.appendChild(arrays);
 const breakPanel=createElement('section','gdb-condition-panel');breakPanel.appendChild(labelSection(t('Conditional breakpoints','条件断点')));const list=[...getSet(activeFile().id)].sort((a,b)=>a-b);
 for(const line of list){const row=createElement('div','gdb-add-row'),name=createElement('span','gdb-line-tag','L'+line),field=inputField(t('Condition: i == 5','条件：i == 5'),watchConfig().conditions?.[line]||''),set=createElement('button','',t('Apply','设置'));set.onclick=async()=>{const condition=field.value.trim();try{if(api?.debugAction&&debugState.status==='paused')await api.debugAction('condition',line,condition);const conditions={...(watchConfig().conditions||{})};if(condition)conditions[line]=condition;else delete conditions[line];setConfig(activeFile().id,'conditions',conditions);notify(t('Breakpoint condition saved','断点条件已保存'));}catch(e){notify(e.message);}};row.append(name,field,set);breakPanel.append(row);}
 if(!list.length)breakPanel.append(createElement('p','gdb-hint',t('Click a line number to add a breakpoint first.','先点击代码行号添加断点。')));wrap.append(breakPanel);
 if(debugConsole){const pre=createElement('pre','gdb-console',debugConsole.slice(-7000));wrap.append(pre);}area.append(wrap);
 }

 function showDebug(){showConsole('debug');renderDebug();}
 async function startDebug(){if(!api?.debugStart){toast('GDB is only available in the Windows desktop app');return;}if(!['idle','exited','stopped'].includes(debugState.status))return;
  debugFile=activeFile().id;debugConsole='';debugState={status:'starting'};showDebug();
  try{const config=watchConfig();const result=await api.debugStart({code:activeFile().content,compiler:getCompiler(),breakpoints:[...getSet(debugFile)],conditions:config.conditions||{},watches:config.watches||[],arrays:config.arrays||[],stdin:getDebugInput()||''});if(result.status==='CE'){debugState={status:'compile error'};debugConsole=result.stderr||'';renderDebug();}else if(debugState.status==='starting'){debugState={status:'running'};renderDebug();}}
  catch(e){debugState={status:'idle'};debugConsole=e.message;renderDebug();toast(e.message);}
 }
 async function perform(type){if(!api?.debugAction)return;try{debugState={...debugState,status:'running'};renderDebug();await api.debugAction(type);}catch(e){toast(e.message);debugState.status='paused';renderDebug();}}
 async function stopDebug(){if(api?.debugStop)await api.debugStop();debugFile=null;debugState={status:'idle'};gotoDebugLine(null);renderDebug();}
 function onDebugState(data){if(debugFile&&debugFile!==activeFile().id)return;debugState=data;if(data.status==='paused')gotoDebugLine(data.line);else if(['exited','stopped'].includes(data.status))gotoDebugLine(null);if(document.querySelector('[data-term="debug"].active'))renderDebug();}
 function changeFile(){void stopDebug().catch(()=>{});refreshBreakpoints();void sleepLanguage('switch').then(()=>{if(clangMode!=='off')wakeLanguage(650);});}
 if(api?.onClangDiagnostics)api.onClangDiagnostics(updateDiagnostics);
 if(api?.onClangStatus)api.onClangStatus(d=>{if(d.status==='error')status('clangd · error','error');});
 if(api?.onDebugState)api.onDebugState(onDebugState);
 if(api?.onDebugConsole)api.onDebugConsole(s=>{debugConsole+=s;if(debugConsole.length>14000)debugConsole=debugConsole.slice(-12000);if(document.querySelector('[data-term="debug"].active'))renderDebug();});
 if(api?.onDebugWarning)api.onDebugWarning(s=>{debugConsole+='\n⚠ '+s;if(document.querySelector('[data-term="debug"].active'))renderDebug();});
 editor.on('focus',()=>{if(clangMode!=='off'&&!clangReady&&!document.hidden)wakeLanguage(1100);else armIdle();});
 if(statusEl){statusEl.title='Click to start/refresh clangd · 点击启动 clangd';statusEl.tabIndex=0;statusEl.setAttribute('role','button');statusEl.onclick=()=>{if(clangMode!=='off')wakeLanguage(0);};}
 document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(wakeTimer);if(clangMode==='smart')armIdle();}
  else if(clangMode==='always'||editor.hasFocus())wakeLanguage(500);});
 window.addEventListener('beforeunload',()=>{clearTimeout(liveTimer);clearTimeout(wakeTimer);clearTimeout(sleepTimer);void api?.clangStop?.();void api?.debugStop?.();});
 refreshBreakpoints();return {completeAt,restartLanguage,sleepLanguage,setPerformanceMode,changeFile,changed,startDebug,stopDebug,perform,renderDebug,showDebug,get status(){return debugState.status;}};
}
root.YanpbLiveDebug={create};
})(window);
