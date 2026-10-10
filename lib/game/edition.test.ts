import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,runCommand,projectFiles,sourceHash,runCodeChecks,apiRequest,type GameState,type Action} from './engine.ts';
import {assist} from './assisted.ts';
import {editionAllowsApp,editionAllowsPath,editionAllowsProject,isDemoComplete,DEMO_LOCKED_MESSAGE} from './edition.ts';
import {CAREER_JOBS} from './career-content.ts';
import {exampleSolution} from './career-evaluation.ts';
import {LAB_JOBS} from './code-lab.ts';
import {RELEASE_EXAMPLE,RELEASE_ROOT} from './release.ts';
import {readSave,writeSave} from './save.ts';
import {currentTask} from './workflow.ts';
import {questProgress} from './quest-progress.ts';

function afterCafe():GameState{const s=createGame();s.completed=[0,1,2];s.mission=2;return act(s,{type:'celebrate-opening'});}
function fullSave():GameState{
 let s=afterCafe();s=runCommand(s,'sudo apt update').state;s=runCommand(s,'sudo apt install nodejs npm').state;
 for(const job of CAREER_JOBS){
  s=act(s,{type:'career-accept',id:job.id});s=act(s,{type:'career-inspect',id:job.id});
  for(const [file,content] of Object.entries(exampleSolution(job.id)))s=act(s,{type:'career-edit',id:job.id,file,content});
  s=act(s,{type:'career-test',id:job.id});s=act(s,{type:'career-deliver',id:job.id,choice:'care'});
 }
 s=act(s,{type:'career-release-start'});
 for(const [file,content] of Object.entries(RELEASE_EXAMPLE))s=act(s,{type:'career-release-edit',file,content});
 s=act(act(s,{type:'career-release-test'}),{type:'career-release-build'});
 s=act(s,{type:'lab-workspace',id:'receipt'});
 s=act(s,{type:'lab-draft',id:'receipt',source:LAB_JOBS[0].solution});s=act(s,{type:'lab-run',id:'receipt'});
 s=act(s,{type:'practice-submit',id:'total',answer:'price * quantity'});
 s.machines.local.cwd='/home/dev';
 return readSave(JSON.stringify(s));
}
function unchangedContent(before:GameState,after:GameState){
 assert.deepEqual(after.gameplay,before.gameplay);assert.deepEqual(after.machines,before.machines);
 assert.deepEqual(after.repo,before.repo);assert.equal(after.credits,before.credits);assert.equal(after.xp,before.xp);
 assert.deepEqual(after.completed,before.completed);assert.deepEqual(after.tests,before.tests);
}

test('demo app/path policy resolves aliases and traversal without extending partial folder names',()=>{
 for(const root of ['jobs','studio','code-lab']){
  for(const path of [`/home/dev/${root}`,`~/${root}/file`,`../${root}/file`,`/home/dev/menu-site/../${root}//./file`])assert.equal(editionAllowsPath('demo',path,'/home/dev/menu-site'),false,path);
  assert.equal(editionAllowsPath('full',`/home/dev/${root}/file`),true);
 }
 assert.equal(editionAllowsPath('demo','/home/dev/jobs-notes.txt'),true);
 for(const app of ['career','challenges']){assert.equal(editionAllowsApp('demo',app),false);assert.equal(editionAllowsApp('full',app),true);}
 for(const app of ['computer','editor','terminal','messages','workbench','repair','api','server','achievements'])assert.equal(editionAllowsApp('demo',app),true);
});

test('every locked action family preserves imported full save content and rewards',()=>{
 const s=fullSave(),id=CAREER_JOBS[0].id;
 const actions:Action[]=[
  ...['career-accept','career-inspect','career-test','career-checkpoint','career-restore','career-upgrade'].map(type=>({type,id}) as Action),
  {type:'career-code-mode',id,mode:'javascript'},{type:'career-edit',id,file:'index.html',content:'blocked'},
  {type:'career-deliver',id,choice:'care'},{type:'career-ending'},
  ...['career-release-start','career-release-test','career-release-build','career-release-publish'].map(type=>({type}) as Action),
  {type:'career-release-edit',file:'index.html',content:'blocked'},
  ...['lab-run','lab-new-data','lab-audit','lab-workspace'].map(type=>({type,id:'receipt'}) as Action),
  {type:'lab-draft',id:'receipt',source:'blocked'},{type:'lab-audit-draft',id:'receipt',input:'blocked'},
  {type:'practice-submit',id:'total',answer:'price * quantity'},{type:'practice-draft',id:'total',answer:'price + quantity'},
  {type:'genericfile-edit',path:RELEASE_ROOT+'/index.html',content:'blocked'},
 ];
 for(const action of actions){const result=act(s,action,'demo');assert.equal(result.notice,DEMO_LOCKED_MESSAGE,action.type);unchangedContent(s,result);}
 assert.deepEqual(readSave(JSON.stringify(s)),s);
});

