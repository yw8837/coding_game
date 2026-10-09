import test from 'node:test';
import assert from 'node:assert/strict';
import {createFeedbackPlayer,FEEDBACK_CUES,FEEDBACK_MASTER_DB,FEEDBACK_MAX_VOICES,dbGain,midiFrequency} from './audio-feedback.ts';

function audioContext(state='running'){
 const sources:ReturnType<typeof node>[]=[];
 function param(){return {value:0,events:[] as Array<[string,number,number]>,setValueAtTime(value:number,at:number){this.events.push(['set',value,at]);},linearRampToValueAtTime(value:number,at:number){this.events.push(['linear',value,at]);},exponentialRampToValueAtTime(value:number,at:number){this.events.push(['exponential',value,at]);}};}
 function node(){return {type:'',frequency:param(),Q:param(),gain:param(),buffer:null as unknown,connections:[] as unknown[],disconnected:false,onended:null as null|(()=>void),starts:[] as number[],stops:[] as Array<number|undefined>,connect(target:unknown){this.connections.push(target);},disconnect(){this.disconnected=true;},start(at:number){this.starts.push(at);},stop(at?:number){this.stops.push(at);}};}
 const master=node();let gains=0,resumes=0,resolveResume:()=>void=()=>{};
 const ctx={state,currentTime:0,sampleRate:48000,destination:{},createGain(){return gains++===0?master:node();},createOscillator(){const source=node();sources.push(source);return source;},createBufferSource(){const source=node();sources.push(source);return source;},createBiquadFilter:node,createBuffer(_channels:number,length:number){return {getChannelData:()=>new Float32Array(length)};},resume(){resumes++;return new Promise<void>(resolve=>{resolveResume=()=>{ctx.state='running';resolve();};});}};
 return {ctx:ctx as unknown as AudioContext,raw:ctx,master,sources,get resumes(){return resumes;},finishResume:()=>resolveResume()};
}

test('cues stay in bright C major / add9 and repeated input has bounded headroom',()=>{
 for(const cue of Object.values(FEEDBACK_CUES))for(const note of cue.notes){assert.ok([0,2,4,7].includes(note.midi%12));assert.ok(note.midi>=72);assert.ok(note.duration<=.32);}
 const maximumPeak=Math.max(...Object.values(FEEDBACK_CUES).flatMap(cue=>cue.notes.map(note=>note.peak)));
 assert.ok(FEEDBACK_MAX_VOICES*maximumPeak*dbGain(FEEDBACK_MASTER_DB)<.5);
 assert.equal(midiFrequency(69),440);
});

test('reward routes melodic tones and restrained percussion through one attenuated master',()=>{
 const audio=audioContext(),player=createFeedbackPlayer(audio.ctx);player.play('reward');
 assert.equal(audio.sources.length,7);assert.equal(audio.master.gain.value,dbGain(-8));
 assert.deepEqual(audio.master.connections,[audio.raw.destination]);
 for(const source of audio.sources){assert.equal(source.starts.length,1);assert.ok(source.stops[0]!>source.starts[0]);assert.equal(source.connections.includes(audio.raw.destination),false);}
 player.dispose();assert.ok(audio.sources.every(source=>source.disconnected));assert.ok(audio.master.disconnected);
});

test('mute cancels all scheduled sources and suppresses new playback until enabled',()=>{
 const audio=audioContext(),player=createFeedbackPlayer(audio.ctx);player.play('opening');player.setEnabled(false);
 assert.ok(audio.sources.every(source=>source.stops.includes(undefined)&&source.disconnected));
 const count=audio.sources.length;player.play('success');assert.equal(audio.sources.length,count);
 player.setEnabled(true);player.play('success');assert.equal(audio.sources.length,count+4);
});

test('mute invalidates pending autoplay resume even if sound is reenabled before it resolves',async()=>{
 const audio=audioContext('suspended'),player=createFeedbackPlayer(audio.ctx);player.play('reward');
 assert.equal(audio.resumes,1);player.setEnabled(false);player.setEnabled(true);audio.finishResume();await Promise.resolve();
 assert.equal(audio.sources.length,0);player.play('success');assert.equal(audio.sources.length,4);
});

test('rapid events cannot exceed the voice budget and finished voices return capacity',()=>{
 const audio=audioContext(),player=createFeedbackPlayer(audio.ctx);for(let i=0;i<20;i++)player.play('reward');
 assert.equal(audio.sources.length,FEEDBACK_MAX_VOICES);
 for(const source of [...audio.sources])source.onended?.();
 player.play('success');assert.equal(audio.sources.length,FEEDBACK_MAX_VOICES+4);
});

test('clicks coalesce briefly and disposal invalidates future or pending playback',async()=>{
 const audio=audioContext(),player=createFeedbackPlayer(audio.ctx);player.play('click');player.play('click');assert.equal(audio.sources.length,1);
 audio.raw.currentTime=.05;player.play('click');assert.equal(audio.sources.length,2);player.dispose();player.play('opening');assert.equal(audio.sources.length,2);
 const suspended=audioContext('suspended'),pending=createFeedbackPlayer(suspended.ctx);pending.play('opening');pending.dispose();suspended.finishResume();await Promise.resolve();assert.equal(suspended.sources.length,0);
});
