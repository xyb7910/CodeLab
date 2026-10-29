'use strict';
// Public website adapter metadata; browser authentication always belongs to the OJ.
const {routeProblem,sourcePayload}=require('./submit-bridge.cjs');
const STATUS_RE=/\b(AC|WA|TLE|MLE|RE|CE|OLE|PE|IE|UKE|WJ|Judging|Pending|Testing|In queue|Accepted|Wrong Answer|Time Limit Exceeded|Memory Limit Exceeded|Runtime Error|Compilation Error|Compile Error|Running|Waiting(?: for Judging)?|Partially Correct|System Error|Internal Error|Output Limit Exceeded|Idleness Limit Exceeded|Security Violated|Skipped|Rejected|Failed|Challenged)\b/i;
const PLATFORMS=Object.freeze({
 codeforces:{hosts:['codeforces.com','www.codeforces.com'],account:'Codeforces handle',method:'official-public-api'},
 atcoder:{hosts:['atcoder.jp','www.atcoder.jp'],account:'AtCoder browser login',method:'official-detail-page'},
 luogu:{hosts:['www.luogu.com.cn','luogu.com.cn'],account:'Luogu browser login',method:'official-detail-page'}
});
function officialHost(platform,raw){
 const p=PLATFORMS[platform];if(!p)return false;
 try{const u=new URL(raw);return u.protocol==='https:'&&p.hosts.includes(u.hostname)&&!u.username&&!u.password&&!u.port;}catch{return false;}
}
function validOfficialNavigation(platform,url){
 if(officialHost(platform,url))return true;
 // Do not silently follow a third-party login, OAuth or captcha origin inside a privileged view.
 return false;
}
function asOfficialLink(platform,input){
 if(!officialHost(platform,input))throw Error('提交链接的域名与当前 OJ 不一致');
 const u=new URL(input),p=u.pathname;
 if(platform==='codeforces'){
  const m=p.match(/^\/(?:contest|gym)\/(\d+)\/submission\/(\d+)\/?$/)||p.match(/^\/problemset\/submission\/(\d+)\/(\d+)\/?$/);
  if(!m)throw Error('Codeforces 需要具体的官方提交记录 URL');
  return {platform,contestId:Number(m[1]),id:m[2],url:u.origin+p};
 }
 if(platform==='atcoder'){
  const m=p.match(/^\/contests\/([a-zA-Z0-9_-]+)\/submissions\/(\d+)\/?$/);
  if(!m)throw Error('AtCoder 需要具体的 submissions/数字 详情页');
  return {platform,contestId:m[1],id:m[2],url:u.origin+p};
 }
 if(platform==='luogu'){
  const m=p.match(/^\/record\/(\d+)\/?$/);
  if(!m)throw Error('洛谷需要具体的 record/数字 详情页');
  return {platform,id:m[1],url:u.origin+p};
 }
 throw Error('未支持的平台');
}
function normalizeOfficialStatus(text){
 if(typeof text!=='string')return null;
 const s=text.replace(/\s+/g,' ').trim().slice(0,160);
 if(!s||!STATUS_RE.test(s))return null;
 for(const [re,value] of [[/\b(AC|Accepted)\b/i,'AC'],[/\b(WA|Wrong Answer)\b/i,'WA'],[/\b(TLE|Time Limit Exceeded)\b/i,'TLE'],[/\b(MLE|Memory Limit Exceeded)\b/i,'MLE'],[/\b(RE|Runtime Error)\b/i,'RE'],[/\b(CE|Compilation Error|Compile Error)\b/i,'CE'],[/\b(OLE|Output Limit Exceeded)\b/i,'OLE'],[/\b(PE)\b/i,'PE'],[/\b(Pending|Judging|Testing|In queue|Running|Waiting(?: for Judging)?|WJ)\b/i,'PENDING'],[/\b(Partially Correct)\b/i,'PARTIAL'],[/\b(IE|System Error|Internal Error)\b/i,'IE'],[/\b(UKE)\b/i,'UKE'],[/\b(Idleness Limit Exceeded)\b/i,'IDLENESS'],[/\b(Security Violated)\b/i,'SECURITY'],[/\b(Skipped)\b/i,'SKIPPED'],[/\b(Rejected)\b/i,'REJECTED'],[/\b(Failed)\b/i,'FAILED'],[/\b(Challenged)\b/i,'CHALLENGED']])if(re.test(s))return value;
 return 'UNKNOWN';
}
function readCodeforcesRecord(json,submissionId,contestId){
 if(json?.status!=='OK'||!Array.isArray(json.result))throw Error('Codeforces API 未提供有效结果');
 const found=json.result.find(x=>String(x.id)===String(submissionId)&&(!contestId||x.contestId===Number(contestId)));
 if(!found)return null;
 const map={OK:'AC',WRONG_ANSWER:'WA',TIME_LIMIT_EXCEEDED:'TLE',MEMORY_LIMIT_EXCEEDED:'MLE',RUNTIME_ERROR:'RE',COMPILATION_ERROR:'CE',PARTIAL:'PARTIAL',CHALLENGED:'CHALLENGED',SKIPPED:'SKIPPED'};
 const verdict=found.verdict||'PENDING'; // testset is not a verdict
 return {platform:'codeforces',id:String(found.id),contestId:found.contestId,verdict:map[verdict]||verdict,rawVerdict:verdict,passedTests:found.passedTestCount??null,timeMs:found.timeConsumedMillis??null,memoryBytes:found.memoryConsumedBytes??null,problem:found.problem?.index||'',confirmed:true};
}
function validateHandle(handle){if(typeof handle!=='string'||! /^[A-Za-z0-9_.-]{3,24}$/.test(handle))throw Error('Codeforces handle 格式不正确');return handle;}
async function pollCodeforces(handle,detail,fetcher=fetch){
 validateHandle(handle);if(detail.platform!=='codeforces'||!/^\d+$/.test(String(detail.id)))throw Error('无效 Codeforces 提交记录');
 const url=new URL('https://codeforces.com/api/user.status');
 url.searchParams.set('handle',handle);url.searchParams.set('from','1');url.searchParams.set('count','100');
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
 try{const response=await fetcher(url.toString(),{signal:controller.signal,headers:{Accept:'application/json'}});
  if(!response.ok)throw Error('Codeforces API HTTP '+response.status);
  const obj=await response.json();return readCodeforcesRecord(obj,detail.id,detail.contestId);
 }finally{clearTimeout(timer);}
}
module.exports={PLATFORMS,sourcePayload,routeProblem,officialHost,validOfficialNavigation,asOfficialLink,normalizeOfficialStatus,readCodeforcesRecord,validateHandle,pollCodeforces};
