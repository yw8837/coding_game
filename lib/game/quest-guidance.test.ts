import test from 'node:test';
import assert from 'node:assert/strict';
import {act,createGame} from './engine.ts';
import {currentTask,type Task} from './workflow.ts';
import {openWindow,type WindowState} from './windows.ts';
import {questGuidance,unreadWelcome,visibleQuestApps} from './quest-guidance.ts';

const bounds={width:1200,height:720};
const guidance=(task:Task,windows:WindowState[],guided=false,compact=false)=>questGuidance(task,guided,visibleQuestApps(windows,bounds,compact));

test('reading the welcome message consumes its new-mail alert while unaccepted guidance remains',()=>{
 let state=createGame();assert.equal(unreadWelcome(state),true);
 state=act(state,{type:'read-message',id:'welcome'});
 assert.equal(unreadWelcome(state),false);assert.equal(state.accepted,false);assert.deepEqual(state.completed,[]);
 assert.equal(currentTask(state).id,'message');assert.equal(guidance(currentTask(state),[]).showAction,true);
 state.mission=1;state.gameplay.readMessages=[];
 assert.equal(unreadWelcome(state),false,'later chapters must not replay the welcome notification');
});

test('opening the requested message consumes its open-app prompt without accepting the mission',()=>{
 const state=createGame(),before=JSON.stringify(state),task=currentTask(state);
 assert.equal(guidance(task,[]).showAction,true);
 const windows=openWindow([],'messages',bounds);
 assert.equal(guidance(task,windows).showAction,false);
 assert.equal(currentTask(state).id,'message');assert.equal(state.accepted,false);assert.equal(JSON.stringify(state),before);
});

test('shortcut/direct/taskbar restore all consume the prompt; minimize, X/Esc, desktop restore it',()=>{
 const task=currentTask(createGame());let windows=openWindow([],'messages',bounds);
 for(const hidden of [{minimized:true},{closed:true,minimized:true}]){
  windows=windows.map(window=>({...window,...hidden}));assert.equal(guidance(task,windows).showAction,true);
  windows=openWindow(windows,'messages',bounds);assert.equal(guidance(task,windows).showAction,false);
 }
 assert.equal(guidance(task,windows.map(window=>({...window,minimized:true}))).showAction,true);
});

test('a covering maximized app restores navigation, while side-by-side target stays visible',()=>{
 const task=currentTask(createGame());let windows=openWindow(openWindow([],'messages',bounds),'editor',bounds);
 windows=windows.map(window=>window.id==='editor'?{...window,mode:'maximized'}:window);
 assert.equal(guidance(task,windows).showAction,true);
 windows=windows.map(window=>({...window,mode:window.id==='messages'?'left':'right'}));
 assert.equal(guidance(task,windows).showAction,false);
 assert.equal(guidance(task,windows,false,true).showAction,true,'compact UI renders only the active app');
});

test('guided targets follow repair alias; messages stay messages and objective updates after acceptance',()=>{
 let state=createGame(),windows=openWindow([],'messages',bounds);
 assert.equal(guidance(currentTask(state),windows,true).target,'messages');
 state=act(act(state,{type:'read-message',id:'welcome'}),{type:'accept'});
 const task=currentTask(state);assert.notEqual(task.id,'message');
 assert.equal(guidance(task,windows,true).showAction,true);
 windows=openWindow(windows,'repair',bounds);assert.equal(guidance(task,windows,true).showAction,false);
 assert.equal(guidance(task,openWindow([],'editor',bounds),true).showAction,true);
});

