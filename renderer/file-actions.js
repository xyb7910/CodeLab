'use strict';
// Pure file naming helpers, also testable from Node without Electron.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.YanpbFileActions=api;})(typeof window!=='undefined'?window:null,()=>{
 const reserved=/^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i;
 function checkName(name){
  if(typeof name!=='string')throw Error('文件名无效 / Invalid filename');
  const s=name.trim();
  if(!s || s.length>100 || s==='.'||s==='..'||/[\\/:*?"<>|\x00-\x1f]/.test(s)||/[. ]$/.test(s)||reserved.test(s))throw Error('文件名包含非法字符或保留名称 / Invalid filename');
  if(!/\.(?:cpp|cc|cxx|c|h|hpp|txt)$/i.test(s))throw Error('请保留 C/C++ 源文件扩展名（.cpp、.h 等）');
  return s;
 }
 function copyName(original,existing=[]){
  const ext=/\.[^.]+$/.exec(original)?.[0]||'.cpp';
  const stem=original.slice(0,-ext.length).replace(/(?:-copy(?:-\d+)?)$/i,'');
  const names=new Set(existing.map(s=>String(s).toLowerCase()));
  let i=1,proposed;
  do{const suffix=i===1?'-copy':'-copy-'+i;proposed=stem.slice(0,Math.max(1,100-ext.length-suffix.length))+suffix+ext;i++;}while(names.has(proposed.toLowerCase()));
  return proposed;
 }
 return {checkName,copyName};
});
