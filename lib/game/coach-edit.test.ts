import {test} from 'node:test';
import assert from 'node:assert/strict';
import {act,createGame,projectFiles,calculateTotal} from './engine.ts';
import {assist} from './assisted.ts';
import {coachEdit,type CoachEdit} from './coach-edit.ts';
import {coachStage} from './coach.ts';

test('novice edits write typed values to actual files without granting completion or replacing other work',()=>{
 let s=assist(createGame(),'prepare');s=act(s,{type:'inspect-preview',mobile:true,quantity:0});
 const edit=(key:CoachEdit,value:string)=>{const a=coachEdit(s,key,value);assert.ok(a);s=act(s,a);};
 s=act(s,{type:'edit',path:'index.html',content:projectFiles(s)['index.html']+'\n<!-- my footer -->'});
 edit('sign','내 작은 카페');assert.match(projectFiles(s)['index.html'],/<h1>내 작은 카페<\/h1>/);assert.equal(coachStage(s),'sign');
 edit('sign','Mono Cafe');assert.equal(coachStage(s),'size');assert.match(projectFiles(s)['index.html'],/<!-- my footer -->$/);
 edit('size','130%');assert.equal(coachStage(s),'size');edit('size','100%');assert.equal(coachStage(s),'trial');
 assert.deepEqual(assist(s,'publish').completed,[]);
 s.mission=1;s.gameplay.inspected.push(1);
 s=act(s,{type:'edit',path:'app.js',content:'// keep this note\nfunction calculateTotal(price, quantity) { return price + quantity; }'});
 edit('rule','-');assert.equal(calculateTotal(projectFiles(s)['app.js'],4500,3),4497);assert.equal(coachStage(s),'rule');
 edit('rule','*');assert.equal(calculateTotal(projectFiles(s)['app.js'],4500,3),13500);assert.equal(coachStage(s),'serve');assert.match(projectFiles(s)['app.js'],/^\/\/ keep this note/);
 assert.equal(s.gameplay.servedCustomers,0);assert.deepEqual(s.completed,[]);
 s.mission=2;
 edit('route','/my-menu');assert.equal(coachStage(s),'route');edit('route','/api/menu');assert.equal(coachStage(s),'keep');
 edit('keep','True');assert.equal(coachStage(s),'connect');assert.equal(s.apiEvidence.order,false);assert.equal(s.orders.length,0);
});

test('blank values, malformed tokens and missing source are rejected while sign markup stays inert',()=>{
 const s=assist(createGame(),'prepare');
 for(const [key,value] of [['sign',''],['sign','line\nbreak'],['size','49%'],['size','181%'],['size','100%;color:red'],['rule','**'],['route','/api/menu"'],['keep','true']] as [CoachEdit,string][])assert.equal(coachEdit(s,key,value),null);
 const action=coachEdit(s,'sign','モノカフェ <img onerror=alert(1)> & $1');assert.ok(action);
 assert.match(action.content,/モノカフェ &lt;img onerror=alert\(1\)&gt; &amp; \$1/);
 assert.equal(coachEdit(createGame(),'sign','Mono Cafe'),null);
});

test('a candidate rejected by the engine preserves the original file and cannot count as a saved edit',()=>{
 let s=assist(createGame(),'prepare');
 const source=projectFiles(s)['index.html'];
 s=act(s,{type:'edit',path:'index.html',content:source+' '.repeat(60000-source.length)});
 const original=projectFiles(s)['index.html'];assert.equal(original.length,60000);
 const candidate=coachEdit(s,'sign','Mono Cafe with a much longer title');assert.ok(candidate);assert.ok(candidate.content.length>60000);
 const next=act(s,candidate);
 assert.equal(projectFiles(next)['index.html'],original);
 assert.notEqual(projectFiles(next)[candidate.path],candidate.content);
 assert.match(next.notice,/60,000/);assert.deepEqual(next.completed,[]);
});
