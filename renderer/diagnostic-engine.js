'use strict';
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YanpbDiagnosticEngine=api;
})(typeof window==='object'?window:globalThis,()=>{
 const MAX=120;
 const normalize=s=>String(s??'').replace(/\r\n?/g,'\n');
 function parse(raw,{source='',max=MAX}={}){
  const rows=normalize(raw).split('\n'),all=[],seen=new Set();
  const sourceBase=String(source).replace(/\\/g,'/').split('/').pop().toLowerCase();
  for(const row of rows){
   const m=row.match(/^(.*?):(\d+)(?::(\d+))?:\s*(fatal error|error|warning|note):\s*(.+)$/i);
   if(!m)continue;
   const file=m[1].replace(/\\/g,'/').split('/').pop().toLowerCase();
   if(sourceBase&&file!==sourceBase&&file!=='main.cpp')continue;
   const line=+m[2],col=m[3]?+m[3]:1;
   if(line<1||line>2e6||col<1||col>100000)continue;
   const severity=m[4].toLowerCase()==='fatal error'?'error':m[4].toLowerCase(),message=m[5].trim();
   const key=`${line}:${col}:${severity}:${message}`;
   if(!message||seen.has(key))continue;
   seen.add(key);all.push({file,line,column:col,severity,message,raw:row});
   if(all.length>=Math.max(1,Math.min(MAX,max)))break;
  }
  return all.sort((a,b)=>a.line-b.line||a.column-b.column||priority(a.severity)-priority(b.severity));
 }
 function priority(s){return s==='error'?0:s==='warning'?1:2;}
 function summary(items){return {errors:items.filter(x=>x.severity==='error').length,warnings:items.filter(x=>x.severity==='warning').length,notes:items.filter(x=>x.severity==='note').length};}
 function lineGroups(items){const groups=new Map();for(const d of items){const xs=groups.get(d.line)||[];xs.push(d);groups.set(d.line,xs);}return [...groups].map(([line,diagnostics])=>({line,diagnostics:diagnostics.sort((a,b)=>priority(a.severity)-priority(b.severity))}));}
 function advice(item,locale='zh'){
  const msg=item?.message||'',en=locale==='en';
  const patterns=[
   [/expected [‘'`"]?;|expected ';'|expected ';' before/i,en?'A statement may be missing its trailing semicolon. Check the previous line.':'可能漏写分号；优先检查前一行结束位置。', 'semicolon'],
   [/was not declared in this scope|undeclared identifier/i,en?'Check the variable name, scope and missing declarations.':'检查变量拼写、作用域以及是否先声明后使用。','undeclared'],
   [/no matching function|candidate expects|too many arguments/i,en?'Check the function signature and the types and number of arguments.':'核对函数形参、调用实参的数量与类型。','function'],
   [/no such file or directory|file not found/i,en?'Check the header or file name and compiler include paths.':'检查头文件或路径拼写，以及编译器头文件搜索目录。','header'],
   [/expected '}'|expected .*}.*end of input/i,en?'Inspect matching braces and unfinished blocks.':'检查代码块花括号是否成对。','brace'],
   [/invalid conversion|cannot convert/i,en?'Check whether source and destination types are compatible.':'检查赋值或函数调用时的数据类型是否匹配。','conversion'],
   [/unused variable|set but not used/i,en?'Consider removing the variable or using it intentionally.':'可能存在冗余变量；确认是否漏用了该变量。','unused'],
   [/comparison of integer expressions of different signedness/i,en?'Consider using compatible signed integer types in the comparison.':'比较双方的 signed/unsigned 类型不同，检查边界和转换。','signed'],
   [/may be used uninitialized/i,en?'Initialize this variable before it is read on every path.':'变量可能未经赋值就被读取，检查所有执行路径。','uninitialized'],
   [/control reaches end of non-void function/i,en?'Ensure a return statement is reached on every execution path.':'非 void 函数可能遗漏 return，检查每条分支。','return'],
   [/stray .+ in program|missing terminating . character/i,en?'Check quotes, Unicode punctuation and escaping.':'检查引号、中文标点与字符串转义。','punctuation']
  ];
  const row=patterns.find(x=>x[0].test(msg));return row?{id:row[2],text:row[1]}:{id:'generic',text:en?'Check the first error and relevant code context; later errors may be cascading.':'先处理第一条真实 error；后续错误可能是由它连锁引起的。'};
 }
 // A proposal is only offered when the preceding physical line is a simple,
 // complete statement. It is deliberately NOT applied without confirmation.
 function proposeFix(item,lines){
  if(!/expected [‘'`"]?;|expected ';' before/i.test(item?.message||''))return null;
  if(!Array.isArray(lines)||item.line<2||item.line>lines.length)return null;
  const index=item.line-2,source=String(lines[index]??''),code=source.replace(/\/\/.*$/,'').trim();
  if(!code||/^\s*#|^\s*(if|else|for|while|switch|do|class|struct|namespace|template|using\s+namespace)\b/.test(code))return null;
  if(/[;{},:]$/.test(code)||/[+\-*/=<>!&|?]$/.test(code)||code.startsWith('//')||code.includes('/*')||code.includes('*/'))return null;
  if(/\b(return|cout|cin|printf|scanf|break|continue)\b|(?:\w+\s*=\s*.+)|(?:\w+\s*\([^)]*\))/.test(code)===false)return null;
  return {type:'append-semicolon',line:index+1,before:source,after:source+';',title:'Possible missing semicolon / 可能缺少分号'};
 }
 function validateFix(fix,actual){return fix?.type==='append-semicolon'&&typeof actual==='string'&&actual===fix.before;}
 return {parse,summary,lineGroups,advice,proposeFix,validateFix};
});
