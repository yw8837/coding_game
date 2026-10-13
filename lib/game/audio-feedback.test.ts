import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_FEEDBACK_PREFERENCES,feedbackVolumeGain} from './feedback-preferences.ts';
import {createFeedbackPlayer,feedbackBus,feedbackVariation,isKeystrokeKey,keyPackId,FEEDBACK_BUS_DB,FEEDBACK_CUES,FEEDBACK_DUCK_DB,FEEDBACK_DUCK_RELEASE,FEEDBACK_GAIN_WOBBLE_DB,FEEDBACK_MASTER_DB,FEEDBACK_MAX_VOICES,FEEDBACK_SFX_VOICES,KEY_PACK_IDS,KEY_PACKS,TYPEWRITER_BELL,dbGain,midiFrequency,type Feedback} from './audio-feedback.ts';

function audioContext(state='running'){
 const sources:ReturnType<typeof node>[]=[],gains:ReturnType<typeof node>[]=[],filters:ReturnType<typeof node>[]=[];
 function param(){return {value:0,events:[] as Array<[string,number,number]>,setTargetAtTime(value:number,at:number){this.events.push(['target',value,at]);},setValueAtTime(value:number,at:number){this.events.push(['set',value,at]);},linearRampToValueAtTime(value:number,at:number){this.events.push(['linear',value,at]);},exponentialRampToValueAtTime(value:number,at:number){this.events.push(['exponential',value,at]);},cancelScheduledValues(at:number){this.events.push(['cancel',0,at]);}};}
 function node(){return {type:'',threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),frequency:param(),Q:param(),gain:param(),playbackRate:param(),buffer:null as unknown,connections:[] as unknown[],disconnected:false,onended:null as null|(()=>void),starts:[] as number[],offsets:[] as Array<number|undefined>,stops:[] as Array<number|undefined>,connect(target:unknown){this.connections.push(target);},disconnect(){this.disconnected=true;},start(at:number,offset?:number){this.starts.push(at);this.offsets.push(offset);},stop(at?:number){this.stops.push(at);}};}
 const limiter=node();let resumes=0,resolveResume:()=>void=()=>{};
 const ctx={state,currentTime:0,sampleRate:48000,destination:{},createDynamicsCompressor(){return limiter;},createGain(){const result=node();gains.push(result);return result;},createOscillator(){const source=node();sources.push(source);return source;},createBufferSource(){const source=node();sources.push(source);return source;},createBiquadFilter(){const result=node();filters.push(result);return result;},createBuffer(_channels:number,length:number){return {getChannelData:()=>new Float32Array(length)};},resume(){resumes++;return new Promise<void>(resolve=>{resolveResume=()=>{ctx.state='running';resolve();};});}};
 // 생성 순서: master, 버스(ui·events·sfx), 덕킹(ui·sfx), 이후 소리마다 게인.
 return {ctx:ctx as unknown as AudioContext,raw:ctx,limiter,sources,gains,filters,get master(){return gains[0];},get buses(){return {ui:gains[1],events:gains[2],sfx:gains[3]};},get ducks(){return {ui:gains[4],sfx:gains[5]};},get resumes(){return resumes;},finishResume:()=>resolveResume()};
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

