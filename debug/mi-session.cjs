'use strict';
const path=require('node:path');const fs=require('node:fs/promises');const os=require('node:os');const {spawn}=require('node:child_process');
const {EventEmitter}=require('node:events');const runner=require('../runner/local-runner.cjs');
const model=require('./debug-model.cjs');
function parseValue(text,at=0){let i=at;
 if(text[i]==='"'){i++;let value='';while(i<text.length){const c=text[i++];if(c==='"')break;if(c==='\\'&&i<text.length){const v=text[i++];value+=({n:'\n',r:'\r',t:'\t','"':'"','\\':'\\'}[v]??v);}else value+=c;}return [value,i];}
 if(text[i]==='{'||text[i]==='['){const close=text[i]==='{'?'}':']';const object={},list=[];const array=text[i]==='[';i++;
  while(i<text.length&&text[i]!==close){let key=null;const m=text.slice(i).match(/^([a-zA-Z_][\w-]*)=/);if(m){key=m[1];i+=m[0].length;}
   const [v,end]=parseValue(text,i);i=end;if(key){if(array)list.push({[key]:v});else object[key]=v;}else list.push(v);if(text[i]===',')i++;
  }return [array?list:object,i+1];}
 let end=i;while(end<text.length&&!/[,}\]]/.test(text[end]))end++;return [text.slice(i,end),end];
}
function parseFields(s){return parseValue('{'+s+'}',0)[0];}
function parseMI(line){const m=line.match(/^(\d+)?([\^*+=~@&])(.*)$/);if(!m)return null;const token=m[1]?Number(m[1]):null,type=m[2],body=m[3];if('~@&'.includes(type)){return {token,type,text:parseValue(body)[0]};}
 const comma=body.indexOf(',');const status=comma<0?body:body.slice(0,comma);const fields=comma<0?{}:parseFields(body.slice(comma+1));return {token,type,status,fields};}
