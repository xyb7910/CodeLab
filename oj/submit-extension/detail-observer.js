'use strict';
// Runs only inside a user-opened official submission detail tab.
// Watches dynamic status text updates; never reads account credentials.
if(!window.__yanpbOJDetailObserver){
  window.__yanpbOJDetailObserver=true;
  let timer=null,lastMessageAt=0;
  const observer=new MutationObserver(()=>{
    if(timer)return;
    timer=setTimeout(()=>{
      timer=null;
      if(Date.now()-lastMessageAt<900)return;
      lastMessageAt=Date.now();
      try{chrome.runtime.sendMessage({op:'page-verdict-changed'}).catch(()=>{});}catch{}
    },1100);
  });
  observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  window.addEventListener('pagehide',()=>{observer.disconnect();if(timer)clearTimeout(timer);},{once:true});
}
