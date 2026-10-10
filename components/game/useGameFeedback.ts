'use client';
import {useCallback,useEffect,useRef} from 'react';
import {createFeedbackPlayer,type Feedback} from '@/lib/game/audio-feedback';
export type {Feedback} from '@/lib/game/audio-feedback';
import {DEFAULT_FEEDBACK_PREFERENCES,type FeedbackPreferences} from '@/lib/game/feedback-preferences';
type PlayFeedback=(kind:Feedback,delay?:number)=>void;
// GameShell이 가진 플레이어 하나를 터미널·코드 입력처럼 깊은 곳에서도 props 없이 부른다.
let activeFeedback:PlayFeedback|null=null;
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
 const play=useCallback<PlayFeedback>((kind,delay)=>{
  if(!enabled||document.hidden)return;
  try{
   const ctx=context.current??(context.current=new AudioContext({latencyHint:'interactive'}));
   const audio=player.current??(player.current=createFeedbackPlayer(ctx));
   audio.setEnabled(enabled);audio.setMix(mix);audio.play(kind,delay);
  }catch{/* Sound must never block a quest or an input. */}
 },[enabled,mix]);
 useEffect(()=>{activeFeedback=play;return()=>{if(activeFeedback===play)activeFeedback=null;};},[play]);
 return play;
}
/** 타건·실행음 같은 국소 반응용. 아직 GameShell 플레이어가 없으면 조용히 넘어간다. */
export function playGameFeedback(kind:Feedback,delay?:number){activeFeedback?.(kind,delay);}

type Motion='pass'|'retry'|'proof'|'entry'|'error';
const GLOW='rgba(34,197,94,';
// 짧게 과장했다가 제자리로 돌아오는 일회성 반응. 성공은 튀어 오르고, 실패는 살짝 고개를 젓는다.
const MOTIONS:Record<Motion,readonly {frames:Keyframe[];duration:number;easing:string}[]>={
 pass:[{frames:[{transform:'scale(.97)'},{transform:'scale(1)'}],duration:360,easing:'cubic-bezier(.34,1.56,.64,1)'},{frames:[{boxShadow:`0 0 0 0 ${GLOW}.55)`},{boxShadow:`0 0 0 14px ${GLOW}0)`}],duration:620,easing:'cubic-bezier(.16,1,.3,1)'}],
 proof:[{frames:[{transform:'scale(.98)'},{transform:'scale(1)'}],duration:320,easing:'cubic-bezier(.34,1.56,.64,1)'},{frames:[{boxShadow:`0 0 0 0 ${GLOW}.5)`,backgroundColor:`${GLOW}.16)`},{boxShadow:`0 0 0 10px ${GLOW}0)`,backgroundColor:`${GLOW}0)`}],duration:900,easing:'ease-out'}],
 retry:[{frames:[{transform:'translateX(0)'},{transform:'translateX(-4px)'},{transform:'translateX(3px)'},{transform:'translateX(-1px)'},{transform:'translateX(0)'}],duration:260,easing:'ease-out'}],
 entry:[{frames:[{opacity:.25,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],duration:160,easing:'cubic-bezier(.16,1,.3,1)'}],
 error:[{frames:[{opacity:.25,transform:'translateX(0)'},{opacity:1,transform:'translateX(-3px)',offset:.4},{opacity:1,transform:'translateX(2px)',offset:.7},{opacity:1,transform:'translateX(0)'}],duration:240,easing:'ease-out'}],
};
/** delay(ms) 동안은 첫 프레임을 유지해, 결과음이 착지하는 순간에 맞춰 튀어 오른다. 동작 줄이기 설정이면 움직이지 않는다. */
export function playFeedbackMotion(element:Element|null|undefined,motion:Motion,delay=0){
 if(!element||typeof element.animate!=='function'||document.documentElement.dataset.gameReducedMotion==='true')return;
 try{for(const layer of MOTIONS[motion])element.animate(layer.frames,{duration:layer.duration,easing:layer.easing,delay,fill:'backwards'});}catch{/* 연출은 입력이나 결과 표시를 막지 않는다. */}
}
