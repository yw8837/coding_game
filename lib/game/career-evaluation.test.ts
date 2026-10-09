import test from 'node:test';
import assert from 'node:assert/strict';
import {CAREER_JOBS} from './career-content.ts';
import {evaluateCareer,exampleSolution} from './career-evaluation.ts';
import {act,createGame} from './engine.ts';
import {readSave} from './save.ts';

const ids=['bakery-price','library-loans','florist-stock','bike-hours','contacts-clean','clinic-form','market-filter','school-sort','workshop-slots','delivery-fees','museum-layout','bookstore-invoice','community-api','photo-cache','transit-logs','archive-backup','tutor-timezone','festival-report'];

test('a five-roll box cannot impersonate the requested six-roll box or earn delivery credit',()=>{
 const files=exampleSolution('bakery-price');files['pricing.json']='{"unitPrice":1800,"packSize":5,"packPrice":8200}';
 assert.equal(evaluateCareer('bakery-price',files).passed,false);
 const solved=evaluateCareer('bakery-price',exampleSolution('bakery-price'));
 assert.equal(solved.checks.find(c=>c.name.en==='Five singles below a full box')?.actual,'9000');
 assert.equal(solved.checks.find(c=>c.name.en==='Ten rolls total')?.actual,'17200');
 let s=createGame();s.completed=[0,1,2];s=act(s,{type:'celebrate-opening'});
 s=act(s,{type:'career-accept',id:'bakery-price'});s=act(s,{type:'career-inspect',id:'bakery-price'});
 s=act(s,{type:'career-edit',id:'bakery-price',file:'pricing.json',content:files['pricing.json']});s=act(s,{type:'career-test',id:'bakery-price'});
 const credits=s.credits;s=act(s,{type:'career-deliver',id:'bakery-price',choice:'care'});
 assert.equal(s.credits,credits);assert.deepEqual(s.gameplay.career.completed,[]);assert.deepEqual(readSave(JSON.stringify(s)).gameplay.career.completed,[]);
});

test('booking controls must belong to the same supported form and malformed ownership cannot earn credit',()=>{
 const controls='<label for="name">Name</label><input id="name" name="name" type="text" required><button type="submit">Book</button>';
 const invalid=[controls+'<form></form>','<form>'+controls.replace(' required',' required form="elsewhere"')+'</form>','<form>'+controls.replace('type="submit"','type="submit" form="elsewhere"')+'</form>','<form>'+controls.replace('type="text"','type="hidden" type="text"')+'</form>','<form><!--'+controls+'--></form>','<form><fieldset disabled>'+controls+'</fieldset></form>','<form>'+controls+'</form><form></form>','<form style="display:none">'+controls+'</form>','<form>'+controls.replace('type="submit"','type="submit" style="visibility:hidden"')+'</form>'];
 for(const content of invalid){
  const files={...exampleSolution('clinic-form'),'booking.html':content};assert.equal(evaluateCareer('clinic-form',files).passed,false,content);
  let s=createGame();s.completed=[0,1,2];s=act(s,{type:'celebrate-opening'});s=act(s,{type:'career-accept',id:'clinic-form'});s=act(s,{type:'career-inspect',id:'clinic-form'});s=act(s,{type:'career-edit',id:'clinic-form',file:'booking.html',content});s=act(s,{type:'career-test',id:'clinic-form'});
  const credits=s.credits;s=act(s,{type:'career-deliver',id:'clinic-form',choice:'care'});assert.equal(s.credits,credits);assert.deepEqual(s.gameplay.career.completed,[]);
 }
 const owned='<form id="booking">'+controls.replace(' required',' required form="booking"').replace('type="submit"','type="submit" form="booking"')+'</form>';
 assert.equal(evaluateCareer('clinic-form',{...exampleSolution('clinic-form'),'booking.html':owned}).passed,true);
 assert.equal(evaluateCareer('clinic-form',exampleSolution('clinic-form')).passed,true);
});

test('all eighteen contracts produce failing starter evidence and pass the explicit help example',()=>{
 assert.deepEqual(CAREER_JOBS.map(j=>j.id),ids);
 for(const job of CAREER_JOBS){
  const starter=evaluateCareer(job.id,job.files);
  assert.equal(starter.passed,false,job.id);
  assert.ok(starter.checks.length>=3,job.id);
  assert.ok(starter.checks.some(c=>!c.passed),job.id);
  assert.ok(starter.preview.length>=3,job.id);
  const solved=evaluateCareer(job.id,exampleSolution(job.id));
  assert.equal(solved.passed,true,`${job.id}: ${JSON.stringify(solved.checks)}`);
  assert.ok(solved.checks.every(c=>c.passed),job.id);
 }
});

