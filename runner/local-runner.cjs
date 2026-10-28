'use strict';
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const {resolveBundledCompiler}=require('./winlibs-path.cjs');
const mac=require('./mac-toolchain.cjs');
const aliasedBundledCompilers=new Set();

// Bundled WinLibs resides outside app.asar under Electron resources.
// In source/dev builds it lives next to package.json.
const TOOLCHAIN_DIR = path.join('toolchain','mingw64','bin');
function bundledCompilerCandidates() {
  if(process.platform !== 'win32')return [];
  const roots=[process.resourcesPath, path.join(__dirname,'..')].filter(Boolean);
  return [...new Set(roots.map(root=>path.join(root,TOOLCHAIN_DIR,'g++.exe')))];
}
function isBundledCompiler(candidate) {
  if(process.platform !== 'win32' || !candidate)return false;
  return [...bundledCompilerCandidates(),...aliasedBundledCompilers].some(x=>path.win32.normalize(x).toLowerCase()===path.win32.normalize(candidate).toLowerCase());
}
function toolchainEnvironment(binDir) {
  if(process.platform !== 'win32' || !binDir)return process.env;
  const env={...process.env};
  const old=Object.entries(env).find(([k])=>k.toLowerCase()==='path')?.[1]||'';
  for(const k of Object.keys(env))if(k.toLowerCase()==='path')delete env[k];
  env.Path=binDir+';'+old;
  return env;
}
function childEnvironment(compiler) {
  if(process.platform!=='win32' || !path.isAbsolute(compiler))return process.env;
  return toolchainEnvironment(path.dirname(compiler));
}


const MAX_SOURCE = 300 * 1024;
const MAX_STDIN = 256 * 1024;
const MAX_OUTPUT = 1024 * 1024;
const COMMON_WINDOWS = [
  'C:\\msys64\\ucrt64\\bin\\g++.exe',
  'C:\\msys64\\mingw64\\bin\\g++.exe',
  'C:\\Program Files (x86)\\mingw64\\bin\\g++.exe',
  'C:\\mingw64\\bin\\g++.exe',
  'C:\\Program Files\\LLVM\\bin\\clang++.exe',
  'C:\\TDM-GCC-64\\bin\\g++.exe'
];

function cleanedStandard(x) { return ['c++11','c++14','c++17','c++20','c++23'].includes(x) ? x : 'c++17'; }
function cleanedOpt(x) { return ['O0','O1','O2','O3','Os'].includes(x) ? x : 'O2'; }
function cleanedTimeout(x) { return Math.min(15000,Math.max(250,Number(x) || 2000)); }
function normalizedOutput(s) { return String(s).replace(/\r\n/g,'\n').trimEnd(); }
function compareOutput(actual, expected, mode='trim') {
  const normalize=s=>String(s).replace(/\r\n?/g,'\n');
  if(mode==='strict')return normalize(actual)===normalize(expected);
  return normalize(actual).trimEnd()===normalize(expected).trimEnd();
}
function validateCode(code, label='源程序') {
  if(typeof code !== 'string' || !code.trim() || Buffer.byteLength(code,'utf8') > MAX_SOURCE) {
    throw new Error(label + '为空，或超过 300 KB 大小限制');
  }
}

