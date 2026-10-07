import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,runCommand,projectFiles,sourceHash} from './engine.ts';
import {readSave} from './save.ts';

const project=()=>runCommand(createGame(),'git clone https://cathub.dev/mono/menu-site.git').state;

test('old saves gain optional gameplay without changing earned progress',()=>{
 const original=createGame();original.credits=470;original.xp=120;original.completed=[0];original.badges=['첫 배포'];
 const old=JSON.parse(JSON.stringify(original));delete old.gameplay;
 const restored=readSave(JSON.stringify(old));
 assert.equal(restored.gameplay?.equippedCosmetic,'mint');
 assert.equal(restored.credits,470);assert.deepEqual(restored.completed,[0]);
 assert.deepEqual(restored.gameplay?.claimedBonuses,[]);
});

test('exploration requires successful project commands and pays once across reload and clear',()=>{
 let s=project();
 for(const command of ['pwd','ls','cat missing.md'])s=runCommand(s,command).state;
 s=act(s,{type:'claim-bonus',id:'explorer'});assert.equal(s.credits,120);
 s=runCommand(s,'cd ~/menu-site').state;
 s=runCommand(s,'pwd').state;s=readSave(JSON.stringify(s));
 for(const command of ['ls -la .','cat ./README.md','clear'])s=runCommand(s,command).state;
 s=act(s,{type:'claim-bonus',id:'explorer'});
 assert.equal(s.credits,160);assert.equal(s.xp,20);
 s=readSave(JSON.stringify(s));s=act(s,{type:'claim-bonus',id:'explorer'});
 assert.equal(s.credits,160);assert.equal(s.badges.filter(x=>x==='터미널 탐험가').length,1);
});

test('cosmetic buying preserves funds and ownership through duplicate and invalid actions',()=>{
 let s=createGame();s=act(s,{type:'buy-cosmetic',id:'amber'});
 assert.equal(s.credits,30);assert.ok(s.gameplay.ownedCosmetics.includes('amber'));
 s=act(s,{type:'buy-cosmetic',id:'amber'});assert.equal(s.credits,30);
 s=act(s,{type:'buy-cosmetic',id:'violet'});assert.equal(s.credits,30);
 s=act(s,{type:'equip-cosmetic',id:'violet'});assert.notEqual(s.gameplay.equippedCosmetic,'violet');
 s=act(s,{type:'buy-cosmetic',id:'unknown'});assert.equal(s.credits,30);
 s=act(s,{type:'equip-cosmetic',id:'amber'});
 s=readSave(JSON.stringify(s));assert.equal(s.gameplay.equippedCosmetic,'amber');assert.equal(s.credits,30);
});

test('color practice needs current passing evidence and cannot be farmed by changing choice',()=>{
 let s=project();s=act(s,{type:'choose-design',id:'sunrise'});
 s=act(s,{type:'claim-bonus',id:'color'});assert.equal(s.credits,120);
 const checks=[0,1,2].map(i=>({name:String(i),passed:true}));
 s=act(s,{type:'test-result',hash:sourceHash(projectFiles(s)),checks,designChoice:'sunrise',designPassed:true});
 s=act(s,{type:'edit',path:'style.css',content:projectFiles(s)['style.css']+'\n/* changed */'});
 s=act(s,{type:'claim-bonus',id:'color'});assert.equal(s.credits,120);
 s=act(s,{type:'test-result',hash:sourceHash(projectFiles(s)),checks,designChoice:'sunrise',designPassed:true});
 s=act(s,{type:'claim-bonus',id:'color'});assert.equal(s.credits,180);assert.equal(s.xp,30);
 s=act(s,{type:'choose-design',id:'ocean'});
 s=act(s,{type:'test-result',hash:sourceHash(projectFiles(s)),checks,designChoice:'ocean',designPassed:true});
 s=act(s,{type:'claim-bonus',id:'color'});assert.equal(s.credits,180);
});
