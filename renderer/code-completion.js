'use strict';
(function(root){
 const COMMON=['auto','bool','break','case','char','class','const','continue','cout','cin','decltype','double','else','false','float','for','if','int','long','main','map','pair','priority_queue','return','set','size_t','sort','string','struct','true','unordered_map','using','vector','void','while'];
 function identify(text){
  if(typeof text!=='string')return [];
  const names=new Set(COMMON);
  // Fast fallback, not a semantic parser: clangd remains the source of typed information.
  for(const m of text.matchAll(/\b(?:int|long\s+long|i64|char|bool|double|float|string|auto|size_t|vector\s*<[^;>{}]+>|map\s*<[^;>{}]+>)\s+([A-Za-z_]\w*)/g))names.add(m[1]);
  for(const m of text.matchAll(/\b(?:for\s*\(\s*(?:int|auto|i64)\s+|[,(]\s*(?:int|long|double|string|auto)\s+)([A-Za-z_]\w*)/g))names.add(m[1]);
  return [...names].sort();
 }
 function prefixAt(line,ch){const before=String(line).slice(0,ch);const m=before.match(/[A-Za-z_]\w*$/);return m?m[0]:'';}
 function fallback(code,line,ch){const prefix=prefixAt(line,ch);if(!prefix)return [];
  return identify(code).filter(x=>x.startsWith(prefix)&&x!==prefix).slice(0,40).map(x=>({label:x,insertText:x,detail:'本地词法提示',kind:'local'}));}
 function normalizeLsp(result,prefix){const input=Array.isArray(result)?result:result?.items||[];
  const unique=new Set();return input.slice(0,120).flatMap(it=>{
   const label=String(it?.label||'');const edit=it?.textEdit?.newText;
   const insertText=String(typeof edit==='string'?edit:it?.insertText||label).slice(0,500);
   if(!label||!insertText||unique.has(label)||label.length>170)return [];
   // Keep replacement anchored at the current identifier; drop snippets with ${...} placeholders.
   const text=insertText.replace(/\$\{\d+(?::([^}]*))?\}/g,'$1').replace(/\$\d+/g,'');
   if(prefix&&!label.toLowerCase().startsWith(prefix.toLowerCase())&&!text.toLowerCase().startsWith(prefix.toLowerCase()))return [];
   unique.add(label);return [{label,insertText:text,detail:String(it.detail||'').slice(0,200),kind:it.kind||0}];
  }).slice(0,70);
 }
 root.YanpbCodeCompletion={identify,prefixAt,fallback,normalizeLsp};
})(typeof window==='undefined'?globalThis:window);