test('real commands and next-chapter actions remain actionable when their apps are visible',()=>{
 const base=currentTask(createGame());
 assert.equal(guidance({...base,app:'terminal',command:'npm test'},openWindow([],'terminal',bounds)).showAction,true);
 assert.equal(guidance({...base,app:'terminal',command:'npm test'},openWindow([],'repair',bounds),true).showAction,false,'guided follow opens repair instead of inserting the terminal command');
 assert.equal(guidance({...base,next:true},openWindow([],'messages',bounds)).showAction,true);
 assert.equal(guidance({...base,app:'career',localized:{title:{ko:'',en:'',ja:''},detail:{ko:'',en:'',ja:''}}},openWindow([],'career',bounds)).showAction,false);
 assert.equal(guidance({...base,app:'career'},openWindow([],'career',bounds),true).target,'career');
});

test('multiple covering windows and viewport resize use current bounds without persisted visibility',()=>{
 let windows:WindowState[]=openWindow([],'messages',bounds).map(window=>({...window,mode:'maximized' as const}));
 windows=openWindow(windows,'editor',bounds).map(window=>window.id==='editor'?{...window,mode:'left'}:window);
 windows=openWindow(windows,'terminal',bounds).map(window=>window.id==='terminal'?{...window,mode:'right'}:window);
 assert.equal(visibleQuestApps(windows,bounds,false).includes('messages'),false);
 assert.deepEqual(visibleQuestApps(windows,{width:390,height:500},true),['terminal']);
});

test('a browser title bar or narrow exposed edge does not consume the open-app prompt',()=>{
 const task:Task={...currentTask(createGame()),app:'browser',url:'http://localhost:5173'};
 const browser:WindowState={id:'browser',x:0,y:0,width:500,height:500,mode:'normal',minimized:false};
 const computer:WindowState={...browser,id:'computer',y:38};
 assert.equal(visibleQuestApps([browser,computer],bounds,false).includes('browser'),false,'only title bar remains');
 assert.equal(questGuidance(task,false,visibleQuestApps([browser,computer],bounds,false),task.url).showAction,true);
 assert.equal(visibleQuestApps([browser,{...computer,x:25,y:25}],bounds,false).includes('browser'),false,'25px edge is not usable content');
});

test('visibility requires an uncovered content rectangle at least 120 by 80 pixels',()=>{
 const browser:WindowState={id:'browser',x:0,y:0,width:500,height:500,mode:'normal',minimized:false};
 const cover:WindowState={...browser,id:'computer'};
 assert.equal(visibleQuestApps([browser,{...cover,y:118}],bounds,false).includes('browser'),false);
 assert.equal(visibleQuestApps([browser,{...cover,y:119}],bounds,false).includes('browser'),true);
 assert.equal(visibleQuestApps([browser,{...cover,x:120}],bounds,false).includes('browser'),false);
 assert.equal(visibleQuestApps([browser,{...cover,x:121}],bounds,false).includes('browser'),true);
});

test('visible direct browser keeps navigation for a changed URL but collapses the current destination',()=>{
 const task:Task={...currentTask(createGame()),app:'browser',url:'http://localhost:5173'};
 assert.equal(questGuidance(task,false,['browser'],'https://cathub.dev/mono/menu-site').showAction,true);
 assert.equal(questGuidance(task,false,['browser'],task.url).showAction,false);
 const review={...task,url:'https://cathub.dev/mono/menu-site?tab=pr'};
 assert.equal(questGuidance(review,false,['browser'],task.url).showAction,true);
 assert.equal(questGuidance(review,false,['browser'],review.url).showAction,false);
 assert.equal(questGuidance(review,true,['repair'],task.url).showAction,false,'guided work stays in its open repair view');
});

test('direct editor file requests remain actionable across file changes and manual file selections',()=>{
 const task:Task={...currentTask(createGame()),app:'editor',file:'index.html'};
 assert.equal(questGuidance(task,false,['editor']).showAction,true);
 assert.equal(questGuidance({...task,file:'style.css'},false,['editor']).showAction,true);
 assert.equal(questGuidance({...task,file:'server.py'},false,['editor']).showAction,true);
 assert.equal(questGuidance(task,true,['repair']).showAction,false,'guided repair does not need a file-switch button');
});
