import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {buildStudioExport} from './studio-export.ts';
import {RELEASE_EXAMPLE} from './release.ts';

function runtime(html:string,storageMode:'ok'|'blocked'|'corrupt'|'quota'='ok',stored?:Record<string,string>){
 type Element={value:string;textContent:string;hidden:boolean;children:Element[];events:Record<string,(event:{preventDefault:()=>void})=>void>;append:(...nodes:Element[])=>void;replaceChildren:()=>void;addEventListener:(name:string,fn:(event:{preventDefault:()=>void})=>void)=>void};
 const element=():Element=>({value:'',textContent:'',hidden:false,children:[],events:{},append(...nodes){this.children.push(...nodes);},replaceChildren(){this.children=[];},addEventListener(name,fn){this.events[name]=fn;}});
 const nodes:Record<string,Element>={};for(const name of ['app-data','category','item','search','items','count','empty','requests','status','inquiry','message'])nodes[name]=element();
 nodes['app-data'].textContent=html.match(/<script id="app-data" type="application\/json">([\s\S]*?)<\/script>/)![1];
 const store:Record<string,string>=stored??(storageMode==='corrupt'?{[JSON.parse(nodes['app-data'].textContent).storageKey]:'{"bad":true}'}:{});
 const storage={getItem:(key:string)=>{if(storageMode==='blocked')throw Error('blocked');return store[key]??null;},setItem:(key:string,value:string)=>{if(storageMode==='blocked'||storageMode==='quota')throw Error('quota');store[key]=value;}};
 const document={getElementById:(id:string)=>nodes[id],createElement:()=>element(),documentElement:{lang:'en'}};
 const code=html.match(/<script>\n([\s\S]*?)<\/script>/)![1];vm.runInNewContext(code,{document,localStorage:storage},{timeout:1000});
 return {nodes,store,submit:(message:string,item='')=>{nodes.message.value=message;nodes.item.value=item;nodes.inquiry.events.submit({preventDefault:()=>{}});}};
}
test('portable HTML is readable, self contained, localized, and rejects invalid sources',()=>{
 for(const lang of ['ko','en','ja'] as const){const html=buildStudioExport(RELEASE_EXAMPLE,lang);assert.ok(html.startsWith('<!doctype html>'));assert.ok(html.includes('<html lang="'+lang+'">'));assert.ok(html.includes('function renderItems()'));assert.ok(html.includes('function validRequests(value)'));assert.ok(html.includes('const app = JSON.parse'));assert.ok(Buffer.byteLength(html)<512*1024);assert.doesNotMatch(html,/<script[^>]+src=|<link[^>]+href=|\bfetch\(|\beval\(|new Function/);}
 for(const files of [{...RELEASE_EXAMPLE,'style.css':'.portal { width: 100%; background: url(https://bad); }'},{...RELEASE_EXAMPLE,'server.json':'{}'},{...RELEASE_EXAMPLE,'extra.js':'anything'},{}])assert.throws(()=>buildStudioExport(files,'en'));
 assert.throws(()=>buildStudioExport(RELEASE_EXAMPLE,'en','../../secret'));
});
test('player script/markup content remains inert JSON and textContent with no game progress or raw source',()=>{
 const product=JSON.parse(RELEASE_EXAMPLE['project.json']);product.description='</script><script>globalThis.hacked=1</script>';product.items[0].name='<img onerror="steal()">';product.items[0].detail='& <svg/onload=steal()>\u2028';
 const html=buildStudioExport({...RELEASE_EXAMPLE,'project.json':JSON.stringify(product)},'en');assert.doesNotMatch(html,/<script>globalThis.hacked|<img onerror|<svg\/onload/);assert.ok(html.includes('\\u003c/script\\u003e'));assert.equal((html.match(/<script/g)||[]).length,2);
 const app=runtime(html);assert.equal(app.nodes.items.children[0].children[0].textContent,product.items[0].name);assert.doesNotMatch(html,/credits|endingJobs|apiKey|career-studio/);
});
test('exported app runs real combined search/categories and bounds local inquiries',()=>{
 const app=runtime(buildStudioExport(RELEASE_EXAMPLE,'en'));assert.equal(app.nodes.items.children.length,2);
 app.nodes.search.value='bakery';app.nodes.search.events.input({preventDefault:()=>{}});assert.equal(app.nodes.items.children.length,1);
 app.nodes.category.value='Directories';app.nodes.category.events.change({preventDefault:()=>{}});assert.equal(app.nodes.items.children.length,0);assert.equal(app.nodes.empty.hidden,false);
 app.submit('Can I visit tomorrow?','Bakery calculator');assert.equal(app.nodes.requests.children.length,1);assert.match(app.nodes.status.textContent,/Nothing was sent to a server/);assert.equal(Object.values(app.store).length,1);
 app.submit('x'.repeat(1001));assert.equal(app.nodes.requests.children.length,1);assert.match(app.nodes.status.textContent,/1–1,000/);
 app.submit('okay','forged item');assert.equal(app.nodes.requests.children.length,1);
 for(let i=1;i<51;i++)app.submit('Question '+i);assert.equal(app.nodes.requests.children.length,50);assert.match(app.nodes.status.textContent,/maximum 50/);
});
test('blocked, corrupt and quota-failed storage never claims an inquiry was saved or overwrites corrupt data',()=>{
 for(const mode of ['blocked','corrupt','quota'] as const){const app=runtime(buildStudioExport(RELEASE_EXAMPLE,'en'),mode),before={...app.store};app.submit('My question');assert.equal(app.nodes.requests.children.length,0);assert.doesNotMatch(app.nodes.status.textContent,/Kept in this browser/);assert.deepEqual(app.store,before);}
});
test('immutable app identity keeps local inquiries associated after edits while another app is separate',()=>{
 const getKey=(html:string)=>JSON.parse(html.match(/<script id="app-data" type="application\/json">([\s\S]*?)<\/script>/)![1]).storageKey;
 const first=buildStudioExport(RELEASE_EXAMPLE,'en','1234567812345678'),renamed=buildStudioExport({...RELEASE_EXAMPLE,'index.html':'<h1>Another title</h1>'},'ja','1234567812345678');assert.equal(getKey(first),getKey(renamed));assert.notEqual(getKey(first),getKey(buildStudioExport(RELEASE_EXAMPLE,'en','8765432187654321')));
});

test('emitted date/control regex accepts real ISO dates, rejects controls and survives inquiry reload',()=>{
 const html=buildStudioExport(RELEASE_EXAMPLE,'en'),line=html.split('\n').find(value=>value.includes('return Array.isArray(value)'))!;
 assert.ok(line.includes('/^\\d{4}-\\d{2}-\\d{2}T'));assert.ok(line.includes('!/[\\x00-\\x08'));
 assert.equal(line.includes('/^\\\\d'),false);assert.equal(line.includes('!/[\\\\x'),false);
 const app=runtime(html);app.submit('A real inquiry');assert.equal(app.nodes.requests.children.length,1);
 const key=Object.keys(app.store)[0],rows=JSON.parse(app.store[key]);assert.ok(Number.isFinite(Date.parse(rows[0].date)));
 const reload=runtime(html,'ok',app.store);assert.equal(reload.nodes.requests.children.length,1);assert.equal(reload.nodes.status.textContent,'');
 app.submit('bad\u0001control');assert.equal(app.nodes.requests.children.length,1);
});

test('fifty maximum-length quoted/backslash inquiries remain readable on reopen',()=>{
 const html=buildStudioExport(RELEASE_EXAMPLE,'en'),app=runtime(html),message=String.fromCharCode(92,34).repeat(500);
 for(let i=0;i<50;i++)app.submit(message);
 assert.equal(app.nodes.requests.children.length,50);assert.ok(Object.values(app.store)[0].length>100000);
 const reopen=runtime(html,'ok',app.store);assert.equal(reopen.nodes.requests.children.length,50);assert.equal(reopen.nodes.status.textContent,'');
 assert.deepEqual(JSON.parse(Object.values(reopen.store)[0]).map((row:{message:string})=>row.message),Array(50).fill(message));
});

test('storage cap also covers worst JSON Unicode escaping and rejects oversized existing data intact',()=>{
 const html=buildStudioExport(RELEASE_EXAMPLE,'en'),app=runtime(html),message=String.fromCharCode(0xd800).repeat(1000);
 for(let i=0;i<50;i++)app.submit(message);
 const raw=Object.values(app.store)[0];assert.ok(raw.length>300000);assert.ok(raw.length<400000);
 const reopen=runtime(html,'ok',app.store);assert.equal(reopen.nodes.requests.children.length,50);
 const key=Object.keys(app.store)[0],oversized={[key]:' '.repeat(400001)},blocked=runtime(html,'ok',oversized);assert.match(blocked.nodes.status.textContent,/could not be read/);blocked.submit('Replacement');assert.equal(oversized[key].length,400001);assert.equal(blocked.nodes.requests.children.length,0);
});
