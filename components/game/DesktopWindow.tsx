'use client';
import {useEffect,useRef,type ReactNode,type PointerEvent} from 'react';
import {Minus,Maximize2,Minimize2,X,PanelLeft,PanelRight} from 'lucide-react';
import {useLanguage} from '@/lib/game/i18n';
import {fitWindow,windowRect,type WindowState,type Bounds} from '@/lib/game/windows';
type Props={window:WindowState;bounds:Bounds;active:boolean;compact:boolean;title:string;icon:ReactNode;children:ReactNode;onFocus:()=>void;onChange:(w:WindowState)=>void;onClose:()=>void;};
export function DesktopWindow({window:w,bounds,active,compact,title,icon,children,onFocus,onChange,onClose}:Props){
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>lang==='ko'?ko:lang==='en'?en:ja;
 const drag=useRef<{x:number;y:number;original:WindowState;kind:'move'|'resize'}|null>(null);
 const root=useRef<HTMLElement>(null);
 useEffect(()=>{if(active&&!w.minimized&&!w.closed&&!root.current?.contains(document.activeElement))root.current?.focus({preventScroll:true});},[active,w.minimized,w.closed]);
 const rect=windowRect(w,bounds);
 const start=(e:PointerEvent<HTMLElement>,kind:'move'|'resize')=>{
  if(e.button!==0||compact||w.mode!=='normal'||(e.target as HTMLElement).closest('button'))return;
  e.preventDefault();onFocus();drag.current={x:e.clientX,y:e.clientY,original:{...w,...rect},kind};e.currentTarget.setPointerCapture(e.pointerId);
 };
 const move=(e:PointerEvent<HTMLElement>)=>{const d=drag.current;if(!d)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;
  onChange({...w,...fitWindow(d.kind==='move'?{...d.original,x:d.original.x+dx,y:d.original.y+dy}:{...d.original,width:d.original.width+dx,height:d.original.height+dy},bounds)});
 };
 const end=()=>{drag.current=null;};
 const mode=(mode:WindowState['mode'])=>{onFocus();onChange({...w,mode:w.mode===mode?'normal':mode});};
 return <section ref={root} tabIndex={-1} data-window={w.id} data-active={active} className={'pc-window '+(active?'is-active ':'')+(w.mode!=='normal'?'arranged':'')} aria-label={title} hidden={w.closed||w.minimized||(compact&&!active)} onPointerDownCapture={onFocus} onFocusCapture={onFocus} style={compact?undefined:{left:rect.x,top:rect.y,width:rect.width,height:rect.height}}>
  <header className="pc-titlebar" onPointerDown={e=>start(e,'move')} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end} onDoubleClick={e=>{if(!(e.target as HTMLElement).closest('button'))mode('maximized');}}>
   <div className="pc-window-name">{icon}<strong>{title}</strong></div>
   <div className="pc-window-buttons">
    {!compact&&<><button title={tr('왼쪽 절반에 배치','Snap left','左半分に配置')} aria-label={tr('왼쪽 절반에 배치','Snap left','左半分に配置')} onClick={()=>mode('left')}><PanelLeft size={14}/></button><button title={tr('오른쪽 절반에 배치','Snap right','右半分に配置')} aria-label={tr('오른쪽 절반에 배치','Snap right','右半分に配置')} onClick={()=>mode('right')}><PanelRight size={14}/></button></>}
    <button title={tr('최소화','Minimize','最小化')} aria-label={tr('창 최소화','Minimize window','ウィンドウを最小化')} onClick={()=>onChange({...w,minimized:true})}><Minus size={17}/></button>
    {!compact&&<button title={tr('최대화 / 이전 크기','Maximize / restore','最大化 / 元に戻す')} aria-label={tr('창 최대화 또는 복원','Maximize or restore window','ウィンドウを最大化または復元')} onClick={()=>mode('maximized')}>{w.mode==='maximized'?<Minimize2 size={15}/>:<Maximize2 size={15}/>}</button>}
    <button className="pc-close" title={tr('닫기 (Esc)','Close (Esc)','閉じる (Esc)')} aria-label={tr('창 닫기','Close window','ウィンドウを閉じる')} onClick={onClose}><X size={19}/></button>
   </div>
  </header>
  <div className="app-surface pc-surface">{children}</div>
  {!compact&&w.mode==='normal'&&<div className="pc-resize" aria-hidden="true" onPointerDown={e=>start(e,'resize')} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}/>}
 </section>;
}
