import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {act,createGame,runCommand,type GameState} from './engine.ts';
import {CAREER_JOBS} from './career-content.ts';
import {exampleSolution} from './career-evaluation.ts';
import {readSave,writeSave} from './save.ts';
import {RELEASE_ROOT,RELEASE_EXAMPLE,evaluateRelease,releaseFiles,releaseHash,releasePublishedFresh} from './release.ts';
import {STUDIO_ROOT,studioFiles,studioFresh} from './studio.ts';
import {buildStudioExport,buildStudioArchive} from './studio-export.ts';
import {buildStaticSiteExport,buildPwaArchive} from './finale-export.ts';
import {AUTHORED_RUNTIME,AUTHORED_RUNTIME_SHA256,authoredStartFiles,authoredProjectFormat,buildAuthoredHtml,validateAuthoredAssets,validateAuthoredRelease,type AuthoredFormat} from './release-authored.ts';

const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aT9sAAAAASUVORK5CYII=';
function appRuntime(html:string,mode:'ok'|'blocked'|'quota'|'corrupt'='ok',store:Record<string,string>={}){
 type Element={tag:string;value:string;textContent:string;hidden:boolean;children:Element[];events:Record<string,(event:{preventDefault:()=>void})=>void>;append:(...nodes:Element[])=>void;replaceChildren:()=>void;setAttribute:(name:string,value:string)=>void;addEventListener:(name:string,handler:(event:{preventDefault:()=>void})=>void)=>void};
 const create=(tag:string):Element=>({tag,value:'',textContent:'',hidden:false,children:[],events:{},append(...nodes){this.children.push(...nodes);},replaceChildren(){this.children=[];},setAttribute(){},addEventListener(name,handler){this.events[name]=handler;}});
 const items=create('section'),inquiry=create('section');
 if(mode==='corrupt')store['codeshift-app-1234567890abcdef']='{"bad":true}';
 const appData=html.match(/<script nonce="codeshift-authored-v1" id="authored-app-data" type="application\/json">([\s\S]*?)<\/script>/)![1];
 const document={getElementById:(id:string)=>id==='authored-app-data'?{textContent:appData}:null,querySelector:(selector:string)=>selector.includes('items')?items:inquiry,createElement:create};
 const localStorage={getItem:(key:string)=>{if(mode==='blocked')throw Error('blocked');return store[key]??null;},setItem:(key:string,value:string)=>{if(mode==='blocked'||mode==='quota')throw Error('quota');store[key]=value;}};
 const script=html.match(/<script nonce="codeshift-authored-v1">\n([\s\S]*?)<\/script>/)![1];
 vm.runInNewContext(script,{document,localStorage},{timeout:1000});
 return {items,inquiry,store,search:items.children[0].children[0],category:items.children[1].children[0],list:items.children[3],empty:items.children[4],status:inquiry.children[2],requests:inquiry.children[3],submit:(value:string)=>{const form=inquiry.children[1];form.children[0].children[0].value=value;form.events.submit({preventDefault(){}});}};
}

