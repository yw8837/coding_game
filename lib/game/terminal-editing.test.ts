import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,runCommand,tokenize} from './engine.ts';
import {terminalCompletionsAtCursor} from './terminal-input.ts';

test('completion edits the token under the caret and preserves trailing arguments and redirects',()=>{
 const state=createGame(),before=JSON.stringify(state);
 for(const [input,caret,value,cursor] of [
  ['cat wel > result.txt',7,'cat welcome.txt > result.txt',15],
  ['cat welBROKEN > result.txt',7,'cat welcome.txt > result.txt',15],
  ['cat wel>result.txt',7,'cat welcome.txt>result.txt',15],
  ['cat wel>>result.txt',7,'cat welcome.txt>>result.txt',15],
  ['cat wel&&pwd',7,'cat welcome.txt&&pwd',15],
  ['cp wel target.txt',6,'cp welcome.txt target.txt',14],
  ['ls -la wel other.txt',10,'ls -la welcome.txt other.txt',18],
  ['pw --help',2,'pwd --help',3],
 ] as const){
  assert.ok(terminalCompletionsAtCursor(state,input,caret).some(option=>option.value===value&&option.caret===cursor),input);
 }
 assert.equal(JSON.stringify(state),before,'completion must not execute a command or alter the game');
});

test('caret completion replaces the rest of a quoted token without consuming the next operand',()=>{
 let state=runCommand(createGame(),'mkdir "my notes"').state;
 state=runCommand(state,'echo text > "my notes/check.txt"').state;
 for(const [input,caret,target,tail] of [
  ['cat "my notes/chOLD" > out.txt',16,'my notes/check.txt',' > out.txt'],
  ["cat 'my notes/chOLD' out.txt",16,'my notes/check.txt',' out.txt'],
  ['cat my\\ notes/chOLD out.txt',16,'my notes/check.txt',' out.txt'],
 ] as const){
  const options=terminalCompletionsAtCursor(state,input,caret);
  const option=options.find(item=>tokenize(item.value)[1]===target);
  assert.ok(option,input);assert.equal(option.value.slice(option.caret),tail);
  assert.equal(tokenize(option.value.slice(0,option.caret))[1],target);
 }
});

test('cursor completion stays on the active virtual machine and safely handles missing paths',()=>{
 const state=createGame();state.machine='server';
 assert.deepEqual(terminalCompletionsAtCursor(state,'cat missing > result.txt',11),[]);
 const local=runCommand(createGame(),'touch only-local.txt').state;
 assert.ok(terminalCompletionsAtCursor(local,'cat only',8).some(item=>item.value==='cat only-local.txt'));
 local.machine='server';assert.deepEqual(terminalCompletionsAtCursor(local,'cat only',8),[]);
});
