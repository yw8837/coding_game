import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame, runCommand, act, projectFiles, calculateTotal, sourceHash, apiRequest, isProjectServerRunning, missionSteps} from './engine.ts';

function commands(lines: string[], state = createGame()) { for (const line of lines) state = runCommand(state,line).state; return state; }
const setup = () => commands(['sudo apt update','sudo apt install nodejs npm','git clone https://cathub.dev/mono/menu-site.git','cd menu-site','npm install']);

test('missing npm, wrong cwd and absent project dependencies are distinct states',()=>{
  let s=createGame(); assert.match(runCommand(s,'npm run dev').output,/command not found/);
  s=commands(['sudo apt update','sudo apt install nodejs npm'],s);
  assert.match(runCommand(s,'npm install').output,/ENOENT/);
  s=commands(['git clone https://cathub.dev/mono/menu-site.git','cd menu-site'],s);
  assert.match(runCommand(s,'npm run dev').output,/vite: not found/);
  s=commands(['npm install','npm run dev'],s);
  assert.equal(s.machines.local.processes.frontend,true);
});

test('relative paths normalize and quoted arguments remain one value',()=>{
  let s=commands(['mkdir "my work"','cd "my work"','mkdir child','cd child/..']);
  assert.equal(s.machines.local.cwd,'/home/dev/my work');
  assert.match(runCommand(s,'cat missing.txt').output,/No such file/);
});

test('staging, commit and remote push preserve distinct file snapshots',()=>{
  let s=setup(); const original=projectFiles(s)['style.css'];
  s=act(s,{type:'edit',path:'style.css',content:original+'\n/* staged */'});
  s=commands(['git add style.css'],s);
  s=act(s,{type:'edit',path:'style.css',content:original+'\n/* unstaged */'});
  s=commands(['git commit -m "fix mobile menu"'],s);
  assert.match(s.repo!.commits.at(-1)!.files['style.css'],/staged/);
  assert.doesNotMatch(s.repo!.commits.at(-1)!.files['style.css'],/unstaged/);
  assert.equal(s.repo!.remote.files['style.css'],original);
  s=commands(['git push origin main'],s);
  assert.match(s.repo!.remote.files['style.css'],/staged/);
  assert.match(projectFiles(s)['style.css'],/unstaged/);
});

test('arithmetic evaluator handles equivalent expressions and rejects unsupported execution',()=>{
  assert.equal(calculateTotal('function calculateTotal(price, quantity) { return quantity * price; }',4500,3),13500);
  assert.equal(calculateTotal('function calculateTotal(price, quantity) { const total = price * quantity; return total; }',4500,0),0);
  assert.equal(calculateTotal('function calculateTotal(price, quantity) { return (price * quantity) - 500; }',4500,2),8500);
  assert.throws(()=>calculateTotal('function calculateTotal(){ while(true){} }',4500,2));
});

test('old check evidence cannot approve a modified commit',()=>{
  let s=setup(); const hash=sourceHash(projectFiles(s));
  s=act(s,{type:'test-result',hash,checks:[{name:'모바일',passed:true},{name:'버튼',passed:true},{name:'데스크톱',passed:true}]});
  s=act(s,{type:'edit',path:'style.css',content:'body {width:2000px;}'});
  s=commands(['git add .','git commit -m broken','git push'],s);
  s=act(s,{type:'open-pr'});
  assert.notEqual(s.repo!.pr?.status,'approved');
});

test('API requests fail before the corresponding machine has a running backend',()=>{
  const r=apiRequest(createGame(),'GET','http://mono-server:8000/api/menu','');
  assert.equal(r.status,0);
  assert.match(JSON.stringify(r.data),/CONNECTION_REFUSED/);
});

