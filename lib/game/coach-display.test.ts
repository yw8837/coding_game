import {test} from 'node:test';
import assert from 'node:assert/strict';
import {receiptGoal,menuFromResponse} from './coach-display.ts';
import {changedSource} from './learning-display.ts';
test('requested total stays fixed while the player prepares a different cup count',()=>{
 for(const prepared of [0,1,2,9])assert.equal(receiptGoal('serve',prepared,{price:4500,quantity:2}).total,9000);
 assert.equal(receiptGoal('inspect',0).total,13500);
 assert.equal(receiptGoal('rule',1).prepared,3);
 assert.equal(receiptGoal('serve',2,{price:5000,quantity:3}).total,15000);
});
test('the customer menu displays actual response values and does not invent records',()=>{
 assert.deepEqual(menuFromResponse({error:'Not Found'}),[]);
 assert.deepEqual(menuFromResponse([{name:'Actual menu',price:1234,id:1},{name:'Invalid',price:'4500'},null]),[{name:'Actual menu',price:1234}]);
});
test('saved feedback isolates changed source without exposing a whole large file',()=>{
 assert.equal(changedSource('before\n  "limit": 2\nafter','before\n  "limit": 3\nafter'),'  "limit": 3');
 assert.equal(changedSource('same','same'),'');assert.ok(changedSource('', 'x'.repeat(5000)).length<=1600);
});
