import test from 'node:test';
import assert from 'node:assert/strict';
import {codeCompletions} from './input-tools.ts';
test('function editor completes in-file properties and supported chained methods at the cursor',()=>{
 const source='function solve(input) { const rows = input.items; return input.it';
 const property=codeCompletions('catalog.js',source,source.length).find(x=>x.text==='input.items')!;
 assert.ok(property);assert.equal(source.slice(0,property.start)+property.text+source.slice(property.end),source.slice(0,-8)+'input.items');
 const chained='return input.items.fi';
 assert.equal(codeCompletions('catalog.js',chained,chained.length)[0]?.text,'input.items.filter');
 assert.equal(codeCompletions('dedupe.js','name.toL',8)[0]?.text,'name.toLowerCase');
 assert.equal(codeCompletions('receipt.js','ret',3)[0]?.text,'return');
});
