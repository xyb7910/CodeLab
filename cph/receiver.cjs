'use strict';
const http = require('node:http');
const MAX_BYTES = 1024 * 1024;
function normCase(x, i) {
  if (!x || typeof x !== 'object') throw new Error('Invalid testcase '+(i+1));
  const input = x.input, output = x.output ?? x.expected;
  if (typeof input !== 'string' || typeof output !== 'string' || Buffer.byteLength(input)>180000 || Buffer.byteLength(output)>180000) throw new Error('Testcase input/output too large or invalid');
  return {name:'Sample '+(i+1),input,expected:output};
}
function parseProblem(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid Competitive Companion payload');
  const title = String(body.name||body.title||'Untitled Problem').trim().slice(0,140);
  if (!Array.isArray(body.tests) || body.tests.length>40) throw new Error('Expected 0 to 40 sample tests');
  const url = typeof body.url==='string' && body.url.length<2000 && /^https?:\/\//i.test(body.url) ? body.url : '';
  return {name:title,group:String(body.group||'').slice(0,160),url,tests:body.tests.map(normCase),timeLimit:typeof body.timeLimit==='number'?body.timeLimit:null};
}
function validOrigin(origin){return !origin || /^chrome-extension:\/\/[a-z]{32}$/i.test(origin) || /^moz-extension:\/\/[a-f0-9-]{36}$/i.test(origin);}
function createReceiver(onProblem, port=10043) {
  let attempts=[], server, ipv6Server;
  async function handler(req,res) {
    const origin=req.headers.origin;
    if(!validOrigin(origin)){res.writeHead(403);return res.end('Origin not allowed');}
    const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
    if(origin) {headers['Access-Control-Allow-Origin']=origin;headers['Vary']='Origin';}
    if(req.method==='OPTIONS'){res.writeHead(204,{...headers,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'300'});return res.end();}
    if(req.method!=='POST'||req.url!=='/'){res.writeHead(404,headers);return res.end(JSON.stringify({error:'Use POST /'}));}
    const now=Date.now();attempts=attempts.filter(t=>now-t<60000);if(attempts.length>=60){res.writeHead(429,headers);return res.end(JSON.stringify({error:'Rate limit'}));}attempts.push(now);
    const chunks=[];let size=0;
    try {
      for await(const chunk of req){size+=chunk.length;if(size>MAX_BYTES){req.destroy();return;}chunks.push(chunk);}
      const payload=JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const problem=parseProblem(payload);
      await onProblem(problem);
      res.writeHead(200,headers);res.end(JSON.stringify({ok:true}));
    }catch(err){if(!res.headersSent){res.writeHead(400,headers);res.end(JSON.stringify({error:String(err.message).slice(0,200)}));}}
  }
  server=http.createServer(handler);
  return {
    async start(){
      if(server.listening)return server.address().port;
      await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',()=>{server.off('error',reject);resolve();});});
      // Browsers may resolve localhost to ::1. This listener is loopback-only.
      if(port!==0){
        ipv6Server=http.createServer(handler);
        try{await new Promise((resolve,reject)=>{ipv6Server.once('error',reject);ipv6Server.listen(port,'::1',()=>{ipv6Server.off('error',reject);resolve();});});}
        catch{ipv6Server.close();ipv6Server=null;}
      }
      return server.address().port;
    },
    async stop(){await Promise.all([server,ipv6Server].filter(s=>s?.listening).map(s=>new Promise(resolve=>s.close(resolve))));ipv6Server=null;},
    get listening(){return server.listening;},
    get port(){return server.address()?.port||port;}
  };
}
module.exports={createReceiver,parseProblem,validOrigin};
