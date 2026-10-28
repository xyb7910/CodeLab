'use strict';
document.getElementById('fill').onclick=async()=>{
 const out=document.getElementById('result'),ticket=document.getElementById('ticket').value.trim();
 if(!/^[0-9a-f]{24}$/.test(ticket)){out.textContent='请输入 24 位配对码';return;}
 try{
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  const host=new URL(tab.url).hostname;
  if(!['codeforces.com','www.codeforces.com','atcoder.jp','www.atcoder.jp','luogu.com.cn','www.luogu.com.cn'].includes(host))throw Error('仅支持 Codeforces、AtCoder、洛谷表单；其他 OJ 请粘贴代码后手动提交');
  const r=await fetch('http://127.0.0.1:10044/claim?ticket='+encodeURIComponent(ticket),{cache:'no-store'});
  if(!r.ok)throw Error('配对码错误、已使用或已过期');
  const source=await r.json();
  if((source.platform==='codeforces'&&!host.includes('codeforces.com'))||(source.platform==='atcoder'&&!host.includes('atcoder.jp'))||(source.platform==='luogu'&&!host.includes('luogu.com.cn')))throw Error('当前页面与题目平台不一致');
  const result=await chrome.scripting.executeScript({target:{tabId:tab.id},func:fillOfficialForm,args:[source],world:'MAIN'});
  out.textContent=result[0]?.result||'无法确定填入状态，请手动粘贴';
 }catch(e){out.textContent='未完成：'+e.message;}
};
function fillOfficialForm(source){
 const platform=source.platform;
 // Use real form elements only; never submit, click submit, or extract credentials.
 const selector=platform==='codeforces'?'textarea[name="source"],textarea[name="sourceCode"],textarea#source,textarea':platform==='atcoder'?'textarea#plain-textarea,textarea[name="sourceCode"],textarea#sourceCode,textarea':'textarea[name="code"],textarea#code,textarea';
 const ta=document.querySelector(selector);
 const cm=document.querySelector('.CodeMirror')?.CodeMirror;
 // Codeforces/AtCoder may use CodeMirror, whose internal document is not
 // synchronized by assigning to the hidden textarea alone.
 if(cm&&typeof cm.setValue==='function'){
  cm.setValue(source.code);cm.focus();
  return '已将源码放入网站 CodeMirror 编辑器。请核对题号与语言后自行确认提交。';
 }
 if(!ta)return '未找到可编辑源码文本框：请在 CodeLab 复制代码并自行粘贴；某些网站使用 Monaco 等编辑器。';
 const proto=window.HTMLTextAreaElement.prototype,setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;
 if(setter)setter.call(ta,source.code);else ta.value=source.code;
 ta.dispatchEvent(new Event('input',{bubbles:true}));ta.dispatchEvent(new Event('change',{bubbles:true}));
 if(platform==='atcoder'&&source.problemId){const sel=document.querySelector('select[name="data.TaskScreenName"],select#select-task');if(sel){const op=[...sel.options].find(x=>x.value===source.problemId);if(op){sel.value=op.value;sel.dispatchEvent(new Event('change',{bubbles:true}));}}}
 if(platform==='codeforces'&&source.problemId){const idx=source.problemId.split('/')[1];const sel=document.querySelector('select[name="submittedProblemIndex"]');if(sel){const op=[...sel.options].find(x=>x.value===idx);if(op){sel.value=idx;sel.dispatchEvent(new Event('change',{bubbles:true}));}}}
 ta.focus();return '已尝试填入源码，请检查题号、编译器语言和代码，再亲自点击 OJ 提交按钮。';
}
