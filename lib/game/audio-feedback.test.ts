import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_FEEDBACK_PREFERENCES,feedbackVolumeGain} from './feedback-preferences.ts';
import {createFeedbackPlayer,feedbackBus,feedbackVariation,isKeystrokeKey,FEEDBACK_BUS_DB,FEEDBACK_CUES,FEEDBACK_DUCK_RELEASE,FEEDBACK_GAIN_WOBBLE_DB,FEEDBACK_MASTER_DB,FEEDBACK_MAX_VOICES,FEEDBACK_SFX_VOICES,dbGain,midiFrequency,type Feedback} from './audio-feedback.ts';

function audioContext(state='running'){
 const sources:ReturnType<typeof node>[]=[],gains:ReturnType<typeof node>[]=[];
 function param(){return {value:0,events:[] as Array<[string,number,number]>,setTargetAtTime(value:number,at:number){this.events.push(['target',value,at]);},setValueAtTime(value:number,at:number){this.events.push(['set',value,at]);},linearRampToValueAtTime(value:number,at:number){this.events.push(['linear',value,at]);},exponentialRampToValueAtTime(value:number,at:number){this.events.push(['exponential',value,at]);},cancelScheduledValues(at:number){this.events.push(['cancel',0,at]);}};}
 function node(){return {type:'',threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),frequency:param(),Q:param(),gain:param(),playbackRate:param(),buffer:null as unknown,connections:[] as unknown[],disconnected:false,onended:null as null|(()=>void),starts:[] as number[],offsets:[] as Array<number|undefined>,stops:[] as Array<number|undefined>,connect(target:unknown){this.connections.push(target);},disconnect(){this.disconnected=true;},start(at:number,offset?:number){this.starts.push(at);this.offsets.push(offset);},stop(at?:number){this.stops.push(at);}};}
 const limiter=node();let resumes=0,resolveResume:()=>void=()=>{};
 const ctx={state,currentTime:0,sampleRate:48000,destination:{},createDynamicsCompressor(){return limiter;},createGain(){const result=node();gains.push(result);return result;},createOscillator(){const source=node();sources.push(source);return source;},createBufferSource(){const source=node();sources.push(source);return source;},createBiquadFilter:node,createBuffer(_channels:number,length:number){return {getChannelData:()=>new Float32Array(length)};},resume(){resumes++;return new Promise<void>(resolve=>{resolveResume=()=>{ctx.state='running';resolve();};});}};
 // 생성 순서: master, 버스(ui·events·sfx), 덕킹(ui·sfx), 이후 소리마다 게인.
 return {ctx:ctx as unknown as AudioContext,raw:ctx,limiter,sources,get master(){return gains[0];},get buses(){return {ui:gains[1],events:gains[2],sfx:gains[3]};},get ducks(){return {ui:gains[4],sfx:gains[5]};},get resumes(){return resumes;},finishResume:()=>resolveResume()};
}
const sequence=(...values:number[])=>{let i=0;return()=>values[i++%values.length];};
const LEGACY:readonly Feedback[]=['click','open','close','save','command','purchase','success','retry','reward','opening','release'];
const end=(kind:Feedback)=>Math.max(...FEEDBACK_CUES[kind].notes.map(n=>n.at+n.duration),...FEEDBACK_CUES[kind].percussion.map(h=>h.at+h.duration));

test('cues stay in bright C major / add9 and repeated input has bounded headroom',()=>{
 for(const cue of Object.values(FEEDBACK_CUES))for(const note of cue.notes){assert.ok([0,2,4,7].includes(note.midi%12));assert.ok(note.midi>=72);assert.ok(note.duration<=.32);}
 // 버스 트림과 최대 음량 변주까지 더해도 최대 동시 발음이 -6 dBFS 아래에 머문다.
 const loudest=Math.max(...(Object.keys(FEEDBACK_CUES) as Feedback[]).flatMap(kind=>{const bus=feedbackBus(kind);return FEEDBACK_CUES[kind].notes.map(n=>n.peak*dbGain(FEEDBACK_BUS_DB[bus]+FEEDBACK_GAIN_WOBBLE_DB[bus]));}));
 assert.ok(FEEDBACK_MAX_VOICES*loudest*dbGain(FEEDBACK_MASTER_DB)<.5);
 assert.ok(Object.values(FEEDBACK_CUES).every(cue=>cue.notes.length+cue.percussion.length<=9),'every cue fits the voice budget with room left');
 assert.equal(midiFrequency(69),440);
});

