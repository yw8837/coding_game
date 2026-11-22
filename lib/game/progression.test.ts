import test from 'node:test';
import assert from 'node:assert/strict';
import {act,createGame,runCommand,type GameState} from './engine.ts';
import {readSave,writeSave} from './save.ts';
import {MISSIONS} from './content.ts';
import {CAREER_JOBS} from './career-content.ts';
import {PRACTICE_JOBS} from './practice.ts';
import {LAB_JOBS} from './code-lab.ts';
import {OPS_JOBS} from './ops-content.ts';
import {LEVELS,MAX_LEVEL,LOADOUT_ITEMS,LOADOUT_SLOTS,DEFAULT_LOADOUT,levelForXp,levelInfo,levelUps,effectiveLoadout,loadoutItem} from './progression.ts';
import {ACHIEVEMENTS,earnedAchievements,newAchievements,earnedSteamAchievements} from './achievements.ts';
import {curriculum} from './curriculum.ts';
import {suggestCommand,editDistance,suggestionLine} from './terminal-suggest.ts';
import {translateTerminalOutput} from './terminal-translations.ts';

const memory=()=>{let value='';return {setItem:(_:string,next:string)=>{value=next;},get value(){return value;}};};

test('levels are derived from XP with inclusive thresholds and a capped top level',()=>{
 assert.equal(levelForXp(0),1);assert.equal(levelForXp(119),1);assert.equal(levelForXp(120),2);
 assert.equal(levelForXp(LEVELS[MAX_LEVEL-1].xp),MAX_LEVEL);assert.equal(levelForXp(1e9),MAX_LEVEL);assert.equal(levelForXp(Number.NaN),1);
 for(let i=1;i<LEVELS.length;i++)assert.ok(LEVELS[i].xp>LEVELS[i-1].xp,'thresholds increase');
 const info=levelInfo(210);assert.equal(info.level,2);assert.equal(info.next,300);assert.equal(info.remaining,90);assert.ok(info.progress>0.49&&info.progress<0.51);
 const top=levelInfo(99999);assert.equal(top.next,null);assert.equal(top.progress,1);assert.equal(top.remaining,0);
});

test('the XP economy reaches every level: cafe gives a demo taste, the full game reaches the top',()=>{
 const cafe=MISSIONS.reduce((sum,m)=>sum+m.xp,0);
 assert.equal(levelForXp(cafe),4,'finishing the three cafe chapters lands on level 4');
 const bonuses=20+30,practice=PRACTICE_JOBS.reduce((sum,job)=>sum+job.xp,0),career=CAREER_JOBS.reduce((sum,job)=>sum+job.xp,0);
 const lab=LAB_JOBS.reduce((sum,job)=>sum+Math.floor(job.credits/2),0),ops=OPS_JOBS.reduce((sum,job)=>sum+job.xp,0);
 assert.ok(cafe+bonuses+practice+career+lab+ops>=LEVELS[MAX_LEVEL-1].xp,'everything together reaches the max level');
 const route=cafe+[1,2,3].reduce((sum,act)=>sum+CAREER_JOBS.filter(job=>job.act===act).slice(0,4).reduce((total,job)=>total+job.xp,0),0)+ops;
 assert.ok(levelForXp(route)>=9,'the main route plus Python and SQL reaches level 9');
});

test('level-ups list each crossed level with its unlocks',()=>{
 const ups=levelUps(100,600);
 assert.deepEqual(ups.map(up=>up.level),[2,3,4]);
 assert.deepEqual(ups.flatMap(up=>up.unlocks.map(item=>item.id)),['soft','phosphor','matrix']);
 assert.deepEqual(levelUps(600,600),[]);assert.deepEqual(levelUps(600,100),[]);
});

test('loadout catalog is complete, localized and has a free default per slot',()=>{
 for(const slot of LOADOUT_SLOTS){
  const items=LOADOUT_ITEMS.filter(item=>item.slot===slot);
  assert.ok(items.some(item=>item.level===1&&item.id===DEFAULT_LOADOUT[slot]),slot);
  assert.equal(new Set(items.map(item=>item.id)).size,items.length,slot);
 }
 for(const item of LOADOUT_ITEMS)for(const lang of ['ko','en','ja'] as const){assert.ok(item.name[lang].trim());assert.ok(item.detail[lang].trim());}
 for(let level=2;level<=MAX_LEVEL;level++)assert.ok(LOADOUT_ITEMS.some(item=>item.level===level),'every level-up unlocks something: '+level);
});

