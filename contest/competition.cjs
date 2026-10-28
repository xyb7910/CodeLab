'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const runner=require('../runner/local-runner.cjs');
const lifecycle=require('./lifecycle.cjs');
const mac=require('../runner/mac-toolchain.cjs');

const PRESETS=Object.freeze({
 codeforces:{label:'Codeforces',tasks:['A','B','C','D','E','F'],directory:'flat',io:'stdio',duration:120},
 atcoder:{label:'AtCoder',tasks:['A','B','C','D','E','F','G'],directory:'flat',io:'stdio',duration:100},
 luogu:{label:'洛谷 / Luogu',tasks:['A','B','C','D'],directory:'flat',io:'stdio',duration:180},
 icpc:{label:'ICPC / CCPC',tasks:['A','B','C','D','E','F','G','H'],directory:'flat',io:'stdio',duration:300},
 cspj:{label:'CSP-J 复赛',tasks:['task1','task2','task3','task4'],directory:'nested',io:'file',duration:210},
 csps:{label:'CSP-S 复赛',tasks:['task1','task2','task3','task4'],directory:'nested',io:'file',duration:240},
 custom:{label:'自定义 / Custom',tasks:['A','B','C','D'],directory:'flat',io:'stdio',duration:180}
});
function checkSegment(s,field='名称'){
 if(typeof s!=='string'||!s.length||s.length>64||!/^[-a-zA-Z0-9_]+$/.test(s)||s==='.'||s==='..')throw Error(field+'仅允许英文字母、数字、下划线和短横线，长度 1~64');
 if(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(s))throw Error(field+'是 Windows 保留名称');
 return s;
}
function validateOptions(raw){
 if(!raw||typeof raw!=='object')throw Error('缺少比赛参数');
 const platform=Object.hasOwn(PRESETS,raw.platform)?raw.platform:'custom';
 const preset=PRESETS[platform];
 const contestName=checkSegment(String(raw.contestName||''),'比赛文件夹');
 const tasks=(typeof raw.tasks==='string'?raw.tasks.split(/[\s,，;；]+/):Array.isArray(raw.tasks)?raw.tasks:[]).filter(Boolean);
 if(tasks.length<1||tasks.length>20)throw Error('比赛题目数量应为 1~20');
 tasks.forEach((x,i)=>checkSegment(x,'题号 '+(i+1)));
 if(new Set(tasks.map(x=>x.toLowerCase())).size!==tasks.length)throw Error('题号不得重复（不区分大小写）');
 const exam=raw.exam===true||platform==='cspj'||platform==='csps';
 const submissionMethod=exam&&raw.submissionMethod==='upload'?'upload':'folder';
 const directory=exam?(submissionMethod==='upload'?'flat':'nested'):raw.directory==='nested'?'nested':'flat';
 const io=exam?'file':raw.io==='file'?'file':'stdio';
 const duration=Math.max(1,Math.min(480,Number.isFinite(+raw.duration)?Math.round(+raw.duration):preset.duration));
 const candidateId=exam&&submissionMethod==='folder'?checkSegment(String(raw.candidateId||''),'考号') : '';
 const std=['c++11','c++14','c++17','c++20'].includes(raw.standard)?raw.standard:'c++17';
 const limit=Math.max(250,Math.min(15000,Math.round(+raw.timeLimit||2000)));
 const maxSourceBytes=Math.min(1024*1024,Math.max(2048,Math.round(+raw.maxSourceBytes||1024*1024)));
 const strict=exam?true:raw.strict===true;
 // CSP-style files must be lowercase, but allow synthetic task names chosen by teachers.
 if(exam&&tasks.some(x=>x!==x.toLowerCase()))throw Error('复赛模拟题目文件夹必须使用小写名称');
 return {platform,contestName,tasks,exam,submissionMethod,directory,io,duration,candidateId,standard:std,timeLimit:limit,maxSourceBytes,strict};
}
function sourceTemplate(task,config){
 if(config.io==='file') return `#include <bits/stdc++.h>\nusing namespace std;\nusing i64 = long long;\n\nint main() {\n    freopen("${task}.in", "r", stdin);\n    freopen("${task}.out", "w", stdout);\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    // TODO: ${task}\n    return 0;\n}\n`;
 return `#include <bits/stdc++.h>\nusing namespace std;\nusing i64 = long long;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    // TODO: ${task}\n    return 0;\n}\n`;
}
async function createContest(baseDir,raw){
 const c=validateOptions(raw);
 if(typeof baseDir!=='string'||!path.isAbsolute(baseDir))throw Error('比赛存放位置无效');
 const folder=path.join(baseDir,c.contestName);
 const submissionDir=c.exam&&c.submissionMethod==='folder'?path.join(folder,c.candidateId):folder;
 // mkdir without recursive prevents silently overwriting existing projects
 await fs.mkdir(folder);
 try{
  if(c.exam&&c.submissionMethod==='folder')await fs.mkdir(submissionDir);
  const files=[];
  for(const task of c.tasks){
   const taskDir=c.directory==='nested'?path.join(submissionDir,task):submissionDir;
   if(c.directory==='nested')await fs.mkdir(taskDir);
   const source=path.join(taskDir,task+'.cpp');
   await fs.writeFile(source,sourceTemplate(task,c),{encoding:'utf8',flag:'wx'});
   files.push({task,source,relative:path.relative(submissionDir,source),input:task+'.in',output:task+'.out'});
  }
  const manifest={format:'yanpb-contest-v1',...c,createdAt:new Date().toISOString(),startedAt:null,status:'ready',elapsedBeforeMs:0,folder,submissionDir,files};
  await fs.writeFile(path.join(folder,'.yanpb-contest.json'),JSON.stringify(manifest,null,2),{flag:'wx',encoding:'utf8'});
  return manifest;
 }catch(err){await fs.rm(folder,{recursive:true,force:true}).catch(()=>{});throw err;}
}
async function openContest(folder){
 const manifestPath=path.join(folder,'.yanpb-contest.json');
 const m=JSON.parse(await fs.readFile(manifestPath,'utf8'));
 if(m.format!=='yanpb-contest-v1')throw Error('不是 Yanpb 比赛项目');
 const opts=validateOptions(m);
 const canonical=path.resolve(folder);
 if(path.resolve(m.folder)!==canonical)throw Error('比赛项目移动后请在原目录打开，避免读取错误路径');
 if(m.files.length!==opts.tasks.length)throw Error('比赛文件清单已损坏');
 const expectedRoot=opts.exam&&opts.submissionMethod==='folder'?path.join(canonical,opts.candidateId):canonical;
 for(let i=0;i<m.files.length;i++){
  const task=opts.tasks[i],expected=path.join(opts.directory==='nested'?path.join(expectedRoot,task):expectedRoot,task+'.cpp');
  if(m.files[i].source!==expected||m.files[i].task!==task)throw Error('非法比赛文件路径');
 }
 return lifecycle.normalize(m);
}
async function changeContestStatus(folder,event){
 const m=await openContest(folder);
 const next=lifecycle.transition(m,event);
 const dest=path.join(folder,'.yanpb-contest.json');
 const temp=dest+'.new-'+process.pid+'-'+Date.now();
 try {await fs.writeFile(temp,JSON.stringify(next,null,2),'utf8');await fs.rename(temp,dest);}
 finally{await fs.rm(temp,{force:true}).catch(()=>{});}
 return next;
}
function assertCspContest(manifest){if(!['cspj','csps'].includes(manifest.platform)||!manifest.exam)throw Error('Submission preflight is available only for CSP-J/S contests');}
function removeComments(code){
 // Strip normal C++ comments, while preserving strings and char literals.
 let out='',i=0,mode='code';
 while(i<code.length){const c=code[i],n=code[i+1];
  if(mode==='code'){
   if(c==='"'||c==="'"){out+=c;mode=c;i++;continue;}
   if(c==='/'&&n==='/'){mode='line';out+='  ';i+=2;continue;}
   if(c==='/'&&n==='*'){mode='block';out+='  ';i+=2;continue;}
   out+=c;i++;continue;
  }
  if(mode==='line'){if(c==='\n'){out+='\n';mode='code';}else out+=' ';i++;continue;}
  if(mode==='block'){if(c==='*'&&n==='/'){out+='  ';i+=2;mode='code';}else{out+=c==='\n'?'\n':' ';i++;}continue;}
  if(c==='\\'){out+=code.slice(i,i+2);i+=2;continue;}
  out+=c;i++;if(c===mode)mode='code';
 }
 return out;
}
function checkCode(code,task,config){
 const checks=[];const add=(id,level,ok,detail)=>checks.push({id,level,ok,detail});
 add('source-not-empty','error',/\bmain\s*\(/.test(removeComments(code)), '存在 main 入口函数');
 add('unfinished-template','warning',!/(?:\/\/|\/\*)\s*TODO\s*:/.test(code),'无待完成的 TODO 代码标记');
 add('source-size','error',Buffer.byteLength(code,'utf8')<=config.maxSourceBytes,'源程序未超过 '+config.maxSourceBytes+' 字节');
 if(config.io==='file'){
  const clean=removeComments(code);
  const inputRE=new RegExp(`\\bfreopen\\s*\\(\\s*"${task}\\.in"\\s*,\\s*"r"\\s*,\\s*stdin\\s*\\)`);
  const outputRE=new RegExp(`\\bfreopen\\s*\\(\\s*"${task}\\.out"\\s*,\\s*"w"\\s*,\\s*stdout\\s*\\)`);
  const inputStream=new RegExp(`\\b(?:ifstream|fstream)\\s+\\w+\\s*\\(\\s*"${task}\\.in"`) ;
  const outputStream=new RegExp(`\\b(?:ofstream|fstream)\\s+\\w+\\s*\\(\\s*"${task}\\.out"`);
  const inputFile=new RegExp(`\\bfopen\\s*\\(\\s*"${task}\\.in"\\s*,\\s*"r`);
  const outputFile=new RegExp(`\\bfopen\\s*\\(\\s*"${task}\\.out"\\s*,\\s*"w`);
  add('file-input','error',inputRE.test(clean)||inputStream.test(clean)||inputFile.test(clean),`从 ${task}.in 读取文件（freopen / ifstream / fopen）`);
  add('file-output','error',outputRE.test(clean)||outputStream.test(clean)||outputFile.test(clean),`向 ${task}.out 写入文件（freopen / ofstream / fopen）`);
  add('path-absolute','warning',!/\bfreopen\s*\(\s*"(?:[A-Za-z]:|\/|\\\\)/.test(clean),'文件输入输出不使用绝对路径');
 }
 add('windows-portability','warning',!/\b__int64\b|%I64d|#\s*include\s*<windows\.h>/i.test(code),'未发现常见 Windows 专有写法');
 return checks;
}
function inside(root,file){const rel=path.relative(root,file);return rel&&!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel);}
async function auditSubmission(manifest){
 const m=await openContest(manifest.folder),root=m.submissionDir;
 assertCspContest(m);
 const reports=[];
 for(const f of m.files){
  const issues=[];let code='',stat=null;
  try{
   const lst=await fs.lstat(f.source);
   if(lst.isSymbolicLink()||!lst.isFile())throw Error('源文件不是普通文件');
   stat=await fs.stat(f.source);code=await fs.readFile(f.source,'utf8');
  }catch(e){issues.push({id:'missing-source',level:'error',ok:false,detail:'找不到有效源文件：'+f.relative});}
  const checks=stat?checkCode(code,f.task,m):[];
  const requiredDir=path.dirname(f.source);let unexpected=[];
  if(stat){
   const actualNames=await fs.readdir(requiredDir);
   checks.unshift({id:'filename-case',level:'error',ok:actualNames.includes(f.task+'.cpp'),detail:'文件名与大小写严格匹配：'+f.task+'.cpp'});
  }
  if(m.directory==='nested'){
   const names=await fs.readdir(root);
   checks.unshift({id:'task-directory-case',level:'error',ok:names.includes(f.task),detail:'题目子文件夹名字及大小写正确：'+f.task});
  }
  const candidateNames=m.exam&&m.submissionMethod==='folder'?await fs.readdir(m.folder):[];
  if(m.exam&&m.submissionMethod==='folder')checks.unshift({id:'candidate-directory-case',level:'error',ok:candidateNames.includes(m.candidateId),detail:'考号文件夹名称严格匹配：'+m.candidateId});
  try{const entries=await fs.readdir(requiredDir,{withFileTypes:true});unexpected=entries.filter(e=>e.name!==f.task+'.cpp').map(e=>e.name);}catch{}
  if(m.exam&&m.submissionMethod==='folder')issues.push({id:'extra-files',level:'warning',ok:unexpected.length===0,detail:unexpected.length?'提交目录存在额外文件：'+unexpected.join(', '):'题目目录仅包含源代码'});
  reports.push({task:f.task,source:f.source,relative:f.relative,size:stat?.size||0,checks:[...issues,...checks],code});
 }
 const dirMode=m.exam&&m.submissionMethod==='folder';
 const rootEntries=dirMode?await fs.readdir(root):[];
 const extraRoot=dirMode?rootEntries.filter(x=>!m.tasks.includes(x)):[];
 return {reports,extraRoot,passed:reports.every(r=>r.checks.filter(x=>x.level==='error').every(x=>x.ok)),manifest:m};
}
async function runFileSample(binary,task,sample,timeout,job,compilerBin,compareMode){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'yanpb-csp-case-'));
 try{
  const input=String(sample.input||'');if(Buffer.byteLength(input)>256*1024)throw Error('样例输入超过 256KB');
  await fs.writeFile(path.join(dir,task+'.in'),input);
  job.check();
  const r=await runner.launch(binary,[],{cwd:dir,timeout,maxOutput:1024*1024,env:runner.toolchainEnvironment(compilerBin),onSpawn:fn=>job.onSpawn(fn)});
  job.check();
  let output=null,oversize=false;
  try{const st=await fs.stat(path.join(dir,task+'.out'));oversize=st.size>1024*1024;
   if(!oversize)output=await fs.readFile(path.join(dir,task+'.out'),'utf8');
  }catch(e){if(e.code!=='ENOENT')throw e;}
  const status=r.timedOut?'TLE':r.limited||oversize?'OLE':r.error||r.code!==0?'RE':output===null?'NO_OUTPUT':typeof sample.expected==='string'&&!runner.compareOutput(output,sample.expected,compareMode||'trim')?'WA':'OK';
  return {status,name:String(sample.name||'Sample'),input,expected:sample.expected??null,output,stdout:r.stdout,stderr:r.stderr,timeMs:r.timeMs};
 }finally{await fs.rm(dir,{recursive:true,force:true}).catch(()=>{});}
}
async function verifySubmission(manifest,taskName,cases=[],options={},job=runner.jobContext(),progress=()=>{}){
 const audit=await auditSubmission(manifest);
 const item=audit.reports.find(x=>x.task===taskName);
 if(!item)throw Error('题目不属于当前比赛');
 if(!item.code)return {status:'MISSING',audit:item,results:[]};
 if(!Array.isArray(cases)||cases.length>30)throw Error('样例数量超限');
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'yanpb-csp-compile-'));
 const policy=runner.assertBundledRequest(options.compiler);
 const requested=!policy||['auto','bundled','system'].includes(policy)?await runner.chooseCompiler(policy||'auto'):policy;
 const compiler=await runner.compilerPathForUse(requested);
 const compilerBin=path.isAbsolute(compiler)?path.dirname(compiler):null;
 const executable=path.join(temp,process.platform==='win32'?'submission.exe':'submission');
 try{
  const source=path.join(temp,taskName+'.cpp');await fs.writeFile(source,item.code,'utf8');
  const args=['-std='+mStd(audit.manifest.standard),'-O2','-Wall','-Wextra',...(process.platform==='darwin'?mac.macCompileFlags():[]),source,'-o',executable];
  if(process.platform==='win32')args.splice(args.length-2,0,'-static-libgcc','-static-libstdc++');
  progress({step:'compile',message:`${taskName}: compiling submission`});
  const build=await runner.launch(compiler,args,{cwd:temp,timeout:45000,maxOutput:262144,env:runner.childEnvironment?runner.childEnvironment(compiler):runner.toolchainEnvironment(compilerBin),onSpawn:fn=>job.onSpawn(fn)});
  job.check();
  if(build.code!==0)return {status:'CE',audit:item,compiler:build.stderr,results:[],compileMs:build.timeMs};
  if(!cases.length)return {status:'COMPILED',audit:item,compiler:build.stderr,results:[],compileMs:build.timeMs};
  const results=[];
  for(let i=0;i<cases.length;i++){
   progress({step:'sample',message:`${taskName} · ${i+1}/${cases.length}`});
   const sample=cases[i];if(audit.manifest.io==='file')results.push(await runFileSample(executable,taskName,sample,audit.manifest.timeLimit,job,compilerBin,options.compareMode));
   else {const r=await runner.launch(executable,[],{stdin:String(sample.input||''),cwd:temp,timeout:audit.manifest.timeLimit,maxOutput:1024*1024,env:runner.toolchainEnvironment(compilerBin),onSpawn:fn=>job.onSpawn(fn)});job.check();const status=r.timedOut?'TLE':r.limited?'OLE':r.error||r.code!==0?'RE':typeof sample.expected==='string'&&!runner.compareOutput(r.stdout,sample.expected,options.compareMode||'trim')?'WA':'OK';results.push({status,name:sample.name||'Sample',output:r.stdout,timeMs:r.timeMs,expected:sample.expected??null});}
  }
  return {status:results.find(x=>x.status!=='OK')?.status||'OK',audit:item,compiler:build.stderr,results,compileMs:build.timeMs};
 }finally{await fs.rm(temp,{recursive:true,force:true}).catch(()=>{});}
}
function mStd(std){return ['c++11','c++14','c++17','c++20'].includes(std)?std:'c++17';}
module.exports={lifecycle,changeContestStatus,assertCspContest,PRESETS,checkSegment,validateOptions,createContest,openContest,checkCode,auditSubmission,verifySubmission,sourceTemplate,removeComments};
