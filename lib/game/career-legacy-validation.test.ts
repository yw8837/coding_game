import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {act,createGame,type GameState} from './engine.ts';
import {CAREER_JOBS} from './career-content.ts';
import {careerFiles,careerHash,careerRoot} from './career.ts';
import {evaluateCareer,exampleSolution} from './career-evaluation.ts';
import {deliveredCareerValid} from './career-legacy-validation.ts';
import {readSave,writeSave,SAVE_KEY} from './save.ts';

type HistoricalFixture={name:string;credits:number;xp:number;career:GameState['gameplay']['career'];files:Record<string,string>;dirs:string[]};
const historical=JSON.parse(readFileSync(new URL('./fixtures/career-legacy-0.11.json',import.meta.url),'utf8')) as HistoricalFixture[];
function historicalSave(fixture:HistoricalFixture):string {
 const state=createGame();state.completed=[0,1,2];state.mission=2;state.gameplay.openingCelebrated=true;
 state.credits=fixture.credits;state.xp=fixture.xp;state.gameplay.career=structuredClone(fixture.career);
 Object.assign(state.machines.local.files,fixture.files);state.machines.local.dirs.push(...fixture.dirs);
 return JSON.stringify(state);
}
function roundtrip(state:GameState):GameState {
 let raw='';writeSave({setItem(key,value){assert.equal(key,SAVE_KEY);raw=value;}},state);
 const serialized=JSON.parse(raw);assert.equal(serialized.gameplay.career.rulesRevision,state.gameplay.career.rulesRevision);
 return readSave(raw);
}

test('new games record revision two and all missing historical revision fields default to one',()=>{
 const state=createGame();assert.equal(state.gameplay.career.rulesRevision,2);assert.equal(roundtrip(state).gameplay.career.rulesRevision,2);
 for(const scope of ['revision','career','gameplay']){
  const raw=JSON.parse(JSON.stringify(state));
  if(scope==='revision')delete raw.gameplay.career.rulesRevision;
  else if(scope==='career')delete raw.gameplay.career;
  else delete raw.gameplay;
  assert.equal(roundtrip(readSave(JSON.stringify(raw))).gameplay.career.rulesRevision,1);
 }
 for(const revision of [0,3,'1',null]){const raw=JSON.parse(JSON.stringify(state));raw.gameplay.career.rulesRevision=revision;assert.throws(()=>readSave(JSON.stringify(raw)));}
});

test('actual baseline delivered career snapshots retain files, replies, rewards, release and ending through read and write',()=>{
 for(const fixture of historical){
  const loaded=readSave(historicalSave(fixture));assert.equal(loaded.gameplay.career.rulesRevision,1);
  assert.deepEqual(loaded.gameplay.career,{...fixture.career,studio:null,rulesRevision:1,endingJobs:[],release:{...fixture.career.release,formatRevision:1}});
  assert.equal(loaded.credits,fixture.credits);assert.equal(loaded.xp,fixture.xp);
  for(const [path,content] of Object.entries(fixture.files))assert.equal(loaded.machines.local.files[path],content);
  assert.deepEqual(roundtrip(loaded),loaded);
  const before=structuredClone(loaded);let resumed=loaded;
  for(const id of loaded.gameplay.career.completed)resumed=act(resumed,{type:'career-deliver',id,choice:'care'});
  resumed=act(resumed,{type:'career-ending'});assert.deepEqual(resumed,before);
 }
 const normal=readSave(historicalSave(historical[2]));assert.equal(normal.gameplay.career.completed.length,18);assert.equal(normal.gameplay.career.ending,'community');assert.equal(normal.gameplay.career.release.published?.version,'1.0.0');
});

test('revision two delivered saves reject both baseline loopholes without overwriting storage',()=>{
 for(const fixture of historical.slice(0,2)){
  const raw=JSON.parse(historicalSave(fixture));raw.gameplay.career.rulesRevision=2;
  assert.throws(()=>readSave(JSON.stringify(raw)),/Delivered job files are missing or invalid/);
  let writes=0;assert.throws(()=>writeSave({setItem(){writes++;}},raw),/Delivered job files are missing or invalid/);assert.equal(writes,0);
 }
});

test('live tests and deliveries remain strict for new games and resumed revision-one saves, even with forged passing proofs',()=>{
 for(const revision of [1,2] as const)for(const fixture of historical.slice(0,2)){
  const id=fixture.career.completed[0];let state=createGame();state.completed=[0,1,2];state.gameplay.openingCelebrated=true;
  state.gameplay.career.rulesRevision=revision;state=roundtrip(state);
  state=act(state,{type:'career-accept',id});state=act(state,{type:'career-inspect',id});
  for(const file of Object.keys(CAREER_JOBS.find(job=>job.id===id)!.files))state=act(state,{type:'career-edit',id,file,content:fixture.files[careerRoot(id)+'/'+file]});
  state=act(state,{type:'career-test',id});assert.equal(state.gameplay.career.proofs[id].passed,false);
  state.gameplay.career.proofs[id]={hash:careerHash(careerFiles(state,id)),passed:true};
  const credits=state.credits,xp=state.xp;state=act(state,{type:'career-deliver',id,choice:'care'});
  assert.deepEqual(state.gameplay.career.completed,[]);assert.equal(state.credits,credits);assert.equal(state.xp,xp);assert.deepEqual(roundtrip(state).gameplay.career.completed,[]);
 }
});

test('legacy validation is restricted to former accepted bounded sources and the two changed jobs',()=>{
 for(const job of CAREER_JOBS){assert.equal(deliveredCareerValid(job.id,exampleSolution(job.id),1),true);assert.equal(deliveredCareerValid(job.id,job.files,1),false);}
 for(const fixture of historical.slice(0,2)){
  const id=fixture.career.completed[0],state=readSave(historicalSave(fixture)),files=careerFiles(state,id);
  assert.equal(evaluateCareer(id,files).passed,false);assert.equal(deliveredCareerValid(id,files,1),true);assert.equal(deliveredCareerValid(id,files,2),false);
  const file=Object.keys(files)[0];assert.equal(deliveredCareerValid(id,{},1),false);assert.equal(deliveredCareerValid(id,{...files,[file]:'x'.repeat(20001)},1),false);
 }
 const clinic=exampleSolution('clinic-form');clinic['booking.html']='<script>alert(1)</script>'+clinic['booking.html'];assert.equal(deliveredCareerValid('clinic-form',clinic,1),false);
});
