import test from 'node:test';
import assert from 'node:assert/strict';
import {act,createGame,runCommand,type GameState} from './engine.ts';
import {readSave,writeSave} from './save.ts';
import {runPython} from './py-runtime.ts';
import {executeSql} from './sql-engine.ts';
import {OPS_JOBS,PYTHON_JOBS,SQL_JOBS,opsFolder,opsDataFiles,type PythonJob,type SqlJob} from './ops-content.ts';
import {opsTrackUnlocked,opsJobUnlocked,opsPathReadOnly,SQL_UNLOCK_PYTHON} from './ops.ts';
import {translateTerminalOutput} from './terminal-translations.ts';

const memory=()=>{let value='';return {setItem:(_:string,next:string)=>{value=next;},get value(){return value;}};};
function opened():GameState{const s=createGame();s.completed=[0,1,2];s.mission=2;return act(s,{type:'celebrate-opening'});}
const run=(s:GameState,command:string,edition:'full'|'demo'='full')=>runCommand(s,command,edition);
function commands(s:GameState,list:string[]):GameState{for(const command of list){const r=run(s,command);assert.equal(r.error,false,command+'\n'+r.output);s=r.state;}return s;}
const withTools=(s:GameState)=>commands(s,['sudo apt update','sudo apt install python3 sqlite3']);
const edit=(s:GameState,path:string,content:string)=>act(s,{type:'genericfile-edit',path,content});
function finishPython(s:GameState,job:PythonJob):GameState{
 s=act(s,{type:'ops-accept',id:job.id});s=edit(s,opsFolder(job)+'/'+job.main,job.reference);
 s=commands(s,['cd '+opsFolder(job)]);const r=run(s,'python3 '+job.main);assert.equal(r.error,false,r.output);return r.state;
}
function finishSql(s:GameState,job:SqlJob):GameState{
 s=act(s,{type:'ops-accept',id:job.id});s=edit(s,opsFolder(job)+'/'+job.main,job.reference);
 s=commands(s,['cd '+opsFolder(job)]);const r=run(s,`sqlite3 ${job.db} < ${job.main}`);assert.equal(r.error,false,r.output);return r.state;
}

test('every Python job: starter fails, reference passes and hidden data defeats hard-coded output',()=>{
 for(const job of PYTHON_JOBS){
  const outputs=job.data.map(files=>{const r=runPython(job.reference,{files,filename:job.main});assert.equal(r.ok,true,job.id+': '+JSON.stringify(r.error));return r.stdout;});
  assert.equal(new Set(outputs).size,outputs.length,job.id+': each dataset gives a different answer');
  const starter=job.data.map(files=>runPython(job.files[job.main],{files,filename:job.main}));
  assert.ok(starter.some((r,i)=>!r.ok||r.stdout!==outputs[i]),job.id+': starter is broken');
  for(const lang of ['ko','en','ja'] as const)for(const text of [job.client,job.title,job.brief,job.goal,job.concepts,job.thanks,...job.hints])assert.ok(text[lang].trim(),job.id);
 }
});

test('every SQL job: starter fails, reference passes and hidden data changes the expected rows',()=>{
 for(const job of SQL_JOBS){
  const results=job.data.map(db=>{const r=executeSql(db,job.reference);assert.equal(r.ok,true,job.id);return JSON.stringify(r.ok?r.results.at(-1):null);});
  assert.equal(new Set(results).size,results.length,job.id);
  const starter=job.data.map(db=>executeSql(db,job.files[job.main]));
  assert.ok(starter.some((r,i)=>!r.ok||JSON.stringify(r.results.at(-1))!==results[i]),job.id+': starter is broken');
 }
});

test('the Python track unlocks after OPEN, jobs unlock in order, and SQL opens after three scripts',()=>{
 assert.equal(opsTrackUnlocked(createGame(),'python'),false);
 let s=opened();assert.equal(opsTrackUnlocked(s,'python'),true);assert.equal(opsTrackUnlocked(s,'sql'),false);
 assert.equal(opsJobUnlocked(s,PYTHON_JOBS[0]),true);assert.equal(opsJobUnlocked(s,PYTHON_JOBS[1]),false);
 const ignored=act(s,{type:'ops-accept',id:PYTHON_JOBS[1].id});assert.deepEqual(ignored.gameplay.ops.accepted,[]);
 s=withTools(s);
 for(const job of PYTHON_JOBS.slice(0,SQL_UNLOCK_PYTHON))s=finishPython(s,job);
 assert.equal(opsTrackUnlocked(s,'sql'),true);assert.equal(opsJobUnlocked(s,SQL_JOBS[0]),true);
});

