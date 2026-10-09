import test from 'node:test';
import assert from 'node:assert/strict';
import {CAREER_JOBS} from './career-content.ts';
import {exampleSolution} from './career-evaluation.ts';
import {CAREER_SCENARIOS,careerScenarios} from './career-playground.ts';

test('all eighteen client scenes expose real failing starter cases and working delivered cases',()=>{
 assert.equal(Object.keys(CAREER_SCENARIOS).length,18);
 for(const job of CAREER_JOBS){
  const before=JSON.stringify(job.files),broken=careerScenarios(job.id,job.files)!;
  assert.ok(broken.cases.some(check=>!check.passed),job.id+' exposes the original problem');
  assert.equal(JSON.stringify(job.files),before,'trying a scene cannot edit source');
  const fixed=careerScenarios(job.id,exampleSolution(job.id))!;
  assert.ok(fixed.cases.length>=3);assert.ok(fixed.cases.every(check=>check.passed),job.id);
  assert.equal(fixed.unavailable,false);
  for(const lang of ['ko','en','ja'] as const){assert.ok(fixed.title[lang]);assert.ok(fixed.action[lang]);}
 }
});
test('malformed source shows a file error rather than a fabricated successful client result',()=>{
 for(const job of CAREER_JOBS){const scene=careerScenarios(job.id,{})!;assert.equal(scene.unavailable,true);assert.equal(scene.cases.length,1);assert.equal(scene.cases[0].passed,false);}
 assert.equal(careerScenarios('unknown',{}),null);
});
test('a correct bakery case cannot imply the whole job passed and changed source changes the real result',()=>{
 const job=CAREER_JOBS[0],files={...job.files};
 const before=careerScenarios(job.id,files)!;
 assert.ok(before.cases.some(check=>check.passed));assert.ok(before.cases.some(check=>!check.passed));
 files['pricing.json']=JSON.stringify({unitPrice:1800,packSize:6,packPrice:9500});
 assert.equal(careerScenarios(job.id,files)!.cases[0].actual,'9500');
 assert.equal(careerScenarios(job.id,files)!.cases[0].passed,false);
});
