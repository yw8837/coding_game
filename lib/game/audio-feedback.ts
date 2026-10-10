import {DEFAULT_FEEDBACK_PREFERENCES,feedbackVolumeGain,type FeedbackPreferences} from './feedback-preferences.ts';

// Adapted from AI Tech Studio i147/i165/i499 (MIT); see public/licenses/ai-techstudio.txt.
export type Feedback='click'|'open'|'close'|'save'|'command'|'purchase'|'success'|'retry'|'reward'|'opening'|'release';
type Note={midi:number;at:number;duration:number;peak:number;wave?:OscillatorType;endMidi?:number};
type Cue={notes:readonly Note[];percussion:readonly number[]};
const note=(midi:number,at:number,duration=.2,peak=.09,wave:OscillatorType='sine',endMidi?:number):Note=>({midi,at,duration,peak,wave,endMidi});

// 성공은 위로, 재검사는 부드러운 물음표로. 출시만 긴 해결 화음을 쓴다.
export const FEEDBACK_CUES:Record<Feedback,Cue>={
 click:{notes:[note(76,0,.055,.065,'triangle',72)],percussion:[]},
 open:{notes:[note(72,0,.09,.06,'triangle'),note(79,.04,.12,.06)],percussion:[]},
 close:{notes:[note(79,0,.07,.05,'triangle',72)],percussion:[]},
 save:{notes:[note(79,0,.065,.055),note(84,.055,.11,.055)],percussion:[0]},
 command:{notes:[note(72,0,.055,.055,'triangle',76)],percussion:[0]},
 purchase:{notes:[note(84,0,.12,.065,'triangle'),note(79,.065,.15,.065),note(76,.13,.15,.055)],percussion:[0]},
 success:{notes:[note(72,0),note(76,.065),note(79,.13),note(86,.195,.22,.065)],percussion:[]},
 retry:{notes:[note(76,0,.14,.07),note(74,.09,.14,.065),note(79,.18,.18,.06)],percussion:[]},
 reward:{notes:[note(72,0),note(76,.075),note(79,.15),note(86,.225,.23,.065),note(84,.3,.26)],percussion:[0,.15]},
 opening:{notes:[note(72,0,.28),note(76,.08,.28),note(79,.16,.28),note(86,.24,.28,.065),note(79,.32,.25),note(84,.4,.32)],percussion:[0,.16,.32]},
 release:{notes:[note(72,0,.28),note(76,.07,.28),note(79,.14,.28),note(84,.24,.3),note(79,.42,.32,.065),note(84,.42,.32,.08),note(88,.42,.32,.055)],percussion:[0,.24]},
};
export const FEEDBACK_MASTER_DB=-8;
export const FEEDBACK_MAX_VOICES=12;
export const midiFrequency=(midi:number)=>440*2**((midi-69)/12);
export const dbGain=(db:number)=>10**(db/20);
export const feedbackBus=(kind:Feedback):'ui'|'events'=>['click','open','close','save','command'].includes(kind)?'ui':'events';
const VARIATIONS=[{pitch:1,gain:1},{pitch:1.025,gain:.94},{pitch:.978,gain:1.04}] as const;

