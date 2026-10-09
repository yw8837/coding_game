import {windowRect,type Bounds,type Rect,type WindowState} from './windows.ts';
import type {Task} from './workflow.ts';
import type {GameState} from './engine.ts';

export function unreadWelcome(state:Pick<GameState,'mission'|'accepted'|'gameplay'>){
 return state.mission===0&&!state.accepted&&!state.gameplay.readMessages.includes('welcome');
}

function subtract(rect:Rect,cover:Rect):Rect[]{
 const left=Math.max(rect.x,cover.x),top=Math.max(rect.y,cover.y),right=Math.min(rect.x+rect.width,cover.x+cover.width),bottom=Math.min(rect.y+rect.height,cover.y+cover.height);
 if(left>=right||top>=bottom)return [rect];
 return [
  {x:rect.x,y:rect.y,width:rect.width,height:top-rect.y},
  {x:rect.x,y:bottom,width:rect.width,height:rect.y+rect.height-bottom},
  {x:rect.x,y:top,width:left-rect.x,height:bottom-top},
  {x:right,y:top,width:rect.x+rect.width-right,height:bottom-top},
 ].filter(piece=>piece.width>0&&piece.height>0);
}

/** The same window order/geometry used by DesktopOS, including snapped windows. */
export function visibleQuestApps(windows:readonly WindowState[],bounds:Bounds,compact:boolean):string[]{
 const open=windows.filter(window=>!window.closed&&!window.minimized);
 if(compact)return open.length?[open.at(-1)!.id]:[];
 return open.filter((window,index)=>{
  const rect=windowRect(window,bounds);
  // pc-titlebar is 38px tall, with a 1px window border. A title bar or
  // narrow uncovered edge cannot expose enough content to do the task.
  let remaining=[{x:rect.x+1,y:rect.y+39,width:Math.max(0,rect.width-2),height:Math.max(0,rect.height-40)}];
  for(const above of open.slice(index+1))remaining=remaining.flatMap(rect=>subtract(rect,windowRect(above,bounds)));
  return remaining.some(piece=>piece.width>=120&&piece.height>=80);
 }).map(window=>window.id);
}

export function questGuidance(task:Task,guidedActive:boolean,visibleApps:readonly string[],browserUrl?:string){
 const target=guidedActive&&task.app!=='messages'&&task.app!=='career'&&!task.next?'repair':task.app;
 // Opening an app is navigation, not completion. Commands and next-chapter
 // actions still need their buttons even while their destination is visible.
 const targetVisible=visibleApps.includes(target);
 // Direct editor file selection is local to the editor, so an open window
 // does not prove the requested file is selected. Keep its switch-file action.
 // Browser navigation is also needed when the window shows a different URL.
 const needsDestination=!guidedActive&&(!!task.file||(!!task.url&&task.url!==browserUrl));
 return {target,targetVisible,showAction:!targetVisible||needsDestination||(!guidedActive&&!!task.command)||!!task.next};
}
