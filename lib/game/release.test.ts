import test from 'node:test';
import assert from 'node:assert/strict';
import {act,createGame,runCommand,type GameState} from './engine.ts';
import {CAREER_JOBS} from './career-content.ts';
import {exampleSolution} from './career-evaluation.ts';
import {readSave,writeSave} from './save.ts';
import {RELEASE_ROOT,RELEASE_LEGACY_EXAMPLE,RELEASE_FILES,RELEASE_START_FILES,RELEASE_EXAMPLE,createRelease,releaseFiles,evaluateRelease,releaseUnlocked,releaseFresh,releaseBuildFresh,releaseHash,simulateReleaseRequest} from './release.ts';

function unlocked():GameState{
 let s=createGame();s.completed=[0,1,2];s.mission=2;s=act(s,{type:'celebrate-opening'});
 for(const job of CAREER_JOBS){s=act(s,{type:'career-accept',id:job.id});s=act(s,{type:'career-inspect',id:job.id});for(const [file,content] of Object.entries(exampleSolution(job.id)))s=act(s,{type:'career-edit',id:job.id,file,content});s=act(s,{type:'career-test',id:job.id});s=act(s,{type:'career-deliver',id:job.id,choice:'care'});}
 return s;
}
function edited():GameState{let s=act(unlocked(),{type:'career-release-start'});for(const [file,content] of Object.entries(RELEASE_EXAMPLE))s=act(s,{type:'career-release-edit',file,content});return s;}
function published():GameState{return act(act(act(edited(),{type:'career-release-test'}),{type:'career-release-build'}),{type:'career-release-publish'});}

test('release evaluator derives four conditions and a safe current preview',()=>{
 const initial=evaluateRelease(RELEASE_FILES);assert.equal(initial.passed,false);assert.equal(initial.checks.length,4);assert.equal(initial.preview.title,'Untitled');assert.equal(initial.preview.width,'960px');
 const fixed=evaluateRelease(RELEASE_EXAMPLE);assert.equal(fixed.passed,true);assert.equal(fixed.preview.apiReady,true);assert.equal(fixed.preview.storageReady,true);assert.equal(fixed.preview.width,'100%');
 for(const check of fixed.checks)for(const lang of ['ko','en','ja'] as const)assert.ok(check.title[lang]);
 const named={...RELEASE_EXAMPLE,'index.html':'<h1>나의 작은 도서관 📚</h1>'};assert.equal(evaluateRelease(named).preview.title,'나의 작은 도서관 📚');assert.equal(evaluateRelease(named).passed,true);
 assert.notEqual(releaseHash({...named,'index.html':'<h1>😀</h1>'}),releaseHash({...named,'index.html':'<h1>😁</h1>'}));
 const alternative={...RELEASE_EXAMPLE,'style.css':'.portal { width: 100.0%; }','server.json':'{"saveRequests":true,"route":"/api/places"}'};assert.equal(evaluateRelease(alternative).passed,true);
});

test('malformed, active, missing and oversized release source fails without execution',()=>{
 const bad:Record<string,string>[]=[{}, {...RELEASE_EXAMPLE,'index.html':'<h1>Untitled</h1>'},{...RELEASE_EXAMPLE,'index.html':'<h1></h1>'},{...RELEASE_EXAMPLE,'index.html':'<h1>'+ 'a'.repeat(41)+'</h1>'},{...RELEASE_EXAMPLE,'index.html':'<h1 onclick="alert(1)">Mine</h1>'},{...RELEASE_EXAMPLE,'index.html':'<script>throw 1</script><h1>Mine</h1>'},{...RELEASE_EXAMPLE,'style.css':'.portal {width: 100%; background: url(https://invalid.test)}'},{...RELEASE_EXAMPLE,'server.json':'{"route":"/api/places","saveRequests":"true"}'},{...RELEASE_EXAMPLE,'server.json':'null'},{...RELEASE_EXAMPLE,'server.json':'{'},{...RELEASE_EXAMPLE,'index.html':'x'.repeat(20001)},{...RELEASE_EXAMPLE,'../../escape':'x'}];
 for(const files of bad){const before=JSON.stringify(files);const result=evaluateRelease(files);assert.equal(result.passed,false);assert.equal(result.checks.length,4);assert.equal(JSON.stringify(files),before);}
});

