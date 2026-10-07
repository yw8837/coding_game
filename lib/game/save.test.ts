import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from './engine.ts';
import {readSave,writeSave,SAVE_KEY} from './save.ts';

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
