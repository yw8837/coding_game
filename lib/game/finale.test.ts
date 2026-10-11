import test from 'node:test';
import assert from 'node:assert/strict';
import {act,createGame,type GameState} from './engine.ts';
import {CAREER_JOBS} from './career-content.ts';
import {exampleSolution} from './career-evaluation.ts';
import {RELEASE_EXAMPLE} from './release.ts';
import {readSave,writeSave} from './save.ts';
import {FINALE_COPY,FINALE_BRANCHES,finaleUnlocked,exportAllowed} from './finale.ts';
import {earnedAchievements} from './achievements.ts';
import {curriculum} from './curriculum.ts';

const memory=()=>{let value='';return {setItem:(_:string,next:string)=>{value=next;},get value(){return value;}};};
function published():GameState{
 let s=createGame();s.completed=[0,1,2];s.mission=2;s=act(s,{type:'celebrate-opening'});
 for(const job of CAREER_JOBS){s=act(s,{type:'career-accept',id:job.id});s=act(s,{type:'career-inspect',id:job.id});for(const [file,content] of Object.entries(exampleSolution(job.id)))s=act(s,{type:'career-edit',id:job.id,file,content});s=act(s,{type:'career-test',id:job.id});s=act(s,{type:'career-deliver',id:job.id,choice:'care'});}
 s=act(s,{type:'career-release-start'});for(const [file,content] of Object.entries(RELEASE_EXAMPLE))s=act(s,{type:'career-release-edit',file,content});
 return act(act(act(s,{type:'career-release-test'}),{type:'career-release-build'}),{type:'career-release-publish'});
}

test('the ending branch opens only after 1.0.0 is published',()=>{
 const before=createGame();assert.equal(finaleUnlocked(before),false);
 assert.equal(act(before,{type:'finale-choose',branch:'web'}).gameplay.finale.branch,null);
 const s=published();assert.equal(finaleUnlocked(s),true);
 assert.equal(curriculum(s).find(stage=>stage.id==='finale')!.done,1);
});

test('choosing a branch gates which exports it records, and switching is allowed',()=>{
 let s=published();
 s=act(s,{type:'finale-export',kind:'web'});assert.deepEqual(s.gameplay.finale.exports,[],'no branch yet');
 s=act(s,{type:'finale-choose',branch:'web'});s=act(s,{type:'finale-export',kind:'pwa'});assert.deepEqual(s.gameplay.finale.exports,[]);
 s=act(s,{type:'finale-export',kind:'web'});s=act(s,{type:'finale-export',kind:'web'});assert.deepEqual(s.gameplay.finale.exports,['web']);
 s=act(s,{type:'finale-choose',branch:'webapp'});s=act(s,{type:'finale-export',kind:'pwa'});s=act(s,{type:'finale-export',kind:'webapp'});
 assert.equal(s.gameplay.finale.branch,'webapp');assert.deepEqual(s.gameplay.finale.exports,['web','pwa','webapp']);
 s=act(s,{type:'finale-choose',branch:'desktop' as 'web'});assert.equal(s.gameplay.finale.branch,'webapp');
 assert.equal(exportAllowed(null,'web'),false);assert.equal(exportAllowed('web','webapp'),false);assert.equal(exportAllowed('webapp','pwa'),true);
 assert.ok(earnedAchievements(s).includes('ship-it'));assert.equal(earnedAchievements(s).includes('fullstack-creator'),false,'Python/SQL still required');
 assert.equal(curriculum(s).find(stage=>stage.id==='finale')!.status,'done');
 const storage=memory();writeSave(storage,s);assert.deepEqual(readSave(storage.value).gameplay.finale,{branch:'webapp',exports:['web','pwa','webapp']});
 assert.equal(act(s,{type:'finale-choose',branch:'web'},'demo').gameplay.finale.branch,'webapp','demo cannot change the finale');
});

test('both branches have complete localized copy',()=>{
 for(const branch of FINALE_BRANCHES){const copy=FINALE_COPY[branch];for(const lang of ['ko','en','ja'] as const)for(const text of [copy.label,copy.title,copy.pitch,...copy.features,...copy.epilogue])assert.ok(text[lang].trim(),branch);}
});
