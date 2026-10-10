import test from 'node:test';
import assert from 'node:assert/strict';
import {act,createGame,runCommand,type GameState} from './engine.ts';
import {CAREER_JOBS} from './career-content.ts';
import {REPO_URL} from './content.ts';
import {exampleSolution} from './career-evaluation.ts';
import {RELEASE_EXAMPLE,RELEASE_LEGACY_EXAMPLE,RELEASE_ROOT,releaseFiles,releaseHash} from './release.ts';
import {readSave,writeSave} from './save.ts';
import {STUDIO_ROOT,STUDIO_MAX_SNAPSHOTS,studioFiles,studioFresh,studioSourceMapValid,studioHasUnsnapshottedChanges} from './studio.ts';

function published(legacy=false):GameState{
 let s=createGame();s.completed=[0,1,2];s.mission=2;s=act(s,{type:'celebrate-opening'});
 for(const job of CAREER_JOBS){s=act(s,{type:'career-accept',id:job.id});s=act(s,{type:'career-inspect',id:job.id});for(const [file,content] of Object.entries(exampleSolution(job.id)))s=act(s,{type:'career-edit',id:job.id,file,content});s=act(s,{type:'career-test',id:job.id});s=act(s,{type:'career-deliver',id:job.id,choice:'care'});}
 s=act(s,{type:'career-release-start'});
 if(legacy){s.gameplay.career.release.formatRevision=1;delete s.machines.local.files[RELEASE_ROOT+'/project.json'];}
 for(const [file,content] of Object.entries(legacy?RELEASE_LEGACY_EXAMPLE:RELEASE_EXAMPLE))s=act(s,{type:'career-release-edit',file,content});
 return act(act(act(s,{type:'career-release-test'}),{type:'career-release-build'}),{type:'career-release-publish'});
}
const start=(legacy=false)=>act(published(legacy),{type:'career-studio-start'});
const checked=(s:GameState)=>act(s,{type:'career-studio-test'});
const snapshot=(s:GameState)=>act(checked(s),{type:'career-studio-snapshot'});

test('reserved studio workspace rejects file and directory creation before an explicit studio start',()=>{
 const locked=createGame(),released=published();
 for(const base of [locked,released]){
  for(const command of [`mkdir -p ${STUDIO_ROOT}`,`mkdir -p ${STUDIO_ROOT}/nested`,`echo before > ${STUDIO_ROOT}`,`echo before > ${STUDIO_ROOT}/index.html`,`touch ${STUDIO_ROOT}`,`touch ${STUDIO_ROOT}/index.html`,`cp /home/dev/welcome.txt ${STUDIO_ROOT}`,`mv /home/dev/welcome.txt ${STUDIO_ROOT}`]){
   const result=runCommand(base,command);assert.equal(result.error,true,command);assert.deepEqual(result.state.machines.local.files,base.machines.local.files);assert.deepEqual(result.state.machines.local.dirs,base.machines.local.dirs);assert.doesNotThrow(()=>readSave(JSON.stringify(result.state)));
  }
 }
});

