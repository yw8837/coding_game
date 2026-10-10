import test from 'node:test';
import assert from 'node:assert/strict';
import {act,createGame,type GameState} from './engine.ts';
import {CAREER_JOBS} from './career-content.ts';
import {careerFiles,careerRoot} from './career.ts';
import {evaluateCareer,exampleSolution} from './career-evaluation.ts';
import {careerPortfolio} from './career-portfolio.ts';
import {readSave} from './save.ts';
import {CAREER_CODE_FILE,CAREER_CODE_MODE_FILE} from './career-code.ts';
import {RELEASE_EXAMPLE} from './release.ts';

function opened():GameState{const state=createGame();state.completed=[0,1,2];state.mission=2;return act(state,{type:'celebrate-opening'});}
function delivered(state:GameState,id:string,choice='care'){
 state=act(state,{type:'career-accept',id});state=act(state,{type:'career-inspect',id});
 for(const [file,content] of Object.entries(exampleSolution(id)))state=act(state,{type:'career-edit',id,file,content});
 state=act(state,{type:'career-test',id});return act(state,{type:'career-deliver',id,choice});
}

test('empty portfolio offers real unlocked work and reading a portfolio has no progress or reward side effect',()=>{
 const state=opened(),before=JSON.stringify(state),model=careerPortfolio(state);
 assert.equal(model.entries.length,0);assert.equal(model.creditsReceived,0);assert.equal(model.xpReceived,0);
 assert.deepEqual(model.available.map(job=>job.id),CAREER_JOBS.filter(job=>job.act===1).map(job=>job.id));assert.equal(model.locked,12);
 assert.equal(JSON.stringify(state),before);
});

test('delivered portfolio survives save reload with chosen client reaction and actual original/current outputs',()=>{
 let state=delivered(opened(),'bakery-price','craft');state=readSave(JSON.stringify(state));
 const before=JSON.stringify(state),model=careerPortfolio(state),entry=model.entries[0],job=CAREER_JOBS[0];
 assert.equal(entry.job.id,'bakery-price');assert.equal(entry.reply?.id,'craft');assert.equal(entry.reply?.reply.ko,job.choices.find(choice=>choice.id==='craft')!.reply.ko);
 assert.equal(entry.deliveryFilesIntact,true);assert.deepEqual(entry.files,['pricing.json']);
 const original=evaluateCareer(job.id,job.files),current=evaluateCareer(job.id,careerFiles(state,job.id));
 for(const row of entry.impact!.rows){assert.equal(row.before,original.checks.find(check=>check.name.en===row.label.en)!.actual);assert.equal(row.after,current.checks.find(check=>check.name.en===row.label.en)!.actual);}
 assert.equal(model.creditsReceived,job.credits);assert.equal(model.xpReceived,job.xp);assert.ok(!model.available.some(job=>job.id===entry.job.id));
 careerPortfolio(state);assert.equal(JSON.stringify(state),before);
 const credits=state.credits,xp=state.xp;state=act(state,{type:'career-deliver',id:job.id,choice:'care'});assert.equal(state.credits,credits);assert.equal(state.xp,xp);
});

test('four delivered choices unlock unfinished work even after an ending; completed items never appear as opportunities',()=>{
 let state=opened();for(const job of CAREER_JOBS.filter(job=>job.act===1).slice(0,4))state=delivered(state,job.id);
 const model=careerPortfolio(state);assert.equal(model.entries.length,4);assert.equal(model.available.length,8);assert.equal(model.locked,6);
 assert.equal(model.available.filter(job=>job.act===1).length,2);assert.equal(model.available.filter(job=>job.act===2).length,6);
 for(const actNumber of [2,3])for(const job of CAREER_JOBS.filter(item=>item.act===actNumber).slice(0,4))state=delivered(state,job.id);
 state=act(state,{type:'career-release-start'});for(const [file,content] of Object.entries(RELEASE_EXAMPLE))state=act(state,{type:'career-release-edit',file,content});
 for(const type of ['career-release-test','career-release-build','career-release-publish','career-ending'] as const)state=act(state,{type});
 state=readSave(JSON.stringify(state));assert.equal(state.gameplay.career.ending,'community');
 const remaining=careerPortfolio(state);assert.equal(remaining.entries.length,12);assert.equal(remaining.available.length,6);assert.equal(remaining.locked,0);
 assert.ok(remaining.available.every(job=>!state.gameplay.career.completed.includes(job.id)));
});

test('delivered files modified outside job actions are marked changed and shown as current output, without recreating rewards',()=>{
 const state=delivered(opened(),'bakery-price'),credits=state.credits;
 state.machines.local.files[careerRoot('bakery-price')+'/pricing.json']=CAREER_JOBS[0].files['pricing.json'];
 const entry=careerPortfolio(state).entries[0];assert.equal(entry.deliveryFilesIntact,false);assert.equal(entry.impact!.rows.length,0);assert.equal(entry.reply?.id,'care');assert.equal(state.credits,credits);
 delete state.gameplay.career.proofs['bakery-price'];assert.equal(careerPortfolio(state).entries[0].deliveryFilesIntact,false);
});

test('JavaScript deliveries retain both authored and source files, excluding internal mode metadata',()=>{
 let state=act(opened(),{type:'career-accept',id:'bakery-price'});state=act(state,{type:'career-inspect',id:'bakery-price'});state=act(state,{type:'career-code-mode',id:'bakery-price',mode:'javascript'});
 state=act(state,{type:'career-edit',id:'bakery-price',file:CAREER_CODE_FILE,content:'function solve(input) { return Math.floor(input.quantity / 6) * 10000 + input.quantity % 6 * 1800; }'});
 state=act(state,{type:'career-test',id:'bakery-price'});state=act(state,{type:'career-deliver',id:'bakery-price',choice:'care'});
 const entry=careerPortfolio(state).entries[0];assert.ok(entry);assert.equal(entry.deliveryFilesIntact,true);assert.ok(entry.files.includes('solution.js'));assert.ok(entry.files.includes('pricing.json'));assert.ok(!entry.files.includes(CAREER_CODE_MODE_FILE));assert.ok(entry.impact!.additional>0);
});