test('equipping respects unlock level; saved choices fall back when locked or unknown',()=>{
 let s=createGame();
 s=act(s,{type:'equip-loadout',slot:'theme',id:'matrix'});assert.equal(s.gameplay.loadout.theme,'default','locked at level 1');
 s.xp=LEVELS[3].xp;s=act(s,{type:'equip-loadout',slot:'theme',id:'matrix'});assert.equal(s.gameplay.loadout.theme,'matrix');
 s=act(s,{type:'equip-loadout',slot:'theme',id:'phosphor'});assert.equal(s.gameplay.loadout.theme,'matrix','wrong slot is ignored');
 s=act(s,{type:'equip-loadout',slot:'bogus' as 'theme',id:'matrix'});assert.equal(s.gameplay.loadout.theme,'matrix');
 assert.equal(effectiveLoadout(s).theme,'matrix');
 const tampered={...s,xp:0,gameplay:{...s.gameplay,loadout:{theme:'matrix',terminal:'hero',keys:'nope',bgm:'synthwave'}}};
 assert.deepEqual(effectiveLoadout(tampered),DEFAULT_LOADOUT);
 assert.ok(loadoutItem('bgm','synthwave'));assert.equal(loadoutItem('bgm','matrix'),undefined);
});

test('saves keep new progression fields and older saves get defaults',()=>{
 let s=createGame();s.xp=LEVELS[4].xp;s=act(s,{type:'equip-loadout',slot:'bgm',id:'synthwave'});s=act(s,{type:'file-hint-seen'});
 const storage=memory();writeSave(storage,s);const loaded=readSave(storage.value);
 assert.equal(loaded.gameplay.loadout.bgm,'synthwave');assert.equal(loaded.gameplay.fileHintSeen,true);
 const legacy=JSON.parse(storage.value) as {gameplay:Record<string,unknown>};
 for(const key of ['ops','finale','loadout','fileHintSeen'])delete legacy.gameplay[key];
 const old=readSave(JSON.stringify(legacy));
 assert.deepEqual(old.gameplay.loadout,DEFAULT_LOADOUT);assert.equal(old.gameplay.fileHintSeen,false);
 assert.deepEqual(old.gameplay.ops,{accepted:[],completed:[],runs:{}});assert.deepEqual(old.gameplay.finale,{branch:null,exports:[]});
 const forged=JSON.parse(storage.value);forged.gameplay.ops={accepted:['not-a-job'],completed:[],runs:{}};
 assert.throws(()=>readSave(JSON.stringify(forged)));
});

test('achievements are derived from progress and report only new unlocks',()=>{
 assert.equal(new Set(ACHIEVEMENTS.map(a=>a.id)).size,ACHIEVEMENTS.length);
 for(const a of ACHIEVEMENTS){assert.ok(a.title);for(const lang of ['ko','en','ja'] as const)assert.ok(a.description[lang]);}
 const fresh=createGame();assert.deepEqual(earnedAchievements(fresh),[]);
 const done:GameState={...fresh,completed:[0,1,2],xp:LEVELS[MAX_LEVEL-1].xp};
 assert.deepEqual(newAchievements(fresh,done).map(a=>a.id),['hello-web','bug-squasher','works-on-server','localhost-hero']);
 assert.deepEqual(newAchievements(done,done),[]);
 assert.ok(earnedSteamAchievements(done).includes('LOCALHOST_HERO'));assert.ok(earnedSteamAchievements(done).includes('CAFE_FIRST_DEPLOY'));
});

test('curriculum shows five ordered stages derived from saved progress',()=>{
 const stages=curriculum(createGame());
 assert.deepEqual(stages.map(stage=>stage.id),['linux','web','python','sql','finale']);
 assert.deepEqual(stages.map(stage=>stage.status),['active','locked','locked','locked','locked']);
 let s=createGame();s.completed=[0,1,2];s.mission=2;s=act(s,{type:'celebrate-opening'});
 const open=curriculum(s);assert.equal(open.find(stage=>stage.id==='python')!.status,'active');assert.equal(open.find(stage=>stage.id==='sql')!.status,'locked');
 for(const stage of open)for(const lang of ['ko','en','ja'] as const){assert.ok(stage.title[lang]);assert.ok(stage.skills[lang]);assert.ok(stage.unlock[lang]);}
});

test('typo helper suggests one plausible correction and never guesses wildly',()=>{
 assert.equal(editDistance('gti','git'),1);assert.equal(editDistance('sl','ls'),1);
 const cases:[string,string|null][]=[['gti status','git status'],['sl','ls'],['pyhton3 receipt.py','python3 receipt.py'],['python receipt.py','python3 receipt.py'],['cd..','cd ..'],['cd~','cd ~'],['git stauts','git status'],['git comit -m "fix total"','git commit -m "fix total"'],['npm isntall','npm install'],['claer','clear'],['sqlite cafe.db','sqlite3 cafe.db'],['xyzzy',null],['ls -la',null],['git status',null],['',null]];
 for(const [input,expected] of cases)assert.equal(suggestCommand(input),expected,input);
});

test('unknown commands show the correction in the terminal and it is localized',()=>{
 const out=runCommand(createGame(),'gti status');
 assert.equal(out.error,true);assert.match(out.output,/^gti: command not found\n/);assert.ok(out.output.endsWith(suggestionLine('gti status')!));
 assert.match(translateTerminalOutput('gti status',out.output,'en'),/Did you mean → git status {2}\(press Tab to fill it in\)$/);
 assert.match(translateTerminalOutput('gti status',out.output,'ja'),/もしかして → git status/);
 assert.match(runCommand(createGame(),'zzqx').output,/help로 지원 명령과 사용법을 확인하세요\.$/);
});
