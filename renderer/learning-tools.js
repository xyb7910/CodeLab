'use strict';
(function(root){
const asText=s=>String(s??'').replace(/\r\n?/g,'\n');
function linesDiff(expected,actual,mode='trim'){
 const normalize=s=>mode==='strict'?asText(s):asText(s).trimEnd();
 const a=normalize(expected).split('\n'),b=normalize(actual).split('\n');
 if(a.length>240||b.length>240||a.join('').length+b.join('').length>30000)return {truncated:true,rows:[{kind:'change',expected:a.slice(0,20).join('\n'),actual:b.slice(0,20).join('\n'),expectedLine:1,actualLine:1}]};
 const n=a.length,m=b.length,dp=Array.from({length:n+1},()=>new Uint16Array(m+1));
 for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 const ops=[];let i=0,j=0;
 while(i<n||j<m){if(i<n&&j<m&&a[i]===b[j]){ops.push({kind:'same',expected:a[i],actual:b[j],expectedLine:i+1,actualLine:j+1});i++;j++;}
 else if(i<n&&(j>=m||dp[i+1][j]>=dp[i][j+1])){ops.push({kind:'missing',expected:a[i],actual:'',expectedLine:i+1,actualLine:null});i++;}
 else{ops.push({kind:'extra',expected:'',actual:b[j],expectedLine:null,actualLine:j+1});j++;}}
 const rows=[];
 for(let k=0;k<ops.length;k++){const curr=ops[k],next=ops[k+1];if(curr.kind==='missing'&&next?.kind==='extra'){rows.push({kind:'change',expected:curr.expected,actual:next.actual,expectedLine:curr.expectedLine,actualLine:next.actualLine});k++;}else if(curr.kind==='extra'&&next?.kind==='missing'){rows.push({kind:'change',expected:next.expected,actual:curr.actual,expectedLine:next.expectedLine,actualLine:curr.actualLine});k++;}else rows.push(curr);}
 return {rows,changed:rows.filter(r=>r.kind!=='same').length,truncated:false};
}
function characterSpans(a,b){a=String(a);b=String(b);let left=0;while(left<a.length&&left<b.length&&a[left]===b[left])left++;let right=0;while(right<a.length-left&&right<b.length-left&&a[a.length-1-right]===b[b.length-1-right])right++;return {prefix:a.slice(0,left),expectedDelta:a.slice(left,a.length-right),actualDelta:b.slice(left,b.length-right),expectedSuffix:a.slice(a.length-right),actualSuffix:b.slice(b.length-right)};}
const RULES=[
 [/fatal error:\s*(.+?): No such file or directory/i,'missing-header','找不到头文件','确认头文件名称、编译器配置及 include 路径。bits/stdc++.h 通常需要 GCC。','Header not found','Check the header name, compiler and include paths.'],
 [/was not declared in this scope/i,'undeclared','变量或函数尚未声明','检查拼写、变量作用域，并确认使用前已定义或声明。','Undeclared identifier','Check spelling, scope and declarations.'],
 [/expected ['‘`]?;['’`]? before|expected ';' at end/i,'semicolon','可能缺少分号 ;','先检查报错行的前一行末尾；定位仅是编译器发现问题的位置。','Possibly missing semicolon','Check the previous line. The marked location may not be the root cause.'],
 [/expected ['‘`]?}['’`]? at end of input|expected .*}.*end of input/i,'brace','大括号可能不匹配','检查函数、if、for 和循环的大括号是否完整成对。','Possibly unmatched braces','Check braces in functions, conditions and loops.'],
 [/undefined reference to [`'‘]?main|undefined reference to WinMain/i,'main','找不到程序入口 main','检查 main 函数是否存在及签名；注意拼写和大小写。','Missing main entry point','Verify int main() exists with correct spelling.'],
 [/no matching function for call/i,'signature','函数参数类型或数量不匹配','检查函数定义与调用处的参数个数、顺序和类型。','Function argument mismatch','Check argument count, order and types.'],
 [/invalid conversion from|cannot convert .* to/i,'conversion','类型转换可能不合法','确认变量类型，谨慎使用强制转换，尤其区分指针与整数。','Invalid type conversion','Check variable and parameter types.'],
 [/ld\.exe: cannot find .*|default-manifest\.o/i,'linker','链接器无法找到所需文件','检查 GCC 工具链所在路径，避免包含空格；确认已使用内置 GCC 的无空格路径映射。','Linker cannot locate a required file','Use the bundled compiler with a space-free path alias.'],
 [/multiple definition of|redefinition of/i,'redefine','发生重复定义','检查是否重复定义变量、函数，或头文件缺少必要的保护。','Duplicate definition','Check repeated declarations or definitions.']
];
function explainCompiler(stderr,locale='zh'){
 const text=asText(stderr),results=[];const seen=new Set();
 for(const line of text.split('\n')){
  const loc=line.match(/:(\d+):(\d+):\s*(?:fatal\s+)?(?:error|warning):/i)||line.match(/:(\d+):\s*(?:fatal\s+)?(?:error|warning):/i);
  for(const [regex,id,zhTitle,zhTip,enTitle,enTip] of RULES){if(regex.test(line)&&!seen.has(id)){seen.add(id);results.push({id,title:locale==='en'?enTitle:zhTitle,tip:locale==='en'?enTip:zhTip,line:loc?Number(loc[1]):null,column:loc?.[2]?Number(loc[2]):null,raw:line.trim().slice(0,450)});}}
 }
 if(results.length===0&&text.trim())results.push({id:'generic',title:locale==='en'?'Compiler reported an issue':'编译器发现问题',tip:locale==='en'?'Read the first error, then inspect the reported source line.':'先查看第一条 error，再检查相应代码及上一行。',line:null,column:null,raw:text.split('\n').find(x=>/error|warning/i.test(x))?.slice(0,450)||''});
 return results.slice(0,8);
}
const api={linesDiff,characterSpans,explainCompiler};
if(typeof module==='object'&&module.exports)module.exports=api;
else root.YanpbLearningTools=api;
})(typeof window==='object'?window:globalThis);
