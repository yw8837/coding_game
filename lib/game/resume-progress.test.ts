import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,runCommand} from './engine.ts';
import {readSave} from './save.ts';
import {hasGameProgress} from './resume-progress.ts';

test('fresh/reset saves and their restored envelopes have nothing to continue',()=>{
 const fresh=createGame();
 assert.equal(hasGameProgress(fresh),false);
 assert.equal(hasGameProgress(readSave(JSON.stringify(fresh))),false);
 fresh.notice='Workspace ready';fresh.logs.push('[system] save restored');
 assert.equal(hasGameProgress(fresh),false);
 const old=JSON.parse(JSON.stringify(createGame()));delete old.gameplay;
 assert.equal(hasGameProgress(readSave(JSON.stringify(old))),false);
});

test('continue includes early terminal work, accepted jobs and saved source before a clear',()=>{
 for(const state of [runCommand(createGame(),'help').state,runCommand(createGame(),'pwd').state,runCommand(createGame(),'echo hello > notes.txt').state,act(createGame(),{type:'accept'})]){
  assert.equal(state.completed.length,0);
  assert.equal(hasGameProgress(state),true);
  assert.equal(hasGameProgress(readSave(JSON.stringify(state))),true);
 }
 // Even an imported source-only save without terminal history must be protected.
 const edited=createGame();edited.machines.local.files['/home/dev/notes.txt']='my draft';
 assert.equal(hasGameProgress(readSave(JSON.stringify(edited))),true);
});

test('a fresh reset has no resume progress and does not mutate the earlier state',()=>{
 const started=runCommand(createGame(),'pwd').state;
 assert.equal(hasGameProgress(started),true);
 const reset=readSave(JSON.stringify(createGame()));
 assert.equal(hasGameProgress(reset),false);
 assert.equal(hasGameProgress(started),true);
});
