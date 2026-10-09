'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Settings2,Monitor,FolderOpen,MessageCircle,Code2,TerminalSquare} from 'lucide-react';
import {type Language} from '@/lib/game/i18n';
import {Wallpaper} from './DesktopOS';
import type {GameState} from '@/lib/game/engine';
export function TitleScreen({state,language,onLanguage,onStart,onSettings,onNew}:{state:GameState;language:Language;onLanguage:(l:Language)=>void;onStart:()=>void;onSettings:()=>void;onNew:()=>void}){
 const [ready,setReady]=useState(false),start=useRef<HTMLButtonElement>(null),hasSave=state.accepted||state.gameplay.readMessages.length>0;
 const tr=(ko:string,en:string,ja:string)=>language==='ko'?ko:language==='en'?en:ja;
 useEffect(()=>{setReady(true);requestAnimationFrame(()=>start.current?.focus());},[]);
 return <section className="pc-title-screen" aria-label={tr('타이틀 화면','Title screen','タイトル画面')}>
  <Wallpaper/>
  <header><span><Monitor size={19}/> SHIFT SYSTEMS</span><select value={language} onChange={e=>onLanguage(e.target.value as Language)} aria-label="Language"><option value="ko" lang="ko">한국어</option><option value="en" lang="en">English</option><option value="ja" lang="ja">日本語</option></select></header>
  <div className="pc-title-layout"><div className="pc-title-copy"><div className="pc-title-kicker">A DESKTOP ADVENTURE</div><h1>CODE<span>:</span><br/>SHIFT<span className="title-cursor">_</span></h1><p>{tr('누군가의 고장 난 하루를,\n당신의 컴퓨터로 고쳐 주세요.','Fix someone’s broken day.\nOne small change on your computer.','誰かの困った一日を、\nあなたのパソコンで直そう。')}</p><div className="pc-title-menu"><button ref={start} className="pc-play" disabled={!ready} onClick={onStart}>{hasSave?tr('이어하기','Continue','つづきから'):tr('시작하기','Start','はじめる')}<ArrowRight size={21}/></button>{hasSave&&<button onClick={onNew}>{tr('새로 시작','New game','最初から')}</button>}<button onClick={onSettings}><Settings2 size={17}/>{tr('설정','Settings','設定')}</button></div><small>{hasSave?tr(`완료한 의뢰 ${state.completed.length}/3 · 이 브라우저에 저장됨`,`${state.completed.length}/3 cases completed · Saved in this browser`,`完了した依頼 ${state.completed.length}/3 · このブラウザに保存`):tr('코딩 경험 없이 시작하세요. 첫 메시지가 안내해 줍니다.','No coding experience needed. Your first message shows the way.','コーディング未経験でも大丈夫。最初のメッセージが案内します。')}</small></div>
  <div className="pc-title-preview" aria-hidden="true"><div className="preview-monitor"><div className="preview-desktop"><Wallpaper/><div className="preview-icons"><FolderOpen/><MessageCircle/><Code2/><TerminalSquare/></div><div className="preview-message"><header><MessageCircle size={16}/>{tr('지우','Jiwoo','ジウ')}<span>− &nbsp; ×</span></header><div><b>{tr('메뉴판이 이상해요.','Something’s wrong with the menu.','メニューがおかしいんです。')}</b><p>{tr('휴대폰에서 메뉴가 잘려요.\n파일을 보낼 테니 한번 봐줄래요?','The menu is cut off on my phone.\nCan you take a look at the files?','スマホではメニューが切れています。\nファイルを見てもらえますか？')}</p><span>{tr('첨부 · menu-site','Attachment · menu-site','添付 · menu-site')}</span></div></div><div className="preview-taskbar"><Monitor size={13}/><FolderOpen size={13}/><MessageCircle size={13}/><span>09:41</span></div></div></div><div className="monitor-stand"/><div className="monitor-foot"/></div></div>
  <footer><span>{tr('마우스 · 키보드 / 진행 자동 저장','Mouse · Keyboard / Progress autosaves','マウス · キーボード / 進行を自動保存')}</span><a href={language==='ko'?'/about':'/about/'+language}>{tr('게임 소개','About the game','ゲームについて')} ↗</a><span>한국어 · English · 日本語</span></footer>
 </section>;
}
