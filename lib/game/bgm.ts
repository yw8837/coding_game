import {dbGain,midiFrequency} from './audio-feedback.ts';
import {feedbackVolumeGain,type FeedbackPreferences} from './feedback-preferences.ts';

/** 작업실 배경음. 음원 파일 없이 Web Audio로 만드는 8마디 로파이 신스 루프. */
export const BGM_BPM=84;
export const BGM_STEPS_PER_BAR=16;
export const BGM_MASTER_DB=-11;
export const BGM_LOOKAHEAD=.25;
// A: 차분한 작업 / B: 아르페지오가 들어오는 몰입 구간. MIDI 음높이.
export const BGM_PROGRESSION:readonly {root:number;chord:readonly number[]}[]=[
 {root:45,chord:[57,60,64,67,71]},// Am9
 {root:41,chord:[57,60,64,65]},// Fmaj7
 {root:36,chord:[55,59,60,64]},// Cmaj7
 {root:43,chord:[55,59,62,64]},// G6
 {root:38,chord:[57,60,62,65,69]},// Dm9
 {root:45,chord:[55,60,64,67]},// Am7
 {root:41,chord:[57,60,64,65]},// Fmaj7
 {root:40,chord:[56,59,62,64]},// E7
];
export const BGM_LOOP_STEPS=BGM_PROGRESSION.length*BGM_STEPS_PER_BAR;
export type BgmStep={pad?:readonly number[];bass?:number;kick?:boolean;hat?:number;pluck?:number};
const ARP=[0,2,1,3,2,1,3,0];

/** 16분음표 한 칸에서 울릴 소리. 같은 step은 항상 같은 결과를 돌려준다. */
export function bgmStep(step:number):BgmStep{
 const index=((Math.trunc(step)%BGM_LOOP_STEPS)+BGM_LOOP_STEPS)%BGM_LOOP_STEPS;
 const bar=Math.floor(index/BGM_STEPS_PER_BAR),beat=index%BGM_STEPS_PER_BAR,{root,chord}=BGM_PROGRESSION[bar];
 const result:BgmStep={};
 if(beat===0)result.pad=chord;
 if(beat===0||beat===6)result.bass=root;
 else if(beat===10)result.bass=root+7;
 if(beat===0||beat===7||beat===10)result.kick=true;
 if(beat%2===0)result.hat=beat%4===2?1:.55;
 if(bar>=4&&beat%2===1&&beat!==15)result.pluck=chord[ARP[(beat>>1)%ARP.length]%chord.length]+12;
 return result;
}

/** 음소거, 전체 음량, 배경음 음량을 곱한 최종 출력. */
export function bgmLevel(enabled:boolean,mix:FeedbackPreferences):number{
 return enabled?dbGain(BGM_MASTER_DB)*feedbackVolumeGain(mix.master)*feedbackVolumeGain(mix.bgm):0;
}

export type BgmPlayer={start:()=>void;stop:()=>void;setLevel:(gain:number)=>void;duck:(db:number)=>void;dispose:()=>void;readonly playing:boolean};

export function createBgmPlayer(ctx:AudioContext):BgmPlayer{
 const out=ctx.createGain(),duck=ctx.createGain(),tone=ctx.createBiquadFilter();
 out.gain.value=0;duck.gain.value=1;tone.type='lowpass';tone.frequency.value=2600;tone.Q.value=.4;
 tone.connect(duck);duck.connect(out);out.connect(ctx.destination);
 const noise=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.25),ctx.sampleRate),data=noise.getChannelData(0);
 for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
 const secondsPerStep=60/BGM_BPM/4;
 let timer:ReturnType<typeof setInterval>|null=null,step=0,next=0,level=0,disposed=false;
 const envelope=(gain:GainNode,at:number,peak:number,attack:number,hold:number,release:number)=>{
  gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(peak,at+attack);
  gain.gain.setValueAtTime(peak,at+attack+hold);gain.gain.exponentialRampToValueAtTime(.0001,at+attack+hold+release);
  return at+attack+hold+release+.02;
 };
 const voice=(type:OscillatorType,frequency:number,at:number,peak:number,attack:number,hold:number,release:number,cutoff:number,detune=0)=>{
  const osc=ctx.createOscillator(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
  osc.type=type;osc.frequency.value=frequency;osc.detune.value=detune;filter.type='lowpass';filter.frequency.value=cutoff;
  osc.connect(filter);filter.connect(gain);gain.connect(tone);
  osc.start(at);osc.stop(envelope(gain,at,peak,attack,hold,release));
  osc.onended=()=>{osc.disconnect();filter.disconnect();gain.disconnect();};
 };
 const kick=(at:number)=>{
  const osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.frequency.setValueAtTime(115,at);osc.frequency.exponentialRampToValueAtTime(42,at+.13);
  osc.connect(gain);gain.connect(tone);osc.start(at);osc.stop(envelope(gain,at,.3,.004,.02,.22));
  osc.onended=()=>{osc.disconnect();gain.disconnect();};
 };
 const hat=(at:number,accent:number)=>{
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
  source.buffer=noise;filter.type='highpass';filter.frequency.value=7200;
  source.connect(filter);filter.connect(gain);gain.connect(tone);
  source.start(at,Math.random()*.15);source.stop(envelope(gain,at,.045*accent,.002,0,.05));
  source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
 };
 const bar=BGM_STEPS_PER_BAR*secondsPerStep;
 const play=(notes:BgmStep,at:number)=>{
  if(notes.pad)for(const note of notes.pad){const f=midiFrequency(note);voice('triangle',f,at,.03,.7,bar-1.3,.9,1400);voice('sawtooth',f,at,.012,.9,bar-1.5,.9,800,7);}
  if(notes.bass!==undefined)voice('sine',midiFrequency(notes.bass),at,.2,.01,.18,.4,600);
  if(notes.kick)kick(at);
  if(notes.hat)hat(at,notes.hat);
  if(notes.pluck!==undefined)voice('square',midiFrequency(notes.pluck),at,.022,.004,.02,.28,1900);
 };
 const schedule=()=>{
  if(ctx.state!=='running')return;
  if(next<ctx.currentTime)next=ctx.currentTime+.05;
  while(next<ctx.currentTime+BGM_LOOKAHEAD){play(bgmStep(step),next);step=(step+1)%BGM_LOOP_STEPS;next+=secondsPerStep;}
 };
 return {
  get playing(){return timer!==null;},
  start(){if(disposed||timer)return;next=ctx.currentTime+.08;out.gain.cancelScheduledValues(ctx.currentTime);out.gain.setTargetAtTime(level,ctx.currentTime,.6);timer=setInterval(schedule,60);schedule();},
  stop(){if(!timer)return;clearInterval(timer);timer=null;out.gain.cancelScheduledValues(ctx.currentTime);out.gain.setTargetAtTime(0,ctx.currentTime,.15);},
  setLevel(gain){level=Math.max(0,gain);if(timer)out.gain.setTargetAtTime(level,ctx.currentTime,.12);},
  duck(db){if(!timer||!(db<0))return;const now=ctx.currentTime;duck.gain.cancelScheduledValues(now);duck.gain.setTargetAtTime(dbGain(db),now,.02);duck.gain.setTargetAtTime(1,now+.45,.35);},
  dispose(){disposed=true;if(timer)clearInterval(timer);timer=null;try{out.disconnect();duck.disconnect();tone.disconnect();}catch{/* already detached */}},
 };
}
