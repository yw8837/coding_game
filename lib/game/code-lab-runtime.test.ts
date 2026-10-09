import test from 'node:test';
import assert from 'node:assert/strict';
import {runCode,type CodeValue} from './code-lab-runtime.ts';
import {LAB_JOBS} from './code-lab.ts';
import {createGame,act} from './engine.ts';
import {readSave,writeSave} from './save.ts';

const source=(body:string)=>`function solve(input) {\n${body}\n}`;
function value(body:string,input:CodeValue=null){const result=runCode(source(body),input);assert.equal(result.error,null,JSON.stringify(result.error));assert.ok(result.steps>0&&result.steps<=5000);return result.value;}
function failure(body:string,kind:string,input:CodeValue=null){const result=runCode(source(body),input);assert.equal(result.value,null);assert.equal(result.error?.kind,kind,JSON.stringify(result));return result;}

test('all authored Coding Lab reference solutions evaluate actual changing inputs',()=>{
 for(const job of LAB_JOBS)for(const seed of [1,17,9999])for(const row of job.cases(seed)){
  const result=runCode(job.solution,row.input);assert.equal(result.error,null,job.id+': '+JSON.stringify(result.error));assert.deepEqual(result.value,row.expected,job.id);
 }
});

test('arithmetic, branches, dynamic properties and JSON construction use source semantics',()=>{
 const body='const result = {}; for (const item of input) { result[item.name] = item.price * item.quantity; } return result;';
 assert.deepEqual(value(body,[{name:'tea',price:12,quantity:3},{name:'cookie',price:4,quantity:2}]),{tea:36,cookie:8});
 assert.equal(value('if (input < 3) { return input ** 2; } else { return (input + 1) % 3; }',2),4);
 assert.equal(value('if (input < 3) return 1; else return 2;',10),2);
 assert.equal(value('return Math.max(0, Math.floor(input / 2)) + Math.round(1.5);',9),6);
 assert.equal(value('return Number("12") + Number(true);'),13);
 assert.equal(value('return String(input) + "!";',false),'false!');
 assert.equal(runCode('function solve(order) { return order.price; }',{price:9}).value,9);
});

test('for, while, do-while, update, break and continue obey their control flow',()=>{
 assert.equal(value('let total = 0; for (let i = 0; i < input; i++) { if (i === 2) continue; if (i === 5) break; total += i; } return total;',10),8);
 assert.equal(value('let n = input; let total = 0; while (n > 0) { total += n; --n; } return total;',4),10);
 assert.equal(value('let n = 0; do { n++; if (n < 3) continue; } while (n < input); return n;',4),4);
 assert.equal(value('let n = 0; for (;;) { n++; if (n === 3) break; } return n;'),3);
 assert.equal(value('let n = 1; const before = n++; const after = ++n; return before * 10 + after;'),13);
});

test('lexical scopes, closures and const bindings follow local JavaScript behavior',()=>{
 assert.equal(value('const amount = 3; const apply = x => x + amount; return input.map(apply).reduce((sum, n) => sum + n, 0);',[1,2]),9);
 assert.equal(value('let amount = 1; { let amount = 9; amount++; } return amount;'),1);
 assert.equal(value('const entries = []; const result = input.filter((n, i) => i > 0).map(n => { const doubled = n * 2; return doubled; }); return result.join("-");',[1,2,3]),'4-6');
 failure('const x = 1; x = 2; return x;','runtime');
 failure('const x = 1; { const x = x + 1; } return x;','runtime');
 failure('for (let i = 0; i < 1; i++) {} return i;','unsupported');
 failure('{ const hidden = 1; } return hidden;','unsupported');
 failure('const Number = null; return Number(3);','runtime');
 assert.equal(value('const toString = x => x + 1; const constructor = 4; return toString(constructor);'),5);
 assert.equal(value('let first = x => -1; let second = x => -1; for (let i = 0; i < 2; i++) { if (i === 0) first = x => i; else second = x => i; } return first(0) + second(0);'),1);
 assert.equal(value('let saved = x => -1; for (let i = 0, initial = x => i; i < 1; i++) { saved = initial; i = 5; } return saved(0);'),0);
 failure('const rows = [1]; for (const rows of rows) {} return 0;','runtime');
});

test('logical operators short-circuit unsafe branches and preserve zero and false',()=>{
 assert.equal(value('return false && input.missing.x;',{}),false);
 assert.equal(value('return true || input.missing.x;',{}),true);
 assert.equal(value('return input ?? 4;',0),0);assert.equal(value('return input ?? 4;',null),4);
 assert.equal(value('return input ? 7 : 8;',false),8);
 assert.equal(value('let n = 0; n &&= input.missing; n ||= 3; n ??= 8; return n;',{}),3);
 assert.equal(value('let n = null; n ??= 8; return n;'),8);
});

test('array operations include empty reductions, zero initial values, slices and push results',()=>{
 assert.equal(value('return input.reduce((n, x) => n + x, 0);',[]),0);
 assert.equal(value('return input.reduce((n, x) => n * x, 0);',[2,3]),0);
 assert.equal(value('return input.reduce((n, x) => n + x);',[2,3]),5);
 failure('return input.reduce((n, x) => n + x);','runtime',[]);
 assert.deepEqual(value('const a = input.slice(-2); a.push(8, 9); a[0] += 10; return a;',[1,2,3]),[12,3,8,9]);
 assert.deepEqual(value('return input.slice(null, null);',[1,2]),[]);
 assert.equal(value('return input.includes(2, -2);',[1,2,3]),true);
 assert.equal(value('return " A,B ".trim().toLowerCase().split(",").join("|");'),'a|b');
 assert.equal(value('return "hello".includes("ll", 1);'),true);
 assert.deepEqual(value('return input.map((x, i) => x + i);',[3,3]),[3,4]);
 assert.deepEqual(value('return input.filter((x, i, a) => { a[i] = 9; return true; });',[1,2]),[1,2]);
});