test('malformed or executable-looking edits fail safely without running code',()=>{
 for(const id of ids){
  const files=Object.fromEntries(Object.keys(exampleSolution(id)).map(path=>[path,'globalThis.__careerExecuted = true; <script>alert(1)</script> {']));
  assert.doesNotThrow(()=>evaluateCareer(id,files),id);
  assert.equal(evaluateCareer(id,files).passed,false,id);
  assert.equal(evaluateCareer(id,{}).passed,false,id);
 }
 assert.equal((globalThis as Record<string,unknown>).__careerExecuted,undefined);
 assert.equal(evaluateCareer('unknown',{}).passed,false);
});

test('pack pricing computes the edited values, including zero and leftover items',()=>{
 const files=exampleSolution('bakery-price');
 const good=evaluateCareer('bakery-price',files);
 assert.deepEqual(good.checks.slice(0,3).map(c=>c.actual),['0','10000','13600']);
 files['pricing.json']=JSON.stringify({unitPrice:1800,packSize:6,packPrice:9000});
 const changed=evaluateCareer('bakery-price',files);
 assert.equal(changed.passed,false);
 assert.equal(changed.checks[1].actual,'9000');
 assert.equal(changed.preview[1].value,'9000');
});

test('loan policy checks exact capacity and overdue borrowers rather than a canned pass',()=>{
 const files=exampleSolution('library-loans');
 assert.deepEqual(evaluateCareer('library-loans',files).checks.slice(0,3).map(c=>c.actual),['true','false','false']);
 files['policy.json']=JSON.stringify({limit:3,allowOverdue:true,inclusive:true});
 assert.equal(evaluateCareer('library-loans',files).checks[2].passed,false);
});

test('CSV ordering and JSON formatting can differ while observable results remain valid',()=>{
 const stock=exampleSolution('florist-stock');
 stock['inventory.csv']='name,stock,reserved\nlily,3,3\nrose,12,5\ntulip,8,0\n';
 assert.equal(evaluateCareer('florist-stock',stock).passed,true);
 const policy=exampleSolution('library-loans');
 policy['policy.json']='{ "inclusive": true, "allowOverdue": false, "limit": 3 }';
 assert.equal(evaluateCareer('library-loans',policy).passed,true);
 const layout=exampleSolution('museum-layout');
 layout['gallery.css']='.gallery { box-sizing: border-box; padding: 16px; max-width: 900px; width: 100.0%; }';
 assert.equal(evaluateCareer('museum-layout',layout).passed,true);
});

test('actual CSV input and sort/filter settings alter preview output',()=>{
 const market=exampleSolution('market-filter');
 assert.deepEqual(evaluateCareer('market-filter',market).checks.slice(0,3).map(c=>c.actual),['apple','carrot','bread']);
 market['filter.json']='{"field":"stock","operator":">","value":2}';
 assert.equal(evaluateCareer('market-filter',market).passed,false);
 const school=exampleSolution('school-sort');
 assert.deepEqual(evaluateCareer('school-sort',school).checks.slice(0,3).map(c=>c.actual),['Mina','Jo','Ari']);
 school['sort.json']='{"field":"score","direction":"asc","tie":"name"}';
 assert.equal(evaluateCareer('school-sort',school).passed,false);
});

test('HTML accessibility parses edited form semantics and rejects active content',()=>{
 const files=exampleSolution('clinic-form');
 assert.equal(evaluateCareer('clinic-form',files).passed,true);
 files['booking.html']=files['booking.html'].replace('for="name"','for="wrong"');
 assert.equal(evaluateCareer('clinic-form',files).checks[0].passed,false);
 files['booking.html']=exampleSolution('clinic-form')['booking.html']+'<script>1</script>';
 assert.equal(evaluateCareer('clinic-form',files).passed,false);
});

test('authored localizations expose goals, file meanings, hints and both reply styles',()=>{
 for(const job of CAREER_JOBS){
  assert.equal(job.hints.length,3,job.id);
  assert.ok(job.choices.some(c=>c.style==='care'));
  assert.ok(job.choices.some(c=>c.style==='craft'));
  assert.deepEqual(Object.keys(job.files).sort(),Object.keys(job.fileDescriptions).sort());
  for(const copy of [job.client,job.title,job.brief,...Object.values(job.fileDescriptions),...job.hints,...job.choices.flatMap(c=>[c.label,c.reply])]){
   for(const language of ['ko','en','ja'] as const)assert.ok(copy[language]?.trim().length>0,`${job.id}: ${language}`);
  }
 }
});