export function createFeedbackPlayer(ctx:AudioContext){
 const master=ctx.createGain(),limiter=ctx.createDynamicsCompressor();
 master.gain.value=dbGain(FEEDBACK_MASTER_DB)*feedbackVolumeGain(DEFAULT_FEEDBACK_PREFERENCES.master);
 limiter.threshold.value=-6;limiter.knee.value=6;limiter.ratio.value=12;limiter.attack.value=.003;limiter.release.value=.12;
 master.connect(limiter);limiter.connect(ctx.destination);
 const buses={ui:ctx.createGain(),events:ctx.createGain()};
 for(const key of ['ui','events'] as const){buses[key].gain.value=feedbackVolumeGain(DEFAULT_FEEDBACK_PREFERENCES[key]);buses[key].connect(master);}
 const voices=new Map<()=>void,'ui'|'events'>(),lastPlayed=new Map<Feedback,number>();
 let enabled=true,disposed=false,generation=0,turn=0,resuming=false;
 let mix={...DEFAULT_FEEDBACK_PREFERENCES};
 const noise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.045),ctx.sampleRate),samples=noise.getChannelData(0);
 let seed=17;
 for(let i=0;i<samples.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;samples[i]=seed/2147483648-1;}
 const stopVoices=(bus?:'ui'|'events')=>{for(const [stop,channel] of [...voices])if(!bus||channel===bus)stop();};
 const track=(source:OscillatorNode|AudioBufferSourceNode,nodes:AudioNode[],start:number,duration:number,bus:'ui'|'events')=>{
  let done=false;
  const cleanup=()=>{if(done)return;done=true;voices.delete(stop);for(const node of nodes)node.disconnect();};
  const stop=()=>{try{source.stop();}catch{/* 이미 끝난 소리. */}cleanup();};
  voices.set(stop,bus);source.onended=cleanup;source.start(start);source.stop(start+duration);
 };
 const tone=(item:Note,start:number,bus:'ui'|'events',variation:typeof VARIATIONS[number])=>{
  if(voices.size>=FEEDBACK_MAX_VOICES)return;
  const source=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();
  source.type=item.wave??'sine';source.frequency.setValueAtTime(midiFrequency(item.midi)*variation.pitch,start);
  if(item.endMidi!==undefined)source.frequency.exponentialRampToValueAtTime(midiFrequency(item.endMidi)*variation.pitch,start+item.duration);
  filter.type='lowpass';filter.frequency.value=4800;filter.Q.value=.5;
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(item.peak*variation.gain,start+.005);
  gain.gain.exponentialRampToValueAtTime(.0001,start+item.duration);gain.gain.setValueAtTime(0,start+item.duration+.005);
  source.connect(filter);filter.connect(gain);gain.connect(buses[bus]);track(source,[source,filter,gain],start,item.duration+.01,bus);
 };
 const percussion=(start:number,bus:'ui'|'events')=>{
  if(voices.size>=FEEDBACK_MAX_VOICES)return;
  const source=ctx.createBufferSource(),high=ctx.createBiquadFilter(),low=ctx.createBiquadFilter(),gain=ctx.createGain();
  source.buffer=noise;high.type='highpass';high.frequency.value=1800;high.Q.value=.5;low.type='lowpass';low.frequency.value=6500;low.Q.value=.5;
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.018,start+.003);gain.gain.exponentialRampToValueAtTime(.0001,start+.04);
  source.connect(high);high.connect(low);low.connect(gain);gain.connect(buses[bus]);track(source,[source,high,low,gain],start,.045,bus);
 };
 return {
  setMix(value:FeedbackPreferences){
   if(disposed)return;
   mix={...value};
   master.gain.setTargetAtTime(dbGain(FEEDBACK_MASTER_DB)*feedbackVolumeGain(value.master),ctx.currentTime,.015);
   for(const key of ['ui','events'] as const){
    buses[key].gain.setTargetAtTime(feedbackVolumeGain(value[key]),ctx.currentTime,.015);
    if(value.master===0||value[key]===0)stopVoices(key);
   }
   if(value.master===0)generation++;
  },
  setEnabled(value:boolean){enabled=value;if(!value){generation++;lastPlayed.clear();stopVoices();}},
  play(kind:Feedback){
   const bus=feedbackBus(kind);
   if(!enabled||disposed||mix.master===0||mix[bus]===0)return;
   const gap=bus==='ui'?.06:.09;
   if(ctx.currentTime-(lastPlayed.get(kind)??-Infinity)<gap)return;
   lastPlayed.set(kind,ctx.currentTime);
   const token=generation;
   const schedule=()=>{
    if(!enabled||disposed||generation!==token||ctx.state!=='running'||mix.master===0||mix[bus]===0)return;
    if(bus==='events')stopVoices('ui');
    const start=ctx.currentTime+.005,cue=FEEDBACK_CUES[kind];
    const variation=bus==='ui'?VARIATIONS[turn++%VARIATIONS.length]:VARIATIONS[0];
    for(const item of cue.notes)tone(item,start+item.at,bus,variation);
    for(const at of cue.percussion)percussion(start+at,bus);
   };
   try{
    if(ctx.state==='suspended'){
     if(resuming)return;resuming=true;
     void ctx.resume().then(schedule).catch(()=>{}).finally(()=>{resuming=false;});
    }else schedule();
   }catch{/* 소리가 입력이나 의뢰 진행을 막지 않는다. */}
  },
  dispose(){if(disposed)return;disposed=true;generation++;stopVoices();buses.ui.disconnect();buses.events.disconnect();master.disconnect();limiter.disconnect();},
 };
}
