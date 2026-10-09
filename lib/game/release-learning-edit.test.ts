import test from 'node:test';
import assert from 'node:assert/strict';
import {releaseLearningEdit} from './release-learning-edit.ts';
const files={'index.html':'<h1>Untitled</h1>\n','style.css':'.portal { width: 960px; }\n','server.json':'{"route":"/places","saveRequests":false}'};
test('title accepts 40 Unicode code points, rejects controls and tags',()=>{
 assert.equal(releaseLearningEdit(0,files,'😀'.repeat(40)).ok,true);
 assert.deepEqual(releaseLearningEdit(0,files,'😀'.repeat(41)),{ok:false,reason:'title'});
 assert.deepEqual(releaseLearningEdit(0,files,'my\tapp'),{ok:false,reason:'title'});
});
test('format errors do not become false edits or boolean input errors',()=>{
 assert.deepEqual(releaseLearningEdit(0,{...files,'index.html':'<div>Untitled</div>'},'Mine'),{ok:false,reason:'format'});
 assert.deepEqual(releaseLearningEdit(2,{...files,'server.json':'{'},'/api/places'),{ok:false,reason:'format'});
 assert.deepEqual(releaseLearningEdit(3,files,'True'),{ok:false,reason:'boolean'});
 assert.deepEqual(releaseLearningEdit(2,files,'places'),{ok:false,reason:'route'});
});
test('supported drafts preserve other values and refuse unchanged or oversized source',()=>{
 const result=releaseLearningEdit(2,files,'/api/places');assert.equal(result.ok,true);
 if(result.ok)assert.deepEqual(JSON.parse(result.content),{route:'/api/places',saveRequests:false});
 assert.deepEqual(releaseLearningEdit(1,files,'960px'),{ok:false,reason:'same'});
 assert.deepEqual(releaseLearningEdit(0,{...files,'index.html':' '.repeat(20000)+'<h1>Untitled</h1>'},'Mine'),{ok:false,reason:'size'});
});