test('legacy save workbench tree is archived byte for byte with cwd, repo and local process references preserved',()=>{
 const legacy=published();delete legacy.gameplay.career.studio;
 const clone=runCommand(createGame(),'git clone '+REPO_URL).state;assert.ok(clone.repo);
 legacy.repo={...clone.repo,root:STUDIO_ROOT};
 const local=legacy.machines.local,originalFiles={
  [STUDIO_ROOT+'/notes.txt']:'Player notes: '+STUDIO_ROOT+'\n\\\\ quoted "bytes"\n',
  [STUDIO_ROOT+'/nested/unrestricted.js']:'x'.repeat(60000),
  [STUDIO_ROOT+'/'+ 'a'.repeat(300-STUDIO_ROOT.length-1)]:'A maximum-length path',
 };
 Object.assign(local.files,originalFiles);
 local.dirs.push('/home/dev/studio',STUDIO_ROOT,STUDIO_ROOT+'/nested');local.cwd=STUDIO_ROOT+'/nested';
 local.frontendRoot=STUDIO_ROOT;local.backendRoot=STUDIO_ROOT+'/nested';local.backendSource='Original running source';local.dependencies=[STUDIO_ROOT];local.pythonDeps=[STUDIO_ROOT+'/nested'];
 legacy.history.push({command:'cat '+STUDIO_ROOT+'/notes.txt',output:'old output',error:false,machine:'local',cwd:STUDIO_ROOT});
 legacy.machines.server.cwd=STUDIO_ROOT;legacy.machines.server.files[STUDIO_ROOT+'/server-only.txt']='Unrelated server bytes';
 // A colliding archive name stays untouched; choose another free destination.
 local.files['/home/dev/old-studio-1/existing.txt']='Preserve existing archive';local.dirs.push('/home/dev/old-studio-1');
 const originalRelease=releaseFiles(legacy),originalLog=[...legacy.logs],originalServer=structuredClone(legacy.machines.server),raw=JSON.stringify(legacy);
 const migrated=readSave(raw),archive=migrated.repo!.root;assert.equal(archive,'/home/dev/old-studio-2');
 assert.equal(migrated.gameplay.career.studio,null);assert.equal(migrated.machines.local.cwd,archive+'/nested');
 assert.equal(migrated.machines.local.frontendRoot,archive);assert.equal(migrated.machines.local.backendRoot,archive+'/nested');assert.equal(migrated.machines.local.backendSource,'Original running source');
 assert.deepEqual(migrated.machines.local.dependencies,[archive]);assert.deepEqual(migrated.machines.local.pythonDeps,[archive+'/nested']);assert.equal(migrated.history.at(-1)!.cwd,archive);assert.equal(migrated.history.at(-1)!.command,legacy.history.at(-1)!.command);
 for(const [path,bytes] of Object.entries(originalFiles)){const target:string=archive+path.slice(STUDIO_ROOT.length);assert.equal(migrated.machines.local.files[target],bytes);assert.ok(target.length<=300);assert.equal(Object.hasOwn(migrated.machines.local.files,path),false);}
 assert.equal(migrated.machines.local.files['/home/dev/old-studio-1/existing.txt'],'Preserve existing archive');assert.deepEqual(migrated.machines.server,originalServer);assert.deepEqual(migrated.logs.slice(0,originalLog.length),originalLog);assert.match(migrated.notice,/Legacy workspace preserved/);assert.deepEqual(releaseFiles(migrated),originalRelease);
 let saved='';writeSave({setItem:(_key,value)=>{saved=value;}},migrated);const reload=readSave(saved);assert.deepEqual(reload.machines.local,migrated.machines.local);assert.equal(reload.repo!.root,archive);
 const started=act(reload,{type:'career-studio-start'});assert.deepEqual(studioFiles(started),RELEASE_EXAMPLE);for(const [path,bytes] of Object.entries(originalFiles))assert.equal(started.machines.local.files[archive+path.slice(STUDIO_ROOT.length)],bytes);
 assert.equal(JSON.stringify(legacy),raw);
});

test('legacy root-as-file and reference-only workbench saves migrate without becoming studio drafts',()=>{
 for(const shape of ['file','reference'] as const){
  const legacy=createGame();delete legacy.gameplay.career.studio;
  if(shape==='file')legacy.machines.local.files[STUDIO_ROOT]='Old regular file';else legacy.machines.local.cwd=STUDIO_ROOT+'/child';
  const migrated=readSave(JSON.stringify(legacy));assert.equal(migrated.gameplay.career.studio,null);
  if(shape==='file')assert.equal(migrated.machines.local.files['/home/dev/old-studio-1'],'Old regular file');else assert.equal(migrated.machines.local.cwd,'/home/dev/old-studio-1/child');
  assert.doesNotThrow(()=>readSave(JSON.stringify(migrated)));
 }
});

