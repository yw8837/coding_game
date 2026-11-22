import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,runCommand,projectFiles,sourceHash} from './engine.ts';
import {failedMissionChecks} from './check-feedback.ts';

function prepared(){
 let state=createGame();
 state=runCommand(state,'git clone https://cathub.dev/mono/menu-site').state;
 state.tests={mission:0,hash:sourceHash(projectFiles(state)),checks:[
  {name:'Heading',passed:false,detail:'Repair h1'},
  {name:'Mobile',passed:false,detail:'360px / 984px'},
  {name:'Desktop',passed:true},
 ]};
 return state;
}

test('failed checks retain the explanation and point to the actual HTML or CSS file',()=>{
 const state=prepared();
 assert.deepEqual(failedMissionChecks(state),[
  {name:'Heading',passed:false,detail:'Repair h1',index:0,file:'index.html'},
  {name:'Mobile',passed:false,detail:'360px / 984px',index:1,file:'style.css'},
 ]);
 state.tests!.checks[2].passed=false;
 assert.equal(failedMissionChecks(state)[2].file,'style.css');
});

test('editing a file invalidates old failure instructions until another check',()=>{
 const state=prepared();
 state.machines.local.files[state.repo!.root+'/style.css']+='\n/* edited */';
 assert.deepEqual(failedMissionChecks(state),[]);
});

test('a previous mission cannot display failure instructions for the current mission',()=>{
 const state=prepared();
 state.mission=1;
 assert.deepEqual(failedMissionChecks(state),[]);
 state.tests!.mission=1;
 assert.equal(failedMissionChecks(state)[0].file,'app.js');
 state.mission=2;state.tests!.mission=2;
 assert.equal(failedMissionChecks(state)[0].file,'server.py');
});
