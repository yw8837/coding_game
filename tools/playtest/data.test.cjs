'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const context={module:{exports:{}}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'data.js'),'utf8'),context);const D=context.module.exports;
test('all new observations and ratings stay missing, never count as successful',()=>{const s=D.empty();const r={version:1,sessions:[s]};const stats=D.summary(r);assert.equal(stats.independent,0);assert.equal(stats.untested,7);assert.equal(stats.missingRatings,3);assert.equal(stats.beginners,0);assert.equal(D.parseJSON(JSON.stringify(r)).sessions[0].enjoyment,null);});
test('JSON and CSV round trips preserve Korean, commas, quotes and multiline evidence',()=>{const s=D.empty();s.consent=true;s.experience='none';s.tasks[0].confusion='"메시지", 어디?\n두 번째 줄';s.nextAction='=1+1';s.cause='@formula';s.transferResponse="'=already literal";s.tasks[1].evidence='-값을 바꾸려 했음';const r=D.validate({version:1,sessions:[s]});assert.equal(JSON.stringify(D.parseCSV(D.exportCSV(r))),JSON.stringify(r));assert.equal(JSON.stringify(D.parseJSON(JSON.stringify(r))),JSON.stringify(r));assert.match(D.exportCSV(r),/"'=1\+1"/);assert.equal(D.summary(r).independent,0);});
test('invalid JSON and CSV reject invalid ratings, duplicates, enum values and incomplete rows',()=>{const r={version:1,sessions:[D.empty()]};for(const mutate of [r=>r.version=2,r=>r.sessions[0].enjoyment=0,r=>r.sessions[0].tasks[0].outcome='passed',r=>r.sessions[0].tasks.pop(),r=>r.sessions.push(r.sessions[0]),r=>r.sessions[0].code='실명',r=>r.sessions[0].minutes=-1,r=>r.sessions[0].recording=true]){const v=structuredClone(r);mutate(v);assert.throws(()=>D.validate(v));}assert.throws(()=>D.parseJSON('{broken'));assert.throws(()=>D.parseJSON(' '.repeat(D.LIMIT+1)));const csv=D.exportCSV(r);assert.throws(()=>D.parseCSV(csv.split('\r\n').slice(0,2).join('\r\n')));assert.throws(()=>D.parseCSV(csv.replace('"untested"','"passed"')));assert.throws(()=>D.parseCSV('wrong,columns\n1,2'));});
test('independent evidence needs an explicit no-help record and participant consent',()=>{const s=D.empty();s.consent=true;s.tasks[0].outcome='independent';let r={version:1,sessions:[s]};assert.equal(D.summary(r).uncertain,1);s.tasks[0].help='none';assert.equal(D.summary(r).independent,1);s.consent=false;assert.equal(D.summary(r).independent,0);assert.equal(D.summary(r).uncertain,1);});

function fullReport(count,character='x'){
 return {version:1,sessions:Array.from({length:count},(_,i)=>{const s=D.empty('Q'+String(i+1).padStart(3,'0'),'self');s.id='synthetic_security_'+i;const text=character.repeat(Math.floor(2000/character.length));s.sessionNotes=text;for(const t of s.tasks)for(const key of ['confusion','intervention','evidence'])t[key]=text;return s;})};
}

test('UTF-8 limit rejects previously exportable ASCII and Korean reports before storage',()=>{
 for(const r of [fullReport(48),fullReport(20,'가')]){
  const raw=JSON.stringify(r);assert.ok(Buffer.byteLength(raw,'utf8')>D.LIMIT);
  assert.throws(()=>D.validate(r),error=>error.code==='report-size');
  assert.throws(()=>D.exportJSON(r));assert.throws(()=>D.exportCSV(r));assert.throws(()=>D.parseJSON(raw));
 }
 for(const text of ['한국어 日本語 🚀','\ud800','\udc00','ascii\n\t',"'=literal"])
  assert.equal(D.utf8Bytes(text),Buffer.byteLength(text,'utf8'));
});

test('every successful export fits the file byte limit and reimports exactly',()=>{
 for(const r of [fullReport(1,'가'),fullReport(1,'🚀'),fullReport(34)]){
  const clean=D.validate(r),json=D.exportJSON(r),csv=D.exportCSV(r);
  assert.ok(Buffer.byteLength(json,'utf8')<=D.LIMIT);assert.ok(Buffer.byteLength(csv,'utf8')<=D.LIMIT);
  assert.equal(JSON.stringify(D.parseJSON(json)),JSON.stringify(clean));
  assert.equal(JSON.stringify(D.parseCSV(csv)),JSON.stringify(clean));
 }
 const near=D.validate(fullReport(44)),pretty=JSON.stringify(near,null,2);
 assert.ok(Buffer.byteLength(pretty,'utf8')>D.LIMIT);
 const json=D.exportJSON(near);assert.ok(Buffer.byteLength(json,'utf8')<=D.LIMIT);
 assert.equal(JSON.stringify(D.parseJSON(json)),JSON.stringify(near));
 assert.throws(()=>D.exportCSV(near),/CSV.*2MB/); // CSV repeats session metadata per task.
});

test('oversize UI edit rolls back without modifying the last stored report; partial code typing remains editable',()=>{
 const r=fullReport(44),extra=D.empty('Q045','self');extra.id='synthetic_extra';r.sessions.push(extra);
 for(const task of extra.tasks)for(const key of ['confusion','intervention','evidence']){
  const available=D.LIMIT-Buffer.byteLength(JSON.stringify(r),'utf8')-256;
  task[key]='x'.repeat(Math.max(0,Math.min(2000,available)));
 }
 assert.ok(D.LIMIT-Buffer.byteLength(JSON.stringify(r),'utf8')<=256);
 D.validate(r);
 const nodes=new Map(),stored=new Map();let writes=0;
 function element(){return {value:'',checked:false,textContent:'',hidden:false,handlers:{},classList:{toggle(){}},append(){},replaceChildren(){},focus(){},addEventListener(name,callback){this.handlers[name]=callback;}};}
 const browser={PlaytestData:D,structuredClone,FIXTURE:r,document:{getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},createElement:element},localStorage:{getItem(key){return stored.get(key)??null;},setItem(key,value){writes++;stored.set(key,value);}}};
 vm.createContext(browser);vm.runInContext(fs.readFileSync(path.join(__dirname,'kit.js'),'utf8'),browser);
 vm.runInContext('report=PlaytestData.validate(FIXTURE);selected=report.sessions.at(-1).id;render();persist();',browser);
 const baseline=stored.get('codeshift-playtest-kit-v1'),initialWrites=writes;
 nodes.get('nextAction').value='가'.repeat(1000);nodes.get('record').handlers.input();
 assert.equal(stored.get('codeshift-playtest-kit-v1'),baseline);assert.equal(writes,initialWrites);
 assert.equal(nodes.get('nextAction').value,'');assert.match(nodes.get('status').textContent,/2MB/);
 assert.equal(JSON.stringify(vm.runInContext('report',browser)),baseline);
 nodes.get('code').value='Q';nodes.get('record').handlers.input();
 assert.equal(nodes.get('code').value,'Q');assert.equal(stored.get('codeshift-playtest-kit-v1'),baseline);
 nodes.get('code').value='Q002';nodes.get('record').handlers.input();
 assert.equal(JSON.parse(stored.get('codeshift-playtest-kit-v1')).sessions.at(-1).code,'Q002');
});