function sources(format:AuthoredFormat='website'){
 const files=authoredStartFiles(format,'en');
 files['index.html']=`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Notebook</title><link rel="stylesheet" href="style.css"></head><body><main class="portal"><header><h1>Little garden journal</h1></header><section id="story"><h2>A quiet morning</h2><p>I grow herbs by my window and record the colors each week.</p><figure><img src="asset:garden" alt="A leaf"><figcaption>My first basil leaf</figcaption></figure></section>${format==='webapp'?'<section data-app="items"></section><section data-app="inquiry"></section>':''}<footer><a href="#story">Back to the story</a></footer></main></body></html>`;
 files['style.css']='body { margin: 0; color: #743b80; background: #e1f4ea; font-family: system-ui, sans-serif; } .portal { width: 100%; max-width: 880px; padding: 20px; margin: 0 auto; } section { display: grid; gap: 12px; } h1 { font-size: clamp(24px, 5vw, 40px); }';
 files['assets.json']=JSON.stringify({garden:{name:'leaf.png',dataUrl:png,alt:'Leaf'}});
 if(format==='webapp'){const project=JSON.parse(files['project.json']);project.description='Things growing on my windowsill.';project.items=[{name:'Basil',detail:'New green leaves this week',category:'Herbs'}];files['project.json']=JSON.stringify(project);}
 return files;
}
test('explicit legacy studio upgrade preserves released bytes and the original draft snapshot',()=>{
 let s=act(unlocked(),{type:'career-release-start'});for(const [file,content] of Object.entries(RELEASE_EXAMPLE))s=act(s,{type:'career-release-edit',file,content});s=act(act(act(s,{type:'career-release-test'}),{type:'career-release-build'}),{type:'career-release-publish'});
 const release=releaseFiles(s),hash=releaseHash(release),credits=s.credits,xp=s.xp;s=act(s,{type:'career-studio-start'});const original=studioFiles(s);
 s=act(s,{type:'career-studio-upgrade',format:'website',language:'en'});assert.deepEqual(studioFiles(s),original);
 s=act(s,{type:'career-studio-upgrade',format:'website',language:'en',confirmLoss:true});assert.equal(s.gameplay.career.studio?.authoredFormat,'website');assert.equal(evaluateRelease(studioFiles(s),true,'website').passed,true);assert.deepEqual(releaseFiles(s),release);assert.equal(releaseHash(releaseFiles(s)),hash);assert.equal(s.credits,credits);assert.equal(s.xp,xp);assert.deepEqual(s.gameplay.career.studio?.snapshots[0].files,original);assert.doesNotThrow(()=>readSave(JSON.stringify(s)));
 s=act(s,{type:'career-studio-restore',id:s.gameplay.career.studio!.snapshots[0].id,confirmLoss:true});assert.deepEqual(studioFiles(s),original);assert.equal(s.gameplay.career.studio?.authoredFormat,undefined);assert.doesNotThrow(()=>readSave(JSON.stringify(s)));
});
test('chosen authored format survives incomplete JSON edits and blocks a passing format switch',()=>{
 let s=published('webapp');s=act(s,{type:'career-studio-start'});assert.equal(s.gameplay.career.studio?.authoredFormat,'webapp');s=act(s,{type:'career-studio-edit',file:'project.json',content:'{'});
 s=readSave(JSON.stringify(s));assert.equal(s.gameplay.career.release.authoredFormat,'webapp');assert.equal(s.gameplay.career.studio?.authoredFormat,'webapp');assert.equal(evaluateRelease(studioFiles(s),true,'webapp').passed,false);
 const project=JSON.parse(sources('website')['project.json']);s=act(s,{type:'career-studio-edit',file:'project.json',content:JSON.stringify(project)});s=act(s,{type:'career-studio-test'});assert.equal(studioFresh(s),false);assert.equal(s.gameplay.career.studio?.proof?.passed,false);assert.doesNotThrow(()=>readSave(JSON.stringify(s)));
});
test('snapshot overflow is refused before mutating history and large native asset copies stay bounded',()=>{
 let s=published();s=act(s,{type:'career-studio-start'});const huge='data:image/png;base64,'+Buffer.concat([Buffer.from(png.split(',')[1],'base64'),Buffer.alloc(80000)]).toString('base64'),source=JSON.stringify({garden:{dataUrl:huge}});
 s=act(s,{type:'career-studio-edit',file:'assets.json',content:source});s=act(s,{type:'career-studio-test'});assert.equal(studioFresh(s),true);
 let id=0;while(JSON.stringify(s).length<4_020_000){const remaining=4_020_000-JSON.stringify(s).length;s.machines.local.files['/home/dev/filler-'+id++]= 'x'.repeat(Math.min(59900,Math.max(1,remaining-100)));}
 assert.doesNotThrow(()=>readSave(JSON.stringify(s)));const progress=structuredClone(s.gameplay.career.studio);const attempted=act(s,{type:'career-studio-snapshot'});assert.deepEqual(attempted.gameplay.career.studio,progress);assert.match(attempted.notice,/save limit/);assert.doesNotThrow(()=>readSave(JSON.stringify(attempted)));
 const small=act(published(),{type:'career-studio-start'});small.machines.local.files[RELEASE_ROOT+'/assets.json']=source;small.gameplay.career.release.proof=null;small.gameplay.career.release.build=null;small.gameplay.career.release.published=null;
 const copied=runCommand(small,'cp '+RELEASE_ROOT+'/assets.json '+STUDIO_ROOT+'/assets.json');assert.equal(copied.error,false);assert.equal(studioFiles(copied.state)['assets.json'],source);
 const invalid=runCommand(copied.state,'cp '+STUDIO_ROOT+'/assets.json /home/dev/copy.json');assert.equal(invalid.error,true);
});

