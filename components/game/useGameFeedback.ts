'use client';
import {useCallback,useEffect,useRef} from 'react';
import {createFeedbackPlayer,type Feedback} from '@/lib/game/audio-feedback';
export type {Feedback} from '@/lib/game/audio-feedback';
import {DEFAULT_FEEDBACK_PREFERENCES,type FeedbackPreferences} from '@/lib/game/feedback-preferences';
export function useGameFeedback(enabled:boolean,mix:FeedbackPreferences=DEFAULT_FEEDBACK_PREFERENCES){
 const context=useRef<AudioContext|null>(null);
 const player=useRef<ReturnType<typeof createFeedbackPlayer>|null>(null);
 useEffect(()=>{player.current?.setEnabled(enabled&&!document.hidden);player.current?.setMix(mix);},[enabled,mix]);
 useEffect(()=>{
  const visible=()=>{player.current?.setEnabled(enabled&&!document.hidden);if(document.hidden)void context.current?.suspend().catch(()=>{});};
  document.addEventListener('visibilitychange',visible);
  return()=>document.removeEventListener('visibilitychange',visible);
 },[enabled]);
 useEffect(()=>()=>{player.current?.dispose();player.current=null;void context.current?.close().catch(()=>{});context.current=null;},[]);
 return useCallback((kind:Feedback)=>{
  if(!enabled||document.hidden)return;
  try{
   const ctx=context.current??(context.current=new AudioContext({latencyHint:'interactive'}));
   const audio=player.current??(player.current=createFeedbackPlayer(ctx));
   audio.setEnabled(enabled);audio.setMix(mix);audio.play(kind);
  }catch{/* Sound must never block a quest or an input. */}
 },[enabled,mix]);
}
