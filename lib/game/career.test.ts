import test from 'node:test';
import assert from 'node:assert/strict';
import {act,createGame,runCommand,type GameState} from './engine.ts';
import {CAREER_JOBS} from './career-content.ts';
import {exampleSolution} from './career-evaluation.ts';
import {careerFiles,careerFresh,careerRoot,careerUnlocked,createCareer} from './career.ts';
import {readSave} from './save.ts';
import {RELEASE_EXAMPLE} from './release.ts';

// A completed-cafe fixture isolates follow-up contracts from the separately tested cafe route.
function afterCafe():GameState {const s=createGame();s.completed=[0,1,2];s.mission=2;s.credits=1720;s.xp=560;return act(s,{type:'celebrate-opening'});}
function solve(s:GameState,id:string):GameState {
 s=act(s,{type:'career-accept',id});s=act(s,{type:'career-inspect',id});
 for(const [file,content] of Object.entries(exampleSolution(id)))s=act(s,{type:'career-edit',id,file,content});
 return act(s,{type:'career-test',id});
}
function deliver(s:GameState,id:string,choice='care'):GameState{return act(solve(s,id),{type:'career-deliver',id,choice});}
function finish(careCount:number):GameState {let s=afterCafe();CAREER_JOBS.forEach((job,index)=>{s=deliver(s,job.id,index<careCount?'care':'craft');});return s;}

test('follow-up actions stay locked before cafe OPEN and later acts require four chosen commissions per earlier district',()=>{
 let s=createGame();const original=JSON.stringify(s.machines.local.files);
 for(const job of CAREER_JOBS)s=act(s,{type:'career-accept',id:job.id});
 s=act(s,{type:'career-upgrade',id:'recovery-kit'});s=act(s,{type:'career-ending'});
 assert.deepEqual(s.gameplay.career,createCareer());assert.equal(JSON.stringify(s.machines.local.files),original);assert.equal(s.credits,120);
 s=afterCafe();const second=CAREER_JOBS.find(j=>j.act===2)!;
 assert.equal(careerUnlocked(s,second),false);s=act(s,{type:'career-accept',id:second.id});assert.equal(s.gameplay.career.active,null);
 for(const job of CAREER_JOBS.filter(j=>j.act===1).slice(0,3))s=deliver(s,job.id);
 assert.equal(careerUnlocked(s,second),false);
 s=deliver(s,CAREER_JOBS.filter(j=>j.act===1)[3].id);
 assert.equal(careerUnlocked(s,second),true);
 assert.equal(careerUnlocked(s,CAREER_JOBS.find(j=>j.act===3)!),false);
});

test('eighteen commissions pay once across reload while cafe progress stays completed',()=>{
 let s=afterCafe();
 for(const job of CAREER_JOBS){s=deliver(s,job.id);s=readSave(JSON.stringify(s));}
 assert.equal(s.credits,8320);assert.equal(s.xp,3020);assert.equal(s.gameplay.career.completed.length,18);
 assert.deepEqual(s.completed,[0,1,2]);assert.equal(s.gameplay.openingCelebrated,true);
 for(const job of CAREER_JOBS){s=act(s,{type:'career-accept',id:job.id});s=act(s,{type:'career-deliver',id:job.id,choice:'craft'});}
 assert.equal(s.credits,8320);assert.equal(s.xp,3020);assert.ok(Object.values(s.gameplay.career.choices).every(v=>v==='care'));
});

test('delivery requires inspection, a fresh passed proof and a valid customer reply',()=>{
 const id='bakery-price';let s=act(afterCafe(),{type:'career-accept',id});
 for(const [file,content] of Object.entries(exampleSolution(id)))s=act(s,{type:'career-edit',id,file,content});
 s=act(s,{type:'career-test',id});s=act(s,{type:'career-deliver',id,choice:'care'});
 assert.deepEqual(s.gameplay.career.completed,[]);
 s=act(s,{type:'career-inspect',id});s=act(s,{type:'career-deliver',id,choice:'unknown'});
 assert.deepEqual(s.gameplay.career.completed,[]);
 s=act(s,{type:'career-edit',id,file:'pricing.json',content:exampleSolution(id)['pricing.json']+' '});
 assert.equal(careerFresh(s,id),false);s=act(s,{type:'career-deliver',id,choice:'care'});assert.equal(s.credits,1720);
 s=act(s,{type:'career-test',id});s=act(s,{type:'career-deliver',id,choice:'care'});assert.equal(s.credits,1920);
});

