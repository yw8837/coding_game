import test from 'node:test';
import assert from 'node:assert/strict';
import {assist} from './assisted.ts';
import {createGame,act,sourceHash,projectFiles} from './engine.ts';
import {lessonFacts,resumeLesson,LESSONS} from './lesson.ts';
import {PRACTICE_CUSTOMERS} from './customers.ts';
import {readSave} from './save.ts';
import {translate} from './translations.ts';
import {gameMessages} from './gameplay.ts';

test('guided repair resumes the first unfinished step and rejects stale or incomplete evidence',()=>{
 let s=assist(createGame(),'prepare');
 assert.equal(resumeLesson(s),'sign');
 assert.deepEqual(gameMessages(s).map(m=>m.id),['welcome']);
 s=assist(s,'title-cafe');assert.equal(resumeLesson(readSave(JSON.stringify(s))),'size');
 s=assist(s,'width-fit');assert.equal(resumeLesson(s),'trial');
 s=act(s,{type:'test-result',hash:sourceHash(projectFiles(s)),checks:[{name:'incomplete',passed:true}]});
 assert.equal(lessonFacts(s).trial,false);
 s=act(s,{type:'test-result',hash:sourceHash(projectFiles(s)),checks:[0,1,2].map(i=>({name:String(i),passed:true}))});
 assert.equal(resumeLesson(s),'deliver');
 s=assist(s,'width-wide');assert.equal(resumeLesson(s),'size');assert.equal(lessonFacts(s).trial,false);
});
test('serving is persistent, checks the real rule and amount, and ignores repeated guest IDs',()=>{
 let s=assist(createGame(),'prepare');s.mission=1;s.completed=[0];
 s=assist(s,'add');const credits=s.credits;
 assert.equal(resumeLesson(s),'rule');
 s=act(s,{type:'serve-customer',customer:0,quantity:2});assert.equal(s.gameplay.servedCustomers,0);
 s=assist(s,'multiply');assert.equal(resumeLesson(s),'serve');
 s=act(s,{type:'serve-customer',customer:0,quantity:1});assert.equal(s.gameplay.servedCustomers,0);assert.equal(s.credits,credits);
 for(const [i,customer] of PRACTICE_CUSTOMERS.entries()){
  s=act(s,{type:'serve-customer',customer:i,quantity:customer.quantity});assert.equal(s.gameplay.servedCustomers,i+1);
  s=readSave(JSON.stringify(s));
  s=act(s,{type:'serve-customer',customer:i,quantity:customer.quantity});assert.equal(s.gameplay.servedCustomers,i+1);
 }
 assert.equal(resumeLesson(s),'trial');assert.equal(s.credits,credits);
 const old=JSON.parse(JSON.stringify(s));delete old.gameplay.servedCustomers;assert.equal(readSave(JSON.stringify(old)).gameplay.servedCustomers,0);
 const fresh=createGame();assert.equal(act(fresh,{type:'serve-customer',customer:0,quantity:2}).gameplay.servedCustomers,0);
});
test('all guided lesson instructions and guest requests have English and Japanese versions',()=>{
 const strings=Object.values(LESSONS).flatMap(l=>[l.label,l.title,l.request,l.hint,l.success,l.retry,...l.choices.flatMap(c=>[c.label,c.note])]).filter(s=>s&&/[가-힣]/.test(s));
 strings.push(...PRACTICE_CUSTOMERS.map(c=>c.request));
 for(const language of ['en','ja'] as const)for(const value of strings)assert.notEqual(translate(value,language),value,language+': '+value);
});
