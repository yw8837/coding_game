'use client';
import {useCallback,useEffect,useRef,useState,type ReactNode} from 'react';
import {Monitor,Globe,Code2,TerminalSquare,MessageCircle,FolderOpen,FileText,Settings2,Trophy,Palette,Server,Send,LayoutGrid,Search,Power,Volume2,VolumeX,Wifi,PanelRight,Check,Flag,Puzzle,Expand} from 'lucide-react';
import {useLanguage,t} from '@/lib/game/i18n';
import {gameMessages} from '@/lib/game/gameplay';
import {openWindow,focusedWindow,type WindowState,type Bounds} from '@/lib/game/windows';
import {DesktopWindow} from './DesktopWindow';
import {QuestTracker,QuestRibbon} from './QuestTracker';
import type {AppId,GameProps} from './types';

export const DESKTOP_APPS=[
 {id:'computer',ko:'내 PC',en:'This PC',ja:'PC',icon:FolderOpen,color:'gold'},
 {id:'messages',ko:'메시지',en:'Messages',ja:'メッセージ',icon:MessageCircle,color:'green'},
 {id:'browser',ko:'그롬',en:'Grome',ja:'グローム',icon:Globe,color:'blue'},
 {id:'editor',ko:'에디터',en:'Editor',ja:'エディター',icon:Code2,color:'blue'},
 {id:'terminal',ko:'터미널',en:'Terminal',ja:'ターミナル',icon:TerminalSquare,color:'dark'},
 {id:'notes',ko:'메모장',en:'Notepad',ja:'メモ帳',icon:FileText,color:'paper'},
 {id:'career',ko:'의뢰 센터',en:'Contracts',ja:'依頼センター',icon:FolderOpen,color:'gold'},
 {id:'challenges',ko:'연습 의뢰',en:'Practice jobs',ja:'練習の依頼',icon:Puzzle,color:'orange'},
 {id:'server',ko:'서버',en:'Server',ja:'サーバー',icon:Server,color:'slate'},
 {id:'api',ko:'요청 실험실',en:'API lab',ja:'APIラボ',icon:Send,color:'orange'},
 {id:'achievements',ko:'성취',en:'Achievements',ja:'実績',icon:Trophy,color:'gold'},
 {id:'workbench',ko:'꾸미기',en:'Personalize',ja:'個人設定',icon:Palette,color:'purple'},
] as const;

