'use client';

import {useEffect,useRef,type CSSProperties} from 'react';
import Image from 'next/image';
import {Code2,Folder,Globe,Terminal,LayoutGrid} from 'lucide-react';

const FILES = [
 {name:'index.html',source:`<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Mono Café</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="cafe">
    <h1>Mono Café</h1>
    <p>A little break, made here.</p>
    <button class="order-button">
      Order coffee
    </button>
    <output id="order-status"></output>
  </main>
  <script src="app.js"></script>
</body>
</html>`},
 {name:'style.css',source:`body {
  margin: 0;
  background: #f2ede4;
  color: #283c32;
  font-family: system-ui, sans-serif;
}

.cafe {
  max-width: 42rem;
  margin: 8vh auto;
  padding: 2rem;
}

.order-button {
  background: #5f8a69;
  color: white;
  border: 0;
  border-radius: 8px;
  padding: 0.9rem 1.4rem;
  cursor: pointer;
}

.order-button:hover {
  background: #486f52;
}`},
 {name:'app.js',source:`const menu = [
  { name: "Americano", price: 4500 },
  { name: "Latte", price: 5000 }
];

const button = document.querySelector(
  ".order-button"
);
const status = document.querySelector(
  "#order-status"
);

function total(price, quantity) {
  return price * quantity;
}

button.addEventListener("click", () => {
  const amount = total(menu[0].price, 3);
  status.textContent =
    amount.toLocaleString("en-US") + " KRW";
});

console.assert(total(4500, 3) === 13500);
`}
];
const LOGS=['$ npm run dev','Local: http://localhost:5173/','[vite] page reload index.html','[vite] hmr update /style.css','[vite] page reload app.js','$ npm test','PASS order total · 3 × 4,500 = 13,500','PASS responsive layout','$ npm run build','dist/index.html     1.42 kB','dist/assets/app.js  0.86 kB','✓ build complete'];

/** A decorative workspace, projected onto the monitor in the original room art. */
export function TitleWorkspace({paused}:{paused:boolean}) {
 const code=useRef<HTMLElement>(null),terminal=useRef<HTMLDivElement>(null),viewport=useRef<HTMLDivElement>(null),panel=useRef<HTMLDivElement>(null),tab=useRef<HTMLSpanElement>(null),art=useRef<HTMLDivElement>(null);
 const progress=useRef({file:0,cursor:180,hold:0,tick:0,log:0});
 useEffect(()=>{
  const visibility=()=>{if(art.current)art.current.dataset.suspended=String(paused||document.hidden);};
  visibility();document.addEventListener('visibilitychange',visibility);
  if(paused)return()=>document.removeEventListener('visibilitychange',visibility);
  const timer=window.setInterval(()=>{
   if(document.hidden)return;
   const p=progress.current,file=FILES[p.file];
   if(p.cursor<file.source.length)p.cursor=Math.min(p.cursor+5,file.source.length);
   else if(++p.hold>12){p.file=(p.file+1)%FILES.length;p.cursor=40;p.hold=0;}
   const active=FILES[p.file],text=active.source.slice(0,p.cursor);
   if(code.current)code.current.textContent=text;
   if(panel.current)panel.current.dataset.file=active.name;
   if(tab.current)tab.current.textContent=active.name;
   viewport.current?.scrollTo({top:Math.max(0,(text.split('\n').length+1)*19-(viewport.current?.clientHeight??0)+24),behavior:'smooth'});
   if(++p.tick%22===0&&terminal.current){
    const row=document.createElement('p');row.className='title-terminal-log-entry';row.textContent=LOGS[p.log++%LOGS.length];
    terminal.current.appendChild(row);
    if(terminal.current.childElementCount>8)terminal.current.firstElementChild?.remove();
    terminal.current.scrollTo({top:terminal.current.scrollHeight,behavior:'smooth'});
   }
  },90);
  return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',visibility);};
 },[paused]);
 return <div ref={art} className="title-scene-art" aria-hidden="true" data-suspended={paused}>
  <Image unoptimized className="title-environment" src="/game-art/studio-evening.png" alt="" width={1672} height={941} loading="eager" fetchPriority="high"/>
  <svg className="title-room-effects" viewBox="0 0 1672 941" focusable="false">
   <defs><clipPath id="title-window-glass"><path d="M 998,0 H 1120 V 306 L 998,318 Z M 1134,0 H 1479 V 296 L 1134,307 Z M 867,0 H 969 V 344 L 867,367 Z"/></clipPath></defs>
   <g clipPath="url(#title-window-glass)" className="title-rain">{Array.from({length:44},(_,i)=><line key={i} x1={880+(i*43)%610} x2={876+(i*43)%610} y1={-330+(i*67)%400} y2={-313+(i*67)%400} style={{'--rain-delay':`-${i*.37}s`,'--rain-duration':`${2.5+(i%5)*.4}s`} as CSSProperties}/>)}</g>
   <g className="title-coffee-steam"><path d="M1441 598 C1424 580 1455 568 1438 549"/><path d="M1453 597 C1470 575 1445 568 1458 540"/><path d="M1467 598 C1451 579 1481 569 1466 552"/></g>
   <foreignObject x="0" y="0" width="1672" height="941">
    <div className="title-monitor-workspace" ref={panel} data-file="index.html">
     <div className="title-monitor-top"><Code2 size={16}/><span>mono-cafe</span><span className="title-monitor-controls">− &nbsp; □ &nbsp; ×</span></div>
     <div className="title-monitor-content">
      <aside className="title-monitor-files"><span>EXPLORER</span><b>⌄ mono-cafe</b><span data-file-name="index.html">◇ index.html</span><span data-file-name="style.css"># style.css</span><span data-file-name="app.js">JS app.js</span><span>◇ package.json</span></aside>
      <div className="title-monitor-editor"><div className="title-editor-tab"><span ref={tab}>index.html</span><span>×</span></div><div className="title-editor-code" ref={viewport}><div className="title-line-numbers">{Array.from({length:26},(_,i)=><span key={i}>{i+1}</span>)}</div><pre><code ref={code}>{FILES[0].source.slice(0,180)}</code><i className="title-code-caret"/></pre></div></div>
     </div>
     <div className="title-monitor-terminal"><div><Terminal size={12}/> TERMINAL</div><div className="title-terminal-scroll" ref={terminal}><p><b>~/projects/mono-cafe</b> $ npm run dev</p><p>Local: http://localhost:5173/</p></div></div>
     <div className="title-monitor-taskbar"><LayoutGrid size={16}/><Folder size={15}/><Code2 size={15}/><Globe size={15}/><Terminal size={15}/><span>21:08</span></div>
    </div>
   </foreignObject>
  </svg>
 </div>;
}
