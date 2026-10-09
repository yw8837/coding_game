import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createGame,act,runCommand,type GameState} from './engine.ts';
import {LAB_JOBS,labJob} from './code-lab.ts';
import {LAB_ROOT,LAB_RUNNER,labSourcePath,labInputPath,labTestPath,labTestTemplate,validateLabWorkspace} from './code-lab-terminal.ts';
import {terminalCompletions} from './terminal-input.ts';
import {readSave,writeSave} from './save.ts';
const command=(s:GameState,line:string)=>runCommand(s,line).state;
function workspace(id='receipt'){
 let s=act(createGame(),{type:'lab-workspace',id});for(const line of ['sudo apt update','sudo apt install nodejs','cd '+LAB_ROOT])s=command(s,line);return s;
}
const edit=(s:GameState,path:string,content:string)=>act(s,{type:'genericfile-edit',path,content});

test('workspace creates real local files, preserves edits and opens existing files through code',()=>{
 let s=workspace();assert.ok(s.machines.local.dirs.includes(LAB_ROOT));assert.equal(s.machines.local.files[labSourcePath('receipt')],labJob('receipt')!.starter);
 assert.equal(s.machines.local.files[`${LAB_ROOT}/run.cjs`],LAB_RUNNER);assert.equal(s.gameplay.lab.drafts.receipt,labJob('receipt')!.starter);
 s=edit(s,'receipt.js',labJob('receipt')!.solution);s=edit(s,'receipt.input.json','{"price":10,"quantity":7}');
 s=act(s,{type:'lab-workspace',id:'receipt'});assert.equal(s.machines.local.files[labSourcePath('receipt')],labJob('receipt')!.solution);assert.equal(s.machines.local.files[labInputPath('receipt')],'{"price":10,"quantity":7}');
 assert.equal(runCommand(s,'code receipt.js').openFile,labSourcePath('receipt'));assert.equal(runCommand(s,'code missing.js').error,true);
 assert.ok(terminalCompletions(s,'node run.cjs receipt.js receipt.i').includes('node run.cjs receipt.js receipt.input.json'));
 assert.ok(terminalCompletions(s,'node --test receipt.t').includes('node --test receipt.test.cjs'));assert.ok(terminalCompletions(s,'code receipt.j').includes('code receipt.js'));
});

test('runner reads edited source and actual input JSON with no reward for sample execution',()=>{
 let s=workspace();const credits=s.credits;assert.equal(runCommand(s,'node run.cjs receipt.js receipt.input.json').output,'3003');
 s=edit(s,'receipt.js',labJob('receipt')!.solution);s=edit(s,'receipt.input.json','{"price":10,"quantity":7}');
 const r=runCommand(s,'node run.cjs receipt.js receipt.input.json');assert.equal(r.output,'70');assert.equal(r.error,false);assert.equal(r.state.credits,credits);
 s=edit(s,'receipt.input.json','{"price":10,"quantity":0}');assert.equal(runCommand(s,'node run.cjs receipt.js receipt.input.json').output,'0');
 s=edit(s,'receipt.input.json','{invalid');assert.match(runCommand(s,'node run.cjs receipt.js receipt.input.json').output,/valid JSON/);
 s=edit(s,'receipt.input.json','null');assert.equal(runCommand(s,'node run.cjs receipt.js receipt.input.json').error,true);
});

test('preparing local lab files returns from the server without changing server files',()=>{
 const s=workspace();s.machine='server';const server=structuredClone(s.machines.server);
 const prepared=act(s,{type:'lab-workspace',id:'receipt'});
 assert.equal(prepared.machine,'local');assert.deepEqual(prepared.machines.server,server);
 assert.equal(runCommand(prepared,'cd /home/dev/code-lab').error,false);
});