test('reward cannot be claimed before release or more than once',()=>{
  let s=setup(); const before=s.credits;
  s=act(s,{type:'deploy'}); assert.equal(s.credits,before);
  const css=projectFiles(s)['style.css']+'\n/* reviewed change */';
  s=act(s,{type:'edit',path:'style.css',content:css});
  s=act(s,{type:'test-result',hash:sourceHash(projectFiles(s)),checks:[{name:'모바일',passed:true},{name:'버튼',passed:true},{name:'데스크톱',passed:true}]});
  s=commands(['git add .','git commit -m fix','git push'],s);
  s=act(s,{type:'open-pr'}); s=act(s,{type:'merge-pr'}); s=act(s,{type:'deploy'});
  assert.equal(s.credits,before+350);
  assert.equal(act(s,{type:'deploy'}).credits,before+350);
});

test('moving a file onto itself preserves its contents',()=>{
 const s=setup(),before=projectFiles(s)['style.css'];const r=runCommand(s,'mv style.css .');
 assert.equal(r.error,true);assert.equal(projectFiles(r.state)['style.css'],before);
});

test('git add reflects restored files and stages tracked deletion after rename',()=>{
 let s=setup();const original=projectFiles(s)['app.js'];
 s=act(s,{type:'edit',path:'app.js',content:original+'\n// changed'});s=commands(['git add .'],s);
 s=act(s,{type:'edit',path:'app.js',content:original});s=commands(['git add .'],s);
 assert.equal(Object.keys(s.repo!.staged).length,0);
 s=commands(['mv app.js old.js','git add .','git commit -m rename'],s);
 assert.equal(s.repo!.commits.at(-1)!.files['app.js'],undefined);
 assert.equal(s.repo!.commits.at(-1)!.files['old.js'],original);
});

test('the second chapter introduces a repair without altering the earlier deployed snapshot',()=>{
 let s=setup();s=act(s,{type:'edit',path:'app.js',content:'function calculateTotal(price, quantity) { return price * quantity; }'});
 s=act(s,{type:'test-result',hash:sourceHash(projectFiles(s)),checks:[{name:'mobile',passed:true},{name:'visible',passed:true},{name:'desktop',passed:true}]});
 s=commands(['git add .','git commit -m early','git push'],s);s=act(s,{type:'open-pr'});s=act(s,{type:'merge-pr'});s=act(s,{type:'deploy'});s=act(s,{type:'next-mission'});
 s=act(s,{type:'test-result',hash:sourceHash(projectFiles(s)),checks:[1,2,3,4].map(n=>({name:String(n),passed:true}))});s=act(s,{type:'open-pr'});
 assert.equal(s.repo!.pr?.status,'changes-requested');
 assert.match(projectFiles(s)['app.js'],/price \+ quantity/);
 assert.match(s.repo!.deployed.files['app.js'],/price \* quantity/);
});

test('local API orders stay on the local machine and restart clears only that machine',()=>{
 let s=setup();s=act(s,{type:'edit',path:'server.py',content:projectFiles(s)['server.py'].replace('SAVE_ORDERS = False','SAVE_ORDERS = True')});
 s=commands(['sudo apt install python3 python3-pip','pip install -r requirements.txt','python3 server.py'],s);
 const r=apiRequest(s,'POST','http://localhost:8000/api/orders','{"item":"coffee","quantity":2}');
 assert.equal(r.status,201);assert.equal(r.state.localOrders.length,1);assert.equal(r.state.orders.length,0);
 assert.equal(commands(['pkill python3'],r.state).localOrders.length,0);
});

test('a dev server started in another folder cannot satisfy the project runtime',()=>{
 let s=commands(['mkdir ../empty-preview','cp package.json ../empty-preview','cd ../empty-preview','npm install','npm run dev'],setup());
 assert.equal(s.machines.local.processes.frontend,true);
 assert.equal(isProjectServerRunning(s),false);
 assert.equal(missionSteps(s).find(step=>step.label==='의존성 설치 · 사이트 실행')!.done,false);
 s=commands(['pkill node','cd ../menu-site','npm run dev'],s);
 assert.equal(isProjectServerRunning(s),true);
});
