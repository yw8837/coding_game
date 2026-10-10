import {DEFAULT_FEEDBACK_PREFERENCES,feedbackVolumeGain,type FeedbackPreferences} from './feedback-preferences.ts';

// Adapted from AI Tech Studio i147/i165/i499 (MIT); see public/licenses/ai-techstudio.txt.
export type Feedback='click'|'open'|'close'|'save'|'command'|'purchase'|'success'|'retry'|'reward'|'opening'|'release'|'keystroke'|'eval-pulse'|'eval-pass';
export type FeedbackBus='ui'|'events'|'sfx';
type Note={midi:number;at:number;duration:number;peak:number;wave?:OscillatorType;endMidi?:number};
type Hit={at:number;peak:number;duration:number;high:number;low:number};
type Cue={notes:readonly Note[];percussion:readonly Hit[]};
const note=(midi:number,at:number,duration=.2,peak=.09,wave:OscillatorType='sine',endMidi?:number):Note=>({midi,at,duration,peak,wave,endMidi});
const hit=(at:number,peak=.018,duration=.04,high=1800,low=6500):Hit=>({at,peak,duration,high,low});

// 성공은 위로, 재검사는 부드러운 물음표로. 출시만 긴 해결 화음을 쓴다.
export const FEEDBACK_CUES:Record<Feedback,Cue>={
 click:{notes:[note(76,0,.055,.065,'triangle',72)],percussion:[]},
 open:{notes:[note(72,0,.09,.06,'triangle'),note(79,.04,.12,.06)],percussion:[]},
 close:{notes:[note(79,0,.07,.05,'triangle',72)],percussion:[]},
 save:{notes:[note(79,0,.065,.055),note(84,.055,.11,.055)],percussion:[hit(0)]},
 command:{notes:[note(72,0,.055,.055,'triangle',76)],percussion:[hit(0)]},
 purchase:{notes:[note(84,0,.12,.065,'triangle'),note(79,.065,.15,.065),note(76,.13,.15,.055)],percussion:[hit(0)]},
 success:{notes:[note(72,0),note(76,.065),note(79,.13),note(86,.195,.22,.065)],percussion:[]},
 retry:{notes:[note(76,0,.14,.07),note(74,.09,.14,.065),note(79,.18,.18,.06)],percussion:[]},
 reward:{notes:[note(72,0),note(76,.075),note(79,.15),note(86,.225,.23,.065),note(84,.3,.26)],percussion:[hit(0),hit(.15)]},
 opening:{notes:[note(72,0,.28),note(76,.08,.28),note(79,.16,.28),note(86,.24,.28,.065),note(79,.32,.25),note(84,.4,.32)],percussion:[hit(0),hit(.16),hit(.32)]},
 release:{notes:[note(72,0,.28),note(76,.07,.28),note(79,.14,.28),note(84,.24,.3),note(79,.42,.32,.065),note(84,.42,.32,.08),note(88,.42,.32,.055)],percussion:[hit(0),hit(.24)]},
 // 타건은 밝은 노이즈 딸깍에 아주 작은 음정 틱을 얹는다. 매번 피치와 노이즈 결이 조금씩 달라진다.
 keystroke:{notes:[note(84,0,.024,.02,'triangle',79)],percussion:[hit(0,.03,.016,2600,9000)]},
 // 실행 펄스는 위로 훑는 스캔음. 결과음이 뒤따라 착지할 자리를 비워 둔다.
 'eval-pulse':{notes:[note(72,0,.1,.04,'triangle',84),note(91,.05,.07,.028)],percussion:[hit(0,.014,.03,3000,9000)]},
 // 실행 통과는 두 옥타브를 빠르게 올라 add9 반짝임으로 착지한다.
 'eval-pass':{notes:[note(72,0,.16,.055,'triangle'),note(76,.05,.16,.055,'triangle'),note(79,.1,.16,.055,'triangle'),note(84,.15,.18,.055),note(88,.2,.2,.05),note(86,.27,.3,.04),note(91,.27,.3,.04),note(96,.27,.32,.035)],percussion:[hit(.27,.016,.04,5000,11000)]},
};
export const FEEDBACK_MASTER_DB=-8;
export const FEEDBACK_MAX_VOICES=12;
/** 버스 고정 트림. SFX는 조작음 슬라이더를 따르되 한 단계 작게 깔린다. */
export const FEEDBACK_BUS_DB:Record<FeedbackBus,number>={ui:0,events:0,sfx:-4};
/** 저장 설정 스키마를 유지하려고 SFX는 별도 슬라이더 없이 조작음 설정을 따른다. */
export const FEEDBACK_BUS_CONTROL:Record<FeedbackBus,'ui'|'events'>={ui:'ui',events:'events',sfx:'ui'};
export const FEEDBACK_SFX_VOICES=4;
/** 큰 성공이 울리는 동안 조작음·타건 버스를 잠시 눌렀다가 되돌린다. */
export const FEEDBACK_DUCK_DB:Partial<Record<Feedback,number>>={success:-6,'eval-pass':-6,reward:-9,opening:-12,release:-12};
export const FEEDBACK_DUCK_ATTACK=.012,FEEDBACK_DUCK_RELEASE=.12;
export const FEEDBACK_PITCH_WOBBLE=.06;
export const FEEDBACK_GAIN_WOBBLE_DB:Record<FeedbackBus,number>={ui:1,events:.75,sfx:1.5};
export const FEEDBACK_MAX_DELAY=.5;
export const midiFrequency=(midi:number)=>440*2**((midi-69)/12);
export const dbGain=(db:number)=>10**(db/20);
const UI_CUES:readonly Feedback[]=['click','open','close','save','command'],SFX_CUES:readonly Feedback[]=['keystroke','eval-pulse'];
export const feedbackBus=(kind:Feedback):FeedbackBus=>UI_CUES.includes(kind)?'ui':SFX_CUES.includes(kind)?'sfx':'events';
const cueLength=(cue:Cue)=>Math.max(0,...cue.notes.map(item=>item.at+item.duration),...cue.percussion.map(item=>item.at+item.duration));
const BUSES=['ui','events','sfx'] as const,DUCKED=['ui','sfx'] as const,GAP:Record<FeedbackBus,number>={ui:.06,events:.09,sfx:.03},NOISE_SECONDS=.12;

