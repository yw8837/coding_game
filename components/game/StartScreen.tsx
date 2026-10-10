'use client';
import {useEffect,useRef,useState,type KeyboardEvent} from 'react';
import {ArrowRight,Play,RotateCcw,Settings2} from 'lucide-react';
import {type Language} from '@/lib/game/i18n';
import {TitleWorkspace} from './TitleWorkspace';
import '@/app/title-screen.css';
export function TitleScreen({hasSave,language,onStart,onSettings,onNew,loading=false,unavailable=false,paused=false,edition='full'}:{hasSave:boolean;language:Language;onStart:()=>void;onSettings:()=>void;onNew:()=>void;loading?:boolean;unavailable?:boolean;paused?:boolean;edition?:import('@/lib/game/edition').GameEdition}){
 const [ready,setReady]=useState(false);
 // The title is a continuous ambient scene; gameplay motion preferences stay separate.
 const animate=ready;
 const start=useRef<HTMLButtonElement>(null),resume=useRef<HTMLButtonElement>(null),room=useRef<HTMLDivElement>(null);
 const frame=useRef(0);
 const tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[language];
 // eslint-disable-next-line react-hooks/set-state-in-effect -- Gate controls until hydration and save loading finish.
 useEffect(()=>{setReady(true);return()=>cancelAnimationFrame(frame.current);},[]);
 useEffect(()=>{
  if(!ready||loading||unavailable)return;
  const focus=requestAnimationFrame(()=>(hasSave?resume:start).current?.focus());
  return()=>cancelAnimationFrame(focus);
 },[ready,loading,hasSave,unavailable]);
 const moveRoom=(x:number,y:number)=>{
  cancelAnimationFrame(frame.current);
  frame.current=requestAnimationFrame(()=>{
   room.current?.style.setProperty('--room-x',x.toFixed(2)+'px');
   room.current?.style.setProperty('--room-y',y.toFixed(2)+'px');
  });
 };
 const navigate=(event:KeyboardEvent<HTMLElement>)=>{
  if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
  const buttons=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
  const index=buttons.indexOf(document.activeElement as HTMLButtonElement);
  const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;
  event.preventDefault();buttons[next]?.focus();
 };
 const blocked=!ready||loading||unavailable;
 return <section className="pc-title-screen title-home" data-no-translate data-paused={paused} data-motion={animate?'animated':'still'} aria-label={tr('타이틀 화면','Title screen','タイトル画面')} onPointerMove={event=>{
  if(!animate||paused||event.pointerType!=='mouse'||window.matchMedia('(pointer: coarse)').matches)return;
  const bounds=event.currentTarget.getBoundingClientRect();
  moveRoom((event.clientX/bounds.width-.5)*-16,(event.clientY/bounds.height-.5)*-10);
 }} onPointerLeave={()=>moveRoom(0,0)}>
  <div ref={room} className="title-room"><TitleWorkspace paused={paused||!animate}/></div>
  <div className="title-home-content">
   <span className="title-home-edition">{edition==='demo'?tr('무료 데모','FREE DEMO','無料体験版'):tr('개발자 시뮬레이터','A CODING SIMULATOR','開発者シミュレーター')}</span>
   <h1 className="title-home-logo" aria-label="CODE:SHIFT"><span>CODE<em>:</em></span><span>SHIFT</span></h1>
   <p className="title-home-description">{tr('동네 카페의 작은 부탁으로 시작하는 개발자 생활.','Your life as a developer starts with a favor for the café next door.','近所のカフェからの小さなお願い。それが、開発者生活のはじまり。')}</p>
   <nav className="title-home-menu" aria-label={tr('메인 메뉴','Main menu','メインメニュー')} onKeyDown={navigate}>
    <button type="button" ref={start} data-testid="title-new" className={!hasSave?'pc-play':undefined} disabled={blocked} onClick={onNew}><Play aria-hidden="true"/><span>{tr('새로 시작','New game','はじめから')}</span>{!hasSave&&<ArrowRight aria-hidden="true"/>}</button>
    <button type="button" ref={resume} data-testid="title-continue" className={hasSave?'pc-play':undefined} disabled={blocked||!hasSave} onClick={onStart}><RotateCcw aria-hidden="true"/><span>{tr('이어하기','Continue','つづきから')}</span>{hasSave?<ArrowRight aria-hidden="true"/>:<small>{tr('저장 없음','No save','セーブなし')}</small>}</button>
    <button type="button" data-testid="title-settings" onClick={onSettings}><Settings2 aria-hidden="true"/><span>{tr('설정','Settings','設定')}</span></button>
   </nav>
   <p className="title-home-status" role="status">{loading?tr('저장 기록 불러오는 중…','Loading your save…','セーブを読み込み中…'):hasSave&&!unavailable?tr('진행 상황은 자동으로 저장됩니다.','Your progress saves automatically.','進行状況は自動で保存されます。'):''}</p>
  </div>
 </section>;
}
