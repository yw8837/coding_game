import test from 'node:test';
import assert from 'node:assert/strict';
import {parseReleaseProduct,parseReleaseStyle,filterReleaseItems,RELEASE_PROJECT_SOURCE} from './release-product.ts';
import {RELEASE_START_FILES,RELEASE_EXAMPLE,RELEASE_LEGACY_EXAMPLE,evaluateRelease,releaseHash,isReleaseFile,releaseSourceMapValid} from './release.ts';
import {releaseAuthoringEdit,releaseLearningEdit,releaseItemLines} from './release-learning-edit.ts';
const authored={kind:'events',description:'A weekend for local readers.',items:[{name:'Book swap',detail:'Saturday at 10',category:'Books'},{name:'Garden walk',detail:'Sunday afternoon',category:'Outdoors'}],accent:'amber',layout:'cards'};
test('new project requires personally authored content; three-file releases retain exact old hashes',()=>{
 assert.equal(evaluateRelease(RELEASE_START_FILES).checks[0].passed,false);
 assert.equal(parseReleaseProduct(RELEASE_PROJECT_SOURCE).valid,true);
 assert.equal(evaluateRelease({...RELEASE_START_FILES,...RELEASE_LEGACY_EXAMPLE}).checks[0].passed,false);
 assert.equal(evaluateRelease(RELEASE_LEGACY_EXAMPLE).passed,true);assert.equal(evaluateRelease(RELEASE_LEGACY_EXAMPLE,true).checks[0].passed,false);
 assert.equal(evaluateRelease(RELEASE_EXAMPLE).passed,true);
 assert.equal(releaseHash(RELEASE_LEGACY_EXAMPLE),'6b70b97f7dfad911');
 const files={...RELEASE_EXAMPLE,'project.json':JSON.stringify(authored)};assert.equal(evaluateRelease(files).passed,true);assert.deepEqual(evaluateRelease(files).preview.product,authored);
 assert.notEqual(releaseHash(files),releaseHash({...files,'project.json':JSON.stringify({...authored,accent:'ocean'})}));
});
test('description, categories and actual item text power combined case-insensitive search',()=>{
 assert.deepEqual(filterReleaseItems(authored.items,'SATURDAY','Books'),[authored.items[0]]);
 assert.deepEqual(filterReleaseItems(authored.items,'Saturday','Outdoors'),[]);
 assert.deepEqual(filterReleaseItems(authored.items,'garden',''),[authored.items[1]]);
 assert.deepEqual(filterReleaseItems(authored.items,'',''),authored.items);
});
test('strict bounded inert project data accepts every personal design choice and rejects malformed data',()=>{
 for(const source of ['{','null',JSON.stringify({...authored,extra:'x'}),JSON.stringify({...authored,accent:'url(x)'}),JSON.stringify({...authored,items:[{name:'x',detail:'y',category:'z',html:'<script>'}]}),JSON.stringify({...authored,description:'x'.repeat(241)}),JSON.stringify({...authored,items:Array(13).fill(authored.items[0])}),JSON.stringify({...authored,items:[{name:'',detail:'',category:''}]})])assert.equal(parseReleaseProduct(source).valid,false);
 const inert={...authored,description:'<script>alert(1)</script>',items:[{name:'<img src=x>',detail:'javascript:alert(1)',category:'Text'}]};assert.deepEqual(parseReleaseProduct(JSON.stringify(inert)).product,inert);
 for(const property of ['kind','accent','layout'] as const)assert.equal(parseReleaseProduct(JSON.stringify({...authored,[property]:[authored[property]]})).valid,false);
 assert.equal(isReleaseFile('project.json'),true);assert.equal(isReleaseFile('../project.json'),false);assert.equal(releaseSourceMapValid({...RELEASE_EXAMPLE,'other.js':'x'}),false);
});
test('responsive checks accept safe alternatives and reject overflow, duplicate properties and active CSS',()=>{
 for(const css of ['.portal { width: 90%; }','.portal { width: 960px; max-width: 100%; }','.portal {width:auto; max-width:720px; padding:20px; box-sizing:border-box; margin:0 auto}', '.portal {width:100%;padding:0;box-sizing:content-box}', '.portal {width:auto;padding:20px;box-sizing:content-box}', '.portal {width:80%;max-width:640px}'])assert.equal(parseReleaseStyle(css).responsive,true,css);
 for(const css of ['.portal {width:1px}','.portal {width:79%}','.portal {width:320px}','.portal {width:auto;max-width:639px}','.portal {width:110%}','.portal {width:100%;padding:10px;box-sizing:content-box}', '.portal {width:100%;width:90%}', '.portal {width:100%;background:url(https://bad.test)}', '.portal {width:100%}body{display:none}'])assert.equal(parseReleaseStyle(css).responsive,false,css);
 const files={...RELEASE_EXAMPLE,'style.css':'.portal { width: 960px; max-width: 100%; padding: 12px; }'};assert.equal(evaluateRelease(files).checks[1].passed,true);
 const edit=releaseLearningEdit(1,files,'95%');assert.equal(edit.ok,true);if(edit.ok)assert.ok(edit.content.includes('max-width: 100%'));
 const reordered=releaseLearningEdit(1,{...files,'style.css':'.portal {max-width:100%;width:960px;}'},'90%');assert.equal(reordered.ok,true);if(reordered.ok)assert.equal(reordered.content,'.portal {max-width:100%;width:90%;}');
});
test('authoring saves player content and arbitrary valid choices, never supplies an answer automatically',()=>{
 const draft={kind:'events' as const,description:'My book club',items:'Book swap | Saturday | Books\nWalk | Sunday | Outdoors',accent:'amber' as const,layout:'cards' as const};
 const result=releaseAuthoringEdit(draft);assert.equal(result.ok,true);if(result.ok){const data=parseReleaseProduct(result.content);assert.equal(data.authored,true);assert.equal(data.product.items[0].name,'Book swap');assert.equal(data.product.accent,'amber');}
 assert.deepEqual(releaseAuthoringEdit({...draft,items:''}),{ok:false,reason:'items'});assert.deepEqual(releaseAuthoringEdit({...draft,description:''}),{ok:false,reason:'description'});
});

test('literal pipes and backslashes survive author form loading and a design-only save',()=>{
 const items=[{name:'A | B',detail:'C:\\Books | local',category:'Read\\Write'}];
 const result=releaseAuthoringEdit({kind:'directory',description:'My directory',items:releaseItemLines(items),accent:'ocean',layout:'cards'});
 assert.equal(result.ok,true);if(result.ok)assert.deepEqual(parseReleaseProduct(result.content).product.items,items);
});