function unlocked():GameState{
 let s=createGame();s.completed=[0,1,2];s.mission=2;s=act(s,{type:'celebrate-opening'});
 for(const job of CAREER_JOBS){s=act(s,{type:'career-accept',id:job.id});s=act(s,{type:'career-inspect',id:job.id});for(const [file,content] of Object.entries(exampleSolution(job.id)))s=act(s,{type:'career-edit',id:job.id,file,content});s=act(s,{type:'career-test',id:job.id});s=act(s,{type:'career-deliver',id:job.id,choice:'care'});}
 return s;
}
test('trusted authored runtime combines search/categories, renders no-result text and persists bounded inquiries',()=>{
 const files=sources('webapp'),project=JSON.parse(files['project.json']);project.items.push({name:'Tomato',detail:'A warm red fruit',category:'Vegetables'});files['project.json']=JSON.stringify(project);
 const html=buildStudioExport(files,'en','1234567890abcdef'),app=appRuntime(html);assert.equal(app.list.children.length,2);
 app.category.value='Herbs';app.category.events.change({preventDefault(){}});assert.equal(app.list.children.length,1);assert.equal(app.list.children[0].children[0].textContent,'Basil');
 app.search.value='Tomato';app.search.events.input({preventDefault(){}});assert.equal(app.list.children.length,0);assert.equal(app.empty.hidden,false);assert.equal(app.empty.textContent,'No items match.');
 app.submit('<img onerror="steal()"> A question');assert.equal(app.requests.children.length,1);assert.match(app.requests.children[0].textContent,/<img onerror/);assert.equal(appRuntime(html,'ok',app.store).requests.children.length,1);
 for(let i=1;i<50;i++)app.submit('Question '+i);app.submit('One too many');assert.equal(app.requests.children.length,50);assert.match(app.status.textContent,/maximum 50/);
 app.submit('');assert.match(app.status.textContent,/nonblank/);
 for(const mode of ['blocked','quota'] as const){const unavailable=appRuntime(html,mode);unavailable.submit('Ephemeral question');assert.equal(unavailable.requests.children.length,1);assert.match(unavailable.status.textContent,/only during this preview/);assert.equal(Object.keys(unavailable.store).length,0);}
 const corrupt=appRuntime(html,'corrupt');corrupt.submit('Keep old data');assert.equal(corrupt.requests.children.length,0);assert.equal(corrupt.store['codeshift-app-1234567890abcdef'],'{"bad":true}');assert.match(corrupt.status.textContent,/not overwritten/);
});
test('safe CSS accepts bounded media queries, variables, quoted fonts and gradients',()=>{
 const files=sources();files['style.css']+='\n:root { --accent: #823b7c; } h1 { color: var(--accent); font-family: "Noto Sans", sans-serif; } body { background: linear-gradient(90deg, #eee, #fff); } @media (max-width: 600px) { .portal { padding: 12px; } }';
 assert.equal(evaluateRelease(files,true).passed,true,validateAuthoredRelease(files).diagnostics.join(' '));assert.match(buildStudioExport(files,'en'),/@media/);
});
test('malformed and excessive drafts remain safe previews and cannot become publishable',()=>{
 const files=sources();files['index.html']='<script>alert(1)</script>';assert.doesNotThrow(()=>buildAuthoredHtml(files,'en',undefined,undefined,{draft:true}));assert.equal(evaluateRelease(files,true).passed,false);
 files['index.html']=sources()['index.html'].replace('<img src="asset:garden" alt="A leaf">','<img src="asset:garden">'.repeat(800));
 const huge='data:image/png;base64,'+Buffer.concat([Buffer.from(png.split(',')[1],'base64'),Buffer.alloc(80000)]).toString('base64');files['assets.json']=JSON.stringify({garden:{dataUrl:huge}});
 assert.equal(evaluateRelease(files,true).passed,false);const preview=buildAuthoredHtml(files,'en',undefined,undefined,{draft:true});assert.ok(Buffer.byteLength(preview)<512*1024);assert.doesNotMatch(preview,/<script/);assert.throws(()=>buildStudioExport(files,'en'));
});

