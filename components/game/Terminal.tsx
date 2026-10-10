'use client';
import {localizeUI,useLanguage} from '@/lib/game/i18n';
import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {ChevronRight,TerminalSquare,CornerDownLeft} from 'lucide-react';
import {terminalCompletionsAtCursor,visibleTerminalHistory,type TerminalCompletion} from '@/lib/game/terminal-input';
import {translateTerminalOutput} from '@/lib/game/terminal-translations';
import {isKeystrokeKey} from '@/lib/game/audio-feedback';
import type {GameProps} from './types';
import {playFeedbackMotion,playGameFeedback} from './useGameFeedback';
export function TerminalView({state,onCommand,queued,onQueued,compact=false}:GameProps&{queued:string;onQueued:()=>void;compact?:boolean}){
 const language=useLanguage(),tr=(ko:string,en:string,ja:string)=>language==='ko'?ko:language==='en'?en:ja;
 const [input,setInput]=useState(''),[index,setIndex]=useState(-1),[suggestions,setSuggestions]=useState<TerminalCompletion[]>([]),[selected,setSelected]=useState(-1);
 const draft=useRef(''),scroll=useRef<HTMLDivElement>(null),field=useRef<HTMLInputElement>(null),m=state.machines[state.machine],visible=visibleTerminalHistory(state.history);
 const completion=useRef<TerminalCompletion|null>(null),pendingCaret=useRef<number|null>(null),submitted=useRef(false);
 const close=()=>{setSuggestions([]);setSelected(-1);completion.current=null;};
 const change=useCallback((value:string)=>{setInput(value);setIndex(-1);draft.current=value;setSuggestions([]);setSelected(-1);completion.current=null;pendingCaret.current=null;},[setInput,setIndex,setSuggestions,setSelected]);
 useLayoutEffect(()=>{if(pendingCaret.current!==null){field.current?.setSelectionRange(pendingCaret.current,pendingCaret.current);pendingCaret.current=null;}},[input,suggestions]);
 const latestCommand=state.history.at(-1)?.command;
 // eslint-disable-next-line react-hooks/set-state-in-effect -- A parent command-queue event hydrates the editable input, consumes the queue and focuses the terminal without executing it.
 useLayoutEffect(()=>{if(queued){change(queued);onQueued();field.current?.focus();}},[queued,onQueued,change]);
 useEffect(()=>{if(scroll.current)scroll.current.scrollTop=scroll.current.scrollHeight;},[state.history.length,latestCommand]);
 // 여기서 직접 실행한 명령의 결과만 살짝 떠오르게 한다. 오류는 작게 흔들어 눈에 띄게.
 useEffect(()=>{if(!submitted.current)return;submitted.current=false;const entries=scroll.current?.getElementsByClassName('terminal-entry');playFeedbackMotion(entries?.[entries.length-1],state.history.at(-1)?.error?'error':'entry');},[state.history]);
 const send=()=>{if(!input.trim())return;submitted.current=true;onCommand(input);change('');field.current?.focus();};
 const applyCompletion=(option:TerminalCompletion)=>{setInput(option.value);setIndex(-1);draft.current=option.value;completion.current=option;pendingCaret.current=option.caret;};
 const complete=()=>{
  const element=field.current,cursor=element?.selectionStart??input.length;
  if(element&&element.selectionStart!==element.selectionEnd)return false;
  const cycle=suggestions.length>1&&completion.current?.value===input&&completion.current.caret===cursor;
  const options=cycle?suggestions:terminalCompletionsAtCursor(state,input,cursor);
  if(!options.length)return false;
  const next=cycle?(selected+1)%options.length:0;
  setSuggestions(options);setSelected(next);applyCompletion(options[next]);return true;
 };
 return localizeUI(<div className={'terminal-body '+(compact?'compact':'')}>
  <div className="terminal-output" ref={scroll} aria-live="polite" aria-label="터미널 출력"><div className="terminal-welcome"><TerminalSquare size={18}/><span>SHIFT SHELL<br/><span data-no-translate>{tr('Linux 개발 터미널','Linux development terminal','Linux開発ターミナル')}</span><br/><span data-no-translate>{tr('help · 명령과 옵션 / Tab · 경로 완성','help · commands and options / Tab · path completion','help · コマンドとオプション / Tab · パス補完')}</span></span></div>{visible.map((h,i)=><div className="terminal-entry" key={i}><div className="terminal-prompt"><span>dev@{h.machine==='local'?'workstation':'mono-server'}</span><span className="path">{h.cwd.replace('/home/dev','~')}</span><span>$</span><strong data-no-translate>{h.command}</strong></div>{h.output&&<pre className={h.error?'terminal-error':''}>{translateTerminalOutput(h.command,h.output,language)}</pre>}</div>)}</div>
  {!!suggestions.length&&<div className="terminal-completions" aria-label="명령어 자동완성 후보">{suggestions.map((c,i)=><button type="button" className={i===selected?'selected':''} key={c.value} onClick={()=>{close();applyCompletion(c);field.current?.focus();}}>{c.value}</button>)}</div>}
  <form className="terminal-form" onSubmit={e=>{e.preventDefault();send();}}><label htmlFor={compact?'terminal-dock':'terminal-main'}><span>dev@{state.machine==='local'?'workstation':'mono-server'}</span><b>{m.cwd.replace('/home/dev','~')}</b><ChevronRight size={16}/></label><input id={compact?'terminal-dock':'terminal-main'} ref={field} value={input} onChange={e=>change(e.target.value)} onPointerDown={close} autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder="명령어 입력 · Tab으로 완성" aria-label="가상 터미널 명령어" onKeyDown={e=>{
   if(e.key!=='Enter'&&isKeystrokeKey(e))playGameFeedback('keystroke');
   if(e.nativeEvent.isComposing||e.keyCode===229)return;
   if(e.key==='Escape'&&suggestions.length){e.preventDefault();e.stopPropagation();close();return;}
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='l'){e.preventDefault();onCommand('clear');setIndex(-1);draft.current=input;close();return;}
   if(e.ctrlKey&&e.key.toLowerCase()==='c'){
    const element=e.currentTarget,hasSelection=element.selectionStart!==element.selectionEnd||Boolean(window.getSelection()?.toString());
    if(!hasSelection){e.preventDefault();change('');}return;
   }
   if(e.key==='Tab'&&!e.shiftKey){if(complete())e.preventDefault();return;}
   if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='a'))close();
   if(e.key==='ArrowUp'){e.preventDefault();if(index===-1)draft.current=input;const n=Math.min(index+1,state.history.length-1);setIndex(n);setInput(state.history[state.history.length-1-n]?.command??draft.current);close();}
   if(e.key==='ArrowDown'){e.preventDefault();const n=Math.max(-1,index-1);setIndex(n);setInput(n<0?draft.current:state.history[state.history.length-1-n]?.command??'');close();}
  }}/><button type="button" onClick={()=>{complete();field.current?.focus();}} title="자동완성 (Tab)" aria-label="명령어 자동완성">Tab</button><button type="submit" title="명령 실행" aria-label="명령 실행"><CornerDownLeft size={17}/></button></form>
  {!compact&&<div className="terminal-shortcuts">{['help','pwd','ls','git status','ps'].map(c=><button key={c} onClick={()=>{change(c);field.current?.focus();}}>{c}</button>)}<span>↑↓ 기록 · Tab 완성 · Ctrl+L 정리 · Shift+Tab 이동</span></div>}
 </div>);
}
