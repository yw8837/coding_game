import test from 'node:test';
import assert from 'node:assert/strict';
import {act,createGame,runCommand,type GameState} from './engine.ts';
import {careerRoot,careerFresh} from './career.ts';
import {dispatchCareerNode} from './career-code-terminal.ts';
const source='function solve(input) { return Math.floor(input.quantity / 6) * 10000 + input.quantity % 6 * 1800; }';
function setup():GameState{let state=createGame();state.completed=[0,1,2];state.gameplay.openingCelebrated=true;state=act(state,{type:'career-accept',id:'bakery-price'});state=act(state,{type:'career-inspect',id:'bakery-price'});state=act(state,{type:'career-code-mode',id:'bakery-price',mode:'javascript'});state=act(state,{type:'career-edit',id:'bakery-price',file:'solution.js',content:source});state.machines.local.cwd=careerRoot('bakery-price');return state;}
const resolve=(cwd:string,path:string)=>path.startsWith('/')?path:cwd+'/'+path.replace(/^\.\//,'');
test('career terminal manual execution uses exact input without rewards and tests record current passing proof',()=>{
 const state=setup(),credits=state.credits;state.machines.local.tools.push('nodejs');
 const output=dispatchCareerNode(state,['solution.js','{"quantity":10}'],resolve);assert.equal(output?.error,false);assert.match(output!.output,/17200/);assert.equal(state.credits,credits);assert.equal(careerFresh(state,'bakery-price'),false);
 const checks=dispatchCareerNode(state,['--test','solution.js'],resolve);assert.equal(checks?.error,false);assert.equal(careerFresh(state,'bakery-price'),true);assert.equal(state.credits,credits);
 const delivered=act(state,{type:'career-deliver',id:'bakery-price',choice:'care'});assert.equal(delivered.credits,credits+200);
});
test('dispatcher refuses missing tools, wrong machine, malformed input, stale code and unrelated paths',()=>{
 const state=setup();state.machines.local.tools=state.machines.local.tools.filter(tool=>tool!=='nodejs');assert.equal(dispatchCareerNode(state,['solution.js','{"quantity":8}'],resolve)?.error,true);
 state.machines.local.tools.push('nodejs');assert.equal(dispatchCareerNode(state,['solution.js','not JSON'],resolve)?.error,true);
 assert.equal(dispatchCareerNode(state,['solution.js'],resolve)?.error,true);assert.equal(dispatchCareerNode(state,['receipt.js','{}'],resolve),null);
 state.machine='server';state.machines.server.cwd=careerRoot('bakery-price');assert.equal(dispatchCareerNode(state,['solution.js','{}'],resolve)?.error,true);state.machine='local';
 const broken=act(state,{type:'career-edit',id:'bakery-price',file:'solution.js',content:'function solve(input) { return 0; }'});assert.equal(dispatchCareerNode(broken,['--test','solution.js'],resolve)?.error,true);assert.equal(careerFresh(broken,'bakery-price'),false);
 const config=act(state,{type:'career-code-mode',id:'bakery-price',mode:'config'});assert.equal(dispatchCareerNode(config,['--test','solution.js'],resolve)?.error,true);
});
test('engine parses quoted career JSON, records tests and invalidates proof after terminal file edits',()=>{
 let state=setup();state.machines.local.tools.push('nodejs');const credits=state.credits;
 const manual=runCommand(state,"node solution.js '{\"quantity\":8}'");assert.equal(manual.error,false);assert.match(manual.output,/13600/);state=manual.state;assert.equal(state.credits,credits);assert.equal(careerFresh(state,'bakery-price'),false);
 const checked=runCommand(state,'node --test solution.js');assert.equal(checked.error,false);state=checked.state;assert.equal(careerFresh(state,'bakery-price'),true);
 const edited=runCommand(state,"echo 'function solve(input) { return 0; }' > solution.js");assert.equal(edited.error,false);state=edited.state;assert.equal(careerFresh(state,'bakery-price'),false);
 const failed=runCommand(state,'node --test solution.js');assert.equal(failed.error,true);assert.equal(failed.state.gameplay.career.proofs['bakery-price'].passed,false);assert.equal(failed.state.credits,credits);
});
