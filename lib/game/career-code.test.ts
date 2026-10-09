import test from 'node:test';
import assert from 'node:assert/strict';
import {act,createGame,runCommand,type GameState} from './engine.ts';
import {careerFiles,careerRoot,careerFresh} from './career.ts';
import {evaluateCareer,exampleSolution} from './career-evaluation.ts';
import {CAREER_CODE_IDS,CAREER_CODE_FILE,CAREER_CODE_MODE_FILE,allowedCareerFile,careerCodeMode,careerCodeModeSafe,careerCodeSpec,runCareerCode} from './career-code.ts';
import {deliveredCareerValid} from './career-legacy-validation.ts';
import {readSave,writeSave} from './save.ts';

const solutions:Record<string,string[]>={
 'bakery-price':[
  'function solve(input) { return Math.floor(input.quantity / 6) * 10000 + input.quantity % 6 * 1800; }',
  'function solve(input) { let n = input.quantity; let total = 0; while (n >= 6) { total += 10000; n -= 6; } return total + n * 1800; }'],
 'library-loans':[
  'function solve(input) { return input.borrowed + input.requested <= 3 && input.overdueDays === 0; }',
  'function solve(input) { if (input.overdueDays > 0) return false; if (input.borrowed + input.requested > 3) return false; return true; }'],
 'contacts-clean':[
  'function solve(input) { const out = []; for (const raw of input.emails) { const email = raw.trim().toLowerCase(); if (email && !out.includes(email)) out.push(email); } return out; }',
  'function solve(input) { return input.emails.map(email => email.trim().toLowerCase()).filter(email => email !== "").reduce((out, email) => { if (!out.includes(email)) out.push(email); return out; }, []); }'],
 'delivery-fees':[
  'function solve(input) { if (input.km > 10) return "unavailable"; if (input.total >= 20000) return 0; return 2000 + input.km * 300; }',
  'function solve(input) { return input.km <= 10 ? input.total < 20000 ? 2000 + 300 * input.km : 0 : "unavailable"; }'],
 'festival-report':[
  'function solve(input) { const totals = {}; const booths = []; let paidCount = 0; for (const row of input.sales) { if (row.status !== "paid") continue; if (!booths.includes(row.booth)) { booths.push(row.booth); totals[row.booth] = 0; } totals[row.booth] += row.quantity * row.unit; paidCount++; } return {totals: totals, paidCount: paidCount}; }',
  'function solve(input) { const paid = input.sales.filter(row => row.status === "paid"); const totals = {}; for (const row of paid) totals[row.booth] = 0; const count = paid.reduce((count, row) => { totals[row.booth] += row.quantity * row.unit; return count + 1; }, 0); return {totals: totals, paidCount: count}; }'],
};
function codeFiles(id:string,source:string):Record<string,string>{return {...exampleSolution(id),[CAREER_CODE_FILE]:source};}
function afterCafe(){const state=createGame();state.completed=[0,1,2];state.gameplay.openingCelebrated=true;state.credits=2000;return state;}
function roundtrip(state:GameState){let raw='';writeSave({setItem(_key,value){raw=value;}},state);return readSave(raw);}

test('five jobs accept distinct loop, conditional and array implementations without source matching and retain scene check values',()=>{
 for(const id of CAREER_CODE_IDS){
  const original=evaluateCareer(id,exampleSolution(id));
  for(const source of solutions[id]){
   const evaluation=evaluateCareer(id,codeFiles(id,source));assert.equal(evaluation.passed,true,id+' '+JSON.stringify(evaluation.checks.filter(check=>!check.passed)));
   const first=id==='bakery-price'?5:original.checks.length;
   assert.deepEqual(evaluation.checks.slice(0,first).map(check=>[check.name,check.expected,check.actual]),original.checks.slice(0,first).map(check=>[check.name,check.expected,check.actual]),id);
   assert.equal(evaluateCareer(id,codeFiles(id,source.replace('function solve(input)', 'function solve(input) /* my approach */'))).passed,true);
  }
  assert.equal(evaluateCareer(id,codeFiles(id,careerCodeSpec(id)!.starter)).passed,false);
 }
});