test('the eleven legacy cues keep their buses and the three new cues join SFX or events',()=>{
 assert.equal(Object.keys(FEEDBACK_CUES).length,14);
 for(const kind of LEGACY)assert.equal(feedbackBus(kind),['click','open','close','save','command'].includes(kind)?'ui':'events');
 assert.equal(feedbackBus('keystroke'),'sfx');assert.equal(feedbackBus('eval-pulse'),'sfx');assert.equal(feedbackBus('eval-pass'),'events');
 assert.deepEqual(FEEDBACK_CUES.success.notes.map(n=>n.midi),[72,76,79,86]);assert.equal(FEEDBACK_CUES.reward.percussion.length,2);
});

test('reward routes melodic tones and restrained percussion through one attenuated master',()=>{
 const audio=audioContext(),player=createFeedbackPlayer(audio.ctx);player.play('reward');
 assert.equal(audio.sources.length,7);assert.equal(audio.master.gain.value,dbGain(-8)*feedbackVolumeGain(DEFAULT_FEEDBACK_PREFERENCES.master));
 assert.deepEqual(audio.master.connections,[audio.limiter]);assert.deepEqual(audio.limiter.connections,[audio.raw.destination]);
 assert.deepEqual(audio.buses.ui.connections,[audio.ducks.ui]);assert.deepEqual(audio.buses.sfx.connections,[audio.ducks.sfx]);assert.deepEqual(audio.buses.events.connections,[audio.master]);
 assert.ok(Object.values(audio.ducks).every(duck=>duck.gain.value===1&&duck.connections[0]===audio.master));
 for(const source of audio.sources){assert.equal(source.starts.length,1);assert.ok(source.stops[0]!>source.starts[0]);assert.equal(source.connections.includes(audio.raw.destination),false);}
 player.dispose();assert.ok(audio.sources.every(source=>source.disconnected));assert.ok(audio.master.disconnected);
});

test('SFX bus follows the interface slider a step quieter and mutes with it',()=>{
 const audio=audioContext(),player=createFeedbackPlayer(audio.ctx);
 assert.equal(audio.buses.sfx.gain.value,feedbackVolumeGain(DEFAULT_FEEDBACK_PREFERENCES.ui)*dbGain(FEEDBACK_BUS_DB.sfx));
 player.setMix({...DEFAULT_FEEDBACK_PREFERENCES,ui:50});assert.equal(audio.buses.sfx.gain.events.at(-1)?.[1],feedbackVolumeGain(50)*dbGain(-4));
 player.play('keystroke');const typed=[...audio.sources];assert.equal(typed.length,2);
 player.play('reward');const rewardVoices=audio.sources.slice(2);
 player.setMix({...DEFAULT_FEEDBACK_PREFERENCES,ui:0});assert.ok(typed.every(v=>v.disconnected));assert.ok(rewardVoices.every(v=>!v.disconnected));
 audio.raw.currentTime=.2;player.play('keystroke');player.play('eval-pulse');assert.equal(audio.sources.length,9);
});

test('setMix only automates when a volume actually changes',()=>{
 const audio=audioContext(),player=createFeedbackPlayer(audio.ctx);
 for(let i=0;i<5;i++)player.setMix({...DEFAULT_FEEDBACK_PREFERENCES});
 player.setMix({...DEFAULT_FEEDBACK_PREFERENCES,reducedMotion:true});
 assert.equal(audio.master.gain.events.length,0);assert.ok(Object.values(audio.buses).every(bus=>bus.gain.events.length===0));
 player.setMix({...DEFAULT_FEEDBACK_PREFERENCES,events:40});assert.equal(audio.buses.events.gain.events.length,1);
});

