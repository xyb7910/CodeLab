'use strict';
const fs=require('node:fs/promises');const os=require('node:os');const path=require('node:path');
const runner=require('../runner/local-runner.cjs');
const START='===YANPB_STEP_BEGIN:',END='===YANPB_STEP_END===';
function gdbPath(compiler){return path.join(path.dirname(compiler),process.platform==='win32'?'gdb.exe':'gdb');}
function safeGdbString(v){return String(v).replace(/\\/g,'/').replace(/"/g,'\\"').replace(/\n/g,'');}
function buildScript(limit=80){const steps=Math.min(200,Math.max(1,Number(limit)||80));return [
 'set pagination off','set confirm off','set print elements 12','set print pretty off','set logging enabled off',
 'set height 0','break main','run < stdin.txt','set $yanpb_step=0',
 `while $yanpb_step < ${steps}`,
 `printf "${START}%d===\\n", $yanpb_step`,
 'frame','info locals',`printf "${END}\\n"`,'next','set $yanpb_step=$yanpb_step+1','end','quit'
 ].join('\n')+'\n';}
function parseTrace(log,limit=80){const snapshots=[];const regex=/===YANPB_STEP_BEGIN:(\d+)===\r?\n([\s\S]*?)===YANPB_STEP_END===/g;let match;
 while((match=regex.exec(log))!==null&&snapshots.length<limit){const raw=match[2].slice(0,18000);const loc=raw.match(/(?:at\s+[^\r\n]*?\.cpp:(\d+)|[^\r\n]*?\.cpp:(\d+))/);const line=loc?Number(loc[1]||loc[2]):null;if(!line)continue;const variables=[];
 for(const item of raw.split(/\r?\n/)){const v=item.match(/^\s*([a-zA-Z_]\w*(?:\[[\w]+\])?)\s*=\s*(.*)$/);if(v)variables.push({name:v[1],value:v[2].slice(0,260)});if(variables.length>=64)break;}
 snapshots.push({step:Number(match[1]),line,variables});}
 return snapshots;}
async function trace({code,compiler='bundled',stdin='',steps=80},job=runner.jobContext(),progress=()=>{}){
 if(typeof code!=='string'||!code.trim()||Buffer.byteLength(code)>300*1024)throw Error('源码为空或超过 300 KB');
 if(typeof stdin!=='string'||Buffer.byteLength(stdin)>64*1024)throw Error('追踪输入超过 64 KB');
 compiler=runner.assertBundledRequest(compiler);
 const selected=compiler==='auto'?await runner.chooseCompiler():compiler==='bundled'?await runner.chooseCompiler('bundled'):compiler==='system'?await runner.chooseCompiler('system'):compiler;
 const cc=await runner.compilerPathForUse(selected);
 const gdb=gdbPath(cc),check=await runner.probe(gdb);
 if(!check)throw Error('找不到与当前 GCC 配套的 GDB 调试器。请选择包含 gdb.exe 的完整 WinLibs 工具链；clang++ 模式下请切换内置 GCC。');
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'yanpb-trace-'));
 try{
  const source=path.join(dir,'trace.cpp'),executable=path.join(dir,process.platform==='win32'?'trace.exe':'trace');
  await fs.writeFile(source,code,'utf8');await fs.writeFile(path.join(dir,'stdin.txt'),stdin,'utf8');await fs.writeFile(path.join(dir,'trace.gdb'),buildScript(steps),'utf8');
  const args=['-std=c++17','-O0','-g','-fno-omit-frame-pointer',source,'-o',executable];
  if(process.platform==='win32')args.push('-static-libgcc','-static-libstdc++');
  progress({message:'正在编译调试版本（-O0 -g）…'});
  const env=runner.toolchainEnvironment(path.dirname(cc));
  const compile=await runner.launch(cc,args,{cwd:dir,timeout:45000,maxOutput:262144,env,onSpawn:fn=>job.onSpawn(fn)});job.check();
  if(compile.code!==0)return {status:'CE',error:compile.stderr||compile.error||'Compile failed',snapshots:[]};
  progress({message:'GDB 正在逐行记录真实变量值…'});
  const r=await runner.launch(gdb,['--batch','--quiet','--command=trace.gdb','--args',executable],{cwd:dir,timeout:20000,maxOutput:2*1024*1024,env,onSpawn:fn=>job.onSpawn(fn)});
  job.check();const snapshots=parseTrace(r.stdout,Math.min(200,Math.max(1,Number(steps)||80)));
  return {status:r.timedOut?'TLE':snapshots.length?'OK':'NO_TRACE',snapshots,limit:Math.min(200,Math.max(1,Number(steps)||80)),truncated:snapshots.length>=steps,error:snapshots.length?'':(r.stderr||r.stdout||r.error||'GDB did not produce snapshots').slice(0,2400),debugger:gdb};
 }finally{await fs.rm(dir,{force:true,recursive:true}).catch(()=>{});}
}
module.exports={trace,buildScript,parseTrace,gdbPath};
