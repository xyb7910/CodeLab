// v3.3 local contest workspaces and CSP-style submission simulator.
const LOCAL_PRESETS={
 codeforces:{label:'Codeforces',tasks:['A','B','C','D','E','F'],duration:120},
 atcoder:{label:'AtCoder',tasks:['A','B','C','D','E','F','G'],duration:100},
 luogu:{label:'洛谷 / Luogu',tasks:['A','B','C','D'],duration:180},
 icpc:{label:'ICPC / CCPC',tasks:['A','B','C','D','E','F','G','H'],duration:300},
 cspj:{label:'CSP-J 复赛',tasks:['task1','task2','task3','task4'],duration:210},
 csps:{label:'CSP-S 复赛',tasks:['task1','task2','task3','task4'],duration:240},
 custom:{label:'自定义 / Custom',tasks:['A','B','C'],duration:180}
};
let contestClock=null;
function localContest(){return state.currentContest||null;}
function currentContestTask(){const m=localContest();if(!m)return null;return m.files.find(f=>f.source===activeFile()?.fullPath)||null;}
function formatRemaining(m){const total=m.duration*60000,remain=Math.max(0,m.startedAt+total-Date.now());const h=Math.floor(remain/3600000),minutes=Math.floor(remain/60000)%60,seconds=Math.floor(remain/1000)%60;return `${String(h).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;}
function updateContestTime(){const m=localContest();const clock=$('contestTimer');if(!clock||!m)return;clock.textContent=formatRemaining(m);clock.classList.toggle('clock-warning',m.startedAt+m.duration*60000-Date.now()<600000);}
function renderContestBadge(){const m=localContest();$('contestCheckBtn').classList.toggle('hidden',!m);if(!m)return;$('contestCreateBtn').title=m.platform.toUpperCase()+': '+m.contestName;}
function contestSidebar(){
 const root=$('sidebarList');root.replaceChildren();$('fileCount').textContent=state.files.length;
 const en=lang()==='en',m=localContest(),hub=document.createElement('div');hub.className='contest-hub';
 if(!m){hub.innerHTML=`<div class="hub-eyebrow">Y· CONTEST ENGINE</div><strong>${en?'Ready for your next contest':'开启你的下一场算法比赛'}</strong><small>${en?'Create platform-specific source files in one click.':'分平台建比赛文件夹、题目源码与样例。'}</small><button id="startContest">${en?'＋ Create contest':'＋ 创建比赛工作区'}</button><button id="openContest">${en?'Open contest folder':'打开已有比赛'}</button>`;}
 else{hub.innerHTML=`<div class="hub-eyebrow">${m.exam?'● OI MOCK EXAM':'● '+m.platform.toUpperCase()}</div><strong>${esc(m.contestName)}</strong><small>${en?'Local workspace':'本机项目'} · ${m.files.length} ${en?'problems':'题'}</small><div id="contestTimer" class="clock">${formatRemaining(m)}</div><button id="openContest">${en?'Open another workspace':'切换比赛工作区'}</button><button id="checkContest">${en?'✓ Submission audit':'✓ 提交完整性检查'}</button>`;}
 root.appendChild(hub);
 hub.querySelector('#startContest')?.addEventListener('click',showContestCreator);
 hub.querySelector('#openContest')?.addEventListener('click',openContestWorkspace);
 hub.querySelector('#checkContest')?.addEventListener('click',showSubmissionReview);
 if(m){const label=document.createElement('div');label.className='side-section-label';label.textContent=en?'PROBLEM FILES':'比赛题目文件';root.appendChild(label);
  m.files.forEach(item=>{const b=document.createElement('button');b.className='side-contest-task'+(currentContestTask()?.task===item.task?' active':'');b.innerHTML='<span class="cpp-mark">C++</span><div><strong></strong><small></small></div>';b.querySelector('strong').textContent=item.task+'.cpp';b.querySelector('small').textContent=m.exam?item.task+'/'+item.task+'.cpp':m.platform.toUpperCase();b.onclick=()=>openContestTask(item.task);root.appendChild(b);});
  const help=document.createElement('div');help.className='side-section-label';help.textContent=en?'LOCAL · NO CLOUD SUBMISSION':'本地检查 · 不是真实提交';root.appendChild(help);
 }
 updateContestTime();
}
function showContestCreator(){
 const en=lang()==='en',p=localContest()?.platform||'codeforces';
 const platformOpts=Object.entries(LOCAL_PRESETS).map(([key,x])=>`<option value="${key}">${esc(x.label)}</option>`).join('');
 showModal(en?'Create Contest Workspace':'创建比赛工作区',`<div class="contest-stamp"><svg><use href="#i-trophy"/></svg><div><strong>${en?'Platform-based templates + independent folders':'分平台模板 · 自动创建题目与源码'}</strong><small>${en?'Supports Codeforces, AtCoder, Luogu, ICPC/CCPC, CSP and custom layouts.':'支持 Codeforces / AtCoder / 洛谷 / ICPC / CSP / 自定义。'}</small></div></div>
 <div class="contest-form-grid">
 <label>${en?'Competition platform':'竞赛平台'}<select id="contestPlatform">${platformOpts}</select></label>
 <label>${en?'Contest folder name':'比赛文件夹名称'}<input id="contestName" value="Contest_001" maxlength="64" spellcheck="false"></label>
 <label class="full">${en?'Problem IDs (comma or space separated)':'题号（逗号或空格分隔）'}<input id="contestTasks" spellcheck="false" placeholder="A B C D"></label>
 <label>${en?'Duration (minutes)':'比赛时长（分钟）'}<input id="contestDuration" type="number" min="1" max="480"></label>
 <label>${en?'Source layout':'代码目录格式'}<select id="contestLayout"><option value="flat">A.cpp / B.cpp</option><option value="nested">A/A.cpp · B/B.cpp</option></select></label>
 <label>${en?'I/O mode':'输入输出模式'}<select id="contestIO"><option value="stdio">stdin / stdout</option><option value="file">task.in / task.out</option></select></label>
 <label>${en?'Time limit per task (ms)':'单题时间限制（毫秒）'}<input type="number" id="contestTL" min="250" max="15000" value="2000"></label>
 <label>${en?'C++ standard':'C++ 版本'}<select id="contestStd"><option>c++11</option><option>c++14</option><option selected>c++17</option><option>c++20</option></select></label>
 <label id="submitModeWrap" class="full hidden">${en?'Submission practice method':'提交方式（以本省考点须知为准）'}<select id="submitMode"><option value="folder">${en?'Candidate folder collection':'考号文件夹收卷（常见）'}</option><option value="upload">${en?'Platform source upload practice':'平台逐题上传源码（部分地区）'}</option></select></label>
 <label id="candidateWrap" class="full hidden">${en?'Candidate ID / submit directory':'考号（提交总文件夹）'}<input id="contestCandidate" value="TRAIN-J0001" spellcheck="false" placeholder="GD-J00001"></label>
 <label class="full">${en?'Output location':'保存到本机目录'}<div id="contestDirectory" class="contest-directory">${en?'Choose a directory to continue':'请选择创建比赛的父级文件夹'}</div></label>
 </div><div class="modal-actions"><button class="button secondary" id="chooseContestDir">${en?'Browse…':'选择目录…'}</button><button class="button primary" id="createContestNow" disabled>${en?'Create files':'创建比赛文件'}</button></div>
 <p class="hint">${en?'CSP mode enforces candidate/problem/problem.cpp and redirects file I/O. Different regions may use different submission rules.':'CSP 模拟自动生成「考号/题名/题名.cpp」，并使用题名.in/out 文件读写。各省考点规则存在差异，考前请按现场通知核对。'}</p>`,true);
 let dest=null;
 const platform=$('contestPlatform');platform.value=p;
 const applyPreset=()=>{const s=LOCAL_PRESETS[platform.value];$('contestTasks').value=s.tasks.join(' ');$('contestDuration').value=s.duration;const exam=['cspj','csps'].includes(platform.value);$('submitModeWrap').classList.toggle('hidden',!exam);$('candidateWrap').classList.toggle('hidden',!exam||$('submitMode').value==='upload');$('contestLayout').value=exam?'nested':'flat';$('contestIO').value=exam?'file':'stdio';$('contestLayout').disabled=exam;$('contestIO').disabled=exam;$('contestName').value=(exam?'CSP_'+(platform.value==='cspj'?'J':'S')+'_Mock':'Contest_001');};
 platform.onchange=applyPreset;$('submitMode').onchange=()=>{$('candidateWrap').classList.toggle('hidden',$('submitMode').value==='upload');};applyPreset();
 $('chooseContestDir').onclick=async()=>{if(!native?.contestSelectDirectory){toast(en?'Desktop app required':'需要 Windows 桌面客户端');return;}
  try{dest=await native.contestSelectDirectory();if(dest){$('contestDirectory').textContent=dest;$('createContestNow').disabled=false;}}catch(e){toast(e.message);}
 };
 $('createContestNow').onclick=async()=>{if(!dest||!native?.contestCreate)return;const exam=['cspj','csps'].includes(platform.value);
  const options={platform:platform.value,contestName:$('contestName').value.trim(),tasks:$('contestTasks').value.trim().split(/[\s,，;；]+/).filter(Boolean),duration:Number($('contestDuration').value),timeLimit:Number($('contestTL').value),candidateId:exam&&$('submitMode').value!=='upload'?$('contestCandidate').value.trim():'',submissionMethod:exam?$('submitMode').value:'folder',directory:$('contestLayout').value,io:$('contestIO').value,standard:$('contestStd').value,exam};
  const btn=$('createContestNow');btn.disabled=true;
  try{const manifest=await native.contestCreate(dest,options);await loadContest(manifest);closeModal();selectNav('contest');toast((en?'Contest files created':'比赛文件创建成功')+' · '+manifest.files.length);}
  catch(e){toast((en?'Failed: ':'创建失败：')+e.message);btn.disabled=false;}
 };
}
async function openContestWorkspace(){if(!native?.contestOpen){toast('Only available in desktop app');return;}try{const m=await native.contestOpen();if(m){await loadContest(m);selectNav('contest');toast((lang()==='en'?'Contest opened':'已打开比赛')+' · '+m.contestName);}}catch(e){toast(e.message);}}
async function loadContest(m){
 if(!native?.contestRead)throw Error('Desktop mode only');
 const project=await native.contestRead(m);
 state.currentContest=project.manifest;
 for(const p of project.files){
  let file=state.files.find(f=>f.fullPath===p.fullPath);
  if(!file){if(state.files.length>=45)throw Error('最多可打开 45 个文件。请先关闭不需要的编辑标签。');addFile(p.name,p.content,p.fullPath);file=activeFile();}
  else if(!file.dirty){file.content=p.content;}
  if(!state.caseByFile[file.id])state.caseByFile[file.id]={cases:[{id:uid(),name:'Sample 1',input:'',expected:''}],activeCase:null};
 }
 const first=state.files.find(f=>f.fullPath===project.files[0].fullPath);if(first)switchFile(first.id);
 renderContestBadge();saveState();
}
function openContestTask(task){const m=localContest();const p=m?.files.find(f=>f.task===task);if(!p)return;const f=state.files.find(x=>x.fullPath===p.source);if(f){switchFile(f.id);if(state.sidebar==='contest')contestSidebar();}}
async function saveContestFiles(){if(!native?.saveFile)throw Error('请在 Windows 客户端完成提交');const m=localContest();if(!m)throw Error('尚未创建比赛');
 for(const p of m.files){const f=state.files.find(x=>x.fullPath===p.source);if(!f)continue;if(f.dirty){const saved=await native.saveFile({name:f.name,content:f.content,fullPath:f.fullPath,saveAs:false});if(!saved)throw Error('取消保存 '+f.name);f.dirty=false;}}
 renderTabs();saveState();
}
function reportRow(item,ok=!!item.ok){return `<div class="report-result ${ok?'ok':item.level==='warning'?'warn':'bad'}"><span>${ok?'✓':item.level==='warning'?'⚠':'✕'} ${esc(item.detail)}</span><span>${ok?'PASS':item.level==='warning'?'CHECK':'FAIL'}</span></div>`;}
function showSubmissionReview(){const m=localContest(),en=lang()==='en';if(!m){showContestCreator();return;}
 const contents=`<div class="contest-stamp"><svg><use href="#i-clipboard"/></svg><div><strong>${esc(m.contestName)} · ${esc(m.platform.toUpperCase())}</strong><small>${m.exam?(m.submissionMethod==='upload'?'CSP upload practice / local checks only':'CSP candidate folder / file-based judging'):'Local contest verification'} · ${m.files.length} ${en?'problems':'题'}</small></div></div>
 <div class="filetree">${esc(m.exam&&m.submissionMethod==='folder'?m.candidateId+'/':'')}${m.files.map(f=>'\n ├─ '+esc(f.relative)).join('')}</div>
 <p class="exam-warning">${en?'This is a local mock exam, not an official submission. Static checks can catch common mistakes; sample tests cannot prove hidden-test correctness.':'本功能为本地模拟，不是官方 CSP 评测；静态检查和样例通过都不能保证未知测试点正确。正式考试以当年及所在考点规定为准。'}</p>
 <div class="modal-actions"><button class="button secondary" id="auditNow">${en?'Inspect disk files':'检查磁盘提交目录'}</button><button class="button primary" id="verifyNow">${en?'Save all & verify':'保存全部并逐题检测'}</button></div>
 <div id="contestReviewResult" class="report-table"><div class="report-summary">${en?'Waiting for submission inspection…':'等待检查：目录规范 · 文件读写 · 源码编译 · 样例运行'}</div></div>`;
 showModal(en?'Submission Preflight / Exam Practice':'复赛提交检查 · 模拟考场',contents,true);
 $('auditNow').onclick=()=>auditContest(false);
 $('verifyNow').onclick=()=>auditContest(true);
}
async function auditContest(runSamples){
 const output=$('contestReviewResult'),m=localContest();if(!output||!m)return;if(busy){toast('另一个任务正在进行');return;}
 busy=true;updateButtons();$('auditNow').disabled=true;$('verifyNow').disabled=true;
 try{
  if(runSamples)await saveContestFiles();
  output.innerHTML='<div class="report-summary">'+(lang()==='en'?'Checking submission…':'正在读取磁盘源码、检查文件结构与编译…')+'</div>';
  const audit=await native.contestAudit(m);const en=lang()==='en';const report=[],verdicts=[];
  for(const item of audit.reports){let result=null;
   if(runSamples&&item.code){const f=state.files.find(x=>x.fullPath===item.source);const slot=f?state.caseByFile[f.id]:null;const cases=(slot?.cases||[]).filter(x=>x.input||x.expected).map(x=>({name:x.name,input:x.input,expected:x.expected}));
     result=await native.contestCheck(m,item.task,cases,{compiler:state.compiler||'auto',compareMode:state.preferences.compareMode});
   }
   const critical=item.checks.filter(x=>x.level==='error'&&!x.ok);
   const ok=critical.length===0&&(!result||['OK','COMPILED'].includes(result.status));
   verdicts.push(ok);
   report.push(`<div class="report-problem"><div class="report-title"><span>${esc(item.task)}.cpp <small style="font-weight:normal;color:var(--muted)">· ${item.size} bytes</small></span><span class="${ok?'pass':'fail'}">${ok?'✓ '+(en?'CHECKED':'检查通过'):'⚠ '+(en?'REVIEW':'需修正')}</span></div>${item.checks.map(c=>reportRow(c)).join('')}
    ${result?`<div class="report-result ${['OK','COMPILED'].includes(result.status)?'ok':'bad'}"><span>${en?'Compilation / sample run':'编译 / 样例运行'}</span><span>${esc(result.status)}</span></div>${result.compiler&&result.status==='CE'?`<pre class="output-pre stderr-pre">${esc(result.compiler.slice(0,2400))}</pre>`:''}${result.results?.map(r=>`<div class="report-result ${r.status==='OK'?'ok':'bad'}"><span>${esc(r.name)}</span><span>${esc(r.status)} · ${r.timeMs} ms</span></div>`).join('')||''}`:''}</div>`);
  }
  const all=verdicts.every(Boolean)&&audit.extraRoot.length===0;
  const summary=`<div class="report-summary ${all?'':'warning'}">${all?(en?'✓ Preflight checks passed':'✓ 本地预检通过'):(en?'⚠ Found submission risks':'⚠ 发现可能导致失分的提交问题')} · ${verdicts.filter(Boolean).length}/${verdicts.length} ${en?'tasks':'题'}<br><small>${en?'Passing sample tests does not imply a full score.':'样例通过不代表满分，需根据正式题目与评测要求复核。'}</small>${audit.extraRoot.length?`<br>${en?'Unexpected files in candidate root':'考号目录中存在额外项目'}：${esc(audit.extraRoot.join(', '))}`:''}</div>`;
  output.innerHTML=summary+report.join('');$('statusText').textContent=all?'Submission preflight OK':'Submission risks detected';
 }catch(e){output.textContent='Error: '+e.message;toast(e.message);}finally{busy=false;updateButtons();const a=$('auditNow'),v=$('verifyNow');if(a)a.disabled=false;if(v)v.disabled=false;}
}
