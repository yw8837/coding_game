import test from 'node:test';
import assert from 'node:assert/strict';
import {act,createGame,runCommand} from './engine.ts';
import {setupReadiness} from './setup.ts';
import {coachStage} from './coach.ts';
import {exploreCommands,friendlyCommand,nextCoachCommand,setupMilestones,COACH_LESSONS} from './terminal-coach.ts';
import {prepareWorkspace} from './assisted.ts';

test('a player can type the whole cafe setup, one coached command at a time',()=>{
 let s=act(createGame(),{type:'accept'});const typed:string[]=[];
 for(let i=0;i<12;i++){
  const next=nextCoachCommand(s);if(!next)break;
  for(const lang of ['ko','en','ja'] as const)assert.ok(next.lesson[lang].length>10);
  typed.push(next.command);const result=runCommand(s,next.command);assert.equal(result.error,false,next.command+' → '+result.output);s=result.state;
 }
 assert.deepEqual(typed,['git clone https://cathub.dev/mono/menu-site.git','sudo apt update','sudo apt install nodejs npm','cd menu-site','npm install','npm run dev']);
 assert.equal(setupReadiness(s).ready,true);assert.equal(nextCoachCommand(s),null);assert.equal(coachStage(s),'inspect');
 assert.ok(setupMilestones(s).every(m=>m.done));
});

test('the coach resumes from wherever the player wandered off to',()=>{
 let s=act(createGame(),{type:'accept'});
 for(const line of ['git clone https://cathub.dev/mono/menu-site.git','sudo apt update','sudo apt install nodejs npm','mkdir notes','cd notes'])s=runCommand(s,line).state;
 assert.equal(nextCoachCommand(s)?.command,'cd ~/menu-site');assert.equal(nextCoachCommand(s)?.concept,'cd');
 assert.deepEqual(setupMilestones(s).map(m=>m.done),[true,true,false,false]);
 assert.equal(friendlyCommand(s,'cd "/home/dev"'),'cd ~');assert.equal(friendlyCommand(s,'cd "/home/dev/my folder"'),'cd "/home/dev/my folder"');
 assert.equal(Object.keys(COACH_LESSONS).length,8);
});

test('every suggested exploration command is valid where the coach shows it',()=>{
 let s=prepareWorkspace(act(createGame(),{type:'accept'}));
 s=act(s,{type:'inspect-preview',mobile:true,quantity:0});
 assert.equal(coachStage(s),'sign');
 for(const line of exploreCommands(s,'sign')){const r=runCommand(s,line);assert.equal(r.error,false,line+' → '+r.output);}
 assert.equal(runCommand(s,'grep -n "<h1" index.html').output.includes('<h1'),true);
 const away=runCommand(s,'cd ~').state;
 assert.equal(exploreCommands(away,'size')[0],'cd menu-site');
 assert.deepEqual(exploreCommands(s,'prepare'),[]);
});