test('the eleven legacy cues keep their buses and the newer cues join SFX or events',()=>{
 assert.equal(Object.keys(FEEDBACK_CUES).length,16);
 for(const kind of LEGACY)assert.equal(feedbackBus(kind),['click','open','close','save','command'].includes(kind)?'ui':'events');
 assert.equal(feedbackBus('keystroke'),'sfx');assert.equal(feedbackBus('eval-pulse'),'sfx');assert.equal(feedbackBus('eval-pass'),'events');
 assert.equal(feedbackBus('level-up'),'events');assert.equal(feedbackBus('achievement'),'events');
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

test('level-up fanfare and achievement chime ride the events bus, duck UI and SFX, and fit the budget together',()=>{
 const up=FEEDBACK_CUES['level-up'],chime=FEEDBACK_CUES.achievement,voices=(kind:Feedback)=>FEEDBACK_CUES[kind].notes.length+FEEDBACK_CUES[kind].percussion.length;
 assert.ok(Math.abs(end('level-up')-1.2)<=.1,'level-up lasts about 1.2 s');assert.ok(Math.abs(end('achievement')-.8)<=.1,'achievement lasts about 0.8 s');
 assert.ok(up.notes.slice(0,5).every((n,i,all)=>i===0||n.midi>all[i-1].midi),'the fanfare opens with a rising arpeggio');
 assert.equal(new Set(chime.notes.slice(0,2).map(n=>n.midi)).size,2,'a two-note chime before the sparkle');
 assert.ok(voices('level-up')+voices('achievement')<=FEEDBACK_MAX_VOICES);
 assert.equal(FEEDBACK_DUCK_DB['level-up'],FEEDBACK_DUCK_DB.reward,'level-up ducks like a reward');
 const audio=audioContext(),player=createFeedbackPlayer(audio.ctx);player.play('level-up');
 assert.equal(audio.sources.length,voices('level-up'));
 assert.ok(audio.gains.slice(6).every(gain=>gain.connections[0]===audio.buses.events),'every fanfare voice lands on the events bus');
 for(const duck of Object.values(audio.ducks)){const [,,dip,restore]=duck.gain.events;assert.deepEqual(dip,['target',dbGain(-9),.005]);assert.deepEqual(restore,['target',1,.005+end('level-up')]);}
 const fanfare=[...audio.sources];player.play('achievement');
 assert.equal(audio.sources.length,voices('level-up')+voices('achievement'),'an achievement unlocked by the same level-up is not clipped');
 assert.ok(fanfare.every(v=>!v.disconnected));
 player.setMix({...DEFAULT_FEEDBACK_PREFERENCES,events:50});assert.equal(audio.buses.events.gain.events.at(-1)?.[1],feedbackVolumeGain(50));
});

test('level-up and achievement respect the events slider, master and their own cooldowns',()=>{
 const audio=audioContext(),player=createFeedbackPlayer(audio.ctx);
 player.setMix({...DEFAULT_FEEDBACK_PREFERENCES,ui:0});player.play('level-up');assert.equal(audio.sources.length,8,'the interface slider does not silence events');
 for(const source of [...audio.sources])source.onended?.();
 audio.raw.currentTime=.5;player.play('level-up');assert.equal(audio.sources.length,8,'a second fanfare waits out its cooldown');
 audio.raw.currentTime=.85;player.play('level-up');assert.equal(audio.sources.length,16);
 for(const source of [...audio.sources])source.onended?.();
 audio.raw.currentTime=1;player.play('achievement');audio.raw.currentTime=1.2;player.play('achievement');assert.equal(audio.sources.length,20,'chimes 0.2 s apart coalesce');
 for(const mix of [{...DEFAULT_FEEDBACK_PREFERENCES,events:0},{...DEFAULT_FEEDBACK_PREFERENCES,master:0}]){
  const fresh=audioContext(),muted=createFeedbackPlayer(fresh.ctx);muted.setMix(mix);muted.play('level-up');muted.play('achievement');assert.equal(fresh.sources.length,0);
 }
});

// 소리 하나가 만든 노드 설정을 비교 가능한 값으로 펼친다. 변주 난수를 0.5로 고정해 피치·음량 변주를 0으로 만든다.
function render(pack?:string|null,kind:Feedback='keystroke'){
 const audio=audioContext(),player=createFeedbackPlayer(audio.ctx,()=>.5);
 if(pack!==undefined)player.setKeyPack(pack);
 player.play(kind);
 return {
  sources:audio.sources.map(s=>({type:s.type,noise:Boolean(s.buffer),rate:s.playbackRate.value,frequency:s.frequency.events,starts:s.starts,stops:s.stops})),
  filters:audio.filters.map(f=>({type:f.type,frequency:f.frequency.value,Q:f.Q.value})),
  gains:audio.gains.slice(6).map(g=>({events:g.gain.events,bus:g.connections[0]===audio.buses.sfx?'sfx':g.connections[0]===audio.buses.ui?'ui':'other'})),
  player,
 };
}
const shape=({sources,filters,gains}:ReturnType<typeof render>)=>({sources,filters,gains});

test('mechanical stays the default key pack and is the exact previous keystroke; unknown ids fall back to it',()=>{
 const base=shape(render());
 for(const id of ['mechanical','nope','',null])assert.deepEqual(shape(render(id)),base,String(id));
 assert.equal(render('nope').player.keyPack,'mechanical');assert.equal(keyPackId('retro'),'retro');assert.equal(keyPackId(undefined),'mechanical');
 assert.equal(KEY_PACKS.mechanical,FEEDBACK_CUES.keystroke);
 // 이전 keystroke 정의(84→79 삼각파 틱 + 2.6–9 kHz 노이즈 딸깍)를 숫자로 고정한다.
 assert.deepEqual(base.sources.map(s=>[s.type,s.noise]),[['triangle',false],['',true]]);
 assert.deepEqual(base.sources[0].frequency,[['set',midiFrequency(84),.005],['exponential',midiFrequency(79),.005+.024]]);
 assert.deepEqual(base.filters,[{type:'lowpass',frequency:4800,Q:.5},{type:'highpass',frequency:2600,Q:.5},{type:'lowpass',frequency:9000,Q:.5}]);
 assert.deepEqual(base.gains.map(g=>g.events[1]),[['linear',.02,.01],['linear',.03,.008]]);
 assert.ok(base.gains.every(g=>g.bus==='sfx'));
});

test('each key pack has its own oscillator and filter voice and fits the SFX share',()=>{
 const packs=Object.fromEntries(KEY_PACK_IDS.map(id=>[id,shape(render(id))]));
 for(const a of KEY_PACK_IDS)for(const b of KEY_PACK_IDS)if(a<b)assert.notDeepEqual(packs[a],packs[b],a+' vs '+b);
 for(const id of KEY_PACK_IDS){
  const cue=KEY_PACKS[id];assert.ok(cue.notes.length+cue.percussion.length<=FEEDBACK_SFX_VOICES/2,id);
  assert.ok(packs[id].gains.every(g=>g.bus==='sfx'),id);
  assert.ok([...cue.notes,...cue.percussion].every(item=>item.peak<=.045),'packs stay at keystroke loudness');
 }
 const tone=(id:string)=>packs[id].sources.find(s=>!s.noise)!,toneFilter=(id:string)=>packs[id].filters[0];
 assert.equal(tone('soft').type,'sine');assert.ok(tone('soft').frequency[0][1]<300,'soft is a low thock');assert.ok(toneFilter('soft').frequency<1200);
 assert.ok(packs.soft.filters.at(-1)!.frequency<3000,'soft noise is muffled');
 assert.equal(tone('typewriter').type,'square');assert.ok(packs.typewriter.filters[1].frequency>packs.mechanical.filters[1].frequency,'typewriter clack is sharper');
 assert.ok(packs.retro.sources.every(s=>s.type==='square'&&!s.noise),'retro is a pure square blip');
 // 같은 묶음이라도 난수에 따라 블립 피치가 ±6% 안에서 흔들린다.
 const audio=audioContext(),player=createFeedbackPlayer(audio.ctx,sequence(.1,.5,.9,.5));player.setKeyPack('retro');
 player.play('keystroke');audio.raw.currentTime=.05;player.play('keystroke');
 const [first,,second]=audio.sources.map(s=>s.frequency.events[0][1]/midiFrequency(84));
 assert.notEqual(first,second);assert.ok([first,second].every(p=>Math.abs(p-1)<=.06+1e-9));
 // 다른 큐는 묶음과 무관하다.
 assert.deepEqual(shape(render('retro','click')),shape(render(undefined,'click')));
});

test('only the typewriter pack rings a small bell, and only on command',()=>{
 const plain=render(undefined,'command');assert.equal(plain.sources.length,2);
 for(const id of KEY_PACK_IDS){
  const command=render(id,'command'),typed=render(id);
  assert.equal(command.sources.length,2+(id==='typewriter'?TYPEWRITER_BELL.notes.length:0),id);
  if(id!=='typewriter')assert.deepEqual(shape(command),shape(plain),id);
  assert.ok(typed.sources.every(s=>s.frequency[0]?.[1]!==midiFrequency(96)),id+' keystrokes never ring');
 }
 const bell=render('typewriter','command');
 assert.deepEqual(bell.sources.slice(0,2),plain.sources,'the normal command blip still plays first');
 assert.equal(bell.sources[2].frequency[0][1],midiFrequency(96));assert.ok(bell.gains.every(g=>g.bus==='ui'),'the bell follows the interface slider');
 const audio=audioContext(),player=createFeedbackPlayer(audio.ctx);player.setKeyPack('typewriter');player.setMix({...DEFAULT_FEEDBACK_PREFERENCES,ui:0});player.play('command');assert.equal(audio.sources.length,0);
 const loudest=Math.max(...[...TYPEWRITER_BELL.notes,...KEY_PACK_IDS.flatMap(id=>[...KEY_PACKS[id].notes,...KEY_PACKS[id].percussion])].map(item=>item.peak));
 assert.ok(FEEDBACK_MAX_VOICES*loudest*dbGain(FEEDBACK_GAIN_WOBBLE_DB.sfx)*dbGain(FEEDBACK_MASTER_DB)<.5);
});