export function useDesktopManager(){
 const [windows,setWindows]=useState<WindowState[]>([]),[bounds,setBounds]=useState<Bounds>({width:1100,height:750}),[compact,setCompact]=useState(false);
 const app=focusedWindow(windows) as AppId;
 const setApp=useCallback((id:AppId)=>setWindows(list=>id==='desktop'?list.map(w=>({...w,minimized:true})):openWindow(list,id,bounds)),[bounds]);
 const focus=useCallback((id:string)=>setWindows(list=>{if(focusedWindow(list)===id)return list;return [...list.filter(w=>w.id!==id),...list.filter(w=>w.id===id).map(w=>({...w,minimized:false}))];}),[]);
 const close=useCallback((id:string)=>setWindows(list=>list.map(w=>w.id===id?{...w,minimized:true,closed:true}:w)),[]);
 const change=useCallback((w:WindowState)=>setWindows(list=>list.map(item=>item.id===w.id?w:item)),[]);
 const clear=useCallback(()=>setWindows([]),[]);
 return {windows,app,setApp,bounds,setBounds,compact,setCompact,focus,close,change,clear};
}
type Manager=ReturnType<typeof useDesktopManager>;
export function Wallpaper(){return <div className="pc-wallpaper" aria-hidden="true"><div className="wallpaper-fold fold-one"/><div className="wallpaper-fold fold-two"/><div className="wallpaper-fold fold-three"/><div className="wallpaper-fold fold-four"/><div className="wallpaper-light"/></div>;}
export function DesktopOS({manager,props,renderApp,onSettings,onTitle,sound,onSound,saved,sidebarOpen,onSidebar,advanced}:{manager:Manager;props:GameProps;renderApp:(id:AppId)=>ReactNode;onSettings:()=>void;onTitle:()=>void;sound:boolean;onSound:()=>void;saved:boolean;sidebarOpen:boolean;onSidebar:()=>void;advanced:boolean}){
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>lang==='ko'?ko:lang==='en'?en:ja;
 const [start,setStart]=useState(false),[query,setQuery]=useState(''),[time,setTime]=useState(''),[date,setDate]=useState('');
 const stage=useRef<HTMLDivElement>(null),startRef=useRef<HTMLButtonElement>(null),search=useRef<HTMLInputElement>(null);
 const unread=gameMessages(props.state).filter(m=>!props.state.gameplay.readMessages.includes(m.id)).length;
 useEffect(()=>{const el=stage.current;if(!el)return;const measure=()=>{manager.setBounds({width:el.clientWidth,height:el.clientHeight});manager.setCompact(window.innerWidth<760);};measure();const ro=new ResizeObserver(measure);ro.observe(el);return()=>ro.disconnect();},[manager.setBounds,manager.setCompact]);
 useEffect(()=>{const tick=()=>{const d=new Date();setTime(d.toLocaleTimeString(lang,{hour:'2-digit',minute:'2-digit',hour12:false}));setDate(d.toLocaleDateString(lang,{month:'2-digit',day:'2-digit'}));};tick();const timer=setInterval(tick,30000);return()=>clearInterval(timer);},[lang]);
 useEffect(()=>{if(start)search.current?.focus();},[start]);
 useEffect(()=>{if(manager.app==='desktop')startRef.current?.focus({preventScroll:true});},[manager.app]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(start&&e.key==='Escape'){e.preventDefault();setStart(false);startRef.current?.focus();}};document.addEventListener('keydown',key,true);return()=>document.removeEventListener('keydown',key,true);},[start]);
 const open=(id:AppId)=>{setStart(false);props.onOpen(id);};
 const available=DESKTOP_APPS.filter(a=>(a.id!=='career'||props.state.gameplay.openingCelebrated)&&(advanced||!['server','api'].includes(a.id)||props.state.mission===2));
 const label=(a:typeof DESKTOP_APPS[number])=>a[lang];
 const activeApps=manager.windows.filter(w=>!w.closed);
 const toggleTask=(id:AppId)=>{const w=manager.windows.find(w=>w.id===id);if(w&&manager.app===id)manager.change({...w,minimized:true});else open(id);};
 return <>
  <div className="pc-topbar"><span className="pc-session"><Monitor size={14}/> CODE:SHIFT <span>/</span> {tr('내 작업실','My workspace','マイデスク')}</span><div><span className="pc-save" role="status"><Check size={13}/>{saved?tr('저장됨','Saved','保存済み'):tr('저장 실패 · 설정에서 백업','Save failed · Back up in Settings','保存失敗 · 設定でバックアップ')}</span><b>{props.state.credits.toLocaleString()} cr</b><button onClick={onSidebar} aria-expanded={sidebarOpen} aria-label={tr('퀘스트 열기 또는 접기','Toggle quest','クエストを開閉')}><Flag size={15}/>{tr('의뢰','Quest','依頼')}</button></div></div>
  <div className="pc-main">
   <div className="pc-workarea"><div className="pc-compact-quest"><QuestRibbon {...props}/></div><div className="pc-stage" ref={stage}>
    <Wallpaper/>
    <nav className="pc-shortcuts" aria-label={tr('바탕화면 바로가기','Desktop shortcuts','デスクトップのショートカット')}>
     {available.filter(a=>['computer','messages','browser','editor','terminal','notes','challenges','career'].includes(a.id)).map(a=><button key={a.id} aria-label={label(a)} className={'pc-shortcut '+(a.id==='messages'&&!props.state.accepted?'first-message':'')} onClick={()=>open(a.id)}><span className={'pc-app-icon '+a.color}><a.icon size={28}/>{a.id==='messages'&&unread>0&&<i>{unread}</i>}</span><span>{label(a)}</span></button>)}
    </nav>
    <div className="pc-desktop-caption"><span>{props.state.gameplay.career.upgrades.includes('studio-sign')?tr('나의 독립 작업실','Independent studio','自分の作業場'):'SHIFT OS'}</span><small>{tr('개인용 컴퓨터','Personal computer','パーソナルコンピューター')}</small></div>
    {manager.app==='desktop'&&!props.state.accepted&&<button className="pc-mail-toast" onClick={()=>open('messages')}><span className="pc-app-icon green"><MessageCircle size={24}/></span><span><small>{tr('지우 · 새 메시지','Jiwoo · New message','ジウ · 新着メッセージ')}</small><strong>{tr('메뉴판이 이상해요. 한번 봐줄래요?','The menu is broken. Can you take a look?','メニューがおかしいんです。見てもらえますか？')}</strong><em>{tr('눌러서 읽기','Click to read','クリックして読む')} →</em></span></button>}
    {manager.windows.map(w=>{const a=DESKTOP_APPS.find(a=>a.id===w.id);return <DesktopWindow key={w.id} window={w} bounds={manager.bounds} compact={manager.compact} active={manager.app===w.id} title={a?label(a):t('의뢰함')} icon={a?<a.icon size={16}/>:<Monitor size={16}/>} onFocus={()=>manager.focus(w.id)} onChange={manager.change} onClose={()=>manager.close(w.id)}>{renderApp(w.id as AppId)}</DesktopWindow>;})}
   </div></div>
   {sidebarOpen&&<><button className="pc-quest-backdrop" onClick={onSidebar} aria-label={tr('퀘스트 접기','Close quest','クエストを閉じる')}/><QuestTracker {...props} onClose={onSidebar}/></>}
  </div>
  {start&&<><button className="pc-menu-backdrop" onClick={()=>setStart(false)} aria-label={tr('시작 메뉴 닫기','Close Start menu','スタートメニューを閉じる')}/><section className="pc-start-menu" aria-label={tr('시작 메뉴','Start menu','スタートメニュー')}><label className="pc-search"><Search size={18}/><input ref={search} value={query} onChange={e=>setQuery(e.target.value)} placeholder={tr('앱 검색','Search apps','アプリを検索')} aria-label={tr('앱 검색','Search apps','アプリを検索')}/></label><h2>{tr('설치된 앱','Installed apps','インストール済みアプリ')}</h2><div className="pc-start-apps">{available.filter(a=>(label(a)+' '+a.en).toLowerCase().includes(query.toLowerCase())).map(a=><button key={a.id} onClick={()=>open(a.id)}><span className={'pc-app-icon '+a.color}><a.icon size={23}/></span><span>{label(a)}</span></button>)}</div><footer><button onClick={()=>{setStart(false);onSettings();}}><Settings2 size={18}/>{tr('설정','Settings','設定')}</button><button onClick={()=>{setStart(false);onTitle();}}><Power size={18}/>{tr('타이틀로','Title screen','タイトルへ')}</button></footer></section></>}
  <nav className="pc-taskbar" aria-label={tr('작업 표시줄','Taskbar','タスクバー')}>
   <button ref={startRef} className={'pc-start-button '+(start?'selected':'')} onClick={()=>setStart(x=>!x)} aria-expanded={start} aria-label={tr('시작 메뉴','Start menu','スタートメニュー')}><LayoutGrid size={25}/></button>
   <div className="pc-task-apps">{available.filter(a=>['messages','browser','computer','editor','terminal'].includes(a.id)||activeApps.some(w=>w.id===a.id)).map(a=><button key={a.id} className={(manager.app===a.id?'selected ':'')+(activeApps.some(w=>w.id===a.id)?'running':'')} onClick={()=>toggleTask(a.id)} title={label(a)} aria-label={label(a)} aria-pressed={manager.app===a.id}><span className={'pc-app-icon '+a.color}><a.icon size={21}/>{a.id==='messages'&&unread>0&&<i>{unread}</i>}</span></button>)}</div>
   <div className="pc-tray"><button className="pc-fullscreen" onClick={()=>{if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{});else void document.documentElement.requestFullscreen?.().catch(()=>{});}} title={tr('전체 화면','Fullscreen','全画面')} aria-label={tr('전체 화면','Fullscreen','全画面')}><Expand size={16}/></button><button onClick={onSound} aria-pressed={sound} aria-label={tr('효과음','Sound','効果音')}>{sound?<Volume2 size={17}/>:<VolumeX size={17}/>}</button><button className="pc-language" onClick={onSettings} aria-label="Language">{lang.toUpperCase()}</button><span className="pc-network" title={tr('게임 속 가상 네트워크','Simulated game network','ゲーム内の仮想ネットワーク')}><Wifi size={16}/></span><button className="pc-clock" onClick={onSettings}><span>{time}</span><small>{date}</small></button></div>
   <button className="pc-show-desktop" onClick={()=>manager.setApp('desktop')} title={tr('바탕화면 보기','Show desktop','デスクトップを表示')} aria-label={tr('바탕화면 보기','Show desktop','デスクトップを表示')}/>
  </nav>
 </>;
}

export function Notepad(){
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>lang==='ko'?ko:lang==='en'?en:ja;
 const [note,setNote]=useState(''),[failed,setFailed]=useState(false);
 useEffect(()=>{try{setNote((localStorage.getItem('codeshift-notepad')??'').slice(0,12000));}catch{setFailed(true);}},[]);
 return <div className="pc-notepad"><header><FileText size={16}/>{tr('내 메모.txt','My notes.txt','メモ.txt')}<span>{failed?tr('저장 실패','Save failed','保存失敗'):tr('자동 저장','Autosaved','自動保存')}</span></header><textarea aria-label={tr('메모 내용','Notes','メモ内容')} maxLength={12000} value={note} onChange={e=>{setNote(e.target.value);try{localStorage.setItem('codeshift-notepad',e.target.value);setFailed(false);}catch{setFailed(true);}}} placeholder={tr('찾은 단서, 해보고 싶은 것, 기억할 명령을 적어 두세요.','Keep clues, ideas and useful commands here.','見つけたヒントや試したいこと、コマンドを書いておこう。')}/><footer>{note.length.toLocaleString()} / 12,000</footer></div>;
}
