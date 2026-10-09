'use client';
import {useCallback,useEffect,useRef} from 'react';
import {createFeedbackPlayer,type Feedback} from '@/lib/game/audio-feedback';
export type {Feedback} from '@/lib/game/audio-feedback';
export function useGameFeedback(enabled:boolean){
 const context=useRef<AudioContext|null>(null);
 const player=useRef<ReturnType<typeof createFeedbackPlayer>|null>(null);
 useEffect(()=>{player.current?.setEnabled(enabled);},[enabled]);
 useEffect(()=>()=>{player.current?.dispose();player.current=null;void context.current?.close().catch(()=>{});context.current=null;},[]);
 return useCallback((kind:Feedback)=>{
  if(!enabled)return;
  try{
   const ctx=context.current??(context.current=new AudioContext());
   const audio=player.current??(player.current=createFeedbackPlayer(ctx));
   audio.setEnabled(enabled);audio.play(kind);
  }catch{/* Sound must never block a quest or an input. */}
 },[enabled]);
}
