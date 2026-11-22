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
export type BgmStep={pad?:readonly number[];bass?:number;kick?:boolean;hat?:number;pluck?:number;snare?:number;lead?:number;gate?:number};
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

/** 신스웨이브: 104 BPM, E 단조 8마디. 게이트 패드, 8분 옥타브 베이스, 2·4박 노이즈 스네어, 후반 아르페지오 리드. */
export const SYNTHWAVE_BPM=104;
export const SYNTHWAVE_PROGRESSION:readonly {root:number;chord:readonly number[]}[]=[
 {root:40,chord:[55,59,64,67]},// Em
 {root:36,chord:[55,59,60,64]},// Cmaj7
 {root:43,chord:[55,59,62,67]},// G
 {root:38,chord:[57,62,66,69]},// D
 {root:40,chord:[55,59,64,67]},// Em
 {root:36,chord:[55,59,60,64]},// Cmaj7
 {root:45,chord:[57,60,64,67]},// Am7
 {root:35,chord:[54,59,63,66]},// B (화성 단음계 딸림화음으로 Em에 되돌아간다)
];
export const SYNTHWAVE_LOOP_STEPS=SYNTHWAVE_PROGRESSION.length*BGM_STEPS_PER_BAR;
/** 패드 한 마디를 8분음표 단위로 여닫는다. */
export const SYNTHWAVE_GATES=8;
// 세 음씩 묶은 16분 아르페지오. 박마다 마지막 16분은 쉰다.
const LEAD=[0,2,3,1,2,3,0,2,3,1,3,2];

/** 신스웨이브 16분음표 한 칸. bgmStep과 같은 규칙으로 결정적이고 루프 길이에서 감긴다. */
export function synthwaveStep(step:number):BgmStep{
 const index=((Math.trunc(step)%SYNTHWAVE_LOOP_STEPS)+SYNTHWAVE_LOOP_STEPS)%SYNTHWAVE_LOOP_STEPS;
 const bar=Math.floor(index/BGM_STEPS_PER_BAR),beat=index%BGM_STEPS_PER_BAR,{root,chord}=SYNTHWAVE_PROGRESSION[bar];
 const result:BgmStep={};
 if(beat===0){result.pad=chord;result.gate=SYNTHWAVE_GATES;}
 if(beat%2===0){result.bass=beat%4===0?root:root+12;result.hat=beat%4===2?1:.5;}
 if(beat===0||beat===8||(bar%2===1&&beat===10))result.kick=true;
 if(beat===4||beat===12)result.snare=1;
 if(bar>=4&&beat%4!==3)result.lead=chord[LEAD[beat-(beat>>2)]]+12;
 return result;
}

export type BgmMood='lofi'|'synthwave';
export type BgmPattern={bpm:number;bars:number;stepsPerBar:number;loopSteps:number;tone:number;step:(step:number)=>BgmStep};
/** 분위기별 템포·길이·마스터 톤 필터. lofi는 기존 루프 그대로다. */
export const BGM_MOODS:Record<BgmMood,BgmPattern>={
 lofi:{bpm:BGM_BPM,bars:BGM_PROGRESSION.length,stepsPerBar:BGM_STEPS_PER_BAR,loopSteps:BGM_LOOP_STEPS,tone:2600,step:bgmStep},
 synthwave:{bpm:SYNTHWAVE_BPM,bars:SYNTHWAVE_PROGRESSION.length,stepsPerBar:BGM_STEPS_PER_BAR,loopSteps:SYNTHWAVE_LOOP_STEPS,tone:3200,step:synthwaveStep},
};
export const BGM_MOOD_IDS:readonly BgmMood[]=['lofi','synthwave'];
/** 모르는 분위기 id는 lofi로 돌아간다. */
export const bgmMood=(id?:string|null):BgmMood=>BGM_MOOD_IDS.find(mood=>mood===id)??'lofi';

/** 음소거, 전체 음량, 배경음 음량을 곱한 최종 출력. */
export function bgmLevel(enabled:boolean,mix:FeedbackPreferences):number{
 return enabled?dbGain(BGM_MASTER_DB)*feedbackVolumeGain(mix.master)*feedbackVolumeGain(mix.bgm):0;
}

export type BgmPlayer={start:()=>void;stop:()=>void;setLevel:(gain:number)=>void;duck:(db:number)=>void;setMood:(mood?:string|null)=>void;dispose:()=>void;readonly playing:boolean;readonly mood:BgmMood};