test('boundary inputs reject canned fixture answers and nearly correct policies',()=>{
 const bad:Record<string,string[]>={
  'bakery-price':['function solve(input) { return 10000; }','function solve(input) { if (input.quantity === 0) return 0; if (input.quantity === 1) return 1800; if (input.quantity === 3) return 5400; if (input.quantity === 6) return 10000; return 13600; }','function solve(input) { return Math.floor(input.quantity / 5) * 8200 + input.quantity % 5 * 1800; }'],
  'library-loans':['function solve(input) { return input.borrowed === 2; }','function solve(input) { return input.borrowed + input.requested < 3 && input.overdueDays === 0; }','function solve(input) { return input.borrowed + input.requested <= 3; }'],
  'contacts-clean':['function solve(input) { return ["luna@example.test", "jun@example.test"]; }','function solve(input) { return input.emails.map(email => email.trim().toLowerCase()).filter(email => email !== ""); }'],
  'delivery-fees':['function solve(input) { if (input.total >= 20000) return 0; if (input.km > 10) return "unavailable"; return 2000 + 300 * input.km; }','function solve(input) { if (input.km >= 10) return "unavailable"; return input.total > 20000 ? 0 : 2000 + 300 * input.km; }'],
  'festival-report':['function solve(input) { return {totals: {bread: 8000, craft: 10000}, paidCount: 3}; }','function solve(input) { const totals = {}; for (const row of input.sales) totals[row.booth] = (totals[row.booth] || 0) + row.quantity * row.unit; return {totals: totals, paidCount: input.sales.length}; }'],
 };
 for(const id of CAREER_CODE_IDS)for(const source of bad[id])assert.equal(evaluateCareer(id,codeFiles(id,source)).passed,false,id);
});

test('mode switching preserves config and custom JS through saves and checkpoints, while current proofs invalidate',()=>{
 const id='bakery-price';let state=act(afterCafe(),{type:'career-accept',id});state=act(state,{type:'career-inspect',id});
 const config=careerFiles(state,id)['pricing.json'];state=act(state,{type:'career-code-mode',id,mode:'javascript'});
 assert.equal(careerCodeMode(careerFiles(state,id)),'javascript');assert.equal(careerFiles(state,id)[CAREER_CODE_FILE],careerCodeSpec(id)!.starter);
 state=act(state,{type:'career-edit',id,file:CAREER_CODE_FILE,content:solutions[id][1]});state=act(state,{type:'career-test',id});assert.equal(careerFresh(state,id),true);
 state=act(state,{type:'career-upgrade',id:'recovery-kit'});state=act(state,{type:'career-checkpoint',id});state=roundtrip(state);
 state=act(state,{type:'career-code-mode',id,mode:'config'});assert.equal(careerFresh(state,id),false);assert.equal(careerFiles(state,id)['pricing.json'],config);assert.equal(careerFiles(state,id)[CAREER_CODE_FILE],solutions[id][1]);
 state=act(state,{type:'career-code-mode',id,mode:'javascript'});assert.equal(careerFiles(state,id)[CAREER_CODE_FILE],solutions[id][1]);
 state=act(state,{type:'career-edit',id,file:CAREER_CODE_FILE,content:'broken'});state=act(state,{type:'career-restore',id});assert.equal(careerFiles(state,id)[CAREER_CODE_FILE],solutions[id][1]);assert.equal(careerCodeMode(careerFiles(state,id)),'javascript');assert.equal(careerFresh(state,id),false);
 state=act(state,{type:'career-test',id});const before=state.credits;state=act(state,{type:'career-deliver',id,choice:'care'});assert.equal(state.credits,before+200);state=roundtrip(state);
 const delivered={...careerFiles(state,id)};state=act(state,{type:'career-code-mode',id,mode:'config'});state=act(state,{type:'career-edit',id,file:CAREER_CODE_FILE,content:'broken'});assert.deepEqual(careerFiles(state,id),delivered);
 const overwrite=runCommand(state,`echo broken > ${careerRoot(id)}/solution.js`);assert.equal(overwrite.error,true);assert.deepEqual(careerFiles(overwrite.state,id),delivered);
});

