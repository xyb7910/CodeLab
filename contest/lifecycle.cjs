'use strict';
// Pure, predictable persisted timer model. Paused time is excluded from elapsed.
const VALID=new Set(['ready','running','paused','finished']);
function normalize(manifest){
 const m={...manifest};
 if(!VALID.has(m.status)){
  // Old v3.8 projects started counting at creation.
  m.status=Number.isFinite(m.startedAt)?'running':'ready';
  m.elapsedBeforeMs=0;
 }
 m.elapsedBeforeMs=Math.max(0,Number(m.elapsedBeforeMs)||0);
 if(m.status==='ready')m.startedAt=null;
 return m;
}
function elapsedMs(manifest,now=Date.now()){
 const m=normalize(manifest);
 const segment=m.status==='running'&&Number.isFinite(m.startedAt)?Math.max(0,now-m.startedAt):0;
 return Math.min(m.duration*60000,m.elapsedBeforeMs+segment);
}
function remainingMs(m,now=Date.now()){return Math.max(0,Number(m.duration||0)*60000-elapsedMs(m,now));}
function transition(manifest,event,now=Date.now()){
 const m=normalize(manifest);
 if(!Number.isFinite(now)||now<0)throw Error('Invalid time');
 if(!['start','pause','resume','finish'].includes(event))throw Error('Unsupported contest action');
 if(m.status==='finished')throw Error('Contest already finished; results are read-only');
 if(event==='start'&&m.status!=='ready')throw Error('Contest has already started');
 if(event==='pause'&&m.status!=='running')throw Error('Only running contests can be paused');
 if(event==='resume'&&m.status!=='paused')throw Error('Only paused contests can resume');
 if(event==='resume'&&remainingMs(m,now)===0)throw Error('Contest time expired');
 if(event==='finish'&&m.status==='ready')throw Error('Start the contest before finishing');
 const prev=m.status;
 if(prev==='running')m.elapsedBeforeMs=elapsedMs(m,now);
 if(event==='start'){m.elapsedBeforeMs=0;m.startedAt=now;m.status='running';m.firstStartedAt=now;}
 if(event==='pause'){m.startedAt=null;m.status='paused';}
 if(event==='resume'){m.startedAt=now;m.status='running';}
 if(event==='finish'){m.startedAt=null;m.status='finished';m.finishedAt=now;}
 return m;
}
module.exports={normalize,elapsedMs,remainingMs,transition};
