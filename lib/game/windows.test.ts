import test from 'node:test';
import assert from 'node:assert/strict';
import {fitWindow,openWindow,focusedWindow,windowRect,tileWindows,snapZone,resizeWindow,restoreDraggedWindow,cycleWindow} from './windows.ts';
test('windows open independently, restore one instance and keep focus bounded',()=>{
 const b={width:1100,height:720};let list=openWindow([],'messages',b);list=openWindow(list,'editor',b);
 list=list.map(w=>w.id==='messages'?{...w,minimized:true}:w);list=openWindow(list,'messages',b);
 assert.equal(list.length,2);assert.equal(focusedWindow(list),'messages');assert.equal(list.at(-1)!.minimized,false);
 assert.equal(focusedWindow(list.map(w=>({...w,minimized:true}))),'desktop');
});
test('viewport shrink keeps complete titlebar and bottom controls on desktop',()=>{
 assert.deepEqual(fitWindow({x:900,y:600,width:1000,height:800},{width:390,height:500}),{x:0,y:0,width:390,height:500});
 const w=openWindow([],'editor',{width:1200,height:700})[0];
 assert.deepEqual(windowRect({...w,mode:'right'},{width:1000,height:600}),{x:500,y:0,width:500,height:600});
 assert.deepEqual(windowRect({...w,mode:'maximized'},{width:1000,height:600}),{x:0,y:0,width:1000,height:600});
});
test('tile puts the terminal beside the latest window and tucks the rest away',()=>{
 const b={width:1200,height:700};let list=openWindow([],'messages',b);list=openWindow(list,'editor',b);
 const tiled=tileWindows(list,b);
 const by=(id:string)=>tiled.find(w=>w.id===id)!;
 assert.equal(by('terminal').mode,'left');assert.equal(by('editor').mode,'right');assert.equal(by('messages').minimized,true);
 assert.equal(focusedWindow(tiled),'terminal');
 assert.deepEqual(windowRect(by('editor'),b),{x:600,y:0,width:600,height:700});
 const alone=tileWindows([],b,'terminal','repair');
 assert.deepEqual(alone.map(w=>[w.id,w.mode,w.minimized]),[['repair','right',false],['terminal','left',false]]);
 const reopened=tileWindows(list.map(w=>({...w,minimized:true,closed:true})),b);
 assert.equal(reopened.find(w=>w.id==='browser')?.mode,'right');assert.equal(reopened.find(w=>w.id==='editor')?.minimized,true);
});
test('dragging a titlebar to an edge picks a snap layout',()=>{
 const b={width:1000,height:600};
 assert.equal(snapZone(500,4,b),'maximized');assert.equal(snapZone(3,300,b),'left');assert.equal(snapZone(995,300,b),'right');assert.equal(snapZone(500,300,b),null);
});
test('directional window resize adjusts bounds safely across all edges and corners',()=>{
 const b={width:1200,height:800};
 const initial={x:100,y:100,width:500,height:400};
 // Drag right edge (e): width grows
 assert.deepEqual(resizeWindow(initial,50,0,'e',b),{x:100,y:100,width:550,height:400});
 // Drag bottom edge (s): height grows
 assert.deepEqual(resizeWindow(initial,0,60,'s',b),{x:100,y:100,width:500,height:460});
 // Drag corner (se): both grow
 assert.deepEqual(resizeWindow(initial,50,60,'se',b),{x:100,y:100,width:550,height:460});
 // Drag left edge (w): moves x and adjusts width
 assert.deepEqual(resizeWindow(initial,-40,0,'w',b),{x:60,y:100,width:540,height:400});
 // Drag top edge (n): moves y and adjusts height
 assert.deepEqual(resizeWindow(initial,0,-30,'n',b),{x:100,y:70,width:500,height:430});
 // Min size constraints prevent window collapse (min 380x280)
 const shrunk=resizeWindow(initial,400,0,'w',b);
 assert.equal(shrunk.width,380);
});

test('drag restore preserves normal dimensions and pointer anchor with the same resize minimum',()=>{
 const b={width:1100,height:700};
 const w={id:'editor',x:30,y:40,width:380,height:280,mode:'maximized' as const,minimized:false};
 assert.deepEqual(restoreDraggedWindow(w,600,100,.5,b),{x:410,y:81,width:380,height:280});
 assert.deepEqual(restoreDraggedWindow({...w,width:900,height:650},10,5,.9,{width:500,height:300}),{x:0,y:0,width:500,height:300});
 // A short viewport temporarily fits the window; its stored normal size stays usable after expansion.
 assert.equal(w.width,380);assert.equal(w.height,280);
 assert.deepEqual(windowRect({...w,mode:'normal'},b),{x:30,y:40,width:380,height:280});
});
test('resize after a viewport change keeps the opposite edges anchored inside the current stage',()=>{
 const stale={x:900,y:500,width:700,height:500},b={width:800,height:400};
 const fit=fitWindow(stale,b);
 for(const dir of ['n','s','w','e','nw','ne','sw','se'] as const){
  const resized=resizeWindow(stale,40,30,dir,b);
  assert.ok(resized.x>=0&&resized.y>=0);
  assert.ok(resized.x+resized.width<=b.width&&resized.y+resized.height<=b.height);
  if(!dir.includes('w'))assert.equal(resized.x,fit.x);
  if(!dir.includes('n'))assert.equal(resized.y,fit.y);
 }
});
test('every release viewport and zoom-sized desktop can clamp and restore without losing controls',()=>{
 for(const [width,height] of [[1084,671],[998,623],[835,475],[760,383],[640,340],[390,240]]){
  const b={width,height},w=openWindow([],'terminal',{width:1600,height:900})[0];
  for(const mode of ['normal','maximized','left','right'] as const){
   const r=windowRect({...w,mode},b);
   assert.ok(r.width>0&&r.height>0&&r.x>=0&&r.y>=0);
   assert.ok(r.x+r.width<=width&&r.y+r.height<=height);
  }
 }
});
test('window cycling is stable in app order, includes minimized windows and excludes closed windows',()=>{
 const b={width:1000,height:600};
 let list=openWindow([],'editor',b);list=openWindow(list,'terminal',b);list=openWindow(list,'browser',b);
 list=list.map(w=>({...w,minimized:w.id==='editor'}));
 assert.equal(cycleWindow(list,'browser',['editor','terminal','browser']),'editor');
 assert.equal(cycleWindow(list,'editor',['editor','terminal','browser'],true),'browser');
 assert.equal(cycleWindow(list.map(w=>({...w,closed:w.id==='editor'})),'browser',['editor','terminal','browser']),'terminal');
 assert.equal(cycleWindow([], 'desktop',['terminal']),null);
 assert.equal(cycleWindow(list.map(w=>({...w,minimized:true})),'desktop',['editor','terminal','browser']),'editor');
});
