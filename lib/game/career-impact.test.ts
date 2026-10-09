import test from 'node:test';
import assert from 'node:assert/strict';
import {act,createGame,type GameState} from './engine.ts';
import {CAREER_JOBS} from './career-content.ts';
import {evaluateCareer,exampleSolution} from './career-evaluation.ts';
import {careerImpact} from './career-impact.ts';
import {careerFiles,careerHash,careerRoot} from './career.ts';
import {readSave} from './save.ts';

function afterCafe():GameState {const state=createGame();state.completed=[0,1,2];state.gameplay.openingCelebrated=true;return state;}
function solve(state:GameState,id:string):GameState {
 state=act(state,{type:'career-accept',id});state=act(state,{type:'career-inspect',id});
 for(const [file,content] of Object.entries(exampleSolution(id)))state=act(state,{type:'career-edit',id,file,content});
 return act(state,{type:'career-test',id});
}
function deliver(state:GameState,id:string):GameState {return act(solve(state,id),{type:'career-deliver',id,choice:'care'});}

test('fresh impact shows actual changed output and separates originally matching checks',()=>{
 const state=solve(afterCafe(),'bakery-price'),model=careerImpact(state,'bakery-price')!;
 assert.equal(model.phase,'passed');assert.equal(model.hash,careerHash(careerFiles(state,'bakery-price')));
 assert.deepEqual(model.rows.map(row=>[row.label.en,row.before,row.after]),[
  ['6 rolls total','12600','10000'],['8 rolls total','16200','13600'],
  ['Rolls in one box','5','6'],['Price of one box','10800','10000'],
  ['Five singles below a full box','10800','9000'],['Ten rolls total','21600','17200']]);
 assert.equal(model.unchanged,3);assert.equal(model.additional,0);
 const before=JSON.stringify(state);careerImpact(state,'bakery-price');assert.equal(JSON.stringify(state),before);
});

test('failed, stale, unsaved, uninspected and unknown jobs never show a passing impact',()=>{
 let state=act(afterCafe(),{type:'career-accept',id:'bakery-price'});
 state=act(state,{type:'career-inspect',id:'bakery-price'});state=act(state,{type:'career-test',id:'bakery-price'});
 assert.equal(careerImpact(state,'bakery-price'),null);
 state=solve(state,'bakery-price');assert.equal(careerImpact(state,'bakery-price',true),null);
 assert.equal(careerImpact(state,'missing'),null);
 const uninspected=structuredClone(state);uninspected.gameplay.career.inspected=[];
 assert.equal(careerImpact(uninspected,'bakery-price'),null);
 state.machines.local.files[careerRoot('bakery-price')+'/pricing.json']+=' ';
 assert.equal(evaluateCareer('bakery-price',careerFiles(state,'bakery-price')).passed,true);
 assert.equal(careerImpact(state,'bakery-price'),null);
});

test('JavaScript added checks have no invented baseline and shared checks keep their own identity',()=>{
 let state=solve(afterCafe(),'bakery-price');state=act(state,{type:'career-code-mode',id:'bakery-price',mode:'javascript'});
 state=act(state,{type:'career-edit',id:'bakery-price',file:'solution.js',content:'function solve(input) { return Math.floor(input.quantity / 6) * 10000 + input.quantity % 6 * 1800; }'});
 state=act(state,{type:'career-test',id:'bakery-price'});
 const model=careerImpact(state,'bakery-price')!;
 assert.deepEqual(model.rows.map(row=>[row.label.en,row.before,row.after]),[['6 rolls total','12600','10000'],['8 rolls total','16200','13600']]);
 assert.equal(model.unchanged,3);assert.equal(model.additional,15);
});

test('recorded delivery and reload preserve the fixed reward without paying it again',()=>{
 const state=solve(afterCafe(),'bakery-price'),job=CAREER_JOBS.find(job=>job.id==='bakery-price')!;
 const delivered=act(state,{type:'career-deliver',id:job.id,choice:'care'});
 assert.equal(delivered.credits-state.credits,job.credits);assert.equal(delivered.xp-state.xp,job.xp);
 const loaded=readSave(JSON.stringify(delivered)),before=JSON.stringify(loaded),model=careerImpact(loaded,job.id)!;
 assert.equal(model.phase,'delivered');assert.equal(model.credits,job.credits);assert.equal(model.xp,job.xp);
 assert.equal(JSON.stringify(loaded),before);
 const repeated=act(loaded,{type:'career-deliver',id:job.id,choice:'craft'});
 assert.equal(repeated.credits,loaded.credits);assert.equal(repeated.xp,loaded.xp);
 assert.deepEqual(careerImpact(repeated,job.id),model);
});

test('four chosen jobs unlock the next district and optional jobs do not inflate route progress',()=>{
 let state=afterCafe();const first=CAREER_JOBS.filter(job=>job.act===1);
 for(const job of first.slice(0,3))state=deliver(state,job.id);
 let model=careerImpact(state,first[2].id)!;
 assert.equal(model.districtCompleted,3);assert.equal(model.districtTotal,6);assert.equal(model.nextDistrict,null);
 state=deliver(state,first[3].id);model=careerImpact(state,first[3].id)!;
 assert.equal(model.districtCompleted,4);assert.equal(model.districtTarget,4);assert.equal(model.nextDistrict,2);assert.equal(model.routeCompleted,4);
 state=deliver(state,first[4].id);model=careerImpact(state,first[4].id)!;
 assert.equal(model.districtCompleted,5);assert.equal(model.routeCompleted,4);assert.equal(model.releaseReady,false);
 for(const actNumber of [2,3])for(const job of CAREER_JOBS.filter(job=>job.act===actNumber).slice(0,actNumber===3?3:4))state=deliver(state,job.id);
 const final=CAREER_JOBS.filter(job=>job.act===3)[3];state=solve(state,final.id);
 assert.equal(careerImpact(state,final.id)!.releaseReady,false);assert.equal(careerImpact(state,final.id)!.routeCompleted,11);
 state=act(state,{type:'career-deliver',id:final.id,choice:'craft'});model=careerImpact(state,final.id)!;
 assert.equal(model.releaseReady,true);assert.equal(model.routeCompleted,12);assert.equal(model.districtCompleted,4);
});
