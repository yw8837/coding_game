import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,runCommand,projectFiles,sourceHash,runCodeChecks,apiRequest} from './engine.ts';
import {currentTask,taskSelection,PHASES} from './workflow.ts';
import {readSave} from './save.ts';
import {translate} from './translations.ts';

test('desktop app objectives lead through all chapters without assisted solutions, including server commands',()=>{
 let s=createGame();const visited:string[]=[],copy=new Set(PHASES);
 const replacements:Record<string,string>={sign:'모노 카페',size:'100%',rule:'*',route:'/api/menu',keep:'True'};
 for(let n=0;n<100&&s.completed.length<3;n++){
  const q=currentTask(s);visited.push(q.id);copy.add(q.title);copy.add(q.detail);
  if(q.command){const result=runCommand(s,q.command);assert.equal(result.error,false,q.id+': '+result.output);s=result.state;}
  else if(q.id==='message'){s=act(s,{type:'read-message',id:['welcome','chapter-two','chapter-three'][s.mission]});s=act(s,{type:'accept'});}
  else if(q.id==='repo')s=act(s,{type:'discover',what:'repo'});
  else if(q.id==='inspect')s=act(s,{type:'inspect-preview',mobile:true,quantity:3});
  else if(replacements[q.id]){const source=projectFiles(s)[q.file!],selection=taskSelection(q,source);assert.ok(selection,q.id);s=act(s,{type:'edit',path:q.file!,content:source.slice(0,selection[0])+replacements[q.id]+source.slice(selection[1])});}
  else if(q.id==='server')s=act(s,{type:'install-server'});
  else if(q.id==='api'){const response=!s.apiEvidence.menu?apiRequest(s,'GET','http://mono-server:8000/api/menu',''):apiRequest(s,'POST','http://mono-server:8000/api/orders','{"item":"아메리카노","quantity":2}');assert.ok([200,201].includes(response.status));s=response.state;}
  else if(q.id==='test'){const checks=s.mission===0?[0,1,2].map(i=>({name:String(i),passed:true})):runCodeChecks(s);assert.ok(checks.every(c=>c.passed));s=act(s,{type:'test-result',hash:sourceHash(projectFiles(s)),checks});}
  else if(['review','merge','deploy','complete'].includes(q.id))s=act(s,{type:({'review':'open-pr','merge':'merge-pr','deploy':'deploy','complete':'next-mission'} as const)[q.id as 'review'|'merge'|'deploy'|'complete']});
  else assert.fail('Unhandled objective: '+q.id);
  s=readSave(JSON.stringify(s));
 }
 assert.deepEqual(s.completed,[0,1,2]);assert.equal(s.credits,1720);assert.equal(s.xp,560);
 assert.equal(s.gameplay.servedCustomers,0,'old choice-card practice must not gate the campaign');
 assert.ok(visited.includes('server-clone'));assert.ok(visited.includes('start-api'));assert.ok(visited.includes('api'));
 for(const language of ['en','ja'] as const)for(const value of copy)assert.notEqual(translate(value,language),value,language+': '+value);
 s=act(s,{type:'celebrate-opening'});assert.equal(s.gameplay.openingCelebrated,true);
 const credits=s.credits;s=act(s,{type:'deploy'});assert.equal(s.credits,credits);
});

test('inspection requires the visible phone view or three-cup probe, and guidance does not mutate progress',()=>{
 let s=createGame();assert.deepEqual(act(s,{type:'inspect-preview',mobile:true,quantity:3}).gameplay.inspected,[]);
 for(const cmd of ['git clone https://cathub.dev/mono/menu-site.git','sudo apt update','sudo apt install nodejs npm','cd menu-site','npm install','npm run dev'])s=runCommand(s,cmd).state;
 const before=JSON.stringify(s);currentTask(s);assert.equal(JSON.stringify(s),before);
 assert.deepEqual(act(s,{type:'inspect-preview',mobile:false,quantity:3}).gameplay.inspected,[]);
 s=act(s,{type:'inspect-preview',mobile:true,quantity:0});assert.deepEqual(s.gameplay.inspected,[0]);
 s.mission=1;assert.deepEqual(act(s,{type:'inspect-preview',mobile:true,quantity:1}).gameplay.inspected,[0]);
 s=act(s,{type:'inspect-preview',mobile:false,quantity:3});assert.deepEqual(readSave(JSON.stringify(s)).gameplay.inspected,[0,1]);
 const old=JSON.parse(JSON.stringify(s));delete old.gameplay.inspected;assert.deepEqual(readSave(JSON.stringify(old)).gameplay.inspected,[]);
});

test('token selection targets code, excludes the CSS comment, and tolerates malformed source',()=>{
 const q={id:'size',phase:2,title:'',detail:'',app:'editor' as const,find:'width'};
 const css='/* 960px */\n.menu-grid { width: 960px; }';const pos=taskSelection(q,css)!;
 assert.equal(css.slice(...pos),'960px');assert.ok(pos[0]>css.indexOf('.menu-grid'));
 assert.equal(taskSelection(q,'broken'),null);
});
