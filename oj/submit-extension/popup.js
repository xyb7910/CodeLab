'use strict';
const status=document.getElementById('status'),pairArea=document.getElementById('pairArea');
function refresh(){chrome.runtime.sendMessage({op:'status'},reply=>{if(chrome.runtime.lastError){status.textContent='后台扩展无法访问：'+chrome.runtime.lastError.message;return;}status.textContent=reply?.status||'未连接';document.getElementById('diagnostics').textContent=reply?.detail||'检查 127.0.0.1:10045 / CodeLab 授权状态。';pairArea.style.display=reply?.paired?'none':'block';});}
document.getElementById('pair').onclick=()=>{
 const pin=document.getElementById('pin').value.trim();if(!/^\d{6}$/.test(pin)){status.textContent='请输入 6 位授权码';return;}
 chrome.runtime.sendMessage({op:'pair',pin},reply=>{status.textContent=reply?.error||reply?.status||'未知状态';refresh();});
};
document.getElementById('retry').onclick=()=>chrome.runtime.sendMessage({op:'poll'},reply=>{status.textContent=reply?.error||reply?.status||'已请求检查';document.getElementById('diagnostics').textContent=reply?.detail||'';});
refresh();

chrome.storage.local.get('notifyVerdicts').then(o=>{document.getElementById('notifyVerdicts').checked=o.notifyVerdicts!==false;});
document.getElementById('notifyVerdicts').onchange=e=>void chrome.storage.local.set({notifyVerdicts:e.target.checked});

chrome.storage.local.get('lastOfficialSync').then(o=>{
 const x=o.lastOfficialSync;if(!x)return;
 const el=document.getElementById('lastOfficialSync');
 el.textContent='最近同步：'+x.platform.toUpperCase()+' · '+x.verdict+' · '+new Date(x.at).toLocaleTimeString();
});
