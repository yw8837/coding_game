'use client';
import {localizeUI,useLanguage} from '@/lib/game/i18n';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {ChevronRight,TerminalSquare,CornerDownLeft} from 'lucide-react';
import {commandCompletions} from '@/lib/game/input-tools';
import {translateTerminalOutput} from '@/lib/game/terminal-translations';
import type {GameProps} from './types';
export function TerminalView({state,onCommand,queued,onQueued,compact=false}:GameProps&{queued:string;onQueued:()=>void;compact?:boolean}){
 const language=useLanguage(),tr=(ko:string,en:string,ja:string)=>language==='ko'?ko:language==='en'?en:ja;
 const [input,setInput]=useState(''),[index,setIndex]=useState(-1),[suggestions,setSuggestions]=useState<string[]>([]),[selected,setSelected]=useState(-1);
 const draft=useRef(''),scroll=useRef<HTMLDivElement>(null),field=useRef<HTMLInputElement>(null),m=state.machines[state.machine];
 const close=()=>{setSuggestions([]);setSelected(-1);};
 const change=(value:string)=>{setInput(value);setIndex(-1);draft.current=value;close();};
 useLayoutEffect(()=>{if(queued){change(queued);onQueued();field.current?.focus();}},[queued,onQueued]);
 useEffect(()=>{if(scroll.current)scroll.current.scrollTop=scroll.current.scrollHeight;},[state.history.length,state.history.at(-1)?.command]);
 const send=()=>{if(!input.trim())return;onCommand(input);change('');field.current?.focus();};
 const complete=()=>{const options=suggestions.length?suggestions:commandCompletions(state,input);if(!options.length)return;const next=(selected+1)%options.length;setSuggestions(options);setSelected(next);setInput(options[next]);};
 return localizeUI(<div className={'terminal-body '+(compact?'compact':'')}>
  <div className="terminal-output" ref={scroll} aria-live="polite" aria-label="터미널 출력"><div className="terminal-welcome"><TerminalSquare size={18}/><span>SHIFT SHELL<br/><span data-no-translate>{tr('Linux 개발 터미널','Linux development terminal','Linux開発ターミナル')}</span><br/><span>실제 컴퓨터에는 영향을 주지 않아요. <em>help</em>로 명령어를 확인하세요.</span></span></div>{state.history.map((h,i)=><div className="terminal-entry" key={i}><div className="terminal-prompt"><span>dev@{h.machine==='local'?'workstation':'mono-server'}</span><span className="path">{h.cwd.replace('/home/dev','~')}</span><span>$</span><strong data-no-translate>{h.command}</strong></div>{h.output&&<pre className={h.error?'terminal-error':''}>{translateTerminalOutput(h.command,h.output,language)}</pre>}</div>)}</div>
  {!!suggestions.length&&<div className="terminal-completions" aria-label="명령어 자동완성 후보">{suggestions.map((c,i)=><button type="button" className={i===selected?'selected':''} key={c} onClick={()=>{change(c);field.current?.focus();}}>{c}</button>)}</div>}
  <form className="terminal-form" onSubmit={e=>{e.preventDefault();send();}}><label htmlFor={compact?'terminal-dock':'terminal-main'}><span>dev@{state.machine==='local'?'workstation':'mono-server'}</span><b>{m.cwd.replace('/home/dev','~')}</b><ChevronRight size={16}/></label><input id={compact?'terminal-dock':'terminal-main'} ref={field} value={input} onChange={e=>change(e.target.value)} autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder="명령어 입력 · Tab으로 완성" aria-label="가상 터미널 명령어" onKeyDown={e=>{
   if(e.nativeEvent.isComposing||e.keyCode===229)return;
   if(e.key==='Escape'&&suggestions.length){e.preventDefault();e.stopPropagation();close();return;}
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='l'){e.preventDefault();onCommand('clear');close();return;}
   if(e.ctrlKey&&e.key.toLowerCase()==='c'){e.preventDefault();change('');return;}
   if(e.key==='Tab'&&!e.shiftKey){if(suggestions.length||commandCompletions(state,input).length){e.preventDefault();complete();}return;}
   if(e.key==='ArrowUp'){e.preventDefault();if(index===-1)draft.current=input;const n=Math.min(index+1,state.history.length-1);setIndex(n);setInput(state.history[state.history.length-1-n]?.command??draft.current);close();}
   if(e.key==='ArrowDown'){e.preventDefault();const n=Math.max(-1,index-1);setIndex(n);setInput(n<0?draft.current:state.history[state.history.length-1-n]?.command??'');close();}
  }}/><button type="button" onClick={()=>{complete();field.current?.focus();}} title="자동완성 (Tab)" aria-label="명령어 자동완성">Tab</button><button type="submit" title="명령 실행" aria-label="명령 실행"><CornerDownLeft size={17}/></button></form>
  {!compact&&<div className="terminal-shortcuts">{['help','pwd','ls','git status','ps'].map(c=><button key={c} onClick={()=>{change(c);field.current?.focus();}}>{c}</button>)}<span>↑↓ 기록 · Tab 완성 · Ctrl+L 정리 · Shift+Tab 이동</span></div>}
 </div>);
}
