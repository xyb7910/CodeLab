'use strict';
(function(root){
function parse(raw,{max=80}={}){
 const lines=String(raw??'').replace(/\r\n?/g,'\n').split('\n'),out=[],seen=new Set();
 for(const text of lines){
  // Works with Windows drive letters and paths containing spaces.
  const m=text.match(/^(.*?):(\d+):(\d+):\s*(fatal error|error|warning|note):\s*(.*)$/i)||text.match(/^(.*?):(\d+):\s*(fatal error|error|warning|note):\s*(.*)$/i);
  if(!m)continue;
  const hasColumn=m.length===6,file=m[1],line=Number(m[2]),column=hasColumn?Number(m[3]):1;
  const severity=(hasColumn?m[4]:m[3]).toLowerCase();const message=(hasColumn?m[5]:m[4]).trim();
  if(line<1||line>2000000||column<1||column>100000||!message)continue;
  const key=`${file}:${line}:${column}:${severity}:${message}`;
  if(seen.has(key))continue;seen.add(key);
  out.push({file,line,column,severity:severity==='fatal error'?'error':severity,message});
  if(out.length>=max)break;
 }
 return out;
}
function filterForSource(items,sourceName){
 if(!sourceName)return items;
 const name=sourceName.replace(/\\/g,'/').split('/').pop().toLowerCase();
 return items.filter(x=>x.file.replace(/\\/g,'/').split('/').pop().toLowerCase()===name || x.file.toLowerCase()==='main.cpp');
}
const api={parse,filterForSource};if(typeof module==='object'&&module.exports)module.exports=api;else root.YanpbInlineDiagnostics=api;
})(typeof window==='object'?window:globalThis);