test('major events duck UI and SFX smoothly, then release back to 0 dB',()=>{
 const audio=audioContext(),player=createFeedbackPlayer(audio.ctx);player.play('success');
 for(const duck of Object.values(audio.ducks)){
  const [cancel,anchor,dip,restore]=duck.gain.events;
  assert.equal(cancel[0],'cancel');assert.equal(anchor[0],'set');
  assert.deepEqual(dip,['target',dbGain(-6),.005]);assert.deepEqual(restore,['target',1,.005+end('success')]);
 }
 assert.equal(audio.buses.events.gain.events.length,0,'the event itself is never ducked');
 audio.raw.currentTime=1;player.play('retry');assert.equal(audio.ducks.ui.gain.events.length,4,'a retry does not duck');
 audio.raw.currentTime=2;player.play('release');assert.equal(audio.ducks.sfx.gain.events.at(-2)?.[1],dbGain(-12));
 // 출시 화음 도중 통과음이 와도 더 깊고 긴 덕킹을 유지해 펌핑하지 않는다.
 audio.raw.currentTime=2.1;player.play('success');
 assert.equal(audio.ducks.ui.gain.events.at(-2)?.[1],dbGain(-12));assert.ok(Math.abs(audio.ducks.ui.gain.events.at(-1)![2]-(2.005+end('release')))<1e-9);
 assert.ok(FEEDBACK_DUCK_RELEASE*3>=.3,'release recovers over roughly 300 ms or more');
});

test('UI and typing wobble pitch within ±6% while musical feedback keeps exact pitches',()=>{
 const audio=audioContext(),player=createFeedbackPlayer(audio.ctx,sequence(0,.5,.999,.5,.5,.5,.25,1)),pitches:number[]=[];
 for(let i=0;i<4;i++){audio.raw.currentTime=i*.1;player.play('click');pitches.push(audio.sources.at(-1)!.frequency.events[0][1]/midiFrequency(76));}
 assert.ok(Math.abs(pitches[0]-.94)<1e-9);assert.ok(Math.abs(pitches[1]-1.06)<.001);assert.ok(Math.abs(pitches[2]-1)<1e-9);
 assert.ok(pitches.every(p=>Math.abs(p-1)<=.06+1e-9));
 player.play('success');assert.equal(audio.sources.at(-4)!.frequency.events[0][1],midiFrequency(72));
 assert.ok(audio.sources.slice(0,4).every(v=>v.disconnected),'Success frees UI voices first');
 for(const bus of ['ui','events','sfx'] as const)for(const r of [0,.5,.999]){const v=feedbackVariation(bus,()=>r);assert.ok(v.gain>=dbGain(-FEEDBACK_GAIN_WOBBLE_DB[bus])&&v.gain<=dbGain(FEEDBACK_GAIN_WOBBLE_DB[bus]));if(bus==='events')assert.equal(v.pitch,1);}
});

test('each keystroke reads a different slice of noise at a wobbled rate',()=>{
 const audio=audioContext(),player=createFeedbackPlayer(audio.ctx,sequence(.1,.5,.3,.9,.7,.2));
 player.play('keystroke');audio.raw.currentTime=.05;player.play('keystroke');
 const clicks=audio.sources.filter(s=>s.buffer);assert.equal(clicks.length,2);
 assert.notEqual(clicks[0].offsets[0],clicks[1].offsets[0]);assert.notEqual(clicks[0].playbackRate.value,clicks[1].playbackRate.value);
 for(const click of clicks){assert.ok(click.offsets[0]!>=0&&click.offsets[0]!<.12);assert.ok(Math.abs(click.playbackRate.value-1)<=.06);}
});

test('typing stays inside its own voice share and never starves a celebration',()=>{
 const audio=audioContext(),player=createFeedbackPlayer(audio.ctx);
 for(let i=0;i<5;i++){audio.raw.currentTime=i*.04;player.play('keystroke');}
 assert.equal(audio.sources.length,FEEDBACK_SFX_VOICES,'two keystrokes fill the SFX share; later ones wait for capacity');
 const typed=[...audio.sources];audio.raw.currentTime=.3;player.play('opening');
 assert.equal(audio.sources.length,FEEDBACK_SFX_VOICES+9,'every opening voice is scheduled');
 assert.ok(typed[0].disconnected,'the oldest typing voice yields at the global budget');assert.ok(typed.slice(1).every(v=>!v.disconnected));
});

