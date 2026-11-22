import test from 'node:test';
import assert from 'node:assert/strict';
import {careerCheckCopy} from './career-check-copy.ts';
import {evaluateCareer,exampleSolution} from './career-evaluation.ts';
import {CAREER_CODE_FILE,evaluateCareerCode} from './career-code.ts';

test('configuration and JavaScript job checks render dynamic numbers in Chinese',()=>{
 const config=evaluateCareer('bakery-price',exampleSolution('bakery-price'));
 const files={...exampleSolution('bakery-price'),[CAREER_CODE_FILE]:'function solve(input) { return Math.floor(input.quantity / 6) * 10000 + input.quantity % 6 * 1800; }'};
 const code=evaluateCareerCode('bakery-price',files);
 for(const result of [config,code]){
  const check=result.checks.find(check=>check.name.en==='8 rolls total');
  assert.ok(check);
  assert.equal(check.name.zh,'8个的总价');
  assert.equal(check.actual,'13600');assert.equal(check.passed,true);
 }
 assert.equal(evaluateCareer('school-sort',exampleSolution('school-sort')).checks[0].name.zh,'第1名');
 assert.equal(evaluateCareer('museum-layout',exampleSolution('museum-layout')).checks[0].name.zh,'320px下的总宽度');
});

test('parameterized job labels retain arbitrary player names without translating or executing them',()=>{
 for(const name of ['민서 / Mina 张三','constructor','__proto__','${globalThis.secret}','새 게임']){
  const sale=careerCheckCopy(`${name} 판매 가능`,`${name} available`,`${name}販売可能`);
  assert.equal(sale.zh,`${name}可售`);
  assert.equal(careerCheckCopy(`${name} 예약 수량`,`${name} reservations`,`${name}予約数`).zh,`${name}预订数量`);
  assert.equal(careerCheckCopy(`${name} 수업 길이`,`${name} class duration`,`${name}講座の長さ`).zh,`${name}课程时长`);
  assert.equal(sale.en,`${name} available`);assert.equal(sale.ko,`${name} 판매 가능`);
 }
 assert.equal(careerCheckCopy('mon 09시 접수','mon 09:00 drop-off','mon 09時受付').zh,'周一09:00接收');
});
