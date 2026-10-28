'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const sounds=require('../renderer/sample-sounds.js');

test('only real completed sample batches can trigger AC or WA',()=>{
 assert.equal(sounds.verdict(null),null);
 assert.equal(sounds.verdict({stage:'compile',status:'CE',results:[{status:'WA'}]}),null);
 assert.equal(sounds.verdict({stage:'run',status:'OK',results:[]}),null);
 assert.equal(sounds.verdict({stage:'run',status:'OK',results:[{status:'OK'},{status:'OK'}]}),'ac');
 assert.equal(sounds.verdict({stage:'run',status:'WA',results:[{status:'OK'},{status:'WA'},{status:'WA'}]}),'wa');
 assert.equal(sounds.verdict({status:'TLE',results:[{status:'TLE'}]}),null);
 assert.equal(sounds.verdict({status:'RE',results:[{status:'RE'}]}),null);
 assert.equal(sounds.verdict({status:'COMPILED',results:[]}),null);
});

test('sound preference defaults and volume range are safe',()=>{
 assert.deepEqual(sounds.normalizeSettings(),{enabled:true,volume:35});
 assert.deepEqual(sounds.normalizeSettings({enabled:false,volume:999}),{enabled:false,volume:100});
 assert.deepEqual(sounds.normalizeSettings({volume:-5}),{enabled:true,volume:0});
 assert.deepEqual(sounds.normalizeSettings({volume:'oops'}),{enabled:true,volume:35});
});

test('AudioContext is lazy; muted, disabled and missing API never allocate audio',async()=>{
 let allocated=0;
 class AudioContext {constructor(){allocated++;}}
 const player=sounds.makePlayer({AudioContextClass:AudioContext});
 assert.equal(await player.play('ac',{enabled:false}),false);
 assert.equal(await player.play('wa',{volume:0}),false);
 assert.equal(await player.play('unknown',{enabled:true}),false);
 assert.equal(player.arm({enabled:false}),false);
 assert.equal(allocated,0);
 assert.equal(await sounds.makePlayer({AudioContextClass:null}).play('ac',{enabled:false}),false);
});

test('one short cue uses oscillator notes; consecutive rapid cues are suppressed',async()=>{
 let allocated=0,played=0,stopped=0,closed=0,time=1000;
 class FakeGain{constructor(){this.gain={value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}};}connect(){}}
 class FakeOsc{constructor(){this.frequency={value:0};} connect(){}start(){played++;}stop(){stopped++;}}
 class FakeAudioContext{
   constructor(){allocated++;this.currentTime=1;this.state='running';this.destination={};}
   createGain(){return new FakeGain();}createOscillator(){return new FakeOsc();}
   async close(){closed++;}
 }
 const player=sounds.makePlayer({AudioContextClass:FakeAudioContext,now:()=>time,minGap:600});
 assert.equal(player.arm({enabled:true,volume:35}),true);assert.equal(allocated,1);
 assert.equal(await player.play('ac',{enabled:true,volume:35}),true);
 assert.equal(played,3);assert.equal(stopped,3);assert.equal(allocated,1);
 assert.equal(await player.play('wa',{enabled:true,volume:35}),false);
 time+=700;
 assert.equal(await player.play('wa',{enabled:true,volume:35}),true);
 assert.equal(played,5);assert.equal(allocated,1);
 await player.close();assert.equal(closed,1);
});

test('renderer integrates audio only after all-sample judging, not ordinary Run',()=>{
 const fs=require('node:fs');const source=fs.readFileSync(require('node:path').join(__dirname,'../renderer/app.js'),'utf8');
 assert.match(source,/if\(all&&f\.content===sourceCode\)notifySampleSound\(res\)/);
 assert.match(source,/if\(all&&f\.content===sourceCode\)notifySampleSound\(result\)/);
 assert.match(source,/sampleSoundEnabled:\$\('prefSampleSound'\)\.checked/);
});