export function createBgmPlayer(ctx:AudioContext,initialMood?:string|null):BgmPlayer{
 let mood=bgmMood(initialMood),pending:BgmMood|null=null;
 const out=ctx.createGain(),duck=ctx.createGain(),tone=ctx.createBiquadFilter();
 out.gain.value=0;duck.gain.value=1;tone.type='lowpass';tone.frequency.value=BGM_MOODS[mood].tone;tone.Q.value=.4;
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
 const synthBar=BGM_STEPS_PER_BAR*60/SYNTHWAVE_BPM/4;
 // 게이트 패드: 마디마다 화음 음당 톱니·사각 한 쌍을 켜 두고 공용 게인 하나를 여닫는다. 8분마다 새 노드를 만들지 않아 가볍다.
 const gatedPad=(chord:readonly number[],at:number,gates:number)=>{
  const filter=ctx.createBiquadFilter(),square=ctx.createGain(),gate=ctx.createGain(),oscs:OscillatorNode[]=[];
  filter.type='lowpass';filter.frequency.value=1500;filter.Q.value=.7;square.gain.value=.4;
  square.connect(filter);filter.connect(gate);gate.connect(tone);
  const slot=synthBar/gates,peak=.026,low=.0065,g=gate.gain;
  g.setValueAtTime(0,at);
  for(let i=0;i<gates;i++){
   const t=at+i*slot;
   if(i>0)g.setValueAtTime(low,t);
   // 선형 램프로만 여닫아 게이트 경계에서 딸깍이지 않는다. 마지막 게이트는 완전히 닫는다.
   g.linearRampToValueAtTime(peak,t+.012);g.setValueAtTime(peak,t+slot*.55);g.linearRampToValueAtTime(i===gates-1?0:low,t+slot*.55+.035);
  }
  for(const note of chord)for(const [type,detune] of [['sawtooth',-6],['square',6]] as const){
   const osc=ctx.createOscillator();osc.type=type;osc.frequency.value=midiFrequency(note);osc.detune.value=detune;
   osc.connect(type==='square'?square:filter);osc.start(at);osc.stop(at+synthBar+.02);oscs.push(osc);
  }
  if(oscs[0])oscs[0].onended=()=>{for(const osc of oscs)osc.disconnect();filter.disconnect();square.disconnect();gate.disconnect();};
 };
 // 게이트 리버브 느낌: 짧은 타격 뒤 평평한 꼬리를 유지하다 선형으로 뚝 끊는 노이즈 버스트.
 const snare=(at:number,accent:number)=>{
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain(),peak=.075*accent,g=gain.gain;
  source.buffer=noise;filter.type='bandpass';filter.frequency.value=1700;filter.Q.value=.6;
  source.connect(filter);filter.connect(gain);gain.connect(tone);
  g.setValueAtTime(0,at);g.linearRampToValueAtTime(peak,at+.002);g.exponentialRampToValueAtTime(peak*.4,at+.035);g.setValueAtTime(peak*.4,at+.14);g.linearRampToValueAtTime(0,at+.17);
  source.start(at,Math.random()*.05);source.stop(at+.19);
  source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
 };
 const synthwave=(notes:BgmStep,at:number)=>{
  if(notes.pad)gatedPad(notes.pad,at,notes.gate??SYNTHWAVE_GATES);
  if(notes.bass!==undefined)voice('sawtooth',midiFrequency(notes.bass),at,.13,.006,.07,.12,650);
  if(notes.kick)kick(at);
  if(notes.snare)snare(at,notes.snare);
  if(notes.hat)hat(at,notes.hat*.8);
  if(notes.lead!==undefined)voice('square',midiFrequency(notes.lead),at,.014,.004,.03,.14,2400);
 };
 const render:Record<BgmMood,(notes:BgmStep,at:number)=>void>={lofi:play,synthwave};
 const switchMood=(target:BgmMood,at:number)=>{
  mood=target;pending=null;step=0;
  tone.frequency.cancelScheduledValues(at);tone.frequency.setTargetAtTime(BGM_MOODS[target].tone,at,.2);
 };
 const schedule=()=>{
  if(ctx.state!=='running')return;
  if(next<ctx.currentTime)next=ctx.currentTime+.05;
  while(next<ctx.currentTime+BGM_LOOKAHEAD){
   // 분위기 전환은 지금 마디가 끝나는 자리에서 새 루프 첫 박으로 들어간다. 앞 마디 소리는 제 엔벨로프대로 사라져 딸깍임이 없다.
   if(pending&&step%BGM_MOODS[mood].stepsPerBar===0)switchMood(pending,next);
   const pattern=BGM_MOODS[mood];
   render[mood](pattern.step(step),next);step=(step+1)%pattern.loopSteps;next+=60/pattern.bpm/4;
  }
 };
 return {
  get playing(){return timer!==null;},
  get mood(){return mood;},
  start(){if(disposed||timer)return;next=ctx.currentTime+.08;out.gain.cancelScheduledValues(ctx.currentTime);out.gain.setTargetAtTime(level,ctx.currentTime,.6);timer=setInterval(schedule,60);schedule();},
  stop(){if(!timer)return;clearInterval(timer);timer=null;out.gain.cancelScheduledValues(ctx.currentTime);out.gain.setTargetAtTime(0,ctx.currentTime,.15);if(pending)switchMood(pending,ctx.currentTime);},
  /** 재생 중이면 다음 마디 첫 박에서, 멈춰 있으면 바로 바꾼다. 같은 분위기를 다시 고르면 대기 중인 전환을 취소한다. */
  setMood(value){const target=bgmMood(value);if(target===mood){pending=null;return;}if(timer)pending=target;else switchMood(target,ctx.currentTime);},
  setLevel(gain){level=Math.max(0,gain);if(timer)out.gain.setTargetAtTime(level,ctx.currentTime,.12);},
  duck(db){if(!timer||!(db<0))return;const now=ctx.currentTime;duck.gain.cancelScheduledValues(now);duck.gain.setTargetAtTime(dbGain(db),now,.02);duck.gain.setTargetAtTime(1,now+.45,.35);},
  dispose(){disposed=true;if(timer)clearInterval(timer);timer=null;try{out.disconnect();duck.disconnect();tone.disconnect();}catch{/* already detached */}},
 };
}
