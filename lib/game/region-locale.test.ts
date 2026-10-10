import test from 'node:test';
import assert from 'node:assert/strict';
import {countryLanguage,regionLocaleResponse,fetchRegionLanguage} from './region-locale.ts';
import {createLocaleStore,type LanguagePreference} from './locale.ts';

test('only valid country metadata chooses Korean, Japanese or English',()=>{
 assert.equal(countryLanguage('KR'),'ko');assert.equal(countryLanguage('jp'),'ja');
 for(const country of ['US','CN','GB','FR','DE','TW','AQ'])assert.equal(countryLanguage(country),'en');
 for(const country of [null,undefined,'','XX','ZZ','T1','EU','Korea',{},42])assert.equal(countryLanguage(country),null);
});
test('locale endpoint returns language only, no-store, and ignores forged country/IP headers',async()=>{
 const req=new Request('https://example.com/api/locale',{headers:{'cf-ipcountry':'JP','x-forwarded-for':'127.0.0.1'}});
 assert.deepEqual(await regionLocaleResponse(req).json(),{language:null});
 Object.assign(req,{cf:{country:'KR',city:'Seoul'}});
 const response=regionLocaleResponse(req);assert.equal(response.status,200);assert.deepEqual(await response.json(),{language:'ko'});
 assert.match(response.headers.get('Cache-Control')!,/no-store/);assert.equal(response.headers.get('CDN-Cache-Control'),'no-store');
 assert.equal(regionLocaleResponse(new Request(req.url,{method:'POST'})).status,405);
 assert.equal(await regionLocaleResponse(new Request(req.url,{method:'HEAD'})).text(),'');
});
test('web country preference overrides browser fallback without storing detected language',async()=>{
 const writes:LanguagePreference[]=[];
 for(const [country,expected] of [['KR','ko'],['JP','ja'],['US','en']] as const){
  const store=createLocaleStore({readPreference:()=>null,writePreference:p=>writes.push(p),browserLanguages:()=>['ja-JP'],isDesktop:()=>false,regionLanguage:async()=>countryLanguage(country)});
  await store.restore();assert.equal(store.getLanguage(),expected);assert.equal(store.getPreference(),'auto');
 }
 assert.deepEqual(writes,[]);
});
test('manual preference skips region lookup and later selection cancels pending web detection',async()=>{
 let calls=0,signal:AbortSignal|undefined,finish!:(r:Response)=>void,stored:unknown='ko';
 const store=createLocaleStore({readPreference:()=>stored,writePreference:p=>{stored=p;},browserLanguages:()=>['en-US'],isDesktop:()=>false,regionLanguage:s=>{calls++;signal=s;return fetchRegionLanguage(()=>new Promise(r=>{finish=r;}),s);}});
 await store.restore();assert.equal(calls,0);assert.equal(store.getLanguage(),'ko');
 const auto=store.setPreference('auto');assert.equal(calls,1);
 await store.setPreference('ja');await auto;assert.equal(signal?.aborted,true);assert.equal(stored,'ja');
 finish(Response.json({language:'en'}));await Promise.resolve();assert.equal(store.getLanguage(),'ja');
});
test('newer region detection wins over delayed old response',async()=>{
 const pending:Array<(v:'ko'|'ja')=>void>=[];
 const store=createLocaleStore({readPreference:()=>null,writePreference:()=>{},browserLanguages:()=>['en-US'],isDesktop:()=>false,regionLanguage:()=>new Promise(resolve=>pending.push(resolve))});
 const old=store.restore(),recent=store.setPreference('auto');pending[1]('ja');await recent;pending[0]('ko');await old;assert.equal(store.getLanguage(),'ja');
});
test('unavailable or failed regional lookup preserves browser language',async()=>{
 for(const regionLanguage of [async()=>null,async()=>{throw Error('offline');}]){
  const store=createLocaleStore({readPreference:()=>null,writePreference:()=>{},browserLanguages:()=>['ko-KR'],isDesktop:()=>false,regionLanguage});
  await store.restore();assert.equal(store.getLanguage(),'ko');
 }
});
test('region client uses same-origin minimal request and rejects invalid/failing results',async()=>{
 let url='',options:RequestInit={};const controller=new AbortController();
 const result=await fetchRegionLanguage(async(u,o)=>{url=u;options=o;return Response.json({language:'ja'});},controller.signal);
 assert.equal(result,'ja');assert.equal(url,'/api/locale');assert.equal(options.cache,'no-store');assert.equal(options.credentials,'same-origin');assert.equal(options.redirect,'error');assert.ok(options.signal);
 for(const response of [Response.json({country:'JP'}),Response.json({language:'fr'}),Response.json(['ko']),Response.json(null),new Response('invalid JSON'),new Response('',{status:503})])assert.equal(await fetchRegionLanguage(async()=>response,controller.signal),null);
 assert.equal(await fetchRegionLanguage(async()=>{throw Error('network');},controller.signal),null);
});
test('region timeout aborts fetch and completes even if network ignores abort',async()=>{
 let signal:AbortSignal|undefined;
 assert.equal(await fetchRegionLanguage(async(_u,o)=>{signal=o.signal as AbortSignal;return new Promise<Response>(()=>{});},new AbortController().signal,5),null);assert.equal(signal?.aborted,true);
 const aborted=new AbortController();aborted.abort();let called=false;assert.equal(await fetchRegionLanguage(async()=>{called=true;return Response.json({language:'ko'});},aborted.signal),null);assert.equal(called,false);
});
test('desktop never calls region endpoint, retaining Steam then OS then browser order',async()=>{
 for(const [platform,expected] of [[{steamLanguage:'koreana',osLanguages:['ja-JP']},'ko'],[{steamLanguage:'french',osLanguages:['ja-JP']},'ja'],[null,'en']] as const){
  let regions=0;const store=createLocaleStore({readPreference:()=>null,writePreference:()=>{},browserLanguages:()=>['en-US'],isDesktop:()=>true,platformInfo:async()=>platform,regionLanguage:async()=>{regions++;return 'ko';}});
  await store.restore();assert.equal(store.getLanguage(),expected);assert.equal(regions,0);
 }
 const failed=createLocaleStore({readPreference:()=>null,writePreference:()=>{},browserLanguages:()=>['ja-JP'],isDesktop:()=>true,platformInfo:async()=>{throw Error('offline bridge');},regionLanguage:async()=>{throw Error('must not call');}});await failed.restore();assert.equal(failed.getLanguage(),'ja');
});