test('upgraded runtime keeps legacy inquiry records and permits continued local saves',()=>{
 const html=buildStudioExport(sources('webapp'),'en','1234567890abcdef'),store={'codeshift-app-1234567890abcdef':JSON.stringify([{item:'Old garden list',message:'Please bring seeds',date:'2026-10-13T02:00:00.000Z'}])};
 const app=appRuntime(html,'ok',store);assert.equal(app.requests.children.length,1);assert.match(app.requests.children[0].textContent,/Old garden list/);app.submit('A new question');assert.equal(app.requests.children.length,2);assert.match(app.status.textContent,/Kept in this browser/);
 const rows=JSON.parse(store['codeshift-app-1234567890abcdef']);assert.equal(rows[1].item,'Old garden list');assert.equal(rows[1].message,'Please bring seeds');assert.equal(appRuntime(html,'ok',store).requests.children.length,2);
});
test('own short text or an imported photo counts as content without a minimum-length formula',()=>{
 const files=sources();files['index.html']='<h1>A tiny greeting</h1><p>Hi!</p>';assert.equal(evaluateRelease(files,true).passed,true);
 files['index.html']='<h1>A leaf portrait</h1><img src="asset:garden">';assert.equal(evaluateRelease(files,true).passed,true);
 files['index.html']='<h1>A blank page</h1>';assert.equal(evaluateRelease(files,true).passed,false);
});
test('WebP signature alone does not accept truncated or forged imported images',()=>{
 const forged='data:image/webp;base64,'+Buffer.from('RIFF0000WEBP').toString('base64');assert.equal(validateAuthoredAssets(JSON.stringify({garden:{dataUrl:forged}})).valid,false);
});

test('PNG and JPEG imports require complete image structure with bounded dimensions',()=>{
 const cut=Buffer.from(png.split(',')[1],'base64').subarray(0,33),fake=Buffer.concat([Buffer.from([255,216,255,224,0,8]),Buffer.alloc(8),Buffer.from([255,217])]);
 for(const dataUrl of ['data:image/png;base64,'+cut.toString('base64'),'data:image/jpeg;base64,'+fake.toString('base64')])assert.equal(validateAuthoredAssets(JSON.stringify({garden:{dataUrl}})).valid,false);
});

