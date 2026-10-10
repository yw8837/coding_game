import test from 'node:test';
import assert from 'node:assert/strict';
import {CAREER_JOBS} from './career-content.ts';
import {CAREER_CODE_IDS,CAREER_CODE_FILE,CAREER_CODE_MODE_FILE} from './career-code.ts';
import {CAREER_TRACKS,CAREER_TRACK_LABELS,careerExperience,careerFootprint,careerRecommend,careerSolvedWithCode,careerTags} from './career-tags.ts';

const byId=(id:string)=>CAREER_JOBS.find(job=>job.id===id)!;
test('every job has a field, a localized concept and file-format tags derived from its files',()=>{
 for(const job of CAREER_JOBS){
  const tags=careerTags(job);
  assert.ok(CAREER_TRACKS.includes(tags.track),job.id);
  for(const lang of ['ko','en','ja'] as const){assert.ok(tags.concept[lang].trim(),job.id+' '+lang);assert.notEqual(tags.concept[lang],job.kind,job.id+' concept is localized');}
  assert.ok(tags.formats.length>=1,job.id);
  assert.equal(tags.javascript,(CAREER_CODE_IDS as readonly string[]).includes(job.id),job.id);
 }
 assert.deepEqual(careerTags(byId('clinic-form')).formats,['HTML']);
 assert.deepEqual(careerTags(byId('museum-layout')).formats,['CSS']);
 assert.deepEqual(careerTags(byId('transit-logs')).formats,['LOG','JSON']);
 assert.deepEqual(careerTags(byId('contacts-clean')).formats,['CSV','JSON']);
 assert.equal(CAREER_JOBS.filter(job=>careerTags(job).javascript).length,CAREER_CODE_IDS.length);
 for(const track of CAREER_TRACKS){assert.ok(CAREER_JOBS.some(job=>careerTags(job).track===track),track);for(const lang of ['ko','en','ja'] as const)assert.ok(CAREER_TRACK_LABELS[track][lang]);}
 // Each district offers at least two fields, so choosing four of six is a real choice of direction.
 for(const act of [1,2,3])assert.ok(new Set(CAREER_JOBS.filter(job=>job.act===act).map(job=>careerTags(job).track)).size>=2);
});
test('recommendation prefers an unfinished district, then an untried field, then untried formats',()=>{
 const act1=CAREER_JOBS.filter(job=>job.act===1);
 assert.equal(careerRecommend([],act1)?.id,'bakery-price');
 // Two logic/JSON jobs done: the first untried field with an untried format is the flower shop's CSV.
 assert.equal(careerRecommend(['bakery-price','library-loans'],act1)?.id,'florist-stock');
 // Logic and data tried: the clinic is the only remaining new field.
 assert.equal(careerRecommend(['bakery-price','library-loans','florist-stock'],act1)?.id,'clinic-form');
 // Once district 1 has four jobs, district 2 work ranks above district 1 leftovers.
 const done=['bakery-price','library-loans','florist-stock','clinic-form'];
 const pick=careerRecommend(done,CAREER_JOBS.filter(job=>job.act<=2));
 // No district-2 field is new, so the only untried format (CSS) decides.
 assert.equal(pick?.act,2);assert.equal(pick?.id,'museum-layout');
 assert.equal(careerRecommend(CAREER_JOBS.map(job=>job.id),CAREER_JOBS),null);
 const seen=careerExperience(done);assert.deepEqual([...seen.tracks].sort(),['data','interface','logic']);assert.ok(seen.formats.has('HTML')&&seen.formats.has('CSV'));
});
test('only a valid JavaScript mode marker on a code-capable job counts as solved with code',()=>{
 assert.equal(careerSolvedWithCode('bakery-price',{[CAREER_CODE_MODE_FILE]:'{"mode":"javascript"}\n',[CAREER_CODE_FILE]:'function solve(){}'}),true);
 assert.equal(careerSolvedWithCode('bakery-price',{[CAREER_CODE_MODE_FILE]:'{"mode":"config"}\n',[CAREER_CODE_FILE]:'function solve(){}'}),false);
 assert.equal(careerSolvedWithCode('bakery-price',{[CAREER_CODE_MODE_FILE]:'{"mode":"javascript","extra":1}'}),false);
 assert.equal(careerSolvedWithCode('bakery-price',{[CAREER_CODE_MODE_FILE]:'not json'}),false);
 assert.equal(careerSolvedWithCode('bakery-price',{'pricing.json':'{}'}),false);
 assert.equal(careerSolvedWithCode('clinic-form',{[CAREER_CODE_FILE]:'function solve(){}'}),false);
});
test('footprint counts fields and picks the field with the highest share as the lead',()=>{
 const none=careerFootprint([],()=>({}));assert.equal(none.lead,null);assert.equal(none.jobs.length,0);
 // Both interface jobs (2/2) outrank three data jobs (3/5).
 const ui=careerFootprint(['clinic-form','museum-layout','florist-stock','market-filter','school-sort'],()=>({}));
 assert.equal(ui.lead,'interface');assert.equal(ui.tracks.interface,2);assert.equal(ui.tracks.data,3);assert.equal(ui.totals.interface,2);
 // Equal shares fall to the larger count.
 const tie=careerFootprint(['clinic-form','museum-layout',...CAREER_JOBS.filter(job=>careerTags(job).track==='data').map(job=>job.id)],()=>({}));
 assert.equal(tie.lead,'data');
 const code=careerFootprint(['bakery-price','clinic-form','festival-report'],(id):Record<string,string>=>id==='bakery-price'?{[CAREER_CODE_MODE_FILE]:'{"mode":"javascript"}\n'}:{});
 assert.deepEqual(code.javascript,['bakery-price']);
});
