import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,runCommand} from './engine.ts';
import {exampleSolution} from './career-evaluation.ts';
import {readSave} from './save.ts';
test('an extra terminal note cannot poison a purchased checkpoint or autosave',()=>{
 let s=createGame();s.gameplay.openingCelebrated=true;s.completed=[0,1,2];s.mission=2;s.credits=500;
 s=act(s,{type:'career-accept',id:'bakery-price'});s=act(s,{type:'career-upgrade',id:'recovery-kit'});
 s=runCommand(s,'touch /home/dev/jobs/bakery-price/notes.txt').state;
 s=act(s,{type:'career-checkpoint',id:'bakery-price'});
 assert.deepEqual(Object.keys(s.gameplay.career.checkpoints['bakery-price']),['pricing.json']);
 assert.doesNotThrow(()=>readSave(JSON.stringify(s)));
});
test('delivered job files remain readable and copyable but cannot be moved or overwritten',()=>{
 let s=createGame();s.gameplay.openingCelebrated=true;s.completed=[0,1,2];s.mission=2;
 const id='bakery-price',root='/home/dev/jobs/'+id;
 s=act(s,{type:'career-accept',id});s=act(s,{type:'career-inspect',id});
 for(const [file,content] of Object.entries(exampleSolution(id)))s=act(s,{type:'career-edit',id,file,content});
 s=act(s,{type:'career-test',id});s=act(s,{type:'career-deliver',id,choice:'care'});
 s=runCommand(s,`cp ${root}/pricing.json /home/dev/scratch.json`).state;
 for(const command of [`mv ${root}/pricing.json /home/dev/removed.json`,`cp /home/dev/scratch.json ${root}/pricing.json`,`cp /home/dev/scratch.json ${root}`,`touch ${root}/new.json`,`mkdir ${root}/extra`]){
  const result=runCommand(s,command);assert.equal(result.error,true,command);assert.deepEqual(result.state.machines.local.files,s.machines.local.files);assert.deepEqual(result.state.machines.local.dirs,s.machines.local.dirs);
 }
 assert.equal(runCommand(s,`cat ${root}/pricing.json`).error,false);
 assert.equal(runCommand(s,`cp ${root}/pricing.json /home/dev/experiment.json`).error,false);
});
