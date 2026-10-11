import test from 'node:test';
import assert from 'node:assert/strict';
import {act,createGame,runCommand,tokenize,projectFiles,sourceHash} from './engine.ts';
import {readSave,writeSave} from './save.ts';
import {parseTerminalInput} from './terminal-shell.ts';
import {terminalCompletions,visibleTerminalHistory} from './terminal-input.ts';
import {translateTerminalOutput} from './terminal-translations.ts';
import {CAREER_JOBS} from './career-content.ts';
import {exampleSolution} from './career-evaluation.ts';
import {RELEASE_ROOT,RELEASE_EXAMPLE,releaseFresh,releaseBuildFresh} from './release.ts';

test('clear hides output while preserving bounded, serializable history and cd -',()=>{
 let s=createGame();for(const command of ['mkdir notes','cd notes','pwd','clear'])s=runCommand(s,command).state;
 assert.equal(s.history.length,4);assert.equal(visibleTerminalHistory(s.history).length,0);
 s=readSave(JSON.stringify(s));const previous=runCommand(s,'cd -');assert.equal(previous.output,'/home/dev');s=previous.state;
 assert.equal(runCommand(s,'cd -').output,'/home/dev/notes');
 for(let i=0;i<110;i++)s=runCommand(s,'pwd').state;
 assert.equal(s.history.length,100);assert.doesNotThrow(()=>writeSave({setItem(){}},s));
 assert.equal(runCommand(createGame(),'cd -').error,true);
});

test('ls honors hidden, long and single-column flags, and rejects unsupported options',()=>{
 let s=createGame();s=runCommand(s,'touch .hidden').state;s=runCommand(s,'mkdir notes').state;
 assert.doesNotMatch(runCommand(s,'ls').output,/hidden/);
 assert.match(runCommand(s,'ls -la').output,/-rw-r--r--.*\.hidden/);
 assert.match(runCommand(s,'ls -al').output,/drwxr-xr-x.*\.\./);
 assert.match(runCommand(s,'ls -1').output,/notes\/\nwelcome.txt/);
 const bad=runCommand(s,'ls -R');assert.equal(bad.error,true);assert.match(bad.output,/unsupported option/);
 assert.equal(runCommand(s,'pwd ignored').error,true);
 assert.equal(runCommand(s,'touch first second').error,true);assert.equal(s.machines.local.files['/home/dev/first'],undefined);
});

test('echo and multiple-file cat redirect only into simulated files, append and preserve quotes',()=>{
 let s=createGame();s=runCommand(s,`echo 'a && b > c' > 'my notes.txt'`).state;
 assert.equal(s.machines.local.files['/home/dev/my notes.txt'],'a && b > c\n');
 s=runCommand(s,`echo -n tail >> 'my notes.txt'`).state;
 assert.equal(s.machines.local.files['/home/dev/my notes.txt'],'a && b > c\ntail');
 s=runCommand(s,'echo v2>second.txt').state;
 const joined=runCommand(s,`cat 'my notes.txt' second.txt > copy.txt`);assert.equal(joined.error,false);s=joined.state;
 assert.equal(s.machines.local.files['/home/dev/copy.txt'],'a && b > c\ntailv2\n');
 assert.equal(runCommand(s,`cat -- 'my notes.txt'`).output,'a && b > c\ntail');
 for(const command of ['echo hi > missing/file','echo hi > /home/dev','echo hi > one > two','echo hi 2> errors','npm install > output']){
  const bad=runCommand(s,command);assert.equal(bad.error,true,command);assert.deepEqual(bad.state.machines,s.machines);
 }
 const oversized=runCommand(s,'echo '+ 'x'.repeat(60001)+' > huge.txt');assert.equal(oversized.error,true);assert.match(oversized.output,/EFBIG/);assert.equal(oversized.state.machines.local.files['/home/dev/huge.txt'],undefined);
});

test('unsupported shell operators reject the whole line, while quotes and escapes remain data',()=>{
 const s=createGame();for(const command of ['touch first && touch second','touch first; pwd','touch first | cat','touch first &','touch first\npwd','echo $(pwd)','echo "`pwd`"','cat < welcome.txt']){
  const r=runCommand(s,command);assert.equal(r.error,true,command);assert.deepEqual(r.state.machines,s.machines);assert.equal(r.state.repo,s.repo);
 }
 assert.equal(runCommand(s,'echo a\\>b').output,'a>b');
 assert.equal(runCommand(s,`echo '$(pwd)'`).output,'$(pwd)');
 assert.throws(()=>parseTerminalInput('echo "unclosed',tokenize),/따옴표/);
});

