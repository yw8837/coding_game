import test from 'node:test';
import assert from 'node:assert/strict';
import {act,createGame,runCommand,type GameState} from './engine.ts';
import {PYTHON_JOBS,SQL_JOBS,opsFolder,opsDataFiles} from './ops-content.ts';
import {opsPathReadOnly} from './ops.ts';
import {LAB_JOBS} from './code-lab.ts';
import {labSourcePath,labInputPath} from './code-lab-terminal.ts';
import {defaultWorkContext,visibleWorkContext,workContextForFile,workGuide,workCommandSeen} from './work-context.ts';

function opened():GameState{const s=createGame();s.completed=[0,1,2];s.mission=2;return act(s,{type:'celebrate-opening'});}
function accepted(){const job=PYTHON_JOBS[0],s=act(opened(),{type:'ops-accept',id:job.id});return {s,job,folder:opsFolder(job),context:{kind:'ops' as const,id:job.id}};}
test('selected optional job supplies its own target and accept action without changing campaign state',()=>{
 const s=opened(),before=JSON.stringify(s),context=defaultWorkContext(s,'python');
 assert.deepEqual(context,{kind:'ops',id:PYTHON_JOBS[0].id});
 const guide=workGuide(s,context)!;
 assert.deepEqual(guide.title,PYTHON_JOBS[0].title);
 assert.deepEqual(guide.action,{kind:'accept',id:PYTHON_JOBS[0].id});
 assert.equal(guide.file,opsFolder(PYTHON_JOBS[0])+'/'+PYTHON_JOBS[0].main);
 assert.equal(JSON.stringify(s),before);
});
test('local return precedes tool setup and folder entry',()=>{
 const {s,context,folder}=accepted();s.machine='server';
 assert.deepEqual(workGuide(s,context)!.action,{kind:'queue',command:'exit'});
 s.machine='local';s.machines.local.updated=false;
 assert.deepEqual(workGuide(s,context)!.action,{kind:'queue',command:'sudo apt update'});
 s.machines.local.updated=true;
 assert.deepEqual(workGuide(s,context)!.action,{kind:'queue',command:'sudo apt install python3'});
 s.machines.local.tools.push('python3');
 assert.deepEqual(workGuide(s,context)!.action,{kind:'queue',command:'cd '+folder});
});
test('data inspection leads to the correct file, changed source leads to run, and failed source leads back to editing',()=>{
 const {s,job,context,folder}=accepted();s.machines.local.tools.push('python3');s.machines.local.cwd=folder;
 const data=opsDataFiles(job)[0],path=folder+'/'+job.main;
 assert.deepEqual(workGuide(s,context)!.action,{kind:'queue',command:'cat '+data});
 let next=runCommand(s,'cat '+data).state;
 assert.deepEqual(workGuide(next,context)!.action,{kind:'file',path});
 next=act(next,{type:'genericfile-edit',path,content:job.reference});
 assert.deepEqual(workGuide(next,context)!.action,{kind:'queue',command:'python3 '+job.main});
 next=runCommand(next,'python3 '+job.main).state;
 assert.deepEqual(workGuide(next,context)!.action,{kind:'app',app:'python'});
 next=act(next,{type:'genericfile-edit',path,content:job.reference+'\n'});
 assert.deepEqual(workGuide(next,context)!.action,{kind:'queue',command:'python3 '+job.main});
 next=act(next,{type:'genericfile-edit',path,content:job.files[job.main]});
 next=runCommand(next,'python3 '+job.main).state;
 assert.deepEqual(workGuide(next,context)!.action,{kind:'file',path});
});
test('missing source offers restoration rather than a command against a missing file',()=>{
 const {s,context,folder,job}=accepted();delete s.machines.local.files[folder+'/'+job.main];
 assert.deepEqual(workGuide(s,context)!.action,{kind:'restore',id:job.id});
});
test('same query.sql name from another SQL job cannot mark this job as opened or inspected',()=>{
 const s=opened(),first=SQL_JOBS[0],second=SQL_JOBS[1];
 s.history=[{machine:'local',cwd:opsFolder(first),command:'code query.sql',output:'',error:false}];
 assert.equal(workCommandSeen(s,opsFolder(first),command=>command==='code query.sql'),true);
 assert.equal(workCommandSeen(s,opsFolder(second),command=>command==='code query.sql'),false);
 s.history.push({machine:'local',cwd:opsFolder(second),command:'code query.sql',output:'',error:false});
 assert.equal(workCommandSeen(s,opsFolder(second),command=>command==='code query.sql'),true);
});
test('Ops target survives editor and terminal switches, while unrelated app and files use campaign guidance',()=>{
 const job=PYTHON_JOBS[0],context={kind:'ops' as const,id:job.id},path=opsFolder(job)+'/'+job.main;
 assert.deepEqual(visibleWorkContext(context,'terminal'),context);
 assert.deepEqual(visibleWorkContext(null,'editor',path),context);
 assert.deepEqual(visibleWorkContext(context,'python'),context);
 assert.equal(visibleWorkContext(context,'career'),null);
 assert.equal(visibleWorkContext(context,'editor','/home/dev/unrelated.js'),null);
 assert.equal(visibleWorkContext(context,'sql'),null);
});
test('Ops data is identified as read only and editor navigation still knows the owning job',()=>{
 const {s,job,folder}=accepted(),dataPath=folder+'/'+opsDataFiles(job)[0],source=s.machines.local.files[dataPath];
 assert.equal(opsPathReadOnly(dataPath),true);
 assert.equal(opsPathReadOnly(folder+'/'+job.main),false);
 assert.deepEqual(workContextForFile(dataPath),{kind:'ops',id:job.id});
 const next=act(s,{type:'genericfile-edit',path:dataPath,content:'wrong dataset'});
 assert.equal(next.machines.local.files[dataPath],source);
});
test('selected code lab job keeps its own file and run action, including after a previous proof becomes stale',()=>{
 const s=opened(),job=LAB_JOBS[3],context={kind:'lab' as const,id:job.id};
 assert.equal(workGuide(s,context)!.file,labSourcePath(job.id));
 assert.deepEqual(workGuide(s,context)!.action,{kind:'lab-run',id:job.id});
 let next=act(s,{type:'lab-draft',id:job.id,source:job.solution});next=act(next,{type:'lab-run',id:job.id});
 assert.deepEqual(workGuide(next,context)!.action,{kind:'app',app:'challenges'});
 next=act(next,{type:'lab-draft',id:job.id,source:job.starter});
 assert.deepEqual(workGuide(next,context)!.action,{kind:'lab-run',id:job.id});
 assert.deepEqual(workContextForFile(labSourcePath(job.id)),context);
});
test('locked optional tracks and unknown job contexts do not override campaign guidance',()=>{
 const s=createGame();
 assert.equal(defaultWorkContext(s,'python'),null);
 assert.equal(workGuide(s,{kind:'ops',id:PYTHON_JOBS[0].id}),null);
 assert.equal(workGuide(opened(),{kind:'ops',id:'missing-job'}),null);
});

test('missing lab source sends the player to restore rather than offering a false run',()=>{
 const s=opened(),job=LAB_JOBS[0],context={kind:'lab' as const,id:job.id};
 s.machines.local.files[labInputPath(job.id)]='{}';
 assert.deepEqual(workGuide(s,context)!.action,{kind:'app',app:'challenges'});
 assert.ok(workGuide(s,context)!.detail.en.includes('missing'));
});
