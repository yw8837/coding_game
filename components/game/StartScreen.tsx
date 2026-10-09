'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Settings2,Monitor} from 'lucide-react';
import {type Language} from '@/lib/game/i18n';
import {CampaignGoal} from './CampaignGoal';
import {LanguageSelect} from './LanguageSelect';
import type {GameState} from '@/lib/game/engine';
export function TitleScreen({state,language,onStart,onSettings,onNew,loading=false,desktop=false}:{state:GameState;language:Language;onStart:()=>void;onSettings:()=>void;onNew:()=>void;loading?:boolean;desktop?:boolean}){
 const [ready,setReady]=useState(false),start=useRef<HTMLButtonElement>(null),hasSave=state.accepted||state.gameplay.readMessages.length>0;
 const tr=(ko:string,en:string,ja:string)=>language==='ko'?ko:language==='en'?en:ja;
 // eslint-disable-next-line react-hooks/set-state-in-effect -- Client mount marks hydration readiness and schedules initial focus; the SSR render intentionally keeps Start disabled.
 useEffect(()=>{setReady(true);requestAnimationFrame(()=>start.current?.focus());},[]);
 return <section className="pc-title-screen" aria-label={tr('타이틀 화면','Title screen','タイトル画面')}>
  <img className="title-environment" src="/game-art/studio-evening.png" alt="" width={1672} height={941} fetchPriority="high"/>
  <header><span><Monitor size={19}/> SHIFT SYSTEMS</span><LanguageSelect/></header>
  <div className="pc-title-layout"><div className="pc-title-copy"><div className="pc-title-kicker">{tr('프리랜서 개발자 시뮬레이터','A FREELANCE DEVELOPER SIMULATOR','フリーランス開発者シミュレーター')}</div><h1>CODE<span>:</span><br/>SHIFT<span className="title-cursor">_</span></h1><p>{tr('카페를 돕고, 동네의 문제를 고쳐\n내 첫 프로그램을 배포하세요.','Help the café. Fix the neighborhood.\nRelease your first program.','カフェを助け、まちの問題を直し、\n自分の最初の作品を公開しよう。')}</p><div className="pc-title-menu"><button ref={start} className="pc-play" disabled={!ready||loading} onClick={onStart}>{hasSave?tr('이어하기','Continue','つづきから'):tr('시작하기','Start','はじめる')}<ArrowRight size={21}/></button>{hasSave&&<button disabled={loading} onClick={onNew}>{tr('새로 시작','New game','最初から')}</button>}<button onClick={onSettings}><Settings2 size={17}/>{tr('설정','Settings','設定')}</button></div><small>{hasSave?tr(`완료한 의뢰 ${state.completed.length+state.gameplay.career.completed.length}/21 · 진행 자동 저장`,`${state.completed.length+state.gameplay.career.completed.length}/21 cases completed · Progress autosaved`,`完了した依頼 ${state.completed.length+state.gameplay.career.completed.length}/21 · 進行を自動保存`):tr('코딩 경험 없이 시작하세요. 첫 메시지가 안내해 줍니다.','No coding experience needed. Your first message shows the way.','コーディング未経験でも大丈夫。最初のメッセージが案内します。')}</small></div>
  <div className="title-goal-card"><CampaignGoal state={state}/></div></div>

  <footer><span>{tr('마우스 · 키보드 / 진행 자동 저장','Mouse · Keyboard / Progress autosaves','マウス · キーボード / 進行を自動保存')}</span>{!desktop&&<a href={language==='ko'?'/about':'/about/'+language}>{tr('게임 소개','About the game','ゲームについて')} ↗</a>}<span>한국어 · English · 日本語</span></footer>
 </section>;
}