test('hand-checked outcomes cover schedule, fees, storage, logs, time carry and final report',()=>{
 const cases:[string,string[]][]=[
  ['florist-stock',['7','8','0']],
  ['bike-hours',['false','true','false','false']],
  ['contacts-clean',['luna@example.test','jun@example.test','2','false']],
  ['workshop-slots',['60','60','60','0','0','09:00','12:00']],
  ['delivery-fees',['2900','0','unavailable','2000']],
  ['museum-layout',['320','768','900','16']],
  ['bookstore-invoice',['17600','2000','17160','14300','0']],
  ['community-api',['200','201','1','404','404']],
  ['photo-cache',['86400','0','Lio','true']],
  ['transit-logs',['3','2','1']],
  ['archive-backup',['true','true','false','39']],
  ['tutor-timezone',['D+1 08:00','D+0 11:00','D+1 03:00']],
  ['festival-report',['8000','10000','18000','3']],
 ];
 for(const [id,want] of cases)assert.deepEqual(evaluateCareer(id,exampleSolution(id)).checks.slice(0,want.length).map(c=>c.actual),want,id);
});

test('a different valid filter and semantically equivalent form pass without matching example text',()=>{
 const market=exampleSolution('market-filter');market['filter.json']='{"field":"stock","operator":">=","value":1,"requireFresh":true}';
 assert.equal(evaluateCareer('market-filter',market).passed,true);
 const form=exampleSolution('clinic-form');form['booking.html']="<form><label for='visitor'>Your name</label><input required='required' type='text' name='name' id='visitor'><button type='submit'>Reserve</button></form>";
 assert.equal(evaluateCareer('clinic-form',form).passed,true);
 const contacts=exampleSolution('contacts-clean');contacts['contacts.csv']='name,email\n"Luna", LUNA@example.test \nLuna again,luna@example.test\nJun,jun@example.test\nNo address,\n';
 assert.equal(evaluateCareer('contacts-clean',contacts).passed,true);
});

test('editing carried day, storage or report filter changes actual preview and fails the relevant checks',()=>{
 const zone=exampleSolution('tutor-timezone');zone['timezone.json']='{"offsetHours":9,"carryDay":false}';
 const zoned=evaluateCareer('tutor-timezone',zone);assert.equal(zoned.checks[0].actual,'D+0 08:00');assert.equal(zoned.passed,false);
 const api=exampleSolution('community-api');const config=JSON.parse(api['routes.json']);config.persist=false;api['routes.json']=JSON.stringify(config);
 assert.equal(evaluateCareer('community-api',api).checks[2].actual,'0');
 const logs=exampleSolution('transit-logs');logs['report.json']='{"level":"ERROR","status":500,"groupBy":"route"}';
 assert.deepEqual(evaluateCareer('transit-logs',logs).checks.slice(0,3).map(c=>c.actual),['1','0','0']);
 const festival=exampleSolution('festival-report');festival['summary.json']='{"includeStatus":"all","operation":"multiply","groupBy":"booth"}';
 assert.equal(evaluateCareer('festival-report',festival).checks[2].actual,'29000');
});

test('bad numeric types, truncated CSV, active HTML and oversized inputs return readable failure evidence',()=>{
 const badFiles:[string,string,string][]=[
  ['bakery-price','pricing.json','{"unitPrice":1800,"packSize":0,"packPrice":10000}'],
  ['library-loans','policy.json','{"limit":3,"inclusive":"true","allowOverdue":false}'],
  ['florist-stock','inventory.csv','name,stock,reserved\nrose,12\n'],
  ['contacts-clean','contacts.csv','name,email\n"never closed,mail@example.test\n'],
  ['clinic-form','booking.html','<form><label for="name">Name</label><input id="name" name="name" required onfocus="alert(1)"><button type="submit">Book</button></form>'],
  ['museum-layout','gallery.css','.gallery { width: calc(100% - 32px); max-width: 900px; padding: 16px; box-sizing: content-box; }'],
  ['transit-logs','service.log','25:00 ERROR /arrivals 503'],
  ['tutor-timezone','timezone.json','x'.repeat(20001)],
 ];
 for(const [id,path,source] of badFiles){const files=exampleSolution(id);files[path]=source;const result=evaluateCareer(id,files);assert.equal(result.passed,false,id);assert.equal(result.checks.length,3,id);assert.ok(result.checks[0].actual.length>0,id);}
});

test('each customer has distinct choices and completed-outcome replies instead of a shared request',()=>{
 for(const lang of ['ko','en','ja'] as const){
  const labels=CAREER_JOBS.flatMap(j=>j.choices.map(c=>c.label[lang]));
  const replies=CAREER_JOBS.flatMap(j=>j.choices.map(c=>c.reply[lang]));
  assert.equal(new Set(labels).size,36,`${lang} player choices`);
  assert.equal(new Set(replies).size,36,`${lang} customer outcomes`);
 }
});

