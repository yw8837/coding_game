import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,projectFiles,apiRequest,runCodeChecks,sourceHash} from './engine.ts';
import {assist} from './assisted.ts';
import {coachStage,coachRepair} from './coach.ts';
import {coachDraftEdit} from './coach-edit.ts';

test('the beginner route is derived from real files and preserves edits outside a selected token',()=>{
 let s=assist(createGame(),'prepare');assert.equal(coachStage(s),'inspect');
 s=act(s,{type:'inspect-preview',mobile:true,quantity:0});assert.equal(coachStage(s),'sign');
 s=assist(s,'title-bakery');assert.equal(coachStage(s),'sign');
 s=assist(s,'title-cafe');assert.equal(coachStage(s),'size');
 s=assist(s,'width-fit');assert.equal(coachStage(s),'trial');
 s=assist(s,'publish');assert.deepEqual(s.completed,[]);
 s.mission=1;s.gameplay.inspected.push(1);
 s=act(s,{type:'edit',path:'app.js',content:'// my note stays\nfunction calculateTotal(price, quantity) {\n return price + quantity;\n}\n'});
 assert.equal(coachStage(s),'rule');s=assist(s,'multiply');
 assert.match(projectFiles(s)['app.js'],/^\/\/ my note stays/);assert.equal(coachStage(s),'serve');
 s=act(s,{type:'serve-customer',customer:0,quantity:9});assert.equal(s.gameplay.servedCustomers,0);
 for(const [customer,quantity] of [[0,2],[1,3],[2,1]])s=act(s,{type:'serve-customer',customer,quantity});
 assert.equal(coachStage(s),'trial');
});

test('the server chapter requires real menu and order requests before checks and delivery',()=>{
 let s=assist(createGame(),'prepare');s.mission=2;s.completed=[0,1];
 s=assist(s,'route-menu');s=assist(s,'keep-orders');assert.equal(coachStage(s),'connect');
 s=assist(s,'trial');assert.equal(coachStage(s),'menu');assert.equal(s.apiEvidence.menu,false);
 s=apiRequest(s,'GET','http://mono-server:8000/api/menu','').state;assert.equal(coachStage(s),'order');
 s=apiRequest(s,'POST','http://mono-server:8000/api/orders','{"item":"아메리카노","quantity":2}').state;
 assert.equal(coachStage(s),'trial');assert.equal(s.orders.length,1);
 s=act(s,{type:'test-result',hash:sourceHash(projectFiles(s)),checks:runCodeChecks(s)});assert.equal(coachStage(s),'deliver');
 s=assist(s,'discard-orders');assert.equal(coachStage(s),'keep');assert.deepEqual(assist(s,'publish').completed,[0,1]);
});

test('click-only checks and delivery cannot solve the checkout; a real alternate program can earn its reward once',()=>{
 for(const edition of ['full','demo'] as const){
  let s=assist(createGame(),'prepare',edition);s.mission=1;s.completed=[0];s.gameplay.inspected.push(1);
  s=act(s,{type:'edit',path:'app.js',content:'function calculateTotal(price, quantity) { return price + quantity; }'},edition);
  const broken=projectFiles(s)['app.js'],credits=s.credits;
  for(let attempt=0;attempt<3;attempt++){
   assert.equal(coachDraftEdit(s,'rule',projectFiles(s)['app.js']),null);
   s=assist(s,'prepare',edition);s=assist(s,'trial',edition);
   s=act(s,{type:'serve-customer',customer:0,quantity:2},edition);
   s=act(s,{type:'test-result',hash:sourceHash(projectFiles(s)),checks:runCodeChecks(s)},edition);
   s=assist(s,'publish',edition);
   assert.equal(projectFiles(s)['app.js'],broken);
   assert.equal(coachStage(s),'rule');assert.deepEqual(s.completed,[0]);assert.equal(s.credits,credits);
  }
  const source='function calculateTotal(price, quantity) { const total = quantity * price; return total; }';
  const edit=coachDraftEdit(s,'rule',source);assert.ok(edit);s=act(s,edit,edition);
  for(const [customer,quantity] of [[0,2],[1,3],[2,1]])s=act(s,{type:'serve-customer',customer,quantity},edition);
  const checks=runCodeChecks(s);assert.ok(checks.every(c=>c.passed));
  s=act(s,{type:'test-result',hash:sourceHash(projectFiles(s)),checks},edition);
  assert.equal(coachStage(s),'deliver');s=assist(s,'publish',edition);
  assert.deepEqual(s.completed,[0,1]);assert.equal(s.credits,credits+500);
  const xp=s.xp;s=assist(s,'publish',edition);assert.equal(s.credits,credits+500);assert.equal(s.xp,xp);
 }
});

test('repair goals explain outcomes while progressively opened hints contain the coding clues',()=>{
 for(const stage of ['sign','size','rule','route','keep'] as const){
  const repair=coachRepair(stage);assert.ok(repair);
  for(let lang=0;lang<3;lang++){assert.ok(repair.goal[lang]);assert.ok(repair.hints[0][lang]);assert.ok(repair.hints[1][lang]);}
 }
 assert.equal(coachRepair('trial'),null);
 assert.ok(!coachRepair('rule')!.goal.some(goal=>goal.includes('price * quantity')));
 assert.ok(!coachRepair('keep')!.goal.some(goal=>goal.includes('SAVE_ORDERS')));
});
