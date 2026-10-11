import test from 'node:test';
import assert from 'node:assert/strict';
import {BGM_LOOP_STEPS,BGM_MASTER_DB,BGM_PROGRESSION,bgmLevel,bgmStep,createBgmPlayer} from './bgm.ts';
import {dbGain} from './audio-feedback.ts';
import {DEFAULT_FEEDBACK_PREFERENCES,feedbackVolumeGain} from './feedback-preferences.ts';

function fakeContext(){
 const param=()=>({value:0,events:[] as Array<[string,number]>,setValueAtTime(v:number){this.events.push(['set',v]);},linearRampToValueAtTime(v:number){this.events.push(['linear',v]);},exponentialRampToValueAtTime(v:number){this.events.push(['exp',v]);},setTargetAtTime(v:number){this.events.push(['target',v]);},cancelScheduledValues(){}});
 const started:string[]=[];
 const node=(kind:string)=>({kind,type:'',frequency:param(),detune:param(),Q:param(),gain:param(),buffer:null as unknown,onended:null as null|(()=>void),connect(){},disconnect(){},start(){started.push(kind);},stop(){}});
 const ctx={state:'running',currentTime:0,sampleRate:8000,destination:{},createGain:()=>node('gain'),createBiquadFilter:()=>node('filter'),createOscillator:()=>node('osc'),createBufferSource:()=>node('noise'),createBuffer:(_c:number,length:number)=>({getChannelData:()=>new Float32Array(length)})};
 return {ctx:ctx as unknown as AudioContext,raw:ctx,started};
}

test('the loop is deterministic, wraps cleanly and stays in a soft register',()=>{
 assert.equal(BGM_LOOP_STEPS,128);
 assert.deepEqual(bgmStep(0),bgmStep(BGM_LOOP_STEPS));assert.deepEqual(bgmStep(-1),bgmStep(BGM_LOOP_STEPS-1));
 assert.deepEqual(bgmStep(0).pad,BGM_PROGRESSION[0].chord);assert.equal(bgmStep(0).bass,BGM_PROGRESSION[0].root);
 for(let step=0;step<BGM_LOOP_STEPS;step++){
  const s=bgmStep(step);
  for(const note of s.pad??[])assert.ok(note>=55&&note<=72);
  if(s.bass!==undefined)assert.ok(s.bass>=33&&s.bass<=52);
  if(s.pluck!==undefined){assert.ok(step>=64,'arpeggio waits for the second half');assert.ok(s.pluck<=84);}
 }
});

test('mute, master and music sliders all reach a true zero',()=>{
 const mix=DEFAULT_FEEDBACK_PREFERENCES;
 assert.equal(bgmLevel(false,mix),0);assert.equal(bgmLevel(true,{...mix,bgm:0}),0);assert.equal(bgmLevel(true,{...mix,master:0}),0);
 assert.equal(bgmLevel(true,{...mix,master:100,bgm:100}),dbGain(BGM_MASTER_DB));
 assert.equal(bgmLevel(true,mix),dbGain(BGM_MASTER_DB)*feedbackVolumeGain(mix.master)*feedbackVolumeGain(mix.bgm));
});

test('the player schedules ahead only while started and fades instead of clicking',()=>{
 const audio=fakeContext(),player=createBgmPlayer(audio.ctx);
 assert.equal(player.playing,false);assert.equal(audio.started.length,0);
 player.setLevel(.2);player.start();
 assert.equal(player.playing,true);assert.ok(audio.started.includes('osc'),'first bar is scheduled immediately');
 const count=audio.started.length;player.start();assert.equal(audio.started.length,count,'start is idempotent');
 player.stop();assert.equal(player.playing,false);player.dispose();player.start();assert.equal(player.playing,false,'a disposed player stays silent');
});
