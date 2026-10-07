'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {ChevronRight,TerminalSquare,CornerDownLeft} from 'lucide-react';
import type {GameProps} from './types';
export function TerminalView({state,onCommand,queued,onQueued,compact=false}:GameProps&{queued:string;onQueued:()=>void;compact?:boolean}){
 const [input,setInput]=useState('');const [index,setIndex]=useState(-1);const scroll=useRef<HTMLDivElement>(null);const field=useRef<HTMLInputElement>(null);const m=state.machines[state.machine];
 useLayoutEffect(()=>{if(queued){setInput(queued);onQueued();field.current?.focus();}},[queued,onQueued]);
 useEffect(()=>{if(scroll.current)scroll.current.scrollTop=scroll.current.scrollHeight;},[state.history.length,state.history.at(-1)?.command]);
 const send=()=>{if(!input.trim())return;onCommand(input);setInput('');setIndex(-1);};
 return <div className={'terminal-body '+(compact?'compact':'')}>
  <div className="terminal-output" ref={scroll} aria-live="polite" aria-label="터미널 출력">
   <div className="terminal-welcome"><TerminalSquare size={18}/><span>SHIFT SHELL <b>1.0</b><br/><span>모든 명령은 게임 속 컴퓨터에서 실행됩니다. <em>help</em>로 시작해 보세요.</span></span></div>
   {state.history.map((h,i)=><div className="terminal-entry" key={i}><div className="terminal-prompt"><span>dev@{h.machine==='local'?'workstation':'mono-server'}</span><span className="path">{h.cwd.replace('/home/dev','~')}</span><span>$</span><strong>{h.command}</strong></div>{h.output&&<pre className={h.error?'terminal-error':''}>{h.output}</pre>}</div>)}
  </div>
  <form className="terminal-form" onSubmit={e=>{e.preventDefault();send();}}><label htmlFor={compact?'terminal-dock':'terminal-main'}><span>dev@{state.machine==='local'?'workstation':'mono-server'}</span><b>{m.cwd.replace('/home/dev','~')}</b><ChevronRight size={16}/></label><input id={compact?'terminal-dock':'terminal-main'} ref={field} value={input} onChange={e=>setInput(e.target.value)} autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder="명령어를 입력하세요" aria-label="가상 터미널 명령어" onKeyDown={e=>{if(e.key==='ArrowUp'){e.preventDefault();const n=Math.min(index+1,state.history.length-1);setIndex(n);setInput(state.history[state.history.length-1-n]?.command??'');}if(e.key==='ArrowDown'){e.preventDefault();const n=Math.max(-1,index-1);setIndex(n);setInput(n<0?'':state.history[state.history.length-1-n]?.command??'');}if(e.key==='Tab'&&!e.shiftKey){e.preventDefault();const options=['help','pwd','ls','cd menu-site','npm install','npm run dev','git status','git add .','git push'];const match=options.find(x=>x.startsWith(input));if(match)setInput(match);}}}/><button type="submit" title="명령 실행" aria-label="명령 실행"><CornerDownLeft size={17}/></button></form>
  {!compact&&<div className="terminal-shortcuts">{['help','pwd','ls','git status','ps'].map(c=><button key={c} onClick={()=>{setInput(c);field.current?.focus();}}>{c}</button>)}<span>↑ ↓ 기록 · Tab 자동 완성 · Shift+Tab 이동 · Esc 닫기</span></div>}
 </div>;
}