// Launch by argv, never by a shell; compilation flags and file locations are fixed/validated.
function launch(cmd, args, options={}) {
  const {stdin='',cwd=undefined,timeout=2000,onSpawn=()=>{},maxOutput=MAX_OUTPUT,env=process.env} = options;
  return new Promise(resolve=>{
    let child, settled=false, stdout='', stderr='', limited=false, timedOut=false, cancelled=false, start=process.hrtime.bigint(), timer;
    let seenOut=0;
    try {
      child=spawn(cmd,args,{cwd,env,windowsHide:true,detached:process.platform!=='win32',shell:false,stdio:['pipe','pipe','pipe']});
    } catch(e) { return resolve({code:null,error:e.message,stdout:'',stderr:'',timeMs:0}); }
    function kill() {
      if (!child || child.killed) return;
      if (process.platform==='win32') {
        try { const killer=spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'}); killer.on('error',()=>child.kill()); } catch { child.kill(); }
      } else {
        try { process.kill(-child.pid,'SIGKILL'); } catch { try { child.kill('SIGKILL'); } catch {} }
      }
    }
    function push(data,target) {
      const b=Buffer.byteLength(data,'utf8'); seenOut+=b;
      if(seenOut>maxOutput) {limited=true; kill(); return;}
      if(target==='stdout') stdout+=data; else stderr+=data;
    }
    child.stdout.on('data',b=>push(b.toString('utf8'),'stdout'));
    child.stderr.on('data',b=>push(b.toString('utf8'),'stderr'));
    child.stdin.on('error',()=>{});
    child.once('error',e=>{ if(!settled){settled=true;clearTimeout(timer);resolve({code:null,error:e.message,stdout,stderr,timeMs:elapsed()});} });
    const elapsed=()=>Math.round(Number(process.hrtime.bigint()-start)/1e6);
    timer=setTimeout(()=>{ timedOut=true; kill(); },timeout);
    const cancel=()=>{cancelled=true;kill();};
    onSpawn(cancel);
    if(stdin) child.stdin.end(stdin); else child.stdin.end();
    child.once('close',(code,signal)=>{
      if(settled)return; settled=true; clearTimeout(timer);
      resolve({code,signal,stdout,stderr,timeMs:elapsed(),timedOut,limited,cancelled});
    });
  });
}

async function compilerPathForUse(candidate) {
  if(process.platform!=='win32' || !isBundledCompiler(candidate))return candidate;
  const usable=await resolveBundledCompiler(candidate);
  if(usable!==candidate)aliasedBundledCompilers.add(usable);
  return usable;
}

async function probe(candidate) {
  try {
    const r=await launch(candidate,['--version'],{timeout:5000,maxOutput:8192,env:childEnvironment(candidate)});
    if(r.code===0) return {path:candidate,name:isBundledCompiler(candidate)?'内置 GCC · 免配置':path.basename(candidate),bundled:isBundledCompiler(candidate),version:(r.stdout||r.stderr).split('\n')[0].slice(0,160)};
  } catch {}
  return null;
}
async function detectCompilers(preferred='') {
  if(process.platform==='darwin'){
    try{const compiler=mac.findMacTool('clang++');const info=await probe(compiler);return info?[{...info,name:'Apple Clang · Xcode CLT',bundled:true,source:'apple-clt'}]:[];}catch{return [];}
  }
  const candidates=process.platform==='win32'?[...bundledCompilerCandidates()]:[...bundledCompilerCandidates(),preferred,'g++','clang++'];
  const out=[];
  for(const c of new Set(candidates.filter(Boolean))) {
    let safe;
    try {safe=await compilerPathForUse(c);} catch(err){
      // --version can succeed from a space-containing path while linking fails.
      // Never advertise such a compiler as usable if the junction was not made.
      continue;
    }
    const info=await probe(safe);
    if(info)out.push(info);
  }
  return process.platform==='win32'?out.filter(c=>c.bundled):out;
}

/** Windows production policy: no PATH lookup and no arbitrary compiler path. */
function assertBundledRequest(requested='auto',options={}) {
  const strict=options.strict===true || (options.strict!==false && process.platform==='win32');
  if(strict && requested!==undefined && requested!==null && !['auto','bundled',''].includes(requested)) {
    throw Error('仅支持安装包自带的 GCC。系统 GCC、Clang 和自定义路径均已禁用。');
  }
  return strict?'bundled':requested||'auto';
}
async function chooseCompiler(mode='auto') {
  mode=assertBundledRequest(mode);
  if(mode==='bundled'){const found=(await detectCompilers()).find(c=>c.bundled);if(!found)throw Error(process.platform==='darwin'?'macOS Apple Clang 不可用。请在终端执行 xcode-select --install 安装开发工具。':'内置 GCC 未找到或无法运行，请重新安装完整免配置版本');return found.path;}
  if(mode==='system'){const found=(await detectCompilers()).find(c=>!c.bundled);if(!found)throw Error('系统编译器不可用，请安装 g++ 或选择内置 GCC');return found.path;}
  const found=await detectCompilers();
  if(found.length)return found[0].path;
  throw Error('没有找到可用的 C++ 编译器：免配置安装包应内置 GCC。请重新安装完整版本。');
}
function jobContext() {
  const running = new Set();
  return {
    cancelled:false,
    running,
    onSpawn(fn){running.add(fn);},
    cancel(){this.cancelled=true;for(const fn of running)fn();},
    check(){if(this.cancelled)throw new Error('用户已终止任务');}
  };
}
async function withinJob(cmd,args,opts,job) {
  job.check();
  const r=await launch(cmd,args,{...opts,onSpawn:(fn)=>job.onSpawn(fn)});
  job.check();
  return r;
}
async function compile(source, binary, code, options, job) {
  validateCode(code);
  await fs.writeFile(source, code, 'utf8');
  const std=cleanedStandard(options.standard), opt=cleanedOpt(options.optimization);
  const policy=assertBundledRequest(options.compiler);
  const requested=!policy||['auto','bundled','system'].includes(policy) ? await chooseCompiler(policy||'auto') : policy;
  const compiler=await compilerPathForUse(requested);
  const args=['-std='+std,'-'+opt,'-Wall','-Wextra','-pipe',...(process.platform==='darwin'?mac.macCompileFlags():[]),source,'-o',binary];
  if(process.platform==='win32')args.splice(args.length-2,0,'-static-libgcc','-static-libstdc++');
  job.compilerBin=path.isAbsolute(compiler)?path.dirname(compiler):null;
  const r=await withinJob(compiler,args,{timeout:45000,maxOutput:256*1024,env:childEnvironment(compiler)},job);
  if(r.error)throw new Error('无法启动 C++ 编译器：'+r.error+(process.platform==='darwin'?'。请检查 Xcode Command Line Tools。':'。请检查内置工具链是否完整。'));
  return { ...r, args };
}
async function runBinary(binary,stdin,timeout,job,args=[]) {
  if(Buffer.byteLength(stdin||'', 'utf8') > MAX_STDIN)throw Error('标准输入超出 256 KB 限制');
  return withinJob(binary,args.map(String),{stdin,timeout:cleanedTimeout(timeout),maxOutput:MAX_OUTPUT,env:toolchainEnvironment(job.compilerBin)},job);
}
function runState(r) {
  if(r.timedOut) return 'TLE';
  if(r.limited) return 'OLE';
  if(r.error||r.code!==0) return 'RE';
  return 'OK';
}
function cleanPayload(p) {
  if(!p||typeof p!=='object')throw Error('缺少任务参数');
  return {
    code:p.code, standard:cleanedStandard(p.standard), optimization:cleanedOpt(p.optimization),
    compiler:assertBundledRequest(typeof p.compiler==='string'&&p.compiler.length<800?p.compiler:'auto'),
    timeoutMs:cleanedTimeout(p.timeoutMs), stdin:String(p.stdin||''),
    cases:Array.isArray(p.cases)?p.cases.slice(0,30):[], compareMode:p.compareMode==='strict'?'strict':'trim',
  };
}
async function execute(p,job=jobContext(),onProgress=()=>{}) {
  const o=cleanPayload(p); validateCode(o.code);
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'yanpb-codelab-'));
  const source=path.join(dir,'main.cpp'), binary=path.join(dir,process.platform==='win32'?'program.exe':'program');
  try {
    onProgress({step:'compile',message:'正在使用本机 '+path.basename(o.compiler)+' 编译…'});
    const build=await compile(source,binary,o.code,o,job);
    if(build.code!==0)return {status:build.timedOut?'TLE':'CE',stage:'compile',stderr:build.stderr,stdout:build.stdout,compileMs:build.timeMs,compileArgs:build.args};
    const inputs=o.cases.length?o.cases:[{name:'自定义输入',input:o.stdin}];
    const results=[];
    for(let i=0;i<inputs.length;i++) {
      const tc=inputs[i];
      const stdin=String(tc.input||'');
      onProgress({step:'run',message:`正在运行 ${i+1}/${inputs.length}…`});
      const r=await runBinary(binary,stdin,o.timeoutMs,job);
      let status=runState(r);
      if(status==='OK' && typeof tc.expected==='string' && !compareOutput(r.stdout,tc.expected,o.compareMode))status='WA';
      results.push({name:String(tc.name||'样例 '+(i+1)).slice(0,70),status,stdout:r.stdout,stderr:r.stderr,timeMs:r.timeMs,expected:tc.expected??null,input:stdin,exitCode:r.code});
    }
    const status=results.every(r=>r.status==='OK')?'OK':(results.find(r=>r.status!=='OK')?.status||'ERROR');
    return {status,stage:'run',results,compileMs:build.timeMs,compileInfo:build.stderr};
  } finally { await fs.rm(dir,{recursive:true,force:true}).catch(()=>{}); }
}
async function stress(p,job=jobContext(),onProgress=()=>{}) {
  if(!p||typeof p!=='object')throw Error('参数错误');
  validateCode(p.generator,'数据生成器'); validateCode(p.code,'待测程序'); validateCode(p.brute,'正确程序');
  const compiler=assertBundledRequest((typeof p.compiler==='string'&&p.compiler.length<800)?p.compiler:'auto');
  const options={compiler,standard:cleanedStandard(p.standard),optimization:cleanedOpt(p.optimization)};
  const iterations=Math.min(200,Math.max(1,Math.floor(Number(p.iterations)||30)));
  const timeout=cleanedTimeout(p.timeoutMs);
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'yanpb-stress-'));
  const suffix=process.platform==='win32'?'.exe':'';
  try {
    const bins={};
    for(const [key,code] of [['generator',p.generator],['fast',p.code],['brute',p.brute]]) {
      onProgress({step:'compile',message:'编译 '+({generator:'数据生成器',fast:'待测程序',brute:'标准程序'}[key])+'…'});
      const source=path.join(dir,key+'.cpp'),binary=path.join(dir,key+suffix);
      const r=await compile(source,binary,code,options,job);
      if(r.code!==0)return {status:'CE',target:key,stderr:r.stderr,compileMs:r.timeMs};
      bins[key]=binary;
    }
    for(let i=0;i<iterations;i++) {
      job.check();
      onProgress({step:'stress',count:i+1,total:iterations,message:`对拍进行中 ${i+1}/${iterations} · seed=${i+1}`});
      const gen=await runBinary(bins.generator,'',timeout,job,[i+1]);
      if(runState(gen)!=='OK')return {status:'GEN_ERROR',round:i+1,generator:gen};
      const fast=await runBinary(bins.fast,gen.stdout,timeout,job);
      const brute=await runBinary(bins.brute,gen.stdout,timeout,job);
      if(runState(fast)!=='OK'||runState(brute)!=='OK'||normalizedOutput(fast.stdout)!==normalizedOutput(brute.stdout)) {
        return {status:'MISMATCH',round:i+1,input:gen.stdout,fast:{...fast,status:runState(fast)},brute:{...brute,status:runState(brute)}};
      }
    }
    return {status:'PASS',rounds:iterations};
  } finally {await fs.rm(dir,{recursive:true,force:true}).catch(()=>{});}
}
module.exports={assertBundledRequest,compareOutput,compilerPathForUse,launch,probe,detectCompilers,bundledCompilerCandidates,isBundledCompiler,toolchainEnvironment,chooseCompiler,jobContext,execute,stress,normalizedOutput,cleanedStandard,cleanedOpt,cleanedTimeout,runState};
