import test from 'node:test';
import assert from 'node:assert/strict';
import {questProgress} from './quest-progress.ts';
import {act,createGame,projectFiles,sourceHash,type GameState} from './engine.ts';
import {assist} from './assisted.ts';
import {careerNext} from './career.ts';
import {exampleSolution} from './career-evaluation.ts';
import {RELEASE_EXAMPLE} from './release.ts';
import {MISSIONS} from './content.ts';

const done=(s:GameState,id:string)=>questProgress(s).steps.find(x=>x.id===id)?.done;
function careerStart(){const s=createGame();s.completed=[0,1,2];return act(s,{type:'celebrate-opening'});}
function solve(s:GameState,id:string){s=act(act(s,{type:'career-accept',id}),{type:'career-inspect',id});for(const [file,content] of Object.entries(exampleSolution(id)))s=act(s,{type:'career-edit',id,file,content});return act(s,{type:'career-test',id});}

test('quest presentation is read-only and navigation cannot earn or duplicate progress',()=>{
 const s=createGame(),before=JSON.stringify(s),p=questProgress(s);
 assert.equal(p.currentId,'accept');assert.equal(p.completed,0);
 for(let i=0;i<4;i++)assert.deepEqual(questProgress(s),p);
 assert.equal(JSON.stringify(s),before);assert.equal(s.credits,120);
 // Opening a window is not persisted game evidence. Discovery alone is not a repair.
 const discovered=act(s,{type:'discover',what:'repo'});assert.equal(questProgress(discovered).completed,0);
});
test('cafe steps use individual semantic repairs and only complete fresh stored checks',()=>{
 let s=assist(createGame(),'prepare');assert.equal(done(s,'sign'),false);assert.equal(done(s,'size'),false);
 s=assist(s,'title-cafe');assert.equal(done(s,'sign'),true);assert.equal(done(s,'size'),false);
 s=assist(s,'width-fit');const names=MISSIONS[0].checkNames;
 s=act(s,{type:'test-result',hash:sourceHash(projectFiles(s)),checks:names.map((name,i)=>({name,passed:i<2}))});
 assert.deepEqual(questProgress(s).checks,{passed:2,total:names.length});assert.equal(done(s,'check'),false);
 s=act(s,{type:'test-result',hash:sourceHash(projectFiles(s)),checks:names.map(name=>({name,passed:true}))});assert.equal(done(s,'check'),true);
 s=act(s,{type:'edit',path:'style.css',content:projectFiles(s)['style.css']+'\n/* changed */'});
 assert.equal(done(s,'check'),false);assert.equal(questProgress(s).checks,null);assert.equal(questProgress(s).evidence?.en,'Edited · check again');
});
test('incomplete or oversized check records never produce a misleading fraction',()=>{
 let s=assist(createGame(),'prepare');s=act(s,{type:'test-result',hash:sourceHash(projectFiles(s)),checks:Array.from({length:99},(_,i)=>({name:String(i),passed:true}))});
 const p=questProgress(s);assert.equal(p.checks,null);assert.equal(done(s,'check'),false);assert.ok(p.completed<=p.total);
});
test('valid alternative calculation expressions count semantic repair',()=>{
 let s=assist(createGame(),'prepare');s.mission=1;
 s=act(s,{type:'edit',path:'app.js',content:'function calculateTotal(price, quantity) { return quantity * price; }'});
 assert.equal(done(s,'rule'),true);
 s=act(s,{type:'edit',path:'app.js',content:'function calculateTotal(price, quantity) { return quantity + price; }'});assert.equal(done(s,'rule'),false);
});
test('career check progress is invalidated by real edits and does not grant a reply or reward',()=>{
 let s=solve(careerStart(),'bakery-price');assert.equal(done(s,'check'),true);assert.equal(done(s,'reply'),false);assert.equal(done(s,'deliver'),false);
 const before=s.credits;s=act(s,{type:'career-edit',id:'bakery-price',file:Object.keys(exampleSolution('bakery-price'))[0],content:'{}'});
 assert.equal(done(s,'check'),false);assert.equal(questProgress(s).checks,null);assert.ok(questProgress(s).evidence);
 for(let i=0;i<3;i++)questProgress(s);assert.equal(s.credits,before);
});
test('release milestones require real fresh checks, build, publication and ending',()=>{
 let s=careerStart();for(let i=0;i<12;i++){const id=careerNext(s)!.id;s=act(solve(s,id),{type:'career-deliver',id,choice:'care'});}
 assert.equal(questProgress(s).kind,'release');assert.equal(done(s,'start'),false);
 s=act(s,{type:'career-release-start'});for(const [file,content] of Object.entries(RELEASE_EXAMPLE))s=act(s,{type:'career-release-edit',file,content});
 s=act(s,{type:'career-release-test'});assert.equal(done(s,'check'),true);assert.equal(done(s,'build'),false);
 s=act(s,{type:'career-release-build'});assert.equal(done(s,'build'),true);
 const edited=act(s,{type:'career-release-edit',file:'style.css',content:RELEASE_EXAMPLE['style.css']+'\n/* change */'});assert.equal(done(edited,'check'),false);assert.equal(done(edited,'build'),false);assert.ok(questProgress(edited).evidence);
 s=act(s,{type:'career-release-publish'});assert.equal(done(s,'publish'),true);assert.equal(done(s,'ending'),false);
 s=act(s,{type:'career-ending'});assert.equal(done(s,'ending'),true);assert.equal(questProgress(s).completed,questProgress(s).total);
});
test('all milestone and evidence labels support Korean, English and Japanese',()=>{
 const states=[createGame(),solve(careerStart(),'bakery-price')];
 let release=careerStart();for(let i=0;i<12;i++){const id=careerNext(release)!.id;release=act(solve(release,id),{type:'career-deliver',id,choice:'care'});}states.push(release);
 for(const s of states)for(const x of questProgress(s).steps)for(const lang of ['ko','en','ja'] as const)assert.ok(x.label[lang].length>0);
 const changed=assist(createGame(),'prepare');const p=questProgress(assist(changed,'title-cafe'));for(const lang of ['ko','en','ja'] as const)assert.ok(p.evidence?.[lang]);
});
