import test from 'node:test';
import assert from 'node:assert/strict';
import {CAREER_JOBS} from './career-content.ts';
import {careerActCount,careerRouteCount,careerRouteReady,careerPriorActsReady,careerEndingFor} from './career-progress.ts';
import {act,createGame,type GameState} from './engine.ts';
import {careerNext} from './career.ts';
import {exampleSolution} from './career-evaluation.ts';
import {RELEASE_EXAMPLE,releaseUnlocked} from './release.ts';
import {readSave} from './save.ts';
import {currentTask} from './workflow.ts';

function opened(){const s=createGame();s.completed=[0,1,2];s.mission=2;return act(s,{type:'celebrate-opening'});}
function deliver(s:GameState,id:string,choice='care'){
 s=act(act(s,{type:'career-accept',id}),{type:'career-inspect',id});
 for(const [file,content] of Object.entries(exampleSolution(id)))s=act(s,{type:'career-edit',id,file,content});
 return act(act(s,{type:'career-test',id}),{type:'career-deliver',id,choice});
}
test('any four distinct contracts per district advance; extra early contracts cannot skip another district',()=>{
 const selected=CAREER_JOBS.filter((_,index)=>index%6>=2).map(job=>job.id);
 assert.equal(careerRouteReady(selected),true);assert.equal(careerRouteCount(selected),12);
 assert.equal(careerActCount([...selected,...selected],1),4);
 assert.equal(careerPriorActsReady(selected.filter(id=>CAREER_JOBS.find(j=>j.id===id)!.act!==2),3),false);
 const wrong=CAREER_JOBS.filter((_,index)=>index<12).map(job=>job.id);
 assert.equal(careerRouteReady(wrong),false);assert.equal(careerRouteCount(wrong),8);
});
test('a chosen 12-contract route publishes, saves, and keeps its ending when optional work is completed later',()=>{
 let s=opened();const selected=CAREER_JOBS.filter((_,index)=>index%6<4);
 for(const [index,job] of selected.entries())s=readSave(JSON.stringify(deliver(s,job.id,index<8?'care':'craft')));
 assert.equal(s.gameplay.career.completed.length,12);assert.equal(releaseUnlocked(s),true);
 assert.equal(currentTask(s).id,'release-start');
 s=act(s,{type:'career-release-start'});
 for(const [file,content] of Object.entries(RELEASE_EXAMPLE))s=act(s,{type:'career-release-edit',file,content});
 for(const type of ['career-release-test','career-release-build','career-release-publish','career-ending'] as const)s=act(s,{type});
 assert.equal(s.gameplay.career.ending,'community');assert.equal(s.gameplay.career.endingJobs.length,12);
 const premature=structuredClone(s);premature.gameplay.career.release={formatRevision:2,started:false,proof:null,build:null,published:null};assert.throws(()=>readSave(JSON.stringify(premature)));
 const frozen=[...s.gameplay.career.endingJobs];
 for(const job of CAREER_JOBS.filter(job=>!selected.includes(job))){
  s=act(s,{type:'career-accept',id:job.id});assert.equal(currentTask(s).id,'career-inspect');
  s=readSave(JSON.stringify(deliver(s,job.id,'craft')));
 }
 assert.equal(careerEndingFor(s.gameplay.career.completed,s.gameplay.career.choices),'balanced');
 assert.equal(s.gameplay.career.ending,'community');assert.deepEqual(s.gameplay.career.endingJobs,frozen);
 assert.equal(s.gameplay.career.completed.length,18);
});
test('next suggestion advances to the next unlocked district without hiding earlier optional jobs',()=>{
 let s=opened();for(const job of CAREER_JOBS.slice(0,4))s=deliver(s,job.id);
 assert.equal(careerNext(s)?.act,2);
 const optional=CAREER_JOBS[5];s=act(s,{type:'career-accept',id:optional.id});
 assert.equal(s.gameplay.career.active,optional.id);
});
