'use strict';
/** Extract only stable IDs needed to associate an imported task with its editor tab. */
function taskIdentity(raw){
  let url;try{url=new URL(raw?.url||'');}catch{return null;}
  if(!['https:','http:'].includes(url.protocol))return null;
  const host=url.hostname.toLowerCase().replace(/^www\./,'');
  const name=String(raw?.name||'');
  let match;
  if(['codeforces.com','codeforces.ru','codeforces.net','codeforc.es'].includes(host)){
    match=url.pathname.match(/^\/(?:contest|gym)\/(\d+)\/problem\/([A-Za-z][A-Za-z0-9]*)\/?$/i)
      ||url.pathname.match(/^\/problemset\/problem\/(\d+)\/([A-Za-z][A-Za-z0-9]*)\/?$/i);
    if(match)return {platform:'codeforces',contest:match[1],task:match[2].toUpperCase(),key:`cf:${match[1]}:${match[2].toUpperCase()}`,url:url.href};
  }
  if(host==='atcoder.jp'){
    match=url.pathname.match(/^\/contests\/([A-Za-z0-9_-]+)\/tasks\/([A-Za-z0-9_-]+)\/?$/i);
    if(match){const contest=match[1].toLowerCase(),slug=match[2].toLowerCase();
      const suffix=slug.startsWith(contest+'_')?slug.slice(contest.length+1):slug;
      const task=/^[a-z]$/i.test(suffix)?suffix.toUpperCase():suffix.toUpperCase();
      return {platform:'atcoder',contest,task,key:`atcoder:${contest}:${slug}`,url:url.href};
    }
  }
  if(host==='luogu.com.cn'){
    match=url.pathname.match(/^\/problem\/([A-Za-z][A-Za-z0-9_-]*)\/?$/i);
    if(match)return {platform:'luogu',contest:'',task:match[1].toUpperCase(),key:`luogu:${match[1].toUpperCase()}`,url:url.href};
  }
  return {platform:'other',contest:'',task:name.match(/^([A-Z][A-Z0-9]*)\s*[.\-:]/)?.[1]||'',key:`url:${url.origin}${url.pathname.replace(/\/$/,'')}`,url:url.href};
}
function matchContestFile(problem,contest){
  const id=taskIdentity(problem);
  if(!id||!contest||!Array.isArray(contest.files))return null;
  if(id.platform!=='other' && contest.platform!==id.platform && !(id.platform==='codeforces'&&contest.platform==='icpc'))return null;
  // Contest identity must agree whenever a known platform contest number is available.
  const entered=String(contest.contestId||contest.ojContestId||'')
    ||(id.platform==='atcoder' && String(contest.contestName||'').toLowerCase()===id.contest?String(contest.contestName):'')
    ||(id.platform==='codeforces'&&String(contest.contestName||'').match(/(?:^|[_-])(\d{3,7})(?:$|[_-])/)?.[1]||'');
  // Without a verified contest identity, never associate tasks solely by letter.
  if(id.contest&&(!entered||id.contest.toLowerCase()!==entered.toLowerCase()))return null;
  const exact=contest.files.filter(f=>String(f.task).toUpperCase()===id.task);
  return exact.length===1?exact[0]:null;
}
function lookupExistingFile(problem,files){
  const key=taskIdentity(problem)?.key;
  if(!key)return null;
  return (files||[]).find(f=>f.problemInfo?.cphKey===key)||null;
}
const api={taskIdentity,matchContestFile,lookupExistingFile};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof window!=='undefined')window.YanpbCompanionLink=api;
