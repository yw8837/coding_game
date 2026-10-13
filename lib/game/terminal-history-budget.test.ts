import test from 'node:test';
import assert from 'node:assert/strict';
import {act,createGame,runCommand,MAX_TERMINAL_OUTPUT_CHARS,MAX_TERMINAL_OUTPUT_BYTES,MAX_TERMINAL_HISTORY_JSON_CHARS,type GameState} from './engine.ts';
import {CAREER_JOBS} from './career-content.ts';
import {exampleSolution} from './career-evaluation.ts';
import {authoredStartFiles,validateAuthoredAssets} from './release-authored.ts';
import {RELEASE_ROOT,releaseFiles,releaseHash} from './release.ts';
import {STUDIO_ROOT,studioFiles} from './studio.ts';
import {readSave,writeSave} from './save.ts';

/** A valid complete PNG with a large ancillary text chunk, not a spoofed signature. */
function photo():string{
 const original=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aT9sAAAAASUVORK5CYII=','base64');
 const content=Buffer.from('padding\0'+'A'.repeat(119792)),type=Buffer.from('tEXt'),crcInput=Buffer.concat([type,content]);let crc=0xffffffff;
 for(const byte of crcInput){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
 const chunk=Buffer.alloc(content.length+12);chunk.writeUInt32BE(content.length,0);type.copy(chunk,4);content.copy(chunk,8);chunk.writeUInt32BE((crc^0xffffffff)>>>0,chunk.length-4);
 return 'data:image/png;base64,'+Buffer.concat([original.subarray(0,-12),chunk,original.subarray(-12)]).toString('base64');
}
function fullPhotoStudio():GameState{
 let s=createGame();s.completed=[0,1,2];s.mission=2;s=act(s,{type:'celebrate-opening'});
 for(const job of CAREER_JOBS){s=act(s,{type:'career-accept',id:job.id});s=act(s,{type:'career-inspect',id:job.id});for(const [file,content] of Object.entries(exampleSolution(job.id)))s=act(s,{type:'career-edit',id:job.id,file,content});s=act(s,{type:'career-test',id:job.id});s=act(s,{type:'career-deliver',id:job.id,choice:'care'});}
 const files=authoredStartFiles('website','en'),image=photo();files['assets.json']=JSON.stringify(Object.fromEntries(['one','two','three'].map(id=>[id,{dataUrl:image,alt:'My photo'}])));assert.equal(validateAuthoredAssets(files['assets.json']).valid,true);
 files['index.html']='<main class="portal"><h1>My photo album</h1><p>My window, my first herbs, and a quiet morning.</p>'+['one','two','three'].map(id=>'<img src="asset:'+id+'" alt="My photo">').join('')+'</main>';
 s=act(s,{type:'career-release-start',format:'website',language:'en'});for(const [file,content] of Object.entries(files))s=act(s,{type:'career-release-edit',file,content});s=act(act(act(s,{type:'career-release-test'}),{type:'career-release-build'}),{type:'career-release-publish'});assert.ok(s.gameplay.career.release.published);
 s=act(s,{type:'career-studio-start'});
 for(let i=0;i<5;i++){s=act(s,{type:'career-studio-edit',file:'index.html',content:files['index.html'].replace('My photo album','My photo album '+i)});s=act(s,{type:'career-studio-test'});s=act(s,{type:'career-studio-snapshot'});}
 assert.equal(s.gameplay.career.studio?.snapshots.length,5);assert.ok(JSON.stringify(s).length>3_300_000);return s;
}
function reload(s:GameState):GameState{let raw='';writeSave({setItem:(_key,value)=>{raw=value;}},s);assert.ok(raw.length<=4_090_000);return readSave(raw);}

test('repeated reads of three large photos and five snapshots keep every save readable',()=>{
 let s=fullPhotoStudio();const first=releaseHash(releaseFiles(s)),assets=studioFiles(s)['assets.json'],snapshots=structuredClone(s.gameplay.career.studio!.snapshots);
 for(let i=0;i<14;i++){
  const command=i%2?'grep dataUrl '+STUDIO_ROOT+'/assets.json':'cat '+STUDIO_ROOT+'/assets.json',result=runCommand(s,command);assert.equal(result.error,false);assert.ok(result.output.length<=MAX_TERMINAL_OUTPUT_CHARS);assert.ok(Buffer.byteLength(result.output)<=MAX_TERMINAL_OUTPUT_BYTES);assert.match(result.output,/Output truncated/);assert.match(result.output,/출력 일부 생략/);assert.match(result.output,/出力の一部/);
  s=reload(result.state);assert.ok(JSON.stringify(s.history).length<=MAX_TERMINAL_HISTORY_JSON_CHARS);assert.equal(studioFiles(s)['assets.json'],assets);assert.equal(releaseHash(releaseFiles(s)),first);assert.deepEqual(s.gameplay.career.studio!.snapshots,snapshots);
 }
 const redirect=runCommand(s,'cat '+RELEASE_ROOT+'/assets.json > '+STUDIO_ROOT+'/assets.json');assert.equal(redirect.error,false);assert.equal(redirect.output,'');assert.equal(studioFiles(redirect.state)['assets.json'],assets);assert.equal(studioFiles(reload(redirect.state))['assets.json'],assets);
});
test('history pruning accounts for the whole save near the source budget',()=>{
 let s=fullPhotoStudio();let id=0;while(JSON.stringify(s).length<4_082_000){const remaining=4_082_000-JSON.stringify(s).length;s.machines.local.files['/home/dev/filler-'+id++]='x'.repeat(Math.min(59000,Math.max(1,remaining-100)));}
 s=reload(s);
 for(const command of ['cat '+STUDIO_ROOT+'/assets.json','grep dataUrl '+STUDIO_ROOT+'/assets.json','pwd']){const result=runCommand(s,command);assert.equal(result.error,false);s=reload(result.state);}
 assert.ok(JSON.stringify(s.history).length<12000);assert.equal(s.history.at(-1)?.command,'pwd');
 const before={...s.machines.local.files},overflow=runCommand(s,'cat /home/dev/filler-0 > /home/dev/extra.txt');assert.equal(overflow.error,true);assert.match(overflow.output,/save capacity is full/);assert.deepEqual(overflow.state.machines.local.files,before);assert.doesNotThrow(()=>reload(overflow.state));
});
test('display caps UTF-8 bytes as well as characters and redirection keeps complete output',()=>{
 const s=createGame(),text='가나다🙂'.repeat(4000);s.machines.local.files['/home/dev/long.txt']=text;
 const read=runCommand(s,'cat long.txt');assert.equal(read.error,false);assert.ok(read.output.length<=MAX_TERMINAL_OUTPUT_CHARS);assert.ok(Buffer.byteLength(read.output)<=MAX_TERMINAL_OUTPUT_BYTES);assert.match(read.output,/Output truncated/);
 const redirect=runCommand(read.state,'cat long.txt > copied.txt');assert.equal(redirect.error,false);assert.equal(redirect.state.machines.local.files['/home/dev/copied.txt'],text);assert.doesNotThrow(()=>readSave(JSON.stringify(redirect.state)));
});
