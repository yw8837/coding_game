import test from 'node:test';
import assert from 'node:assert/strict';
import {act,createGame} from './engine.ts';
import {readSave} from './save.ts';
import {PRACTICE_JOBS,evaluatePractice,validatePracticeAnswer} from './practice.ts';

const answers={total:'price * quantity',discount:'total >= 10000',stock:'stock >= requested',delivery:'distance * 500',route:'/api/menu',width:'100%'};

test('six authored jobs evaluate their input/output cases and show concrete wrong-answer evidence',()=>{
 assert.equal(PRACTICE_JOBS.length,6);
 for(const job of PRACTICE_JOBS){
  const wrong=evaluatePractice(job.id,job.initial);
  assert.equal(wrong.passed,false,job.id);
  assert.ok(wrong.cases.some(c=>!c.passed&&c.actual!==c.expected),job.id);
  const proof=evaluatePractice(job.id,answers[job.id]);
  assert.equal(proof.passed,true,job.id);
  assert.ok(proof.cases.length>=3);
 }
});

test('a boundary operator that passes ordinary orders fails the exact discount boundary',()=>{
 const proof=evaluatePractice('discount','total > 10000');
 const failure=proof.cases.find(c=>!c.passed)!;
 assert.deepEqual(failure.input,{total:10000});
 assert.equal(failure.expected,true);assert.equal(failure.actual,false);
});

test('restricted grammar rejects executable code and does not evaluate user JavaScript',()=>{
 for(const answer of ['price * quantity; globalThis.alert(1)','price ** quantity','price / 0','eval("2")','price + quantity + 1','x'.repeat(81)]){
  assert.equal(validatePracticeAnswer('total',answer).valid,false,answer);
  assert.equal(evaluatePractice('total',answer).error,'syntax');
 }
 assert.equal(evaluatePractice('unknown','anything').error,'unknown');
 assert.equal(validatePracticeAnswer('route','/api/menu?x=1').valid,false);
});

test('first correct submission pays once, failed/replayed submissions cannot farm rewards across saves',()=>{
 let s=createGame();
 s=act(s,{type:'practice-submit',id:'total',answer:'price + quantity'});
 assert.equal(s.credits,120);assert.equal(s.xp,0);
 assert.equal(s.gameplay.practice.results.total?.passed,false);
 s=act(s,{type:'practice-submit',id:'total',answer:answers.total});
 const job=PRACTICE_JOBS.find(j=>j.id==='total')!;
 assert.equal(s.credits,120+job.credits);assert.equal(s.xp,job.xp);
 assert.deepEqual(s.gameplay.practice.completed,['total']);
 s=readSave(JSON.stringify(s));
 s=act(s,{type:'practice-submit',id:'total',answer:answers.total});
 s=act(s,{type:'practice-submit',id:'total',answer:'price - quantity'});
 assert.equal(s.credits,120+job.credits);assert.equal(s.xp,job.xp);
 assert.deepEqual(s.gameplay.practice.completed,['total']);
 assert.equal(s.gameplay.practice.results.total?.passed,false);
 assert.equal(s.gameplay.practice.drafts.total,'price - quantity');
});

test('practice drafts persist independently and editing invalidates the shown proof without deleting completion',()=>{
 let s=act(createGame(),{type:'practice-submit',id:'stock',answer:answers.stock});
 s=act(s,{type:'practice-draft',id:'stock',answer:'stock > requested'});
 s=readSave(JSON.stringify(s));
 assert.equal(s.gameplay.practice.drafts.stock,'stock > requested');
 assert.equal(s.gameplay.practice.results.stock,undefined);
 assert.ok(s.gameplay.practice.completed.includes('stock'));
 const credits=s.credits;
 s=act(s,{type:'practice-submit',id:'bad-id',answer:'anything'});
 assert.equal(s.credits,credits);
 s=act(s,{type:'practice-draft',id:'total',answer:'x'.repeat(81)});
 assert.equal(s.gameplay.practice.drafts.total,undefined);
});

test('saves without practice fields gain defaults while keeping earned campaign progress',()=>{
 const original=createGame();original.credits=470;original.xp=120;original.completed=[0];
 const old=JSON.parse(JSON.stringify(original));delete old.gameplay.practice;
 const s=readSave(JSON.stringify(old));
 assert.deepEqual(s.gameplay.practice,{completed:[],drafts:{},results:{}});
 assert.equal(s.credits,470);assert.equal(s.xp,120);assert.deepEqual(s.completed,[0]);
});

test('all optional jobs pay only their authored reward while leaving the campaign untouched',()=>{
 let s=createGame();
 for(const job of PRACTICE_JOBS)s=act(s,{type:'practice-submit',id:job.id,answer:answers[job.id]});
 const expectedCredits=120+PRACTICE_JOBS.reduce((sum,job)=>sum+job.credits,0);
 const expectedXP=PRACTICE_JOBS.reduce((sum,job)=>sum+job.xp,0);
 assert.equal(s.credits,expectedCredits);assert.equal(s.xp,expectedXP);
 assert.equal(s.gameplay.practice.completed.length,6);
 assert.equal(s.accepted,false);assert.equal(s.mission,0);assert.deepEqual(s.completed,[]);assert.equal(s.repo,null);
 s=readSave(JSON.stringify(s));
 for(const job of PRACTICE_JOBS)s=act(s,{type:'practice-submit',id:job.id,answer:answers[job.id]});
 assert.equal(s.credits,expectedCredits);assert.equal(s.xp,expectedXP);
});

test('width and route cases evaluate the entered rule rather than looking up a canned result',()=>{
 const width=evaluatePractice('width','50%');
 assert.deepEqual(width.cases.map(c=>c.actual),[180,384,512]);
 const route=evaluatePractice('route','/api/orders');
 assert.deepEqual(route.cases.map(c=>c.actual),[404,404,200]);
 const division=evaluatePractice('total','price / quantity');
 assert.equal(division.cases[1].actual,'undefined');
 assert.equal(division.passed,false);
});

test('each authored goal, syntax guide, consequence and input label has ko/en/ja copy',()=>{
 for(const job of PRACTICE_JOBS)for(const copy of [job.title,job.goal,job.guide,job.consequence,...Object.values(job.variables)]){
  for(const language of ['ko','en','ja'] as const)assert.ok(copy[language].trim().length>0,`${job.id}: ${language}`);
 }
});
