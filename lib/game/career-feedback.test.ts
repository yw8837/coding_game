import test from 'node:test';
import assert from 'node:assert/strict';
import {CAREER_JOBS} from './career-content.ts';
import {careerHash} from './career.ts';
import {evaluateCareer,exampleSolution} from './career-evaluation.ts';
import {careerFailureTarget,careerFeedback} from './career-feedback.ts';
import {CAREER_CODE_FILE,CAREER_CODE_MODE_FILE,careerCodeSpec} from './career-code.ts';

const bakery=CAREER_JOBS.find(job=>job.id==='bakery-price')!;
test('explicit current proof is required for real counts and first failure; drafts and stale proof conceal old success',()=>{
 const files={...bakery.files},evaluation=evaluateCareer(bakery.id,files),proof={hash:careerHash(files),passed:false};
 const unchecked=careerFeedback(bakery.id,files,evaluation,undefined);
 assert.equal(unchecked.status,'unchecked');assert.equal(unchecked.passed,null);assert.equal(unchecked.firstFailure,null);
 const checked=careerFeedback(bakery.id,files,evaluation,proof);
 assert.equal(checked.status,'checked');assert.equal(checked.passed,evaluation.checks.filter(check=>check.passed).length);assert.equal(checked.total,evaluation.checks.length);
 assert.equal(checked.firstFailure,evaluation.checks.find(check=>!check.passed));assert.deepEqual(checked.target,{file:'pricing.json'});
 const changed=exampleSolution(bakery.id),passing=evaluateCareer(bakery.id,changed);
 const stale=careerFeedback(bakery.id,changed,passing,proof);
 assert.equal(stale.status,'stale');assert.equal(stale.passed,null);assert.equal(stale.firstFailure,null);
 const fresh={hash:careerHash(changed),passed:true},draft=careerFeedback(bakery.id,changed,passing,fresh,true);
 assert.equal(draft.status,'draft');assert.equal(draft.passed,null);assert.equal(draft.firstFailure,null);
 const passed=careerFeedback(bakery.id,changed,passing,fresh);
 assert.equal(passed.passed,passed.total);assert.equal(passed.firstFailure,null);
});

test('every supported configuration job has an actionable existing file without invented line numbers',()=>{
 for(const job of CAREER_JOBS){
  const evaluation=evaluateCareer(job.id,job.files),failure=evaluation.checks.find(check=>!check.passed)!;
  assert.ok(failure,job.id);const target=careerFailureTarget(job.id,job.files,failure);
  assert.ok(target,job.id);assert.ok(Object.hasOwn(job.files,target.file),job.id);assert.equal(target.line,undefined);
 }
});

test('data preservation and subtotal checks point at source data, including active JavaScript mode',()=>{
 const contacts=CAREER_JOBS.find(job=>job.id==='contacts-clean')!,files={...exampleSolution(contacts.id),'contacts.csv':'name,email\nLuna,luna@example.test\nJun,jun@example.test\n'};
 const check=evaluateCareer(contacts.id,files).checks.find(check=>check.name.en==='Keep original contact table')!;
 assert.equal(check.passed,false);assert.deepEqual(careerFailureTarget(contacts.id,files,check),{file:'contacts.csv'});
 const javascript={...files,[CAREER_CODE_MODE_FILE]:'{"mode":"javascript"}',[CAREER_CODE_FILE]:careerCodeSpec(contacts.id)!.starter};
 assert.deepEqual(careerFailureTarget(contacts.id,javascript,check),{file:'contacts.csv'});
 const invoice=CAREER_JOBS.find(job=>job.id==='bookstore-invoice')!;
 const subtotal=evaluateCareer(invoice.id,invoice.files).checks.find(check=>check.name.en==='Item subtotal')!;
 assert.deepEqual(careerFailureTarget(invoice.id,invoice.files,subtotal),{file:'items.csv'});
});

test('JavaScript function failures point at actual solution mode and only interpreter errors supply a line',()=>{
 const files={...bakery.files,[CAREER_CODE_MODE_FILE]:'{"mode":"javascript"}',[CAREER_CODE_FILE]:'function solve(input) {\n return input.quantity + ;\n}'};
 const evaluation=evaluateCareer(bakery.id,files),failure=evaluation.checks.find(check=>!check.passed)!;
 assert.deepEqual(careerFailureTarget(bakery.id,files,failure),{file:'solution.js',line:2});
 files[CAREER_CODE_FILE]=careerCodeSpec(bakery.id)!.starter;
 const wrong=evaluateCareer(bakery.id,files).checks.find(check=>!check.passed)!;
 assert.deepEqual(careerFailureTarget(bakery.id,files,wrong),{file:'solution.js'});
});

test('format failures count only the executed format check and do not guess a multi-file parse location',()=>{
 const contacts=CAREER_JOBS.find(job=>job.id==='contacts-clean')!,files={...contacts.files,'clean.json':'{'};
 const result=evaluateCareer(contacts.id,files),model=careerFeedback(contacts.id,files,result,{hash:careerHash(files),passed:false});
 assert.equal(model.formatBlocked,true);assert.equal(model.passed,0);assert.equal(model.total,1);assert.equal(model.target,null);
 assert.deepEqual(model.candidates,Object.keys(contacts.files));
 const missing={...contacts.files};delete missing['contacts.csv'];
 assert.deepEqual(careerFailureTarget(contacts.id,missing,evaluateCareer(contacts.id,missing).checks[0]),{file:'contacts.csv'});
 const single={...bakery.files,'pricing.json':'{'};
 assert.deepEqual(careerFailureTarget(bakery.id,single,evaluateCareer(bakery.id,single).checks[0]),{file:'pricing.json'});
});
