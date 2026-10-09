import test from 'node:test';import assert from 'node:assert/strict';
import {isCafeName} from './cafe-name.ts';
test('the required proper name accepts all supported keyboard languages',()=>{
 for(const name of ['모노 카페','Mono Cafe','モノカフェ'])assert.ok(isCafeName(name));
 for(const name of ['다른 카페','Moon bakery','Monopoly Cafe','모노','Cafe'])assert.equal(isCafeName(name),false);
});
