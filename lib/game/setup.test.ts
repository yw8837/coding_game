import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,runCommand,act,projectFiles,clone} from './engine.ts';
import {runSetupStep,setupReadiness} from './setup.ts';
import {currentTask} from './workflow.ts';

function accepted(){let state=act(createGame(),{type:'read-message',id:'welcome'});state=act(state,{type:'accept'});return act(state,{type:'discover',what:'repo'});}

test('three player steps run validated commands without changing puzzle files',()=>{
 let state=accepted();const before=JSON.stringify(state);
 const copied=runSetupStep(state,'copy');assert.equal(JSON.stringify(state),before);assert.equal(copied.error,false);assert.ok(copied.commands.some(c=>c.startsWith('git clone ')));
 state=copied.state;const files=clone(projectFiles(state));assert.equal(setupReadiness(state).copied,true);assert.equal(setupReadiness(state).prepared,false);
 const prepared=runSetupStep(state,'prepare');assert.equal(prepared.error,false);assert.deepEqual(prepared.commands,['sudo apt update','sudo apt install nodejs npm','cd "/home/dev/menu-site"','npm install']);state=prepared.state;
 assert.equal(setupReadiness(state).prepared,true);assert.equal(setupReadiness(state).preview,false);
 const preview=runSetupStep(state,'preview');assert.deepEqual(preview.commands,['npm run dev']);state=preview.state;
 assert.equal(setupReadiness(state).ready,true);assert.deepEqual(projectFiles(state),files);assert.equal(currentTask(state).id,'inspect');
 for(const step of ['copy','prepare','preview'] as const)assert.deepEqual(runSetupStep(state,step).commands,[],'replaying '+step+' is a no-op');
});

test('readiness is derived from terminal actions, and missing steps return to Computer',()=>{
 let state=accepted();assert.equal(currentTask(state).id,'setup');assert.equal(currentTask(state).app,'computer');
 for(const command of ['git clone https://cathub.dev/mono/menu-site.git','sudo apt update','sudo apt install nodejs npm','cd menu-site','npm install','npm run dev'])state=runCommand(state,command).state;
 assert.equal(setupReadiness(state).ready,true);assert.equal(currentTask(state).id,'inspect');
 state=runCommand(state,'pkill node').state;assert.equal(setupReadiness(state).preview,false);assert.equal(currentTask(state).id,'setup');
 state=runSetupStep(state,'preview').state;state.machines.local.tools=state.machines.local.tools.filter(t=>t!=='nodejs');assert.equal(setupReadiness(state).prepared,false);assert.equal(currentTask(state).id,'setup');
 state=runSetupStep(state,'prepare').state;assert.equal(setupReadiness(state).ready,true);
 state.machines.local.dependencies=[];assert.equal(setupReadiness(state).ready,false);assert.equal(currentTask(state).id,'setup');
});

test('setup recovers local cwd and machine, including a custom project root',()=>{
 let state=accepted();state.serverReady=true;state=runCommand(state,'mkdir "other folder"').state;state=runCommand(state,'cd "other folder"').state;state=runCommand(state,'ssh dev@mono-server').state;
 const copied=runSetupStep(state,'copy');assert.deepEqual(copied.commands.slice(0,2),['exit','cd "/home/dev"']);assert.equal(copied.state.repo!.root,'/home/dev/menu-site');
 state=accepted();state=runCommand(state,'git clone https://cathub.dev/mono/menu-site.git "custom folder"').state;state.serverReady=true;state=runCommand(state,'ssh dev@mono-server').state;
 const prepared=runSetupStep(state,'prepare');assert.equal(prepared.error,false);assert.equal(prepared.commands[0],'exit');assert.equal(prepared.state.machines.local.cwd,'/home/dev/custom folder');
 assert.equal(runSetupStep(prepared.state,'preview').readiness.ready,true);
});

test('each button respects prerequisites and engine failures stay failures',()=>{
 const empty=accepted();assert.deepEqual(runSetupStep(empty,'prepare').commands,[]);assert.deepEqual(runSetupStep(empty,'preview').commands,[]);
 let state=runSetupStep(empty,'copy').state;assert.deepEqual(runSetupStep(state,'preview').commands,[]);
 state=act(state,{type:'edit',path:'package.json',content:'broken'});const result=runSetupStep(state,'prepare');assert.equal(result.error,true);assert.match(result.output,/EJSONPARSE/);assert.equal(result.readiness.prepared,false);assert.equal(result.readiness.preview,false);assert.equal(result.commands.at(-1),'npm install');
 let occupied=runCommand(empty,'mkdir menu-site').state;const copy=runSetupStep(occupied,'copy');assert.equal(copy.error,true);assert.equal(copy.readiness.copied,false);assert.equal(occupied.repo,null);
});

test('wrong-root frontend is stopped and restarted for this project',()=>{
 let state=runSetupStep(runSetupStep(accepted(),'copy').state,'prepare').state;
 state.machines.local.processes.frontend=true;state.machines.local.frontendRoot='/home/dev/another-project';
 assert.equal(setupReadiness(state).preview,false);const result=runSetupStep(state,'preview');assert.deepEqual(result.commands,['pkill node','npm run dev']);assert.equal(result.readiness.ready,true);
});

test('request and repository discovery remain ahead of novice setup',()=>{
 let state=createGame();assert.equal(currentTask(state).id,'message');state=act(state,{type:'read-message',id:'welcome'});state=act(state,{type:'accept'});assert.equal(currentTask(state).id,'repo');assert.equal(currentTask(state).app,'browser');
 state=act(state,{type:'discover',what:'repo'});assert.equal(currentTask(state).id,'setup');
});
