import test from 'node:test';
import assert from 'node:assert/strict';
import {assist} from './assisted.ts';
import {createGame,act,projectFiles,sourceHash,runCodeChecks,apiRequest,runCommand} from './engine.ts';
import {questProgress} from './quest.ts';
import {commandCompletions,codeCompletions,indentSelection} from './input-tools.ts';
import {readSave,writeSave} from './save.ts';

test('three chapters finish through assisted actions, with real arithmetic and API checks',()=>{
 let s=assist(createGame(),'prepare');
 assert.equal(questProgress(s).current?.label,'모노 카페 간판 달기');
 s=assist(assist(s,'title-cafe'),'width-fit');
 assert.equal(questProgress(s).current?.kind,'trial');
 // Layout needs a browser; the actual iframe checks are exercised in the UI playthrough.
 s=act(s,{type:'test-result',hash:sourceHash(projectFiles(s)),checks:[0,1,2].map(i=>({name:'browser fixture '+i,passed:true}))});
 s=assist(s,'publish');assert.deepEqual(s.completed,[0]);
 const oldCredits=s.credits;s=assist(s,'publish');assert.equal(s.credits,oldCredits);
 s=act(s,{type:'next-mission'});assert.equal(runCodeChecks(s).every(c=>c.passed),false);
 const oldRelease=s.repo!.deployed.files['app.js'];assert.match(oldRelease,/price \* quantity/);
 s=assist(s,'multiply');s=act(s,{type:'test-result',hash:sourceHash(projectFiles(s)),checks:runCodeChecks(s)});
 s=assist(s,'publish');assert.deepEqual(s.completed,[0,1]);
 s=readSave(JSON.stringify(s));s=act(s,{type:'next-mission'});
 s=assist(assist(s,'route-menu'),'keep-orders');s=assist(s,'trial');
 let response=apiRequest(s,'GET','http://mono-server:8000/api/menu','');assert.equal(response.status,200);s=response.state;
 response=apiRequest(s,'POST','http://mono-server:8000/api/orders','{"item":"아메리카노","quantity":2}');assert.equal(response.status,201);s=response.state;
 const checks=runCodeChecks(s);assert.ok(checks.every(c=>c.passed));assert.equal(s.orders.length,1);
 s=act(s,{type:'test-result',hash:sourceHash(projectFiles(s)),checks});s=assist(s,'publish');
 assert.deepEqual(s.completed,[0,1,2]);assert.equal(s.credits,1720);assert.equal(s.xp,560);
 s=act(s,{type:'celebrate-opening'});assert.equal(s.gameplay.openingCelebrated,true);
 assert.ok(s.badges.includes('동네 해결사'));
 s=act(s,{type:'celebrate-opening'});assert.equal(s.badges.filter(b=>b==='동네 해결사').length,1);
 assert.equal(s.credits,1720);
 const final=JSON.stringify(s);let stored='';writeSave({setItem:(_,v)=>{stored=v;}},s);assert.equal(stored,final);
 assert.equal(questProgress(readSave(stored)).complete,true);
 s=act(s,{type:'next-mission'});assert.equal(s.mission,2);
});
test('opening needs every chapter and old saves gain an unplayed ending',()=>{
 const fresh=createGame();assert.equal(questProgress(fresh).current?.kind,'messages');
 assert.equal(act(fresh,{type:'celebrate-opening'}).gameplay.openingCelebrated,false);
 const old=JSON.parse(JSON.stringify(fresh));delete old.gameplay.openingCelebrated;
 assert.equal(readSave(JSON.stringify(old)).gameplay.openingCelebrated,false);
});
test('wrong choices, missing tests, and stale results cannot pay a reward',()=>{
 let s=assist(createGame(),'prepare');s=assist(s,'publish');assert.equal(s.completed.length,0);
 s=act(s,{type:'test-result',hash:sourceHash(projectFiles(s)),checks:[0,1,2].map(i=>({name:String(i),passed:true}))});
 s=assist(s,'title-bakery');s=assist(s,'publish');assert.equal(s.completed.length,0);
 s=act(s,{type:'next-mission'});assert.equal(s.mission,0);
});
test('a wrong server route and discarded orders fail the third chapter checks',()=>{
 let s=assist(createGame(),'prepare');s.mission=2;s.completed=[0,1];
 s=assist(s,'trial');let r=apiRequest(s,'GET','http://mono-server:8000/api/menu','');assert.equal(r.status,404);s=r.state;
 r=apiRequest(s,'POST','http://mono-server:8000/api/orders','{"item":"coffee","quantity":1}');s=r.state;
 assert.equal(s.orders.length,0);assert.ok(runCodeChecks(s).some(c=>!c.passed));
});
test('terminal completion resolves nested and spaced paths on the active machine',()=>{
 let s=assist(createGame(),'prepare');assert.ok(commandCompletions(s,'npm r').includes('npm run dev'));
 assert.ok(commandCompletions(s,'cat RE').includes('cat README.md'));
 s=runCommand(s,'mkdir "my notes"').state;assert.ok(commandCompletions(s,'cd my').includes('cd "my notes/"'));
 s.machine='server';assert.equal(commandCompletions(s,'cat app').length,0);
});
test('code completions replace only the current word and multiline indentation round-trips',()=>{
 const text='  return pri';const found=codeCompletions('app.js',text,text.length).find(c=>c.text==='price')!;
 assert.equal(text.slice(0,found.start)+found.text,'  return price');
 const source='first\n  second';const indented=indentSelection(source,0,source.length);
 assert.equal(indented.text,'  first\n    second');assert.equal(indentSelection(indented.text,indented.start,indented.end,true).text,source);
});
