import test from 'node:test';
import assert from 'node:assert/strict';
import {fitWindow,openWindow,focusedWindow,windowRect} from './windows.ts';
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
