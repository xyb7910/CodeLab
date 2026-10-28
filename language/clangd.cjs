'use strict';
const fs=require('node:fs/promises');
const fsSync=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {spawn}=require('node:child_process');
const {EventEmitter}=require('node:events');
const mac=require('../runner/mac-toolchain.cjs');
const MAX_FRAME=8*1024*1024;

class LspFrames {
  constructor(onMessage){this.buffer=Buffer.alloc(0);this.onMessage=onMessage;}
  push(data){this.buffer=Buffer.concat([this.buffer,Buffer.from(data)]);if(this.buffer.length>MAX_FRAME*2)throw Error('clangd protocol buffer exceeded');
    while(true){let at=this.buffer.indexOf('\r\n\r\n');let delim=4;if(at<0){at=this.buffer.indexOf('\n\n');delim=2;}if(at<0)return;
      const head=this.buffer.subarray(0,at).toString('ascii');const match=head.match(/(?:^|\r?\n)Content-Length:\s*(\d+)/i);
      if(!match)throw Error('Missing clangd Content-Length');const len=Number(match[1]);if(len<0||len>MAX_FRAME)throw Error('Invalid clangd message length');
      if(this.buffer.length<at+delim+len)return;
      const content=this.buffer.subarray(at+delim,at+delim+len);this.buffer=this.buffer.subarray(at+delim+len);this.onMessage(JSON.parse(content.toString('utf8')));
    }
  }
}
function encode(msg){const body=Buffer.from(JSON.stringify(msg),'utf8');return Buffer.concat([Buffer.from(`Content-Length: ${body.length}\r\n\r\n`,'ascii'),body]);}
function bundledPath(resources=process.resourcesPath){return path.join(resources||'', 'clangd','bin',process.platform==='win32'?'clangd.exe':'clangd');}
function severity(code){return code===1?'error':code===2?'warning':code===3?'note':'hint';}
function mapDiagnostics(diags){return (Array.isArray(diags)?diags:[]).slice(0,150).map(d=>({line:(d.range?.start?.line??0)+1,column:(d.range?.start?.character??0)+1,endLine:(d.range?.end?.line??0)+1,endColumn:(d.range?.end?.character??0)+1,severity:severity(d.severity),message:String(d.message||'').slice(0,1500),source:d.source||'clangd',code:d.code??null}));}
class ClangdSession extends EventEmitter {
 constructor(opts={}){super();this.binary=opts.binary||null;this.workspace=opts.workspace;this.compiler=opts.compiler||'g++';this.standard=opts.standard||'c++17';this.proc=null;this.seq=1;this.pending=new Map();this.version=0;this.docUri=null;this.ready=false;this.closed=false;this.awaiting=null;}
 send(obj){if(!this.proc||!this.proc.stdin.writable)throw Error('clangd not running');this.proc.stdin.write(encode(obj));}
 request(method,params,timeout=10000){const id=this.seq++;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(id);reject(Error('clangd timeout: '+method));},timeout);this.pending.set(id,{resolve,reject,timer});try{this.send({jsonrpc:'2.0',id,method,params});}catch(e){clearTimeout(timer);this.pending.delete(id);reject(e);}});}
 notify(method,params){this.send({jsonrpc:'2.0',method,params});}
 onMessage(msg){if(msg.id!=null&&this.pending.has(msg.id)){const p=this.pending.get(msg.id);this.pending.delete(msg.id);clearTimeout(p.timer);if(msg.error)p.reject(Error(msg.error.message||'clangd error'));else p.resolve(msg.result);return;}
  if(msg.method==='textDocument/publishDiagnostics' && msg.params?.uri===this.docUri)this.emit('diagnostics',{version:msg.params.version??this.version,diagnostics:mapDiagnostics(msg.params.diagnostics)});
  if(msg.method==='window/logMessage'&&msg.params?.type===1)this.emit('warning',String(msg.params.message).slice(0,500));
  if(msg.id!=null&&msg.method)this.send({jsonrpc:'2.0',id:msg.id,result:null});
 }
 async start(){if(this.proc)throw Error('clangd already started');await fs.mkdir(this.workspace,{recursive:true});
  const doc=path.join(this.workspace,'active.cpp');await fs.writeFile(doc,'// clangd workspace\n');
  const cmd=[this.compiler,`-std=${this.standard}`, ...(process.platform==='darwin'?mac.macCompileFlags():[]),' -x'.trim(),'c++',doc];await fs.writeFile(path.join(this.workspace,'compile_commands.json'),JSON.stringify([{directory:this.workspace,file:doc,arguments:cmd}],null,2));
  this.docUri=pathToFileURL(doc).href;
  const bundled=bundledPath();
  const binary=this.binary||(process.platform==='win32'?(fsSync.existsSync(bundled)?bundled:'clangd'):process.platform==='darwin'?mac.findMacTool('clangd'):'clangd');
  const extra=['--background-index=false','--clang-tidy=false',`--compile-commands-dir=${this.workspace}`];
  if(process.platform==='win32' && path.isAbsolute(this.compiler))extra.push(`--query-driver=${this.compiler.replace(/\\/g,'/')}`);
  this.proc=spawn(binary,extra,{stdio:['pipe','pipe','pipe'],windowsHide:true,shell:false});
  const frames=new LspFrames(msg=>this.onMessage(msg));this.proc.stdout.on('data',data=>{try{frames.push(data);}catch(e){this.fail(e);}});
  this.proc.stderr.on('data',data=>{const s=data.toString();if(/error:/i.test(s))this.emit('warning',s.slice(-500));});
  this.proc.on('error',e=>this.fail(e));this.proc.on('exit',(code)=>this.fail(Error('clangd exited: '+code)));
  const initialized=await this.request('initialize',{processId:process.pid,rootUri:pathToFileURL(this.workspace).href,capabilities:{textDocument:{publishDiagnostics:{relatedInformation:false,versionSupport:true}}},clientInfo:{name:'Yanpb CodeLab',version:'4.3'}},15000);
  this.notify('initialized',{});this.ready=true;return {status:'ready',version:initialized?.serverInfo?.version||null,binary};
 }
 async completion(line,character,version){
  if(!this.ready||!this.version)throw Error('clangd document not available');
  if(!Number.isInteger(line)||line<0||line>100000||!Number.isInteger(character)||character<0||character>100000)throw Error('Invalid completion position');
  if(version!==this.version)return {stale:true,items:[]};
  const data=await this.request('textDocument/completion',{textDocument:{uri:this.docUri},position:{line,character},context:{triggerKind:1}},10000);
  if(version!==this.version||!this.ready)return {stale:true,items:[]};
  return {stale:false,items:Array.isArray(data)?data:data?.items||[]};
 }
 open(text){if(!this.ready)throw Error('clangd not initialized');if(typeof text!=='string'||Buffer.byteLength(text)>300000)throw Error('Source too large');this.version=1;this.notify('textDocument/didOpen',{textDocument:{uri:this.docUri,languageId:'cpp',version:this.version,text}});return this.version;}
 change(text){if(!this.ready||!this.version)throw Error('clangd document not open');if(typeof text!=='string'||Buffer.byteLength(text)>300000)throw Error('Source too large');this.version++;this.notify('textDocument/didChange',{textDocument:{uri:this.docUri,version:this.version},contentChanges:[{text}]});return this.version;}
 fail(e){if(this.closed)return;this.ready=false;for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(e);}this.pending.clear();this.emit('failure',e.message);}
 async stop(){this.closed=true;if(this.docUri&&this.ready&&this.version)this.notify('textDocument/didClose',{textDocument:{uri:this.docUri}});this.ready=false;for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(Error('clangd stopped'));}this.pending.clear();if(this.proc){this.proc.kill();this.proc=null;}}
}
module.exports={LspFrames,encode,mapDiagnostics,bundledPath,ClangdSession};
