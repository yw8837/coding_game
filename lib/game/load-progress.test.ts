import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from './engine.ts';
import {loadProgress} from './load-progress.ts';
import {codeCompletions} from './input-tools.ts';
import {CAREER_JOBS} from './career-content.ts';
import {readSave} from './save.ts';
import {act} from './engine.ts';
import {careerHash} from './career.ts';
import {currentTask} from './workflow.ts';
test('incomplete fabricated deliveries are rejected and forged proof cannot produce delivery guidance',()=>{
 const broken=createGame(),ids=CAREER_JOBS.map(j=>j.id);
 broken.gameplay.career.accepted=ids;broken.gameplay.career.completed=ids;broken.gameplay.career.ending='community';
 assert.throws(()=>readSave(JSON.stringify(broken)));
 broken.gameplay.openingCelebrated=true;broken.completed=[0,1,2];broken.gameplay.career.inspected=ids;broken.gameplay.career.choices=Object.fromEntries(ids.map(id=>[id,'care']));
 assert.throws(()=>readSave(JSON.stringify(broken)),'Delivered records require valid files');
 let state=createGame();state.gameplay.openingCelebrated=true;state.completed=[0,1,2];
 state=act(state,{type:'career-accept',id:ids[0]});state=act(state,{type:'career-inspect',id:ids[0]});
 state.gameplay.career.proofs[ids[0]]={hash:careerHash(CAREER_JOBS[0].files),passed:true};
 assert.equal(currentTask(state).id,'career-edit');
});
test('missing save starts fresh but corrupt data must not silently become a new game',async()=>{
 assert.equal((await loadProgress({raw:null,recovered:false})).state,null);
 await assert.rejects(()=>loadProgress({raw:null,recovered:false,error:'damaged'}));
 await assert.rejects(()=>loadProgress({raw:'{}',recovered:false}));
});
test('a native save rejected by the full game schema recovers from its prior valid backup',async()=>{
 const prior=createGame();prior.credits=230;
 const result=await loadProgress({raw:JSON.stringify({version:1,machines:{local:{},server:{}},gameplay:{},completed:[],mission:0}),recovered:false},async()=>({raw:JSON.stringify(prior),recovered:true}));
 assert.equal(result.recovered,true);assert.equal(result.state?.credits,230);
 await assert.rejects(()=>loadProgress({raw:'bad',recovered:false},async()=>({raw:'{}',recovered:true})));
});
test('JSON completion supplies boolean values and existing keys without adding code or punctuation',()=>{
 const source='{ "enabled": tr';
 assert.deepEqual(codeCompletions('settings.json',source,source.length).map(x=>x.text),['true']);
 const keys='{ "enabled": false, "en';
 const completion=codeCompletions('settings.json',keys,keys.length)[0];
 assert.equal(completion.text,'enabled');assert.equal(keys.slice(completion.start,completion.end),'en');
 assert.deepEqual(codeCompletions('settings.json','{ "x": invalid',14),[]);
});
