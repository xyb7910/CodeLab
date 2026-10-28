'use strict';
(function(g){
 const defaults=[
  {id:'builtin-debug',title:'解释编译错误',category:'调试',body:'请解释下面 C++17 编译错误，先指出根因和出错位置，再给出最小修改建议，不要直接重写整份代码。\n文件：{file}\n错误：{errors}\n代码：\n{code}'},
  {id:'builtin-complexity',title:'复杂度与优化',category:'分析',body:'分析下列 C++17 代码的时间和空间复杂度，检查边界、溢出风险，并给出可验证的优化建议。\n{code}'},
  {id:'builtin-hint',title:'竞赛解题提示（不剧透）',category:'教学',body:'针对当前竞赛题目，给我循序渐进的提示而不是完整答案。任务：{task}\n相关代码：{selection}\n完整代码：{code}'},
  {id:'builtin-review',title:'检查正确性',category:'审查',body:'请检查算法正确性，提供反例或证明思路，尤其注意边界。\n{code}'}
 ];
 function clean(p){if(!p||typeof p!=='object')throw Error('提示词格式错误');const title=String(p.title||'').trim(),body=String(p.body||'').trim();if(!title||title.length>80)throw Error('标题长度应为 1–80');if(!body||body.length>10000)throw Error('提示词长度应为 1–10000');return {id:typeof p.id==='string'?p.id:'',title,category:String(p.category||'自定义').slice(0,40),body};}
 function normalize(items){const result=[];for(const item of Array.isArray(items)?items:defaults){try{const p=clean(item);p.id=p.id||'prompt-'+Date.now()+'-'+result.length;if(result.some(x=>x.id===p.id))continue;result.push(p);}catch{}if(result.length===50)break;}return result;}
 function upsert(items,raw,id){const p=clean({...raw,id:id||raw.id});const existing=normalize(items);if(!p.id)p.id='prompt-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);const index=existing.findIndex(x=>x.id===p.id);if(index>=0)existing[index]=p;else{if(existing.length>=50)throw Error('最多保存 50 条提示词');existing.push(p);}return existing;}
 function remove(items,id){return normalize(items).filter(x=>x.id!==id);}
 // Replacement never evaluates JavaScript or invokes an LLM. Unknown placeholders are preserved.
 function expand(prompt,ctx){const text=clean(prompt).body;return text.replace(/\{(code|selection|errors|file|task)\}/g,(_,name)=>String(ctx?.[name]??''));}
 g.YanpbEditorPrompts={defaults,normalize,upsert,remove,expand};
})(typeof window!=='undefined'?window:globalThis);
