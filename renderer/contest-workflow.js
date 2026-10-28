'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YanpbContestWorkflow=api;})(typeof window!=='undefined'?window:globalThis,()=>{
 function key(folder,task){if(!folder||!task)return null;return JSON.stringify([String(folder),String(task)]);}
 function read(progress,manifest,task){if(!manifest||!task)return null;return progress?.[key(manifest.folder,task)] ?? progress?.[manifest.contestName+':'+task] ?? null;}
 function summarize(manifest,progress){
  const files=manifest?.files||[];const rows=files.map((f,index)=>{
   const test=read(progress,manifest,f.task);
   return {task:f.task,index,indexLabel:String(index+1),testStatus:test?.status||null,testCount:test?.testCount||0,
    verdict:null,source:f.source,
    // Samples are never official results.
    displayStatus:test?(test.status+' (samples)'):'Not tested'};
  });
  return {rows,total:rows.length,tested:rows.filter(x=>x.testCount>0).length,failed:rows.filter(x=>x.testStatus&&x.testStatus!=='OK').length,passed:rows.filter(x=>x.testCount>0&&x.testStatus==='OK').length};
 }
 function nextAction(status){switch(status){case 'ready':return 'start';case 'running':return 'pause';case 'paused':return 'resume';default:return null;}}
 return {key,read,summarize,nextAction};
});