test('node --test derives wrong/correct outcomes and awards the existing contract once',()=>{
 let s=workspace();const credits=s.credits;let r=runCommand(s,'node --test receipt.test.cjs');assert.equal(r.error,true);assert.match(r.output,/not ok 1/);assert.equal(r.state.credits,credits);
 s=act(r.state,{type:'lab-draft',id:'receipt',source:labJob('receipt')!.solution});assert.equal(s.machines.local.files[labSourcePath('receipt')],labJob('receipt')!.solution);
 r=runCommand(s,'node --test receipt.test.cjs');assert.equal(r.error,false);assert.match(r.output,/# fail 0/);assert.equal(r.state.credits,credits+35);assert.equal(r.state.gameplay.lab.proofs.receipt?.source,labJob('receipt')!.solution);
 s=command(r.state,'node --test receipt.test.cjs');s=act(s,{type:'lab-run',id:'receipt'});assert.equal(s.credits,credits+35);
 assert.doesNotThrow(()=>validateLabWorkspace(s));assert.doesNotThrow(()=>writeSave({setItem(){}},s));assert.equal(readSave(JSON.stringify(s)).gameplay.lab.proofs.receipt?.passed,true);
});

test('copy, echo, rename and missing source synchronize drafts and invalidate proof',()=>{
 let s=workspace();s=edit(s,'receipt.js',labJob('receipt')!.solution);s=command(s,'node --test receipt.test.cjs');assert.ok(s.gameplay.lab.proofs.receipt?.passed);
 s=edit(s,'receipt.input.json','{"price":2,"quantity":3}');assert.ok(s.gameplay.lab.proofs.receipt?.passed);
 s=command(s,`echo 'function solve(input) { return 9; }' > receipt.js`);assert.equal(s.gameplay.lab.proofs.receipt,undefined);assert.equal(s.gameplay.lab.drafts.receipt,s.machines.local.files[labSourcePath('receipt')]);
 s.machines.local.files['/home/dev/fixed.js']=labJob('receipt')!.solution;s=command(s,'cp /home/dev/fixed.js receipt.js');assert.equal(s.gameplay.lab.drafts.receipt,labJob('receipt')!.solution);
 s=command(s,'node --test receipt.test.cjs');s=command(s,'mv receipt.js renamed.js');assert.equal(s.gameplay.lab.drafts.receipt,undefined);assert.equal(s.gameplay.lab.proofs.receipt,undefined);
 assert.match(runCommand(s,'node --test receipt.test.cjs').output,/Missing receipt.js/);assert.doesNotThrow(()=>validateLabWorkspace(s));
 s=command(s,'mv renamed.js receipt.js');assert.equal(s.gameplay.lab.drafts.receipt,labJob('receipt')!.solution);
 const missing=structuredClone(s);delete missing.machines.local.files[labSourcePath('receipt')];assert.throws(()=>validateLabWorkspace(missing),/Missing Lab source/);
 s=command(s,'node --test receipt.test.cjs');s=command(s,'rm receipt.js');assert.equal(s.gameplay.lab.proofs.receipt,undefined);assert.equal(s.gameplay.lab.drafts.receipt,undefined);assert.doesNotThrow(()=>writeSave({setItem(){}},s));
 assert.equal(runCommand(s,'rm -r .').error,true);
});

test('oversized source operations preserve previous files, proofs and restorable saves',()=>{
 let s=workspace();s=edit(s,'receipt.js',labJob('receipt')!.solution);s=command(s,'node --test receipt.test.cjs');const original=s.machines.local.files[labSourcePath('receipt')];
 let bad=edit(s,'receipt.js','x'.repeat(12001));assert.equal(bad.machines.local.files[labSourcePath('receipt')],original);assert.ok(bad.gameplay.lab.proofs.receipt?.passed);
 bad=act(s,{type:'lab-draft',id:'receipt',source:'x'.repeat(12001)});assert.equal(bad.machines.local.files[labSourcePath('receipt')],original);
 s.machines.local.files['/home/dev/huge.js']='x'.repeat(12001);for(const line of ['cp /home/dev/huge.js receipt.js','mv /home/dev/huge.js receipt.js',`echo '${'x'.repeat(12001)}' > receipt.js`]){
  const r=runCommand(s,line);assert.equal(r.error,true);assert.equal(r.state.machines.local.files[labSourcePath('receipt')],original);assert.ok(r.state.gameplay.lab.proofs.receipt?.passed);assert.doesNotThrow(()=>writeSave({setItem(){}},r.state));
 }
 assert.equal(edit(s,'receipt.input.json','x'.repeat(4001)).machines.local.files[labInputPath('receipt')],s.machines.local.files[labInputPath('receipt')]);
});

test('deleting all workspace files in every order never revives draft-only proof or reward',()=>{
 const orders=[['js','input.json','test.cjs'],['js','test.cjs','input.json'],['input.json','js','test.cjs'],['input.json','test.cjs','js'],['test.cjs','js','input.json'],['test.cjs','input.json','js']];
 for(const order of orders){
  let s=workspace();s=edit(s,'receipt.js',labJob('receipt')!.solution);const credits=s.credits;
  for(const suffix of order)s=command(s,'rm receipt.'+suffix);
  assert.deepEqual(s.gameplay.lab.workspaces,['receipt']);assert.equal(s.gameplay.lab.drafts.receipt,undefined);assert.equal(s.gameplay.lab.proofs.receipt,undefined);
  s=readSave(JSON.stringify(s));s=act(s,{type:'lab-run',id:'receipt'});
  assert.match(s.notice,/Missing receipt.js/);assert.equal(s.credits,credits);assert.equal(s.gameplay.lab.proofs.receipt,undefined);
  assert.equal(runCommand(s,'node --test receipt.test.cjs').error,true);
  // Explicit source editing can recreate the file, but cannot bypass missing tests.
  s=act(s,{type:'lab-draft',id:'receipt',source:labJob('receipt')!.solution});assert.equal(s.machines.local.files[labSourcePath('receipt')],labJob('receipt')!.solution);
  s=act(s,{type:'lab-run',id:'receipt'});assert.match(s.notice,/test.cjs is missing/);assert.equal(s.credits,credits);
  s=act(s,{type:'lab-workspace',id:'receipt'});s=act(s,{type:'lab-run',id:'receipt'});assert.equal(s.credits,credits+35);assert.equal(s.gameplay.lab.proofs.receipt?.passed,true);
 }
});

test('older saves recognize actual workspaces and prepared saves reject phantom drafts',()=>{
 const older=JSON.parse(JSON.stringify(workspace()));delete older.gameplay.lab.workspaces;
 let s=readSave(JSON.stringify(older));assert.deepEqual(s.gameplay.lab.workspaces,[]);
 s=edit(s,'receipt.js',labJob('receipt')!.solution);
 for(const file of ['receipt.input.json','receipt.test.cjs','receipt.js'])s=command(s,'rm '+file);
 assert.deepEqual(s.gameplay.lab.workspaces,['receipt']);assert.equal(s.gameplay.lab.drafts.receipt,undefined);
 const phantom=structuredClone(s);phantom.gameplay.lab.drafts.receipt=labJob('receipt')!.solution;
 assert.throws(()=>readSave(JSON.stringify(phantom)),/Missing Lab source/);
 const duplicate=structuredClone(s);duplicate.gameplay.lab.workspaces.push('receipt');assert.throws(()=>readSave(JSON.stringify(duplicate)),/progress/);
 const draftOnly=JSON.parse(JSON.stringify(act(createGame(),{type:'lab-draft',id:'receipt',source:labJob('receipt')!.solution})));delete draftOnly.gameplay.lab.workspaces;
 const legacy=act(readSave(JSON.stringify(draftOnly)),{type:'lab-run',id:'receipt'});assert.equal(legacy.gameplay.lab.proofs.receipt?.passed,true);
});

test('generated runner/test modifications cannot grant pass or retain stale proof',()=>{
 let s=workspace();s=edit(s,'receipt.js',labJob('receipt')!.solution);s=command(s,'node --test receipt.test.cjs');
 const forged=structuredClone(s);forged.machines.local.files[labTestPath('receipt')]='test("always pass", () => {});';assert.throws(()=>validateLabWorkspace(forged),/modified generated/);
 s=edit(s,'receipt.test.cjs','test("always pass", () => {});');assert.equal(s.gameplay.lab.proofs.receipt,undefined);assert.equal(runCommand(s,'node --test receipt.test.cjs').error,true);
 const custom=s.machines.local.files[labTestPath('receipt')];s=act(s,{type:'lab-new-data',id:'receipt'});assert.equal(s.machines.local.files[labTestPath('receipt')],custom);
 const credits=s.credits;s=act(s,{type:'lab-run',id:'receipt'});assert.equal(s.credits,credits);assert.equal(s.gameplay.lab.proofs.receipt,undefined);
 s=edit(s,'receipt.test.cjs',labTestTemplate('receipt',2));s=command(s,'node --test receipt.test.cjs');assert.ok(s.gameplay.lab.proofs.receipt?.passed);
 s=edit(s,'run.cjs','process.exit(0);');assert.equal(s.gameplay.lab.proofs.receipt,undefined);assert.equal(runCommand(s,'node --test receipt.test.cjs').error,true);assert.equal(runCommand(s,'node run.cjs receipt.js receipt.input.json').error,true);
});

test('new data updates only generated test templates and removes old proof',()=>{
 let s=workspace();s=edit(s,'receipt.js',labJob('receipt')!.solution);s=command(s,'node --test receipt.test.cjs');s=act(s,{type:'lab-new-data',id:'receipt'});
 assert.equal(s.machines.local.files[labTestPath('receipt')],labTestTemplate('receipt',2));assert.equal(s.gameplay.lab.proofs.receipt,undefined);assert.equal(runCommand(s,'node --test receipt.test.cjs').error,false);
});

test('node prerequisites, machine boundary and unknown scripts remain explicit failures',()=>{
 let s=act(createGame(),{type:'lab-workspace',id:'receipt'});s=command(s,'cd '+LAB_ROOT);assert.match(runCommand(s,'node run.cjs receipt.js receipt.input.json').output,/command not found/);
 s=workspace();assert.equal(runCommand(s,'node receipt.js').error,true);assert.equal(runCommand(s,'node --test /home/dev/random.test.cjs').error,true);
 s.machines.server.tools.push('nodejs');s.machine='server';assert.match(runCommand(s,'node run.cjs receipt.js receipt.input.json').output,/workstation only/);assert.equal(runCommand(s,'code /home/dev/code-lab/receipt.js').openFile,undefined);
 const previous=s.machines.local.files[labSourcePath('receipt')];assert.equal(edit(s,labSourcePath('receipt'),'changed').machines.local.files[labSourcePath('receipt')],previous);
});

test('generic editor honors existing-file and delivered-career read-only protections',()=>{
 const s=workspace();assert.equal(edit(s,'missing.js','created').machines.local.files[`${LAB_ROOT}/missing.js`],undefined);
 const target='/home/dev/jobs/bakery-price/pricing.json';s.machines.local.files[target]='original';s.gameplay.career.completed.push('bakery-price');assert.equal(edit(s,target,'changed').machines.local.files[target],'original');
 assert.equal(runCommand(s,'rm '+target).error,true);
 // A cafe cloned at LAB_ROOT can expose Lab files through its legacy editor too.
 let nested=command(createGame(),'git clone https://cathub.dev/mono/menu-site.git '+LAB_ROOT);nested=act(nested,{type:'lab-workspace',id:'receipt'});
 const before=nested.machines.local.files[labSourcePath('receipt')];nested=act(nested,{type:'edit',path:'receipt.js',content:'x'.repeat(12001)});assert.equal(nested.machines.local.files[labSourcePath('receipt')],before);
 nested=act(nested,{type:'edit',path:'receipt.js',content:labJob('receipt')!.solution});assert.equal(nested.gameplay.lab.drafts.receipt,labJob('receipt')!.solution);assert.doesNotThrow(()=>validateLabWorkspace(nested));
});

test('portable runner and generated tests execute authored solutions in actual Node',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'codeshift-lab-template-'));
 t.after(async()=>{assert.equal(path.dirname(path.resolve(root)),path.resolve(tmpdir()));assert.ok(path.basename(root).startsWith('codeshift-lab-template-'));await rm(root,{recursive:true,force:true});});
 await writeFile(path.join(root,'run.cjs'),LAB_RUNNER);
 // Only authored reference solutions are executed natively; never player input.
 for(const job of LAB_JOBS){await writeFile(path.join(root,`${job.id}.js`),job.solution);await writeFile(path.join(root,`${job.id}.test.cjs`),labTestTemplate(job.id,1));}
 const env={...process.env};delete env.NODE_TEST_CONTEXT;
 const result=spawnSync(process.execPath,['--test','--test-reporter=tap',...LAB_JOBS.map(job=>`${job.id}.test.cjs`)],{cwd:root,env,encoding:'utf8',timeout:20000});assert.equal(result.status,0,result.stdout+'\n'+result.stderr);assert.match(result.stdout,/# fail 0/);
 await writeFile(path.join(root,'receipt.input.json'),JSON.stringify({price:3,quantity:4}));const sample=spawnSync(process.execPath,['run.cjs','receipt.js','receipt.input.json'],{cwd:root,env,encoding:'utf8',timeout:3000});assert.equal(sample.status,0,sample.stderr);assert.equal(sample.stdout.trim(),'12');
 assert.equal(await readFile(path.join(root,'run.cjs'),'utf8'),LAB_RUNNER);
});
