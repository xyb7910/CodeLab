'use strict';
// Pure DOM reader; executes on the official OJ page, never accesses cookies,
// passwords or submission buttons. No status is reported without one unambiguous
// problem URL and an independently identifiable status cell.
function inspectVerdictPage(){
 const h=location.hostname.toLowerCase();
 const platform=['atcoder.jp','www.atcoder.jp'].includes(h)?'atcoder':['www.luogu.com.cn','luogu.com.cn'].includes(h)?'luogu':null;
 if(!platform)return null;
 const normalize=s=>(s||'').replace(/\s+/g,' ').trim();
 const accepted=/^(?:AC|WA|TLE|MLE|RE|CE|OLE|PE|WJ|Judging|Pending|Accepted|Wrong Answer|Time Limit Exceeded|Memory Limit Exceeded|Runtime Error|Compilation Error|Compile Error|Output Limit Exceeded|Running|Waiting|Partially Correct)$/i;
 const statuses=[];
 function consider(node){if(!node)return;const val=normalize(node.textContent);if(accepted.test(val))statuses.push(val);}
 document.querySelectorAll('#judge-status,[data-submission-status],.judge-status,.submission-status,.record-status').forEach(consider);
 // AtCoder normally renders the verdict in the Status row of the details table.
 for(const cell of document.querySelectorAll('th,td,dt')){
  if(!/^(?:Status|Judge Status|Result|判定|评测状态|状态)$/i.test(normalize(cell.textContent)))continue;
  const next=cell.nextElementSibling;if(next){const nodes=[next,...next.querySelectorAll('span,.label')];nodes.forEach(consider);}
 }
 const distinct=[...new Set(statuses)];if(distinct.length!==1)return null;
 const links=[];
 const target=platform==='atcoder'?/^\/contests\/[a-zA-Z0-9_-]+\/tasks\/[a-zA-Z0-9_-]+\/?$/:/^\/problem\/[A-Za-z0-9_-]+\/?$/;
 // Prefer the task/problem row, not the global navigation bar listing other tasks.
 const key=/^(?:Task|Problem|题目|问题)$/i;
 for(const cell of document.querySelectorAll('th,td,dt')){
  if(!key.test(normalize(cell.textContent)))continue;
  const sibling=cell.nextElementSibling;
  if(sibling)for(const link of sibling.querySelectorAll('a[href]'))links.push(link.href);
 }
 if(links.length===0){
  const main=document.querySelector('#main-div,main,#app');
  if(main)for(const a of main.querySelectorAll('a[href]'))links.push(a.href);
 }
 const urls=[...new Set(links.filter(url=>{try{const u=new URL(url);return (u.hostname===h||u.hostname==='www.'+h||'www.'+u.hostname===h)&&target.test(u.pathname);}catch{return false;}}))];
 if(urls.length!==1)return null;
 return {text:distinct[0],urls,currentUrl:location.href};
}
if(typeof module!=='undefined'&&module.exports)module.exports={inspectVerdictPage};