test('input mutations target a deep clone and output never exposes internal closures',()=>{
 const input={items:[{count:2}],meta:{name:'old'}};const before=JSON.stringify(input);
 assert.deepEqual(value('input.items[0].count++; input.items.push({count:9}); input.meta.name = "new"; return input;',input),{items:[{count:3},{count:9}],meta:{name:'new'}});
 assert.equal(JSON.stringify(input),before);
 failure('return x => x;','unsupported');failure('return {callback: x => x};','unsupported');failure('const a = []; a.push(x => x); return a;','unsupported');
 failure('const f = x => f(x); return f(1);','unsupported');
});

test('host globals, executable escapes and prototype properties are inaccessible',()=>{
 for(const body of ['return process;','return globalThis;','return window;','return document;','return eval("2 + 2");','return Function("return 1")();','return new Date();','return import("node:fs");','return input.constructor;','return input["con" + "structor"];','return input.__proto__;','return {__proto__: {polluted:true}};','return {get x() { return 1; }};','return input.toString();','return Object.keys(input);','return Math.random();'])failure(body,'unsupported',{});
 assert.equal(({} as Record<string,unknown>).polluted,undefined);
 failure('input["__proto__"] = {polluted:true}; return input;','unsupported',{});
 failure('return (() => 1).constructor("return process")();','unsupported');
});

test('malformed and non-JSON input is rejected without invoking getters',()=>{
 for(const input of [undefined,NaN,Infinity,()=>1,new Date(),[1,,3],{value:undefined},{constructor:'bad'}]){
  assert.ok(runCode(source('return input;'),input as CodeValue).error, String(input));
 }
 let calls=0;const accessor=Object.defineProperty({},'value',{get(){calls++;return 1;},enumerable:true});assert.ok(runCode(source('return input;'),accessor).error);assert.equal(calls,0);
 const cycle:Record<string,unknown>={};cycle.self=cycle;assert.equal(runCode(source('return input;'),cycle as CodeValue).error?.kind,'runtime');
 assert.ok(runCode(source('return input;'),JSON.parse('{"__proto__":{"polluted":true}}')).error);
});

test('infinite loops and allocation growth stop at bounded work with useful errors',()=>{
 const infinite=failure('while (true) {}','budget');assert.equal(infinite.steps,5000);assert.equal(infinite.error?.line,2);
 failure('const a = []; while (true) a.push(1);','budget');
 failure('let text = "a"; while (true) text += text;','budget');
 failure('let data = {}; for (let i = 0; i < 50; i++) data = {data}; return 0;','budget');
 failure('const data = {}; data.self = data; return 0;','runtime');
 failure('return 1 / 0;','runtime');failure('return Number("no number");','runtime');
 failure('return input;','budget',Array(501).fill(0));
 failure('return input;','budget','a'.repeat(4001));
 failure('return input;','budget',Array(450).fill('a'.repeat(50)));
 assert.equal(runCode('x'.repeat(12001),null).error?.kind,'budget');
 failure('return '+ '!'.repeat(300)+'true;','budget');
 failure('return '+ '['.repeat(1200)+'0'+']'.repeat(1200)+';','budget');
});

test('invalid syntax, missing return and unsupported grammar report line and category',()=>{
 const malformed=runCode('function solve(input) {\n return input + ;\n}',2);assert.equal(malformed.error?.kind,'syntax');assert.equal(malformed.error?.line,2);
 for(const program of ['const x = 1; function solve(input) { return x; }','function other(input) { return input; }','async function solve(input) { return input; }','function solve(...input) { return input; }'])assert.equal(runCode(program,null).error?.kind,'unsupported');
 failure('var x = 1; return x;','unsupported');failure('const {x} = input; return x;','unsupported',{x:1});
 failure('return [...input];','unsupported',[]);failure('return /x/;','unsupported');failure('return 1n;','unsupported');
 failure('const f = function () {return 1;}; return f();','unsupported');failure('return input?.value;','unsupported',{});
 assert.equal(failure('const x = 1;','runtime').error?.line,1);
 assert.equal(failure('return input.missing;','runtime',{}).error?.line,2);
 failure('return;','unsupported');failure('return input.map(x => {});','unsupported',[1]);failure('let n; return n;','unsupported');
 assert.deepEqual(value('return input.map(x => { return null; });',[1]),[null]);
});

test('long authored diagnostics remain within save limits and failed lab work can autosave',()=>{
 const program=source('return input["'+ 'x'.repeat(3000)+'"];');
 const result=runCode(program,{});assert.equal(result.error?.kind,'runtime');assert.ok(result.error!.message.length<=800);assert.equal(result.error?.line,2);
 let state=act(createGame(),{type:'lab-draft',id:'receipt',source:program});state=act(state,{type:'lab-run',id:'receipt'});
 assert.equal(state.gameplay.lab.proofs.receipt?.passed,false);assert.doesNotThrow(()=>writeSave({setItem(){}},state));assert.doesNotThrow(()=>readSave(JSON.stringify(state)));
 const hugeName='x'.repeat(3000);assert.ok(failure('return '+hugeName+';','unsupported').error!.message.length<=800);
});