test('terminal overwrite and rename share canonical career files and invalidate proof freshness',()=>{
 const id='bakery-price';let s=solve(afterCafe(),id);assert.equal(careerFresh(s,id),true);
 s.machines.local.files['/home/dev/wrong.json']=CAREER_JOBS[0].files['pricing.json'];
 const overwritten=runCommand(s,`cp /home/dev/wrong.json ${careerRoot(id)}/pricing.json`);assert.equal(overwritten.error,false);s=overwritten.state;
 assert.equal(careerFiles(s,id)['pricing.json'],CAREER_JOBS[0].files['pricing.json']);assert.equal(careerFresh(s,id),false);
 s=act(s,{type:'career-deliver',id,choice:'care'});assert.equal(s.credits,1720);
 s=act(s,{type:'career-test',id});assert.equal(s.gameplay.career.proofs[id].passed,false);
 s=solve(s,id);const renamed=runCommand(s,`mv ${careerRoot(id)}/pricing.json /home/dev/moved.json`);assert.equal(renamed.error,false);s=renamed.state;
 assert.equal(careerFresh(s,id),false);s=act(s,{type:'career-test',id});assert.equal(s.gameplay.career.proofs[id].passed,false);
 s=act(s,{type:'career-deliver',id,choice:'craft'});assert.equal(s.credits,1720);
});

test('reaccepting preserves edits and invalid paths or oversized career edits change nothing',()=>{
 const id='bakery-price';let s=act(afterCafe(),{type:'career-accept',id});const solution=exampleSolution(id)['pricing.json'];
 s=act(s,{type:'career-edit',id,file:'pricing.json',content:solution});s=act(s,{type:'career-accept',id});assert.equal(careerFiles(s,id)['pricing.json'],solution);
 const before={...s.machines.local.files};s=act(s,{type:'career-edit',id,file:'../../escape.json',content:'{}'});s=act(s,{type:'career-edit',id,file:'pricing.json',content:'x'.repeat(20001)});
 assert.deepEqual(s.machines.local.files,before);
});

test('ending selection uses completed reply styles and stays fixed without a repeat reward',()=>{
 const incomplete=act(afterCafe(),{type:'career-ending'});assert.equal(incomplete.gameplay.career.ending,null);
 for(const [count,want] of [[12,'community'],[6,'studio'],[9,'balanced']] as const){
  let s=finish(count);const credits=s.credits,xp=s.xp;s=act(s,{type:'career-ending'});assert.equal(s.gameplay.career.ending,null);
  s=act(s,{type:'career-release-start'});for(const [file,content] of Object.entries(RELEASE_EXAMPLE))s=act(s,{type:'career-release-edit',file,content});s=act(s,{type:'career-release-test'});s=act(s,{type:'career-release-build'});s=act(s,{type:'career-release-publish'});s=act(s,{type:'career-ending'});assert.equal(s.gameplay.career.ending,want);
  s=readSave(JSON.stringify(s));s=act(s,{type:'career-ending'});assert.equal(s.gameplay.career.ending,want);assert.equal(s.credits,credits);assert.equal(s.xp,xp);
 }
});

test('upgrades reject insufficient funds and checkpoint restoration needs a new proof',()=>{
 let poor=afterCafe();poor.credits=249;poor=act(poor,{type:'career-upgrade',id:'recovery-kit'});assert.equal(poor.credits,249);assert.deepEqual(poor.gameplay.career.upgrades,[]);
 const id='bakery-price';let s=solve(afterCafe(),id);s=act(s,{type:'career-checkpoint',id});assert.equal(s.gameplay.career.checkpoints[id],undefined);
 s=act(s,{type:'career-upgrade',id:'recovery-kit'});assert.equal(s.credits,1470);s=act(s,{type:'career-upgrade',id:'recovery-kit'});assert.equal(s.credits,1470);
 s=act(s,{type:'career-checkpoint',id});const checkpoint=careerFiles(s,id);s=readSave(JSON.stringify(s));
 s=act(s,{type:'career-edit',id,file:'pricing.json',content:'broken'});s=act(s,{type:'career-restore',id});assert.deepEqual(careerFiles(s,id),checkpoint);assert.equal(careerFresh(s,id),false);
 s=act(s,{type:'career-deliver',id,choice:'care'});assert.equal(s.credits,1470);s=act(s,{type:'career-test',id});s=act(s,{type:'career-deliver',id,choice:'care'});assert.equal(s.credits,1670);
});

test('old saves gain empty career progress while invalid replies, duplicates and premature endings fail schema',()=>{
 const original=afterCafe();const old=JSON.parse(JSON.stringify(original));delete old.gameplay.career;
 const restored=readSave(JSON.stringify(old));assert.deepEqual(restored.gameplay.career,{...createCareer(),rulesRevision:1});assert.equal(restored.credits,1720);assert.deepEqual(restored.completed,[0,1,2]);
 const good=deliver(original,'bakery-price');assert.equal(readSave(JSON.stringify(good)).gameplay.career.completed[0],'bakery-price');
 for(const mutate of [
  (c:GameState['gameplay']['career'])=>{c.choices['bakery-price']='invalid';},
  (c:GameState['gameplay']['career'])=>{c.completed.push('bakery-price');},
  (c:GameState['gameplay']['career'])=>{c.ending='community';},
  (c:GameState['gameplay']['career'])=>{c.checkpoints['bakery-price']={'../../escape':'{}'};},
 ]){const bad=JSON.parse(JSON.stringify(good));mutate(bad.gameplay.career);assert.throws(()=>readSave(JSON.stringify(bad)));}
});
