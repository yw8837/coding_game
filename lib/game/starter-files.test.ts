import test from 'node:test';
import assert from 'node:assert/strict';
import {INITIAL_FILES,REPO_URL} from './content.ts';
import {starterFiles} from './starter-files.ts';
import {createGame,runCommand,projectFiles,dirtyFiles,parseBackend,act} from './engine.ts';
import {prepareWorkspace} from './assisted.ts';
import {runSetupStep} from './setup.ts';
import {isCafeName} from './cafe-name.ts';

test('requested simplified Chinese cafe name is accepted by the real heading check',()=>{
 assert.equal(isCafeName('莫诺咖啡馆'),true);
 assert.equal(isCafeName('莫諾咖啡館'),true);
 assert.equal(isCafeName('街角咖啡馆'),false);
});

test('Korean starter remains compatible and every call returns an independent file map',()=>{
 assert.deepEqual(starterFiles('ko'),INITIAL_FILES);
 const files=starterFiles('ja');files['index.html']='player code';
 assert.notEqual(starterFiles('ja')['index.html'],'player code');
});

for(const language of ['en','ja','zh'] as const){
 test(`${language}: cloning stores localized source and an identical clean initial snapshot`,()=>{
  const result=runCommand(createGame(),'git clone '+REPO_URL,'full',language);
  assert.equal(result.error,false,result.output);
  const files=projectFiles(result.state);
  assert.deepEqual(files,starterFiles(language));
  assert.deepEqual(result.state.repo!.commits[0].files,files);
  assert.deepEqual(result.state.repo!.remote.files,files);
  assert.deepEqual(dirtyFiles(result.state),[]);
  for(const [file,content] of Object.entries(files))assert.doesNotMatch(content,/[가-힣]/,file);
  assert.deepEqual(parseBackend(files['server.py']),{route:'/menu',save:false});
  assert.throws(()=>parseBackend(files['server.py']+'\nprint("unsupported")'));
 });
}

test('assisted and computer setup use the requested starter language',()=>{
 const japanese=prepareWorkspace(createGame(),'full','ja');
 assert.match(projectFiles(japanese)['index.html'],/街のカフェ/);
 const state=createGame();state.accepted=true;state.discovered.repo=true;
 const chinese=runSetupStep(state,'copy','full','zh');
 assert.equal(chinese.error,false,chinese.output);
 assert.match(projectFiles(chinese.state)['README.md'],/莫诺咖啡馆/);
});

test('changing the UI language and preparing again does not rewrite saved learner code',()=>{
 let state=prepareWorkspace(createGame(),'full','ja');
 const edited=projectFiles(state)['index.html'].replace('街のカフェ','私のカフェ');
 state=act(state,{type:'edit',path:'index.html',content:edited});
 const before=structuredClone(projectFiles(state));
 state=prepareWorkspace(state,'full','zh');
 assert.deepEqual(projectFiles(state),before);
});

test('next mission keeps the source language when introducing the calculation bug',()=>{
 let state=prepareWorkspace(createGame(),'full','ja');
 state.completed=[0];state=act(state,{type:'next-mission'});
 const code=projectFiles(state)['app.js'];
 assert.match(code,/return price \+ quantity/);
 assert.doesNotMatch(code,/[가-힣]/);
});