test('request demo shares the evaluator route and storage model',()=>{
 assert.deepEqual(simulateReleaseRequest(RELEASE_FILES,'Please help'),{status:404,stored:false});
 assert.deepEqual(simulateReleaseRequest(RELEASE_EXAMPLE,'Please help'),{status:200,stored:true});
 assert.deepEqual(simulateReleaseRequest(RELEASE_EXAMPLE,'  '),{status:200,stored:false});
 assert.deepEqual(simulateReleaseRequest({...RELEASE_EXAMPLE,'server.json':'{"route":"/api/places","saveRequests":false}'},'Please help'),{status:200,stored:false});
 assert.deepEqual(simulateReleaseRequest({...RELEASE_EXAMPLE,'server.json':'{"route":"/places","saveRequests":true}'},'Please help'),{status:404,stored:false});
});

test('release actions remain locked until OPEN and all deliveries, start preserves edits',()=>{
 let s=createGame();assert.equal(releaseUnlocked(s),false);const actions=[{type:'career-release-start'},{type:'career-release-edit',file:'index.html',content:'<h1>Mine</h1>'},{type:'career-release-test'},{type:'career-release-build'},{type:'career-release-publish'}] as const;
 for(const action of actions)s=act(s,action);assert.deepEqual(s.gameplay.career.release,createRelease());assert.deepEqual(releaseFiles(s),{});
 const incomplete=unlocked();incomplete.gameplay.career.completed=incomplete.gameplay.career.completed.filter(id=>!CAREER_JOBS.filter(job=>job.act===3).slice(3).some(job=>job.id===id));assert.equal(releaseUnlocked(incomplete),false);assert.equal(act(incomplete,{type:'career-release-start'}).gameplay.career.release.started,false);
 s=unlocked();assert.equal(releaseUnlocked(s),true);assert.equal(act(s,{type:'career-ending'}).gameplay.career.ending,null);
 s=act(s,{type:'career-release-start'});assert.deepEqual(releaseFiles(s),RELEASE_START_FILES);s=act(s,{type:'career-release-edit',file:'index.html',content:'<h1>Mine</h1>'});const files=releaseFiles(s);s=act(s,{type:'career-release-start'});assert.deepEqual(releaseFiles(s),files);
 for(const file of ['../index.html','/index.html','__proto__','new.js']){s=act(s,{type:'career-release-edit',file,content:'bad'});assert.deepEqual(releaseFiles(s),files);}s=act(s,{type:'career-release-edit',file:'index.html',content:'x'.repeat(20001)});assert.deepEqual(releaseFiles(s),files);
});

test('build and publish require fresh current passing proof and build',()=>{
 let forged=act(unlocked(),{type:'career-release-start'});forged.gameplay.career.release.proof={hash:releaseHash(releaseFiles(forged)),passed:true};forged=act(forged,{type:'career-release-build'});assert.equal(forged.gameplay.career.release.build,null);assert.throws(()=>readSave(JSON.stringify(forged)));
 let s=edited();s=act(s,{type:'career-release-build'});s=act(s,{type:'career-release-publish'});assert.equal(s.gameplay.career.release.build,null);assert.equal(s.gameplay.career.release.published,null);
 s=act(s,{type:'career-release-test'});assert.equal(releaseFresh(s),true);s=act(s,{type:'career-release-publish'});assert.equal(s.gameplay.career.release.published,null);
 s=act(s,{type:'career-release-build'});assert.equal(releaseBuildFresh(s),true);s=act(s,{type:'career-release-edit',file:'index.html',content:'<h1>Changed title</h1>'});assert.equal(s.gameplay.career.release.proof,null);assert.equal(s.gameplay.career.release.build,null);s=act(s,{type:'career-release-publish'});assert.equal(s.gameplay.career.release.published,null);
 s=act(s,{type:'career-release-test'});s=act(s,{type:'career-release-build'});s.machines.local.files['/home/dev/wrong.css']='.portal { width: 110%; }';s=runCommand(s,`cp /home/dev/wrong.css ${RELEASE_ROOT}/style.css`).state;assert.equal(releaseFresh(s),false);assert.equal(releaseBuildFresh(s),false);s=act(s,{type:'career-release-publish'});assert.equal(s.gameplay.career.release.published,null);
 s=act(s,{type:'career-release-test'});assert.equal(s.gameplay.career.release.proof?.passed,false);assert.doesNotThrow(()=>readSave(JSON.stringify(s)));
});

