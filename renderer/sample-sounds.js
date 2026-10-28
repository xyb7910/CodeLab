'use strict';
// Offline audio feedback. No network requests, media files, or external packages.
// A single verdict is emitted once per completed sample batch, never per case.
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.YanpbSampleSounds=api;
})(typeof window!=='undefined'?window:null,function(){
 const normalizeSettings=(settings={})=>({
   enabled:settings.enabled!==false,
   volume:Math.min(100,Math.max(0,Number.isFinite(Number(settings.volume))?Number(settings.volume):35))
 });
 function verdict(result){
   if(!result||result.stage==='compile'||!Array.isArray(result.results)||result.results.length===0)return null;
   const states=result.results.map(x=>String(x?.status||'').toUpperCase());
   // A single WA wins over other non-AC verdicts: show one failure cue at end.
   if(states.includes('WA'))return 'wa';
   if(states.every(x=>x==='OK'))return 'ac';
   return null; // CE / TLE / RE / OLE: no misleading AC or WA sound
 }
 const SEQUENCES=Object.freeze({
   ac:[{frequency:587.33,duration:.09},{frequency:783.99,duration:.11},{frequency:1174.66,duration:.17}],
   wa:[{frequency:349.23,duration:.14},{frequency:261.63,duration:.19}]
 });
 function makePlayer({AudioContextClass,now=()=>Date.now(),minGap=600}={}){
   let ctx=null,previous=0;
   // Call during the sample-test button/keyboard event. Browsers may block
   // AudioContext created only after asynchronous compilation has finished.
   function arm(options={}){
     const settings=normalizeSettings(options);
     if(!settings.enabled||!settings.volume)return false;
     const Ctor=AudioContextClass||((typeof window!=='undefined')&&(window.AudioContext||window.webkitAudioContext));
     if(typeof Ctor!=='function')return false;
     try{
       if(!ctx)ctx=new Ctor();
       if(ctx.state==='suspended'){
         const p=ctx.resume();
         if(p&&typeof p.catch==='function')p.catch(()=>{});
       }
       return true;
     }catch{return false;}
   }
   async function play(kind,options={}){
     const settings=normalizeSettings(options);
     if(!settings.enabled||!settings.volume||!Object.hasOwn(SEQUENCES,kind))return false;
     if(now()-previous<minGap)return false;
     if(!arm(settings))return false;
     try{
       if(ctx.state==='suspended')await ctx.resume();
       const start=ctx.currentTime+.015,master=ctx.createGain();
       master.gain.value=settings.volume/100*.10;
       master.connect(ctx.destination);
       let offset=0;
       for(const note of SEQUENCES[kind]){
         const o=ctx.createOscillator(),env=ctx.createGain();
         o.type=kind==='ac'?'sine':'triangle';o.frequency.value=note.frequency;
         o.connect(env);env.connect(master);
         const t=start+offset;
         env.gain.setValueAtTime(0.0001,t);
         env.gain.exponentialRampToValueAtTime(.9,t+.018);
         env.gain.exponentialRampToValueAtTime(.0001,t+note.duration);
         o.start(t);o.stop(t+note.duration+.008);
         offset+=note.duration;
       }
       previous=now();return true;
     }catch{return false;}
   }
   async function close(){if(ctx&&typeof ctx.close==='function')await ctx.close().catch(()=>{});ctx=null;previous=0;}
   return {arm,play,close};
 }
 return {verdict,normalizeSettings,makePlayer,SEQUENCES};
});
