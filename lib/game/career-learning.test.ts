import test from 'node:test';
import assert from 'node:assert/strict';
import {CAREER_JOBS} from './career-content.ts';
import {evaluateCareer} from './career-evaluation.ts';
import {applyLearningStep,careerLearningSteps,learningInput,learningProgress,restoreLearningFile} from './career-learning.ts';

for(const job of CAREER_JOBS)test(`${job.id}: incremental learning edits solve the real contract`,()=>{
 let files={...job.files};const starter=JSON.stringify(job.files),steps=careerLearningSteps(job.id);
 assert.ok(steps.length);assert.equal(learningProgress(job.id,files).done,0);
 for(const step of steps){
  for(const language of ['ko','en','ja'] as const){assert.ok(step.title[language]);assert.ok(step.why[language]);}
  const before={...files},result=applyLearningStep(job.id,step.id,files,learningInput(step,step.correct,job.act));
  assert.equal(result.ok,true);if(!result.ok)throw Error('edit failed');
  assert.equal(result.correct,true);assert.deepEqual(files,before);
  files={...files,[result.file]:result.content};
  for(const name of Object.keys(before))if(name!==result.file)assert.equal(files[name],before[name]);
  assert.ok(learningProgress(job.id,files).states[steps.indexOf(step)].done);
 }
 assert.equal(JSON.stringify(job.files),starter);assert.equal(learningProgress(job.id,files).done,steps.length);
 assert.equal(evaluateCareer(job.id,files).passed,true,JSON.stringify(evaluateCareer(job.id,files).checks));
 const step=steps[0],wrong=step.choices.find(value=>JSON.stringify(value)!==JSON.stringify(step.correct))!;
 const experiment=applyLearningStep(job.id,step.id,files,learningInput(step,wrong,job.act));
 assert.equal(experiment.ok,true);if(!experiment.ok)throw Error('experiment failed');
 assert.equal(experiment.correct,false);files={...files,[experiment.file]:experiment.content};
 assert.equal(evaluateCareer(job.id,files).passed,false);assert.equal(learningProgress(job.id,files).done,steps.length-1);
});

test('edits change one JSON leaf and preserve custom unrelated fields',()=>{
 const files={'pricing.json':'{"custom":{"note":"keep"},"packPrice":10800,"unitPrice":1800,"packSize":5}'};
 const result=applyLearningStep('bakery-price','packSize',files,'6');assert.equal(result.ok,true);
 if(result.ok)assert.deepEqual(JSON.parse(result.content),{custom:{note:'keep'},packPrice:10800,unitPrice:1800,packSize:6});
});
test('reordered CSS width does not overwrite max-width and CSV supports quoted cells',()=>{
 const css={...CAREER_JOBS.find(j=>j.id==='museum-layout')!.files,'gallery.css':'.gallery { max-width: 900px; width: 960px; padding: 16px; box-sizing: content-box; }'};
 const result=applyLearningStep('museum-layout','width',css,'100%');assert.equal(result.ok,true);
 if(result.ok){assert.match(result.content,/max-width: 900px/);assert.match(result.content,/; width: 100%/);}
 const csv={...CAREER_JOBS.find(j=>j.id==='florist-stock')!.files,'inventory.csv':'name,stock,reserved\n"rose",12,1\ntulip,8,0\nlily,3,0\n'};
 const patched=applyLearningStep('florist-stock','rose-reserved',csv,'5');assert.equal(patched.ok,true);if(patched.ok)assert.equal(patched.content,'name,stock,reserved\nrose,12,5\ntulip,8,0\nlily,3,0\n');
});
test('unsupported sources and invalid inputs offer recovery without mutation',()=>{
 const id='bakery-price',starter=CAREER_JOBS.find(j=>j.id===id)!.files;
 for(const source of ['{broken','{}','[]','{"packSize":"5"}','x'.repeat(20001)]){
  const files={'pricing.json':source};assert.deepEqual(applyLearningStep(id,'packSize',files,'6'),{ok:false,reason:'format'});
  assert.equal(files['pricing.json'],source);assert.deepEqual(learningProgress(id,files).blockedFiles,['pricing.json']);
 }
 for(const input of ['','NaN','6.5','100000000','process.exit()','6'.repeat(101)])assert.deepEqual(applyLearningStep(id,'packSize',starter,input),{ok:false,reason:'input'});
 assert.deepEqual(applyLearningStep('unknown','packSize',starter,'6'),{ok:false,reason:'unknown'});
 assert.deepEqual(applyLearningStep(id,'unknown',starter,'6'),{ok:false,reason:'unknown'});
 const clinic=CAREER_JOBS.find(j=>j.id==='clinic-form')!;
 for(const source of ['<script>alert(1)</script>'+clinic.files['booking.html'],clinic.files['booking.html'].replace('<form>','<form onsubmit="bad()">')])assert.deepEqual(applyLearningStep(clinic.id,'label-for',{'booking.html':source},'name'),{ok:false,reason:'format'});
 assert.equal(restoreLearningFile(id,'pricing.json'),starter['pricing.json']);assert.equal(restoreLearningFile(id,'../pricing.json'),null);assert.equal(restoreLearningFile('unknown','pricing.json'),null);
});
test('act three teaches actual JSON property syntax and bounded expression practice',()=>{
 const job=CAREER_JOBS.find(j=>j.id==='community-api')!,step=careerLearningSteps(job.id)[0];
 assert.equal(learningInput(step,step.correct,3),'"path": "/api/events"');
 for(const input of ['read.path = "/api/events"','"method": "GET"','"path": "/api/events", "persist": true'])assert.deepEqual(applyLearningStep(job.id,step.id,job.files,input),{ok:false,reason:'input'});
 const result=applyLearningStep(job.id,step.id,job.files,'"path": "/api/events",');assert.equal(result.ok,true);if(result.ok){const parsed=JSON.parse(result.content);assert.equal(parsed.read.path,'/api/events');assert.equal(parsed.read.method,'POST');assert.equal(parsed.persist,false);}
 const backup=CAREER_JOBS.find(j=>j.id==='archive-backup')!;
 assert.deepEqual(applyLearningStep(backup.id,'inclusive',backup.files,'daysOld <= 7; process.exit()'),{ok:false,reason:'input'});
});
