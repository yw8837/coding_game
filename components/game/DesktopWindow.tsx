'use client';
import {useEffect,useRef,useState,type ReactNode,type PointerEvent} from 'react';
import {Minus,Maximize2,Minimize2,X,PanelLeft,PanelRight} from 'lucide-react';
import {useLanguage} from '@/lib/game/i18n';
import {fitWindow,snapZone,windowRect,resizeWindow,restoreDraggedWindow,type WindowState,type Bounds,type ResizeDir} from '@/lib/game/windows';
type Props={window:WindowState;bounds:Bounds;active:boolean;compact:boolean;title:string;icon:ReactNode;children:ReactNode;onFocus:()=>void;onChange:(w:WindowState)=>void;onClose:()=>void;};
const RESIZE_HANDLES:{dir:ResizeDir;className:string}[]=[
 {dir:'n',className:'pc-resize-edge handle-n'},
 {dir:'s',className:'pc-resize-edge handle-s'},
 {dir:'w',className:'pc-resize-edge handle-w'},
 {dir:'e',className:'pc-resize-edge handle-e'},
 {dir:'nw',className:'pc-resize-corner handle-nw'},
 {dir:'ne',className:'pc-resize-corner handle-ne'},
 {dir:'sw',className:'pc-resize-corner handle-sw'},
 {dir:'se',className:'pc-resize-corner handle-se'},
];
export function DesktopWindow({window:w,bounds,active,compact,title,icon,children,onFocus,onChange,onClose}:Props){
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>lang==='ko'?ko:lang==='en'?en:ja;
 const drag=useRef<{startX:number;startY:number;original:WindowState;kind:'move'|'resize';dir?:ResizeDir;wasArranged:boolean;ratio:number;restored:boolean;}|null>(null);
 const root=useRef<HTMLElement>(null),lastFocused=useRef<HTMLElement|null>(null);
 const [snap,setSnap]=useState<WindowState['mode']|null>(null),snapRef=useRef<WindowState['mode']|null>(null);
 useEffect(()=>{
  const el=root.current;
  if(!el||!active||w.minimized||w.closed||el.contains(document.activeElement))return;
  const remembered=lastFocused.current;
  const input=w.id==='terminal'?el.querySelector<HTMLElement>('.terminal-form input'):w.id==='editor'?el.querySelector<HTMLElement>('.code-input-wrap textarea,.virtual-code-input textarea'):null;
  (remembered&&el.contains(remembered)&&remembered.getClientRects().length?remembered:input??el).focus({preventScroll:true});
 },[active,w.id,w.minimized,w.closed]);
 const rect=windowRect(w,bounds);
 const start=(e:PointerEvent<HTMLElement>,kind:'move'|'resize',dir:ResizeDir='se')=>{
  if(e.button!==0||compact||(e.target as HTMLElement).closest('button'))return;
  if(w.mode!=='normal'&&kind==='resize')return;
  e.preventDefault();onFocus();
  const stageLeft=root.current?.parentElement?.getBoundingClientRect().left??0;
  const ratio=Math.max(0.08,Math.min(0.92,(e.clientX-stageLeft-rect.x)/Math.max(1,rect.width)));
  drag.current={startX:e.clientX,startY:e.clientY,original:{...w,...rect},kind,dir,wasArranged:w.mode!=='normal',ratio,restored:false};
  e.currentTarget.setPointerCapture(e.pointerId);
 };
 const move=(e:PointerEvent<HTMLElement>)=>{const d=drag.current;if(!d)return;
  if(d.kind==='move'){
   const stage=root.current?.parentElement?.getBoundingClientRect();
   const stageLeft=stage?.left??0,stageTop=stage?.top??0;
   if(d.wasArranged&&!d.restored){
    const dist=Math.hypot(e.clientX-d.startX,e.clientY-d.startY);
    if(dist<6)return;
    const restoredState=restoreDraggedWindow(w,e.clientX-stageLeft,e.clientY-stageTop,d.ratio,bounds);
    d.restored=true;
    d.original={...w,mode:'normal',...restoredState};
    d.startX=e.clientX;
    d.startY=e.clientY;
    onChange({...w,mode:'normal',...restoredState});
    return;
   }
   const dx=e.clientX-d.startX,dy=e.clientY-d.startY;
   const zone=stage?snapZone(e.clientX-stageLeft,e.clientY-stageTop,bounds):null;
   if(zone!==snapRef.current){snapRef.current=zone;setSnap(zone);}
   onChange({...w,mode:'normal',...fitWindow({...d.original,x:d.original.x+dx,y:d.original.y+dy},bounds)});
  }else{
   const dx=e.clientX-d.startX,dy=e.clientY-d.startY;
   onChange({...w,...resizeWindow(d.original,dx,dy,d.dir??'se',bounds)});
  }
 };
 // 제목 표시줄을 화면 위·왼쪽·오른쪽 끝으로 끌면 그 배치로 붙는다. 복원 드래그 후 놓으면 그 위치에 안착한다.
 const end=()=>{const d=drag.current;const zone=d?.kind==='move'?snapRef.current:null;drag.current=null;snapRef.current=null;setSnap(null);if(zone)onChange({...w,mode:zone});};
 const mode=(mode:WindowState['mode'])=>{onFocus();onChange({...w,mode:w.mode===mode?'normal':mode});};
 const preview=snap?windowRect({...w,mode:snap},bounds):null;
 return <>{preview&&<div className="pc-snap-preview" aria-hidden="true" style={{left:preview.x,top:preview.y,width:preview.width,height:preview.height}}/>}<section ref={root} tabIndex={-1} data-window={w.id} data-active={active} className={'pc-window '+(active?'is-active ':'')+(w.mode!=='normal'?'arranged':'')} aria-label={title} hidden={w.closed||w.minimized||(compact&&!active)} onPointerDownCapture={onFocus} onFocusCapture={e=>{const target=e.target as HTMLElement;if(target!==root.current&&!target.closest('.pc-titlebar'))lastFocused.current=target;onFocus();}} style={compact?undefined:{left:rect.x,top:rect.y,width:rect.width,height:rect.height}}>
  <header className="pc-titlebar" title={compact?undefined:tr('끌어서 이동 · 두 번 눌러 최대화 또는 복원','Drag to move · Double-click to maximize or restore','ドラッグで移動 · ダブルクリックで最大化または元に戻す')} onPointerDown={e=>start(e,'move')} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end} onDoubleClick={e=>{if(!(e.target as HTMLElement).closest('button'))mode('maximized');}}>
   <div className="pc-window-name">{icon}<strong>{title}</strong></div>
   <div className="pc-window-buttons">
    {!compact&&<><button title={tr('왼쪽 절반에 배치','Snap left','左半分に配置')} aria-label={tr('왼쪽 절반에 배치','Snap left','左半分に配置')} onClick={()=>mode('left')}><PanelLeft size={14}/></button><button title={tr('오른쪽 절반에 배치','Snap right','右半分に配置')} aria-label={tr('오른쪽 절반에 배치','Snap right','右半分に配置')} onClick={()=>mode('right')}><PanelRight size={14}/></button></>}
    <button title={tr('최소화','Minimize','最小化')} aria-label={tr('창 최소화','Minimize window','ウィンドウを最小化')} onClick={()=>onChange({...w,minimized:true})}><Minus size={17}/></button>
    {!compact&&<button title={tr('최대화 / 이전 크기','Maximize / restore','最大化 / 元に戻す')} aria-label={tr('창 최대화 또는 복원','Maximize or restore window','ウィンドウを最大化または元に戻す')} onClick={()=>mode('maximized')}>{w.mode==='maximized'?<Minimize2 size={15}/>:<Maximize2 size={15}/>}</button>}
    <button className="pc-close" title={tr('닫기 (Esc)','Close (Esc)','閉じる (Esc)')} aria-label={tr('창 닫기','Close window','ウィンドウを閉じる')} onClick={onClose}><X size={19}/></button>
   </div>
  </header>
  <div className="app-surface pc-surface">{children}</div>
  {!compact&&w.mode==='normal'&&<>
   {RESIZE_HANDLES.map(h=><div key={h.dir} className={'pc-resize-handle '+h.className} aria-hidden="true" onPointerDown={e=>start(e,'resize',h.dir)} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}/>)}
   <div className="pc-resize" aria-hidden="true" onPointerDown={e=>start(e,'resize','se')} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}/>
  </>}
 </section></>;
}
