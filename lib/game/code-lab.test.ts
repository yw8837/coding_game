import test from 'node:test';
import assert from 'node:assert/strict';
import {LAB_JOBS,evaluateLab,auditLab,validLabInput,type LabId} from './code-lab.ts';
import {createGame,act} from './engine.ts';
import {readSave,writeSave} from './save.ts';

test('every contract accepts real solutions across changing data and rejects starter bugs',()=>{
 for(const job of LAB_JOBS){
  for(const seed of [1,2,3,17,9999])assert.equal(evaluateLab(job.id,job.solution,seed)?.passed,true,job.id+' / '+seed);
  assert.notDeepEqual(job.cases(1),job.cases(2),job.id+' new data');
  assert.equal(evaluateLab(job.id,job.starter)?.passed,false,job.id);
  assert.equal(evaluateLab(job.id,job.mutant)?.passed,false,job.id+' mutant');
 }
 assert.equal(evaluateLab('sum','function solve(data) { return data.orders.reduce((sum, order) => sum + order.price * order.quantity, 0); }')?.passed,true);
 assert.equal(evaluateLab('catalog','function solve(data) { const result=[]; for(const row of data.items) { if(row.stock>0) result.push(row.name); } return result; }')?.passed,true);
});

test('audits require a valid counterexample for each actual program, not malformed input',()=>{
 const examples:Record<LabId,unknown>={receipt:{price:500,quantity:0},discount:{total:10000},stock:{quantity:0,stock:5},fallback:{fee:0},sum:{orders:[{price:500,quantity:2}]},catalog:{items:[{name:'tea',stock:0}]},dedupe:{names:['A','a']},report:{orders:[{paid:false,total:500}]},endpoint:{path:'/other',method:'POST'},retry:{requests:[{id:'a',amount:500},{id:'b',amount:100},{id:'a',amount:500}]},atomic:{stock:5,quantities:[2,-1]},cache:{now:10,ttl:5,fresh:'new',cache:{savedAt:5,value:'old'}}};
 for(const job of LAB_JOBS){
  assert.equal(auditLab(job.id,JSON.stringify(examples[job.id])).passed,true,job.id);
  assert.equal(auditLab(job.id,JSON.stringify(job.auditSample)).passed,false,job.id+' starter audit');
  assert.equal(auditLab(job.id,'[]').error,'input');
  assert.equal(auditLab(job.id,'invalid').error,'input');
 }
 assert.equal(validLabInput('stock',{quantity:1.5,stock:5}),false);
 assert.equal(validLabInput('sum',{orders:Array(31).fill({price:1,quantity:1})}),false);
});

test('lab progression rewards once, invalidates proofs, and persists without losing campaign state',()=>{
 let s=createGame();const base=s.credits,job=LAB_JOBS[0];
 s=act(s,{type:'lab-run',id:job.id});assert.equal(s.credits,base);
 s=act(s,{type:'lab-draft',id:job.id,source:job.solution});s=act(s,{type:'lab-run',id:job.id});
 assert.equal(s.credits,base+job.credits);
 s=act(s,{type:'lab-run',id:job.id});assert.equal(s.credits,base+job.credits);
 s=act(s,{type:'lab-audit-draft',id:job.id,input:JSON.stringify({price:500,quantity:0})});
 s=act(s,{type:'lab-audit',id:job.id});s=act(s,{type:'lab-audit',id:job.id});assert.equal(s.credits,base+job.credits+30);
 assert.equal(readSave(JSON.stringify(s)).gameplay.lab.proofs.receipt?.passed,true);
 let serialized='';writeSave({setItem:(_,v)=>{serialized=v;}},s);assert.equal(readSave(serialized).credits,s.credits);
 s=act(s,{type:'lab-new-data',id:job.id});assert.equal(s.gameplay.lab.proofs.receipt,undefined);assert.equal(s.gameplay.lab.seeds.receipt,2);
 s=act(s,{type:'lab-run',id:job.id});s=act(s,{type:'lab-draft',id:job.id,source:job.starter});assert.equal(s.gameplay.lab.proofs.receipt,undefined);
 assert.deepEqual(s.gameplay.lab.completed,['receipt']);assert.equal(s.accepted,false);assert.deepEqual(s.completed,[]);
});

test('old saves migrate and corrupt lab evidence is rejected before replacing a backup',()=>{
 const old=JSON.parse(JSON.stringify(createGame()));delete old.gameplay.lab;
 assert.deepEqual(readSave(JSON.stringify(old)).gameplay.lab.completed,[]);
 let s=act(createGame(),{type:'lab-draft',id:'receipt',source:LAB_JOBS[0].solution});s=act(s,{type:'lab-run',id:'receipt'});
 const corrupt=structuredClone(s);corrupt.gameplay.lab.drafts.receipt=LAB_JOBS[0].starter;assert.throws(()=>readSave(JSON.stringify(corrupt)),/stale/);
 const duplicate=structuredClone(s);duplicate.gameplay.lab.completed.push('receipt');assert.throws(()=>readSave(JSON.stringify(duplicate)),/progress/);
 const falseProof=structuredClone(s);falseProof.gameplay.lab.proofs.receipt!.cases[0].actual=999;assert.throws(()=>readSave(JSON.stringify(falseProof)),/case/);
 const tooLarge=act(s,{type:'lab-draft',id:'receipt',source:' '.repeat(12001)});assert.equal(tooLarge.gameplay.lab.drafts.receipt,LAB_JOBS[0].solution);
});
