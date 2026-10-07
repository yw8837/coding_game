import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,runCommand,projectFiles,sourceHash} from './engine.ts';
import {demoGuide} from './demo.ts';

test('beginner guide follows machine setup, working folder and Git snapshots without repeating steps',()=>{
 let s=act(createGame(),{type:'accept'});s=act(s,{type:'discover',what:'repo'});
 const expected=['git clone https://cathub.dev/mono/menu-site.git','sudo apt update','sudo apt install nodejs npm','cd ~/menu-site','npm install','npm run dev'];
 for(const command of expected){assert.equal(demoGuide(s).command,command);const r=runCommand(s,command);assert.equal(r.error,false);s=r.state;}
 assert.equal(demoGuide(s).target,'editor');
 s=act(s,{type:'edit',path:'index.html',content:projectFiles(s)['index.html'].replace('우리 동네 카페','모노 카페')});
 assert.equal(demoGuide(s).target,'check');
 s=act(s,{type:'test-result',hash:sourceHash(projectFiles(s)),checks:[0,1,2].map(i=>({name:String(i),passed:true}))});
 for(const command of ['git add .','git commit -m "My first cafe page"','git push']){assert.equal(demoGuide(s).command,command);s=runCommand(s,command).state;}
 assert.equal(demoGuide(s).target,'review');
 s=act(s,{type:'open-pr'});s=act(s,{type:'merge-pr'});s=act(s,{type:'deploy'});
 assert.equal(demoGuide(s).target,'finish');assert.equal(s.completed.length,1);
});
