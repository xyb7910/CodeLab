'use strict';
(function(){
const $=id=>document.getElementById(id);
const $$=(s,base=document)=>[...base.querySelectorAll(s)];
const native=window.yanpb||null;
const isMac=native?.platform==='darwin';
if(isMac)document.body.dataset.platform='darwin';
const STORAGE='yanpb.codelab.local.v3';
const STARTER=`#include <bits/stdc++.h>
using namespace std;
using i64 = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> a(n);
    for (int &x : a) cin >> x;

    // 最长严格上升子序列 · O(n²)
    vector<int> dp(n, 1);
    int ans = 0;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < i; j++) {
            if (a[j] < a[i]) {
                dp[i] = max(dp[i], dp[j] + 1);
            }
        }
        ans = max(ans, dp[i]);
    }
    cout << ans << '\\n';
    return 0;
}
`;
const TEMPLATES=[
 {name:'C++17 竞赛基础模板',category:'基础',code:`#include <bits/stdc++.h>\nusing namespace std;\nusing i64 = long long;\n\nvoid solve() {\n    \n}\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    solve();\n    return 0;\n}\n`},
 {name:'二分答案',category:'基础算法',code:`#include <bits/stdc++.h>\nusing namespace std;\nusing i64 = long long;\n\n// 按题目修改 check 函数\nbool check(i64 x) {\n    return x * x >= 100;\n}\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    i64 l = 0, r = 1000000;\n    while (l < r) {\n        i64 mid = l + (r - l) / 2;\n        if (check(mid)) r = mid;\n        else l = mid + 1;\n    }\n    cout << l << '\\n';\n}\n`},
 {name:'BFS 广度优先搜索',category:'搜索',code:`#include <bits/stdc++.h>\nusing namespace std;\nconst int N = 1010;\nint n, m, sx, sy;\nchar g[N][N];\nint dis[N][N];\nint dx[] = {1, -1, 0, 0};\nint dy[] = {0, 0, 1, -1};\nvoid bfs() {\n    memset(dis, -1, sizeof dis);\n    queue<pair<int,int>> q;\n    q.push({sx, sy}); dis[sx][sy] = 0;\n    while (!q.empty()) {\n        auto [x, y] = q.front(); q.pop();\n        for (int k = 0; k < 4; k++) {\n            int nx = x + dx[k], ny = y + dy[k];\n            if (nx < 1 || nx > n || ny < 1 || ny > m) continue;\n            if (g[nx][ny] == '#' || dis[nx][ny] != -1) continue;\n            dis[nx][ny] = dis[x][y] + 1;\n            q.push({nx, ny});\n        }\n    }\n}\nint main() {\n    cin >> n >> m >> sx >> sy;\n    for (int i = 1; i <= n; i++)\n        for (int j = 1; j <= m; j++) cin >> g[i][j];\n    bfs();\n}\n`},
 {name:'Dijkstra 最短路',category:'图论',code:`#include <bits/stdc++.h>\nusing namespace std;\nusing i64 = long long;\nconst i64 INF = (1LL << 60);\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n, m, s; cin >> n >> m >> s;\n    vector<vector<pair<int, i64>>> ver(n + 1);\n    while (m--) {\n        int u, v; i64 w; cin >> u >> v >> w;\n        ver[u].push_back({v, w});\n    }\n    vector<i64> dis(n + 1, INF);\n    priority_queue<pair<i64,int>, vector<pair<i64,int>>, greater<pair<i64,int>>> q;\n    dis[s] = 0; q.push({0, s});\n    while (!q.empty()) {\n        auto [d, u] = q.top(); q.pop();\n        if (d != dis[u]) continue;\n        for (auto [v, w] : ver[u])\n            if (dis[v] > d + w) {\n                dis[v] = d + w;\n                q.push({dis[v], v});\n            }\n    }\n    for (int i = 1; i <= n; i++)\n        cout << (dis[i] == INF ? -1 : dis[i]) << ' ';\n}\n`},
 {name:'0/1 背包 DP',category:'动态规划',code:`#include <bits/stdc++.h>\nusing namespace std;\nusing i64 = long long;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n, V; cin >> n >> V;\n    vector<i64> f(V + 1);\n    for (int i = 1; i <= n; i++) {\n        int v; i64 w; cin >> v >> w;\n        for (int j = V; j >= v; j--)\n            f[j] = max(f[j], f[j - v] + w);\n    }\n    cout << f[V] << '\\n';\n}\n`},
 {name:'并查集 DSU',category:'数据结构',code:`#include <bits/stdc++.h>\nusing namespace std;\nstruct DSU {\n    vector<int> fa, sz;\n    DSU(int n) : fa(n + 1), sz(n + 1, 1) {\n        iota(fa.begin(), fa.end(), 0);\n    }\n    int find(int x) {\n        return fa[x] == x ? x : fa[x] = find(fa[x]);\n    }\n    bool unite(int x, int y) {\n        x = find(x); y = find(y);\n        if (x == y) return false;\n        if (sz[x] < sz[y]) swap(x, y);\n        fa[y] = x; sz[x] += sz[y];\n        return true;\n    }\n};\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; cin >> n; DSU dsu(n);\n}\n`},
 {name:'DFS 递归搜索',category:'搜索',code:`#include <bits/stdc++.h>\nusing namespace std;\nconst int N = 100010;\nvector<int> ver[N];\nbool vis[N];\nvoid dfs(int u) {\n    vis[u] = true;\n    for (int v : ver[u]) {\n        if (!vis[v]) dfs(v);\n    }\n}\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n, m; cin >> n >> m;\n    while (m--) {\n        int u, v; cin >> u >> v;\n        ver[u].push_back(v); ver[v].push_back(u);\n    }\n    dfs(1);\n}\n`}
];
const DEFAULT_GEN=`#include <bits/stdc++.h>\nusing namespace std;\nint main(int argc, char** argv) {\n    int seed = argc > 1 ? atoi(argv[1]) : 1;\n    mt19937 rng(seed);\n    int n = rng() % 8 + 1;\n    cout << n << '\\n';\n    for (int i = 0; i < n; i++) cout << int(rng() % 20) << " ";\n    cout << '\\n';\n}\n`;
const DEFAULT_BRUTE=`#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    int n; cin >> n;\n    vector<int> a(n);\n    for (int &x : a) cin >> x;\n    int ans = 0;\n    for (int i = 0; i < n; i++) {\n        int maskMax = 0; // 示例：独立实现暴力求解\n        (void)maskMax;\n    }\n    // 下面枚举所有子序列，仅适用于 n 较小\n    for (int mask = 1; mask < (1 << n); mask++) {\n        int last = INT_MIN, len = 0; bool ok = true;\n        for (int i = 0; i < n; i++) if (mask >> i & 1) {\n            if (len > 0 && last >= a[i]) ok = false;\n            last = a[i]; len++;\n        }\n        if (ok) ans = max(ans, len);\n    }\n    cout << ans << '\\n';\n}\n`;
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const defaultFile=()=>({id:uid(),name:'main.cpp',content:STARTER,fullPath:null,dirty:false});
function safeLoad(){try{const r=JSON.parse(localStorage.getItem(STORAGE)||'null');if(r&&Array.isArray(r.files)&&r.files.length)return r;}catch{} const file=defaultFile();return {files:[file],activeId:file.id,stdin:'5\n3 1 4 1 5\n',cases:[{id:uid(),name:'样例 1',input:'5\n3 1 4 1 5\n',expected:'3\n'},{id:uid(),name:'样例 2',input:'4\n9 7 5 2\n',expected:'1\n'}],activeCase:null,sidebar:'files',panel:'input',term:'output',timeoutMs:2000,theme:'dark',std:'c++17',opt:'O2',history:[],generator:DEFAULT_GEN,brute:DEFAULT_BRUTE};}
const state=safeLoad();
if(!Array.isArray(state.userTemplates))state.userTemplates=TEMPLATES.map((t,i)=>({...t,id:'builtin-'+i,shortcut:['base','bisect','bfs','dijkstra','knapsack','dsu','dfs'][i]}));
const BASE_PREFS={codeHintsEnabled:true,sampleSoundEnabled:true,sampleSoundVolume:35,codeforcesHandle:'',oiAccent:'#f3a66b',icpcAccent:'#63dfb5',lineNumbers:true,wordWrap:false,bracketMatch:true,cursorBlink:true,historyMinutes:1,autoSaveSeconds:2,language:'zh',accent:'#63dfb5',fontSize:14,fontFamily:'Cascadia Code, Fira Code, JetBrains Mono, Consolas, monospace',tabSize:4,density:'comfortable',showRight:true,showSidebar:true,terminalHeight:215,compareMode:'trim',defaultTemplate:'',cphAutoStart:true,cphPort:10043,clangdMode:'smart'};
state.preferences={...BASE_PREFS,...(state.preferences||{})};
// v5.5 migration: the old receiver was opt-in; new installs/updates auto-link by default.
// Once the user explicitly disables it in v5.5, the choice is preserved.
if(!state.companionAutoConnectMigrated){state.preferences.cphAutoStart=true;state.companionAutoConnectMigrated=true;}
if(!Number.isSafeInteger(Number(state.preferences.cphPort)) || Number(state.preferences.cphPort)<1024 || Number(state.preferences.cphPort)>65535)state.preferences.cphPort=10043;

const sampleSoundPlayer=window.YanpbSampleSounds.makePlayer();
function notifySampleSound(result){const type=window.YanpbSampleSounds.verdict(result);if(type)void sampleSoundPlayer.play(type,{enabled:state.preferences.sampleSoundEnabled,volume:state.preferences.sampleSoundVolume});}
state.competitionMode=state.competitionMode==='oi'?'oi':'icpc';
state.layout=state.layout||{left:216,right:300};
state.modeContests=state.modeContests||{icpc:null,oi:null};
if(state.currentContest&&!state.modeContests.icpc&&!state.modeContests.oi){
 const legacyMode=state.currentContest.exam?'oi':'icpc';state.modeContests[legacyMode]=state.currentContest;
}
state.currentContest=state.modeContests[state.competitionMode]||null;
state.contestWorkspaces=window.YanpbContestRegistry.migrate(state.contestWorkspaces,state.modeContests);
state.panelCollapsed=state.panelCollapsed||{left:false,right:false,bottom:false};
// Previous manual ICPC verdict ledger is intentionally no longer used.
state.editorPrompts=window.YanpbEditorPrompts.normalize(state.editorPrompts);
state.oiAudits=state.oiAudits||{};
state.terminalHeights=state.terminalHeights||{icpc:Math.round(state.preferences.terminalHeight||215),oi:275};
state.caseByFile=state.caseByFile||{};
if(!state.caseByFile[state.activeId])state.caseByFile[state.activeId]={cases:state.cases,activeCase:state.activeCase||state.cases[0]?.id};
let receiverEnabled=false;
function lang(){return state.preferences.language==='en'?'en':'zh';}
function tr(key){return window.YANPB_I18N?.[lang()]?.[key]||window.YANPB_I18N?.zh?.[key]||key;}
function translate(){
 document.body.dataset.lang=lang();document.documentElement.lang=lang()==='en'?'en':'zh-CN';
 document.querySelectorAll('[data-i18n]').forEach(el=>{if(el.dataset.i18n)el.textContent=tr(el.dataset.i18n);});
 document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>el.placeholder=tr(el.dataset.i18nPlaceholder));
 $('localeSwitch').textContent=lang()==='en'?'EN / 中':'中 / EN';
 const chip=$('compilerChip');if(chip && chip.textContent.includes('内置 GCC · 就绪') && lang()==='en')chip.innerHTML='<span class="tiny-led"></span> Bundled GCC · Ready';
 else if(chip && chip.textContent.includes('Bundled GCC · Ready') && lang()==='zh')chip.innerHTML='<span class="tiny-led"></span> 内置 GCC · 就绪';
 $('sidebarHeading').textContent=state.sidebar==='templates'?(lang()==='en'?'ALGORITHM TEMPLATES':'算法模板库'):state.sidebar==='history'?(lang()==='en'?'RUN HISTORY':'运行记录'):state.sidebar==='contest'?tr('contestNav'):tr('explorer');
 const statuses={files:tr('explorer'),templates:lang()==='en'?'Templates':'算法模板',history:lang()==='en'?'History':'运行记录',contest:tr('contestMode')};
 document.querySelectorAll('[data-nav]').forEach(el=>{if(el.dataset.nav in statuses)el.title=statuses[el.dataset.nav];});
}
function applyPersonalization(){
 const pref=state.preferences;const size=Math.min(24,Math.max(10,Number(pref.fontSize)||14));
 const tabSize=Math.min(8,Math.max(2,Number(pref.tabSize)||4));
 const family=String(pref.fontFamily||BASE_PREFS.fontFamily).replace(/[^\w\s,\-.'"\u4e00-\u9fff]/g,'').slice(0,180);
 const col=state.competitionMode==='oi'?(pref.oiAccent||'#f3a66b'):(pref.icpcAccent||(/^#[a-f0-9]{6}$/i.test(pref.accent)?pref.accent:BASE_PREFS.accent));
 document.body.style.setProperty('--accent',col);
 const n=parseInt(col.slice(1),16),r=n>>16,g=n>>8&255,b=n&255;
 document.body.style.setProperty('--accent-soft',`rgba(${r},${g},${b},.13)`);
 document.body.style.setProperty('--sidebar-width',Math.max(150,Math.min(380,Number(state.layout.left)||216))+'px');
 document.body.style.setProperty('--inspector-width',Math.max(220,Math.min(465,Number(state.layout.right)||300))+'px');
 document.body.dataset.density=pref.density==='compact'?'compact':'comfortable';
 document.body.dataset.mode=state.competitionMode;
 if($('modeWatermark'))$('modeWatermark').textContent=state.competitionMode.toUpperCase();
 $('modeICPC').classList.toggle('active',state.competitionMode==='icpc');$('modeOI').classList.toggle('active',state.competitionMode==='oi');$('modeICPC').setAttribute('aria-pressed',String(state.competitionMode==='icpc'));$('modeOI').setAttribute('aria-pressed',String(state.competitionMode==='oi'));
 document.body.dataset.hideSidebar=String(pref.showSidebar===false||state.panelCollapsed.left);
 document.body.dataset.hideInspector=String(pref.showRight===false||state.panelCollapsed.right);
 $('restoreRightBtn').classList.toggle('hidden',!(pref.showRight===false||state.panelCollapsed.right));
 document.body.dataset.hideTerminal=String(state.panelCollapsed.bottom);
 const terminalHeight=window.YanpbModes.clampTerminal(state.terminalHeights[state.competitionMode],document.querySelector('.center-stack')?.clientHeight||700);
 $('terminalPane').style.height=terminalHeight+'px';
 $('terminalPane').classList.toggle('is-collapsed',!!state.panelCollapsed.bottom);
 $('terminalResize').setAttribute('aria-valuenow',String(terminalHeight));
 $('terminalResize').setAttribute('aria-valuemax',String(Math.max(110,(document.querySelector('.center-stack')?.clientHeight||700)-210)));
 document.documentElement.style.setProperty('--user-font',family);
 if(editor)editor.setOption('indentUnit',tabSize);
 if(editor)editor.setOption('tabSize',tabSize);
 if(editor){editor.setOption('lineNumbers',pref.lineNumbers!==false);editor.setOption('lineWrapping',pref.wordWrap===true);editor.setOption('matchBrackets',pref.bracketMatch!==false);editor.setOption('cursorBlinkRate',pref.cursorBlink===false?0:530);}
 if(editor)editor.getWrapperElement().style.fontSize=size+'px';
 if(editor)editor.getWrapperElement().style.fontFamily=family;
 translate();syncThemeButton();sceneRenderSignature='';renderContestRibbon();
 if(state.sidebar==='contest')renderFiles();
 renderModePanel();
}

state.activeCase=state.activeCase||state.cases[0]?.id;state.files=state.files.slice(0,45);state.history=(state.history||[]).slice(0,40);state.cases=(state.cases||[]).slice(0,30);
let liveBridge=null, liveDiagnosticsByFile=new Map();
function mergedIssues(file){return [...(inlineDiagnosticsByFile.get(file?.id)||[]),...(liveDiagnosticsByFile.get(file?.id)||[])].sort((a,b)=>a.line-b.line||a.column-b.column);}
let sceneRenderSignature='',sidebarFileFilter='',diagnosticMarks=[],diagnosticGutterHandles=[],inlineDiagnosticsByFile=new Map();let editor=null,busy=false,lastResult=null,runCount=0,savingTimer,toastTimer,compilerChoices=[],suppressEditorChange=false;const runCache=new Map();state.compiler='bundled';
const activeFile=()=>state.files.find(f=>f.id===state.activeId)||state.files[0];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function saveState(){const payload={...state};delete payload.compiler;try{localStorage.setItem(STORAGE,JSON.stringify(payload));$('saveState').textContent=tr('autosaved');}catch{$('saveState').textContent='本地备份空间不足';}}
function persistSoon(){$('saveState').textContent=lang()==='en'?'Saving in 2 s…':'2 秒后自动保存…';clearTimeout(savingTimer);savingTimer=setTimeout(saveState,2000);}
function toast(text){const box=$('toast');box.textContent=text;box.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>box.classList.remove('visible'),3000);}
function renderFiles(){ $('fileCount').textContent=state.files.length;$('breadFile').textContent=activeFile().name;const root=$('sidebarList');root.replaceChildren();$('fileFilter').closest('.explorer-search-wrap').classList.toggle('hidden',state.sidebar!=='files');
 if(state.sidebar==='contest'){contestSidebar();return;}
 if(state.sidebar==='files') { state.files.filter(f=>!sidebarFileFilter||f.name.toLowerCase().includes(sidebarFileFilter)).forEach(f=>{const b=document.createElement('button');b.className='side-file'+(f.id===state.activeId?' selected':'');b.dataset.fileId=f.id;b.setAttribute('aria-haspopup','menu');b.title=f.fullPath||f.name;b.innerHTML='<span class="cpp-mark">C++</span><span class="side-name"></span>'+(f.dirty?'<span class="dirty-dot"></span>':'');b.querySelector('.side-name').textContent=f.name;b.onclick=()=>switchFile(f.id);root.appendChild(b);});}
 else if(state.sidebar==='templates'){const actions=document.createElement('div');actions.className='template-tool-bar';actions.innerHTML='<button id="templateManageSide">⚙ '+(lang()==='en'?'Manage':'管理')+'</button><button id="templateInsertSide">＋ '+(lang()==='en'?'Insert':'插入')+'</button>';root.appendChild(actions);actions.querySelector('#templateManageSide').onclick=showTemplateManager;actions.querySelector('#templateInsertSide').onclick=showTemplatePicker;let category='';state.userTemplates.forEach((t,i)=>{if(t.category!==category){category=t.category;const h=document.createElement('div');h.className='side-section-label';h.textContent=category;root.appendChild(h);}const b=document.createElement('button');b.className='side-template';b.innerHTML='<svg><use href="#i-code"/></svg><span></span><code class="template-shortcut"></code>';b.querySelector('span').textContent=t.name;b.querySelector('code').textContent=t.shortcut;b.onclick=()=>insertTemplate(i);root.appendChild(b);});}
 }
function reorderFileTabs(fromId,toId,after=false){
 if(fromId===toId)return false;
 const src=state.files.findIndex(x=>x.id===fromId);
 if(src<0||!state.files.some(x=>x.id===toId))return false;
 const [file]=state.files.splice(src,1);let dest=state.files.findIndex(x=>x.id===toId);
 state.files.splice(dest+(after?1:0),0,file);saveState();renderTabs();return true;
}
function renderTabs(){const root=$('fileTabs');root.replaceChildren();state.files.forEach(f=>{
 const b=document.createElement('button');b.type='button';b.draggable=true;
 b.className='file-tab'+(f.id===state.activeId?' active':'');b.dataset.fileId=f.id;
 b.setAttribute('aria-haspopup','menu');b.setAttribute('aria-label',f.name);b.title=f.fullPath||f.name;
 b.innerHTML='<span class="cpp-mark">C++</span><b></b><span class="tab-x" title="关闭标签">×</span>';
 b.querySelector('b').textContent=f.name+(f.dirty?' ●':'');
 b.onclick=()=>switchFile(f.id);
 b.querySelector('.tab-x').onclick=e=>{e.stopPropagation();closeFile(f.id);};
 b.addEventListener('auxclick',e=>{if(e.button===1){e.preventDefault();closeFile(f.id);}});
 b.addEventListener('dragstart',e=>{if(e.target.closest('.tab-x')){e.preventDefault();return;}e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/x-yanpb-file-id',f.id);b.classList.add('is-dragging');});
 b.addEventListener('dragover',e=>{if(!e.dataTransfer.types.includes('text/x-yanpb-file-id'))return;e.preventDefault();e.dataTransfer.dropEffect='move';b.classList.add('drop-target');});
 b.addEventListener('dragleave',()=>b.classList.remove('drop-target'));
 b.addEventListener('drop',e=>{e.preventDefault();b.classList.remove('drop-target');const id=e.dataTransfer.getData('text/x-yanpb-file-id');const mid=b.getBoundingClientRect().left+b.getBoundingClientRect().width/2;const from=state.files.findIndex(x=>x.id===id),to=state.files.findIndex(x=>x.id===f.id);const after=Math.abs(e.clientX-mid)<9?from<to:e.clientX>mid;reorderFileTabs(id,f.id,after);});
 b.addEventListener('dragend',()=>{$$('.file-tab').forEach(x=>x.classList.remove('is-dragging','drop-target'));});
 root.appendChild(b);
 });renderFiles();renderEditorScene();}
function switchFile(id){if(!state.files.some(f=>f.id===id))return;state.caseByFile[state.activeId]={cases:state.cases,activeCase:state.activeCase};state.activeId=id;const slot=state.caseByFile[id]||{cases:[{id:uid(),name:'Sample 1',input:'',expected:''}],activeCase:null};state.cases=slot.cases;state.activeCase=slot.activeCase||state.cases[0]?.id;state.caseByFile[id]={cases:state.cases,activeCase:state.activeCase};updateCaseList();suppressEditorChange=true;editor.setValue(activeFile().content);suppressEditorChange=false;editor.clearHistory();renderTabs();renderContestRibbon();displayCachedRun(activeFile());liveBridge?.changeFile();saveState();editor.focus();}
function closeFile(id){if(state.files.length===1){toast('至少保留一个编辑文件');return;}const item=state.files.find(f=>f.id===id);if(item?.dirty&&!confirm('此文件还未写回磁盘，确定关闭？本地自动备份也会移除该标签。'))return;state.files=state.files.filter(f=>f.id!==id);delete state.caseByFile[id];runCache.delete(id);if(state.activeId===id){state.activeId=state.files[0].id;const slot=state.caseByFile[state.activeId];if(slot){state.cases=slot.cases;state.activeCase=slot.activeCase;}updateCaseList();}suppressEditorChange=true;editor.setValue(activeFile().content);suppressEditorChange=false;renderTabs();displayCachedRun(activeFile());saveState();}
function addFile(name,content='',fullPath=null){if(state.files.length>=45){toast('最多打开 45 个文件');return;}const file={id:uid(),name,content,fullPath,dirty:false};state.files.push(file);state.caseByFile[file.id]={cases:[{id:uid(),name:'Sample 1',input:'',expected:''}],activeCase:null};switchFile(file.id);renderTabs();}
function newFile(){let n=1;while(state.files.some(f=>f.name==='untitled'+n+'.cpp'))n++;addFile('untitled'+n+'.cpp',state.preferences.defaultTemplate||state.userTemplates.find(t=>t.shortcut==='base')?.code||STARTER);}
async function openFile(){if(!native){toast('需要在 Windows 客户端中打开本机文件');return;}try{const f=await native.openFile();if(f)addFile(f.name,f.content,f.fullPath);}catch(e){toast(e.message);}}
async function saveFile(as=false){const f=activeFile();if(!native){const blob=new Blob([f.content],{type:'text/plain;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=f.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000);return;}try{const originalKey=historyIdentity(f);const r=await native.saveFile({name:f.name,content:f.content,fullPath:f.fullPath,saveAs:as});if(r){if(!f.fullPath){try{await native.historyMigrate?.(originalKey,r.fullPath);f.historyKey=r.fullPath;}catch(e){toast('历史版本目录迁移失败：'+e.message);}}f.name=r.name;f.fullPath=r.fullPath;f.dirty=false;renderTabs();saveState();void revisionCheckpoint(f,lang()==='en'?'Manual save':'手动保存');toast('已保存到：'+r.name);}}catch(e){toast(e.message);}}
function insertTemplate(idx){const t=state.userTemplates[idx];if(!t)return;insertSnippet(t);}
function editorChange(cm){if(suppressEditorChange)return;const f=activeFile();if(!f)return;const value=cm.getValue();if(f.content===value)return;f.content=value;if(f.fullPath)f.dirty=true;if(runCache.has(f.id))updateResult('STALE');inlineDiagnosticsByFile.delete(f.id);if(activeFile()?.id===f.id){clearInlineDiagnostics();updateProblemCounter();}if(localContest()&&currentContestTask()){const k=contestProgressKey();if(state.contestProgress?.[k]&&state.contestProgress[k].status!=='STALE'){state.contestProgress[k]={...state.contestProgress[k],status:'STALE',testCount:0};renderContestRibbon();if(state.sidebar==='contest')contestSidebar();}}$('characterCount').textContent=f.content.length+' 字符';liveBridge?.changed();persistSoon();scheduleCodeAutosave(f);}
function onCursor(cm){const p=cm.getCursor();$('cursorPos').textContent='Ln '+(p.line+1)+', Col '+(p.ch+1);}
function syncThemeButton(){
 const button=$('themeBtn'), icon=$('themeIcon');if(!button||!icon)return;
 const dark=state.theme!=='light';
 icon.setAttribute('href',dark?'#i-sun':'#i-moon');
 button.setAttribute('aria-pressed',String(!dark));
 button.setAttribute('aria-label',dark?(lang()==='en'?'Switch to light theme':'切换亮色主题'):(lang()==='en'?'Switch to dark theme':'切换暗色主题'));
 button.title=button.getAttribute('aria-label')+' · Ctrl+Alt+T';
}
function updateTheme(theme){state.theme=theme==='light'?'light':'dark';document.body.dataset.theme=state.theme;syncThemeButton();applyPersonalization();persistSoon();}
function selectNav(target){if(target==='stress'){showStress();return;}if(target==='cph'){showCompanion();return;}if(target==='history')target='files';state.sidebar=target;renderContestRibbon();$$('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===target));$('sidebarHeading').textContent=({files:tr('explorer'),templates:lang()==='en'?'TEMPLATES':'算法模板库',history:lang()==='en'?'HISTORY':'运行记录',contest:tr('contestNav')})[target]||tr('explorer');renderFiles();saveState();}
function updateCaseList(){if(state.caseByFile[state.activeId])state.caseByFile[state.activeId]={cases:state.cases,activeCase:state.activeCase};const root=$('caseList');root.replaceChildren();state.cases.forEach((c,i)=>{const b=document.createElement('button');b.className='case-option'+(c.id===state.activeCase?' active':'');b.innerHTML='<span class="case-index">'+(i+1)+'</span><span></span>';b.querySelector('span:last-child').textContent=c.name;b.onclick=()=>{state.activeCase=c.id;state.caseByFile[state.activeId].activeCase=c.id;updateCaseList();saveState();};root.appendChild(b);});$('caseCount').textContent=state.cases.length;const curr=state.cases.find(c=>c.id===state.activeCase)||state.cases[0];$('caseInput').value=curr?.input||'';$('caseOutput').value=curr?.expected||'';renderEditorScene();}
function inspect(panel){state.panel=panel;$$('[data-panel]').forEach(b=>b.classList.toggle('active',b.dataset.panel===panel));$('inputPanel').classList.toggle('hidden',panel!=='input');$('casesPanel').classList.toggle('hidden',panel!=='cases');saveState();}
function changeCase(k,v){const c=state.cases.find(c=>c.id===state.activeCase);if(c){c[k]=v;if(k==='input')persistSoon();}}
function addCase(){if(state.cases.length>=30){toast('最多 30 组样例');return;}const n=state.cases.length+1;const c={id:uid(),name:'样例 '+n,input:'',expected:''};state.cases.push(c);state.activeCase=c.id;state.caseByFile[state.activeId]={cases:state.cases,activeCase:c.id};updateCaseList();persistSoon();}
function deleteCase(){if(state.cases.length<=1){toast('至少保留 1 组样例');return;}state.cases=state.cases.filter(c=>c.id!==state.activeCase);state.activeCase=state.cases[0].id;state.caseByFile[state.activeId]={cases:state.cases,activeCase:state.activeCase};updateCaseList();persistSoon();}
function updateResult(status='READY',timeMs=null){const e=$('resultState');e.className='result-pill '+(status==='OK'||status==='PASS'?'success':status==='READY'?'neutral':status==='RUNNING'?'pending':status==='STALE'?'warning':'fail');e.textContent='● '+status;$('runtimeBadge').textContent=timeMs===null?'— ms':timeMs+' ms';}
function textOutput(content,klass=''){const el=$('terminalOutput');el.replaceChildren();const pre=document.createElement('pre');pre.className='output-pre '+klass;pre.textContent=String(content||'（程序没有标准输出）');el.appendChild(pre);}
function terminal(tab){state.term=tab;$$('[data-term]').forEach(b=>b.classList.toggle('active',b.dataset.term===tab));renderTerminal();}
function renderTerminal(){if(state.term==='debug'){liveBridge?.renderDebug();return;}if(!lastResult){if(state.term==='output')return;if(state.term==='problems'){renderProblems();return;} if(state.term==='errors'){textOutput('还没有编译诊断信息');return;}textOutput('还没有样例测试结果');return;}
 const res=lastResult;if(state.term==='output') {
   if(res.stage==='compile'){textOutput('编译失败，详情请查看「编译信息」。','stderr-pre');return;}
   const lines=(res.results||[]).map((r,i)=>res.results.length>1?`── ${r.name}: ${r.status} · ${r.timeMs} ms ──\n${r.stdout||'(无输出)'}`:r.stdout).join('\n');
   textOutput(lines||'（程序没有标准输出）');
 } else if(state.term==='problems'){renderProblems();} else if(state.term==='debug'){liveBridge?.renderDebug();} else if(state.term==='errors'){showDiagnostics(res.stderr||res.compileInfo||((res.results||[]).map(r=>r.stderr).filter(Boolean).join('\n'))||'编译通过，没有编译警告或错误。');}
 else if(state.term==='tests'){renderTestResults(res);}
}
function clearInlineDiagnostics(){
 for(const m of diagnosticMarks){try{m.clear?.();}catch{}}
 diagnosticMarks=[];
 if(!editor){diagnosticGutterHandles=[];return;}
 editor.operation(()=>{for(const [handle,css] of diagnosticGutterHandles){
   try{editor.removeLineClass(handle,'gutter',css);}catch{}
 }});
 diagnosticGutterHandles=[];
}
function updateProblemCounter(){
 const n=mergedIssues(activeFile()).filter(x=>x.severity==='error'||x.severity==='warning').length;
 $('problemCount').textContent=String(n);$('problemsTab').classList.toggle('has-problems',n>0);renderEditorScene();
}
function renderInlineDiagnostics(file){
 if(!editor)return;clearInlineDiagnostics();const items=mergedIssues(file);updateProblemCounter();if(!items.length)return;
 let shown=0;editor.operation(()=>window.YanpbDiagnosticEngine.lineGroups(items).forEach(group=>{
  const line=group.line-1;if(line<0||line>=editor.lineCount())return;
  const main=group.diagnostics[0],severity=main.severity==='warning'?'warning':main.severity==='note'?'note':'error';
  // Keep diagnostics inside the numerical gutter instead of allocating a
  // separate 19px-wide column. Inline underlines and Problems remain intact.
  const handle=editor.addLineClass(line,'gutter','yanpb-diag-gutter-'+severity);
  if(handle)diagnosticGutterHandles.push([handle,'yanpb-diag-gutter-'+severity]);
  const text=editor.getLine(line)||'',start=Math.max(0,Math.min(text.length,main.column-1)),end=Math.min(text.length,start+Math.max(1,text.slice(start).match(/^\w+/)?.[0]?.length||1));
  if(end>start)diagnosticMarks.push(editor.markText({line,ch:start},{line,ch:end},{className:'inline-diag-underline '+severity,title:group.diagnostics.map(d=>d.message).join('\n')}));
  if(severity!=='error'||shown>=3)return;shown++;
  const panel=document.createElement('div');panel.className='inline-diagnostic-widget '+severity;
  const message=document.createElement('span');message.textContent=(severity==='error'?'✕ ':severity==='warning'?'⚠ ':'ⓘ ')+main.message.slice(0,130)+(group.diagnostics.length>1?'  +'+(group.diagnostics.length-1):'');panel.append(message);
  const hint=window.YanpbDiagnosticEngine.advice(main,lang());if(hint.id!=='generic'){const small=document.createElement('small');small.textContent=hint.text;panel.append(small);}
  // Keep the editor readable: never stack a full widget for every cascading diagnostic.
  if(group.diagnostics.length>1){const btn=document.createElement('button');btn.textContent=lang()==='en'?'All related problems':'查看本行全部问题';btn.onclick=()=>{state.term='problems';$$('[data-term]').forEach(t=>t.classList.toggle('active',t.dataset.term==='problems'));renderProblems();};panel.append(btn);}
  diagnosticMarks.push(editor.addLineWidget(line,panel,{above:false,coverGutter:false,noHScroll:true}));
 }));
}
function captureInlineDiagnostics(file,result){
 if(!file)return;const raw=String(result?.stderr||result?.compileInfo||'');
 const extracted=window.YanpbDiagnosticEngine.parse(raw,{source:file.name});inlineDiagnosticsByFile.set(file.id,extracted);
 if(activeFile()?.id===file.id)renderInlineDiagnostics(file);
}
function renderProblems(){
 const parent=$('terminalOutput');parent.replaceChildren();const en=lang()==='en',items=mergedIssues(activeFile()),summary=window.YanpbDiagnosticEngine.summary(items);
 const head=document.createElement('div');head.className='problems-summary';const title=document.createElement('strong');title.textContent=(en?'Problems in ':'当前文件问题 · ')+(en?activeFile().name:'')+'  '+summary.errors+' '+(en?'errors':'错误')+' · '+summary.warnings+' '+(en?'warnings':'警告');head.append(title);
 const actions=document.createElement('div');actions.className='problems-actions';const all=document.createElement('button');all.textContent=en?'Compiler log':'原始编译日志';all.onclick=()=>terminal('errors');actions.append(all);head.append(actions);parent.append(head);
 if(!items.length){const blank=document.createElement('div');blank.className='problem-empty';blank.innerHTML='<b>✓</b><span></span>';const isStale=runCache.has(activeFile().id)&&runCache.get(activeFile().id).code!==activeFile().content;blank.querySelector('span').textContent=isStale?(en?'Source has changed — recompile to refresh diagnostics.':'源码已修改，请重新编译后查看最新诊断。'):(lastResult?.status==='CE'?(en?'Compiler failed without a source-line location. Open the original build log.':'编译失败，但错误没有明确源码行号；请查看原始编译日志。'):(en?'No compiler issues for this version of the file.':'当前版本暂无编译器问题。'));parent.append(blank);return;}
 const sourceLines=activeFile().content.split('\n');
 items.forEach(item=>{const row=document.createElement('article');row.className='problem-entry is-'+item.severity;
  const icon=document.createElement('span');icon.className='severity-mark';icon.textContent=item.severity==='error'?'✕':item.severity==='warning'?'⚠':'i';
  const body=document.createElement('div');body.className='problem-main';const main=document.createElement('strong');main.textContent=item.message;body.append(main);
  const location=document.createElement('small');location.textContent=(en?'Line ':'第 ')+item.line+(en?', column ':' 行，第 ')+item.column+(en?'':' 列')+' · '+item.file;body.append(location);
  const hint=window.YanpbDiagnosticEngine.advice(item,lang());const tip=document.createElement('small');tip.className='fix-note';tip.textContent='💡 '+hint.text;body.append(tip);
  const fix=window.YanpbDiagnosticEngine.proposeFix(item,sourceLines);
  if(fix){const apply=document.createElement('button');apply.textContent=en?'Preview fix':'预览修改';apply.onclick=()=>previewDiagnosticFix(fix);body.append(apply);}
  const go=document.createElement('button');go.textContent=en?'Jump':'定位';go.onclick=()=>{editor.setCursor(item.line-1,Math.max(0,item.column-1));editor.scrollIntoView({line:item.line-1,ch:0},90);editor.focus();};
  row.append(icon,body,go);parent.append(row);
 });
}
function previewDiagnosticFix(fix){
 if(!window.YanpbDiagnosticEngine.validateFix(fix,editor.getLine(fix.line-1))){toast(lang()==='en'?'Source changed; rerun diagnostics.':'源码已改变，请重新编译获取诊断。');return;}
 const yes=confirm((lang()==='en'?'Apply this suggested edit? Review it first.':'是否应用这条建议？请先确认改动。')+'\n\n- '+fix.before+'\n+ '+fix.after);
 if(!yes)return;
 editor.replaceRange(fix.after,{line:fix.line-1,ch:0},{line:fix.line-1,ch:fix.before.length},'+quickfix');
 editor.setCursor({line:fix.line-1,ch:fix.after.length});editor.focus();
 toast(lang()==='en'?'Suggested edit applied. Recompile to verify.':'已应用建议，请重新编译验证，不能保证自动修复成功。');
}
function displayCachedRun(file){
 const entry=file&&runCache.get(file.id);
 if(!entry){renderInlineDiagnostics(file);lastResult=null;state.term='output';$$('[data-term]').forEach(x=>x.classList.toggle('active',x.dataset.term==='output'));updateResult('READY');textOutput(lang()==='en'?'This file has no run results yet. Press F5 or F7 to test.':'当前文件尚无运行记录。按 F5 编译运行，或 F7 测试样例。');return;}
 if(file.content===entry.code)renderInlineDiagnostics(file);else clearInlineDiagnostics();lastResult=entry.result;state.term=entry.tab||'output';$$('[data-term]').forEach(x=>x.classList.toggle('active',x.dataset.term===state.term));
 const changed=file.content!==entry.code;renderTerminal();updateResult(changed?'STALE':entry.result.status,entry.timeMs||null);
 if(changed)$('statusText').textContent=lang()==='en'?'Source changed since last run — rerun to refresh':'源码已修改：当前显示上次运行结果，请重新测试';
}
function cacheRun(file,code,result,tab,timeMs){
 runCache.set(file.id,{code,result,tab,timeMs});if(file.content===code)captureInlineDiagnostics(file,result);else{inlineDiagnosticsByFile.delete(file.id);if(activeFile()?.id===file.id)clearInlineDiagnostics();}
 if(activeFile()?.id===file.id)displayCachedRun(file);
 else toast((lang()==='en'?'Run finished for ':'运行已完成：')+file.name+' · '+result.status);
}
async function run(all=false){if(busy)return;if(all)sampleSoundPlayer.arm({enabled:state.preferences.sampleSoundEnabled,volume:state.preferences.sampleSoundVolume});const f=activeFile();const runTaskKey=contestProgressKey(),sourceCode=f.content;if(!f.content.trim()){toast('代码为空');return;}
 if(localContest()?.exam&&currentContestTask()&&native?.contestCheck){
   busy=true;updateButtons();updateResult('RUNNING');$('statusText').textContent=lang()==='en'?'CSP file-I/O judging…':'CSP 文件读写模拟评测中…';
   try{
     if(f.dirty){const r=await native.saveFile({name:f.name,content:f.content,fullPath:f.fullPath,saveAs:false});if(!r)throw Error('源文件未保存');f.dirty=false;renderTabs();saveState();}
     const current=currentContestTask();const cases=all?state.cases.filter(c=>c.input||c.expected).map(c=>({...c})): [{name:lang()==='en'?'Custom input':'自定义输入',input:state.stdin,expected:null}];
     const r=await native.contestCheck(localContest(),current.task,cases,{compiler:'bundled',compareMode:state.preferences.compareMode});
     const verdicts=(r.results||[]);const result={stage:r.status==='CE'?'compile':'run',status:r.status,results:verdicts.map(x=>({...x,stdout:x.output??'(no .out file)',stderr:x.stderr||'',input:x.input||''})),stderr:r.compiler||'',compileMs:r.compileMs};
     cacheRun(f,sourceCode,result,r.status==='CE'?'problems':all?'tests':'output',verdicts.reduce((a,x)=>a+(x.timeMs||0),0));
     if(all&&f.content===sourceCode)notifySampleSound(result);
     $('statusText').textContent=f.content!==sourceCode?'源码已修改：本次结果已过期':current.task+'.cpp · '+r.status;markContestResult(r.status,verdicts.length,runTaskKey);
   }catch(e){updateResult('ERROR');textOutput(e.message,'stderr-pre');toast(e.message);}finally{busy=false;updateButtons();}
   return;
 }
 if(!native){toast('网页为界面预览，实际编译请运行 Windows 客户端');return;}
 busy=true;updateButtons();state.term=all?'tests':'output';$$('[data-term]').forEach(b=>b.classList.toggle('active',b.dataset.term===state.term));updateResult('RUNNING');$('statusText').textContent='正在调用本地 C++ 编译器…';textOutput('> '+(state.compiler==='auto'?'内置 GCC（自动）':state.compiler)+' -std='+state.std+' -'+state.opt+' main.cpp\n> 正在编译…');
 try {
  const payload={code:f.content,standard:state.std,optimization:state.opt,compiler:'bundled',timeoutMs:state.timeoutMs,stdin:state.stdin,compareMode:state.preferences.compareMode};
  if(all)payload.cases=state.cases.map(c=>({...c}));
  const res=await native.run(payload);runCount++;$('runNum').textContent=runCount;
  const total=(res.results||[]).reduce((a,r)=>a+r.timeMs,0);
  cacheRun(f,sourceCode,res,res.stage==='compile'?'problems':all?'tests':'output',res.stage==='compile'?res.compileMs:total);
  if(all&&f.content===sourceCode)notifySampleSound(res);
  $('statusText').textContent=f.content!==sourceCode?'源码已修改：结果已过期，请重新编译':(all?'样例测试完成 · ':'运行完成 · ')+res.status;if(all)markContestResult(res.status,res.results?.length||0,runTaskKey);
  // The result belongs to the file that started this run, even if the user switched tabs.
  persistSoon();
 }catch(e){updateResult('ERROR');$('statusText').textContent='编译或运行失败';textOutput(e.message,'stderr-pre');toast(e.message);}
 finally{busy=false;updateButtons();}
}
function updateButtons(){$('runBtn').disabled=busy;$('allCasesBtn').disabled=busy;$('stopBtn').disabled=!busy;}
async function stop(){if(native){await native.cancel();$('statusText').textContent='已发送停止信号';}}
function showModal(title,markup,wide=false){$('modalTitle').textContent=title;$('modalBody').innerHTML=markup;$('modal').classList.toggle('wide',wide);$('modalBackdrop').classList.remove('hidden');}
function closeModal(){$('modalBackdrop').classList.add('hidden');}
async function showSettings(){
 const en=lang()==='en';
 const bundled=compilerChoices.find(x=>x.bundled);
 showModal(isMac?(en?'Apple Clang · macOS':'Apple Clang · macOS'):en?'Bundled GCC · Environment':'内置 GCC · 编译环境',`<div class="env-overview"><div class="env-symbol"><svg><use href="#i-check"/></svg></div><div><strong>${en?(isMac?'Apple Clang (Xcode CLT)':'Official bundled GCC only'):(isMac?'使用 macOS Apple Clang (Xcode CLT)':'仅使用 CodeLab 内置 GCC')}</strong><p>${en?(isMac?'Uses the Apple C++ toolchain via xcrun. Install developer tools with xcode-select --install.':'No system compiler, Clang or custom binary may be selected.'):(isMac?'使用 macOS 开发工具的 Apple Clang，请执行 xcode-select --install 安装。':'不使用系统 GCC、Clang 或自定义编译器路径。')}</p><span id="envState" class="env-state">${bundled?(en?'✓ Ready':'✓ 已就绪'):(en?'Not found · check install':'尚未检测到 · 请检查安装包')}</span></div></div>
 <div class="settings-stat"><span>${en?'C++ compiler':'C++ 编译器'}</span><b>${isMac?'Apple Clang / clang++':'GCC / g++'}</b></div>
 <div class="settings-stat"><span>${en?'Selection policy':'编译策略'}</span><b>${isMac?'Apple Xcode CLT':en?'Bundled only':'仅内置 GCC'}</b></div>
 <div class="settings-stat"><span>${en?'Bundled binary':'实际运行路径'}</span><code id="envPath">${esc(bundled?.path||'—')}</code></div>
 <div class="settings-stat"><span>${en?'Version':'版本'}</span><span id="envVersion">${esc(bundled?.version||'—')}</span></div>
 <div class="modal-actions"><button id="probeBtn" class="button secondary">${isMac?(en?'Check Apple Clang':'检测 Apple Clang'):en?'Check bundled compiler':'检测内置编译器'}</button><button class="button primary" id="envDone">${en?'Done':'完成'}</button></div>
 <p class="hint">${isMac?'macOS 使用 Apple Clang / Xcode Command Line Tools；需要 xcode-select --install。当前 GDB 功能只支持 Windows。':en?'A complete Windows installation contains GCC, GDB and the C++ libraries. Compilation runs locally without modifying PATH.':'完整 Windows 安装包提供 GCC、GDB 和 C++ 标准库，编译不依赖系统 PATH。'}</p>`);
 $('envDone').onclick=closeModal;
 $('probeBtn').onclick=async()=>{if(!native){toast(en?'Available in desktop app':'需在桌面客户端检测');return;}
   $('probeBtn').disabled=true;try{compilerChoices=(await native.detectCompilers()).filter(c=>c.bundled);closeModal();showSettings();}catch(e){toast(e.message);$('probeBtn').disabled=false;}};
}

function showStress(){const en=lang()==='en';showModal(en?'Differential Stress Testing':'程序对拍实验室',`<p class="modal-desc">${en?'The active source file is the candidate. Enter a test generator and a trusted brute-force reference; we will compile and compare them locally.':'将当前标签作为待测程序，输入数据生成器与标准程序。系统使用本机编译器逐组比对，遇到首个反例即停止。'}</p><div class="stress-grid"><div class="stress-col"><strong>01 · ${en?'Test Generator':'测试数据生成器'} (generator.cpp)</strong><textarea id="stressGen" spellcheck="false"></textarea></div><div class="stress-col"><strong>02 · ${en?'Reference / Brute Force':'暴力 / 标准程序'} (brute.cpp)</strong><textarea id="stressBrute" spellcheck="false"></textarea></div></div><div class="stress-control"><label for="stressRounds">${en?'Rounds':'测试轮数'}</label><input type="number" id="stressRounds" min="1" max="200" value="30"><span class="hint">${en?'Candidate':'当前待测程序'}: ${esc(activeFile().name)} · ${en?'Generator receives argv[1] as an integer seed':'生成器接收 argv[1] 作为整数种子'}</span></div><div id="stressSummary" class="stress-summary">${en?'Not started. The first counterexample will appear here.':'对拍尚未开始。按下开始后将显示首个反例。'}</div><div class="modal-actions"><button class="button secondary" id="stressCancel">${en?'Cancel Task':'终止当前任务'}</button><button class="button primary" id="stressStart"><svg><use href="#i-run"/></svg> ${en?'Start Stress Test':'开始对拍'}</button></div>`,true);
 $('stressGen').value=state.generator||DEFAULT_GEN;$('stressBrute').value=state.brute||DEFAULT_BRUTE;
 $('stressGen').oninput=()=>{state.generator=$('stressGen').value;persistSoon();};$('stressBrute').oninput=()=>{state.brute=$('stressBrute').value;persistSoon();};
 $('stressCancel').onclick=()=>stop();
 $('stressStart').onclick=async()=>{if(busy){toast('请先结束正在运行的任务');return;}if(!native){toast('对拍功能需要 Windows 客户端');return;}busy=true;updateButtons();$('stressStart').disabled=true;$('stressSummary').textContent=en?'Compiling generator, candidate and reference…':'编译数据生成器和两份程序中…';try{const res=await native.stress({generator:$('stressGen').value,brute:$('stressBrute').value,code:activeFile().content,compiler:'bundled',standard:state.std,optimization:state.opt,timeoutMs:state.timeoutMs,iterations:Number($('stressRounds').value)});
 let msg='';if(res.status==='PASS')msg='✓ 已通过 '+res.rounds+' 轮对拍。暂未发现输出不一致。';else if(res.status==='MISMATCH')msg=`✕ 第 ${res.round} 轮发现差异！\n\n【触发输入】\n${res.input}\n\n【待测程序：${res.fast.status}】\n${res.fast.stdout}\n\n【标准程序：${res.brute.status}】\n${res.brute.stdout}`;else if(res.status==='CE')msg='编译失败（'+res.target+'）：\n'+res.stderr;else msg='运行错误（第 '+res.round+' 轮）：\n'+JSON.stringify(res.generator||res);
 $('stressSummary').textContent=msg;$('statusText').textContent='对拍完成 · '+res.status;
 }catch(e){$('stressSummary').textContent='任务中止 / 失败：'+e.message;}finally{busy=false;updateButtons();$('stressStart').disabled=false;}};
}
function quickPalette(){showModal('快速打开',`<input class="palette-input" id="paletteSearch" placeholder="搜索算法模板、代码文件…" autocomplete="off"><div class="palette-list" id="paletteList"></div>`);const search=$('paletteSearch'),list=$('paletteList');function update(){const q=search.value.toLowerCase();list.replaceChildren();const entries=[...state.files.map(f=>({name:f.name,group:'工作区文件',click:()=>switchFile(f.id)})),...state.userTemplates.map((t,i)=>({name:t.name+' · '+t.shortcut,group:t.category,click:()=>insertTemplate(i)}))].filter(x=>x.name.toLowerCase().includes(q));entries.forEach(en=>{const b=document.createElement('button');b.className='palette-entry';const name=document.createElement('span');name.textContent=en.name;const group=document.createElement('small');group.textContent=en.group;b.append(name,group);b.onclick=()=>{closeModal();en.click();};list.appendChild(b);});}search.oninput=update;update();search.focus();}
function caseFilename(problem){
 let title=String(problem.name||'Problem').normalize('NFKC').replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').replace(/\s+/g,'_').slice(0,58).replace(/[. ]+$/,'');
 if(!title)title='Problem';
 let name=title+'.cpp',suffix=2;
 while(state.files.some(f=>f.name===name))name=title+'-'+suffix+++'.cpp';
 return name;
}
const importedCompanionIds=new Set();
function importCompanionProblem(problem){
 try{
  if(!problem||!Array.isArray(problem.tests))throw Error('Competitive Companion payload has no tests array');
  if(problem.deliveryId&&importedCompanionIds.has(problem.deliveryId))return;
  if(problem.deliveryId){importedCompanionIds.add(problem.deliveryId);if(importedCompanionIds.size>150)importedCompanionIds.delete(importedCompanionIds.values().next().value);}
  const bridge=window.YanpbCompanionLink;
  const identity=bridge.taskIdentity(problem);
  let file=bridge.lookupExistingFile(problem,state.files);
  // Attach to a contest file only when the contest identity is verified.
  const contestFile=!file?bridge.matchContestFile(problem,localContest()):null;
  if(!file&&contestFile)file=state.files.find(f=>f.fullPath===contestFile.source)||null;
  let isNew=false;
  if(!file){
    if(state.files.length>=45)throw Error('Workspace limit reached (45 files)');
    const before=state.files.length;
    addFile(caseFilename(problem),state.preferences.defaultTemplate||TEMPLATES[0].code);
    if(state.files.length===before)throw Error('Could not create source tab');
    file=activeFile();isNew=true;
  }else if(file.id!==state.activeId)switchFile(file.id);
  // Importing the same problem never replaces handwritten C++ source code.
  const cases=problem.tests.slice(0,30).map((t,i)=>({id:uid(),name:(lang()==='en'?'Sample ':'样例 ')+(i+1),input:String(t.input??''),expected:String(t.expected??t.output??'')}));
  if(!cases.length)cases.push({id:uid(),name:'Sample 1',input:'',expected:''});
  state.cases=cases;state.activeCase=cases[0].id;
  state.caseByFile[file.id]={cases,activeCase:cases[0].id};
  file.problemInfo={...file.problemInfo,name:String(problem.name||''),url:problem.url||'',group:problem.group||'',cphKey:identity?.key||'',importedAt:Date.now()};
  if(Number.isFinite(problem.timeLimit)&&problem.timeLimit>=250)state.timeoutMs=Math.max(250,Math.min(10000,Math.round(problem.timeLimit)));
  updateCaseList();inspect('cases');renderTabs();persistSoon();
  if(problem.deliveryId)void native?.companionAck?.(problem.deliveryId).catch(()=>{});
  toast((lang()==='en'?'Competitive Companion: ':'浏览器题目已同步：')+file.name+' · '+cases.length+(isNew?' · new tab':' · samples refreshed'));
 }catch(err){toast((lang()==='en'?'Companion import failed: ':'题目导入失败：')+err.message);}
}
async function toggleReceiver(enabled){
 if(!native?.toggleCompanion){toast(lang()==='en'?'Requires desktop app':'此功能需要桌面客户端');return;}
 const port=Number(state.preferences.cphPort)||10043;
 try{
  const result=await native.toggleCompanion(enabled,port);
  receiverEnabled=result.enabled;
  state.preferences.cphAutoStart=enabled;
  const btn=$('receiverSwitch');if(btn)btn.textContent=receiverEnabled?tr('cphDisable'):tr('cphEnable');
  const quick=$('cphStateBtn');if(quick){quick.textContent=receiverEnabled?(lang()==='en'?'● Companion linked':'● CPH 已连接'):tr('receiveSamples');quick.classList.toggle('cph-connected',receiverEnabled);}
  const label=$('receiverStatus');if(label)label.textContent=receiverEnabled?tr('cphListening')+' · localhost:'+result.port:tr('cphDisabled');
  $('cphBtn').classList.toggle('active',receiverEnabled);
  persistSoon();return true;
 }catch(err){
  // A failed port switch does not stop the previously working receiver.
  const live=await native.companionStatus?.().catch(()=>null);
  receiverEnabled=!!live?.enabled;
  const label=$('receiverStatus');if(label)label.textContent=err.message;
  toast((lang()==='en'?'Receiver error: ':'接收器错误：')+err.message);
  return false;
 }
}

function showCompanion(){
 const en=lang(),port=Number(state.preferences.cphPort)||10043;
 showModal(tr('cphHeading'),`<p class="modal-desc">${en?'Direct link: click Competitive Companion in the browser and the task/samples appear here automatically.':'浏览器安装 Competitive Companion 后，打开题目点击扩展图标，即可直接同步题目、样例和 OJ 地址。'}</p>
 <div class="receiver-state"><strong id="receiverStatus">${receiverEnabled?tr('cphListening'):tr('cphDisabled')}</strong><div>${tr('cphPort')}: <b>localhost:${port}</b></div><small>${en?'Browser extension default port: 10043. If occupied, configure the same custom port on both sides.':'扩展默认支持 10043；如被占用，可在扩展 Custom ports 和这里设置相同的端口。'}</small></div>
 <label for="cphPortInput">${en?'Local receiver port':'本地接收端口'}</label><input id="cphPortInput" type="number" min="1024" max="65535" value="${port}"/>
 <div class="modal-actions"><button id="receiverSwitch" class="button primary">${receiverEnabled?tr('cphDisable'):tr('cphEnable')}</button><button id="cphApplyPort" class="button secondary">${en?'Apply port':'应用端口'}</button></div>
 <div class="modal-section"><label class="preference-toggle"><input type="checkbox" id="autoReceiver" ${state.preferences.cphAutoStart?'checked':''}>${en?'Connect automatically at launch':'启动 CodeLab 时自动连接浏览器扩展'}</label>
 <p>${en?'Only browser → local problem/sample data. No browser login or direct OJ submission is performed by Competitive Companion.':'仅接收浏览器扩展发来的题目与样例；Competitive Companion 不负责官方代码提交或登录。'}</p></div>`);
 $('receiverSwitch').onclick=()=>toggleReceiver(!receiverEnabled);
 $('cphApplyPort').onclick=async()=>{const n=Number($('cphPortInput').value);if(!Number.isSafeInteger(n)||n<1024||n>65535){toast('端口应在 1024～65535 之间');return;}const old=state.preferences.cphPort;state.preferences.cphPort=n;const ok=await toggleReceiver(true);if(!ok)state.preferences.cphPort=old;};
 $('autoReceiver').onchange=e=>{state.preferences.cphAutoStart=e.target.checked;persistSoon();};
}
function showJsonImport(){
 showModal(tr('importJson'),`<p class="modal-desc">${lang()==='en'?'Paste Competitive Companion JSON {name, tests:[{input, output}]} or an array of testcases.':'粘贴 Competitive Companion JSON（含 name、tests）或样例数组；不会访问任何网页。'}</p>
 <textarea id="problemJson" class="pref-template" spellcheck="false" placeholder='{"name":"A+B","tests":[{"input":"1 2\\n","output":"3\\n"}]}'></textarea>
 <div class="modal-actions"><button id="importCasesNow" class="button primary">${lang()==='en'?'Import':'导入样例'}</button></div>`);
 $('importCasesNow').onclick=()=>{try{
  const data=JSON.parse($('problemJson').value), raw=Array.isArray(data)?data:data.tests;
  if(!Array.isArray(raw)||!raw.length||raw.length>30)throw Error('Expected 1–30 testcases');
  const cases=raw.map((c,i)=>{if(typeof c.input!=='string'||typeof(c.output??c.expected)!=='string')throw Error('Invalid case '+(i+1));return {id:uid(),name:'Sample '+(i+1),input:c.input,expected:c.output??c.expected};});
  state.cases=cases;state.activeCase=cases[0].id;state.caseByFile[state.activeId]={cases,activeCase:cases[0].id};
  updateCaseList();persistSoon();closeModal();toast(tr('sampleImported')+' ('+cases.length+')');
 }catch(e){toast(e.message);}};
}
function normalizedPrefs(input){
 const a=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
 return {
  language:a.language==='en'?'en':'zh',accent:/^#[a-f0-9]{6}$/i.test(a.accent||'')?a.accent:BASE_PREFS.accent,
  fontSize:Math.min(24,Math.max(10,Number(a.fontSize)||14)),
  fontFamily:typeof a.fontFamily==='string'?a.fontFamily.slice(0,160):BASE_PREFS.fontFamily,
  tabSize:[2,4,8].includes(Number(a.tabSize))?Number(a.tabSize):4,
  density:a.density==='compact'?'compact':'comfortable',
  showRight:a.showRight!==false,showSidebar:a.showSidebar!==false,
  terminalHeight:Math.min(440,Math.max(115,Number(a.terminalHeight)||215)),
  compareMode:a.compareMode==='strict'?'strict':'trim',
  defaultTemplate:typeof a.defaultTemplate==='string'?a.defaultTemplate.slice(0,20000):'',
  oiAccent:/^#[0-9a-f]{6}$/i.test(a.oiAccent||'')?a.oiAccent:'#f3a66b',icpcAccent:/^#[0-9a-f]{6}$/i.test(a.icpcAccent||'')?a.icpcAccent:'#63dfb5',
  codeHintsEnabled:a.codeHintsEnabled!==false,
  lineNumbers:a.lineNumbers!==false,wordWrap:a.wordWrap===true,bracketMatch:a.bracketMatch!==false,cursorBlink:a.cursorBlink!==false,historyMinutes:[1,3,5].includes(+a.historyMinutes)?+a.historyMinutes:1,autoSaveSeconds:2,
  clangdMode:window.YanpbPerformancePolicy.normalizeMode(a.clangdMode),codeforcesHandle:typeof a.codeforcesHandle==='string'&&/^[A-Za-z0-9_.-]{3,24}$/.test(a.codeforcesHandle)?a.codeforcesHandle:'',sampleSoundEnabled:a.sampleSoundEnabled!==false,sampleSoundVolume:window.YanpbSampleSounds.normalizeSettings({volume:a.sampleSoundVolume}).volume,cphAutoStart:a.cphAutoStart!==false,cphPort:Number.isSafeInteger(Number(a.cphPort))&&Number(a.cphPort)>=1024&&Number(a.cphPort)<=65535?Number(a.cphPort):10043
 };
}
async function exportPreferences(){
 const json=JSON.stringify({version:1,type:'yanpb-codelab-preferences',preferences:normalizedPrefs(state.preferences),layout:state.layout,terminalHeights:state.terminalHeights,competitionMode:state.competitionMode},null,2);
 if(native?.exportSettings){try{const saved=await native.exportSettings(json);if(saved)toast(lang()==='en'?'Settings exported':'配置已导出');}catch(e){toast(e.message);}return;}
 const blob=new Blob([json],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='yanpb-preferences.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function importPreferences(){
 try{
  let data;if(native?.importSettings){const r=await native.importSettings();if(!r)return;data=JSON.parse(r);}
  else{data=JSON.parse(prompt('Paste preferences JSON:')||'{}');}
  if(data.type!=='yanpb-codelab-preferences'||data.version!==1)throw Error('Unknown preferences format');
  state.preferences=normalizedPrefs(data.preferences);if(data.layout&&typeof data.layout==='object')state.layout={left:Math.max(150,Math.min(380,Number(data.layout.left)||216)),right:Math.max(220,Math.min(465,Number(data.layout.right)||300))};if(data.terminalHeights&&typeof data.terminalHeights==='object')state.terminalHeights={icpc:Math.max(110,Math.min(440,Number(data.terminalHeights.icpc)||215)),oi:Math.max(110,Math.min(440,Number(data.terminalHeights.oi)||275))};
  if(['icpc','oi'].includes(data.competitionMode)){state.competitionMode=data.competitionMode;state.currentContest=state.modeContests[data.competitionMode]||null;}
  applyPersonalization();persistSoon();closeModal();toast(tr('settingsSaved'));
 }catch(e){toast((lang()==='en'?'Import error: ':'导入失败：')+e.message);}
}
function showPreferences(){
 const p=state.preferences;
 showModal(tr('diyTitle'),`<p class="modal-desc">${lang()==='en'?'Your environment, your rules. All customizations are saved locally.':'让编程环境符合自己的使用习惯。以下配置只保存在本机，不需要账号。'}</p>

 <div class="settings-shell"><nav class="settings-nav" role="tablist" aria-label="Settings sections">
  <button class="active" data-settings-tab="appearance" role="tab" aria-selected="true">◈ ${lang()==='en'?'Appearance & layout':'外观与布局'}</button>
  <button data-settings-tab="editor" role="tab" aria-selected="false">⌨ ${lang()==='en'?'Code editor':'代码编辑器'}</button>
  <button data-settings-tab="performance" role="tab" aria-selected="false">⚡ ${lang()==='en'?'Diagnostics & performance':'诊断与性能'}</button>
  <button data-settings-tab="environment" role="tab" aria-selected="false">▣ ${lang()==='en'?'C++ toolchain':'C++ 编译环境'}</button>
 </nav><div class="settings-main">
  <section class="settings-page" data-settings-page="appearance"><div class="settings-section-head"><strong>${lang()==='en'?'Personalize your workspace':'定制你的工作台'}</strong><p>${lang()==='en'?'Choose a layout and colors for ICPC / OI.':'独立调整 ICPC / OI 配色与界面布局。'}</p></div>
 <div class="preference-grid">
 <label>${tr('language')}<select id="prefLang"><option value="zh">简体中文</option><option value="en">English</option></select></label>
 <label>${tr('accent')}<input id="prefAccent" type="color" value="${esc(p.accent)}"></label>
 <label>${tr('fontSize')}<input id="prefFontSize" type="number" min="10" max="24" value="${p.fontSize}"></label>
 <label>${tr('fontFamily')}<select id="prefFont"><option value="Cascadia Code, Fira Code, JetBrains Mono, Consolas, monospace">Cascadia / Fira / Consolas</option><option value="Fira Code, Consolas, monospace">Fira Code</option><option value="JetBrains Mono, Consolas, monospace">JetBrains Mono</option><option value="Consolas, monospace">Consolas</option></select></label>
 <label>${tr('tabSize')}<select id="prefTab"><option value="2">2</option><option value="4">4</option><option value="8">8</option></select></label>
 <label>${tr('density')}<select id="prefDensity"><option value="comfortable">${tr('comfortable')}</option><option value="compact">${tr('compact')}</option></select></label>
 <label>${tr('terminalHeight')}<input id="prefTerminal" type="range" min="115" max="440" step="5" value="${state.terminalHeights[state.competitionMode]}"></label>
 <label>${tr('contrastMode')}<select id="prefCompare"><option value="trim">${tr('normalCompare')}</option><option value="strict">${tr('strictCompare')}</option></select></label>
 <label class="preference-toggle"><input type="checkbox" id="prefSidebar" ${p.showSidebar?'checked':''}>${tr('showSidebar')}</label>
 <label class="preference-toggle"><input type="checkbox" id="prefRight" ${p.showRight?'checked':''}>${tr('showRight')}</label></div>
<div class="layout-preset-bar"><span>${lang()==='en'?'Quick layouts':'一键布局方案'}</span><button type="button" class="mini-outline" id="layoutFocused">${lang()==='en'?'Focus':'专注竞技'}</button><button type="button" class="mini-outline" id="layoutTeaching">${lang()==='en'?'Teaching':'教学讲评'}</button><button type="button" class="mini-outline" id="layoutExam">${lang()==='en'?'Exam':'OI 考场'}</button></div>
 <div class="preference-grid"><label>ICPC ${lang()==='en'?'accent':'主题色'}<input id="prefIcpcAccent" type="color" value="${esc(p.icpcAccent||'#63dfb5')}"></label><label>OI ${lang()==='en'?'accent':'主题色'}<input id="prefOiAccent" type="color" value="${esc(p.oiAccent||'#f3a66b')}"></label></div></section>
 <section class="settings-page hidden" data-settings-page="editor"><div class="settings-section-head"><strong>${lang()==='en'?'Editor behaviour':'代码编辑器'}</strong><p>${lang()==='en'?'Line editing, auto-save, snippets and checkpoints.':'控制行号、自动保存、代码模板及版本快照。'}</p></div>
 <div class="preference-grid"><label class="preference-toggle"><input type="checkbox" id="prefHints" ${p.codeHintsEnabled!==false?'checked':''}>${lang()==='en'?'C++ variable & type hints (Ctrl+Space)':'C++ 变量与类型智能提示（Ctrl+Space）'}</label><label class="preference-toggle"><input type="checkbox" id="prefNumbers" ${p.lineNumbers!==false?'checked':''}>${lang()==='en'?'Line numbers':'显示行号'}</label><label class="preference-toggle"><input type="checkbox" id="prefWrap" ${p.wordWrap?'checked':''}>${lang()==='en'?'Word wrapping':'自动换行'}</label><label class="preference-toggle"><input type="checkbox" id="prefBrackets" ${p.bracketMatch!==false?'checked':''}>${lang()==='en'?'Match brackets':'括号匹配'}</label><label class="preference-toggle"><input type="checkbox" id="prefCursor" ${p.cursorBlink!==false?'checked':''}>${lang()==='en'?'Blinking cursor':'光标闪烁'}</label><label>${lang()==='en'?'Version snapshot interval':'版本快照间隔'}<select id="prefHistory"><option value="1">1 ${lang()==='en'?'minute':'分钟'}</option><option value="3">3 ${lang()==='en'?'minutes':'分钟'}</option><option value="5">5 ${lang()==='en'?'minutes':'分钟'}</option></select></label><label>${lang()==='en'?'Autosave delay':'代码自动保存'}<input value="2 ${lang()==='en'?'seconds':'秒'}" disabled></label></div>
<label>${tr('customTemplate')}</label><textarea id="prefTemplate" class="pref-template" spellcheck="false" placeholder="#include <bits/stdc++.h>..."></textarea></section>
 <section class="settings-page hidden" data-settings-page="performance"><div class="settings-section-head"><strong>${lang()==='en'?'Language intelligence':'实时诊断与资源管理'}</strong><p>${lang()==='en'?'clangd runs locally; choose when to keep it active.':'按需启动本地 clangd，减少闲置内存。'}</p></div>
 <label>${lang()==='en'?'clangd energy policy':'clangd 性能策略'}<select id="prefClangdMode"><option value="smart">${lang()==='en'?'Smart: on-demand / sleep after 2 min':'智能模式 · 编辑时启动，空闲 2 分钟释放'}</option><option value="always">${lang()==='en'?'Always on: continuous diagnostics':'持续模式 · 实时诊断常驻'}</option><option value="off">${lang()==='en'?'Off: compile diagnostics only':'关闭 · 仅保留编译后错误提示'}</option></select></label>
 <p class="hint">${isMac?'macOS 使用 Apple Clang；GDB/MI 暂未适配，编译运行不受影响。':lang()==='en'?'Smart mode also sleeps after the window is hidden. GCC, GDB and build diagnostics always remain available.':'智能模式在窗口隐藏后也会释放 clangd；GCC 编译、GDB 与编译后报错不受影响。'}</p>
 <div class="sound-settings"><div class="settings-section-head"><strong>${lang()==='en'?'Sample test sounds':'样例评测提示音'}</strong><p>${lang()==='en'?'One sound after a complete sample batch: AC or WA. No audio files or network.':'整轮样例测试结束后，AC / WA 只提示一次，不依赖联网或音频文件。'}</p></div>
 <label class="full" style="display:block;margin:10px 0">${lang()==='en'?'Codeforces handle (for verified browser verdicts)':'Codeforces 用户名（自动核验官方判题）'}<input id="prefCFHandle" spellcheck="false" placeholder="your_handle" value="${esc(p.codeforcesHandle||'')}"></label>
 <label class="preference-toggle sound-switch"><input type="checkbox" id="prefSampleSound" ${p.sampleSoundEnabled!==false?'checked':''}><span>${lang()==='en'?'Enable sample result sounds':'启用 AC / WA 提示音'}</span></label>
 <div class="sound-controls"><label for="prefSoundVolume">${lang()==='en'?'Volume':'音量'} <output id="soundVolumeValue">${Number(p.sampleSoundVolume??35)}%</output></label><input id="prefSoundVolume" type="range" min="0" max="100" step="5" value="${Number(p.sampleSoundVolume??35)}"><div class="sound-preview"><button type="button" class="mini-outline" id="previewAcSound">✓ ${lang()==='en'?'Preview AC':'试听 AC'}</button><button type="button" class="mini-outline" id="previewWaSound">✕ ${lang()==='en'?'Preview WA':'试听 WA'}</button></div></div>
 </div></section>
 <section class="settings-page hidden" data-settings-page="environment"><div class="settings-section-head"><strong>${isMac?'Apple Clang · macOS':lang()==='en'?'Built-in GCC environment':'免配置 C++ 编译环境'}</strong><p>${isMac?'Mac 使用 Apple Clang + macOS SDK，需要 Xcode Command Line Tools。':lang()==='en'?'For consistent classroom results, this IDE only uses the bundled GCC.':'为保证机房和考试模拟环境一致，仅允许使用安装包内置 GCC。'}</p></div>
 <div class="settings-stat"><span>${lang()==='en'?'Compiler':'编译器'}</span><b>${isMac?'Apple Clang / Clang++':'GCC / G++'}</b></div>
 <div class="settings-stat"><span>${lang()==='en'?'Source':'来源'}</span><b>${isMac?'Xcode Command Line Tools':lang()==='en'?'Bundled with CodeLab':'随 CodeLab 安装包提供'}</b></div>
 <div class="settings-stat"><span>${lang()==='en'?'External toolchains':'外部工具链'}</span><b>${lang()==='en'?'Disabled':'已禁用'}</b></div>
 <button type="button" class="mini-outline" id="prefProbeCompiler">${lang()==='en'?'Inspect bundled GCC':'查看内置 GCC 状态'}</button>
 <p class="hint">${isMac?'Apple Clang 为 macOS 官方开发工具，并非 CodeLab 内置 GCC。':lang()==='en'?'Changing the system PATH or installing another compiler will not affect CodeLab.':'更改系统 PATH 或安装其他 GCC/Clang 不会改变 CodeLab 的编译器。'}</p>
 </section></div></div>
 <div class="preference-actions"><button class="button secondary" id="prefReset">${tr('resetPreferences')}</button><button class="button secondary" id="prefImport">${tr('importPreferences')}</button><button class="button secondary" id="prefExport">${tr('exportPreferences')}</button><button class="button primary" id="prefSave">${tr('savePreferences')}</button></div>`,true);
 $$('.settings-nav [data-settings-tab]').forEach(b=>b.onclick=()=>{const target=b.dataset.settingsTab;$$('[data-settings-page]').forEach(el=>el.classList.toggle('hidden',el.dataset.settingsPage!==target));$$('[data-settings-tab]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-selected',String(x===b));});});
 $('prefProbeCompiler').onclick=()=>showSettings();
 $('prefLang').value=p.language;$('prefFontSize').value=p.fontSize;$('prefFont').value=p.fontFamily;$('prefTab').value=String(p.tabSize);
 $('prefSampleSound').onchange=()=>{const on=$('prefSampleSound').checked;$('prefSoundVolume').disabled=!on;$('previewAcSound').disabled=!on;$('previewWaSound').disabled=!on;};
 $('prefSampleSound').onchange();
 $('prefSoundVolume').oninput=()=>{$('soundVolumeValue').textContent=$('prefSoundVolume').value+'%';};
 const previewSound=kind=>void sampleSoundPlayer.play(kind,{enabled:$('prefSampleSound').checked,volume:Number($('prefSoundVolume').value)});
 $('previewAcSound').onclick=()=>previewSound('ac');$('previewWaSound').onclick=()=>previewSound('wa');
 $('prefDensity').value=p.density;$('prefCompare').value=p.compareMode;$('prefTemplate').value=p.defaultTemplate||'';$('prefHistory').value=String(p.historyMinutes||1);$('prefClangdMode').value=p.clangdMode||'smart';
 $('layoutFocused').onclick=()=>{$('prefSidebar').checked=false;$('prefRight').checked=false;$('prefFontSize').value='15';$('prefDensity').value='compact';$('prefTerminal').value='120';};
 $('layoutTeaching').onclick=()=>{$('prefSidebar').checked=true;$('prefRight').checked=true;$('prefFontSize').value='18';$('prefDensity').value='comfortable';$('prefTerminal').value='280';};
 $('layoutExam').onclick=()=>{$('prefSidebar').checked=true;$('prefRight').checked=true;$('prefFontSize').value='14';$('prefDensity').value='compact';$('prefTerminal').value='180';};
 $('prefSave').onclick=()=>{state.preferences=normalizedPrefs({language:$('prefLang').value,accent:$('prefAccent').value,fontSize:$('prefFontSize').value,fontFamily:$('prefFont').value,tabSize:$('prefTab').value,density:$('prefDensity').value,showSidebar:$('prefSidebar').checked,showRight:$('prefRight').checked,terminalHeight:$('prefTerminal').value,compareMode:$('prefCompare').value,defaultTemplate:$('prefTemplate').value,codeHintsEnabled:$('prefHints').checked,lineNumbers:$('prefNumbers').checked,wordWrap:$('prefWrap').checked,bracketMatch:$('prefBrackets').checked,cursorBlink:$('prefCursor').checked,historyMinutes:Number($('prefHistory').value),autoSaveSeconds:2,clangdMode:$('prefClangdMode').value,sampleSoundEnabled:$('prefSampleSound').checked,sampleSoundVolume:Number($('prefSoundVolume').value),icpcAccent:$('prefIcpcAccent').value,oiAccent:$('prefOiAccent').value,cphAutoStart:state.preferences.cphAutoStart,codeforcesHandle:/^[A-Za-z0-9_.-]{3,24}$/.test($('prefCFHandle').value.trim())?$('prefCFHandle').value.trim():''});state.terminalHeights[state.competitionMode]=Number(state.preferences.terminalHeight);applyPersonalization();liveBridge?.setPerformanceMode(state.preferences.clangdMode);persistSoon();closeModal();toast(tr('settingsSaved'));};
 $('prefReset').onclick=()=>{state.preferences={...BASE_PREFS};state.terminalHeights={icpc:215,oi:275};applyPersonalization();liveBridge?.setPerformanceMode('smart');persistSoon();closeModal();toast(tr('settingsSaved'));};
 $('prefImport').onclick=importPreferences;$('prefExport').onclick=exportPreferences;
}
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
function formatRemaining(m){const remain=window.YanpbContestLifecycle.remainingMs(m);const h=Math.floor(remain/3600000),minutes=Math.floor(remain/60000)%60,seconds=Math.floor(remain/1000)%60;return `${String(h).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;}
function updateContestTime(){updateContestRibbonClock();const m=localContest();const clock=$('contestTimer');if(!clock||!m)return;clock.textContent=formatRemaining(m);clock.classList.toggle('clock-warning',window.YanpbContestLifecycle.remainingMs(m)<600000);
 if(window.YanpbContestLifecycle.normalize(m).status==='running' && window.YanpbContestLifecycle.remainingMs(m)===0)clock.title=lang()==='en'?'Time expired · finish contest manually':'时间已到 · 请手动结束比赛';}
function renderContestBadge(){renderContestRibbon();const m=localContest();$('contestCheckBtn').classList.toggle('hidden',!canCheckCsp());$('contestOverviewBtn').classList.toggle('hidden',!m);$('contestNextBtn').classList.toggle('hidden',!m);if(!m){renderModePanel();return;}$('contestCreateBtn').title=m.platform.toUpperCase()+': '+m.contestName;}
function contestSidebar(){
 const root=$('sidebarList');root.replaceChildren();$('fileCount').textContent=state.files.length;
 const en=lang()==='en',m=localContest(),hub=document.createElement('div');hub.className='contest-hub';
 if(!m){hub.innerHTML=`<div class="hub-eyebrow">Y· CONTEST ENGINE</div><strong>${en?'Ready for your next contest':'开启你的下一场算法比赛'}</strong><small>${en?'Create platform-specific source files in one click.':'分平台建比赛文件夹、题目源码与样例。'}</small><button id="startContest">${en?'＋ Create contest':'＋ 创建比赛工作区'}</button><button id="openContest">${en?'Open contest folder':'打开已有比赛'}</button>`;}
 else{hub.innerHTML=`<div class="hub-eyebrow">${m.exam?'● OI MOCK EXAM':'● '+m.platform.toUpperCase()}</div><strong>${esc(m.contestName)}</strong><small>${en?'Local workspace':'本机项目'} · ${m.files.length} ${en?'problems':'题'}</small><div id="contestTimer" class="clock">${formatRemaining(m)}</div><button id="openContest">${en?'Open another workspace':'切换比赛工作区'}</button><button id="checkContest">${state.competitionMode==='icpc'?(en?'→ Next problem':'→ 下一道题'):(en?'✓ Submission audit':'✓ 提交完整性检查')}</button>`;}
 root.appendChild(hub);
 if(m){const area=document.createElement('div');area.className='contest-lifecycle';area.innerHTML=`<button id="contestLifecycleStart" class="primary">▶ ${en?'Start':'开始'}</button><button id="contestLifecyclePause">${en?'Pause / Resume':'暂停/继续'}</button><button id="contestLifecycleFinish" class="danger">■ ${en?'Finish':'结束'}</button>`;hub.appendChild(area);const line=document.createElement('div');line.className='contest-status-line';line.innerHTML=(en?'State: ':'状态：')+'<strong id="contestLifeStatus"></strong>';hub.appendChild(line);updateContestControls();area.querySelector('#contestLifecycleStart').onclick=()=>changeContestLifecycle('start');area.querySelector('#contestLifecyclePause').onclick=()=>changeContestLifecycle(contestStatus()==='paused'?'resume':'pause');area.querySelector('#contestLifecycleFinish').onclick=()=>changeContestLifecycle('finish');}
 const modeCard=document.createElement('div');modeCard.className='mode-sidebar-card';
 modeCard.innerHTML=state.competitionMode==='icpc' ? `
 <div class="mode-sidebar-kicker">ICPC · OFFICIAL OJ</div>
 <strong>${en?'Submit in browser':'浏览器官方提交'}</strong><small>${en?'Open official submission page. Extension watches verified results.':'打开官方提交页，浏览器扩展监听本题官方判题。'}</small>
 <div id="sidebarScore" class="score-inline">${m?(en?'Official results only':'仅展示官方核验结果'):''}</div>
 <button id="sidebarModeAction">${en?'Open official submit page':'打开官方提交页'}</button>` : `
 <div class="mode-sidebar-kicker">OI / CSP · FILE CHECK</div>
 <strong>${en?'Source preflight & local judge':'提交规范与本地评测'}</strong><small>${en?'Check file names and run sample cases.':'检查题名、考号、文件 I/O 与本地样例。'}</small>
 <div id="sidebarScore" class="score-inline">${m?(state.oiAudits[m.folder]?.checkedAt?(en?'Reviewed locally':'已完成本地预检'):(en?'Not reviewed':'尚未预检')):''}</div>
 <button id="sidebarModeAction">${en?'Submission preflight':'提交规范检查'}</button>`;
 root.appendChild(modeCard);
 modeCard.querySelector('#sidebarModeAction').onclick=state.competitionMode==='icpc'?openBrowserSubmission:showSubmissionReview;
 if(state.competitionMode==='oi'&&!canCheckCsp())modeCard.querySelector('#sidebarModeAction').classList.add('hidden');
 hub.querySelector('#startContest')?.addEventListener('click',showContestCreator);
 hub.querySelector('#openContest')?.addEventListener('click',openContestWorkspace);
 if(m&&state.competitionMode==='oi'&&!canCheckCsp())hub.querySelector('#checkContest')?.classList.add('hidden');
 hub.querySelector('#checkContest')?.addEventListener('click',state.competitionMode==='icpc'?()=>advanceContestTask(1):showSubmissionReview);
 if(m){const label=document.createElement('div');label.className='side-section-label';label.textContent=en?'PROBLEM FILES':'比赛题目文件';root.appendChild(label);
  m.files.forEach(item=>{const b=document.createElement('button');b.className='side-contest-task'+(currentContestTask()?.task===item.task?' active':'');b.innerHTML='<span class="cpp-mark">C++</span><div><strong></strong><small></small></div>';b.querySelector('strong').textContent=item.task+'.cpp';const prev=window.YanpbContestWorkflow.read(state.contestProgress,m,item.task);
 b.querySelector('small').textContent=prev?(prev.status+' · '+prev.testCount+' samples'):(m.exam?item.task+'/'+item.task+'.cpp':m.platform.toUpperCase());if(prev?.status==='OK')b.classList.add('tested');b.onclick=()=>openContestTask(item.task);root.appendChild(b);});
  const help=document.createElement('div');help.className='side-section-label';help.textContent=en?'LOCAL · NO CLOUD SUBMISSION':'本地检查 · 不是真实提交';root.appendChild(help);
 }
 if(m)root.appendChild(modeCard);
 updateContestTime();
}
function showContestCreator(){
 const en=lang()==='en',p=localContest()?.platform||(state.competitionMode==='oi'?'cspj':'codeforces');
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
 const targetMode=project.manifest.exam?'oi':'icpc';
 if(targetMode!==state.competitionMode)setCompetitionMode(targetMode);
 state.currentContest=project.manifest;
 state.modeContests[state.competitionMode]=project.manifest;window.YanpbContestRegistry.add(state.contestWorkspaces,project.manifest,state.competitionMode);
 for(const p of project.files){
  let file=state.files.find(f=>f.fullPath===p.fullPath);
  if(!file){if(state.files.length>=45)throw Error('最多可打开 45 个文件。请先关闭不需要的编辑标签。');addFile(p.name,p.content,p.fullPath);file=activeFile();}
  else if(!file.dirty){file.content=p.content;}
  if(!state.caseByFile[file.id])state.caseByFile[file.id]={cases:[{id:uid(),name:'Sample 1',input:'',expected:''}],activeCase:null};
 }
 const first=state.files.find(f=>f.fullPath===project.files[0].fullPath);if(first)switchFile(first.id);
 renderContestBadge();renderContestRibbon();renderModePanel();saveState();
}
function openContestTask(task){const m=localContest();const p=m?.files.find(f=>f.task===task);if(!p)return;const f=state.files.find(x=>x.fullPath===p.source);if(f){switchFile(f.id);if(state.sidebar==='contest')contestSidebar();renderContestRibbon();renderModePanel();}}
async function saveContestFiles(){if(!native?.saveFile)throw Error('请在 Windows 客户端完成提交');const m=localContest();if(!m)throw Error('尚未创建比赛');
 for(const p of m.files){const f=state.files.find(x=>x.fullPath===p.source);if(!f)continue;if(f.dirty){const saved=await native.saveFile({name:f.name,content:f.content,fullPath:f.fullPath,saveAs:false});if(!saved)throw Error('取消保存 '+f.name);f.dirty=false;}}
 renderTabs();saveState();
}
function reportRow(item,ok=!!item.ok){return `<div class="report-result ${ok?'ok':item.level==='warning'?'warn':'bad'}"><span>${ok?'✓':item.level==='warning'?'⚠':'✕'} ${esc(item.detail)}</span><span>${ok?'PASS':item.level==='warning'?'CHECK':'FAIL'}</span></div>`;}
function showSubmissionReview(){const m=localContest(),en=lang()==='en';if(!canCheckCsp()){toast(en?'Submission checking is available only for CSP-J/S contests in OI mode':'提交规范检测仅限 OI 模式中的 CSP-J/S 比赛');return;}if(!m){showContestCreator();return;}
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
 const output=$('contestReviewResult'),m=localContest();if(!output||!m||!canCheckCsp())return;if(busy){toast('另一个任务正在进行');return;}
 busy=true;updateButtons();$('auditNow').disabled=true;$('verifyNow').disabled=true;
 try{
  if(runSamples)await saveContestFiles();
  output.innerHTML='<div class="report-summary">'+(lang()==='en'?'Checking submission…':'正在读取磁盘源码、检查文件结构与编译…')+'</div>';
  const audit=await native.contestAudit(m);const en=lang()==='en';const report=[],verdicts=[];
  for(const item of audit.reports){let result=null;
   if(runSamples&&item.code){const f=state.files.find(x=>x.fullPath===item.source);const slot=f?state.caseByFile[f.id]:null;const cases=(slot?.cases||[]).filter(x=>x.input||x.expected).map(x=>({name:x.name,input:x.input,expected:x.expected}));
     result=await native.contestCheck(m,item.task,cases,{compiler:'bundled',compareMode:state.preferences.compareMode});
   }
   const critical=item.checks.filter(x=>x.level==='error'&&!x.ok);
   const ok=critical.length===0&&(!result||['OK','COMPILED'].includes(result.status));
   verdicts.push(ok);
   report.push(`<div class="report-problem"><div class="report-title"><span>${esc(item.task)}.cpp <small style="font-weight:normal;color:var(--muted)">· ${item.size} bytes</small></span><span class="${ok?'pass':'fail'}">${ok?'✓ '+(en?'CHECKED':'检查通过'):'⚠ '+(en?'REVIEW':'需修正')}</span></div>${item.checks.map(c=>reportRow(c)).join('')}
    ${result?`<div class="report-result ${['OK','COMPILED'].includes(result.status)?'ok':'bad'}"><span>${en?'Compilation / sample run':'编译 / 样例运行'}</span><span>${esc(result.status)}</span></div>${result.compiler&&result.status==='CE'?`<pre class="output-pre stderr-pre">${esc(result.compiler.slice(0,2400))}</pre>`:''}${result.results?.map(r=>`<div class="report-result ${r.status==='OK'?'ok':'bad'}"><span>${esc(r.name)}</span><span>${esc(r.status)} · ${r.timeMs} ms</span></div>`).join('')||''}`:''}</div>`);
  }
  const all=verdicts.every(Boolean)&&audit.extraRoot.length===0;
  const summary=`<div class="report-summary ${all?'':'warning'}">${all?(en?'✓ Preflight checks passed':'✓ 本地预检通过'):(en?'⚠ Found submission risks':'⚠ 发现可能导致失分的提交问题')} · ${verdicts.filter(Boolean).length}/${verdicts.length} ${en?'tasks':'题'}<br><small>${en?'Passing sample tests does not imply a full score.':'样例通过不代表满分，需根据正式题目与评测要求复核。'}</small>${audit.extraRoot.length?`<br>${en?'Unexpected files in candidate root':'考号目录中存在额外项目'}：${esc(audit.extraRoot.join(', '))}`:''}</div>`;
  state.oiAudits[m.folder]={checkedAt:Date.now(),checked:true,passed:all,taskCount:verdicts.filter(Boolean).length,total:verdicts.length};persistSoon();renderModePanel();
  output.innerHTML=summary+report.join('');$('statusText').textContent=all?'Submission preflight OK':'Submission risks detected';
 }catch(e){output.textContent='Error: '+e.message;toast(e.message);}finally{busy=false;updateButtons();const a=$('auditNow'),v=$('verifyNow');if(a)a.disabled=false;if(v)v.disabled=false;}
}


function renderEditorScene(){
 const host=$('editorContextBar');if(!host||!window.YanpbEditorScene)return;
 const issues=activeFile()?mergedIssues(activeFile()).filter(x=>x.severity==='error'||x.severity==='warning').length:0;
 const scene=window.YanpbEditorScene.classify({mode:state.competitionMode,contest:localContest(),task:currentContestTask(),debugStatus:liveBridge?.status||'idle',issues,samples:state.cases?.length||0,language:lang()});
 $('sceneOjSubmitBtn').classList.add('hidden');$('sceneOjSubmitText').textContent=lang()==='en'?'Submit OJ':'提交 OJ';
 const signature=JSON.stringify(scene);if(sceneRenderSignature===signature)return;sceneRenderSignature=signature;
 host.dataset.scene=scene.scene;host.setAttribute('aria-label',scene.label+' - '+scene.detail);
 $('sceneLabel').textContent=scene.label;$('sceneDetail').textContent=scene.detail;$('sceneMeta').textContent=scene.meta;
 $('sceneSampleCount').textContent=scene.sampleLabel;$('sceneIssueCount').textContent=scene.problemLabel;
 $('sceneNextBtn').classList.add('hidden');
 $('scenePreflightBtn').classList.add('hidden');
 $('sceneDebugBtn').classList.toggle('hidden',!scene.showDebug);
 $('sceneSnippetBtn').classList.add('hidden');
 $('sceneSnippetText').textContent=lang()==='en'?'Snippet':'代码模板';
 $('sceneNextText').textContent=lang()==='en'?'Next':'下一题';
 $('scenePreflightText').textContent=lang()==='en'?'Preflight':'提交检查';
 $('sceneDebugText').textContent=lang()==='en'?'Step over':'单步执行';
}
function renderModePanel(){
 const el=$('modePanel');if(!el)return;
 const m=localContest(),en=lang()==='en',isIcpc=state.competitionMode==='icpc',task=currentContestTask();
 const quick=$('modeQuickBtn'),label=$('modeQuickLabel');
 if(label)label.textContent=isIcpc?(en?'Official OJ':'浏览器提交'):(en?'CSP Preflight':'CSP 检查');
 if(quick){quick.classList.toggle('hidden',!m||(isIcpc?false:!canCheckCsp()));quick.title=isIcpc?(en?'Open official submission page':'打开浏览器官方提交页'):(en?'CSP submission preflight':'CSP 提交规范检查');}
 const heading=$('modeInspectorTitle');if(heading)heading.textContent=en?'Input & Samples':'输入与样例';
 const subtitle=$('modeInspectorSubtitle');if(subtitle)subtitle.textContent=isIcpc?'ICPC · TESTING':'OI · FILE I/O';
 // ICPC scores are now accessible from the top contest action, NEVER in the right sample panel.
 const csp=!isIcpc&&canCheckCsp();el.classList.toggle('hidden',!csp);
 if(csp){
  const file=task?.task||'task',fileIo=m?.io==='file',audit=state.oiAudits[m?.folder];
  el.innerHTML=`<div class="mode-panel-head"><span>CSP · ${en?'FILE CHECK':'文件检查'}</span><span class="mode-panel-dot"></span></div>
   <div class="mode-panel-compact-line"><span>${en?'I/O':'读写方式'}</span><b>${esc(fileIo?file+'.in → '+file+'.out':'stdin → stdout')}</b></div>
   <div class="mode-panel-compact-line"><span>${en?'Last review':'最近预检'}</span><b>${audit?.checkedAt?(en?'Reviewed':'已检查'):(en?'Not yet':'未检查')}</b></div>`;
 }
 renderEditorScene();
}
function initTerminalResize(){
 const handle=$('terminalResize'),pane=$('terminalPane'),host=document.querySelector('.center-stack');let pointer=null,startY=0,startH=0;
 const apply=h=>{const width=window.YanpbModes.clampTerminal(h,host.clientHeight);state.terminalHeights[state.competitionMode]=width;pane.style.height=width+'px';pane.classList.remove('is-collapsed');handle.setAttribute('aria-valuenow',String(width));handle.setAttribute('aria-valuemax',String(Math.max(110,host.clientHeight-210)));editor?.refresh();};
 handle.addEventListener('pointerdown',e=>{if(e.button!==0)return;pointer=e.pointerId;startY=e.clientY;startH=pane.getBoundingClientRect().height;if(pane.classList.contains('is-collapsed'))startH=state.terminalHeights[state.competitionMode]||215;handle.setPointerCapture(pointer);handle.classList.add('dragging');document.body.classList.add('is-resizing-terminal');e.preventDefault();});
 handle.addEventListener('pointermove',e=>{if(pointer!==e.pointerId)return;apply(startH-(e.clientY-startY));});
 const finish=e=>{if(pointer!==e.pointerId)return;pointer=null;handle.classList.remove('dragging');document.body.classList.remove('is-resizing-terminal');persistSoon();editor?.refresh();};
 handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
 handle.addEventListener('dblclick',()=>{apply(state.competitionMode==='oi'?275:215);persistSoon();});
 handle.addEventListener('keydown',e=>{if(!['ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();let next=(state.terminalHeights[state.competitionMode]||215);if(e.key==='ArrowUp')next+=18;if(e.key==='ArrowDown')next-=18;if(e.key==='Home')next=110;if(e.key==='End')next=host.clientHeight-210;apply(next);persistSoon();});
}

function setCompetitionMode(mode){
 if(!['icpc','oi'].includes(mode))return;
 if(mode!==state.competitionMode){document.body.classList.remove('mode-flipping');void document.body.offsetWidth;document.body.classList.add('mode-flipping');setTimeout(()=>document.body.classList.remove('mode-flipping'),800);}
 if(mode!==state.competitionMode){
  state.modeContests[state.competitionMode]=state.currentContest;
  state.competitionMode=mode;
  state.currentContest=state.modeContests[mode]||state.contestWorkspaces[mode]?.[0]||null;
  const first=state.files.find(f=>state.currentContest?.files.some(p=>p.source===f.fullPath));
  if(first?.id!==state.activeId&&first) switchFile(first.id);
 }
 applyPersonalization();
 selectNav('contest');
 inspect('cases');
 renderContestBadge();
 renderModePanel();
 persistSoon();
 $('statusText').textContent=mode==='oi'?(lang()==='en'?'OI / CSP practice · file-based judging ready':'OI / CSP 模式 · 文件评测准备就绪'):(lang()==='en'?'ICPC / ACM mode · fast iteration':'ICPC / ACM 模式 · 快速编程训练');
}
function initPanelResize(){
 const host=document.querySelector('.body-grid');
 for(const [id,side] of [['leftResize','left'],['rightResize','right']]){
  const handle=$(id);let startX,startWidth,pointer;
  handle.addEventListener('pointerdown',e=>{if(e.button!==0)return;startX=e.clientX;startWidth=Number(state.layout[side])|| (side==='left'?216:300);pointer=e.pointerId;handle.setPointerCapture(pointer);handle.classList.add('dragging');document.body.classList.add('is-resizing');e.preventDefault();});
  handle.addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;const max=Math.max(side==='left'?150:220,Math.min(side==='left'?380:465,host.clientWidth-650));const width=Math.max(side==='left'?150:220,Math.min(max,startWidth+(e.clientX-startX)*(side==='left'?1:-1)));state.layout[side]=Math.round(width);document.body.style.setProperty(side==='left'?'--sidebar-width':'--inspector-width',state.layout[side]+'px');editor?.refresh();});
  const finish=e=>{if(e.pointerId!==pointer)return;pointer=null;handle.classList.remove('dragging');document.body.classList.remove('is-resizing');persistSoon();editor?.refresh();};handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
  handle.addEventListener('dblclick',()=>{state.layout[side]=side==='left'?216:300;applyPersonalization();persistSoon();editor?.refresh();});
  handle.addEventListener('keydown',e=>{if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;const n=e.key==='ArrowRight'?12:-12;state.layout[side]=Math.max(side==='left'?150:220,Math.min(side==='left'?380:465,(state.layout[side]||0)+n*(side==='left'?1:-1)));applyPersonalization();persistSoon();editor?.refresh();e.preventDefault();});
 }
}
function showDiagnostics(raw){
 const target=$('terminalOutput');target.replaceChildren();
 const advice=window.YanpbLearningTools.explainCompiler(raw,lang());
 if(advice.length&&/(?:error|fatal|warning|ld\.exe)/i.test(raw)){
  const list=document.createElement('div');list.className='diagnostics-guide';
  advice.forEach(item=>{const card=document.createElement('article');card.className='diagnostic-card';const h=document.createElement('div');h.className='diagnostic-title';h.textContent='💡 '+item.title;const tip=document.createElement('div');tip.className='diagnostic-tip';tip.textContent=item.tip;card.append(h,tip);if(item.line){const jump=document.createElement('button');jump.className='diagnostic-jump';jump.textContent=(lang()==='en'?'Go to line ':'跳转到第 ')+item.line+(lang()==='en'?'':' 行');jump.onclick=()=>{editor.setCursor(Math.max(0,item.line-1),Math.max(0,(item.column||1)-1));editor.focus();};card.append(jump);}list.append(card);});target.append(list);
 }
 const details=document.createElement('details');details.open=true;const summary=document.createElement('summary');summary.textContent=lang()==='en'?'Original compiler output':'原始 GCC / Clang 报错信息';const pre=document.createElement('pre');pre.className='output-pre stderr-pre';pre.textContent=raw;details.append(summary,pre);target.append(details);
}
function renderTestResults(res){
 const root=$('terminalOutput');root.replaceChildren();if(!res.results){textOutput('暂无样例报告');return;}
 res.results.forEach((r,i)=>{
  const row=document.createElement('div');row.className='case-report-line '+(r.status==='OK'?'diff-pass':'diff-fail');row.style.flexWrap='wrap';
  const name=document.createElement('strong');name.textContent=(i+1)+'. '+(r.name||'Sample');const stateEl=document.createElement('span');stateEl.className=r.status==='OK'?'pass':'fail';stateEl.textContent=r.status==='OK'?'✓ AC':r.status==='WA'?'✕ WA':r.status;const time=document.createElement('small');time.textContent=(r.timeMs||0)+' ms';row.append(name,stateEl,time);
  if(r.status!=='OK'){
   const inputBox=document.createElement('section');inputBox.className='failed-input-box';inputBox.style.flex='1 0 100%';
   const label=document.createElement('div');label.className='failed-input-title';label.textContent=lang()==='en'?'ORIGINAL TEST INPUT · exact text':'原始测试输入 · 保留原始内容';
   const pre=document.createElement('pre');pre.className='failed-input-data';pre.textContent=String(r.input??state.cases[i]?.input??'');
   const copy=document.createElement('button');copy.className='failed-input-copy';copy.type='button';copy.textContent=lang()==='en'?'Copy input':'复制输入';
   copy.onclick=()=>void writeTextToClipboard(pre.textContent);
   inputBox.append(label,pre,copy);row.append(inputBox);
  }
  if(r.expected!=null){
    const details=document.createElement('details');details.className='diff-details';details.style.flex='1 0 100%';if(r.status==='WA')details.open=true;
    const summary=document.createElement('summary');summary.className='diff-summary';summary.textContent=r.status==='OK'?(lang()==='en'?'View expected / actual':'查看正确输出'):(lang()==='en'?'Show differences and hint':'查看差异和错误位置');details.append(summary);
    const diff=window.YanpbLearningTools.linesDiff(r.expected,r.output??r.stdout??'',state.preferences.compareMode);
    const grid=document.createElement('div');grid.className='diff-view';const expected=document.createElement('div'),actual=document.createElement('div');expected.className=actual.className='diff-col';
    for(const [col,title] of [[expected,lang()==='en'?'EXPECTED':'预期答案'],[actual,lang()==='en'?'ACTUAL':'程序输出']]){const h=document.createElement('div');h.className='diff-head';h.textContent=title;col.append(h);}
    for(const d of diff.rows){const parts=window.YanpbLearningTools.characterSpans(d.expected,d.actual);
      for(const [side,col] of [['expected',expected],['actual',actual]]){const line=document.createElement('div');line.className='diff-line '+(d.kind==='change'?d.kind:d.kind==='same'?'same':side==='expected'?d.kind==='missing'?'missing':'same':d.kind==='extra'?'extra':'same');const num=document.createElement('span');num.className='diff-num';num.textContent=d[side+'Line']??'—';const content=document.createElement('span');content.className='diff-text';const value=d[side];if(d.kind==='change'){content.append(document.createTextNode(parts.prefix));const hi=document.createElement('span');hi.className='diff-changed';hi.textContent=parts[side==='expected'?'expectedDelta':'actualDelta']||'∅';content.append(hi,document.createTextNode(parts[side==='expected'?'expectedSuffix':'actualSuffix']));}else content.textContent=value||' ';line.append(num,content);col.append(line);}}
    grid.append(expected,actual);details.append(grid);if(diff.truncated){const t=document.createElement('div');t.className='diff-info';t.textContent=lang()==='en'?'Large output: showing a preview only.':'输出较长，仅显示部分差异。';details.append(t);}row.append(details);
  } else if(r.status!=='OK'){const hint=document.createElement('div');hint.className='diff-info';hint.style.flex='1 0 100%';hint.textContent=r.status==='TLE'?(lang()==='en'?'Program timed out. Check infinite loops and complexity.':'程序超时：检查死循环、输入等待和时间复杂度。'):r.status==='RE'?(lang()==='en'?'Runtime error: check bounds and division by zero.':'运行错误：检查数组越界、除零和非法指针。'):(lang()==='en'?'Inspect error output.':'请查看报错输出。');row.append(hint);}
  root.append(row);
 });
}
function showShortcuts(){
 const en=lang()==='en';const commands=[['Compile / 编译运行','Ctrl + Enter · F5'],['Samples / 样例测试','Ctrl + Shift + Enter · F7'],['Browser OJ / 浏览器提交','Ctrl + Shift + U'],['Theme / 明暗主题','Ctrl + Alt + T'],['Editing prompts / 编辑提示词','Ctrl + Alt + P'],['Submit to OJ / 官方网页提交','Ctrl + Alt + U'],['C++ variable hints / 变量提示','Ctrl + Space'],['Open file / 打开文件','Ctrl + O'],['Save / 保存文件','Ctrl + S'],['Find files / 查找文件','Ctrl + K'],['New contest / 新建比赛','Ctrl + Shift + N'],['Submission audit / 提交检查','F8'],['Stress testing / 程序对拍','F9'],['ICPC mode','Alt + 1'],['OI mode','Alt + 2'],['Toggle file explorer','Ctrl + B'],['Toggle test panel','Ctrl + Alt + R'],['Editor zoom / 字号','Ctrl + Mouse Wheel'],['Find in code / 代码区查找','Ctrl + F'],['Find next / 下一个','F3 · Shift + F3'],['Go to line / 跳转行','Ctrl + G'],['Undo / Redo / 撤销重做','Ctrl + Z · Ctrl + Y'],['Duplicate line / 复制行','Ctrl + Shift + D'],['Delete line / 删除行','Ctrl + Shift + K'],['Move line / 移动行','Alt + ↑ / ↓'],['Select line / 选择行','Ctrl + L'],['Select next match / 选中下一同名项','Ctrl + D'],['Indent / Outdent / 缩进','Tab · Shift + Tab'],['Toggle comment / 注释','Ctrl + /'],['Insert snippet / 模板插入','Ctrl + J'],['Focus editor / 聚焦代码','Ctrl + 1'],['Toggle console / 控制台','Ctrl + `'],['Previous / Next problem / 切题','Ctrl + Alt + ← / →'],['Code history / 版本回溯','Ctrl + H'],['Context menu / 右键菜单','Right Click']];
 showModal(en?'Keyboard & Mouse Shortcuts':'键盘与鼠标快捷键',`<p class="modal-desc">${en?'Resizable panels: drag their separators or focus and press arrow keys.':'左右边框：按住分隔线拖拽，或聚焦分隔线后使用方向键调整。'}</p><div id="shortcutRows"></div>`);
 const host=$('shortcutRows');commands.forEach(([title,key])=>{const row=document.createElement('div');row.className='shortcut-table';const t=document.createElement('span');t.textContent=title;const k=document.createElement('kbd');k.textContent=key;row.append(t,k);host.append(row);});
}
// v4.6: file-only context commands, shared by Explorer and document tabs.
function fileInContest(file){if(!file.fullPath)return false;const contests=[localContest(),...Object.values(state.contestWorkspaces||{}).flat()].filter(Boolean);return contests.some(m=>m.files?.some(x=>x.source===file.fullPath));}
async function writeTextToClipboard(value){
 try{if(native?.writeClipboard)await native.writeClipboard(value);else if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(value);else throw Error('Clipboard unavailable');toast(lang()==='en'?'Copied':'已复制');}
 catch(e){toast(e.message);}
}
async function renameWorkspaceFile(file){
 if(fileInContest(file)){toast(lang()==='en'?'Contest source names are fixed by submission rules':'比赛源码名称由提交规范确定，不能直接重命名');return;}
 const en=lang()==='en';const oldName=file.name;
 const entered=prompt(en?'Rename file (keep its extension):':'输入新文件名（保留扩展名）：',oldName);
 if(entered===null)return;
 let name;
 try{name=window.YanpbFileActions.checkName(entered);}catch(e){toast(e.message);return;}
 if(name===oldName)return;
 if(state.files.some(x=>x.id!==file.id&&x.name.toLowerCase()===name.toLowerCase()&&(!file.fullPath||!x.fullPath))) {toast(en?'Another open tab has this name':'已有同名未保存文件');return;}
 // Stop a queued 2s autosave before moving an on-disk file.
 clearTimeout(pendingDiskSaves.get(file.id));pendingDiskSaves.delete(file.id);
 if(file.fullPath){
   if(!native?.renameFile){toast(en?'Requires Windows desktop app':'磁盘重命名需要桌面客户端');return;}
   try{
     if(file.dirty){await native.autoSave({filePath:file.fullPath,content:file.content});file.dirty=false;}
     const oldKey=historyIdentity(file);const result=await native.renameFile(file.fullPath,name);
     await native.historyMigrate?.(oldKey,result.fullPath).catch(()=>{});
     file.name=result.name;file.fullPath=result.fullPath;file.historyKey=result.fullPath;
   }catch(err){toast((en?'Rename failed: ':'重命名失败：')+err.message);return;}
 }else file.name=name;
 renderTabs();saveState();liveBridge?.changeFile();toast(en?'File renamed':'文件已重命名');
}
function duplicateWorkspaceFile(file){
 if(state.files.length>=45){toast('最多打开 45 个文件');return;}
 const name=window.YanpbFileActions.copyName(file.name,state.files.map(x=>x.name));
 addFile(name,file.content);toast((lang()==='en'?'Unsaved copy created':'已创建未保存副本')+' · '+name);
}
async function trashWorkspaceFile(file){
 const en=lang()==='en';
 if(fileInContest(file)){toast(en?'Cannot remove managed contest source files':'比赛管理的源文件不能在此移入回收站');return;}
 if(!file.fullPath){if(confirm(en?'Close this unsaved tab?':'关闭此未保存标签？'))closeFile(file.id);return;}
 if(!native?.trashFile){toast(en?'Use the desktop client to move files to Recycle Bin':'请在桌面客户端中操作回收站');return;}
 if(!confirm(en?`Move ${file.name} to the Recycle Bin? This removes it from disk${file.dirty?' and discards unsaved edits':''}.`:`确定将 ${file.name} 移至回收站？这会从磁盘移走源文件${file.dirty?'，并丢弃未保存的修改':''}。`))return;
 clearTimeout(pendingDiskSaves.get(file.id));pendingDiskSaves.delete(file.id);
 try{await native.trashFile(file.fullPath);const wasActive=file.id===state.activeId;
  if(state.files.length===1){file.fullPath=null;file.name='untitled1.cpp';file.dirty=false;}else{
   state.files=state.files.filter(x=>x.id!==file.id);delete state.caseByFile[file.id];runCache.delete(file.id);
   if(wasActive){const next=state.files[0];state.activeId=next.id;const slot=state.caseByFile[next.id];state.cases=slot?.cases||[];state.activeCase=slot?.activeCase||state.cases[0]?.id;suppressEditorChange=true;editor.setValue(next.content);suppressEditorChange=false;updateCaseList();liveBridge?.changeFile();}
  }
  renderTabs();saveState();toast(en?'File moved to Recycle Bin':'源文件已移至回收站');
 }catch(err){toast((en?'Recycle Bin failed: ':'移动到回收站失败：')+err.message);}
}
function closeOtherTabs(id){const file=state.files.find(f=>f.id===id);if(!file)return;
 const others=state.files.filter(x=>x.id!==id);
 if(others.some(x=>x.dirty)&&!confirm(lang()==='en'?'Other tabs have unsaved changes. Close them?':'其他标签含尚未写入磁盘的修改，确定关闭？'))return;
 others.forEach(x=>{clearTimeout(pendingDiskSaves.get(x.id));pendingDiskSaves.delete(x.id);delete state.caseByFile[x.id];runCache.delete(x.id);});
 state.files=[file];if(state.activeId!==id){state.activeId=id;const slot=state.caseByFile[id];state.cases=slot?.cases||[];state.activeCase=slot?.activeCase||state.cases[0]?.id;suppressEditorChange=true;editor.setValue(file.content);suppressEditorChange=false;updateCaseList();liveBridge?.changeFile();}renderTabs();saveState();
}
function fileContextEntries(f,en){const hasPath=!!f.fullPath,contest=fileInContest(f);
 return [
  [en?'Open / Focus':'打开 / 定位标签',()=>switchFile(f.id)],
  [en?'Save':'保存',()=>{switchFile(f.id);return saveFile(false);} ],
  [en?'Save As…':'另存为…',()=>{switchFile(f.id);return saveFile(true);} ],
  ['---'],
  [en?'Rename':'重命名',()=>renameWorkspaceFile(f),contest],
  [en?'Duplicate to new tab':'复制到新标签',()=>duplicateWorkspaceFile(f)],
  [en?'Copy file path':'复制文件路径',()=>writeTextToClipboard(f.fullPath),!hasPath],
  [en?'Reveal in Explorer':'在资源管理器中显示',()=>native?.revealFile?.(f.fullPath),!hasPath||!native?.revealFile],
  ['---'],
  [en?'Close tab':'关闭标签',()=>closeFile(f.id),state.files.length===1],
  [en?'Close other tabs':'关闭其他标签',()=>closeOtherTabs(f.id),state.files.length<=1],
  [en?'Move to Recycle Bin':'移至回收站',()=>trashWorkspaceFile(f),contest||(!hasPath),true]
 ];
}
function initContextMenu(){
 let menu=null;let restoreFocus=null;
 const close=()=>{menu?.remove();menu=null;restoreFocus?.focus?.();restoreFocus=null;};
 document.addEventListener('pointerdown',e=>{if(menu&&!menu.contains(e.target))close();});
 window.addEventListener('blur',close);
 document.addEventListener('keydown',e=>{
   if(!menu)return;
   if(e.key==='Escape'){e.preventDefault();close();return;}
   const buttons=[...menu.querySelectorAll('button:not(:disabled)')];
   if(e.key==='ArrowDown'||e.key==='ArrowUp'){
     e.preventDefault();const at=buttons.indexOf(document.activeElement);
     buttons[(at+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus();
   }
 });
 document.addEventListener('contextmenu',e=>{
  const node=e.target.closest('.side-file,.file-tab,.CodeMirror,.case-option');if(!node)return;
  e.preventDefault();const f=node.dataset.fileId?state.files.find(x=>x.id===node.dataset.fileId):null;
  if((node.matches('.side-file,.file-tab'))&&!f)return;
  close();menu=document.createElement('div');menu.className='mouse-menu';menu.setAttribute('role','menu');
  restoreFocus=node;
  const en=lang()==='en';
  const entries=f?fileContextEntries(f,en):node.closest('.CodeMirror')?[
    [en?'Copy':'复制',()=>{const value=editor.getSelection();if(value)void writeTextToClipboard(value);} ],
    [en?'Paste':'粘贴',async()=>{try{const value=native?.readClipboard?await native.readClipboard():await navigator.clipboard.readText();if(value)editor.replaceSelection(value,'around');editor.focus();}catch{toast(en?'Clipboard is unavailable':'剪贴板不可用，请使用 Ctrl+V');}}],
    [en?'Toggle comment':'注释 / 取消注释',()=>editor.execCommand('toggleComment')],
    [en?'Run':'编译运行',()=>run(false)], [en?'Run samples':'运行样例',()=>run(true)]
  ]:[[en?'Run samples':'运行样例',()=>run(true)]];
  entries.forEach(([label,handler,disabled=false,danger=false])=>{
   if(label==='---'){const line=document.createElement('div');line.className='mouse-menu-separator';menu.append(line);return;}
   const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('role','menuitem');b.disabled=!!disabled;
   if(danger)b.classList.add('danger');b.addEventListener('click',()=>{close();void Promise.resolve().then(handler).catch(err=>toast(err.message));});menu.append(b);
  });
  document.body.append(menu);
  const rect=menu.getBoundingClientRect();
  menu.style.left=Math.max(5,Math.min(e.clientX,innerWidth-rect.width-8))+'px';
  menu.style.top=Math.max(5,Math.min(e.clientY,innerHeight-rect.height-8))+'px';
  menu.querySelector('button:not(:disabled)')?.focus({preventScroll:true});
 },true);
}
// v3.5 Code Timeline & GDB variable value trace
const revisionClock=new Map(),pendingDiskSaves=new Map();
let autoSaveEpoch=0,traceResult=null,traceMark=null,contestProgress={};
const historyIdentity=f=>f.historyKey||(f.historyKey=f.fullPath||('unsaved:'+f.id));
async function revisionCheckpoint(f,label='自动版本'){
 if(!native?.historyCommit || !f?.content)return null;
 try{const v=await native.historyCommit(historyIdentity(f),f.content,label);revisionClock.set(f.id,Date.now());return v;}catch(e){toast('历史快照失败：'+e.message);return null;}
}
async function manualCheckpoint(){const r=await revisionCheckpoint(activeFile(),lang()==='en'?'Manual checkpoint':'手动检查点');if(r)toast(r.created?(lang()==='en'?'Checkpoint saved':'历史版本已保存'):(lang()==='en'?'No code changes':'代码未变化，无需重复保存'));}
function scheduleCodeAutosave(file){
 if(!file)return;const epoch=++autoSaveEpoch;const id=file.id;
 clearTimeout(pendingDiskSaves.get(id));
 pendingDiskSaves.set(id,setTimeout(async()=>{
  pendingDiskSaves.delete(id);
  const f=state.files.find(x=>x.id===id);if(!f)return;
  // Back up all tabs as local drafts; on-disk save applies to files with a real path.
  saveState();
  if(native?.autoSave && f.fullPath && f.dirty){
   const savedContent=f.content;
   try{await native.autoSave({filePath:f.fullPath,content:savedContent});
      if(f.content===savedContent){f.dirty=false;renderTabs();$('saveState').textContent=lang()==='en'?'Saved to disk · 2s':'已自动写入源文件 · 2s';}
   }catch(e){$('saveState').textContent=lang()==='en'?'Disk save failed':'磁盘保存失败';toast('自动保存失败：'+e.message);}
  }
  if(native?.historyCommit && Date.now()-(revisionClock.get(id)||0)>=Math.max(1,Number(state.preferences.historyMinutes)||1)*60000)await revisionCheckpoint(f);
 },2000));
}
async function showVersionHistory(){
 const file=activeFile();if(!native?.historyList){toast('历史回溯需要桌面客户端');return;}
 showModal(lang()==='en'?'Local Version Timeline':'代码历史版本 · 时间线',`<p class="modal-desc">${lang()==='en'?'Automatic snapshots every ~60s when edited, plus manual checkpoints. Last 32 unique revisions per file; all stored locally.':'修改中的代码约每 60 秒保存一次历史版本，亦可手动建检查点。每个文件最多保留 32 个不同版本，全部保存在本机。'}</p><div class="timeline-toolbar"><strong id="timelineName"></strong><button class="button primary" id="timelineCheckpoint">＋ ${lang()==='en'?'Checkpoint':'创建检查点'}</button></div><div class="timeline-layout"><div id="timelineList" class="timeline-list"></div><div class="timeline-preview"><div class="timeline-head">${lang()==='en'?'HISTORICAL SOURCE / READ ONLY':'历史源码预览 · 只读'}</div><pre id="timelineCode"></pre><div class="modal-actions"><button id="timelineRestore" class="button primary" disabled>${lang()==='en'?'Restore this version':'恢复此版本到编辑器'}</button></div></div></div>`,true);
 $('timelineName').textContent=file.name;let selected=null;
 async function refresh(){const items=await native.historyList(historyIdentity(file));const list=$('timelineList');if(!list)return;list.replaceChildren();
  if(!items.length){list.textContent=lang()==='en'?'No snapshots yet.':'尚未生成历史快照，点击创建检查点。';return;}
  for(const it of items){const btn=document.createElement('button');btn.className='timeline-entry';const date=new Date(it.createdAt).toLocaleString();btn.textContent=date+' · '+it.label+' · '+(it.bytes/1024).toFixed(1)+' KB';btn.onclick=async()=>{const r=await native.historyRead(historyIdentity(file),it.id);if(!$('timelineCode'))return;$('timelineCode').textContent=r.content;selected=r;$('timelineRestore').disabled=false;$$('.timeline-entry').forEach(x=>x.classList.toggle('selected',x===btn));};list.appendChild(btn);}
 }
 $('timelineCheckpoint').onclick=async()=>{await revisionCheckpoint(file,lang()==='en'?'Manual checkpoint':'手动检查点');await refresh();};
 $('timelineRestore').onclick=async()=>{if(!selected)return;if(!confirm(lang()==='en'?'Replace current editor with this revision? A checkpoint will be created first.':'确定恢复此版本？当前代码将先自动存为检查点。'))return;
    await revisionCheckpoint(file,'恢复之前');
    if(file.id!==state.activeId)switchFile(file.id);
    suppressEditorChange=true;editor.setValue(selected.content);suppressEditorChange=false;file.content=selected.content;file.dirty=!!file.fullPath;
    renderTabs();persistSoon();scheduleCodeAutosave(file);closeModal();toast(lang()==='en'?'Version restored. Auto-saving in 2s.':'旧版本已恢复，2 秒后自动保存。');
 };
 await refresh();
}
async function showVariableTrace(){
 const file=activeFile(),en=lang()==='en';
 showModal(en?'GDB Variable Timeline':'GDB 变量数值追溯',`<div class="trace-info"><strong>${en?'Real debugger snapshots — not AI guesses':'真实 GDB 快照 · 非 AI 推测'}</strong><small>${en?'Compiles with -O0 -g and steps through main(), recording local variables.':'使用 -O0 -g 编译并从 main() 逐行执行，记录每一步局部变量的数值。'}<br>${en?'Requires bundled gdb.exe. Limited to 200 steps and 20 seconds.':'需要内置 gdb.exe；最多 200 步，20 秒超时。'}</small></div><div class="trace-settings"><label>STDIN<textarea id="traceStdin" spellcheck="false"></textarea></label><label>${en?'Trace steps':'追溯步数'}<select id="traceSteps"><option value="30">30</option><option value="80" selected>80</option><option value="150">150</option><option value="200">200</option></select></label><button id="traceStart" class="button primary">▶ ${en?'Record actual values':'开始记录变量'}</button><button id="traceStop" class="button secondary">■ ${en?'Stop':'停止'}</button></div><div id="traceMessage" class="trace-message">${en?'Ready to trace current source':'准备对当前源文件进行追溯'}</div><div id="traceTimeline" class="hidden"><div class="trace-nav"><button id="tracePrev">←</button><input id="traceRange" type="range" min="0" max="0" value="0"><button id="traceNext">→</button><strong id="traceLocation">0 / 0</strong></div><div class="trace-variable-list" id="traceVariables"></div></div>`,true);
 $('traceStdin').value=state.stdin;
 $('traceStart').onclick=async()=>{if(busy){toast('请先停止其他任务');return;}if(!native?.trace){toast('GDB 追溯仅支持桌面客户端');return;}
  busy=true;updateButtons();$('traceStart').disabled=true;$('traceMessage').textContent=en?'Compiling debug build…':'正在生成调试版本…';try{
   traceResult=await native.trace({code:file.content,stdin:$('traceStdin').value,steps:Number($('traceSteps').value),compiler:'bundled'});
   if(!$('traceTimeline'))return;
   if(traceResult.status==='CE'||!traceResult.snapshots?.length){$('traceMessage').textContent=(traceResult.error||'No GDB snapshots found').slice(0,2000);return;}
   $('traceMessage').textContent=(en?'Collected ':'已采集 ')+traceResult.snapshots.length+(en?' real debugger snapshots.':' 个真实变量快照。');
   $('traceTimeline').classList.remove('hidden');$('traceRange').max=String(traceResult.snapshots.length-1);$('traceRange').value='0';showTraceStep(0);
  }catch(e){if($('traceMessage'))$('traceMessage').textContent=e.message;}finally{busy=false;updateButtons();if($('traceStart'))$('traceStart').disabled=false;}
 };
 $('traceStop').onclick=()=>native?.cancel();
 $('tracePrev').onclick=()=>showTraceStep(Math.max(0,Number($('traceRange').value)-1));$('traceNext').onclick=()=>showTraceStep(Math.min(traceResult?.snapshots?.length-1||0,Number($('traceRange').value)+1));$('traceRange').oninput=e=>showTraceStep(Number(e.target.value));
}
function showTraceStep(index){const snap=traceResult?.snapshots?.[index];if(!snap||!$('traceVariables'))return;
 $('traceRange').value=String(index);$('traceLocation').textContent=`${index+1} / ${traceResult.snapshots.length} · ${snap.line?'main.cpp:'+snap.line:'No source line'}`;
 const parent=$('traceVariables');parent.replaceChildren();for(const v of snap.variables){const row=document.createElement('div');row.className='trace-variable';const label=document.createElement('strong');label.textContent=v.name;const value=document.createElement('code');value.textContent=v.value;const previous=traceResult.snapshots[index-1]?.variables?.find(x=>x.name===v.name);if(previous && previous.value!==v.value)row.classList.add('changed');row.append(label,value);parent.appendChild(row);}
 if(!snap.variables.length)parent.textContent=lang()==='en'?'No local variables in this frame.':'当前帧没有可读取的局部变量。';
 if(snap.line && editor){editor.setCursor(Math.max(0,snap.line-1),0);editor.scrollIntoView({line:Math.max(0,snap.line-1),ch:0},140);if(traceMark)traceMark.clear();traceMark=editor.markText({line:Math.max(0,snap.line-1),ch:0},{line:Math.max(0,snap.line-1),ch:Math.max(1,editor.getLine(Math.max(0,snap.line-1))?.length||1)},{className:'trace-highlight'});}
}
function contestProgressKey(){const m=localContest(),task=currentContestTask();return m&&task?window.YanpbContestWorkflow.key(m.folder,task.task):null;}
function markContestResult(status,testCount,explicitKey=null){const key=explicitKey||contestProgressKey();if(!key)return;state.contestProgress=state.contestProgress||{};state.contestProgress[key]={status,testCount,when:Date.now()};persistSoon();if(state.sidebar==='contest')contestSidebar();renderContestRibbon();renderModePanel();}
function advanceContestTask(direction){const m=localContest();if(!m){selectNav('contest');return;}const idx=m.files.findIndex(f=>f.task===currentContestTask()?.task);const next=m.files[((idx<0?0:idx)+direction+m.files.length)%m.files.length];if(next)openContestTask(next.task);}
function showContestOverview(){const m=localContest(),en=lang()==='en';if(!m){showContestCreator();return;}
 showModal(en?'Contest Command Center':'比赛指挥台',`<div class="trace-info"><strong>${esc(m.contestName)}</strong><small>${esc(m.platform.toUpperCase())} · ${m.files.length} ${en?'problems':'道题'} · ${formatRemaining(m)} ${en?'remaining':'剩余'}</small></div><div id="contestOverviewList" class="contest-overview"></div><div class="modal-actions"><button id="contestOverviewAudit" class="button secondary">${en?'Submission preflight':'提交检查'}</button><button id="contestOverviewNext" class="button primary">${en?'Next problem →':'下一题 →'}</button></div>`,true);
 const list=$('contestOverviewList');m.files.forEach((t,i)=>{const record=window.YanpbContestWorkflow.read(state.contestProgress,m,t.task);const row=document.createElement('button');row.className='contest-overview-row';row.innerHTML=`<b>${i+1}. ${esc(t.task)}.cpp</b><span class="${record?.status==='OK'?'ok':'muted'}">${record?esc(record.status)+' · '+record.testCount+' '+(en?'cases':'组样例'):(en?'Not tested':'尚未测试')}</span>`;row.onclick=()=>{openContestTask(t.task);closeModal();};list.appendChild(row);});
 $('contestOverviewAudit').classList.toggle('hidden',!canCheckCsp());$('contestOverviewAudit').onclick=showSubmissionReview;$('contestOverviewNext').onclick=()=>{advanceContestTask(1);closeModal();};
}

function initToolbarMenus(){
 const anchors=[
  {button:$('toolbarMoreBtn'),panel:$('toolbarMoreMenu')},
  {button:$('editorMoreBtn'),panel:$('editorMoreMenu')}
 ];
 function closeAll(){anchors.forEach(({button,panel})=>{panel.classList.add('hidden');button.setAttribute('aria-expanded','false');});}
 anchors.forEach(({button,panel})=>{
  button.addEventListener('click',e=>{e.stopPropagation();const shouldOpen=panel.classList.contains('hidden');closeAll();if(shouldOpen){panel.classList.remove('hidden');button.setAttribute('aria-expanded','true');}});
  panel.addEventListener('click',e=>{if(e.target.closest('button[role="menuitem"]'))closeAll();});
  panel.addEventListener('keydown',e=>{
    const items=[...panel.querySelectorAll('button:not(.hidden):not([disabled])')];
    const idx=items.indexOf(document.activeElement);
    if(e.key==='ArrowDown'){e.preventDefault();items[(idx+1)%items.length]?.focus();}
    if(e.key==='ArrowUp'){e.preventDefault();items[(idx+items.length-1)%items.length]?.focus();}
  });
 });
 document.addEventListener('pointerdown',e=>{if(!anchors.some(({button,panel})=>button.contains(e.target)||panel.contains(e.target)))closeAll();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&anchors.some(x=>!x.panel.classList.contains('hidden'))){closeAll();e.stopPropagation();}});
 $('moreContestOpenBtn').onclick=openContestWorkspace;
 $('moreCreateContestBtn').onclick=showContestCreator;
 $('moreStressBtn').onclick=showStress;
 $('moreCphBtn').onclick=showCompanion;
 $('moreBrowserBridgeBtn').onclick=showBrowserBridgeConnection;
 $('moreShortcutsBtn').onclick=showShortcuts;
 $('moreSettingsBtn').onclick=showPreferences;
 $('editorOpenFile').onclick=openFile;$('editorSaveFile').onclick=()=>saveFile(false);
 $('editorDebugStart').onclick=()=>liveBridge?.startDebug();$('editorInsertTemplate').onclick=showTemplatePicker;
}
// v3.9 contest lifecycle and scoped submission validation.
function contestStatus(){const m=localContest();return m?window.YanpbContestLifecycle.normalize(m).status:'none';}
function canCheckCsp(){const m=localContest();return state.competitionMode==='oi'&&!!m&&['cspj','csps'].includes(m.platform)&&m.exam===true;}
function canRecordContest(){return state.competitionMode==='icpc'&&contestStatus()==='running'&&window.YanpbContestLifecycle.remainingMs(localContest())>0;}
function updateContestControls(){
 const m=localContest(),status=contestStatus(),en=lang();if(!m)return;
 const start=$('contestLifecycleStart'),pause=$('contestLifecyclePause'),finish=$('contestLifecycleFinish'),label=$('contestLifeStatus');
 if(start)start.disabled=status!=='ready';
 if(pause){pause.disabled=!['running','paused'].includes(status)||(status==='paused'&&window.YanpbContestLifecycle.remainingMs(m)===0);pause.textContent=status==='paused'?(en?'▶ Resume':'▶ 继续'):(en?'Ⅱ Pause':'Ⅱ 暂停');}
 if(finish)finish.disabled=status==='finished'||status==='ready';
 if(label)label.textContent=({ready:en?'Ready':'未开始',running:en?'Running':'进行中',paused:en?'Paused':'已暂停',finished:en?'Finished':'已结束'})[status]||status;
}
async function changeContestLifecycle(event){
 const m=localContest();if(!m){toast(lang()==='en'?'Create a contest first':'请先创建比赛');return;}
 if(event==='finish'){const summary=window.YanpbContestWorkflow.summarize(m,state.contestProgress||{});const en=lang()==='en';const msg=en?`Finish this contest? ${summary.tested}/${summary.total} problems have local sample tests. The timer and practice score will be frozen. This does not submit code to an OJ.`:`确认结束比赛？本地已测试 ${summary.tested}/${summary.total} 题；结束后冻结计时和练习计分，不会自动提交到 OJ。`;if(!confirm(msg))return;}
 try{
  if(!native?.contestTransition){toast('请在 Windows 桌面客户端操作比赛');return;}
  const next=await native.contestTransition(m,event);
  state.currentContest=next;state.modeContests[state.competitionMode]=next;window.YanpbContestRegistry.add(state.contestWorkspaces,next,state.competitionMode);
  if(state.sidebar==='contest')contestSidebar();
  updateContestTime();updateContestControls();renderContestRibbon();renderModePanel();saveState();
  const msg={start:'比赛已开始',pause:'比赛已暂停',resume:'比赛已继续',finish:'比赛已结束'};
  toast(lang()==='en'?({start:'Contest started',pause:'Contest paused',resume:'Contest resumed',finish:'Contest finished'}[event]):msg[event]);
 }catch(err){toast(err.message);}
}
function templateById(id){return state.userTemplates.find(t=>t.id===id);}
function insertSnippet(t){
 if(!editor||!t)return;
 editor.replaceSelection(t.code,'around');editor.focus();
 toast((lang()==='en'?'Inserted':'已插入')+' · '+t.name);
}
function quickTemplateInsert(){
 if(!editor)return;
 const cur=editor.getCursor(),found=window.YanpbTemplates.expandAbbreviation(editor.getLine(cur.line),cur.ch,state.userTemplates);
 if(found){editor.replaceRange(found.code,{line:cur.line,ch:found.start},cur,'end');editor.focus();toast('✓ '+templateById(found.id)?.name);return;}
 showTemplatePicker();
}
function showTemplatePicker(){
 const en=lang();showModal(en?'Insert Code Snippet':'快捷插入代码模板',`<p class="modal-desc">${en?'Type an abbreviation followed by Ctrl+J in the editor, or pick a template below.':'在代码中输入缩写后按 Ctrl+J 即可展开，也可在此选择模板插入光标。'}</p><input id="snippetSearch" autocomplete="off" placeholder="${en?'Search templates or shortcuts…':'搜索模板名或快捷缩写…'}"><div id="snippetResults" class="palette-list"></div><div class="modal-actions"><button class="button secondary" id="openTemplateManager">${en?'Manage library':'管理模板库'}</button></div>`);
 const box=$('snippetResults');function render(){box.replaceChildren();const query=$('snippetSearch').value.trim().toLowerCase();for(const t of state.userTemplates.filter(x=>(x.name+' '+x.shortcut+' '+x.category).toLowerCase().includes(query))){const b=document.createElement('button');b.className='palette-entry';const n=document.createElement('span');n.textContent=t.name;const k=document.createElement('small');k.textContent=t.shortcut+' · '+t.category;b.append(n,k);b.onclick=()=>{closeModal();insertSnippet(t);};box.appendChild(b);}}
 $('snippetSearch').oninput=render;$('openTemplateManager').onclick=showTemplateManager;render();$('snippetSearch').focus();
}
function showTemplateManager(){
 const en=lang();showModal(en?'Algorithm Template Library':'竞赛模板 · 增删改查',`<p class="modal-desc">${en?'Personal editable C++ snippets. Search, create, modify, delete, and insert without network access.':'内置模板首次复制到个人库，可离线增删改查。缩写 + Ctrl+J 能在代码区直接展开。'}</p><div class="template-modal-layout"><div><input id="templateFilter" placeholder="${en?'Search snippets…':'查找模板…'}"><div id="templateManagerList" class="template-items"></div><div class="template-toolbar-actions"><button class="button secondary" id="templateAdd">＋ ${en?'New':'新建模板'}</button></div></div><div class="template-editor"><label>${en?'Template name':'模板名称'}<input id="tmplName" maxlength="72" placeholder="BFS / Dijkstra"></label><div class="preference-grid"><label>${en?'Category':'分类'}<input id="tmplCategory" maxlength="40" placeholder="Graph"></label><label>${en?'Abbreviation':'展开缩写'}<input id="tmplShortcut" maxlength="24" placeholder="bfs"></label></div><label>${en?'C++ code':'模板源码'}<textarea id="tmplCode" spellcheck="false"></textarea></label><div class="template-toolbar-actions"><button id="tmplSave" class="button primary">${en?'Save':'保存模板'}</button><button id="tmplInsert" class="button secondary">${en?'Insert at cursor':'光标插入'}</button><button id="tmplNewTab" class="button secondary">${en?'Open in new tab':'新标签打开'}</button><button id="tmplRemove" class="button ghost">${en?'Delete':'删除'}</button></div><p id="templateMessage" class="template-help">${en?'Ctrl+J expands a shortcut in the editor.':'在编辑器输入缩写，然后按 Ctrl+J 展开。'}</p></div></div>`,true);
 let selected=state.userTemplates[0]?.id||null;
 const elements={name:$('tmplName'),category:$('tmplCategory'),shortcut:$('tmplShortcut'),code:$('tmplCode')};
 function collect(){return {name:elements.name.value,category:elements.category.value,shortcut:elements.shortcut.value,code:elements.code.value};}
 function choose(id){selected=id;const t=templateById(id);elements.name.value=t?.name||'';elements.category.value=t?.category||'自定义';elements.shortcut.value=t?.shortcut||'';elements.code.value=t?.code||'';$('tmplRemove').disabled=!id;render();}
 function render(){const box=$('templateManagerList');box.replaceChildren();const q=$('templateFilter').value.toLowerCase();for(const t of state.userTemplates.filter(t=>(t.name+' '+t.shortcut+' '+t.category).toLowerCase().includes(q))){const b=document.createElement('button');b.className=(selected===t.id?'selected':'');b.textContent=t.name;const x=document.createElement('small');x.textContent=t.shortcut+' · '+t.category;b.appendChild(x);b.onclick=()=>choose(t.id);box.appendChild(b);}}
 $('templateFilter').oninput=render;$('templateAdd').onclick=()=>choose(null);
 $('tmplSave').onclick=()=>{try{const values=collect();state.userTemplates=window.YanpbTemplates.insertOrUpdate(state.userTemplates,values,selected);const t=state.userTemplates.find(x=>x.shortcut===values.shortcut);selected=t?.id||selected;persistSoon();if(state.sidebar==='templates')renderFiles();choose(selected);$('templateMessage').textContent=en?'Saved locally':'已保存到本地模板库';}catch(err){$('templateMessage').textContent='⚠ '+err.message;}};
 $('tmplRemove').onclick=()=>{if(!selected)return;if(!confirm(en?'Delete this template?':'确定删除此模板？'))return;try{state.userTemplates=window.YanpbTemplates.remove(state.userTemplates,selected);persistSoon();if(state.sidebar==='templates')renderFiles();choose(state.userTemplates[0]?.id||null);}catch(err){$('templateMessage').textContent=err.message;}};
 $('tmplInsert').onclick=()=>{const t=templateById(selected);if(t){closeModal();insertSnippet(t);}};
 $('tmplNewTab').onclick=()=>{const t=templateById(selected);if(t){closeModal();addFile('template-'+t.shortcut+'.cpp',t.code);}};
 choose(selected);
}

// v4.0: task-centred contest strip and familiar source-editor shortcuts.
let ribbonTransitionPending=false;
function contestRibbonVisible(contest, file, sidebar){
 // A restored contest is not an active contest when editing unrelated files.
 if(!contest)return false;
 return sidebar==='contest'||!!(file?.fullPath&&contest.files?.some(item=>item.source===file.fullPath));
}
function renderContestRibbon(){
 renderEditorScene();
 const m=localContest(),bar=$('contestRibbon');if(!bar)return;
 const has=contestRibbonVisible(m,activeFile(),state.sidebar);bar.classList.toggle('hidden',!has);document.body.classList.toggle('has-contest-ribbon',has);
 if(!has)return;
 const en=lang()==='en',status=contestStatus(),flow=window.YanpbContestWorkflow;
 $('ribbonName').textContent=m.contestName;
 $('ribbonPlatform').textContent=m.platform.toUpperCase()+' · '+(m.exam?'OI / CSP':'ICPC / LOCAL');
 const badge=$('ribbonStatus');badge.className='ribbon-status '+status;
 badge.textContent=({ready:en?'Ready':'未开始',running:en?'Running':'比赛中',paused:en?'Paused':'已暂停',finished:en?'Finished':'已结束'})[status]||status;
 const select=$('ribbonTaskSelect'),current=currentContestTask()?.task||m.files[0]?.task;
 select.replaceChildren();for(const f of m.files){const item=document.createElement('option');item.value=f.task;item.textContent=f.task+'.cpp';select.appendChild(item);}select.value=current||'';
 $('ribbonTaskLabel').textContent=en?'Problem':'当前题目';
 const summary=flow.summarize(m,state.contestProgress||{});
 $('ribbonProgress').textContent=en?`${summary.tested}/${summary.total} tested`:`${summary.tested}/${summary.total} 已测`;
 const action=flow.nextAction(status),main=$('ribbonMainAction');
 main.disabled=!action||ribbonTransitionPending;
 main.textContent=action==='start'?(en?'▶ Start':'▶ 开始') : action==='pause'?(en?'Ⅱ Pause':'Ⅱ 暂停'):action==='resume'?(en?'▶ Resume':'▶ 继续'):(en?'Completed':'已完成');
 main.dataset.event=action||'';
 $('ribbonFinish').disabled=status==='ready'||status==='finished'||ribbonTransitionPending;
 $('ribbonFinish').textContent=en?'■ Finish':'■ 结束';
 updateContestRibbonClock();
}
function updateContestRibbonClock(){const m=localContest(),node=$('ribbonClock');if(!m||!node)return;
 const remaining=window.YanpbContestLifecycle.remainingMs(m),ms=Math.max(0,remaining);
 const h=Math.floor(ms/3600000),min=Math.floor(ms%3600000/60000),sec=Math.floor(ms%60000/1000);
 node.textContent=[h,min,sec].map(x=>String(x).padStart(2,'0')).join(':');node.classList.toggle('urgent',ms<10*60000);
}
let searchMarkers=[],searchHits=[],searchIndex=-1,searchActive=false;
function clearSearchMarkers(){for(const mark of searchMarkers)mark.clear();searchMarkers=[];}
function searchRefresh(preferred=null){
 clearSearchMarkers();const term=$('editorSearchInput').value;
 searchHits=window.YanpbEditorCommands.matches(editor.getValue(),term);
 const doc=editor.getDoc();for(const x of searchHits.slice(0,250)){searchMarkers.push(editor.markText(doc.posFromIndex(x.start),doc.posFromIndex(x.end),{className:'editor-search-match'}));}
 if(searchHits.length){searchIndex=preferred===null?0:Math.max(0,Math.min(searchHits.length-1,preferred));}
 else searchIndex=-1;
 $('editorSearchCount').textContent=searchHits.length?(searchIndex+1)+' / '+searchHits.length:'0 / 0';
}
function searchGoto(index){if(!searchHits.length)return;searchIndex=(index+searchHits.length)%searchHits.length;
 const hit=searchHits[searchIndex],doc=editor.getDoc();editor.setSelection(doc.posFromIndex(hit.start),doc.posFromIndex(hit.end));editor.scrollIntoView(doc.posFromIndex(hit.start),95);
 $('editorSearchCount').textContent=(searchIndex+1)+' / '+searchHits.length;
}
function openEditorSearch(){searchActive=true;$('editorSearchBar').classList.remove('hidden');
 const sel=editor.getSelection();if(sel&&sel.length<=80&&!sel.includes('\n'))$('editorSearchInput').value=sel;
 searchRefresh();$('editorSearchInput').focus();$('editorSearchInput').select();}
function closeEditorSearch(){searchActive=false;$('editorSearchBar').classList.add('hidden');clearSearchMarkers();editor.focus();}
function gotoEditorLine(){const en=lang()==='en';showModal(en?'Go to Line':'跳转至代码行',`<p class="modal-desc">${en?'Enter a source line number.':'输入要跳转的源码行号。'} ${en?'Total':'总行数'}: ${editor.lineCount()}</p><label for="gotoLineInput">${en?'Line':'行号'}</label><input type="number" min="1" max="${editor.lineCount()}" id="gotoLineInput" value="${editor.getCursor().line+1}"><div class="modal-actions"><button class="button primary" id="gotoLineConfirm">${en?'Go':'跳转'}</button></div>`);
 const doGoto=()=>{const line=Number($('gotoLineInput').value);if(!Number.isInteger(line)||line<1||line>editor.lineCount()){toast(en?'Invalid line number':'行号超出范围');return;}closeModal();editor.setCursor(line-1,0);editor.scrollIntoView({line:line-1,ch:0},100);editor.focus();};
 $('gotoLineConfirm').onclick=doGoto;$('gotoLineInput').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();doGoto();}};$('gotoLineInput').focus();$('gotoLineInput').select();
}
let completionTimer=null;
function showCodeCompletion(force=false){
 if(!editor||!editor.hasFocus()||!window.CodeMirror?.showHint||state.preferences.codeHintsEnabled===false)return;
 const cm=editor,cursor=cm.getCursor(),fileId=activeFile().id,doc=cm.getValue();
 const prefix=window.YanpbCodeCompletion.prefixAt(cm.getLine(cursor.line),cursor.ch);
 if(!force&&prefix.length<2)return;
 const fallback=window.YanpbCodeCompletion.fallback(doc,cm.getLine(cursor.line),cursor.ch);
 const hints=async(cm2,done)=>{
  let items=fallback;
  const raw=await liveBridge?.completeAt(cursor.line,cursor.ch);
  if(raw){const lsp=window.YanpbCodeCompletion.normalizeLsp(raw,prefix);if(lsp.length)items=lsp;}
  if(activeFile().id!==fileId||editor.getValue()!==doc)return done({list:[],from:cursor,to:cursor});
  const current=cm2.getCursor();if(current.line!==cursor.line||current.ch!==cursor.ch)return done({list:[],from:cursor,to:cursor});
  const from={line:cursor.line,ch:cursor.ch-prefix.length};
  done({list:items.slice(0,55).map(it=>({text:it.insertText,displayText:it.label+(it.detail?' · '+it.detail:''),className:it.kind==='local'?'hint-local':'hint-semantic'})),from,to:cursor});
 };
 hints.async=true;
 cm.showHint({hint:hints,completeSingle:false,closeCharacters:/[\s()\[\]{};:,]/,alignWithWord:true});
}
function armCodeCompletion(change){
 clearTimeout(completionTimer);if(state.preferences.codeHintsEnabled===false)return;
 if(!change?.text?.length||change.origin==='setValue'||change.text.join('\n').length!==1)return;
 const inserted=change.text[0];if(!/^[A-Za-z_]$/.test(inserted))return;
 completionTimer=setTimeout(()=>showCodeCompletion(false),330);
}
function editorKeymap(){const cmd=window.YanpbEditorCommands;
 return {
  'Ctrl-J':()=>quickTemplateInsert(),'Cmd-J':()=>quickTemplateInsert(),
  'Ctrl-/':'toggleComment','Cmd-/':'toggleComment',
  'Ctrl-Space':()=>showCodeCompletion(true),'Cmd-Space':()=>showCodeCompletion(true),
  'Shift-Ctrl-D':cm=>cmd.duplicateLines(cm),'Shift-Cmd-D':cm=>cmd.duplicateLines(cm),
  'Shift-Ctrl-K':cm=>cmd.deleteLines(cm),'Shift-Cmd-K':cm=>cmd.deleteLines(cm),
  'Alt-Up':cm=>cmd.moveLines(cm,-1),'Alt-Down':cm=>cmd.moveLines(cm,1),
  'Ctrl-L':cm=>cmd.selectLine(cm),'Cmd-L':cm=>cmd.selectLine(cm),
  'Ctrl-D':cm=>cmd.selectNextOccurrence(cm),'Cmd-D':cm=>cmd.selectNextOccurrence(cm),
  'Ctrl-Y':'redo','Shift-Cmd-Z':'redo','Shift-Ctrl-Z':'redo',
  'Shift-Tab':cm=>cm.indentSelection('subtract'),
  'Tab':cm=>{if(cm.somethingSelected())cm.indentSelection('add');else cm.replaceSelection(' '.repeat(cm.getOption('indentUnit')),'end');}
 };
}
function initEditorNavigation(){
 $('editorSearchInput').oninput=()=>searchRefresh();
 $('editorFindNext').onclick=()=>searchGoto(searchIndex+1);
 $('editorFindPrev').onclick=()=>searchGoto(searchIndex-1);
 $('editorSearchClose').onclick=closeEditorSearch;
 $('editorSearchInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();searchGoto(searchIndex+(e.shiftKey?-1:1));}else if(e.key==='Escape'){e.preventDefault();closeEditorSearch();}});
 $('ribbonTaskSelect').onchange=e=>openContestTask(e.target.value);
 $('ribbonMainAction').onclick=async()=>{const event=$('ribbonMainAction').dataset.event;if(!event||ribbonTransitionPending)return;ribbonTransitionPending=true;renderContestRibbon();try{await changeContestLifecycle(event);}finally{ribbonTransitionPending=false;renderContestRibbon();}};
 $('ribbonFinish').onclick=async()=>{if(ribbonTransitionPending)return;ribbonTransitionPending=true;renderContestRibbon();try{await changeContestLifecycle('finish');}finally{ribbonTransitionPending=false;renderContestRibbon();}};
 $('ribbonOverview').onclick=showContestOverview;
}

function collapsePanel(which,force){
 const old=state.panelCollapsed[which];state.panelCollapsed[which]=force===undefined?!old:!!force;
 if(which==='left')state.preferences.showSidebar=!state.panelCollapsed.left;
 if(which==='right')state.preferences.showRight=!state.panelCollapsed.right;
 if(which==='bottom'){$('terminalPane').classList.toggle('is-collapsed',state.panelCollapsed.bottom);}
 applyPersonalization();persistSoon();setTimeout(()=>editor?.refresh(),340);
}
function showContestSwitcher(){
 const en=lang()==='en',mode=state.competitionMode,list=state.contestWorkspaces[mode]||[];
 showModal(en?'Switch competition':'切换比赛工作区',`<p class="modal-desc">${en?'Multiple independent local contest folders per mode. Switching preserves the previous contest and tests.':'当前模式可以同时管理多个比赛目录。切换不会删除原比赛的代码、测试与计时。'}</p><div id="contestWorkspaceList" class="workspace-switch-list"></div><div class="modal-actions"><button class="button secondary" id="switchBrowse">${en?'Open from disk':'从文件夹打开比赛'}</button><button class="button primary" id="switchCreate">${en?'Create new contest':'创建新比赛'}</button></div>`,true);
 const box=$('contestWorkspaceList');if(!list.length){const msg=document.createElement('p');msg.className='modal-desc';msg.textContent=en?'No contests in this mode yet.':'该模式下还没有比赛项目';box.append(msg);}
 list.forEach(m=>{const r=document.createElement('div');r.className='workspace-switch-row';
  const pick=document.createElement('button');pick.className='workspace-switch-open';const title=document.createElement('strong');title.textContent=m.contestName||m.folder.split(/[\\/]/).pop();const sub=document.createElement('small');sub.textContent=m.platform+' · '+m.folder;pick.append(title,sub);pick.onclick=async()=>{try{await loadContest(m);closeModal();selectNav('contest');}catch(e){toast(e.message);}};
  const badge=document.createElement('span');badge.className='workspace-current';badge.textContent=window.YanpbContestRegistry.key(m)===window.YanpbContestRegistry.key(localContest())?(en?'CURRENT':'当前'):'';
  const remove=document.createElement('button');remove.className='workspace-forget';remove.textContent='×';remove.title=en?'Remove from recent list (keep files)':'从最近列表移除（保留磁盘文件）';remove.onclick=()=>{window.YanpbContestRegistry.remove(state.contestWorkspaces,m.folder,mode);persistSoon();showContestSwitcher();};
  r.append(pick,badge,remove);box.append(r);
 });
 $('switchBrowse').onclick=()=>{closeModal();openContestWorkspace();};$('switchCreate').onclick=()=>{closeModal();showContestCreator();};
}
// Remote results are shown only as OFFICIAL when the ledger matched platform,
// submission ID, contest and problem. An observed form click is never a verdict.
function officialVerdictPresentation(record){
 const verified=record?.officialVerified===true;
 const judging=record?.state==='judging'&&record?.confidence&&record?.receipt;
 const raw=verified?String(record.verdict||'').toUpperCase():judging?'PENDING':'';
 const failures=['WA','TLE','MLE','RE','CE','OLE','PE','IE','UKE','IDLENESS','SECURITY','SKIPPED','REJECTED','FAILED','CHALLENGED'];
 const verdict=raw==='AC'?'AC':failures.includes(raw)?raw:raw==='PARTIAL'?'PARTIAL':['PENDING','TESTING','SUBMITTED'].includes(raw)?'JUDGING':'UNVERIFIED';
 const labels={AC:'官方 AC · Accepted',WA:'官方 WA · Wrong Answer',TLE:'官方 TLE · 超时',MLE:'官方 MLE · 内存超限',RE:'官方 RE · 运行错误',CE:'官方 CE · 编译错误',OLE:'官方 OLE · 输出超限',PE:'官方 PE · 格式错误',IE:'官方 IE · 系统错误',UKE:'官方 UKE · 未知错误',IDLENESS:'官方失败 · 空闲超时',SECURITY:'官方失败 · 安全限制',SKIPPED:'官方结果 · 已跳过',REJECTED:'官方结果 · 已拒绝',FAILED:'官方结果 · 失败',CHALLENGED:'官方结果 · Hack 成功',PARTIAL:'官方结果 · 部分正确',JUDGING:'官方评测中',UNVERIFIED:'等待官方核对'};
 return {verdict,label:labels[verdict],tone:verdict==='AC'?'success':verdict==='JUDGING'?'pending':verdict==='UNVERIFIED'?'neutral':'danger',verified};
}
function renderOfficialVerdictHero(row){
 const root=$('fastVerdictHero');if(!root)return;root.replaceChildren();
 const p=officialVerdictPresentation(row);root.dataset.tone=p.tone;
 const top=document.createElement('div');top.className='official-verdict-head';
 const icon=document.createElement('span');icon.className='official-verdict-icon';icon.textContent=p.verdict==='AC'?'✓':p.tone==='danger'?'✕':'◷';
 const block=document.createElement('div');const title=document.createElement('strong');title.textContent=p.label;
 const detail=document.createElement('small');detail.textContent=(row?.platform?row.platform.toUpperCase()+' · '+row.problemId+' · ':'')+(row?.receipt?'Submission #'+row.receipt.id:'尚未确认 Submission ID');
 block.append(title,detail);top.append(icon,block);root.append(top);
 const footer=document.createElement('p');footer.textContent=p.verified?'此结果已按 OJ、Submission ID 和题号核对。':'这不是官方 AC；请在官网完成提交并核对记录。';root.append(footer);
 if(row?.receipt?.url){const a=document.createElement('a');a.href=row.receipt.url;a.target='_blank';a.rel='noreferrer noopener';a.textContent='查看官方提交记录 ↗';root.append(a);}
}
// Fast OJ competition workflow. The judge site handles the final authenticated submit.
let fastActiveId='';
let fastActivePlatform='';
let fastLedgerCache=[];
async function refreshFastLedger(){
 if(!native?.fastList)return;
 fastLedgerCache=await native.fastList();
 const area=$('fastHistory');if(!area)return;
 area.replaceChildren();
 if(!fastLedgerCache.length){const p=document.createElement('p');p.className='hint';p.textContent=lang()==='en'?'No prepared remote submissions.':'尚无远端提交任务。';area.append(p);return;}
 for(const rec of fastLedgerCache.slice(0,12)){
  const panel=document.createElement('div');panel.className='fast-entry';
  const h=document.createElement('header'),title=document.createElement('strong'),tag=document.createElement('span');
  title.textContent=rec.platform.toUpperCase()+' · '+rec.problemId;
  tag.className='oj-badge '+(rec.officialVerified?'verified':rec.state==='unverified'?'unverified':'');
  tag.textContent=({prepared:'已准备',form_filled:'代码已填入',receipt_pending:'等待核对',judging:'官方评测中',verified:'官方已核对',unverified:'题目关联待确认',failed:'失败'})[rec.state]||rec.state;
  h.append(title,tag);
  const verdictCard=document.createElement('div');const verdictUI=officialVerdictPresentation(rec);verdictCard.className='fast-verdict-pill '+verdictUI.tone;verdictCard.textContent=verdictUI.label;
  const detail=document.createElement('small');detail.textContent=rec.fileName+' · '+new Date(rec.createdAt).toLocaleString()+' · SHA256 '+rec.sourceHash.slice(0,10);
  const metrics=[Number.isInteger(rec.passedTests)?'通过 '+rec.passedTests+' 个测试':null,Number.isFinite(rec.timeMs)?rec.timeMs+' ms':null,Number.isFinite(rec.memoryBytes)?Math.round(rec.memoryBytes/1024)+' KB':null].filter(Boolean).join(' · ');
  const sub=document.createElement('small');sub.textContent=(rec.verdict?(rec.officialVerified?'官方记录已核对：':'官方记录题目待核对：')+rec.verdict:rec.receipt?'自动识别 Submission ID #'+rec.receipt.id+' · 判题待核对':rec.detectedCandidates?.length?'识别到 '+rec.detectedCandidates.length+' 条记录候选，待选择':'尚未识别到官方提交记录')+(metrics?' · '+metrics:'');
  const actions=document.createElement('div');actions.className='fast-row-actions';
  const pick=document.createElement('button');pick.textContent=lang()==='en'?'Inspect':'查看/核对';pick.onclick=()=>{
   fastActiveId=rec.id;fastActivePlatform=rec.platform;
   const url=$('fastOfficialUrl');if(url)url.value=rec.receipt?.url||'';
   $('fastStatus').textContent='当前任务：'+rec.platform.toUpperCase()+' '+rec.problemId+' · '+(rec.verdict||rec.state);
   $('fastCFBox')?.classList.toggle('hidden',rec.platform!=='codeforces');showDetectedRecords(rec);renderOfficialVerdictHero(rec);
  };
  const reopen=document.createElement('button');reopen.textContent=lang()==='en'?'View on OJ':'浏览器查看官网';reopen.onclick=async()=>{
    try{await native.ojOpen(rec.receipt?.url||rec.problemUrl,true);fastActiveId=rec.id;fastActivePlatform=rec.platform;toast('已在系统浏览器中打开官方页面');}
    catch(e){toast(e.message);}
  };
  actions.append(pick,reopen);panel.append(h,verdictCard,detail,sub,actions);area.append(panel);
 }
}
async function openBrowserSubmission(){
 const file=activeFile(),en=lang()==='en';
 if(!native?.ojBrowserOpen){toast(en?'Only available in Windows desktop app':'请在 Windows 桌面客户端中使用');return;}
 const raw=file?.problemInfo?.url||file?.problemUrl||'';
 if(!raw){
  // A URL is essential for safe automatic platform/problem matching.
  const entered=prompt(en?'Official OJ problem URL (Codeforces / AtCoder / Luogu):':'请输入该文件对应的 OJ 题目链接：','');
  if(!entered)return;
  file.problemInfo={...(file.problemInfo||{}),url:entered};saveState();
 }
 try{
  const result=await native.ojBrowserOpen({url:file.problemInfo.url,code:file.content,fileKey:file.fullPath||'draft:'+file.id,fileName:file.name});
  lastBrowserSubmitId=result.id;lastBrowserSubmitFileId=file.id;watchedBrowserTasks.add(result.id);state.browserWatchedIds=[...watchedBrowserTasks].slice(-40);saveState();
  try{await native.writeClipboard?.(file.content);}catch{}
  toast((en?'Official submit page opened · source copied':'已打开官网提交页 · 源码已复制，可直接粘贴')+' · '+result.platform+' · '+result.problemId);
  showBrowserResultNotice({phase:'watching',platform:result.platform,problemId:result.problemId,id:result.id,watching:result.watching});
  if(result.warning)toast(result.warning);
  // The official webpage opens in the system browser. If the result-watcher
  // extension is not yet paired, expose the missing step rather than silently
  // leaving the user searching for an inaccessible PIN dialog.
  const bridge=await native.browserBridgeStatus?.().catch(()=>null);
  if(bridge?.active&&!bridge.paired)void showBrowserBridgeConnection();
 }catch(err){toast((en?'Cannot open OJ submission page: ':'打开提交页失败：')+err.message);}
}
// OJ result bridge pairing must be reachable independently of the legacy
// Fast OJ submission dialog. The browser-submit action no longer calls that UI.
async function showBrowserBridgeConnection(){
 const en=lang();
 if(!native?.browserBridgeStatus||!native?.browserBridgePair){
   toast(en?'The desktop app is required for OJ pairing.':'请在 CodeLab 桌面客户端中连接 OJ 浏览器扩展。');return;
 }
 showModal(en?'OJ Result Bridge · Browser connection':'OJ 判题扩展连接 · 6 位授权码',`
 <div class="bridge-pair-top"><strong>${en?'Yanpb OJ Result Bridge':'Yanpb OJ 判题回传扩展'}</strong><span class="bridge-port">127.0.0.1:10045</span></div>
 <p class="modal-desc">${en?'Competitive Companion (port 10043) only imports problems. This connection (port 10045) watches official results.':'Competitive Companion（10043）只导入题目；Yanpb OJ Result Bridge（10045）负责回传官方判题。请安装 Yanpb OJ Result Bridge v1.2.0。'}</p>
 <div class="bridge-connection-state" id="bridgeConnectionState" role="status" aria-live="polite">${en?'Checking bridge…':'正在检测本机桥接服务…'}</div>
 <div class="bridge-code-panel"><span class="bridge-code-label">${en?'ONE-TIME AUTHORIZATION CODE':'一次性 6 位授权码'}</span><div id="bridgeAuthPin" class="bridge-auth-pin" aria-live="polite">······</div><small id="bridgeAuthExpiry">${en?'Click generate to create a code valid for 5 minutes.':'点击生成授权码，有效期 5 分钟。'}</small></div>
 <div class="modal-actions"><button class="button primary" id="bridgeGeneratePin">${en?'Generate / Renew PIN':'生成 / 重新生成授权码'}</button><button class="button secondary" id="bridgeCopyPin" disabled>${en?'Copy PIN':'复制授权码'}</button></div>
 <div class="modal-actions"><button class="button secondary" id="bridgeOpenFolder">${en?'Extension install folder':'打开插件安装目录'}</button><button class="button secondary" id="bridgeRecheck">${en?'Recheck connection':'重新检测连接'}</button><button class="button secondary" id="bridgeRevoke">${en?'Revoke authorization':'撤销旧授权'}</button></div>
 <div class="bridge-instructions">${en?'Chrome: chrome://extensions · Edge: edge://extensions. Load the unpacked extension, click its icon, enter the six digits and press Connect CodeLab.':'在 Chrome 打开 chrome://extensions，或 Edge 打开 edge://extensions；开启开发者模式、加载已解压的扩展，点击「Yanpb OJ Result Bridge」扩展图标，输入这 6 位数字连接。'}</div>
 <small class="hint">${en?'Receiving a PIN does not mean that the official OJ account is authenticated.':'授权码仅用于本机浏览器扩展配对，不是 OJ 官网账号验证码。'}</small>`,true);
 const el=$('bridgeConnectionState');
 let pin='',expiresAt=0;
 const setCode=(data)=>{
   pin=data.pin;expiresAt=Date.now()+Math.max(0,Number(data.expiresIn)||300)*1000;
   $('bridgeAuthPin').textContent=pin;
   $('bridgeCopyPin').disabled=false;
   $('bridgeAuthExpiry').textContent=en?'Valid for 5 minutes. Enter it in the browser extension.':'5 分钟内在浏览器扩展中输入，过期后可重新生成。';
 };
 const refresh=async()=>{
   if(!$('bridgeConnectionState'))return null;
   try{
     const x=await native.browserBridgeStatus();
     if(!$('bridgeConnectionState'))return x;
     el.textContent=x.active?(x.connected?(en?'✓ Extension connected · official result listening':'✓ 已连接浏览器扩展 · 可以监听官方结果'):
       x.paired?(en?'Authorized, waiting for browser extension to connect.':'已授权，但扩展尚未建立连接；如更换浏览器，请重新生成授权码。'):
       (en?'Bridge is running. Pair the extension using the code below.':'桥接服务正在运行，请使用下方授权码进行配对。')):
       (en?'Bridge service is not running: ':'本机桥接服务未运行：')+(x.startupError||'127.0.0.1:10045');
     $('bridgeGeneratePin').disabled=!x.active;
     if(x.connected){pin='';$('bridgeAuthPin').textContent=en?'CONNECTED':'已连接';$('bridgeCopyPin').disabled=true;$('bridgeAuthExpiry').textContent='';}
     return x;
   }catch(err){if($('bridgeConnectionState'))el.textContent=(en?'Connection check failed: ':'检测连接失败：')+err.message;return null;}
 };
 const generate=async()=>{
   const btn=$('bridgeGeneratePin');btn.disabled=true;
   try{const result=await native.browserBridgePair();if(!$('bridgeAuthPin'))return;setCode(result);}
   catch(err){if($('bridgeConnectionState'))el.textContent=(en?'Cannot generate PIN: ':'无法生成授权码：')+err.message;}
   finally{if($('bridgeGeneratePin'))btn.disabled=false;}
 };
 $('bridgeGeneratePin').onclick=generate;
 $('bridgeCopyPin').onclick=async()=>{if(!pin||Date.now()>=expiresAt){toast(en?'PIN expired; regenerate it.':'授权码已过期，请重新生成。');return;}try{await native.writeClipboard(pin);toast(en?'PIN copied':'授权码已复制');}catch(err){toast(err.message);}};
 $('bridgeOpenFolder').onclick=async()=>{try{await native.browserBridgeFolder();}catch(err){toast((en?'Cannot open extension folder: ':'无法打开插件目录：')+err.message);}};
 $('bridgeRecheck').onclick=refresh;
 $('bridgeRevoke').onclick=async()=>{
   if(!confirm(en?'Revoke the old browser authorization? You will need to pair again.':'确定撤销旧浏览器授权？需要重新配对。'))return;
   try{await native.browserBridgeReset();pin='';$('bridgeAuthPin').textContent='······';$('bridgeCopyPin').disabled=true;await refresh();await generate();}
   catch(err){toast(err.message);}
 };
 const current=await refresh();
 // First use is one step: opening this dialog shows the PIN immediately.
 if(current?.active&&!current.connected)await generate();
 const t=setInterval(async()=>{
   if(!$('bridgeConnectionState')){clearInterval(t);return;}
   if(pin && Date.now()>=expiresAt){pin='';$('bridgeAuthPin').textContent=en?'EXPIRED':'已过期';$('bridgeCopyPin').disabled=true;$('bridgeAuthExpiry').textContent=en?'Regenerate the code.':'请重新生成 6 位授权码。';}
   await refresh();
 },3000);
}
async function showFastOJ(){
 const en=lang()==='en',f=activeFile();if(!native?.fastPrepare){toast(en?'Desktop client required':'需要桌面客户端');return;}
 const initial=f?.problemInfo?.url||'';
 showModal(en?'Fast OJ Submit · Competition':'极速 OJ 提交 · 比赛模式',`
 <p class="modal-desc">${en?'Send the frozen source directly to the Yanpb browser extension in your existing Chrome/Edge session. Competitive Companion still imports problems separately.':'源码直接交给浏览器中的 Yanpb Submit Bridge 扩展，不再打开内嵌官网。Competitive Companion 继续负责题目样例导入。'}</p>
 <div class="fast-tip" id="browserBridgeStatus">正在检查浏览器扩展连接…</div>
 <div class="modal-actions"><button class="button secondary" id="browserBridgeConnect">${en?'Connect browser extension':'连接浏览器扩展'}</button><button class="button secondary" id="browserBridgeInstall">${en?'Open extension folder':'打开扩展安装目录'}</button><button class="button secondary" id="browserBridgeReset">${en?'Reset pairing':'重置浏览器授权'}</button></div>
 <label>${en?'Target problem URL':'当前目标题目网址'}</label><input id="fastProblemUrl" type="url" spellcheck="false" value="${esc(initial)}" placeholder="https://codeforces.com/contest/1976/problem/B">
 <div class="fast-tip">${en?'Check contest ID, problem letter and C++ language before confirming on the OJ. Local samples do not imply an official AC.':'提交前确认比赛 ID、题号、C++ 语言与源码；本地样例通过不代表远端 AC。重复源码 90 秒内将复用准备任务。'}</div>
 <div class="modal-actions"><button class="button secondary" id="fastCopyCode">${en?'Copy source':'复制源码'}</button><button class="button secondary" id="fastPrepareNow">${en?'Fill through browser':'浏览器填表'}</button><button class="button primary" id="fastOneClick">${en?'One-click Submit':'一键提交'}</button></div>
 <div id="fastVerdictHero" class="official-verdict-hero" data-tone="neutral"></div><div id="fastStatus" class="hint">${en?'No prepared submission for the current file.':'尚未准备当前代码。'}</div>
 <div class="modal-section"><strong>${en?'Official confirmation':'关联官网提交记录'}</strong>
 <p class="hint">${en?'After browser submission, the extension will attempt to return the official detail URL. You can paste it manually when needed.':'浏览器扩展会尝试回传官方提交 ID；如官网未跳转到详情页，可粘贴实际提交链接。'}</p>
 <div class="fast-detected" id="fastDetectedRecords"><small>${en?'Waiting for an official Submission ID…':'等待官网识别 Submission ID…'}</small></div>
 <label>${en?'Official submission detail URL (manual fallback)':'官方提交详情链接（自动识别失败时备用）'}</label><input id="fastOfficialUrl" type="url" spellcheck="false" placeholder="https://codeforces.com/contest/1976/submission/123">
 <label id="fastCFBox" class="hidden">Codeforces Handle<input id="fastCFHandle" spellcheck="false" placeholder="your_handle"></label>
 <div class="modal-actions"><button id="fastLink" class="button secondary">${en?'Link official record':'关联官方记录'}</button><button id="fastVerify" class="button primary">${en?'Check actual verdict':'查询官方判题'}</button></div></div>
 <div class="modal-section"><strong>${en?'Pending submissions · independent per problem':'提交任务队列 · 各题独立保存'}</strong><div id="fastHistory"></div></div>`,true);
 let pairingPinVisible=false;
 const refreshBrowserBridge=async()=>{
  const el=$('browserBridgeStatus');if(!el)return;
  try{const x=await native.browserBridgeStatus();
   if(pairingPinVisible&&!x.connected)return;
   if(x.connected)pairingPinVisible=false;
   el.textContent=x.connected?(en?'✓ Browser extension connected':'✓ 浏览器扩展已连接'):
    x.paired?(en?'Paired; waiting for browser worker to check jobs':'已授权；等待浏览器扩展领取任务'):
    x.active?(en?'Not paired; connect the extension once':'尚未配对；首次使用需要浏览器扩展授权'):
    (en?'Bridge unavailable (port 10045)':'本机提交桥接未运行（10045 端口）')+(x.startupError?' · '+x.startupError:'');}
  catch(err){el.textContent=err.message;}
 };
 $('browserBridgeConnect').onclick=async()=>{try{
   const info=await native.browserBridgePair();pairingPinVisible=true;const el=$('browserBridgeStatus');if(el)el.textContent=(en?'Enter this 6-digit PIN in the browser extension: ':'请在浏览器扩展中输入此 6 位授权码：')+info.pin+'（5 分钟有效）';
  }catch(err){toast(err.message);}};
 $('browserBridgeInstall').onclick=async()=>{try{await native.browserBridgeFolder();toast(en?'In Chrome/Edge Extensions, enable Developer Mode → Load unpacked':'Chrome/Edge 扩展管理 → 开发者模式 → 加载已解压的扩展程序');}catch(err){toast(err.message);}};
 $('browserBridgeReset').onclick=async()=>{if(!confirm(en?'Revoke browser extension access?':'确定撤销浏览器扩展授权？撤销后需要重新配对。'))return;
  try{await native.browserBridgeReset();await refreshBrowserBridge();}catch(err){toast(err.message);}};
 void refreshBrowserBridge();
 // Keep the connection badge fresh while this dialog is open; never hide the PIN
 // until the browser has completed pairing. Closing the dialog stops polling.
 const bridgeTimer=setInterval(()=>{if(!$('browserBridgeStatus'))clearInterval(bridgeTimer);else void refreshBrowserBridge();},3000);
 $('fastCopyCode').onclick=()=>native.writeClipboard(f.content).then(()=>toast(en?'Source copied':'当前代码已复制')).catch(e=>toast(e.message));
 const submitFromIDE=async(oneClick=false)=>{
  const btn=oneClick?$('fastOneClick'):$('fastPrepareNow');btn.disabled=true;
  try{
   const url=$('fastProblemUrl').value.trim();
   const result=await native.fastPrepare({url,code:f.content,fileKey:f.fullPath||'draft:'+f.id,fileName:f.name,oneClick});
   fastActiveId=result.id;fastActivePlatform=result.platform;
   $('fastCFBox').classList.toggle('hidden',result.platform!=='codeforces');
   $('fastStatus').textContent=(result.duplicate?(en?'Existing snapshot reused. ':'已复用相同源码的准备任务。'):'')+(en?'Frozen snapshot':'源码已冻结')+' · '+result.problemId+' · SHA256 '+result.sourceHash.slice(0,12)+' · '+(en?'Queued for browser extension':'已发送至浏览器扩展队列');
   showDetectedRecords(result);renderOfficialVerdictHero(result);await refreshFastLedger();
  }catch(e){$('fastStatus').textContent=(en?'Prepare error: ':'准备失败：')+e.message;}
  finally{btn.disabled=false;}
 };
 $('fastPrepareNow').onclick=()=>submitFromIDE(false);
 $('fastOneClick').onclick=()=>submitFromIDE(true);
 $('fastLink').onclick=async()=>{
  if(!fastActiveId){toast(en?'Select a prepared task first':'请先准备或选择一条任务');return;}
  try{const result=await native.fastReceipt(fastActiveId,$('fastOfficialUrl').value.trim());
   $('fastStatus').textContent=(en?'Official record linked, not yet verified: ':'已关联记录，尚未确认评测：')+result.receipt.id;renderOfficialVerdictHero(result);await refreshFastLedger();
  }catch(e){$('fastStatus').textContent=e.message;}
 };
 $('fastVerify').onclick=async()=>{
  if(!fastActiveId){toast(en?'Select a task first':'请先选择提交任务');return;}
  try{
   const result=await native.fastVerdict(fastActiveId,$('fastCFHandle').value.trim());
   $('fastStatus').textContent=result.unavailable?result.message:(result.officialVerified?'✓ 官方题目/提交匹配':'⚠ 官方结果已读取，但题目关联尚不能独立核实')+' · '+result.verdict;
   if(!result.unavailable)renderOfficialVerdictHero(result);await refreshFastLedger();
  }catch(e){$('fastStatus').textContent=(en?'Unable to verify: ':'无法核验：')+e.message;}
 };
 await refreshFastLedger();renderOfficialVerdictHero(fastLedgerCache.find(x=>x.id===fastActiveId)||null);
}
function showDetectedRecords(record){
 const area=$('fastDetectedRecords');if(!area||!record)return;
 area.replaceChildren();
 const langEN=lang()==='en';
 const label=document.createElement('strong');label.textContent=record.receipt?
  (langEN?'Detected official Submission ID: #':'已识别官方 Submission ID：#')+record.receipt.id:
  (langEN?'Detected submission candidates':'已识别提交记录候选');area.append(label);
 if(record.receipt){const state=document.createElement('small');state.textContent=langEN?'Pending official task/verdict verification':'正在等待官网题号和判题核验';area.append(state);return;}
 const candidates=(record.detectedCandidates||[]).slice(0,8);
 if(!candidates.length){area.textContent=langEN?'No submission ID yet. Submit through the official site first.':'尚未识别到提交 ID。请先在官网确认提交。';return;}
 for(const c of candidates){
  const line=document.createElement('div');line.className='fast-candidate-row';
  const desc=document.createElement('span');desc.textContent='#'+c.id+(c.problemId?' · '+c.problemId:' · 题目待核对');
  const select=document.createElement('button');select.className='button secondary';select.textContent=langEN?'Use this ID':'选择此记录';
  select.onclick=async()=>{if(!fastActiveId)return;try{
    const updated=await native.fastReceipt(record.id,c.url);$('fastOfficialUrl').value=updated.receipt.url;
    $('fastStatus').textContent='已关联官方 Submission ID #'+updated.receipt.id+'，待核验题目和判题结果。';
    showDetectedRecords(updated);await refreshFastLedger();
   }catch(err){toast(err.message);}};
  line.append(desc,select);area.append(line);
 }
}
let lastBrowserSubmitId=null,lastBrowserSubmitFileId=null;
const watchedBrowserTasks=new Set(state.browserWatchedIds||[]);
const announcedOfficial=new Set();
let browserResultNoticeTimer=null;
function browserResultPresentation(record,english=false){
 const official=record?.officialVerified===true&&record?.state==='verified';
 const verdict=official?String(record.verdict||'UNKNOWN'):'';
 const failed=official&&verdict!=='AC';
 return {official,verdict,tone:official?(verdict==='AC'?'ac':verdict==='WA'?'wa':'error'):'pending',
  headline:official?('官方 '+verdict):(record?.receipt?'Submission #'+record.receipt.id+' · '+(english?'Awaiting verification':'待核验'):(english?'Browser submission · Waiting for result':'浏览器提交 · 等待官网结果')),
  reminder:failed?(english?'Please modify the code and submit again.':'请修改代码后重新提交。'):'',canAdvance:official&&verdict==='AC'};
}
function showBrowserResultNotice(record){
 const el=$('officialResultNotice');if(!el)return;
 clearTimeout(browserResultNoticeTimer);
 if(!record){el.classList.add('hidden');return;}
 const view=browserResultPresentation(record,lang()==='en');
 el.dataset.tone=view.tone;el.classList.remove('hidden');
 const headline=el.querySelector('.oj-result-headline'),detail=el.querySelector('.oj-result-detail'),next=el.querySelector('.oj-result-next');
 headline.textContent=view.headline;
 detail.textContent=[record.platform||'',record.problemId||'',record.receipt?.id?('#'+record.receipt.id):'',view.reminder,record.platform==='codeforces'&&!view.official&&!state.preferences.codeforcesHandle?'Settings 中填写 Codeforces handle 才能自动核验':''].filter(Boolean).join(' · ');
 next.classList.toggle('hidden',!view.canAdvance);next.textContent=lang()==='en'?'Next problem →':'下一题 →';next.onclick=()=>{clearTimeout(browserResultNoticeTimer);el.classList.add('hidden');advanceContestTask(1);};
 if(view.official){
  browserResultNoticeTimer=setTimeout(()=>el.classList.add('hidden'),2000);
  const verdict=view.verdict;
  const key=record.platform+':'+record.receipt?.id+':'+verdict;
  if(!announcedOfficial.has(key)){
   announcedOfficial.add(key);el.classList.remove('oj-result-animate');void el.offsetWidth;el.classList.add('oj-result-animate');
   if(verdict==='AC'||verdict==='WA')void sampleSoundPlayer.play(verdict.toLowerCase(),{enabled:state.preferences.sampleSoundEnabled,volume:state.preferences.sampleSoundVolume});
  }
 }
}
const cfPollers=new Set();
async function pollCodeforcesTask(row){
 const handle=state.preferences.codeforcesHandle||'';
 if(!/^[A-Za-z0-9_.-]{3,24}$/.test(handle)||!row.receipt||cfPollers.has(row.id))return;
 cfPollers.add(row.id);
 try{
  for(let attempt=0;attempt<24;attempt++){
   if(!watchedBrowserTasks.has(row.id))break;
   if(attempt)await new Promise(resolve=>setTimeout(resolve,5500));
   let current;
   try{current=await native.fastVerdict(row.id,handle);}catch{continue;}
   if(current?.officialVerified){showBrowserResultNotice(current);break;}
  }
 }finally{cfPollers.delete(row.id);}
}
async function reconcileRemoteResults(){
 if(!native?.fastList)return;
 let rows=[];try{rows=await native.fastList();}catch{return;}
 for(const r of rows){
  if(!watchedBrowserTasks.has(r.id))continue;
  if(r.officialVerified){showBrowserResultNotice(r);continue;}
  if(r.receipt&&r.platform==='codeforces')void pollCodeforcesTask(r);
 }
}
async function handleFastReceiptDetected(data){
 if(data?.kind==='official-submit-attempt'||data?.kind==='official-submit-blocked'){
  const el=$('fastStatus');if(el&&fastActiveId===data.id)el.textContent=data.kind==='official-submit-attempt'?'浏览器插件已尝试官网提交，请等待官方 ID；尚未证明服务端接收。':'浏览器插件未能安全提交（'+String(data.reason||'unknown')+'），请在官网页面核对后手动提交。';
  return;
 }
 if(!data?.row)return;
 const row=data.row;
 if(watchedBrowserTasks.has(row.id)){showBrowserResultNotice(row);if(row.receipt&&row.platform==='codeforces'&&!row.officialVerified)void pollCodeforcesTask(row);}
 if(fastActiveId===row.id){
  if(row.receipt){const field=$('fastOfficialUrl');if(field)field.value=row.receipt.url;
   const status=$('fastStatus');if(status)status.textContent='自动识别官方 Submission ID #'+row.receipt.id+' · '+(row.officialVerified?'已核对官方结果':'请核对判题结果');}
  showDetectedRecords(row);renderOfficialVerdictHero(row);
 }
 await refreshFastLedger().catch(()=>{});
}
async function handleFastOJEvent(data){
 if(!data?.fastId)return;
 if(data.kind==='auto-fill'&&data.filled){
  try{await native.fastMarkFilled(data.fastId,true);await refreshFastLedger();}catch{}
 }
 // Submission IDs are handled by the validated main-process detector, not
 // inferred from arbitrary navigation or a submit-form URL here.
 if(data.kind==='navigation'&&fastActiveId===data.fastId){
  const label=$('fastStatus');if(label&&!fastLedgerCache.find(x=>x.id===data.fastId)?.receipt)label.textContent='官网页面已更新，正在识别官方 Submission ID…';
 }
}

// Official submission occurs in an isolated official website window owned by CodeLab.
// No account password, session cookie or CAPTCHA token is transferred to the IDE.
let officialSessionPlatform=null;
let officialLastPage='';
let officialOpenedFile='';
let officialAutoCheckTimer=null;
function rememberOfficialResult(result,platform,link){
 if(!result?.confirmed||!result.id)return;
 state.officialOjRecords=Array.isArray(state.officialOjRecords)?state.officialOjRecords:[];
 const record={id:result.id,platform,verdict:result.verdict,sourceUrl:result.sourceUrl||link,at:Date.now(),file:officialOpenedFile||activeFile()?.name||'',confirmed:true};
 state.officialOjRecords=[record,...state.officialOjRecords.filter(x=>x.id!==record.id||x.platform!==record.platform)].slice(0,40);
 persistSoon();
}
function setOfficialFeedback(message,level='info'){
 const el=$('ojFeedback');if(!el)return;
 el.textContent=message;el.dataset.level=level;
}
async function officialReadResult(){
 const en=lang()==='en';if(!officialSessionPlatform||!native?.ojInspectInApp)return;
 const platform=officialSessionPlatform;
 const link=$('ojRecordLink')?.value.trim()||officialLastPage;
 try{
  let result;
  if(platform==='codeforces'){
   const handle=$('ojCFHandle')?.value.trim()||'';
   if(!link||!handle){setOfficialFeedback(en?'Provide your Codeforces handle and a submission detail link.':'请输入 Codeforces 用户名与官方提交详情链接。','warning');return;}
   result=await native.ojPollCodeforces(handle,link);
  }else{
   if(link&&/^https:\/\//i.test(link)&&link!==officialLastPage){await native.ojNavigate(platform,link);}
   result=await native.ojInspectInApp(platform);
  }
  if(result?.confirmed){
   const text=(en?'Official':'官方')+' '+platform.toUpperCase()+' #'+result.id+' · '+result.verdict;
   setOfficialFeedback(text,'ok');
   $('ojVerdict').textContent=text;
   rememberOfficialResult(result,platform,link);
  }else{setOfficialFeedback(en?'Not verified yet. Open the official submission detail and try again.':'目前无法确认判题结果，请在内嵌官网打开具体提交详情后重试。','warning');}
 }catch(err){setOfficialFeedback((en?'Official status unavailable: ':'官方查询失败：')+err.message,'warning');}
}
async function prepareOfficialSubmission(){return openBrowserSubmission();}

function handleOjOfficialEvent(data){
 if(data?.fastId)void handleFastOJEvent(data);
 if(!data?.platform||data.platform!==officialSessionPlatform)return;
 if(data.kind==='navigation'){
  officialLastPage=data.url;
  const input=$('ojRecordLink');if(input&&/\/(?:submissions?|record)\/\d+(?:\/?$|\?)/.test(new URL(data.url).pathname))input.value=data.url;
  setOfficialFeedback(lang()==='en'?'Official page loaded. If submitted, check the official record URL.':'官方页面已打开。如已提交，请确认提交详情链接并查询判题。');
  if(data.platform==='codeforces'&&input?.value&&$('ojCFHandle')?.value.trim()){clearTimeout(officialAutoCheckTimer);officialAutoCheckTimer=setTimeout(()=>{if($('ojCheckVerdict'))void officialReadResult();},2400);}
 }else if(data.kind==='closed'){setOfficialFeedback(lang()==='en'?'Official window closed.':'官网窗口已关闭。');}
 else if(data.kind==='navigation-error')setOfficialFeedback(data.message||'Official site unavailable','warning');
 else if(data.kind==='verdict'&&data.confirmed){const label='官方 '+data.platform.toUpperCase()+' #'+data.id+'：'+data.verdict;rememberOfficialResult(data,data.platform,data.sourceUrl);$('ojVerdict')&&($('ojVerdict').textContent=label);setOfficialFeedback(label,'ok');}
}
function editorPromptContext(){return {code:activeFile().content,selection:editor.getSelection(),errors:mergedIssues(activeFile()).map(x=>(x.line||'?')+': '+(x.message||x.title||'')).join('\n'),file:activeFile().name,task:currentContestTask()?.task||''};}
function showEditorPrompts(){
 const en=lang()==='en',tools=window.YanpbEditorPrompts;
 showModal(en?'Editable Code Prompts':'代码编辑提示词 · 自定义管理',`<p class="modal-desc">${en?'Create prompts using {code}, {selection}, {errors}, {file}, {task}. Copy to your chosen AI or notes tool; CodeLab never sends code to a remote service.':'支持 {code}、{selection}、{errors}、{file}、{task} 占位符。生成后复制到你选择的工具；CodeLab 不会自动联网发送源码。'}</p>
 <div class="template-modal-layout prompt-manager">
 <div><input id="promptFilter" placeholder="${en?'Search prompts':'搜索提示词'}"><div class="template-items" id="promptList"></div><button id="promptNew" class="button secondary">＋ ${en?'New prompt':'新增提示词'}</button></div>
 <div class="template-editor"><label>${en?'Name':'名称'}<input id="promptTitle" maxlength="80"></label><label>${en?'Category':'分类'}<input id="promptCategory" maxlength="40"></label><label>${en?'Prompt body':'提示词内容'}<textarea id="promptBody" class="prompt-body" spellcheck="false"></textarea></label><div class="modal-actions"><button class="button secondary" id="promptRemove">${en?'Delete':'删除'}</button><button class="button secondary" id="promptSave">${en?'Save':'保存'}</button><button class="button primary" id="promptCopy">${en?'Compose & copy':'生成并复制'}</button></div><label>${en?'Preview (not sent anywhere)':'预览（不会联网发送）'}<textarea id="promptPreview" class="prompt-preview" spellcheck="false" readonly></textarea></label><p id="promptFeedback" class="hint"></p></div></div>`,true);
 let selected=state.editorPrompts[0]?.id||null;
 const fields={title:$('promptTitle'),category:$('promptCategory'),body:$('promptBody')};
 const render=()=>{const box=$('promptList');box.replaceChildren();const q=$('promptFilter').value.trim().toLowerCase();for(const item of state.editorPrompts.filter(x=>(x.title+' '+x.category).toLowerCase().includes(q))){const b=document.createElement('button');b.className='palette-entry'+(selected===item.id?' selected':'');b.textContent=item.title+' · '+item.category;b.onclick=()=>select(item.id);box.append(b);}};
 const select=id=>{selected=id;const item=state.editorPrompts.find(x=>x.id===id);fields.title.value=item?.title||'';fields.category.value=item?.category||'自定义';fields.body.value=item?.body||'';$('promptRemove').disabled=!id;preview();render();};
 const preview=()=>{try{$('promptPreview').value=tools.expand({title:fields.title.value||'Preview',body:fields.body.value||' ',category:fields.category.value},editorPromptContext()).slice(0,80000);}catch{$('promptPreview').value='';}};
 $('promptFilter').oninput=render;fields.body.oninput=preview;fields.title.oninput=preview;
 $('promptNew').onclick=()=>select(null);
 $('promptSave').onclick=()=>{try{state.editorPrompts=tools.upsert(state.editorPrompts,{title:fields.title.value,category:fields.category.value,body:fields.body.value},selected);const saved=state.editorPrompts.find(x=>x.title===fields.title.value.trim()&&x.body===fields.body.value.trim());selected=saved?.id||selected;persistSoon();select(selected);$('promptFeedback').textContent=en?'Saved on this computer':'已在本机保存';}catch(e){$('promptFeedback').textContent=e.message;}};
 $('promptRemove').onclick=()=>{if(!selected||!confirm(en?'Delete prompt?':'确定删除这条提示词？'))return;state.editorPrompts=tools.remove(state.editorPrompts,selected);persistSoon();select(state.editorPrompts[0]?.id||null);};
 $('promptCopy').onclick=async()=>{try{const content=tools.expand({title:fields.title.value||'Prompt',body:fields.body.value,category:fields.category.value},editorPromptContext());$('promptPreview').value=content;
  if(native?.writeClipboard)await native.writeClipboard(content);else if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(content);else{$('promptPreview').focus();$('promptPreview').select();$('promptFeedback').textContent=en?'Select and copy the preview manually':'请选择预览内容手动复制';return;}
  $('promptFeedback').textContent=en?'Copied. No code was uploaded.':'已复制到剪贴板，未上传代码。';
 }catch(err){$('promptFeedback').textContent=err.message;}};
 select(selected);
}

function bind(){
 $$('#minBtn').forEach(b=>b.onclick=()=>native?.windowAction('min'));
 initToolbarMenus();initEditorNavigation();$('maxBtn').onclick=()=>native?.windowAction('max');$('closeBtn').onclick=()=>native?.windowAction('close');$('paletteBtn').onclick=quickPalette;
 if(isMac){const k=$('paletteBtn').querySelector('kbd');if(k)k.textContent='⌘ K';}
 $('contestWorkspaceSwitch').onclick=showContestSwitcher;
 $('restoreLeftBtn').onclick=()=>collapsePanel('left');$('restoreRightBtn').onclick=()=>collapsePanel('right');
 $('modeQuickBtn').onclick=()=>state.competitionMode==='icpc'?openBrowserSubmission():showSubmissionReview();
 $('sceneOjSubmitBtn').onclick=openBrowserSubmission;$('sceneSnippetBtn').onclick=showTemplatePicker;$('sceneNextBtn').onclick=()=>advanceContestTask(1);$('scenePreflightBtn').onclick=()=>{if(canCheckCsp())showSubmissionReview();};$('sceneDebugBtn').onclick=()=>liveBridge?.perform('next');
 $('modeICPC').onclick=()=>setCompetitionMode('icpc');$('modeOI').onclick=()=>setCompetitionMode('oi');$('shortcutsBtn').onclick=showShortcuts;$('versionsBtn').onclick=showVersionHistory;$('traceBtn').onclick=showVariableTrace;$('checkpointBtn').onclick=manualCheckpoint;$('contestOverviewBtn').onclick=showContestOverview;$('contestNextBtn').onclick=()=>advanceContestTask(1);initPanelResize();initTerminalResize();initContextMenu();
 $('themeBtn').onclick=()=>updateTheme(state.theme==='dark'?'light':'dark');$('prefsBtn').onclick=showPreferences;$('localeSwitch').onclick=()=>{state.preferences.language=lang()==='en'?'zh':'en';applyPersonalization();persistSoon();};$('settingsBtn').onclick=showPreferences;$('compilerSettingsLink').onclick=showSettings;$('compilerChip').onclick=showSettings;
 $('templateInsertBtn').onclick=()=>quickTemplateInsert();$('newFileBtn').onclick=newFile;$('sidebarOpenBtn').onclick=openFile;$('fileFilter').oninput=e=>{sidebarFileFilter=e.target.value.trim().toLowerCase();if(state.sidebar==='files')renderFiles();};$('contestCreateBtn').onclick=showContestCreator;$('contestCheckBtn').onclick=showSubmissionReview;$$('[data-nav]').forEach(b=>b.onclick=()=>selectNav(b.dataset.nav));
 $('openBtn').onclick=openFile;$('saveBtn').onclick=()=>saveFile(false);
 $('stdSelect').onchange=e=>{state.std=e.target.value;persistSoon();};$('optSelect').onchange=e=>{state.opt=e.target.value;persistSoon();};
 $('fileTabs').addEventListener('wheel',e=>{const el=e.currentTarget;if(el.scrollWidth<=el.clientWidth)return;e.preventDefault();el.scrollLeft+=e.deltaY||e.deltaX;},{passive:false});
 $('fastOjBtn').onclick=openBrowserSubmission; $('ojSubmitBtn').onclick=openBrowserSubmission; $('runBtn').onclick=()=>run(false);$('morePromptBtn').onclick=showEditorPrompts;$('allCasesBtn').onclick=()=>run(true);$('stopBtn').onclick=stop;
 $('clearBtn').onclick=()=>{lastResult=null;inlineDiagnosticsByFile.delete(activeFile().id);clearInlineDiagnostics();updateProblemCounter();textOutput('已清空控制台');updateResult('READY');};$('collapseBtn').onclick=()=>{const collapsed=$('terminalPane').classList.toggle('is-collapsed');$('terminalResize').setAttribute('aria-expanded',String(!collapsed));editor?.refresh();};
 $$('[data-term]').forEach(b=>b.onclick=()=>terminal(b.dataset.term));
 $$('[data-panel]').forEach(b=>b.onclick=()=>inspect(b.dataset.panel));$('stdin').oninput=e=>{state.stdin=e.target.value;persistSoon();};$('clearInputBtn').onclick=()=>{$('stdin').value='';state.stdin='';persistSoon();};
 $$('[data-timeout]').forEach(b=>b.onclick=()=>{state.timeoutMs=+b.dataset.timeout;$$('[data-timeout]').forEach(x=>x.classList.toggle('active',x===b));persistSoon();});
 $('pasteCompanionBtn').onclick=showJsonImport;$('cphStateBtn').onclick=showCompanion;$('addCaseBtn').onclick=addCase;$('deleteCaseBtn').onclick=deleteCase;$('caseInput').oninput=e=>changeCase('input',e.target.value);$('useCaseInputBtn').onclick=()=>{const c=state.cases.find(x=>x.id===state.activeCase);if(!c)return;state.stdin=c.input;$('stdin').value=c.input;persistSoon();toast(lang()==='en'?'Input copied to STDIN':'已复制到标准输入');};$('caseOutput').oninput=e=>changeCase('expected',e.target.value);
 $('closeModal').onclick=closeModal;$('modalBackdrop').onclick=e=>{if(e.target===$('modalBackdrop'))closeModal();};
 document.addEventListener('wheel',e=>{if(!(e.ctrlKey||e.metaKey)||!e.target.closest('.CodeMirror'))return;e.preventDefault();state.preferences.fontSize=Math.max(10,Math.min(24,(Number(state.preferences.fontSize)||14)+(e.deltaY<0?1:-1)));applyPersonalization();persistSoon();},{passive:false});
 document.addEventListener('keydown',e=>{if(e.defaultPrevented)return;if(!$('modalBackdrop').classList.contains('hidden')&&e.key!=='Escape')return;const mod=e.ctrlKey||e.metaKey;if(mod&&e.key==='Tab'){e.preventDefault();const i=state.files.findIndex(f=>f.id===state.activeId);if(i>=0)switchFile(state.files[(i+(e.shiftKey?-1:1)+state.files.length)%state.files.length].id);}
 else if(mod&&!e.altKey&&e.key==='Enter'){e.preventDefault();if(!$('modalBackdrop').classList.contains('hidden'))return;run(e.shiftKey);}
 else if(mod&&e.key.toLowerCase()==='f'&&!e.shiftKey){e.preventDefault();openEditorSearch();}
 else if(mod&&e.key.toLowerCase()==='g'){e.preventDefault();gotoEditorLine();}
 else if(e.key==='F3'){e.preventDefault();if(!searchActive)openEditorSearch();else searchGoto(searchIndex+(e.shiftKey?-1:1));}
 else if(mod&&(e.code==='Backquote'||e.key==='`')){e.preventDefault();collapsePanel('bottom');}
 else if(mod&&e.key==='1'&&!e.altKey){e.preventDefault();editor.focus();}
 else if(mod&&e.key.toLowerCase()==='p'&&e.shiftKey){e.preventDefault();showPreferences();}
 else if(mod&&e.altKey&&e.key.toLowerCase()==='t'){e.preventDefault();updateTheme(state.theme==='dark'?'light':'dark');}
 else if(mod&&e.altKey&&e.key.toLowerCase()==='p'){e.preventDefault();showEditorPrompts();}
 else if(mod&&e.altKey&&e.key.toLowerCase()==='u'){e.preventDefault();openBrowserSubmission();}
 else if(mod&&e.shiftKey&&e.key.toLowerCase()==='u'){e.preventDefault();openBrowserSubmission();}
 else if(mod&&e.altKey&&e.key==='Enter'){e.preventDefault();openBrowserSubmission();}
 else if(mod&&e.key.toLowerCase()==='k'&&!e.shiftKey){e.preventDefault();quickPalette();}
 else if(mod&&e.key.toLowerCase()==='j'){if(e.target.closest('.CodeMirror'))return;e.preventDefault();showTemplatePicker();}
 else if(mod&&e.key.toLowerCase()==='s'){e.preventDefault();saveFile(e.shiftKey);}
 else if(mod&&e.key.toLowerCase()==='n'){e.preventDefault();if(e.shiftKey)showContestCreator();else newFile();}
 else if(mod&&e.key.toLowerCase()==='o'){e.preventDefault();openFile();}
 else if(e.key==='F5'){e.preventDefault();run(false);}
 else if(e.key==='F7'){e.preventDefault();run(true);}
 else if(e.altKey&&e.key==='1'){e.preventDefault();setCompetitionMode('icpc');}
 else if(e.altKey&&e.key==='2'){e.preventDefault();setCompetitionMode('oi');}
 else if(mod&&e.key.toLowerCase()==='b'&&!e.altKey){e.preventDefault();collapsePanel('left');}
 else if(mod&&e.altKey&&e.key.toLowerCase()==='r'){e.preventDefault();collapsePanel('right');}
 else if(mod&&e.shiftKey&&e.key.toLowerCase()==='k'){e.preventDefault();showShortcuts();}
 else if(e.key==='F11'){e.preventDefault();liveBridge?.startDebug();}
 else if(e.key==='F10'){e.preventDefault();if(liveBridge?.status==='paused')liveBridge.perform('next');else showVariableTrace();}
 else if(e.key==='F12'){e.preventDefault();liveBridge?.perform('continue');}
 else if(mod&&e.key.toLowerCase()==='h'&&!e.shiftKey){e.preventDefault();showVersionHistory();}
 else if(mod&&e.altKey&&e.key.toLowerCase()==='s'){e.preventDefault();manualCheckpoint();}
 else if(mod&&e.altKey&&e.key==='ArrowRight'){e.preventDefault();advanceContestTask(1);}
 else if(mod&&e.altKey&&e.key==='ArrowLeft'){e.preventDefault();advanceContestTask(-1);}
 else if(e.key==='F8'){e.preventDefault();if(canCheckCsp())showSubmissionReview();else toast(lang()==='en'?'CSP submission check is unavailable in ICPC mode':'只有 OI/CSP 模式才能检测提交规范');}
 else if(e.key==='F9'){e.preventDefault();showStress();}
 else if(e.key==='F6'){e.preventDefault();stop();}
 else if(e.key==='Escape'&&!$('modalBackdrop').classList.contains('hidden'))closeModal();
 else if(e.key==='Escape'&&searchActive){e.preventDefault();closeEditorSearch();}});
 if(native){native.onProgress(d=>{$('statusText').textContent=d.message||'正在运行…';const summary=$('stressSummary');if(summary&&busy)summary.textContent=d.message||'';});native.onCommand(c=>({new:newFile,open:openFile,save:()=>saveFile(),saveAs:()=>saveFile(true),run:()=>run(false),samples:()=>run(true),stress:showStress,cancel:stop,cph:showCompanion,browserBridge:showBrowserBridgeConnection,preferences:showPreferences,contestCreate:showContestCreator,contestOpen:openContestWorkspace,contestCheck:showSubmissionReview,ojSubmit:openBrowserSubmission,fastOJ:openBrowserSubmission,promptManager:showEditorPrompts,templateManager:showTemplateManager,templateInsert:showTemplatePicker,contestLifecycle:()=>changeContestLifecycle(contestStatus()==='paused'?'resume':contestStatus()==='ready'?'start':'pause'),contestFinish:()=>changeContestLifecycle('finish'),icpc:()=>setCompetitionMode('icpc'),oi:()=>setCompetitionMode('oi'),trace:showVariableTrace,debugStart:()=>liveBridge?.startDebug(),debugNext:()=>liveBridge?.perform('next'),debugContinue:()=>liveBridge?.perform('continue'),debugStop:()=>liveBridge?.stopDebug(),versions:showVersionHistory,snapshot:manualCheckpoint})[c]?.());}
}
async function init(){
 document.body.dataset.theme=state.theme;$('stdin').value=state.stdin||'';$('stdSelect').value=state.std||'c++17';$('optSelect').value=state.opt||'O2';
 editor=CodeMirror($('editor'),{value:activeFile().content,mode:'text/x-c++src',lineNumbers:true,lineWrapping:false,indentUnit:4,tabSize:4,indentWithTabs:false,smartIndent:true,autoCloseBrackets:true,matchBrackets:true,styleActiveLine:true,autoRefresh:true,foldGutter:false,gutters:['CodeMirror-linenumbers'],extraKeys:editorKeymap()});
 editor.on('change',editorChange);editor.on('change',(cm,change)=>{armCodeCompletion(change);if(searchActive)searchRefresh();});editor.on('cursorActivity',onCursor);$('characterCount').textContent=activeFile().content.length+' 字符';
 liveBridge=window.YanpbLiveDebug.create({editor,activeFile,getCompiler:()=>state.compiler,getStandard:()=>state.std,getDebugInput:()=>state.stdin,setDebugInput:v=>{state.stdin=v;$('stdin').value=v;persistSoon();},onDiagnostics:(id,items)=>{liveDiagnosticsByFile.set(id,items);if(activeFile()?.id===id)renderInlineDiagnostics(activeFile());},onProblemRefresh:()=>{if(state.term==='problems')renderProblems();},showConsole:tab=>terminal(tab),toast});
 $('startInteractiveDebug').onclick=()=>liveBridge.startDebug();
 renderTabs();updateCaseList();inspect('cases');selectNav(state.sidebar==='history'?'files':state.sidebar||'files');terminal(state.term||'output');
 $$('[data-timeout]').forEach(b=>b.classList.toggle('active',Number(b.dataset.timeout)===state.timeoutMs));
 bind();renderContestBadge();if(localContest()&&state.sidebar==='contest')contestSidebar();contestClock=setInterval(updateContestTime,1000);onCursor(editor);renderTabs();applyPersonalization();renderModePanel();renderEditorScene();let sceneDebugStatus=liveBridge?.status||'idle';const sceneTimer=setInterval(()=>{const now=liveBridge?.status||'idle';if(now!==sceneDebugStatus){sceneDebugStatus=now;renderEditorScene();}},350);if(native?.onCompanion){
  native.onCompanion(importCompanionProblem);
  // Recover tasks received while the renderer was reloading.
  try{for(const problem of await native.companionPending?.()||[])importCompanionProblem(problem);}catch(e){toast('读取待导入题目失败：'+e.message);}
}if(native?.onOjOfficialEvent)native.onOjOfficialEvent(handleOjOfficialEvent);if(native?.onFastReceiptDetected)native.onFastReceiptDetected(handleFastReceiptDetected);if(native){void reconcileRemoteResults();setInterval(()=>void reconcileRemoteResults(),30000);}if(state.preferences.cphAutoStart&&native)await toggleReceiver(true);
 if(native){liveBridge.setPerformanceMode(state.preferences.clangdMode);void revisionCheckpoint(activeFile(),lang()==='en'?'Session opened':'打开项目时');try{const p=await native.getPrefs();state.compiler='bundled';compilerChoices=(await native.detectCompilers()).filter(c=>c.bundled);const bundled=compilerChoices.find(c=>c.bundled);if((state.compiler==='auto'||state.compiler==='bundled')&&bundled){$('compilerChip').innerHTML='<span class="tiny-led"></span> '+(isMac?'Apple Clang · Ready':lang()==='en'?'Bundled GCC · Ready':'内置 GCC · 就绪');$('compilerChip').classList.remove('missing');$('statusText').textContent=lang()==='en'?'Zero setup · Offline compiler ready':'免配置 · 离线编译就绪';}else{$('compilerChip').innerHTML='<span class="tiny-led"></span> '+(lang()==='en'?'Compiler missing':'未找到编译器');$('compilerChip').classList.add('missing');toast(isMac?'Apple Clang 不可用，请在终端运行 xcode-select --install':'内置 GCC 不可用，请确认安装包完整');}}catch(e){toast('编译器检测失败：'+e.message);}}
 else{$('compilerChip').innerHTML='<span class="tiny-led"></span> 桌面模式可编译';$('statusText').textContent=lang()==='en'?'UI preview · Run requires desktop app':'界面预览 · 编译需要 Electron 客户端';}
}
window.addEventListener('DOMContentLoaded',init);
window.addEventListener('beforeunload',()=>{clearTimeout(savingTimer);saveState();});
})();
