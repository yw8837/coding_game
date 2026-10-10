'use client';

import {useEffect,useRef} from 'react';
import Image from 'next/image';
import {Code2,Folder,Globe,Terminal,LayoutGrid} from 'lucide-react';

const SOURCE = `<main class="cafe">\n  <h1>Mono Café</h1>\n  <p>A little break, made here.</p>\n  <button class="order-button">\n    Order coffee\n  </button>\n</main>\n\n<style>\n  .order-button {\n    background: #5f8a69;\n    color: white;\n    border-radius: 8px;\n  }\n</style>`;

/** A decorative workspace, projected onto the monitor in the original room art. */
export function TitleWorkspace({paused}:{paused:boolean}) {
 const code=useRef<HTMLElement>(null),terminal=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let step=90;
  const timer=window.setInterval(()=>{
   if(paused||motion.matches||document.hidden||document.documentElement.dataset.gameReducedMotion==='true')return;
   step=(step+2)%(SOURCE.length+160);
   if(code.current)code.current.textContent=SOURCE.slice(0,Math.min(step,SOURCE.length));
   if(terminal.current)terminal.current.dataset.phase=String(Math.min(3,Math.floor(step/120)));
  },100);
  return()=>window.clearInterval(timer);
 },[paused]);
 return <div className="title-scene-art" aria-hidden="true">
  <Image unoptimized className="title-environment" src="/game-art/studio-evening.png" alt="" width={1672} height={941} loading="eager" fetchPriority="high"/>
  <svg className="title-room-effects" viewBox="0 0 1672 941" focusable="false">
   <defs><clipPath id="title-window-glass"><path d="M 998,0 H 1120 V 306 L 998,318 Z M 1134,0 H 1479 V 296 L 1134,307 Z M 867,0 H 969 V 344 L 867,367 Z"/></clipPath></defs>
   <g clipPath="url(#title-window-glass)" className="title-rain">{Array.from({length:28},(_,i)=><line key={i} x1={880+(i*43)%610} x2={876+(i*43)%610} y1={-330+(i*67)%400} y2={-313+(i*67)%400} style={{animationDelay:`-${i*.37}s`,animationDuration:`${2.5+(i%5)*.4}s`}}/>)}</g>
   <g className="title-coffee-steam"><path d="M1441 598 C1424 580 1455 568 1438 549"/><path d="M1453 597 C1470 575 1445 568 1458 540"/><path d="M1467 598 C1451 579 1481 569 1466 552"/></g>
   <foreignObject x="0" y="0" width="1672" height="941">
    <div className="title-monitor-workspace">
     <div className="title-monitor-top"><Code2 size={16}/><span>mono-cafe</span><span className="title-monitor-controls">− &nbsp; □ &nbsp; ×</span></div>
     <div className="title-monitor-content">
      <aside className="title-monitor-files"><span>EXPLORER</span><b>⌄ mono-cafe</b><span className="title-file-active">◇ index.html</span><span># style.css</span><span>JS app.js</span><span>◇ package.json</span></aside>
      <div className="title-monitor-editor"><div className="title-editor-tab">index.html <span>×</span></div><div className="title-editor-code"><div className="title-line-numbers">{Array.from({length:17},(_,i)=><span key={i}>{i+1}</span>)}</div><pre><code ref={code}>{SOURCE}</code><i className="title-code-caret"/></pre></div></div>
     </div>
     <div className="title-monitor-terminal" ref={terminal} data-phase="3"><div><Terminal size={12}/> TERMINAL</div><div className="title-terminal-scroll"><p><b>~/projects/mono-cafe</b> $ npm run dev</p><p>Local: http://localhost:5173/</p><p className="title-terminal-log log-one">[vite] page reload index.html</p><p className="title-terminal-log log-two">[vite] hmr update /style.css</p><p className="title-terminal-log log-three">[vite] page reload index.html <i/></p></div></div>
     <div className="title-monitor-taskbar"><LayoutGrid size={16}/><Folder size={15}/><Code2 size={15}/><Globe size={15}/><Terminal size={15}/><span>21:08</span></div>
    </div>
   </foreignObject>
  </svg>
 </div>;
}
