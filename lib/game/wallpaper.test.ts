import test from 'node:test';
import assert from 'node:assert/strict';
import {act,createGame} from './engine.ts';
import {COSMETICS} from './gameplay.ts';
import {readSave,writeSave,SAVE_KEY} from './save.ts';
import {translate} from './translations.ts';

test('free blue default keeps the legacy mint ID and paid coast/garden ownership compatible',()=>{
 const state=createGame(),blue=COSMETICS.find(item=>item.id==='mint')!;
 assert.equal(blue.price,0);assert.equal(blue.wallpaper,'/game-art/wallpaper-blue.png');
 assert.deepEqual(state.gameplay.ownedCosmetics,['mint']);assert.equal(state.gameplay.equippedCosmetic,'mint');
 for(const id of ['amber','violet'] as const){
  let legacy=act(state,{type:'buy-cosmetic',id});legacy=readSave(JSON.stringify(legacy));
  assert.equal(legacy.gameplay.equippedCosmetic,id);assert.ok(legacy.gameplay.ownedCosmetics.includes(id));assert.equal(legacy.credits,30);
 }
 const old=JSON.parse(JSON.stringify(state));delete old.gameplay;
 assert.deepEqual(readSave(JSON.stringify(old)).gameplay.ownedCosmetics,['mint']);assert.equal(readSave(JSON.stringify(old)).gameplay.equippedCosmetic,'mint');
});

test('loft costs exactly 180, applies immediately, and duplicate purchase never charges again',()=>{
 let state=createGame();state.credits=180;
 state=act(state,{type:'buy-cosmetic',id:'loft'});
 assert.equal(state.credits,0);assert.equal(state.gameplay.equippedCosmetic,'loft');assert.ok(state.gameplay.ownedCosmetics.includes('loft'));
 state=act(state,{type:'buy-cosmetic',id:'loft'});assert.equal(state.credits,0);assert.equal(state.gameplay.ownedCosmetics.filter(id=>id==='loft').length,1);
 assert.equal(COSMETICS.find(item=>item.id==='loft')!.wallpaper,'/game-art/wallpaper-loft.png');
});

test('owned wallpapers switch freely at zero credits through autosave and restore',()=>{
 let state=createGame();state.credits=270;
 state=act(act(state,{type:'buy-cosmetic',id:'amber'}),{type:'buy-cosmetic',id:'loft'});assert.equal(state.credits,0);
 const storage=new Map<string,string>();writeSave({setItem:(key,value)=>{storage.set(key,value);}},state);
 state=readSave(storage.get(SAVE_KEY)!);assert.equal(state.gameplay.equippedCosmetic,'loft');
 for(const id of ['mint','amber','loft','mint','loft']){
  state=readSave(JSON.stringify(act(state,{type:'equip-cosmetic',id})));
  assert.equal(state.credits,0);assert.equal(state.gameplay.equippedCosmetic,id);
 }
});

test('insufficient credits and unowned or invalid selection preserve funds and background',()=>{
 for(const credits of [0,120,179]){
  let state=createGame();state.credits=credits;
  state=act(state,{type:'buy-cosmetic',id:'loft'});
  assert.equal(state.credits,credits);assert.equal(state.gameplay.equippedCosmetic,'mint');assert.deepEqual(state.gameplay.ownedCosmetics,['mint']);assert.match(state.notice,/크레딧이 부족/);
  state=act(state,{type:'equip-cosmetic',id:'loft'});assert.equal(state.gameplay.equippedCosmetic,'mint');assert.equal(state.credits,credits);
  state=act(state,{type:'buy-cosmetic',id:'not-a-wallpaper'});assert.equal(state.credits,credits);assert.equal(state.gameplay.equippedCosmetic,'mint');
 }
 const invalid=createGame();const raw=JSON.parse(JSON.stringify(invalid));raw.gameplay.equippedCosmetic='not-a-wallpaper';assert.throws(()=>readSave(JSON.stringify(raw)));
});

test('names, descriptions, purchase/application notices and insufficient-funds notices cover all locales',()=>{
 for(const item of COSMETICS){
  let state=createGame();state.credits=1000;
  state=act(state,{type:'buy-cosmetic',id:item.id});
  const notices=[act(state,{type:'equip-cosmetic',id:item.id}).notice];
  if(item.price>0){notices.push(state.notice);assert.match(state.notice,/배경을 구입하고 적용/);}
  notices.push(act(createGame(),{type:'buy-cosmetic',id:'loft'}).notice);
  for(const language of ['en','ja'] as const)for(const text of [item.name,item.description,...notices]){
   const translated=translate(text,language);assert.notEqual(translated,text,`${language}: ${text}`);assert.doesNotMatch(translated,/[가-힣]/);
  }
 }
});
