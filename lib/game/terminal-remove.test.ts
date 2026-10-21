import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,runCommand,type GameState} from './engine.ts';
import {readSave,writeSave} from './save.ts';
import {terminalCompletions} from './terminal-input.ts';
import {suggestCommand} from './terminal-suggest.ts';
import {OPS_JOBS,opsFolder,opsDataFiles} from './ops-content.ts';

function run(state:GameState,...commands:string[]):GameState{
 for(const command of commands){const result=runCommand(state,command);assert.equal(result.error,false,command+': '+result.output);state=result.state;}
 return state;
}

test('reported Korean folder with trailing slash is removable with rmdir and rm -r',()=>{
 for(const command of ['rmdir 도비님ㅋㅋ','rm -r 도비님ㅋㅋ/']){
  const before=run(createGame(),'mkdir 도비님ㅋㅋ');
  const after=run(before,command);
  assert.ok(!after.machines.local.dirs.includes('/home/dev/도비님ㅋㅋ'));
  assert.ok(before.machines.local.dirs.includes('/home/dev/도비님ㅋㅋ'));
  assert.doesNotMatch(runCommand(after,'ls').output,/도비님/);
  assert.doesNotThrow(()=>writeSave({setItem(){}},after));
  assert.ok(!readSave(JSON.stringify(after)).machines.local.dirs.includes('/home/dev/도비님ㅋㅋ'));
 }
});

test('recursive options delete nested contents without touching similarly named siblings',()=>{
 for(const option of ['-r','-R','-rf','-fr','--recursive','--recursive --force']){
  const before=run(createGame(),'mkdir -p notes/nested notes-keep','echo hi > notes/nested/file.txt','touch notes/.hidden','touch notes-keep/safe');
  const after=run(before,`rm ${option} notes/`);
  assert.ok(!after.machines.local.dirs.some(p=>p==='/home/dev/notes'||p.startsWith('/home/dev/notes/')));
  assert.ok(!Object.keys(after.machines.local.files).some(p=>p.startsWith('/home/dev/notes/')));
  assert.equal(after.machines.local.files['/home/dev/notes-keep/safe'],'');
 }
});

test('rmdir rejects nonempty directories and files; rm requires recursion for directories',()=>{
 const before=run(createGame(),'mkdir notes','touch notes/file');
 for(const [command,message] of [['rmdir notes','Directory not empty'],['rmdir notes/file','Not a directory'],['rm notes','Is a directory'],['rm notes/file/','Not a directory'],['rm -i notes/file','unsupported option']]){
  const result=runCommand(before,command);assert.equal(result.error,true,command);assert.ok(result.output.includes(message),result.output);assert.deepEqual(result.state.machines,before.machines);
 }
 const after=run(before,'rm notes/file','rmdir notes');assert.ok(!after.machines.local.dirs.includes('/home/dev/notes'));
});

test('quoted paths, -- operands, multiple targets and force semantics',()=>{
 let state=run(createGame(),'mkdir "my notes"','mkdir ./-folder','touch a','touch b');
 state=run(state,'rmdir "my notes"','rm -r -- -folder','rm a b','rm -f missing','rm -f');
 assert.equal(runCommand(state,'rm missing').error,true);
 assert.equal(runCommand(state,'rmdir').error,true);
 assert.equal(runCommand(state,'rm').error,true);
 assert.equal(runCommand(state,'rmdir -p missing').error,true);
});

test('root, home, current directory, active repository and reserved workspace cannot be removed',()=>{
 let state=run(createGame(),'git clone https://cathub.dev/mono/menu-site.git','mkdir -p notes/nested','cd notes/nested');
 for(const target of ['/','/home','/home/dev','.','..','/home/dev/menu-site']){
  const result=runCommand(state,`rm -rf ${target}`);assert.equal(result.error,true,target);assert.deepEqual(result.state.machines,state.machines);
 }
 state=run(state,'cd ~','mkdir -p code-lab');
 assert.equal(runCommand(state,'rm -rf code-lab').error,true);
});

test('recursive deletion validates all descendants and all operands before any mutation',()=>{
 const state=run(createGame(),'mkdir -p notes/studio/launch','touch safe','touch notes/studio/launch/index.html');
 // A delivered folder under an otherwise removable parent must stay protected.
 state.machines.local.dirs.push('/home/dev/jobs','/home/dev/jobs/bakery-price');
 state.machines.local.files['/home/dev/jobs/bakery-price/pricing.json']='original';
 state.gameplay.career.completed.push('bakery-price');
 for(const command of ['rm safe missing','rm -rf safe /home/dev/jobs/bakery-price','rm -rf /home/dev/jobs']){
  const result=runCommand(state,command);assert.equal(result.error,true,command);assert.deepEqual(result.state.machines,state.machines);
 }
});

test('server removal stays on the selected virtual machine',()=>{
 const state=run(createGame(),'mkdir notes','touch notes/file');state.machine='server';
 const after=run(state,'mkdir notes','touch notes/file','rm -rf notes');
 assert.equal(after.machines.local.files['/home/dev/notes/file'],'');
 assert.equal(after.machines.server.files['/home/dev/notes/file'],undefined);
});

test('removing an ancestor cannot erase protected job data hidden inside it',()=>{
 const state=run(createGame(),'touch safe');
 const job=OPS_JOBS[0],folder=opsFolder(job),data=folder+'/'+opsDataFiles(job)[0];
 state.machines.local.dirs.push(folder);
 state.machines.local.files[data]='protected source';
 state.machines.local.files[folder+'/scratch.txt']='editable';
 const result=runCommand(state,`rm -rf safe ${folder}`);
 assert.equal(result.error,true);assert.match(result.output,/Read-only/);
 assert.deepEqual(result.state.machines,state.machines);
});

test('demo gates, command suggestions and completion include directory removal',()=>{
 const state=run(createGame(),'mkdir notes','mkdir -p studio/launch','touch studio/launch/file');
 for(const command of ['rmdir studio/launch','rm -rf studio'])assert.equal(runCommand(state,command,'demo').error,true);
 assert.ok(terminalCompletions(state,'rmdir no').includes('rmdir notes/'));
 assert.ok(terminalCompletions(state,'rm -r no').includes('rm -r notes/'));
 assert.equal(suggestCommand('rmdir notes'),null);
 const demo=runCommand(state,'rmdir notes','demo');assert.equal(demo.error,false);
});
