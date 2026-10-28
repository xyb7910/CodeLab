'use strict';
// Pure scene classifier: visuals must follow actual workspace/debug state,
// not merely the selected color theme.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YanpbEditorScene=api;})(typeof window==='object'?window:globalThis,()=>{
 function classify({mode='icpc',contest=null,task=null,debugStatus='idle',issues=0,samples=0,language='zh'}={}){
  const en=language==='en',has=!!contest,debugging=['starting','running','paused','stopped'].includes(debugStatus)&&debugStatus!=='stopped';
  const isCsp=mode==='oi'&&has&&!!contest.exam&&['cspj','csps'].includes(contest.platform);
  let scene='coding';if(debugging)scene='debug';else if(isCsp)scene='csp';else if(has)scene=mode==='oi'?'oi-contest':'icpc-contest';
  const name=task?.task||'';
  const sceneLabels={coding:[en?'EDITOR':'自由编程',en?'Ready to code':'本地 C++ 编辑'],debug:[en?'DEBUGGING':'调试现场',en?'GDB session':'GDB 单步调试'],csp:[en?'CSP EXAM':'CSP 考场',name?name+'.in → '+name+'.out':(en?'File I/O mode':'文件输入输出')], 'icpc-contest':[en?'ICPC ROUND':'ICPC 比赛',name?name+'.cpp':(en?'Contest workspace':'比赛工作区')],'oi-contest':[en?'OI PRACTICE':'OI 训练',name?name+'.cpp':(en?'Contest workspace':'比赛工作区')]};
  const [label,detail]=sceneLabels[scene];
  const meta=has?(contest.contestName||'Contest'):(en?'Local workspace':'本地工作区');
  return {scene,label,detail,meta,showNext:has&&scene!=='debug'&&contest.files?.length>1,showPreflight:isCsp&&scene!=='debug',showDebug:scene==='debug',showSnippet:scene!=='debug',showStop:scene==='debug',sampleLabel:(en?'Samples ':'样例 ')+samples,problemLabel:(en?'Issues ':'问题 ')+issues,watermark:mode==='oi'?'OI':'ICPC'};
 }
 return {classify};
});
