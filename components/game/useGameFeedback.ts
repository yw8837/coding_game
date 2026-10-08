'use client';
import {useCallback,useEffect,useRef} from 'react';
export type Feedback='click'|'success'|'retry'|'reward'|'opening';
const NOTES:Record<Feedback,number[]>={click:[440],success:[523,659,784],retry:[294,262],reward:[523,659,784,1047],opening:[523,659,784,1047,988,1047]};
export function useGameFeedback(enabled:boolean){
 const context=useRef<AudioContext|null>(null);
 useEffect(()=>()=>{void context.current?.close().catch(()=>{});context.current=null;},[]);
 return useCallback((kind:Feedback)=>{
  if(!enabled)return;
  try{
   const ctx=context.current??(context.current=new AudioContext());
   const play=()=>{if(ctx.state!=='running')return;NOTES[kind].forEach((frequency,i)=>{
    const osc=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime+i*.085;
    osc.type='sine';osc.frequency.value=frequency;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(kind==='click'?.025:.055,start+.01);gain.gain.exponentialRampToValueAtTime(.001,start+(kind==='click'?.06:.24));
    osc.connect(gain);gain.connect(ctx.destination);osc.start(start);osc.stop(start+.27);osc.onended=()=>{osc.disconnect();gain.disconnect();};
   });};
   if(ctx.state==='suspended')void ctx.resume().then(play).catch(()=>{});else play();
  }catch{/* Sound must never block a quest or an input. */}
 },[enabled]);
}