/** 반복음의 기계감을 없앤다. 조작음·타건은 피치 ±6%와 음량을, 음악적인 성공음은 음정을 지키고 음량만 살짝 흔든다. */
export function feedbackVariation(bus:FeedbackBus,random:()=>number=Math.random){
 const spread=(range:number)=>(random()*2-1)*range;
 return {pitch:bus==='events'?1:1+spread(FEEDBACK_PITCH_WOBBLE),gain:dbGain(spread(FEEDBACK_GAIN_WOBBLE_DB[bus]))};
}

/** 글자를 바꾸는 키만 타건음을 낸다. 단축키·방향키·자동 반복은 조용히. */
export function isKeystrokeKey(event:{key:string;ctrlKey:boolean;metaKey:boolean;altKey:boolean;repeat?:boolean}){
 if(event.repeat||event.ctrlKey||event.metaKey||event.altKey)return false;
 return event.key.length===1||['Backspace','Delete','Enter','Tab','Process'].includes(event.key);
}

export function createFeedbackPlayer(ctx:AudioContext,random:()=>number=Math.random){
 const master=ctx.createGain(),limiter=ctx.createDynamicsCompressor();
 master.gain.value=dbGain(FEEDBACK_MASTER_DB)*feedbackVolumeGain(DEFAULT_FEEDBACK_PREFERENCES.master);
 limiter.threshold.value=-6;limiter.knee.value=6;limiter.ratio.value=12;limiter.attack.value=.003;limiter.release.value=.12;
 master.connect(limiter);limiter.connect(ctx.destination);
 // Master ← {UI → duck, Events, SFX → duck}. 덕킹은 음량 설정과 분리된 게인 단계라 슬라이더 조작과 겹치지 않는다.
 const busGain=(bus:FeedbackBus,value:FeedbackPreferences)=>feedbackVolumeGain(value[FEEDBACK_BUS_CONTROL[bus]])*dbGain(FEEDBACK_BUS_DB[bus]);
 const buses={ui:ctx.createGain(),events:ctx.createGain(),sfx:ctx.createGain()},ducks={ui:ctx.createGain(),sfx:ctx.createGain()};
 for(const bus of BUSES)buses[bus].gain.value=busGain(bus,DEFAULT_FEEDBACK_PREFERENCES);
 for(const bus of DUCKED){ducks[bus].gain.value=1;buses[bus].connect(ducks[bus]);ducks[bus].connect(master);}
 buses.events.connect(master);
 const voices=new Map<()=>void,FeedbackBus>(),lastPlayed=new Map<Feedback,number>(),ducking={ui:{until:0,db:0},sfx:{until:0,db:0}};
 let enabled=true,disposed=false,generation=0,resuming=false;
 let mix={...DEFAULT_FEEDBACK_PREFERENCES};
 const noise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*NOISE_SECONDS),ctx.sampleRate),samples=noise.getChannelData(0);
 let seed=17;
 for(let i=0;i<samples.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;samples[i]=seed/2147483648-1;}
 const stopVoices=(bus?:FeedbackBus)=>{for(const [stop,channel] of [...voices])if(!bus||channel===bus)stop();};
 // 성공·보상음은 타건·조작음 자리를 빌려서라도 끝까지 울린다. 타건은 자기 몫 이상을 쓰지 않는다.
 const claim=(bus:FeedbackBus)=>{
  if(bus==='sfx'&&[...voices.values()].filter(channel=>channel==='sfx').length>=FEEDBACK_SFX_VOICES)return false;
  if(voices.size<FEEDBACK_MAX_VOICES)return true;
  if(bus!=='events')return false;
  for(const [stop,channel] of voices)if(channel!=='events'){stop();return true;}
  return false;
 };
 const track=(source:AudioScheduledSourceNode,nodes:AudioNode[],end:number,bus:FeedbackBus)=>{
  let done=false;
  const cleanup=()=>{if(done)return;done=true;voices.delete(stop);for(const node of nodes)node.disconnect();};
  const stop=()=>{try{source.stop();}catch{/* 이미 끝난 소리. */}cleanup();};
  voices.set(stop,bus);source.onended=cleanup;source.stop(end);
 };
 const tone=(item:Note,start:number,bus:FeedbackBus,variation:ReturnType<typeof feedbackVariation>)=>{
  if(!claim(bus))return;
  const source=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();
  source.type=item.wave??'sine';source.frequency.setValueAtTime(midiFrequency(item.midi)*variation.pitch,start);
  if(item.endMidi!==undefined)source.frequency.exponentialRampToValueAtTime(midiFrequency(item.endMidi)*variation.pitch,start+item.duration);
  filter.type='lowpass';filter.frequency.value=4800;filter.Q.value=.5;
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(item.peak*variation.gain,start+.005);
  gain.gain.exponentialRampToValueAtTime(.0001,start+item.duration);gain.gain.setValueAtTime(0,start+item.duration+.005);
  source.connect(filter);filter.connect(gain);gain.connect(buses[bus]);source.start(start);track(source,[source,filter,gain],start+item.duration+.01,bus);
 };
 const percussion=(item:Hit,start:number,bus:FeedbackBus,variation:ReturnType<typeof feedbackVariation>)=>{
  if(!claim(bus))return;
  const source=ctx.createBufferSource(),high=ctx.createBiquadFilter(),low=ctx.createBiquadFilter(),gain=ctx.createGain();
  source.buffer=noise;source.playbackRate.value=variation.pitch;
  high.type='highpass';high.frequency.value=item.high;high.Q.value=.5;low.type='lowpass';low.frequency.value=item.low;low.Q.value=.5;
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(item.peak*variation.gain,start+.003);gain.gain.exponentialRampToValueAtTime(.0001,start+item.duration);
  // 같은 노이즈 버퍼의 다른 구간을 읽어 반복 타격도 결이 매번 달라진다.
  const offset=random()*Math.max(0,NOISE_SECONDS-(item.duration+.005)*variation.pitch);
  source.connect(high);high.connect(low);low.connect(gain);gain.connect(buses[bus]);source.start(start,offset);track(source,[source,high,low,gain],start+item.duration+.005,bus);
 };
 const duck=(db:number,start:number,hold:number)=>{
  const now=ctx.currentTime;
  for(const bus of DUCKED){
   // 앞선 덕킹이 아직 유지 중이면 더 깊고 긴 쪽으로 합쳐 펌핑을 막는다.
   const previous=ducking[bus],active=previous.until>now,depth=active?Math.min(db,previous.db):db,until=Math.max(start+hold,active?previous.until:0);
   const param=ducks[bus].gain;ducking[bus]={until,db:depth};
   param.cancelScheduledValues(now);param.setValueAtTime(param.value,now);
   param.setTargetAtTime(dbGain(depth),start,FEEDBACK_DUCK_ATTACK);param.setTargetAtTime(1,until,FEEDBACK_DUCK_RELEASE);
  }
 };
 return {
  setMix(value:FeedbackPreferences){
   if(disposed)return;
   const changed=BUSES.some(bus=>value[FEEDBACK_BUS_CONTROL[bus]]!==mix[FEEDBACK_BUS_CONTROL[bus]])||value.master!==mix.master;
   mix={...value};
   if(!changed)return;
   master.gain.setTargetAtTime(dbGain(FEEDBACK_MASTER_DB)*feedbackVolumeGain(value.master),ctx.currentTime,.015);
   for(const bus of BUSES){
    buses[bus].gain.setTargetAtTime(busGain(bus,value),ctx.currentTime,.015);
    if(value.master===0||value[FEEDBACK_BUS_CONTROL[bus]]===0)stopVoices(bus);
   }
   if(value.master===0)generation++;
  },
  setEnabled(value:boolean){enabled=value;if(!value){generation++;lastPlayed.clear();stopVoices();}},
  /** delay는 오디오 시계 기준 초. 실행 펄스 뒤에 결과음을 정확히 착지시킬 때 쓴다. */
  play(kind:Feedback,delay=0){
   const bus=feedbackBus(kind),control=FEEDBACK_BUS_CONTROL[bus];
   if(!enabled||disposed||mix.master===0||mix[control]===0)return;
   if(ctx.currentTime-(lastPlayed.get(kind)??-Infinity)<GAP[bus])return;
   lastPlayed.set(kind,ctx.currentTime);
   const token=generation,lead=Number.isFinite(delay)?Math.min(FEEDBACK_MAX_DELAY,Math.max(0,delay)):0;
   const schedule=()=>{
    if(!enabled||disposed||generation!==token||ctx.state!=='running'||mix.master===0||mix[control]===0)return;
    if(bus==='events')stopVoices('ui');
    const start=ctx.currentTime+.005+lead,cue=FEEDBACK_CUES[kind],variation=feedbackVariation(bus,random),depth=FEEDBACK_DUCK_DB[kind];
    if(depth!==undefined)duck(depth,start,cueLength(cue));
    for(const item of cue.notes)tone(item,start+item.at,bus,variation);
    for(const item of cue.percussion)percussion(item,start+item.at,bus,variation);
   };
   try{
    if(ctx.state==='suspended'){
     if(resuming)return;resuming=true;
     void ctx.resume().then(schedule).catch(()=>{}).finally(()=>{resuming=false;});
    }else schedule();
   }catch{/* 소리가 입력이나 의뢰 진행을 막지 않는다. */}
  },
  dispose(){if(disposed)return;disposed=true;generation++;stopVoices();for(const bus of BUSES)buses[bus].disconnect();for(const bus of DUCKED)ducks[bus].disconnect();master.disconnect();limiter.disconnect();},
 };
}
