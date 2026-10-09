'use client';
import {useCallback,useEffect,useRef,useState,type ReactNode} from 'react';
import {Monitor,Code2,TerminalSquare,MessageCircle,FolderOpen,FileText,Settings2,Trophy,Palette,Server,Send,LayoutGrid,Search,Power,Volume2,VolumeX,Wifi,Check,Flag,Puzzle,Expand,ChevronLeft,ChevronRight,CalendarDays} from 'lucide-react';
import {useLanguage,t} from '@/lib/game/i18n';
import {gameMessages} from '@/lib/game/gameplay';
import {openWindow,focusedWindow,type WindowState,type Bounds} from '@/lib/game/windows';
import {calendarMonth,calendarWeeks,recentEditorFiles,DESKTOP_LOCALES} from '@/lib/game/desktop-calendar';
import {CharacterPortrait} from './StoryArt';
import {BrowserIcon} from './BrowserIcon';
import {DesktopWindow} from './DesktopWindow';
import {QuestTracker,QuestRibbon} from './QuestTracker';
import type {AppId,GameProps} from './types';

export const DESKTOP_APPS=[
 {id:'computer',ko:'내 PC',en:'This PC',ja:'PC',icon:FolderOpen,color:'gold'},
 {id:'messages',ko:'메시지',en:'Messages',ja:'メッセージ',icon:MessageCircle,color:'green'},
 {id:'browser',ko:'Ghrom',en:'Ghrom',ja:'Ghrom',icon:BrowserIcon,color:'grom'},
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
 const [panel,setPanel]=useState<'start'|'calendar'|null>(null),[query,setQuery]=useState(''),[now,setNow]=useState<Date|null>(null),[month,setMonth]=useState<Date|null>(null);
 const start=panel==='start',calendar=panel==='calendar',locale=DESKTOP_LOCALES[lang];
 const stage=useRef<HTMLDivElement>(null),startRef=useRef<HTMLButtonElement>(null),searchRef=useRef<HTMLButtonElement>(null),clockRef=useRef<HTMLButtonElement>(null),search=useRef<HTMLInputElement>(null),startPanel=useRef<HTMLElement>(null),calendarPanel=useRef<HTMLElement>(null),calendarToday=useRef<HTMLButtonElement>(null),returnFocus=useRef<HTMLButtonElement|null>(null);
 const closePanel=useCallback((restore=true)=>{setPanel(null);if(restore)returnFocus.current?.focus({preventScroll:true});},[]);
 const toggleStart=(trigger:HTMLButtonElement|null)=>{if(start)closePanel();else{returnFocus.current=trigger;setPanel('start');}};
 const toggleCalendar=()=>{if(calendar)closePanel();else{const current=new Date();setNow(current);setMonth(calendarMonth(current));returnFocus.current=clockRef.current;setPanel('calendar');}};
 const time=now?.toLocaleTimeString(locale,{hour:'2-digit',minute:'2-digit',hour12:false})??'--:--';
 const date=now?.toLocaleDateString(locale,{month:'2-digit',day:'2-digit'})??'--/--';
 const recentFiles=recentEditorFiles(props.state.history,props.state.machines.local.files);
 const recentWork=props.state.history.slice(-3).reverse();
 const weekdays=Array.from({length:7},(_,day)=>new Date(2023,0,1+day,12));
 const unread=gameMessages(props.state).filter(m=>!props.state.gameplay.readMessages.includes(m.id)).length;
 useEffect(()=>{const el=stage.current;if(!el)return;const measure=()=>{manager.setBounds({width:el.clientWidth,height:el.clientHeight});manager.setCompact(window.innerWidth<760);};measure();const ro=new ResizeObserver(measure);ro.observe(el);return()=>ro.disconnect();},[manager.setBounds,manager.setCompact]);
 useEffect(()=>{let timer:ReturnType<typeof setTimeout>;const tick=()=>{clearTimeout(timer);const current=new Date();setNow(current);setMonth(value=>value??calendarMonth(current));timer=setTimeout(tick,60000-Date.now()%60000);};const visible=()=>{if(document.visibilityState==='visible')tick();};tick();window.addEventListener('focus',tick);document.addEventListener('visibilitychange',visible);return()=>{clearTimeout(timer);window.removeEventListener('focus',tick);document.removeEventListener('visibilitychange',visible);};},[]);
 useEffect(()=>{if(start)search.current?.focus();if(calendar)calendarToday.current?.focus();},[start,calendar]);
 useEffect(()=>{if(manager.app==='desktop')startRef.current?.focus({preventScroll:true});},[manager.app]);
 useEffect(()=>{if(!panel)return;const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closePanel();}};const outside=(e:PointerEvent)=>{const target=e.target as Node;if(startPanel.current?.contains(target)||calendarPanel.current?.contains(target)||startRef.current?.contains(target)||searchRef.current?.contains(target)||clockRef.current?.contains(target))return;closePanel();};document.addEventListener('keydown',key,true);document.addEventListener('pointerdown',outside);return()=>{document.removeEventListener('keydown',key,true);document.removeEventListener('pointerdown',outside);};},[panel,closePanel]);
 const open=(id:AppId)=>{closePanel(false);props.onOpen(id);};
 const available=DESKTOP_APPS.filter(a=>(a.id!=='career'||props.state.gameplay.openingCelebrated)&&(advanced||!['server','api'].includes(a.id)||props.state.mission===2));
 const label=(a:typeof DESKTOP_APPS[number])=>a[lang];
 const activeApps=manager.windows.filter(w=>!w.closed);
 const toggleTask=(id:AppId)=>{const w=manager.windows.find(w=>w.id===id);if(w&&manager.app===id)manager.change({...w,minimized:true});else open(id);};
 return <>
  <div className="pc-topbar"><span className="pc-session"><Monitor size={14}/> CODE:SHIFT <span>/</span> {tr('내 작업실','My workspace','マイデスク')}</span><div><span className="pc-save" role="status"><Check size={13}/>{saved?tr('저장됨','Saved','保存済み'):tr('저장 실패 · 설정에서 백업','Save failed · Back up in Settings','保存失敗 · 設定でバックアップ')}</span><button className="pc-wallet" data-testid="open-wallet" onClick={()=>props.onOpen('workbench')} title={tr('크레딧 사용 · 작업실 상점','Spend credits · Workspace shop','クレジットを使う · 作業場ショップ')}><b>{props.state.credits.toLocaleString()} cr</b></button><button onClick={onSidebar} aria-expanded={sidebarOpen} aria-label={tr('퀘스트 열기 또는 접기','Toggle quest','クエストを開閉')}><Flag size={15}/>{tr('의뢰','Quest','依頼')}</button></div></div>
  <div className="pc-main">
   <div className="pc-workarea"><div className="pc-compact-quest"><QuestRibbon {...props}/></div><div className="pc-stage" ref={stage}>
    <Wallpaper/>
    <nav className="pc-shortcuts" aria-label={tr('바탕화면 바로가기','Desktop shortcuts','デスクトップのショートカット')}>
     {available.filter(a=>['computer','messages','browser','editor','terminal','notes','challenges','career'].includes(a.id)).map(a=><button key={a.id} aria-label={label(a)} className={'pc-shortcut '+(a.id==='messages'&&!props.state.accepted?'first-message':'')} onClick={()=>open(a.id)}><span className={'pc-app-icon '+a.color}><a.icon size={28}/>{a.id==='messages'&&unread>0&&<i>{unread}</i>}</span><span>{label(a)}</span></button>)}
    </nav>
    <div className="pc-desktop-caption"><span>{props.state.gameplay.career.upgrades.includes('studio-sign')?tr('나의 독립 작업실','Independent studio','自分の作業場'):'SHIFT OS'}</span><small>{tr('개인용 컴퓨터','Personal computer','パーソナルコンピューター')}</small></div>
    {manager.app==='desktop'&&!props.state.accepted&&<button className="pc-mail-toast" onClick={()=>open('messages')}><CharacterPortrait name="지우"/><span><small>{tr('지우 · 새 메시지','Jiwoo · New message','ジウ · 新着メッセージ')}</small><strong>{tr('메뉴판이 이상해요. 한번 봐줄래요?','The menu is broken. Can you take a look?','メニューがおかしいんです。見てもらえますか？')}</strong><em>{tr('눌러서 읽기','Click to read','クリックして読む')} →</em></span></button>}
    {manager.windows.map(w=>{const a=DESKTOP_APPS.find(a=>a.id===w.id);return <DesktopWindow key={w.id} window={w} bounds={manager.bounds} compact={manager.compact} active={manager.app===w.id} title={a?label(a):t('의뢰함')} icon={a?<a.icon size={16}/>:<Monitor size={16}/>} onFocus={()=>manager.focus(w.id)} onChange={manager.change} onClose={()=>manager.close(w.id)}>{renderApp(w.id as AppId)}</DesktopWindow>;})}
   </div></div>
   {sidebarOpen&&<><button className="pc-quest-backdrop" onClick={onSidebar} aria-label={tr('퀘스트 접기','Close quest','クエストを閉じる')}/><QuestTracker {...props} onClose={onSidebar}/></>}
  </div>
  {start&&<><button type="button" tabIndex={-1} className="pc-menu-backdrop" onPointerDown={e=>{e.preventDefault();closePanel();}} onClick={()=>closePanel()} aria-label={tr('시작 메뉴 닫기','Close Start menu','スタートメニューを閉じる')}/><section ref={startPanel} id="workspace-start" data-testid="desktop-start" role="dialog" aria-labelledby="workspace-start-title" className="pc-start-menu">
   <header className="pc-start-heading"><span className="pc-start-mark"><TerminalSquare size={20}/></span><h1 id="workspace-start-title">{tr('내 작업실','My workspace','マイデスク')}</h1><span>CODE:SHIFT</span></header>
   <label className="pc-search"><Search size={18}/><input ref={search} value={query} onChange={e=>setQuery(e.target.value)} placeholder={tr('앱 검색','Search apps','アプリを検索')} aria-label={tr('앱 검색','Search apps','アプリを検索')}/></label>
   <h2>{tr('설치된 앱','Installed apps','インストール済みアプリ')}</h2><div className="pc-start-apps">{available.filter(a=>(label(a)+' '+a.en).toLowerCase().includes(query.toLowerCase())).map(a=><button type="button" key={a.id} onClick={()=>open(a.id)}><span className={'pc-app-icon '+a.color}><a.icon size={23}/></span><span>{label(a)}</span></button>)}</div>
   {!available.some(a=>(label(a)+' '+a.en).toLowerCase().includes(query.toLowerCase()))&&<p className="pc-panel-empty">{tr('일치하는 앱이 없습니다.','No matching apps.','一致するアプリはありません。')}</p>}
   <section className="pc-recent-files" aria-labelledby="workspace-files-title"><h2 id="workspace-files-title">{tr('최근 파일','Recent files','最近のファイル')}</h2>{recentFiles.length?<div>{recentFiles.map((path,index)=><button type="button" data-testid={`start-recent-file-${index}`} key={path} onClick={()=>{closePanel(false);props.openFile(path);}} title={path}><FileText size={17}/><span><strong>{path.split('/').at(-1)}</strong><small>{path}</small></span><ChevronRight size={15}/></button>)}</div>:<p className="pc-panel-empty">{tr('터미널에서 code로 연 파일이 아직 없습니다.','No files opened with code in the terminal yet.','ターミナルのcodeで開いたファイルはまだありません。')}</p>}</section>
   <footer><button type="button" onClick={()=>{closePanel(false);onSettings();}}><Settings2 size={18}/>{tr('설정','Settings','設定')}</button><button type="button" onClick={()=>{closePanel(false);onTitle();}}><Power size={18}/>{tr('타이틀로','Title screen','タイトルへ')}</button></footer>
  </section></>}
  {calendar&&now&&month&&<><button type="button" tabIndex={-1} className="pc-menu-backdrop" onPointerDown={e=>{e.preventDefault();closePanel();}} onClick={()=>closePanel()} aria-label={tr('달력 닫기','Close calendar','カレンダーを閉じる')}/><section ref={calendarPanel} id="workspace-calendar" className="pc-calendar" data-testid="desktop-calendar" role="dialog" aria-labelledby="workspace-calendar-title">
   <header><CalendarDays size={18}/><div><h2 id="workspace-calendar-title">{now.toLocaleDateString(locale,{year:'numeric',month:'long',day:'numeric',weekday:'long'})}</h2><p>{tr('기기의 현재 날짜','Current date on your device','端末の現在の日付')}</p></div></header>
   <div className="pc-calendar-controls"><h3 id="workspace-calendar-month" aria-live="polite">{month.toLocaleDateString(locale,{year:'numeric',month:'long'})}</h3><button type="button" data-testid="calendar-prev" onClick={()=>setMonth(calendarMonth(month,-1))} aria-label={tr('이전 달','Previous month','前の月')}><ChevronLeft size={18}/></button><button type="button" data-testid="calendar-next" onClick={()=>setMonth(calendarMonth(month,1))} aria-label={tr('다음 달','Next month','次の月')}><ChevronRight size={18}/></button><button type="button" ref={calendarToday} className="pc-calendar-today" data-testid="calendar-today" onClick={()=>{const current=new Date();setNow(current);setMonth(calendarMonth(current));}}>{tr('오늘','Today','今日')}</button></div>
   <table className="pc-calendar-grid" aria-labelledby="workspace-calendar-month"><thead><tr>{weekdays.map(day=><th scope="col" key={day.getDay()}><abbr title={day.toLocaleDateString(locale,{weekday:'long'})}>{day.toLocaleDateString(locale,{weekday:'short'})}</abbr></th>)}</tr></thead><tbody>{calendarWeeks(month,now).map((week,index)=><tr key={index}>{week.map(day=><td key={day.date.getTime()} className={(day.inMonth?'':'outside-month ')+(day.today?'is-today':'')} aria-current={day.today?'date':undefined} aria-label={day.date.toLocaleDateString(locale,{year:'numeric',month:'long',day:'numeric'})}><span>{day.date.getDate()}</span></td>)}</tr>)}</tbody></table>
   <section className="pc-recent-work" aria-labelledby="workspace-work-title"><h3 id="workspace-work-title">{tr('최근 작업','Recent work','最近の作業')}</h3>{recentWork.length?<ol>{recentWork.map((entry,index)=><li key={index}><TerminalSquare size={15}/><div><code title={entry.command}>{entry.command}</code><small>{entry.machine==='local'?tr('로컬','Local','ローカル'):tr('서버','Server','サーバー')} · {entry.error?tr('실패','Failed','失敗'):tr('완료','Completed','完了')}</small></div></li>)}</ol>:<p className="pc-panel-empty">{tr('아직 실행한 터미널 명령이 없습니다.','No terminal commands have been run yet.','実行したターミナルコマンドはまだありません。')}</p>}</section>
  </section></>}
  <nav className="pc-taskbar" aria-label={tr('작업 표시줄','Taskbar','タスクバー')}>
   <div className="pc-task-start"><button type="button" ref={startRef} data-testid="taskbar-start" className={'pc-start-button '+(start?'selected':'')} onClick={()=>toggleStart(startRef.current)} aria-expanded={start} aria-controls="workspace-start" aria-haspopup="dialog" aria-label={tr('시작 메뉴','Start menu','スタートメニュー')}><LayoutGrid size={23}/><span>{tr('작업실','Workspace','デスク')}</span></button><button type="button" ref={searchRef} data-testid="taskbar-search" className="pc-task-search" onClick={()=>toggleStart(searchRef.current)} aria-expanded={start} aria-controls="workspace-start" aria-haspopup="dialog" aria-label={tr('앱 검색','Search apps','アプリを検索')}><Search size={18}/></button></div>
   <div className="pc-task-center"><div className="pc-task-apps">{available.filter(a=>['messages','browser','computer','editor','terminal'].includes(a.id)||activeApps.some(w=>w.id===a.id)).map(a=><button type="button" key={a.id} className={(manager.app===a.id?'selected ':'')+(activeApps.some(w=>w.id===a.id)?'running':'')} onClick={()=>toggleTask(a.id)} title={label(a)} aria-label={label(a)} aria-pressed={manager.app===a.id}><span className={'pc-app-icon '+a.color}><a.icon size={21}/>{a.id==='messages'&&unread>0&&<i>{unread}</i>}</span></button>)}</div></div>
   <div className="pc-tray"><button className="pc-fullscreen" onClick={()=>{if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{});else void document.documentElement.requestFullscreen?.().catch(()=>{});}} title={tr('전체 화면','Fullscreen','全画面')} aria-label={tr('전체 화면','Fullscreen','全画面')}><Expand size={16}/></button><button onClick={onSound} aria-pressed={sound} aria-label={tr('효과음','Sound','効果音')}>{sound?<Volume2 size={17}/>:<VolumeX size={17}/>}</button><button className="pc-language" onClick={onSettings} aria-label={tr('언어 설정','Language settings','言語設定')}>{lang.toUpperCase()}</button><span className="pc-network" title={tr('게임 속 가상 네트워크','Simulated game network','ゲーム内の仮想ネットワーク')}><Wifi size={16}/></span><button type="button" ref={clockRef} data-testid="taskbar-clock" className={'pc-clock '+(calendar?'selected':'')} onClick={toggleCalendar} aria-expanded={calendar} aria-controls="workspace-calendar" aria-haspopup="dialog" aria-label={tr('시계와 달력 열기','Open clock and calendar','時計とカレンダーを開く')+' · '+time+' · '+(now?.toLocaleDateString(locale)??'')}><span>{time}</span><small>{date}</small></button></div>
   <button type="button" data-testid="show-desktop" className="pc-show-desktop" onClick={()=>{closePanel(false);manager.setApp('desktop');}} title={tr('바탕화면 보기','Show desktop','デスクトップを表示')} aria-label={tr('바탕화면 보기','Show desktop','デスクトップを表示')}/>
  </nav>
 </>;
}

export function Notepad(){
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>lang==='ko'?ko:lang==='en'?en:ja;
 const [note,setNote]=useState(''),[failed,setFailed]=useState(false);
 useEffect(()=>{try{setNote((localStorage.getItem('codeshift-notepad')??'').slice(0,12000));}catch{setFailed(true);}},[]);
 return <div className="pc-notepad"><header><FileText size={16}/>{tr('내 메모.txt','My notes.txt','メモ.txt')}<span>{failed?tr('저장 실패','Save failed','保存失敗'):tr('자동 저장','Autosaved','自動保存')}</span></header><textarea aria-label={tr('메모 내용','Notes','メモ内容')} maxLength={12000} value={note} onChange={e=>{setNote(e.target.value);try{localStorage.setItem('codeshift-notepad',e.target.value);setFailed(false);}catch{setFailed(true);}}} placeholder={tr('찾은 단서, 해보고 싶은 것, 기억할 명령을 적어 두세요.','Keep clues, ideas and useful commands here.','見つけたヒントや試したいこと、コマンドを書いておこう。')}/><footer>{note.length.toLocaleString()} / 12,000</footer></div>;
}
