'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const zlib=require('node:zlib');
const {promisify}=require('node:util');
const gzip=promisify(zlib.gzip),gunzip=promisify(zlib.gunzip);
const MAX_SOURCE=300*1024,MAX_VERSIONS=32;
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function keyForFile(identity){
 if(typeof identity!=='string'||!identity||identity.length>2000)throw Error('文件标识无效');
 return hash(identity.replace(/\\/g,'/').toLowerCase());
}
function safeLabel(label){return String(label||'自动快照').replace(/[\x00-\x1f<>]/g,'').slice(0,80);}
function createStore(base){
 const baseDir=path.resolve(base);const locks=new Map();
 async function serialized(key,fn){const prev=locks.get(key)||Promise.resolve();const next=prev.catch(()=>{}).then(fn);locks.set(key,next);try{return await next;}finally{if(locks.get(key)===next)locks.delete(key);}}
 function folder(identity){return path.join(baseDir,keyForFile(identity));}
 async function index(dir){try{const list=JSON.parse(await fs.readFile(path.join(dir,'index.json'),'utf8'));return Array.isArray(list)?list:[];}catch(e){if(e.code==='ENOENT')return [];throw e;}}
 async function commit(identity,content,label='自动快照'){
  if(typeof content!=='string'||Buffer.byteLength(content)>MAX_SOURCE)throw Error('快照源码不可用或过大');
  const id=keyForFile(identity),dir=path.join(baseDir,id);
  return serialized(id,async()=>{
   await fs.mkdir(dir,{recursive:true});let list=await index(dir);const contentHash=hash(content);
   if(list[0]?.sha===contentHash)return {created:false,entry:list[0]};
   const original=Buffer.from(content,'utf8');const packed=await gzip(original,{level:6});
   const compression=packed.length<original.length?'gzip':'plain';
   const entry={id:crypto.randomUUID(),createdAt:new Date().toISOString(),label:safeLabel(label),sha:contentHash,bytes:original.length,storedBytes:compression==='gzip'?packed.length:original.length,compression};
   const file=path.join(dir,entry.id+(compression==='gzip'?'.cpp.gz':'.cpp'));
   await fs.writeFile(file,compression==='gzip'?packed:original,{flag:'wx'});
   list=[entry,...list];const removed=list.splice(MAX_VERSIONS);
   const temp=path.join(dir,'index-'+process.pid+'.tmp');await fs.writeFile(temp,JSON.stringify(list),'utf8');await fs.rename(temp,path.join(dir,'index.json'));
   await Promise.all(removed.map(x=>fs.rm(path.join(dir,x.id+(x.compression==='gzip'?'.cpp.gz':'.cpp')),{force:true}))); 
   return {created:true,entry};
  });
 }
 async function list(identity){const dir=folder(identity);return (await index(dir)).map(x=>({...x}));}
 async function read(identity,version){if(typeof version!=='string'||!/^[0-9a-f-]{36}$/i.test(version))throw Error('非法版本 ID');const dir=folder(identity),list=await index(dir);const item=list.find(x=>x.id===version);if(!item)throw Error('历史版本已不存在');const data=await fs.readFile(path.join(dir,version+(item.compression==='gzip'?'.cpp.gz':'.cpp')));const content=item.compression==='gzip'?(await gunzip(data)).toString('utf8'):data.toString('utf8');if(hash(content)!==item.sha)throw Error('历史记录校验失败');return {entry:item,content};}
 async function migrate(oldIdentity,newIdentity){
  if(oldIdentity===newIdentity)return false;const src=folder(oldIdentity),dst=folder(newIdentity);
  try{await fs.access(src);}catch{return false;}
  try{await fs.access(dst);return false;}catch{}
  await fs.mkdir(baseDir,{recursive:true});await fs.rename(src,dst);return true;
 }
 return {commit,list,read,migrate};
}
module.exports={createStore,keyForFile};