test('stdout writes protect delivered career and published release files and invalidate source hashes',()=>{
 let s=createGame();s.machines.local.files['/home/dev/jobs/bakery-price/pricing.json']='original';s.machines.local.dirs.push('/home/dev/jobs','/home/dev/jobs/bakery-price');s.gameplay.career.completed.push('bakery-price');
 for(const command of ['echo broken > /home/dev/jobs/bakery-price/pricing.json','echo broken >> /home/dev/jobs/bakery-price/new.txt','cat welcome.txt > /home/dev/jobs/bakery-price/pricing.json']){
  const r=runCommand(s,command);assert.equal(r.error,true);assert.match(r.output,/Read-only/);assert.deepEqual(r.state.machines,s.machines);
 }
 s=createGame();s=runCommand(s,'git clone https://cathub.dev/mono/menu-site.git').state;s=runCommand(s,'cd menu-site').state;
 const hash=sourceHash(projectFiles(s));const edited=runCommand(s,`echo 'body {width: 100%;}' > style.css`);assert.equal(edited.error,false);assert.notEqual(sourceHash(projectFiles(edited.state)),hash);
});

test('release stdout writes invalidate real test/build proof and published targets remain immutable',()=>{
 let s=createGame();s.completed=[0,1,2];s.mission=2;s=act(s,{type:'celebrate-opening'});
 for(const job of CAREER_JOBS){s=act(s,{type:'career-accept',id:job.id});s=act(s,{type:'career-inspect',id:job.id});for(const [file,content] of Object.entries(exampleSolution(job.id)))s=act(s,{type:'career-edit',id:job.id,file,content});s=act(s,{type:'career-test',id:job.id});s=act(s,{type:'career-deliver',id:job.id,choice:'care'});}
 s=act(s,{type:'career-release-start'});for(const [file,content] of Object.entries(RELEASE_EXAMPLE))s=act(s,{type:'career-release-edit',file,content});
 s=act(act(s,{type:'career-release-test'}),{type:'career-release-build'});assert.equal(releaseFresh(s),true);assert.equal(releaseBuildFresh(s),true);
 const changed=runCommand(s,`echo '.portal {width: 90%;}' > ${RELEASE_ROOT}/style.css`);assert.equal(changed.error,false);assert.equal(releaseFresh(changed.state),false);assert.equal(releaseBuildFresh(changed.state),false);
 s=act(s,{type:'career-release-publish'});assert.ok(s.gameplay.career.release.published);
 for(const command of [`echo changed > ${RELEASE_ROOT}/style.css`,`echo changed >> ${RELEASE_ROOT}/new.txt`,`cat welcome.txt > ${RELEASE_ROOT}/../launch/style.css`]){
  const r=runCommand(s,command);assert.equal(r.error,true,command);assert.match(r.output,/Read-only/);assert.deepEqual(r.state.machines,s.machines);
 }
 assert.equal(runCommand(s,`cat ${RELEASE_ROOT}/style.css`).error,false);
 assert.doesNotThrow(()=>writeSave({setItem(){}},s));
});

test('completion preserves options and prior operands and supports quoted paths and redirects',()=>{
 let s=createGame();s=runCommand(s,'mkdir "my notes"').state;
 assert.ok(terminalCompletions(s,'cd my').some(c=>tokenize(c)[1]==='my notes/'));
 assert.ok(terminalCompletions(s,'ls -la wel').includes('ls -la welcome.txt'));
 assert.ok(terminalCompletions(s,'cp welcome.txt wel').includes('cp welcome.txt welcome.txt'));
 assert.ok(terminalCompletions(s,'echo hello > wel').includes('echo hello > welcome.txt'));
 assert.ok(terminalCompletions(s,'cd "my').some(c=>tokenize(c)[1]==='my notes/'));
 s.machine='server';assert.equal(terminalCompletions(s,'cat missing').length,0);
});

test('/pwd stays an invalid absolute command name and offers localized pwd guidance',()=>{
 const r=runCommand(createGame(),'/pwd');assert.equal(r.error,true);assert.match(r.output,/pwd를 뜻했나요/);
 assert.match(translateTerminalOutput('/pwd',r.output,'en'),/Did you mean pwd\? \/ starts an absolute path/);
 assert.match(translateTerminalOutput('/pwd',r.output,'ja'),/絶対パス/);
 assert.doesNotMatch(runCommand(createGame(),'help').output,/첫 버전|학습용|이 실습/);
});

test('grep finds lines in project files without touching state',()=>{
 const run=(s:ReturnType<typeof createGame>,line:string)=>runCommand(s,line).state;
 let s=createGame();for(const line of ['git clone https://cathub.dev/mono/menu-site.git','cd menu-site'])s=run(s,line);
 const files=projectFiles(s),h1=files['index.html'].split('\n').findIndex(l=>l.includes('<h1'))+1;
 const found=runCommand(s,'grep -n "<h1" index.html');
 assert.equal(found.error,false);assert.ok(found.output.startsWith(h1+':'),found.output);
 assert.equal(sourceHash(projectFiles(found.state)),sourceHash(files));
 assert.match(runCommand(s,'grep -i MENU-GRID style.css').output,/menu-grid/);
 assert.match(runCommand(s,'grep nothing-here index.html').output,/no lines match/);
 assert.equal(runCommand(s,'grep -x h1 index.html').error,true);
 assert.equal(runCommand(s,'grep h1').error,true);
 assert.match(runCommand(s,'grep h1 missing.html').output,/No such file/);
 assert.ok(terminalCompletions(s,'grep -n h1 ind').includes('grep -n h1 index.html'));
});
