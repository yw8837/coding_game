import test from 'node:test';
import assert from 'node:assert/strict';
import {act,createGame,runCommand} from './engine.ts';
import {careerFresh,careerRoot} from './career.ts';
test('typed shell commands dispatch career JS, record real tests, invalidate after edits and recover',()=>{
 let state=createGame();state.completed=[0,1,2];state.gameplay.openingCelebrated=true;
 state=act(act(state,{type:'career-accept',id:'bakery-price'}),{type:'career-code-mode',id:'bakery-price',mode:'javascript'});
 state=act(state,{type:'career-edit',id:'bakery-price',file:'solution.js',content:'function solve(input) { return Math.floor(input.quantity / 6) * 10000 + input.quantity % 6 * 1800; }'});
 state.machines.local.tools.push('nodejs');state=runCommand(state,'cd '+careerRoot('bakery-price')).state;
 const manual=runCommand(state,`node solution.js '{"quantity":17}'`);assert.equal(manual.error,false);assert.match(manual.output,/29000/);assert.equal(careerFresh(manual.state,'bakery-price'),false);
 const checked=runCommand(manual.state,'node --test solution.js');assert.equal(checked.error,false);assert.equal(careerFresh(checked.state,'bakery-price'),true);assert.deepEqual(checked.state.gameplay.career.completed,[]);
 state=runCommand(checked.state,`echo 'function solve(input) { return 1; }' > solution.js`).state;
 assert.equal(careerFresh(state,'bakery-price'),false);assert.equal(runCommand(state,'node --test solution.js').error,true);
 assert.equal(runCommand(state,'clear').output,'');
});