test('python3 runs the player script, shows a CPython-like error, then completes the job once',()=>{
 const job=PYTHON_JOBS[0],folder=opsFolder(job);let s=act(opened(),{type:'ops-accept',id:job.id});
 assert.equal(s.machines.local.files[folder+'/'+job.main],job.files[job.main]);assert.equal(s.machines.local.files[folder+'/orders.csv'],job.data[0]['orders.csv']);
 s=commands(s,['cd '+folder]);
 assert.match(run(s,'python3 receipt.py').output,/python3: command not found/);
 s=withTools(s);s=commands(s,['cd '+folder]);
 const broken=run(s,'python3 receipt.py');assert.equal(broken.error,true);assert.match(broken.output,/Croissant x3 = 3,503/);assert.match(broken.output,/── 의뢰 검사 ──\n✘ 공개 데이터: 1번째 줄이 달라요\n {2}기대: Croissant x3 = 10,500\n {2}실제: Croissant x3 = 3,503/);
 for(const lang of ['ko','en','ja'] as const){
  const output=translateTerminalOutput('python3 receipt.py',broken.output,lang);
  assert.doesNotMatch(output,/힌트:|Hint:|ヒント[:：]/);
  for(const hint of job.hints)assert.ok(!output.includes(hint[lang]),'Failed runs must not open hints');
 }
 assert.equal(broken.state.gameplay.ops.completed.length,0);assert.equal(broken.state.gameplay.ops.runs[job.id].passed,false);
 assert.match(translateTerminalOutput('python3 receipt.py',broken.output,'en'),/── Job check ──\n✘ visible data: line 1 differs\n {2}expected: Croissant x3 = 10,500/);
 const hardcoded=edit(broken.state,folder+'/receipt.py',runPython(job.reference,{files:job.data[0]}).stdout.split('\n').filter(Boolean).map(line=>`print(${JSON.stringify(line)})`).join('\n'));
 const cheat=run(hardcoded,'python3 receipt.py');assert.equal(cheat.error,true);assert.match(cheat.output,/✔ 공개 데이터 결과 일치\n✘ 숨은 데이터 #1/);
 const credits=s.credits,xp=s.xp;
 s=edit(cheat.state,folder+'/receipt.py',job.reference);
 const fixed=run(s,'python3 receipt.py');assert.equal(fixed.error,false,fixed.output);
 assert.match(fixed.output,/TOTAL 35,900\n── 의뢰 검사 ──\n✔ 공개 데이터 결과 일치\n✔ 숨은 데이터 #1 결과 일치\n✔ 숨은 데이터 #2 결과 일치\n★ 의뢰 완료! \+220 cr · \+100 XP$/);
 assert.equal(fixed.state.credits,credits+job.credits);assert.equal(fixed.state.xp,xp+job.xp);assert.deepEqual(fixed.state.gameplay.ops.completed,[job.id]);
 const again=run(fixed.state,'python3 receipt.py');assert.equal(again.state.credits,fixed.state.credits);assert.match(again.output,/이미 완료한 의뢰예요/);
 const elsewhere=run(commands(fixed.state,['cd ~']),'python3 '+folder+'/receipt.py');assert.match(elsewhere.output,/FileNotFoundError: \[Errno 2\] No such file or directory: 'orders.csv'/);
});

test('python3 -c and personal scripts run in the sandbox without touching jobs',()=>{
 let s=withTools(opened());
 const inline=run(s,'python3 -c "print(sum([1, 2, 3]) * 2)"');assert.equal(inline.output,'12');assert.equal(inline.error,false);
 s=commands(s,['touch hello.py']);s=edit(s,'/home/dev/hello.py','name = "dev"\nfor i in range(2):\n    print(f"hi {name} {i}")\n');
 assert.equal(run(s,'python3 hello.py').output,'hi dev 0\nhi dev 1');
 assert.match(run(s,'python3 missing.py').output,/can't open file/);
 assert.match(run(s,'python3').output,/Python 3\.12\.0 \[simulated\]/);
 assert.match(run(s,'python3 server.py').output,/server\.py|No such file/);
});

test('job source data is read-only for the editor and shell commands',()=>{
 const job=PYTHON_JOBS[0],folder=opsFolder(job),data=folder+'/'+opsDataFiles(job)[0];let s=act(opened(),{type:'ops-accept',id:job.id});
 assert.equal(opsPathReadOnly(data),true);assert.equal(opsPathReadOnly(folder+'/'+job.main),false);
 const edited=edit(s,data,'item,price,qty\nFree,0,1\n');assert.equal(edited.machines.local.files[data],job.data[0]['orders.csv']);assert.match(edited.notice,/읽기 전용/);
 s=commands(s,['cd '+folder]);
 for(const command of ['rm orders.csv','echo x > orders.csv','cp receipt.py orders.csv','mv orders.csv x.csv'])assert.match(run(s,command).output,/Read-only/,command);
 const copy=commands(s,['cp orders.csv my-orders.csv']);assert.ok(copy.machines.local.files[folder+'/my-orders.csv']);
 const restored=act({...s,machines:{...s.machines,local:{...s.machines.local,files:Object.fromEntries(Object.entries(s.machines.local.files).filter(([path])=>path!==data))}}},{type:'ops-restore',id:job.id});
 assert.equal(restored.machines.local.files[data],job.data[0]['orders.csv']);
});

test('sqlite3 explores the database, nudges inline answers and completes via query.sql',()=>{
 let s=withTools(opened());for(const job of PYTHON_JOBS.slice(0,SQL_UNLOCK_PYTHON))s=finishPython(s,job);
 const job=SQL_JOBS[0],folder=opsFolder(job);s=act(s,{type:'ops-accept',id:job.id});s=commands(s,['cd '+folder]);
 assert.match(run(s,'cat cafe.db').output,/^SQLite format 3\n/);
 assert.equal(run(s,'sqlite3 cafe.db .tables').output,'menu');
 assert.match(run(s,'sqlite3 cafe.db ".schema menu"').output,/CREATE TABLE menu/);
 assert.match(run(s,'sqlite3 cafe.db "SELECT name FROM menu LIMIT 2;"').output,/name\s*\n-+\s*\nAmericano\s*\nCafe latte/);
 assert.match(run(s,'sqlite3 cafe.db "SELECT nme FROM menu;"').output,/no such column: nme/);
 const inline=run(s,'sqlite3 cafe.db "SELECT name, price FROM menu WHERE available = 1;"');assert.match(inline.output,/✔ 결과가 맞아요! 이 쿼리를 query\.sql에 저장하고 sqlite3 cafe\.db < query\.sql 로 납품하세요\.$/);
 assert.equal(inline.state.gameplay.ops.completed.includes(job.id),false);
 assert.match(translateTerminalOutput('sqlite3 cafe.db "x"',inline.output,'ja'),/結果は正解です/);
 const broken=run(s,'sqlite3 cafe.db < query.sql');assert.equal(broken.error,true);assert.match(broken.output,/✘ 공개 데이터: 열 개수가 달라요 \(기대 2개, 실제 1개\)/);
 const viaRead=run(s,'sqlite3 cafe.db ".read query.sql"');assert.equal(viaRead.error,true);
 s=edit(s,folder+'/query.sql',job.reference);const done=run(s,'sqlite3 cafe.db < query.sql');
 assert.equal(done.error,false,done.output);assert.match(done.output,/★ 의뢰 완료! \+240 cr · \+110 XP$/);assert.ok(done.state.gameplay.ops.completed.includes(job.id));
 assert.match(run(s,'sqlite3 nope.db .tables').output,/unable to open database/);
 assert.match(run(s,'sqlite3 query.sql .tables').output,/file is not a database/);
 assert.match(run(s,'echo hi < query.sql').output,/supported for sqlite3/);
 assert.match(run(s,'sqlite3 cafe.db "DELETE FROM menu;"').output,/readonly/);
});

test('ordered SQL jobs explain wrong order separately from wrong rows',()=>{
 let s=withTools(opened());for(const job of PYTHON_JOBS.slice(0,SQL_UNLOCK_PYTHON))s=finishPython(s,job);
 s=finishSql(s,SQL_JOBS[0]);const job=SQL_JOBS[1];s=act(s,{type:'ops-accept',id:job.id});s=commands(s,['cd '+opsFolder(job)]);
 s=edit(s,opsFolder(job)+'/query.sql','SELECT name, price FROM products WHERE price <= 3000 AND stock > 0 AND on_sale = 1 ORDER BY price DESC;');
 assert.match(run(s,'sqlite3 market.db < query.sql').output,/행은 맞지만 순서가 달라요/);
});

test('completing both tracks unlocks the matching achievements and survives save/load',()=>{
 let s=withTools(opened());for(const job of PYTHON_JOBS)s=finishPython(s,job);for(const job of SQL_JOBS)s=finishSql(s,job);
 assert.equal(s.gameplay.ops.completed.length,OPS_JOBS.length);
 const storage=memory();writeSave(storage,s);const loaded=readSave(storage.value);
 assert.deepEqual(loaded.gameplay.ops.completed,s.gameplay.ops.completed);assert.equal(loaded.gameplay.ops.runs[SQL_JOBS[4].id].passed,true);
});

test('demo edition keeps automation and database folders and actions closed',()=>{
 const s=withTools(opened());
 assert.equal(act(s,{type:'ops-accept',id:PYTHON_JOBS[0].id},'demo').gameplay.ops.accepted.length,0);
 const full=act(s,{type:'ops-accept',id:PYTHON_JOBS[0].id});
 assert.equal(run(full,'cd /home/dev/automation','demo').error,true);
 assert.equal(run(full,'sqlite3 /home/dev/database/x.db .tables','demo').error,true);
 assert.equal(run(full,'python3 -c "print(1)"','demo').output,'1');
 assert.equal(run(full,'help','demo').output.includes('SQL    '),false);assert.equal(run(full,'help').output.includes('SQL    '),true);
});