test('a delayed result lands after the execution pulse and the delay is clamped',()=>{
 const audio=audioContext(),player=createFeedbackPlayer(audio.ctx);
 player.play('eval-pulse');const pulse=audio.sources.length;player.play('eval-pass',.12);
 assert.equal(audio.sources[pulse].starts[0],.125);assert.equal(audio.ducks.ui.gain.events[2][2],.125);
 for(const [delay,expected] of [[5,.505],[Number.NaN,.005],[-1,.005]] as const){
  const fresh=audioContext(),late=createFeedbackPlayer(fresh.ctx);late.play('retry',delay);
  assert.ok(Math.abs(fresh.sources[0].starts[0]-expected)<1e-9,String(delay));
 }
});

test('only text-changing keys count as keystrokes',()=>{
 const key=(value:string,extra:Partial<{ctrlKey:boolean;metaKey:boolean;altKey:boolean;repeat:boolean}>={})=>isKeystrokeKey({key:value,ctrlKey:false,metaKey:false,altKey:false,...extra});
 for(const value of ['a','Z','7',' ','{','ㄱ','Backspace','Delete','Enter','Tab','Process'])assert.equal(key(value),true,value);
 for(const value of ['Shift','Control','ArrowLeft','Escape','F5','CapsLock'])assert.equal(key(value),false,value);
 assert.equal(key('s',{ctrlKey:true}),false);assert.equal(key('c',{metaKey:true}),false);assert.equal(key('x',{altKey:true}),false);assert.equal(key('Backspace',{repeat:true}),false);
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
 const audio=audioContext(),player=createFeedbackPlayer(audio.ctx);for(let i=0;i<20;i++){audio.raw.currentTime=i*.1;player.play('reward');}
 assert.equal(audio.sources.length,FEEDBACK_MAX_VOICES);
 for(const source of [...audio.sources])source.onended?.();
 player.play('success');assert.equal(audio.sources.length,FEEDBACK_MAX_VOICES+4);
});

test('channel mute cancels that channel only; zero master cancels every pending voice',()=>{
 const audio=audioContext(),player=createFeedbackPlayer(audio.ctx);
 player.play('reward');const eventVoices=[...audio.sources];player.play('click');const click=audio.sources.at(-1)!;
 player.setMix({...DEFAULT_FEEDBACK_PREFERENCES,ui:0});
 assert.ok(click.disconnected);assert.ok(eventVoices.every(v=>!v.disconnected));
 const count=audio.sources.length;audio.raw.currentTime=.2;player.play('click');assert.equal(audio.sources.length,count);
 player.setMix({...DEFAULT_FEEDBACK_PREFERENCES,master:0});assert.ok(eventVoices.every(v=>v.disconnected));
 player.play('release');assert.equal(audio.sources.length,count);
 assert.equal(audio.master.gain.events.at(-1)?.[1],0);
});

test('returning from a hidden tab does not keep the frozen audio-clock cooldown',async()=>{
 const audio=audioContext(),player=createFeedbackPlayer(audio.ctx);player.play('reward');player.setEnabled(false);
 audio.raw.state='suspended';player.setEnabled(true);player.play('reward');assert.equal(audio.resumes,1);
 audio.finishResume();await Promise.resolve();assert.equal(audio.sources.length,14);
});

test('suspended input bursts resume once and do not queue a delayed wall of sound',async()=>{
 const audio=audioContext('suspended'),player=createFeedbackPlayer(audio.ctx);
 player.play('open');player.play('click');player.play('keystroke');player.play('command');assert.equal(audio.resumes,1);
 audio.finishResume();await Promise.resolve();assert.equal(audio.sources.length,2);
 player.dispose();assert.ok(Object.values(audio.buses).every(bus=>bus.disconnected));assert.ok(Object.values(audio.ducks).every(duck=>duck.disconnected));assert.ok(audio.limiter.disconnected);
});

test('clicks coalesce briefly and disposal invalidates future or pending playback',async()=>{
 const audio=audioContext(),player=createFeedbackPlayer(audio.ctx);player.play('click');player.play('click');assert.equal(audio.sources.length,1);
 audio.raw.currentTime=.07;player.play('click');assert.equal(audio.sources.length,2);player.dispose();player.play('opening');assert.equal(audio.sources.length,2);
 const suspended=audioContext('suspended'),pending=createFeedbackPlayer(suspended.ctx);pending.play('opening');pending.dispose();suspended.finishResume();await Promise.resolve();assert.equal(suspended.sources.length,0);
});
