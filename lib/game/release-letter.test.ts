import test from 'node:test';
import assert from 'node:assert/strict';
import {CAREER_JOBS,type Localized} from './career-content.ts';
import {CAREER_CODE_FILE} from './career-code.ts';
import {CAREER_TRACKS,careerFootprint} from './career-tags.ts';
import {act,createGame,type GameState} from './engine.ts';
import {exampleSolution} from './career-evaluation.ts';
import {RELEASE_EXAMPLE,releaseFootprint,releaseLetter,type ReleaseEnding,type ReleaseFootprint} from './release.ts';
import {readSave} from './save.ts';

const JS:Record<string,string>={
 'bakery-price':'function solve(input) { return Math.floor(input.quantity / 6) * 10000 + input.quantity % 6 * 1800; }',
 'library-loans':'function solve(input) { return input.borrowed + input.requested <= 3 && input.overdueDays === 0; }',
};
function opened(){const s=createGame();s.completed=[0,1,2];s.mission=2;return act(s,{type:'celebrate-opening'});}
function deliver(s:GameState,id:string,choice:string,code:boolean){
 s=act(act(s,{type:'career-accept',id}),{type:'career-inspect',id});
 if(code){s=act(s,{type:'career-code-mode',id,mode:'javascript'});s=act(s,{type:'career-edit',id,file:CAREER_CODE_FILE,content:JS[id]});}
 else for(const [file,content] of Object.entries(exampleSolution(id)))s=act(s,{type:'career-edit',id,file,content});
 return act(act(s,{type:'career-test',id}),{type:'career-deliver',id,choice});
}
function finish(choice:(index:number)=>string,code:readonly string[]){
 let s=opened();
 for(const [index,job] of CAREER_JOBS.filter((_,index)=>index%6<4).entries())s=readSave(JSON.stringify(deliver(s,job.id,choice(index),code.includes(job.id))));
 s=act(s,{type:'career-release-start'});
 for(const [file,content] of Object.entries(RELEASE_EXAMPLE))s=act(s,{type:'career-release-edit',file,content});
 for(const type of ['career-release-test','career-release-build','career-release-publish','career-ending'] as const)s=act(s,{type});
 return readSave(JSON.stringify(s));
}
const all=(values:Localized[])=>values.flatMap(value=>[value.ko,value.en,value.ja]);
function clean(values:Localized[]){
 for(const text of all(values)){assert.ok(text.trim());assert.doesNotMatch(text,/undefined|null|\$\{|도움판|案内板|your board/);}
}

test('the final letter quotes the player’s own clients, field, JavaScript work and released product',()=>{
 const s=finish(index=>index<8?'care':'craft',['bakery-price','library-loans']);
 assert.equal(s.gameplay.career.ending,'community');
 const footprint=releaseFootprint(s);
 assert.deepEqual(footprint.javascript,['bakery-price','library-loans']);
 assert.equal(footprint.lead,'server');assert.equal(footprint.tracks.server,4);assert.equal(footprint.jobs.length,12);
 assert.equal(footprint.title,'My neighborhood studio');assert.equal(footprint.product?.kind,'portfolio');
 const letter=releaseLetter('community',footprint),ko=letter.paragraphs.map(p=>p.ko).join('\n'),en=letter.paragraphs.map(p=>p.en).join('\n'),ja=letter.paragraphs.map(p=>p.ja).join('\n');
 assert.equal(letter.sender,'지우');clean([...letter.paragraphs,...letter.director]);
 assert.match(ko,/새벽빵집 해나 씨랑 기록보관소 온 씨도/);assert.match(en,/Hana at Dawn Bakery and On at Local Archive/);assert.match(ja,/夜明けベーカリーのハナさんも/);
 assert.match(ko,/의뢰 2건은 JavaScript/);assert.match(en,/solved 2 jobs by writing JavaScript/);assert.match(ja,/2件の依頼はJavaScript/);
 assert.match(ko,/‘My neighborhood studio’ 주소를 이웃들에게 전했어\. 작품 모음에 올린 ‘Bakery calculator’부터/);
 assert.match(en,/“Bakery calculator” on your portfolio/);assert.match(ja,/作品集に載せた「Bakery calculator」/);
 assert.match(ko,/로그, 백업/);
 const director=letter.director.map(p=>p.ko).join('\n');
 assert.match(director,/동네 의뢰 12건/);assert.match(director,/‘서버·운영’\(4건 중 4건\)/);assert.match(director,/그중 2건은/);assert.match(director,/HTTP 메서드/);
});
test('a settings-only craft route gets Minseo’s letter and a nudge toward the JavaScript jobs',()=>{
 const s=finish(()=>'craft',[]);
 assert.equal(s.gameplay.career.ending,'studio');
 const letter=releaseLetter('studio',releaseFootprint(s));
 assert.equal(letter.sender,'민서');clean([...letter.paragraphs,...letter.director]);
 assert.match(letter.paragraphs.map(p=>p.ko).join(''),/설정 파일만으로 모든 의뢰를 끝냈지/);
 assert.match(letter.director.map(p=>p.en).join(''),/JS badge/);
 // The ending snapshot, not later optional work, drives the letter.
 const later=deliver(s,'clinic-form','care',false);assert.ok(later.gameplay.career.completed.includes('clinic-form'));
 assert.equal(releaseFootprint(later).jobs.length,12);assert.equal(releaseFootprint(later).tracks.interface,0);
});
test('every ending, field, code count and product kind produces complete letters in three languages',()=>{
 const base=careerFootprint(CAREER_JOBS.slice(0,12).map(job=>job.id),()=>({}));
 const clients=[CAREER_JOBS[0].client,CAREER_JOBS[11].client];
 for(const ending of ['community','studio','balanced'] as ReleaseEnding[])for(const lead of CAREER_TRACKS)for(const count of [0,1,3])for(const kind of ['directory','events','portfolio',null] as const)for(const title of ['Corner Guide','']){
  const footprint:ReleaseFootprint={...base,lead,javascript:CAREER_JOBS.slice(0,count).map(job=>job.id),clients,title,product:kind?{kind,description:'d',items:[{name:'First item',detail:'',category:''}],accent:'sage',layout:'list'}:null};
  const letter=releaseLetter(ending,footprint);
  clean([letter.title,...letter.paragraphs,...letter.director]);
  assert.equal(letter.paragraphs.length,6);assert.equal(letter.director.length,4);
  if(kind)assert.ok(letter.paragraphs.some(p=>p.en.includes('First item')),`${ending} ${kind}`);
  if(title)assert.ok(letter.paragraphs.some(p=>p.ko.includes('‘Corner Guide’')&&p.ja.includes('「Corner Guide」')));
 }
 // Without two quotable clients or any field, the letter still reads as a whole.
 const sparse=releaseLetter('balanced',{...base,lead:null,clients:[],javascript:[],title:'',product:null});
 clean([...sparse.paragraphs,...sparse.director]);assert.equal(sparse.paragraphs.length,4);assert.equal(sparse.director.length,3);
});
