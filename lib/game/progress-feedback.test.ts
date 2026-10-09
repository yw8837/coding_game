import test from 'node:test';
import assert from 'node:assert/strict';
import {act,createGame,type GameState} from './engine.ts';
import {CAREER_JOBS} from './career-content.ts';
import {exampleSolution} from './career-evaluation.ts';
import {progressMoment} from './progress-feedback.ts';

function opened(){const s=createGame();s.completed=[0,1,2];s.mission=2;return act(s,{type:'celebrate-opening'});}
function solved(s:GameState,id:string){
 s=act(act(s,{type:'career-accept',id}),{type:'career-inspect',id});
 for(const [file,content] of Object.entries(exampleSolution(id)))s=act(s,{type:'career-edit',id,file,content});
 return s;
}
test('success feedback follows a real fresh test, not edits, failed checks or repeat clicks',()=>{
 let s=opened();const id='bakery-price';s=act(act(s,{type:'career-accept',id}),{type:'career-inspect',id});
 assert.equal(progressMoment(s,act(s,{type:'career-test',id})),null);
 const edited=solved(s,id);assert.equal(progressMoment(s,edited),null);
 const checked=act(edited,{type:'career-test',id});assert.equal(progressMoment(edited,checked)?.tier,'check');
 assert.equal(progressMoment(checked,act(checked,{type:'career-test',id})),null);
 assert.equal(progressMoment(checked,JSON.parse(JSON.stringify(checked))),null);
 const stale=act(checked,{type:'career-edit',id,file:'pricing.json',content:'{}'});assert.equal(progressMoment(checked,stale),null);
});
test('district unlock is larger than an ordinary delivery and optional deliveries never replay it',()=>{
 let s=opened();const jobs=CAREER_JOBS.filter(job=>job.act===1);
 for(const [index,job] of jobs.entries()){
  s=act(solved(s,job.id),{type:'career-test',id:job.id});
  const delivered=act(s,{type:'career-deliver',id:job.id,choice:'care'}),moment=progressMoment(s,delivered);
  assert.equal(moment?.tier,index===3?'milestone':'delivery');
  assert.equal(moment?.credits,job.credits);assert.equal(moment?.xp,job.xp);
  assert.equal(progressMoment(delivered,act(delivered,{type:'career-deliver',id:job.id,choice:'care'})),null);
  s=delivered;
 }
});