test('explicit request boundaries reject wrong thresholds, opening times and displaced classes',()=>{
 const wrong:[string,string,Record<string,unknown>][]=[
  ['bookstore-invoice','invoice.json',{discountMin:1}],
  ['bookstore-invoice','invoice.json',{discountMin:14999}],
  ['bookstore-invoice','invoice.json',{taxRate:0.10005}],
  ['delivery-fees','delivery.json',{freeAt:6000}],
  ['delivery-fees','delivery.json',{maxKm:10.5}],
  ['bike-hours','hours.json',{opens:10}],
  ['bike-hours','hours.json',{closes:17}],
  ['bike-hours','hours.json',{closedDays:['sun','tue']}],
 ];
 for(const [id,path,values] of wrong){const files=exampleSolution(id);files[path]=JSON.stringify({...JSON.parse(files[path]),...values});assert.equal(evaluateCareer(id,files).passed,false,`${id} ${JSON.stringify(values)}`);}
 const moved=exampleSolution('workshop-slots');moved['schedule.csv']='id,start,end\nA,09:00,10:00\nB,07:00,08:00\nC,11:00,12:00\n';assert.equal(evaluateCareer('workshop-slots',moved).passed,false);
});

test('derived outputs cannot pass by erasing reserved flowers or immutable customer records',()=>{
 const edits:[string,string,string][]=[
  ['florist-stock','inventory.csv','name,stock,reserved\nrose,7,0\ntulip,8,0\nlily,0,0\n'],
  ['market-filter','products.csv','name,stock,fresh\napple,3,true\ncarrot,1,true\nbread,2,true\n'],
  ['school-sort','scores.csv','name,score\nMina,1\nJo,2\nAri,3\n'],
  ['contacts-clean','contacts.csv','name,email\nLuna,luna@example.test\nJun,jun@example.test\n'],
  ['bookstore-invoice','items.csv','item,quantity,unit\npen,2,1800\nbook,2,7000\ncard,0,500\n'],
  ['transit-logs','service.log','09:01 ERROR /arrivals 503\n09:03 ERROR /tickets 503\n09:04 ERROR /arrivals 503\n'],
  ['archive-backup','copies.csv','name,daysOld,sizeMB\ntoday,0,12\nyesterday,5,13\nweekly,6,14\nold,100,15\n'],
  ['festival-report','sales.csv','booth,quantity,unit,status\nbread,3,2000,paid\ncraft,2,5000,paid\nbread,1,2000,paid\n'],
 ];
 for(const [id,path,content] of edits){const files=exampleSolution(id);files[path]=content;assert.equal(evaluateCareer(id,files).passed,false,id);}
 const market={...CAREER_JOBS.find(j=>j.id==='market-filter')!.files};market['products.csv']=edits[1][2];assert.equal(evaluateCareer('market-filter',market).passed,false,'faulty filter must not pass by deleting counterexamples');
 const school={...CAREER_JOBS.find(j=>j.id==='school-sort')!.files};school['scores.csv']=edits[2][2];assert.equal(evaluateCareer('school-sort',school).passed,false,'ascending must not pass by falsifying scores');
});

test('a half-size box cannot pass six-roll pricing and disabled forms cannot pass booking',()=>{
 const price=exampleSolution('bakery-price');price['pricing.json']='{"unitPrice":1800,"packSize":3,"packPrice":5000}';assert.equal(evaluateCareer('bakery-price',price).passed,false);
 for(const change of [
  (html:string)=>html.replace('type="text" required','type="text" required disabled'),
  (html:string)=>html.replace('type="text" required','type="text" required readonly'),
  (html:string)=>html.replace('type="submit"','type="submit" disabled'),
  (html:string)=>html.replace('<form>','<form novalidate>'),
  (html:string)=>html.replace('type="submit"','type="submit" formnovalidate'),
 ]){const form=exampleSolution('clinic-form');form['booking.html']=change(form['booking.html']);assert.equal(evaluateCareer('clinic-form',form).passed,false);}
});

test('filter and contact results do not invent an ordering requirement for unchanged input rows',()=>{
 const market=exampleSolution('market-filter');market['products.csv']='name,stock,fresh\ncandy,5,false\nmilk,0,true\nbread,2,true\ncarrot,1,true\napple,3,true\n';assert.equal(evaluateCareer('market-filter',market).passed,true);
 const contacts=exampleSolution('contacts-clean');contacts['contacts.csv']='name,email\nNo address,\nJun,jun@example.test\nLuna again,luna@example.test\nLuna, LUNA@example.test \n';assert.equal(evaluateCareer('contacts-clean',contacts).passed,true);
});
