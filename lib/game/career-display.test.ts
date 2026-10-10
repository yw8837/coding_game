import test from 'node:test';
import assert from 'node:assert/strict';
import {CAREER_JOBS} from './career-content.ts';
import {evaluateCareer,exampleSolution} from './career-evaluation.ts';
import {careerDayLabel,careerDisplayValue} from './career-display.ts';

test('day stamps read as plain words in every language while the judged string stays untouched',()=>{
 const cases:[string,string,string,string][]=[
  ['D+1 08:00','다음 날 08:00','Next day 08:00','翌日 08:00'],['D-1 23:00','전날 23:00','Previous day 23:00','前日 23:00'],
  ['D+0 11:00','같은 날 11:00','Same day 11:00','同じ日 11:00'],['D+2 01:30','2일 뒤 01:30','2 days later 01:30','2日後 01:30'],['D-3 05:00','3일 전 05:00','3 days earlier 05:00','3日前 05:00']];
 for(const [raw,ko,en,ja] of cases)assert.deepEqual([careerDisplayValue(raw,'ko'),careerDisplayValue(raw,'en'),careerDisplayValue(raw,'ja')],[ko,en,ja]);
 for(const raw of ['12600','true','D+1 8:00','D+1 08:00 ','UTC 23:00','["a","b"]'])assert.equal(careerDisplayValue(raw,'ko'),raw);
 assert.equal(careerDayLabel(1,'ja'),'翌日');
 const evaluation=evaluateCareer('tutor-timezone',exampleSolution('tutor-timezone'));assert.equal(evaluation.passed,true);
 assert.deepEqual(evaluation.checks.map(check=>check.actual),['D+1 08:00','D+0 11:00','D+1 03:00']);
 assert.deepEqual(evaluation.checks.map(check=>careerDisplayValue(check.actual,'ko')),['다음 날 08:00','같은 날 11:00','다음 날 03:00']);
});

test('the kept-log check reads as a line count, and only for log lines',()=>{
 const job=CAREER_JOBS.find(item=>item.id==='transit-logs')!,count=job.files['service.log'].trim().split(/\r?\n/).length;
 const keep=(files:Record<string,string>)=>evaluateCareer(job.id,files).checks.find(check=>check.name.en==='Keep every original log entry')!;
 const kept=keep(exampleSolution(job.id));assert.equal(kept.passed,true);
 assert.equal(careerDisplayValue(kept.expected,'ko',kept.expected),`${count}줄 모두 유지`);
 assert.equal(careerDisplayValue(kept.actual,'en',kept.expected),`All ${count} lines kept`);
 const trimmed=exampleSolution(job.id);trimmed['service.log']=trimmed['service.log'].trim().split(/\r?\n/).slice(1).join('\n')+'\n';
 const dropped=keep(trimmed);assert.equal(dropped.passed,false);
 assert.equal(careerDisplayValue(dropped.actual,'ko',dropped.expected),`${count-1}줄 · 원본 ${count}줄과 다름`);
 assert.equal(careerDisplayValue(dropped.actual,'ja',dropped.expected),`${count-1}行 · 元の${count}行と違います`);
 assert.equal(careerDisplayValue('["a@x.test","b@x.test"]','ko','["a@x.test"]'),'["a@x.test","b@x.test"]');
 assert.equal(careerDisplayValue('not json','ko',kept.expected),'not json');
});
