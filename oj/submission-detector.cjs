'use strict';
// Parse only official OJ submission detail links and link them conservatively.
// A discovered ID is evidence of a page/record, NOT proof that the frozen code
// was submitted. Never turn a candidate into an official AC without verification.
const {asOfficialLink,officialHost}=require('./official-session.cjs');
const MAX_CANDIDATES=12,WINDOW_MS=30*60*1000;
function problemFromURL(platform,raw){
 try{const u=new URL(raw);if(!officialHost(platform,raw))return null;const p=u.pathname;
  if(platform==='codeforces'){
   const m=p.match(/^\/(?:contest|gym)\/\d+\/problem\/([A-Za-z][A-Za-z0-9]*)\/?$/)||p.match(/^\/problemset\/problem\/\d+\/([A-Za-z][A-Za-z0-9]*)\/?$/);
   return m?.[1]||null;
  }
  if(platform==='atcoder')return p.match(/^\/contests\/[\w-]+\/tasks\/([\w-]+)\/?$/)?.[1]||null;
  if(platform==='luogu')return p.match(/^\/problem\/([PBTU]\d+)\/?$/i)?.[1]?.toUpperCase()||null;
 }catch{}return null;
}
function validateDetected(task,data){
 if(!task||!data||typeof data.url!=='string')return {ok:false,reason:'missing-record'};
 let receipt;try{receipt=asOfficialLink(task.platform,data.url);}catch{return {ok:false,reason:'nonofficial-detail-url'};}
 if(task.platform==='codeforces'&&String(receipt.contestId)!==String(task.contestId))return {ok:false,reason:'wrong-contest'};
 if(task.platform==='atcoder'&&receipt.contestId!==task.contestId)return {ok:false,reason:'wrong-contest'};
 const detectedProblem=data.problemId||problemFromURL(task.platform,data.problemUrl||'');
 if(detectedProblem){
  const expected=task.platform==='codeforces'?task.index:task.problemId;
  if(detectedProblem!==expected)return {ok:false,reason:'wrong-problem'};
 }
 return {ok:true,receipt,problemId:detectedProblem||null,identity:!!detectedProblem,source:data.source==='detail'?'detail':'list'};
}
function decideAutoReceipt(task,events,{now=Date.now()}={}){
 if(!Array.isArray(events))return {status:'ignored',reason:'invalid-candidates',candidates:[]};
 const valid=new Map();
 for(const event of events.slice(0,MAX_CANDIDATES*4)){
  const result=validateDetected(task,event);if(!result.ok)continue;
  const key=result.receipt.id;
  if(!valid.has(key)||(!valid.get(key).identity&&result.identity))valid.set(key,{...result.receipt,problemId:result.problemId,identity:result.identity,source:result.source});
 }
 const candidates=[...valid.values()].slice(0,MAX_CANDIDATES);
 if(!candidates.length)return {status:'ignored',reason:'no-compatible-record',candidates};
 // Never auto-link before source was filled, long after preparation, or once a
 // different official receipt has been recorded.
 if(!['form_filled','receipt_pending','judging'].includes(task.state) || now < task.createdAt || now-task.createdAt>WINDOW_MS)
  return {status:'suggested',reason:'not-recent-filled-task',candidates};
 if(task.receipt){return {status:'suggested',reason:'already-linked',candidates};}
 if(candidates.length!==1)return {status:'suggested',reason:'ambiguous-multiple-records',candidates};
 const found=candidates[0];
 // A status-list row is only a candidate. Without an observed direct detail
 // transition, it can refer to an old or unrelated submission by the user.
 if(found.source!=='detail')return {status:'suggested',reason:'list-needs-confirmation',candidates};
 // For AtCoder/Luogu, ID + contest alone does not identify the problem.
 // For CF, contest+ID identifies the record, but the problem needs API check
 // before any official verdict is verified.
 if(task.platform!=='codeforces'&&!found.identity)
  return {status:'suggested',reason:'problem-identity-unknown',candidates};
 return {status:'linked',reason:'candidate-only-until-official-verdict',receipt:found,candidates};
}
// Runs inside the official OJ webContents only after navigation to an official
// page. No credentials, cookies or source code are read.
function submissionCandidatesScript(platform){
 return `(()=>{const platform=${JSON.stringify(platform)};
   const anchors=[...document.querySelectorAll('a[href*="/submission/"],a[href*="/submissions/"],a[href*="/record/"]')].slice(0,120);
   const result=[];const seen=new Set();
   for(const a of anchors){
     const row=a.closest('tr,[data-submission-id],article,li');if(!row)continue;
     const href=a.href;if(!href||seen.has(href))continue;
     const p=[...row.querySelectorAll('a[href*="/problem/"],a[href*="/tasks/"]')].map(x=>x.href).find(Boolean)||'';
     seen.add(href);result.push({url:href,problemUrl:p});if(result.length>=20)break;
   }
   return {pageUrl:location.href,candidates:result};
 })()`;
}
function detailProblemScript(platform){
 return `(()=>{const platform=${JSON.stringify(platform)};
   const main=document.querySelector('#main-container,main,#app,.record-detail,.submission-detail')||document.body;
   const links=[...main.querySelectorAll('a[href*="/tasks/"],a[href*="/problem/"]')].map(x=>x.href).filter(Boolean);
   return {problemUrls:[...new Set(links)].slice(0,12)};
 })()`;
}
module.exports={problemFromURL,validateDetected,decideAutoReceipt,submissionCandidatesScript,detailProblemScript,WINDOW_MS};
