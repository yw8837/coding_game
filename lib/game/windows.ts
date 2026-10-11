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
const visible=(w:WindowState)=>!w.minimized&&!w.closed;
/** Dual tile: `primary` on the left, the most recently focused other window on the right.
 * Opens `fallback` when nothing else is on screen; every other window is minimized. */
export function tileWindows(list:WindowState[],b:Bounds,primary='terminal',fallback='browser'):WindowState[]{
 const partner=list.findLast(w=>w.id!==primary&&visible(w))?.id??(fallback===primary?null:fallback);
 let next=list.some(w=>w.id===primary&&visible(w))?list:openWindow(list,primary,b);
 if(partner&&!next.some(w=>w.id===partner&&visible(w)))next=openWindow(next,partner,b);
 const arranged=next.map(w=>w.id===primary?{...w,mode:(partner?'left':'maximized') as WindowState['mode'],minimized:false,closed:false}:w.id===partner?{...w,mode:'right' as const,minimized:false,closed:false}:{...w,minimized:true});
 // The primary window ends up last so it keeps focus for typing.
 return [...arranged.filter(w=>w.id!==primary&&w.id!==partner),...arranged.filter(w=>w.id===partner),...arranged.filter(w=>w.id===primary)];
}
/** Edge snapping while dragging a titlebar. `x`/`y` are pointer coordinates inside the desktop. */
export function snapZone(x:number,y:number,b:Bounds,edge=18,top=6):WindowState['mode']|null{
 if(y<=top)return 'maximized';
 if(x<=edge)return 'left';
 if(x>=b.width-edge)return 'right';
 return null;
}
