'use client';
import {useEffect,useRef} from 'react';
import {bgmLevel,bgmMood,createBgmPlayer,type BgmPlayer} from '@/lib/game/bgm';
import type {FeedbackPreferences} from '@/lib/game/feedback-preferences';
// 보상음이 울리는 순간 배경음을 잠깐 낮추기 위해 효과음 쪽에서 부른다.
let activeMusic:BgmPlayer|null=null;
export function duckBackgroundMusic(db:number){activeMusic?.duck(db);}
/** 브라우저 자동재생 정책 때문에 첫 클릭이나 키 입력 뒤에 시작한다. 음량 0이나 음소거면 스케줄러도 멈춘다.
 * mood: 'lofi'(기본)·'synthwave'. 모르는 값은 lofi. 재생 중에 바꾸면 다음 마디 첫 박에서 넘어간다. */
export function useBackgroundMusic(enabled:boolean,mix:FeedbackPreferences,mood?:string){
 const context=useRef<AudioContext|null>(null),player=useRef<BgmPlayer|null>(null),level=useRef(0);
 const target=bgmLevel(enabled,mix),selected=bgmMood(mood),moodRef=useRef(selected);
 useEffect(()=>{moodRef.current=selected;player.current?.setMood(selected);},[selected]);
 useEffect(()=>{
  level.current=target;
  const current=player.current;
  if(current){current.setLevel(target);if(target>0&&!document.hidden){void context.current?.resume().catch(()=>{});current.start();}else current.stop();return;}
  if(target<=0)return;
  const unlock=()=>{
   remove();
   try{
    const ctx=context.current??(context.current=new AudioContext({latencyHint:'playback'}));
    const music=player.current??(player.current=createBgmPlayer(ctx,moodRef.current));activeMusic=music;
    music.setLevel(level.current);
    void ctx.resume().then(()=>{if(level.current>0&&!document.hidden)music.start();}).catch(()=>{});
   }catch{/* 배경음은 플레이를 막지 않는다. */}
  };
  const remove=()=>{window.removeEventListener('pointerdown',unlock,true);window.removeEventListener('keydown',unlock,true);};
  window.addEventListener('pointerdown',unlock,true);window.addEventListener('keydown',unlock,true);
  return remove;
 },[target]);
 useEffect(()=>{
  const visible=()=>{const music=player.current,ctx=context.current;if(!music||!ctx)return;if(document.hidden){music.stop();void ctx.suspend().catch(()=>{});}else if(level.current>0){void ctx.resume().then(()=>music.start()).catch(()=>{});}};
  document.addEventListener('visibilitychange',visible);
  return()=>document.removeEventListener('visibilitychange',visible);
 },[]);
 useEffect(()=>()=>{if(activeMusic===player.current)activeMusic=null;player.current?.dispose();player.current=null;void context.current?.close().catch(()=>{});context.current=null;},[]);
}