test('protected terminal commands cannot read, write or execute full edition workspaces',()=>{
 const s=fullSave(),file=RELEASE_ROOT+'/index.html';
 const commands=[`cd ${RELEASE_ROOT}`,`cat "${file}"`,`code ${file}`,`code -/../studio/launch/index.html`,`ls ~/jobs`,`touch ~/code-lab/extra.js`,
  `mkdir ~/studio/extra`,`cp ${file} ~/copy.html`,`cp ~/welcome.txt ${file}`,`mv ${file} ~/copy.html`,`rm ${file}`,
  `echo changed > ${file}`,`echo changed >> ~/code-lab/receipt.js`,`cat ${file} > ~/copy.html`,
  `cat /home/dev/menu-site/../studio/launch/index.html`,`node --test /home/dev/code-lab/receipt.test.cjs`,
  `node run.cjs receipt.js receipt.input.json`,`node --test /home/dev/jobs/bakery-price/solve.test.cjs`,
  `git clone https://cathub.dev/mono/menu-site ~/studio/copy`,`git add ~/jobs/bakery-price/index.html`];
 for(const command of commands){const result=runCommand(s,command,'demo');assert.equal(result.error,true,command);assert.equal(result.output,DEMO_LOCKED_MESSAGE,command);assert.equal(result.openFile,undefined);unchangedContent(s,result.state);}
 assert.equal(runCommand(s,`cat ${file}`,'full').error,false);
});

test('imported private cwd is preserved and can be exited without damaging release/lab proofs',()=>{
 const s=fullSave();s.machines.local.cwd=RELEASE_ROOT;
 for(const command of ['cat index.html','ls','npm test','git diff','echo changed > index.html','cd -']){
  // cd - is allowed only if no private previous directory is selected; construct one below.
  if(command==='cd -')continue;
  const result=runCommand(s,command,'demo');assert.equal(result.error,true,command);unchangedContent(s,result.state);
 }
 const escaped=runCommand(s,'cd ~','demo');assert.equal(escaped.error,false);assert.equal(escaped.state.machines.local.cwd,'/home/dev');
 assert.deepEqual(escaped.state.gameplay,s.gameplay);assert.deepEqual(escaped.state.machines.local.files,s.machines.local.files);
 for(const command of ['pwd','ls','help','echo café','node --version']){
  const result=runCommand(escaped.state,command,'demo');assert.equal(result.error,false,command);assert.deepEqual(result.state.gameplay,s.gameplay);
  if(command==='ls')assert.doesNotMatch(result.output,/jobs|studio|code-lab/);
  if(command==='help')assert.doesNotMatch(result.output,/LAB |node --test/);
 }
 let stored='';writeSave({setItem:(_,value)=>{stored=value;}},escaped.state);
 const restored=readSave(stored);assert.deepEqual(restored.gameplay,s.gameplay);assert.deepEqual(restored.machines.local.files,s.machines.local.files);
 const prior=fullSave();prior.history.push({command:'cd ~',output:'',error:false,machine:'local',cwd:RELEASE_ROOT});
 assert.equal(runCommand(prior,'cd -','demo').error,true);
});

test('explicit full edition matches default career, practice, lab and terminal behavior',()=>{
 const s=afterCafe();
 for(const action of [{type:'career-accept',id:CAREER_JOBS[0].id},{type:'lab-workspace',id:'receipt'},{type:'practice-submit',id:'total',answer:'price * quantity'}] as Action[])
  assert.deepEqual(act(s,action,'full'),act(s,action));
 const lab=act(s,{type:'lab-workspace',id:'receipt'});
 assert.deepEqual(runCommand(lab,'code /home/dev/code-lab/receipt.js','full'),runCommand(lab,'code /home/dev/code-lab/receipt.js'));
 assert.deepEqual(assist(createGame(),'prepare','full'),assist(createGame(),'prepare'));
 assert.equal(currentTask(s).app,'career');assert.equal(currentTask(s,'demo').id,'demo-complete');
 assert.equal(questProgress(s,'demo').kind,'cafe');assert.equal(questProgress(s).kind,'career');
});

