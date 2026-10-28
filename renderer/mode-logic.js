'use strict';
// Local practice markers only. No official OJ submission or score is inferred.
(function(root, factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.YanpbModes=api;
})(typeof window!=='undefined'?window:globalThis,()=>{
 function oiChecklist(problem, sourceName, audit, localTest){
  const checks=[
   {key:'task',label:'题目与源码已关联',ok:!!problem&&sourceName===problem.task+'.cpp'},
   {key:'saved',label:'源码文件位于比赛工作区',ok:!!problem&&!!problem.source},
   {key:'exam',label:'已执行本地提交预检',ok:!!audit&&audit.checked===true},
   {key:'samples',label:'已有本地样例测试记录',ok:!!localTest&&localTest.testCount>0}
  ];
  return {checks,complete:checks.every(x=>x.ok)};
 }
 function clampTerminal(height,available,min=110){return Math.max(min,Math.min(Math.max(min,available-210),Math.round(Number(height)||220)));}
 return {oiChecklist,clampTerminal};
});
