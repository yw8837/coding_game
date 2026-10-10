import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from './engine.ts';
import {readSave,writeSave,SAVE_KEY} from './save.ts';

test('exact-cap legacy workspace saves migrate, write and reopen without losing source bytes',()=>{
 const legacy=createGame();delete legacy.gameplay.career.studio;
 legacy.machines.local.dirs.push('/home/dev/studio','/home/dev/studio/workbench');
 legacy.machines.local.cwd='/home/dev/studio/workbench';
 legacy.machines.local.files['/home/dev/studio/workbench/notes.txt']='Original bytes \\n \\\\ \\\" quote';
 for(let index=0;index<66;index++)legacy.machines.local.files['/home/dev/filler-'+index+'.txt']='x'.repeat(60000);
 legacy.machines.local.files['/home/dev/last-filler.txt']='';
 const before=JSON.stringify(legacy),remaining=4_000_000-before.length;assert.ok(remaining>0&&remaining<=60000);
 legacy.machines.local.files['/home/dev/last-filler.txt']='y'.repeat(remaining);
 const raw=JSON.stringify(legacy);assert.equal(raw.length,4_000_000);
 const migrated=readSave(raw);assert.ok(JSON.stringify(migrated).length>4_000_000);
 let saved='';writeSave({setItem:(_key,value)=>{saved=value;}},migrated);
 assert.ok(saved.length<=4_100_000);assert.ok(Buffer.byteLength(saved,'utf8')<=16*1024*1024);
 const reopened=readSave(saved);assert.deepEqual(reopened.machines.local.files,migrated.machines.local.files);
 assert.equal(reopened.machines.local.cwd,'/home/dev/old-studio-1');assert.equal(reopened.machines.local.files['/home/dev/old-studio-1/notes.txt'],legacy.machines.local.files['/home/dev/studio/workbench/notes.txt']);
 for(const [path,source] of Object.entries(legacy.machines.local.files))if(!path.startsWith('/home/dev/studio/workbench/'))assert.equal(reopened.machines.local.files[path],source);
 let resaved='';writeSave({setItem:(_key,value)=>{resaved=value;}},reopened);assert.equal(resaved,saved);
});

test('legacy/current save limits and normalized output stay bounded and restorable',()=>{
 const legacy=createGame();delete legacy.gameplay.career.studio;
 legacy.logs=[''];const oldBase=JSON.stringify(legacy);legacy.logs=['x'.repeat(4_000_001-oldBase.length)];
 assert.equal(JSON.stringify(legacy).length,4_000_001);assert.throws(()=>readSave(JSON.stringify(legacy)),/Save too large/);
 const current=createGame();current.logs=[''];const currentBase=JSON.stringify(current);current.logs=['x'.repeat(4_100_000-currentBase.length)];
 const exact=JSON.stringify(current);assert.equal(exact.length,4_100_000);assert.doesNotThrow(()=>readSave(exact));
 let saved='';writeSave({setItem:(_key,value)=>{saved=value;}},current);assert.equal(saved.length,4_100_000);assert.doesNotThrow(()=>readSave(saved));
 current.logs[0]+='x';assert.throws(()=>readSave(JSON.stringify(current)),/Save too large/);assert.throws(()=>writeSave({setItem:()=>assert.fail('oversized save replaced storage')},current),/Save too large/);
 const missingDefaults=JSON.parse(exact);delete missingDefaults.gameplay.career.endingJobs;const short=JSON.stringify(missingDefaults);missingDefaults.logs[0]+='y'.repeat(4_100_000-short.length);
 assert.equal(JSON.stringify(missingDefaults).length,4_100_000);assert.throws(()=>readSave(JSON.stringify(missingDefaults)),/Save too large after migration/);
 const partial=createGame();delete partial.gameplay.career.studio;
 writeSave({setItem:(_key,value)=>{saved=value;}},partial);assert.equal(Object.hasOwn(JSON.parse(saved).gameplay.career,'studio'),true);assert.doesNotThrow(()=>readSave(saved));
});

test('an oversized or invalid autosave preserves the last restorable record',()=>{
 const data=new Map<string,string>();
 const storage={setItem:(key:string,value:string)=>{data.set(key,value);}};
 const valid=createGame();
 writeSave(storage,valid);
 const previous=data.get(SAVE_KEY)!;
 assert.equal(readSave(previous).credits,120);
 const oversized=createGame();oversized.logs=Array.from({length:70},()=> 'x'.repeat(60000));
 assert.throws(()=>writeSave(storage,oversized),/Save too large/);
 assert.equal(data.get(SAVE_KEY),previous);
 const invalid=createGame();invalid.machines.local.files['/'+ 'x'.repeat(301)]='content';
 assert.throws(()=>writeSave(storage,invalid));
 assert.equal(data.get(SAVE_KEY),previous);
});