test('restoring an older config checkpoint removes later JS mode files and unsupported optional paths remain forbidden',()=>{
 const id='bakery-price';let state=act(afterCafe(),{type:'career-accept',id});state=act(state,{type:'career-upgrade',id:'recovery-kit'});state=act(state,{type:'career-checkpoint',id});
 state=act(state,{type:'career-code-mode',id,mode:'javascript'});state=act(state,{type:'career-restore',id});assert.equal(careerCodeMode(careerFiles(state,id)),'config');assert.equal(Object.hasOwn(careerFiles(state,id),CAREER_CODE_FILE),false);
 assert.equal(allowedCareerFile(id,CAREER_CODE_FILE),true);assert.equal(allowedCareerFile('clinic-form',CAREER_CODE_FILE),false);assert.equal(allowedCareerFile(id,'../solution.js'),false);
 state=act(state,{type:'career-edit',id,file:CAREER_CODE_FILE,content:'x'.repeat(12001)});assert.equal(Object.hasOwn(careerFiles(state,id),CAREER_CODE_FILE),false);
});

test('manual input runs expose actual bounded behavior and reject invalid input, syntax, globals, prototypes and loops',()=>{
 const id='bakery-price',source=solutions[id][0];assert.equal(runCareerCode(id,source,'{"quantity":8}').actual,13600);
 for(const input of ['bad','{"quantity":-1}','{"quantity":2.5}','{"quantity":1001}'])assert.equal(runCareerCode(id,source,input).passed,false);
 for(const source of ['function solve(input) { return process.env; }','function solve(input) { return input.constructor; }','function solve(input) { while (true) {} }','function solve(input) { return ; }','not javascript']){
  const result=runCareerCode(id,source,'{"quantity":8}');assert.ok(result.error);assert.equal(evaluateCareer(id,codeFiles(id,source)).passed,false);
 }
 assert.equal(runCareerCode('festival-report',solutions['festival-report'][0],'{"sales":[]}').passed,true);
 assert.equal(runCareerCode('festival-report',solutions['festival-report'][0],'{"sales":[{"booth":"constructor","quantity":1,"unit":2,"status":"paid"}]}').passed,false);
 for(const status of [['paid'],['pending'],['refunded'],{value:'paid'},true,1,null]){
  const input=JSON.stringify({sales:[{booth:'bread',quantity:1,unit:2,status}]});const result=runCareerCode('festival-report',solutions['festival-report'][0],input);
  assert.equal(result.passed,false);assert.match(result.error?.message??'',/documented fields/);assert.equal(result.steps,0);
 }
});

test('malformed modes, missing JS and changed source data fail safely, with no legacy bypass',()=>{
 const id='bakery-price';for(const mode of ['bad','{"mode":"other"}','{"mode":"javascript"}']){
  const files={...exampleSolution(id),[CAREER_CODE_MODE_FILE]:mode};assert.equal(evaluateCareer(id,files).passed,false);
  assert.equal(careerCodeModeSafe(files),'javascript');
 }
 const wrong=codeFiles(id,'function solve(input) { return 0; }');assert.equal(deliveredCareerValid(id,wrong,1),false);
 const config={...wrong,[CAREER_CODE_MODE_FILE]:'{"mode":"config"}'};assert.equal(evaluateCareer(id,config).passed,true);
 for(const id of ['contacts-clean','festival-report']){const files=codeFiles(id,solutions[id][0]),path=id==='contacts-clean'?'contacts.csv':'sales.csv';files[path]=files[path].split('\n').slice(0,2).join('\n');assert.equal(evaluateCareer(id,files).passed,false);}
 const equivalent=codeFiles('festival-report',solutions['festival-report'][0]);equivalent['sales.csv']=equivalent['sales.csv'].replace('3,2000','3.0,2000.0');assert.equal(evaluateCareer('festival-report',equivalent).passed,true);
});