test('studio starts only after publication, copies independent source and never changes release, ending or rewards',()=>{
 assert.equal(act(createGame(),{type:'career-studio-start'}).gameplay.career.studio,null);
 let s=act(published(),{type:'career-ending'});const original={release:structuredClone(s.gameplay.career.release),files:releaseFiles(s),ending:s.gameplay.career.ending,jobs:[...s.gameplay.career.endingJobs],credits:s.credits,xp:s.xp};
 s=act(s,{type:'career-studio-start'});assert.deepEqual(studioFiles(s),original.files);assert.equal(studioFresh(s),false);
 s=act(s,{type:'career-studio-edit',file:'index.html',content:'<h1>My second chapter</h1>'});s=snapshot(s);const edited=studioFiles(s);s=act(s,{type:'career-studio-start'});assert.deepEqual(studioFiles(s),edited);
 assert.deepEqual(releaseFiles(s),original.files);assert.deepEqual(s.gameplay.career.release,original.release);assert.equal(s.gameplay.career.ending,original.ending);assert.deepEqual(s.gameplay.career.endingJobs,original.jobs);assert.equal(s.credits,original.credits);assert.equal(s.xp,original.xp);
 const reload=readSave(JSON.stringify(s));assert.deepEqual(reload.gameplay.career.studio,s.gameplay.career.studio);assert.deepEqual(studioFiles(reload),edited);
});
test('legacy three-file publication migrates only the studio copy to authored project data',()=>{
 const s=start(true),first=releaseFiles(s);assert.equal(Object.hasOwn(first,'project.json'),false);assert.ok(studioFiles(s)['project.json']);assert.equal(studioFresh(checked(s)),true);assert.equal(releaseHash(first),s.gameplay.career.release.published!.hash);assert.deepEqual(releaseFiles(readSave(JSON.stringify(s))),first);
});
test('studio snapshots require fresh passing files, deduplicate, keep five immutable versions with monotone ids',()=>{
 let s=start();s=act(s,{type:'career-studio-snapshot'});assert.equal(s.gameplay.career.studio!.snapshots.length,0);
 s=snapshot(s);assert.equal(studioHasUnsnapshottedChanges(s),false);s=snapshot(s);assert.equal(s.gameplay.career.studio!.snapshots.length,1);
 const first=structuredClone(s.gameplay.career.studio!.snapshots[0]);
 for(let i=2;i<=8;i++){s=act(s,{type:'career-studio-edit',file:'index.html',content:'<h1>Chapter '+i+'</h1>'});assert.equal(studioFresh(s),false);s=snapshot(s);}
 const p=s.gameplay.career.studio!;assert.equal(p.snapshots.length,STUDIO_MAX_SNAPSHOTS);assert.deepEqual(p.snapshots.map(v=>v.id),[4,5,6,7,8]);assert.equal(p.nextId,9);assert.equal(first.files['index.html'],RELEASE_EXAMPLE['index.html']);assert.doesNotThrow(()=>readSave(JSON.stringify(s)));
});
test('restoration rejects silent unsnapshotted loss, canceled work survives; confirmed restoration invalidates checks',()=>{
 let s=snapshot(start());s=act(s,{type:'career-studio-edit',file:'index.html',content:'<h1>Work in progress</h1>'});const working=studioFiles(s);
 assert.deepEqual(studioFiles(act(s,{type:'career-studio-restore',id:1})),working);
 assert.deepEqual(studioFiles(act(s,{type:'career-studio-restore',id:999,confirmLoss:true})),working);
 s=act(s,{type:'career-studio-restore',id:1,confirmLoss:true});assert.deepEqual(studioFiles(s),RELEASE_EXAMPLE);assert.equal(studioFresh(s),false);assert.equal(s.gameplay.career.studio!.proof,null);s=snapshot(s);assert.equal(s.gameplay.career.studio!.snapshots.length,1);
});
test('all direct, generic and terminal source mutation paths invalidate studio proof; invalid writes retain work',()=>{
 const base=checked(start()),old=studioFiles(base),path=STUDIO_ROOT+'/index.html';
 assert.equal(studioFresh(base),true);
 for(const action of [{type:'career-studio-edit',file:'index.html',content:'<h1>Changed</h1>'},{type:'genericfile-edit',path,content:'<h1>Changed</h1>'}] as const){const s=act(base,action);assert.equal(studioFresh(s),false);assert.equal(s.gameplay.career.studio!.proof,null);}
 const repoEdit=structuredClone(base),cloned=runCommand(createGame(),'git clone '+REPO_URL).state;
 assert.ok(cloned.repo);repoEdit.repo={...cloned.repo,root:STUDIO_ROOT};assert.equal(studioFresh(act(repoEdit,{type:'edit',path:'index.html',content:'<h1>Changed</h1>'})),false);
 const commands=[`echo '<h1>Changed</h1>' > ${path}`,`cp ${STUDIO_ROOT}/style.css ${path}`,`mv ${path} /home/dev/moved-title.html`,`rm ${path}`];
 for(const command of commands){const result=runCommand(base,command);assert.equal(result.error,false,command);assert.equal(studioFresh(result.state),false);assert.equal(result.state.gameplay.career.studio!.proof,null);assert.doesNotThrow(()=>readSave(JSON.stringify(result.state)));}
 const removed=runCommand(base,'rm '+path).state,touched=runCommand(removed,'touch '+path);assert.equal(touched.error,false);assert.equal(studioFresh(touched.state),false);
 for(const command of [`touch ${STUDIO_ROOT}/new.js`,`cp ${STUDIO_ROOT}/index.html ${STUDIO_ROOT}/new.js`]){const result=runCommand(base,command);assert.equal(result.error,true);assert.deepEqual(studioFiles(result.state),old);assert.equal(studioFresh(result.state),true);}
 for(const [file,content] of [['../index.html','bad'],['__proto__','bad'],['index.html','x'.repeat(20001)],['index.html','\0']] as const){assert.deepEqual(studioFiles(act(base,{type:'career-studio-edit',file,content})),old);}
 const generic=act(base,{type:'genericfile-edit',path,content:'x'.repeat(20001)});assert.deepEqual(studioFiles(generic),old);assert.equal(studioFresh(generic),true);
});
test('save rejects forged hashes, overflow/unknown files, invalid snapshots or stale proof without replacing storage',()=>{
 const valid=snapshot(start());const invalid:GameState[]=[];
 for(const mutate of [(s:GameState)=>{s.gameplay.career.studio!.proof!.hash='0'.repeat(16);},(s:GameState)=>{s.machines.local.files[STUDIO_ROOT+'/index.html']='x'.repeat(20001);},(s:GameState)=>{s.machines.local.files[STUDIO_ROOT+'/extra.js']='alert(1)';},(s:GameState)=>{s.gameplay.career.studio!.snapshots[0].files['index.html']='<h1>Forged</h1>';},(s:GameState)=>{s.gameplay.career.studio!.snapshots.push(...Array(5).fill(s.gameplay.career.studio!.snapshots[0]));},(s:GameState)=>{s.gameplay.career.studio!.nextId=1;},(s:GameState)=>{s.gameplay.career.studio!.appId='0'.repeat(16);}]){const s=structuredClone(valid);mutate(s);invalid.push(s);}
 for(const s of invalid){assert.throws(()=>readSave(JSON.stringify(s)));let saved='prior';assert.throws(()=>writeSave({setItem:(_key,value)=>{saved=value;}},s));assert.equal(saved,'prior');}
 assert.equal(studioSourceMapValid({...RELEASE_EXAMPLE,'nested/file':'no'}),false);assert.equal(studioSourceMapValid({},true),false);
});
