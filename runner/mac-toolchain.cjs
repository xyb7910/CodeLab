'use strict';
// Apple Clang requires the macOS SDK provided by Xcode Command Line Tools.
// Never silently switch to Homebrew, system GCC, or an arbitrary compiler.
const fs=require('node:fs');
const cp=require('node:child_process');
const path=require('node:path');
function findMacTool(name,{execFileSync=cp.execFileSync,existsSync=fs.existsSync}={}){
 if(!/^(clang\+\+|clangd|lldb|lldb-dap)$/.test(name))throw Error('Unsupported Apple developer tool');
 let output='';
 try{output=String(execFileSync('/usr/bin/xcrun',['--find',name],{encoding:'utf8',timeout:8000,stdio:['ignore','pipe','pipe']})).trim();}
 catch{throw Error(`macOS ${name} unavailable. Install Xcode Command Line Tools with: xcode-select --install`);}
 if(!path.posix.isAbsolute(output)||!existsSync(output))throw Error('xcrun returned a missing tool: '+name);
 return output;
}
function macCompatPath(resources=process.resourcesPath){
 const path=require('node:path');
 const staged=path.join(resources||'','mac-compat');
 const development=path.join(__dirname,'..','mac-compat');
 return fs.existsSync(path.join(staged,'bits','stdc++.h'))?staged:development;
}
function macCompileFlags(resources=process.resourcesPath){return ['-I',macCompatPath(resources)];}
module.exports={findMacTool,macCompatPath,macCompileFlags};
