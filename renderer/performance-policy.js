'use strict';
/* Small pure policy shared by the UI and automated tests. */
(function(root){
 const MODES=['smart','always','off'];
 function normalizeMode(value){return MODES.includes(value)?value:'smart';}
 function plan(value){
  const mode=normalizeMode(value);
  return {mode,autoStart:mode==='always',autoSleep:mode==='smart',
    debounceMs:850,idleMs:120000,hiddenMs:12000};
 }
 const api={normalizeMode,plan};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.YanpbPerformancePolicy=api;
})(typeof window!=='undefined'?window:globalThis);