test('every authored preview/export executes exactly the hash-pinned static runtime with inert data',()=>{
 const a=buildAuthoredHtml(sources('webapp'),'en','1234567890abcdef'),b=buildAuthoredHtml(sources('webapp'),'ja','fedcba0987654321');
 const runtime=(html:string)=>html.match(/<script nonce="codeshift-authored-v1">([\s\S]*?)<\/script>/)![1];
 assert.equal(runtime(a),AUTHORED_RUNTIME);assert.equal(runtime(b),AUTHORED_RUNTIME);assert.equal(createHash('sha256').update(runtime(a),'utf8').digest('base64'),AUTHORED_RUNTIME_SHA256);assert.equal(AUTHORED_RUNTIME.includes('\r'),false);
 assert.match(a,/<script nonce="codeshift-authored-v1" id="authored-app-data" type="application\/json">/);assert.match(AUTHORED_RUNTIME,/JSON.parse\(document.getElementById/);
 const files=sources('webapp');files['index.html']=files['index.html'].replace('<main class="portal">','<main id="authored-app-data" class="portal">');assert.equal(evaluateRelease(files,true).passed,false);assert.doesNotMatch(buildAuthoredHtml(files,'en',undefined,undefined,{draft:true}),/<script/);
});

function published(format:AuthoredFormat='website'):GameState{
 let s=act(unlocked(),{type:'career-release-start',format,language:'en'});for(const [file,content] of Object.entries(sources(format)))s=act(s,{type:'career-release-edit',file,content});return act(act(act(s,{type:'career-release-test'}),{type:'career-release-build'}),{type:'career-release-publish'});
}

test('authored format is opt-in and starter content requires an actual title and story',()=>{
 assert.equal(authoredProjectFormat(RELEASE_EXAMPLE),null);assert.equal(evaluateRelease(RELEASE_EXAMPLE,true).passed,true);
 for(const format of ['website','webapp'] as const){const starter=authoredStartFiles(format,'en');assert.equal(evaluateRelease(starter,true).passed,false);assert.ok(buildAuthoredHtml(starter,'en',undefined,undefined,{draft:true}).includes('My project'));}
});
test('different semantic HTML, freely chosen colors and personal images export as authored',()=>{
 const files=sources(),evaluation=evaluateRelease(files,true);assert.equal(evaluation.passed,true,JSON.stringify(evaluation.checks));assert.equal(evaluation.preview.title,'Little garden journal');assert.equal(evaluation.preview.authored?.format,'website');
 const html=buildStudioExport(files,'en');assert.ok(html.includes('<h2>A quiet morning</h2>'));assert.ok(html.includes('<figcaption>My first basil leaf</figcaption>'));assert.ok(html.includes('#743b80'));assert.ok(html.includes(png));assert.ok(!html.includes('asset:garden'));assert.ok(!html.includes('<script'));assert.equal(buildStaticSiteExport(files,'en'),buildAuthoredHtml(files,'en'));
 const archive=new TextDecoder().decode(buildStudioArchive(files,'en'));assert.ok(archive.includes('source/assets.json'));assert.ok(archive.includes('source/style.css'));
});
test('website needs no inquiry route while webapp uses only provided widgets and actual items',()=>{
 const site=sources();site['server.json']='{}';assert.equal(evaluateRelease(site,true).passed,true);
 const app=sources('webapp');assert.equal(evaluateRelease(app,true).passed,true);const html=buildStudioExport(app,'en','1234567890abcdef');assert.ok(html.includes('nonce="codeshift-authored-v1"'));assert.ok(html.includes('textContent'));assert.ok(html.includes('Basil'));assert.ok(!html.includes("script-src 'unsafe-inline'"));
 app['index.html']=app['index.html'].replace('data-app="inquiry"','class="inquiry"');assert.equal(evaluateRelease(app,true).passed,false);
 const archive=new TextDecoder().decode(buildPwaArchive(sources('webapp'),'en','1234567890abcdef'));assert.ok(archive.includes('Little garden journal'));assert.ok(archive.includes(png));assert.ok(archive.includes('<script nonce="codeshift-authored-v1">'));
});
test('passive parser rejects script, active attributes, external URLs, malformed tags and CSS injection',()=>{
 const attempts=['<script>alert(1)</script>','<iframe src="https://evil.test"></iframe>','<img src="asset:garden" onerror="alert(1)">','<a href="javascript:alert(1)">click</a>','<a href="&#106;avascript:alert(1)">click</a>','<svg><script>alert(1)</script></svg>','<object data="x"></object>','<meta http-equiv="refresh" content="0;url=https://evil.test">','<img src="https://evil.test/a.png">','<p><strong>Broken</p></strong>'];
 for(const attempt of attempts){const files=sources();files['index.html']=files['index.html'].replace('<section id="story">',attempt+'<section id="story">');assert.equal(evaluateRelease(files,true).passed,false,attempt);const html=buildAuthoredHtml(files,'en',undefined,undefined,{draft:true});assert.ok(!html.includes('<script'),attempt);assert.ok(!html.includes('<iframe'),attempt);assert.ok(!html.includes('onerror="'),attempt);}
 for(const css of ['body { background: url(https://evil.test); }','@import "https://evil.test/style.css";','body { color: red; }</style><script>alert(1)</script>','body { background: u\\72l(https://evil.test); }','body { width: 900px; }']){const files=sources();files['style.css']=css;assert.equal(evaluateRelease(files,true).passed,false,css);assert.throws(()=>buildStudioExport(files,'en'));}
});
test('image references and embedded bytes are validated with explicit size/type bounds',()=>{
 assert.equal(validateAuthoredAssets(JSON.stringify({garden:{dataUrl:png}})).valid,true);
 for(const dataUrl of ['data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=','https://evil.test/img.png','data:image/png;base64,PHNjcmlwdD4=','data:image/jpeg;base64,'+png.split(',')[1]])assert.equal(validateAuthoredAssets(JSON.stringify({garden:{dataUrl}})).valid,false);
 const files=sources();files['assets.json']='{}';assert.equal(validateAuthoredRelease(files).htmlValid,false);assert.ok(validateAuthoredRelease(files).diagnostics.some(value=>value.includes('garden')));
 const map=Object.fromEntries(['a','b','c','d'].map(id=>[id,{dataUrl:png}]));assert.equal(validateAuthoredAssets(JSON.stringify(map)).valid,false);
});
test('authored image source survives saves and snapshots while first release is immutable',()=>{
 let s=published();assert.equal(releasePublishedFresh(s),true);const first=releaseFiles(s),hash=releaseHash(first);s=readSave(JSON.stringify(s));assert.deepEqual(releaseFiles(s),first);
 s=act(s,{type:'career-release-edit',file:'assets.json',content:'{}'});assert.deepEqual(releaseFiles(s),first);
 s=act(s,{type:'career-studio-start'});assert.deepEqual(studioFiles(s),first);s=act(s,{type:'career-studio-test'});assert.equal(studioFresh(s),true);s=act(s,{type:'career-studio-snapshot'});assert.deepEqual(s.gameplay.career.studio?.snapshots[0].files,first);
 s=act(s,{type:'career-studio-edit',file:'index.html',content:first['index.html'].replace('A quiet morning','An orange evening')});assert.equal(studioFresh(s),false);assert.equal(releaseHash(releaseFiles(s)),hash);
 let saved='';writeSave({setItem:(_key,value)=>{saved=value;}},s);const reload=readSave(saved);assert.equal(reload.machines.local.files[STUDIO_ROOT+'/assets.json'],first['assets.json']);assert.equal(reload.machines.local.files[RELEASE_ROOT+'/assets.json'],first['assets.json']);assert.deepEqual(reload.gameplay.career.studio?.snapshots[0].files,first);
});
test('image sources beyond old per-file limit persist only at the two reserved asset paths',()=>{
 let s=published();s=act(s,{type:'career-studio-start'});const assets=JSON.parse(studioFiles(s)['assets.json']);assets.garden.dataUrl=png+'A'.repeat(80000);const source=JSON.stringify(assets);s=act(s,{type:'career-studio-edit',file:'assets.json',content:source});assert.equal(studioFiles(s)['assets.json'],source);assert.doesNotThrow(()=>readSave(JSON.stringify(s)));
 const invalid=structuredClone(s);invalid.machines.local.files['/home/dev/huge.txt']='a'.repeat(60001);assert.throws(()=>readSave(JSON.stringify(invalid)));
});