function quoteMI(s){return '"'+String(s).replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/[\r\n]/g,'')+'"';}
class GdbSession extends EventEmitter {
 constructor(options={}){super();this.options=options;this.proc=null;this.seq=1;this.pending=new Map();this.breakpoints=new Set((options.breakpoints||[]).filter(n=>Number.isInteger(n)&&n>0&&n<100000));this.conditions=model.normalizeConditions(options.conditions,[...this.breakpoints]);this.watches=model.normalizeWatches(options.watches);this.arrayViews=model.normalizeArrays(options.arrays);this.state='idle';this.buffer='';this.tmp=null;this.snapshotId=0;this.stdout='';this.lastCompiler='';this.closed=false;this.watchdog=null;}
 send(cmd,timeout=12000){if(!this.proc||!this.proc.stdin.writable)throw Error('GDB is not running');let token=this.seq++;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(token);reject(Error('GDB timeout: '+cmd));},timeout);this.pending.set(token,{resolve,reject,timer});this.proc.stdin.write(token+cmd+'\n');});}
 handle(line){const msg=parseMI(line);if(!msg)return;
  if(msg.type==='^'&&this.pending.has(msg.token)){const p=this.pending.get(msg.token);this.pending.delete(msg.token);clearTimeout(p.timer);if(msg.status==='error')p.reject(Error(msg.fields.msg||'GDB command failed'));else p.resolve(msg);}
  if(msg.type==='*'&&msg.status==='stopped'){if(/^exited/.test(msg.fields.reason||'')){this.state='exited';this.emit('state',{status:'exited',reason:msg.fields.reason,exitCode:msg.fields['exit-code']||null});}else{this.state='paused';this.lastStopInfo=msg.fields;const n=++this.snapshotId;this.snapshot(n,msg.fields).catch(e=>this.emit('warning',e.message));}}
  if(msg.type==='*'&&msg.status==='running'){this.state='running';this.emit('state',{status:'running'});}
  if(msg.type==='~'||msg.type==='@'){this.stdout+=msg.text;this.stdout=this.stdout.slice(-12000);this.emit('console',msg.text);}
  if(msg.type==='='&&msg.status==='thread-group-exited'){this.state='exited';this.emit('state',{status:'exited',exitCode:msg.fields['exit-code']||null});}
 }
 async snapshot(n,info){if(['exited','closed'].includes(this.state))return;const frame=info.frame||{};let variables=[],stack=[];
  try{const r=await this.send('-stack-list-variables --all-values');variables=Array.isArray(r.fields.variables)?r.fields.variables:[];}catch(e){this.emit('warning','Variables: '+e.message);}
  try{const r=await this.send('-stack-list-frames');const frames=r.fields.stack||[];stack=Array.isArray(frames)?frames.map(x=>x.frame||x):[];}catch(e){this.emit('warning','Stack: '+e.message);}
  const watches=[];for(const expression of this.watches){if(n!==this.snapshotId||this.closed||this.state!=='paused')return;try{const r=await this.send('-data-evaluate-expression '+quoteMI(expression),2500);watches.push({expression,value:String(r.fields.value??''),ok:true});}catch(e){watches.push({expression,value:e.message.slice(0,200),ok:false});}}
  const arrays=[];let sampled=0;for(const view of this.arrayViews){if(n!==this.snapshotId||this.closed||this.state!=='paused')return;const items=[];for(let offset=0;offset<view.length&&sampled<80;offset++){sampled++;if(n!==this.snapshotId||this.closed||this.state!=='paused')return;const index=view.start+offset;try{const r=await this.send('-data-evaluate-expression '+quoteMI(view.expression+'['+index+']'),1200);items.push({index,value:String(r.fields.value??''),ok:true});}catch(e){items.push({index,value:e.message.slice(0,120),ok:false});break;}}arrays.push({expression:view.expression,items:model.numericBars(items),truncated:sampled>=80});}
  if(n!==this.snapshotId || this.closed || this.state!=='paused')return;
  this.emit('state',{status:'paused',reason:info.reason||'breakpoint',file:frame.fullname||frame.file||'',line:Number(frame.line)||0,func:frame.func||'',variables:variables.map(x=>({name:x.name,value:String(x.value??'<unavailable>').slice(0,400)})).slice(0,100),watches,arrays,stack:stack.slice(0,35).map(x=>({level:x.level,func:x.func,file:x.fullname||x.file||'',line:Number(x.line)||0})),signal:info['signal-name']||null});
 }
 async start(){const p=this.options,code=p.code,stdin=p.stdin||'';if(typeof code!=='string'||!code.trim()||Buffer.byteLength(code)>300000)throw Error('Source empty or too large');
 // stdin is supplied to the inferior via a temporary file, never to the GDB/MI command channel.
 const policy=runner.assertBundledRequest(p.compiler);
 const selected=policy==='system'?await runner.chooseCompiler('system'):policy&&policy!=='bundled'&&policy!=='auto'?policy:await runner.chooseCompiler('bundled');
 const cc=await runner.compilerPathForUse(selected);const gdb=path.join(path.dirname(cc),process.platform==='win32'?'gdb.exe':'gdb');const available=await runner.probe(gdb);if(!available)throw Error('Matching GDB not found. Select bundled GCC with GDB.');
 this.tmp=await fs.mkdtemp(path.join(os.tmpdir(),'yanpb-mi-'));
 try{
  const src=path.join(this.tmp,'debug.cpp'),exe=path.join(this.tmp,process.platform==='win32'?'debug.exe':'debug');this.source=src;this.exe=exe;await fs.writeFile(src,code,'utf8');if(stdin.length)await fs.writeFile(path.join(this.tmp,'yanpb-debug-input.txt'),stdin,'utf8');
  const env=runner.toolchainEnvironment(path.dirname(cc));this.env=env;
  const args=['-std=c++17','-g','-O0','-fno-omit-frame-pointer',src,'-o',exe];if(process.platform==='win32')args.splice(-2,0,'-static-libgcc','-static-libstdc++');
  const build=await runner.launch(cc,args,{cwd:this.tmp,env,timeout:50000,maxOutput:262144});if(build.code!==0)return {status:'CE',stderr:build.stderr};
  this.proc=spawn(gdb,['--interpreter=mi2','--quiet','--nx',exe],{cwd:this.tmp,env,windowsHide:true,stdio:['pipe','pipe','pipe'],shell:false});
  this.proc.stdout.on('data',buffer=>{this.buffer+=buffer.toString('utf8');if(this.buffer.length>2*1024*1024)this.buffer=this.buffer.slice(-1024*1024);let i;while((i=this.buffer.indexOf('\n'))>=0){const line=this.buffer.slice(0,i).replace(/\r$/,'');this.buffer=this.buffer.slice(i+1);this.handle(line);}});
  this.proc.stderr.on('data',b=>this.emit('warning',b.toString().slice(-400)));
  this.proc.on('error',e=>this.emit('warning',e.message));this.proc.on('exit',c=>{if(!this.closed)this.emit('state',{status:'exited',exitCode:c});this.state='exited';for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(Error('GDB exited'));}this.pending.clear();});
  this.state='starting';await this.send('-gdb-set pagination off');await this.send('-gdb-set confirm off');try{await this.send('-enable-pretty-printing');}catch{}
  // No source path supplied by browser: only the temporary, controlled source is used.
  for(const line of this.breakpoints){const condition=this.conditions[line];await this.send(`-break-insert ${condition?'-c '+quoteMI(condition)+' ':''}${quoteMI(this.source+':'+line)}`);}
  if(!this.breakpoints.size)await this.send('-break-insert main');
  this.state='ready';this.watchdog=setTimeout(()=>this.stop(),600000);const launching=this.send(model.runCommand(stdin.length>0),20000);launching.catch(e=>{this.emit('warning','Debugger launch: '+e.message);if(!this.closed){this.state='error';this.emit('state',{status:'error',reason:e.message});}});return {status:'running',breakpoints:[...this.breakpoints],stdinMode:stdin.length?'preloaded-file':'none'};
 }catch(e){await this.stop();throw e;}
 }
 async action(type,line,detail){if(this.closed)throw Error('Debugger closed');
  if(type==='breakpoint'){if(this.state==='running')throw Error('Pause debugging before changing breakpoints');const l=Number(line);if(!Number.isInteger(l)||l<1||l>100000)throw Error('Invalid breakpoint line');
   if(this.breakpoints.has(l)){this.breakpoints.delete(l);const r=await this.send('-break-list');const list=r.fields.BreakpointTable?.body||[];for(const row of list){const b=row.bkpt||row;if(Number(b.line)===l)await this.send('-break-delete '+b.number);}}
   else{this.breakpoints.add(l);await this.send('-break-insert '+quoteMI(this.source+':'+l));}return {breakpoints:[...this.breakpoints]};}
  if(type==='condition'){if(this.state!=='paused')throw Error('Pause debugging before editing conditions');const n=Number(line);if(!this.breakpoints.has(n))throw Error('Breakpoint not found');const value=detail&&String(detail).trim()?model.cleanCondition(detail):'';const r=await this.send('-break-list');const body=r.fields.BreakpointTable?.body||[];const row=body.map(v=>v.bkpt||v).find(v=>Number(v.line)===n);if(!row)throw Error('GDB breakpoint not found');await this.send('-break-condition '+row.number+(value?' '+quoteMI(value):''));if(value)this.conditions[n]=value;else delete this.conditions[n];return {conditions:this.conditions};}
  if(type==='watch-add'){const expression=model.cleanExpression(detail);this.watches=model.normalizeWatches([...this.watches,expression]);return {watches:this.watches};}
  if(type==='watch-remove'){this.watches=this.watches.filter(x=>x!==String(detail));return {watches:this.watches};}
  if(type==='array-add'){this.arrayViews=model.normalizeArrays([...this.arrayViews,detail]);return {arrays:this.arrayViews};}
  if(type==='array-remove'){this.arrayViews=this.arrayViews.filter(x=>x.expression!==String(detail));return {arrays:this.arrayViews};}
  if(type==='refresh'){if(this.state!=='paused')throw Error('Debugger must be paused');const n=++this.snapshotId;await this.snapshot(n,this.lastStopInfo||{});return {status:'paused'};}
  const commands={next:'-exec-next',step:'-exec-step',continue:'-exec-continue',finish:'-exec-finish'};
  if(!commands[type])throw Error('Unknown debugger action');if(this.state!=='paused')throw Error('Debugger must be paused');this.state='running';await this.send(commands[type]);return {status:'running'};
 }
 async stop(){if(this.closed)return;this.closed=true;this.state='closed';clearTimeout(this.watchdog);for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(Error('GDB stopped'));}this.pending.clear();if(this.proc){try{this.proc.kill();}catch{}this.proc=null;}if(this.tmp){await fs.rm(this.tmp,{recursive:true,force:true}).catch(()=>{});this.tmp=null;}this.emit('state',{status:'stopped'});}
}
module.exports={GdbSession,parseMI,parseFields,quoteMI};