test('publish records 1.0.0, pays nothing twice, survives reload and permits ending',()=>{
 let s=published();const r=s.gameplay.career.release;assert.equal(r.published?.version,'1.0.0');assert.equal(r.published?.hash,releaseHash(releaseFiles(s)));const before=JSON.stringify(r),credits=s.credits,xp=s.xp;
 s=readSave(JSON.stringify(s));s=act(s,{type:'career-release-publish'});s=act(s,{type:'career-release-start'});s=act(s,{type:'career-release-test'});s=act(s,{type:'career-release-build'});s=act(s,{type:'career-release-edit',file:'index.html',content:'<h1>Oops</h1>'});assert.equal(JSON.stringify(s.gameplay.career.release),before);assert.equal(s.credits,credits);assert.equal(s.xp,xp);
 s=act(s,{type:'career-ending'});assert.equal(s.gameplay.career.ending,'community');assert.doesNotThrow(()=>readSave(JSON.stringify(s)));
});

test('published files reject terminal mutations and retain read/copy access',()=>{
 const s=published();for(const command of [`mv ${RELEASE_ROOT}/index.html /home/dev/removed.html`,`cp /home/dev/welcome.txt ${RELEASE_ROOT}/index.html`,`cp /home/dev/welcome.txt ${RELEASE_ROOT}`,`touch ${RELEASE_ROOT}/new.json`,`mkdir -p ${RELEASE_ROOT}/extra`,`cp /home/dev/welcome.txt ${RELEASE_ROOT}/../launch/style.css`]){const result=runCommand(s,command);assert.equal(result.error,true,command);assert.deepEqual(result.state.machines,s.machines);}
 assert.equal(runCommand(s,`cat ${RELEASE_ROOT}/index.html`).error,false);assert.equal(runCommand(s,`cp ${RELEASE_ROOT}/index.html /home/dev/experiment.html`).error,false);
});

test('generic cafe editor cannot bypass publication protection when launch is inside the repository',()=>{
 const cloned=runCommand(createGame(),'git clone https://cathub.dev/mono/menu-site.git /home/dev/studio').state;
 let s=act(act(edited(),{type:'career-release-test'}),{type:'career-release-build'});s.repo=cloned.repo;s.machines.local.files={...cloned.machines.local.files,...s.machines.local.files};
 s=act(s,{type:'edit',path:'launch/index.html',content:'<h1>Changed in generic editor</h1>'});assert.equal(releaseFresh(s),false);assert.equal(s.gameplay.career.release.build,null);
 s=act(act(act(s,{type:'career-release-test'}),{type:'career-release-build'}),{type:'career-release-publish'});const before=releaseFiles(s);s=act(s,{type:'edit',path:'launch/index.html',content:'<h1>Oops</h1>'});assert.deepEqual(releaseFiles(s),before);assert.equal(s.gameplay.career.release.published?.version,'1.0.0');
});