test('resolved copy destinations and imported ancestor repositories cannot expose private content',()=>{
 const s=fullSave();s.machines.local.files['/home/dev/welcome.txt']='public';
 s.machines.local.files['/home/dev/menu-site/studio']='public';s.machines.local.dirs.push('/home/dev/menu-site');
 const copy=runCommand(s,'cp /home/dev/menu-site/studio /home/dev','demo');
 assert.equal(copy.error,true);unchangedContent(s,copy.state);
 assert.equal(editionAllowsProject('demo','/home/dev'),false);
 assert.equal(editionAllowsProject('demo','/home/dev/menu-site'),true);
 const ancestor=assist(createGame(),'prepare');ancestor.repo!.root='/home/dev';
 for(const command of ['git diff','git add .','git commit -m public','git push'])assert.equal(runCommand(ancestor,command,'demo').error,true,command);
 for(const action of [{type:'edit',path:'welcome.txt',content:'blocked'},{type:'request-tests'},{type:'test-result',hash:'x',checks:[]},{type:'open-pr'},{type:'merge-pr'},{type:'deploy'}] as Action[]){
  const result=act(ancestor,action,'demo');assert.equal(result.notice,DEMO_LOCKED_MESSAGE);unchangedContent(ancestor,result);
 }
 const edited=act(s,{type:'genericfile-edit',path:'/home/dev/welcome.txt',content:'edited café note'},'demo');
 assert.equal(edited.machines.local.files['/home/dev/welcome.txt'],'edited café note');assert.deepEqual(edited.gameplay,s.gameplay);
 const reloaded=readSave(JSON.stringify(edited));assert.deepEqual(reloaded.gameplay,s.gameplay);
});

test('all three café chapters and OPEN retain real commands, checks and rewards in demo',()=>{
 let s=assist(createGame(),'prepare','demo');
 s=assist(assist(s,'title-cafe','demo'),'width-fit','demo');
 // Layout is checked by the iframe in the UI; this unit route supplies only that browser evidence.
 s=act(s,{type:'test-result',hash:sourceHash(projectFiles(s)),checks:[0,1,2].map(i=>({name:'browser fixture '+i,passed:true}))},'demo');
 s=assist(s,'publish','demo');s=act(s,{type:'next-mission'},'demo');
 s=assist(s,'multiply','demo');s=act(s,{type:'test-result',hash:sourceHash(projectFiles(s)),checks:runCodeChecks(s)},'demo');
 s=assist(s,'publish','demo');s=act(readSave(JSON.stringify(s)),{type:'next-mission'},'demo');
 s=assist(assist(s,'route-menu','demo'),'keep-orders','demo');s=assist(s,'trial','demo');
 let request=apiRequest(s,'GET','http://mono-server:8000/api/menu','');assert.equal(request.status,200);s=request.state;
 request=apiRequest(s,'POST','http://mono-server:8000/api/orders','{"item":"coffee","quantity":2}');assert.equal(request.status,201);s=request.state;
 s=act(s,{type:'test-result',hash:sourceHash(projectFiles(s)),checks:runCodeChecks(s)},'demo');s=assist(s,'publish','demo');
 assert.deepEqual(s.completed,[0,1,2]);assert.equal(s.credits,1720);assert.equal(s.xp,560);assert.equal(isDemoComplete(s),false);
 s=act(s,{type:'celebrate-opening'},'demo');assert.equal(isDemoComplete(s),true);assert.ok(s.badges.includes('동네 해결사'));
 const again=act(s,{type:'celebrate-opening'},'demo');assert.equal(again.credits,s.credits);assert.deepEqual(again.badges,s.badges);
 assert.equal(currentTask(s,'demo').app,'achievements');assert.equal(questProgress(s,'demo').completed,4);
 assert.equal(act(s,{type:'equip-cosmetic',id:'mint'},'demo').gameplay.equippedCosmetic,'mint');
 assert.deepEqual(s.gameplay.career,createGame().gameplay.career);assert.deepEqual(s.gameplay.lab,createGame().gameplay.lab);
 assert.deepEqual(s.gameplay.practice,createGame().gameplay.practice);assert.equal('edition' in s,false);
});
