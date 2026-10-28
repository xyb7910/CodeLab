'use strict';
const http=require('node:http');
const crypto=require('node:crypto');
const PORT=10044,MAX_SOURCE=250000,TTL_MS=3*60*1000;
const PORTAL_HOSTS=Object.freeze({
 'codeforces.com':'codeforces', 'www.codeforces.com':'codeforces',
 'atcoder.jp':'atcoder','www.atcoder.jp':'atcoder',
 'luogu.com.cn':'luogu','www.luogu.com.cn':'luogu'
});
function safeURL(url){try{const u=new URL(url);if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.port||u.hostname==='localhost')return null;return u;}catch{return null;}}
function routeProblem(raw){
 const u=safeURL(raw);if(!u)throw Error('无效的题目 URL');const platform=PORTAL_HOSTS[u.hostname]||'other';
 if(platform==='codeforces'){
  const m=u.pathname.match(/^\/(?:contest|gym)\/(\d+)\/problem\/([A-Za-z][A-Za-z0-9]*)\/?$/)||u.pathname.match(/^\/problemset\/problem\/(\d+)\/([A-Za-z][A-Za-z0-9]*)\/?$/);
  if(m){const gym=u.pathname.startsWith('/gym');return {platform,problemId:m[1]+'/'+m[2],url:`https://codeforces.com/${gym?'gym':'contest'}/${m[1]}/submit`,supported:true};}
 }
 if(platform==='atcoder'){
  const m=u.pathname.match(/^\/contests\/([a-zA-Z0-9_\-]+)\/tasks\/([a-zA-Z0-9_\-]+)\/?$/);
  if(m)return {platform,problemId:m[2],url:`https://atcoder.jp/contests/${m[1]}/submit`,supported:true};
 }
 if(platform==='luogu'){
  const m=u.pathname.match(/^\/problem\/(P\d+|B\d+|U\d+|T\d+)\/?$/i);
  if(m)return {platform,problemId:m[1],url:`https://www.luogu.com.cn/problem/${m[1]}`,supported:true};
 }
 // Preserve source link for 100+ Companion parsers, but never synthesize arbitrary submit URLs.
 return {platform,problemId:'',url:u.toString(),supported:false};
}
function sourcePayload({url,code,filename='main.cpp'}){
 if(typeof code!=='string'||!code.trim()||Buffer.byteLength(code,'utf8')>MAX_SOURCE)throw Error('Code must be 1–250 KB');
 const route=routeProblem(url);return {...route,code,filename:String(filename).slice(0,128)};
}
function createSubmitBridge(port=PORT){
 let pending=null,server=null;
 function clear(){pending=null;}
 const handler=(req,res)=>{
  const origin=req.headers.origin||'';
  const authorized=/^chrome-extension:\/\/[a-p]{32}$/.test(origin)||/^moz-extension:\/\/[a-f0-9-]{36}$/.test(origin);
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  if(authorized){headers['Access-Control-Allow-Origin']=origin;headers.Vary='Origin';}
  if(req.method==='OPTIONS'){
   res.writeHead(authorized?204:403,{...headers,'Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,OPTIONS'});return res.end();
  }
  if(!authorized){res.writeHead(403,headers);return res.end(JSON.stringify({error:'Only the browser extension can claim prepared source'}));}
  const u=new URL(req.url||'/',`http://127.0.0.1:${port}`);
  if(req.method!=='GET'||u.pathname!=='/claim'){res.writeHead(404,headers);return res.end('{}');}
  if(!pending||pending.deadline<Date.now()){clear();res.writeHead(410,headers);return res.end(JSON.stringify({error:'No pending submission / expired'}));}
  const ticket=u.searchParams.get('ticket')||'';
  const candidate=Buffer.from(ticket),secret=Buffer.from(pending.ticket);
  if(candidate.length!==secret.length||!crypto.timingSafeEqual(candidate,secret)){res.writeHead(403,headers);return res.end(JSON.stringify({error:'Invalid pairing code'}));}
  const payload=pending.payload;clear();res.writeHead(200,headers);res.end(JSON.stringify(payload));
 };
 server=http.createServer(handler);
 return {async start(){if(server.listening)return server.address().port;await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',()=>{server.off('error',reject);resolve();});});return server.address().port;},
  prepare(payload){const data=sourcePayload(payload),ticket=crypto.randomBytes(12).toString('hex');pending={payload:data,ticket,deadline:Date.now()+TTL_MS};return {ticket,url:data.url,platform:data.platform,supported:data.supported,expiresIn:180,port:server.address()?.port||port};},
  async stop(){clear();if(!server.listening)return;await new Promise(resolve=>server.close(resolve));},get listening(){return server.listening;}};
}
module.exports={PORT,PORTAL_HOSTS,routeProblem,sourcePayload,createSubmitBridge};