test('save rejects forged publication, wrong hash/version, invalid source and skipped stages',()=>{
 const original=published();const mutate=[(s:GameState)=>{s.gameplay.career.release.published!.hash='wrong';},(s:GameState)=>{s.gameplay.career.release.build=null;},(s:GameState)=>{s.gameplay.career.release.proof=null;},(s:GameState)=>{s.gameplay.career.release.started=false;},(s:GameState)=>{s.machines.local.files[RELEASE_ROOT+'/server.json']='{}';},(s:GameState)=>{s.gameplay.career.release.published!.version='2.0.0' as '1.0.0';}];
 for(const change of mutate){const s=structuredClone(original);change(s);assert.throws(()=>readSave(JSON.stringify(s)));assert.throws(()=>writeSave({setItem(){}},s));}
 const locked=createGame();locked.gameplay.career.release={formatRevision:2,started:true,proof:{hash:'x',passed:true},build:{hash:'x',version:'1.0.0'},published:{hash:'x',version:'1.0.0'}};assert.throws(()=>readSave(JSON.stringify(locked)));
});

test('legacy endings remain intact without forging a completed release',()=>{
 const legacy=unlocked();legacy.gameplay.career.ending='community';const raw=JSON.parse(JSON.stringify(legacy));delete raw.gameplay.career.release;let s=readSave(JSON.stringify(raw));assert.equal(s.gameplay.career.ending,'community');assert.deepEqual(s.gameplay.career.release,createRelease());assert.equal(releaseUnlocked(s),true);
 s=act(s,{type:'career-release-start'});assert.equal(s.gameplay.career.release.started,true);assert.equal(s.gameplay.career.ending,'community');
});

test('historical three-file publications survive reload without adding personal data or changing their hash',()=>{
 let s=edited();delete s.machines.local.files[RELEASE_ROOT+'/project.json'];s.gameplay.career.release.formatRevision=1;
 s=act(act(act(s,{type:'career-release-test'}),{type:'career-release-build'}),{type:'career-release-publish'});
 assert.equal(Object.keys(releaseFiles(s)).length,3);const hash=s.gameplay.career.release.published?.hash;
 assert.equal(hash,'6b70b97f7dfad911');const restored=readSave(JSON.stringify(s));
 assert.equal(restored.gameplay.career.release.published?.hash,hash);assert.equal(Object.keys(releaseFiles(restored)).length,3);assert.equal(releaseFresh(restored),true);
});


test('new format retains personal content requirement after project.json is removed',()=>{
 let s=edited();assert.equal(s.gameplay.career.release.formatRevision,2);delete s.machines.local.files[RELEASE_ROOT+'/project.json'];
 s=act(s,{type:'career-release-test'});assert.equal(s.gameplay.career.release.proof?.passed,false);assert.equal(releaseFresh(s),false);
 s=act(act(s,{type:'career-release-build'}),{type:'career-release-publish'});assert.equal(s.gameplay.career.release.published,null);
});

test('old unstarted saves create a new format project while already started legacy projects stay unchanged',()=>{
 const old=unlocked();old.gameplay.career.release.formatRevision=1;
 let started=act(readSave(JSON.stringify(old)),{type:'career-release-start'});assert.equal(started.gameplay.career.release.formatRevision,2);
 for(const [file,content] of Object.entries(RELEASE_LEGACY_EXAMPLE))started=act(started,{type:'career-release-edit',file,content});
 started=runCommand(started,'rm '+RELEASE_ROOT+'/project.json').state;
 assert.equal(act(started,{type:'career-release-test'}).gameplay.career.release.proof?.passed,false);
 const legacy=edited();legacy.gameplay.career.release.formatRevision=1;delete legacy.machines.local.files[RELEASE_ROOT+'/project.json'];
 assert.deepEqual(act(legacy,{type:'career-release-start'}).gameplay.career.release,legacy.gameplay.career.release);
 assert.deepEqual(releaseFiles(act(legacy,{type:'career-release-start'})),releaseFiles(legacy));
});
