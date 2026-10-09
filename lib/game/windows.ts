/** Geometry is relative to the usable desktop, never to the browser screen. */
export type Bounds={width:number;height:number};
export type Rect={x:number;y:number;width:number;height:number};
export type WindowState=Rect&{id:string;minimized:boolean;closed?:boolean;mode:'normal'|'maximized'|'left'|'right'};
export function fitWindow(rect:Rect,b:Bounds):Rect{
 const width=Math.min(Math.max(380,rect.width),Math.max(1,b.width));
 const height=Math.min(Math.max(280,rect.height),Math.max(1,b.height));
 return {width,height,x:Math.max(0,Math.min(rect.x,b.width-width)),y:Math.max(0,Math.min(rect.y,b.height-height))};
}
export function windowRect(w:WindowState,b:Bounds):Rect{
 if(w.mode==='normal')return fitWindow(w,b);
 const half=w.mode==='left'||w.mode==='right';
 return {x:w.mode==='right'?b.width/2:0,y:0,width:half?b.width/2:b.width,height:b.height};
}
export function openWindow(list:WindowState[],id:string,b:Bounds):WindowState[]{
 const existing=list.find(w=>w.id===id),offset=(list.length%5)*25;
 const fresh:WindowState={id,minimized:false,mode:'normal',...fitWindow({x:90+offset,y:26+offset,width:Math.max(700,b.width*.84),height:Math.max(520,b.height*.88)},b)};
 return [...list.filter(w=>w.id!==id),existing?{...existing,minimized:false,closed:false}:fresh];
}
export function focusedWindow(list:WindowState[]):string{return list.findLast(w=>!w.minimized&&!w.closed)?.id??'desktop';}
