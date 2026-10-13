import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocaleStore,parseLanguagePreference,normalizeLanguage,resolveLanguage,type LanguagePlatformInfo,type LanguagePreference} from './locale.ts';

test('manual preference wins, and legacy values stay manual',()=>{
 for(const language of ['ko','en','ja'] as const){assert.equal(parseLanguagePreference(language),language);assert.equal(resolveLanguage(language,{steamLanguage:'koreana',osLanguages:['ja-JP']}),language);}
 for(const corrupt of [null,undefined,'bad','"ko"',{},17])assert.equal(parseLanguagePreference(corrupt),'auto');
});

test('Steam language wins over OS, with first supported preferred locale and English fallback',()=>{
 assert.equal(resolveLanguage('auto',{steamLanguage:'koreana',osLanguages:['ja-JP']}),'ko');
 assert.equal(resolveLanguage('auto',{steamLanguage:'english',osLanguages:['ko-KR']}),'en');
 assert.equal(resolveLanguage('auto',{steamLanguage:'japanese',osLanguages:['ko-KR']}),'ja');
 assert.equal(resolveLanguage('auto',{steamLanguage:'french',osLanguages:['de-DE','ja-JP','ko-KR']}),'ja');
 assert.equal(resolveLanguage('auto',{browserLanguages:['fr-FR','ko-KR','en-US']}),'ko');
 assert.equal(resolveLanguage('auto',{osLanguages:['ja-JP'],browserLanguages:['ko-KR']}),'ja');
 assert.equal(resolveLanguage('auto',{osLanguages:[],browserLanguages:['ko-KR']}),'ko');
 assert.equal(resolveLanguage('auto',{osLanguages:['fr-FR','de-DE']}),'en');
 assert.equal(resolveLanguage('auto',{steamLanguage:'constructor',browserLanguages:['ja-JP']}),'ja');
 assert.equal(resolveLanguage('auto'),'en');
 assert.equal(normalizeLanguage(' JA_jp '),'ja');assert.equal(normalizeLanguage('en-GB'),'en');assert.equal(normalizeLanguage('ko-KR'),'ko');assert.equal(normalizeLanguage('koreana'),null);
});

test('restore never persists the detected language; next launch follows changed Steam language',async()=>{
 const writes:LanguagePreference[]=[];let steam='koreana';
 const environment={readPreference:()=> 'auto',writePreference:(value:LanguagePreference)=>writes.push(value),browserLanguages:()=>['ja-JP'],platformInfo:async()=>({steamLanguage:steam})};
 const first=createLocaleStore(environment);await first.restore();assert.equal(first.getLanguage(),'ko');assert.equal(first.getPreference(),'auto');assert.deepEqual(writes,[]);
 steam='japanese';const second=createLocaleStore(environment);await second.restore();assert.equal(second.getLanguage(),'ja');assert.equal(second.getPreference(),'auto');assert.deepEqual(writes,[]);
});

test('manual selection persists and cancels a pending Steam response',async()=>{
 let finish!:(value:LanguagePlatformInfo)=>void;let stored:unknown=null;const platform=new Promise<LanguagePlatformInfo>(resolve=>{finish=resolve;});
 const store=createLocaleStore({readPreference:()=>stored,writePreference:value=>{stored=value;},browserLanguages:()=>['ko-KR'],platformInfo:()=>platform});
 const restoring=store.restore();assert.equal(store.getLanguage(),'ko');assert.equal(store.getPreference(),'auto');
 await store.setPreference('ja');finish({steamLanguage:'english'});await restoring;
 assert.equal(store.getLanguage(),'ja');assert.equal(store.getPreference(),'ja');assert.equal(stored,'ja');
});

test('newer automatic detection wins over an older response',async()=>{
 const pending:Array<(value:LanguagePlatformInfo)=>void>=[];
 const store=createLocaleStore({readPreference:()=>null,writePreference:()=>{},browserLanguages:()=>['en-US'],platformInfo:()=>new Promise(resolve=>pending.push(resolve))});
 const old=store.restore(),fresh=store.setPreference('auto');pending[1]({steamLanguage:'japanese'});await fresh;pending[0]({steamLanguage:'koreana'});await old;
 assert.equal(store.getLanguage(),'ja');assert.equal(store.getPreference(),'auto');
});

test('blocked storage and platform failures still permit browser detection and manual choices',async()=>{
 const store=createLocaleStore({readPreference:()=>{throw new Error('blocked');},writePreference:()=>{throw new Error('blocked');},browserLanguages:()=>['fr','ja-JP'],platformInfo:async()=>{throw new Error('offline');}});
 await store.restore();assert.equal(store.getLanguage(),'ja');await store.setPreference('ko');assert.equal(store.getLanguage(),'ko');assert.equal(store.getPreference(),'ko');
 const unavailable=createLocaleStore({readPreference:()=>null,writePreference:()=>{},browserLanguages:()=>{throw new Error('unavailable');}});await unavailable.restore();assert.equal(unavailable.getLanguage(),'en');
});

test('legacy manual setting avoids Steam detection and automatic choice persists as auto',async()=>{
 let stored:unknown='ko',calls=0;const changes:string[]=[];
 const store=createLocaleStore({readPreference:()=>stored,writePreference:value=>{stored=value;},browserLanguages:()=>['ja-JP'],platformInfo:async()=>{calls++;return {steamLanguage:'english'};},onChange:(language,preference)=>changes.push(preference+':'+language)});
 await store.restore();assert.equal(store.getLanguage(),'ko');assert.equal(store.getPreference(),'ko');assert.equal(calls,0);
 await store.setPreference('auto');assert.equal(stored,'auto');assert.equal(store.getLanguage(),'en');assert.equal(calls,1);assert.ok(changes.includes('auto:en'));
});

test('visitor timezone can select a regional language but the publisher domain cannot',async()=>{
 assert.equal(resolveLanguage('auto',{browserLanguages:['en-US','ko-KR'],timeZone:'Asia/Seoul'}),'ko');
 assert.equal(resolveLanguage('auto',{browserLanguages:['en-US'],hostname:'code.yeolmaeapps.kr'}),'en');
 assert.equal(resolveLanguage('auto',{browserLanguages:['ja-JP'],hostname:'code.yeolmaeapps.kr'}),'ja');
 assert.equal(resolveLanguage('auto',{browserLanguages:['en-US'],timeZone:'Asia/Seoul'}),'ko');
 const store=createLocaleStore({
  readPreference:()=>null,
  writePreference:()=>{},
  browserLanguages:()=>['en-US'],
  clientContext:()=>({timeZone:'Asia/Seoul',hostname:'code.yeolmaeapps.kr'}),
 });
 assert.equal(store.getLanguage(),'en');
 await store.restore();
 assert.equal(store.getLanguage(),'ko');
});

