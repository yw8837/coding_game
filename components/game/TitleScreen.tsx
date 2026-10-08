'use client';
import {useEffect,useRef} from 'react';
import {ArrowRight,Settings2} from 'lucide-react';
import {CafeScene} from './CafeScene';
import {localizeUI,type Language} from '@/lib/game/i18n';
import type {GameState} from '@/lib/game/engine';

export function TitleScreen({state,language,onLanguage,onStart,onSettings,onNew}:{state:GameState;language:Language;onLanguage:(l:Language)=>void;onStart:()=>void;onSettings:()=>void;onNew:()=>void}){
 const start=useRef<HTMLButtonElement>(null),hasSave=state.accepted||state.gameplay.readMessages.length>0;
 useEffect(()=>{start.current?.focus();},[]);
 return localizeUI(<section className="title-screen" aria-label="타이틀 화면">
  <div className="title-top"><span>CODE:SHIFT</span><select value={language} onChange={e=>onLanguage(e.target.value as Language)} aria-label="Language"><option value="ko" lang="ko">한국어</option><option value="en" lang="en">English</option><option value="ja" lang="ja">日本語</option></select></div>
  <div className="title-content"><div className="title-copy"><span className="title-story">모노 카페 이야기</span><h1>다시 문을<br/>여는 날.</h1><p>골목의 작은 카페에서 메시지가 도착했다.<br/>내 컴퓨터로 할 수 있는 일이 있을까?</p><div className="title-menu"><button ref={start} className="title-start" onClick={onStart}>{hasSave?'이어하기':'시작하기'}<ArrowRight size={22}/></button>{hasSave&&<button onClick={onNew}>새로 시작</button>}<button onClick={onSettings}><Settings2 size={17}/>설정</button></div>{hasSave&&<small>해결한 의뢰 {state.completed.length} / 3 · 자동 저장된 이야기</small>}</div><div className="title-art"><CafeScene completed={state.completed} opened={state.gameplay.openingCelebrated}/></div></div>
  <footer><span>마우스로 선택 · Tab / Enter로 조작</span><span>한국어 · English · 日本語</span></footer>
 </section>);
}
