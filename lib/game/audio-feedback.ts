export type Feedback='click'|'success'|'retry'|'reward'|'opening';
type Note={midi:number;at:number;duration:number;peak:number};
type Cue={notes:readonly Note[];percussion:readonly number[]};
const note=(midi:number,at:number,duration=.2,peak=.09):Note=>({midi,at,duration,peak});

// C major / add9, with a gentle question rather than a low failure buzzer.
export const FEEDBACK_CUES:Record<Feedback,Cue>={
 click:{notes:[note(76,0,.065,.065)],percussion:[]},
 success:{notes:[note(72,0),note(76,.065),note(79,.13),note(86,.195,.22,.065)],percussion:[]},
 retry:{notes:[note(76,0,.14,.07),note(74,.09,.14,.065),note(79,.18,.18,.06)],percussion:[]},
 reward:{notes:[note(72,0),note(76,.075),note(79,.15),note(86,.225,.23,.065),note(84,.3,.26)],percussion:[0,.15]},
 opening:{notes:[note(72,0,.28),note(76,.08,.28),note(79,.16,.28),note(86,.24,.28,.065),note(79,.32,.25),note(84,.4,.32)],percussion:[0,.16,.32]},
};
export const FEEDBACK_MASTER_DB=-8;
export const FEEDBACK_MAX_VOICES=12;
export const midiFrequency=(midi:number)=>440*2**((midi-69)/12);
export const dbGain=(db:number)=>10**(db/20);

export function createFeedbackPlayer(ctx:AudioContext){
 const master=ctx.createGain();master.gain.value=dbGain(FEEDBACK_MASTER_DB);master.connect(ctx.destination);
 const voices=new Set<()=>void>();let enabled=true,disposed=false,generation=0,lastClick=-Infinity;
 // A short, filtered shaker: no bass thump or sustained noise underneath work.
 const noise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.045),ctx.sampleRate),samples=noise.getChannelData(0);
 let seed=17;
 for(let i=0;i<samples.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;samples[i]=seed/2147483648-1;}
 const stopVoices=()=>{for(const stop of [...voices])stop();};
 const track=(source:OscillatorNode|AudioBufferSourceNode,nodes:AudioNode[],start:number,duration:number)=>{
  let done=false;
  const cleanup=()=>{if(done)return;done=true;voices.delete(stop);for(const node of nodes)node.disconnect();};
  const stop=()=>{try{source.stop();}catch{/* Already ended. */}cleanup();};
  voices.add(stop);source.onended=cleanup;source.start(start);source.stop(start+duration);
 };
 const tone=(item:Note,start:number)=>{
  if(voices.size>=FEEDBACK_MAX_VOICES)return;
  const source=ctx.createOscillator(),gain=ctx.createGain();
  source.type='sine';source.frequency.value=midiFrequency(item.midi);
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(item.peak,start+.008);
  gain.gain.exponentialRampToValueAtTime(.0001,start+item.duration);gain.gain.setValueAtTime(0,start+item.duration+.005);
  source.connect(gain);gain.connect(master);track(source,[source,gain],start,item.duration+.01);
 };
 const percussion=(start:number)=>{
  if(voices.size>=FEEDBACK_MAX_VOICES)return;
  const source=ctx.createBufferSource(),high=ctx.createBiquadFilter(),low=ctx.createBiquadFilter(),gain=ctx.createGain();
  source.buffer=noise;high.type='highpass';high.frequency.value=1800;high.Q.value=.5;low.type='lowpass';low.frequency.value=6500;low.Q.value=.5;
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.018,start+.003);gain.gain.exponentialRampToValueAtTime(.0001,start+.04);
  source.connect(high);high.connect(low);low.connect(gain);gain.connect(master);track(source,[source,high,low,gain],start,.045);
 };
 return {
  setEnabled(value:boolean){enabled=value;if(!value){generation++;stopVoices();}},
  play(kind:Feedback){
   if(!enabled||disposed)return;
   if(kind==='click'){if(ctx.currentTime-lastClick<.045)return;lastClick=ctx.currentTime;}
   const token=generation;
   const schedule=()=>{if(!enabled||disposed||generation!==token||ctx.state!=='running')return;
    const start=ctx.currentTime+.005,cue=FEEDBACK_CUES[kind];
    for(const item of cue.notes)tone(item,start+item.at);
    for(const at of cue.percussion)percussion(start+at);
   };
   try{if(ctx.state==='suspended')void ctx.resume().then(schedule).catch(()=>{});else schedule();}catch{/* Audio never blocks input. */}
  },
  dispose(){if(disposed)return;disposed=true;generation++;stopVoices();master.disconnect();},
 };
}
