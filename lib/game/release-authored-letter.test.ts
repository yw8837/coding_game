import test from 'node:test';
import assert from 'node:assert/strict';
import {careerFootprint} from './career-tags.ts';
import {releaseLetter,type ReleaseEnding,type ReleaseFootprint} from './release-letter.ts';
import {authoredStartFiles} from './release-authored.ts';
import {releaseFootprint,RELEASE_ROOT} from './release.ts';
import {createGame} from './engine.ts';

test('authored final letters name actual title, format and purpose in every ending and locale without requiring items',()=>{
 for(const format of ['website','webapp'] as const)for(const ending of ['community','studio','balanced'] as ReleaseEnding[]){
  const footprint:ReleaseFootprint={...careerFootprint([],()=>({})),clients:[],title:'My travel sketches',product:null,authored:{format,description:'A place to share the drawings I made on a trip.'}};
  const letter=releaseLetter(ending,footprint);
  for(const locale of ['ko','en','ja'] as const){
   const text=letter.paragraphs.map(paragraph=>paragraph[locale]).join('\n');
   assert.ok(text.includes(footprint.title));assert.ok(text.includes(footprint.authored!.description));
   assert.ok(text.includes(({website:{ko:'웹사이트',en:'website',ja:'ウェブサイト'},webapp:{ko:'웹앱',en:'web app',ja:'ウェブアプリ'}})[format][locale]));
   if(format==='website')assert.doesNotMatch(text,/문의|inquiry|問い合わせ|도움판|help board/);
   assert.ok(letter.director.some(paragraph=>paragraph[locale].includes(footprint.title)));
  }
 }
});
test('an authored website without a metadata purpose retains its actual title without inventing an inquiry feature',()=>{
 const footprint:ReleaseFootprint={...careerFootprint([],()=>({})),clients:[],title:'A page of my photos',product:null,authored:{format:'website',description:''}};
 const letter=releaseLetter('balanced',footprint),text=letter.paragraphs.map(paragraph=>paragraph.en).join('\n');
 assert.match(text,/A page of my photos/);assert.match(text,/website/);assert.doesNotMatch(text,/inquiry|description:|places|undefined|null/);
});
test('website footprint carries authored format even when its own content has no list items',()=>{
 const state=createGame(),files=authoredStartFiles('website','en');
 files['index.html']=files['index.html'].replaceAll('My project','My illustrated diary');
 const product=JSON.parse(files['project.json']);product.description='My personal illustrated diary.';product.items=[];files['project.json']=JSON.stringify(product);
 for(const [file,content] of Object.entries(files))state.machines.local.files[RELEASE_ROOT+'/'+file]=content;
 const footprint=releaseFootprint(state);
 assert.equal(footprint.title,'My illustrated diary');
 assert.deepEqual(footprint.authored,{format:'website',description:'My personal illustrated diary.'});
 assert.equal(footprint.product,null);
});
