'use strict';
(function(root){
function key(m){return typeof m?.folder==='string'?m.folder.replace(/[\\/]+$/,'').replace(/\\/g,'/').toLowerCase():'';}
function inferMode(m){return m?.exam||['cspj','csps'].includes(m?.platform)?'oi':'icpc';}
function migrate(existing,legacy){
 const store={icpc:[],oi:[]};
 for(const mode of ['icpc','oi']) {
  const items=Array.isArray(existing?.[mode])?existing[mode]:[];
  for(const m of [...items,legacy?.[mode]].filter(Boolean)){
   const id=key(m);if(id&&!store[mode].some(x=>key(x)===id))store[mode].push(m);
  }
 }
 return store;
}
function add(registry,m,mode=inferMode(m)){
 if(!['icpc','oi'].includes(mode)||!key(m))throw Error('Invalid contest');
 const entries=registry[mode]||(registry[mode]=[]);const i=entries.findIndex(x=>key(x)===key(m));
 if(i>=0)entries.splice(i,1);entries.unshift(m);if(entries.length>25)entries.length=25;
 return registry;
}
function remove(registry,folder,mode){if(!registry[mode])return registry;registry[mode]=registry[mode].filter(x=>key(x)!==key({folder}));return registry;}
const api={key,inferMode,migrate,add,remove};if(typeof module==='object'&&module.exports)module.exports=api;else root.YanpbContestRegistry=api;
})(typeof window==='object'?window:globalThis);
