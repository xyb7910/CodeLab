'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YanpbTemplates=api;})(typeof window!=='undefined'?window:globalThis,()=>{
 const max=120;
 function sanitize(item){
  if(!item||typeof item!=='object')throw Error('Invalid template');
  const name=String(item.name||'').trim(),category=String(item.category||'自定义').trim();
  const shortcut=String(item.shortcut||'').trim().toLowerCase();
  const code=String(item.code??'');
  if(!name||name.length>72)throw Error('Template name must be 1–72 characters');
  if(!category||category.length>40)throw Error('Category must be 1–40 characters');
  if(!/^[a-z][a-z0-9_]{0,23}$/.test(shortcut))throw Error('Shortcut must use lowercase a-z, 0-9 and _; start with a letter');
  if(!code||code.length>30000)throw Error('Template code must be 1–30000 characters');
  return {name,category,shortcut,code};
 }
 function insertOrUpdate(list,data,id){
  const v=sanitize(data),out=[...list];
  if(out.some(t=>t.shortcut===v.shortcut&&t.id!==id))throw Error('Shortcut is already used');
  if(out.some(t=>t.name.toLowerCase()===v.name.toLowerCase()&&t.id!==id))throw Error('Template name already exists');
  if(id){const idx=out.findIndex(t=>t.id===id);if(idx<0)throw Error('Template not found');out[idx]={...out[idx],...v};}
  else {if(out.length>=max)throw Error('Template library limit reached');out.push({...v,id:'user-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7)});}
  return out;
 }
 function remove(list,id){if(!list.some(x=>x.id===id))throw Error('Template not found');return list.filter(t=>t.id!==id);}
 function expandAbbreviation(line,cursor,list){
  const prefix=String(line).slice(0,cursor),match=prefix.match(/[a-z][a-z0-9_]*$/);
  if(!match)return null;
  const item=list.find(t=>t.shortcut===match[0]);
  return item?{start:cursor-match[0].length,end:cursor,code:item.code,id:item.id}:null;
 }
 return {sanitize,insertOrUpdate,remove,expandAbbreviation};
});
