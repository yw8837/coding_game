import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {buildPwaArchive,buildStaticSiteExport,finaleExportName,PWA_CSP,STATIC_SITE_CSP} from './finale-export.ts';
import {buildStudioExport,STUDIO_EXPORT_CSP} from './studio-export.ts';
import {RELEASE_EXAMPLE} from './release.ts';
import {crc32} from './zip.ts';

const ID='1234567812345678';
const EXTERNAL=/\b(?:src|href|action|srcset|poster|data)\s*=\s*["']?\s*(?:[a-z][a-z0-9+.-]*:|\/\/)|url\(|@import|\bfetch\(|https?:\/\//i;
const SAVE_STATE=/credits|endingJobs|apiKey|career-studio|codeshift-intro-demo/;
const withTitle=(title:string)=>({...RELEASE_EXAMPLE,'index.html':'<h1>'+title+'</h1>\n'});
const withProduct=(change:Record<string,unknown>,files=RELEASE_EXAMPLE)=>({...files,'project.json':JSON.stringify({...JSON.parse(RELEASE_EXAMPLE['project.json']),...change})});
const INVALID=[{...RELEASE_EXAMPLE,'style.css':'.portal { width: 100%; background: url(https://bad); }'},{...RELEASE_EXAMPLE,'server.json':'{}'},{...RELEASE_EXAMPLE,'extra.js':'anything'},withTitle('<img src=x onerror=alert(1)>'),{}];

function runtime(html:string){
 type Element={value:string;textContent:string;hidden:boolean;children:Element[];events:Record<string,(event:{preventDefault:()=>void})=>void>;append:(...nodes:Element[])=>void;replaceChildren:()=>void;addEventListener:(name:string,fn:(event:{preventDefault:()=>void})=>void)=>void};
 const element=():Element=>({value:'',textContent:'',hidden:false,children:[],events:{},append(...nodes){this.children.push(...nodes);},replaceChildren(){this.children=[];},addEventListener(name,fn){this.events[name]=fn;}});
 const nodes:Record<string,Element>={};for(const name of ['app-data','category','item','search','items','count','empty','requests','status','inquiry','message'])nodes[name]=element();
 nodes['app-data'].textContent=html.match(/<script id="app-data" type="application\/json">([\s\S]*?)<\/script>/)![1];
 const store:Record<string,string>={};
 const storage={getItem:(key:string)=>store[key]??null,setItem:(key:string,value:string)=>{store[key]=value;}};
 const document={getElementById:(id:string)=>nodes[id],createElement:()=>element(),documentElement:{lang:'en'}};
 const code=html.match(/<script>\n([\s\S]*?)<\/script>/)![1];vm.runInNewContext(code,{document,localStorage:storage},{timeout:1000});
 return {nodes,store,submit:(message:string,item='')=>{nodes.message.value=message;nodes.item.value=item;nodes.inquiry.events.submit({preventDefault:()=>{}});}};
}
/** Reads the stored (method 0) entries through the central directory and checks each CRC. */
function readZip(bytes:Uint8Array):Record<string,string>&{names:string[]}{
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),end=bytes.length-22,decoder=new TextDecoder('utf-8',{fatal:true});
 assert.equal(view.getUint32(end,true),0x06054b50);
 const files:Record<string,string>={},names:string[]=[];let at=view.getUint32(end+16,true);
 for(let i=0;i<view.getUint16(end+10,true);i++){
  assert.equal(view.getUint32(at,true),0x02014b50);assert.equal(view.getUint16(at+10,true),0);
  const crc=view.getUint32(at+16,true),size=view.getUint32(at+20,true),nameLength=view.getUint16(at+28,true),offset=view.getUint32(at+42,true);
  const name=decoder.decode(bytes.subarray(at+46,at+46+nameLength));assert.equal(view.getUint32(offset,true),0x04034b50);
  const start=offset+30+view.getUint16(offset+26,true)+view.getUint16(offset+28,true),data=bytes.subarray(start,start+size);
  assert.equal(crc32(data),crc);names.push(name);files[name]=decoder.decode(data);
  at+=46+nameLength+view.getUint16(at+30,true)+view.getUint16(at+32,true);
 }
 return Object.assign(files,{names});
}

test('static site is pure HTML/CSS with the authored product, localized labels and no external references',()=>{
 const labels={ko:['분류','로컬호스트 히어로에서 만든 작품'],en:['Category','Made in Localhost Hero'],ja:['分類','ローカルホスト・ヒーローで作った作品']} as const;
 const pages=new Set<string>();
 for(const lang of ['ko','en','ja'] as const){
  const html=buildStaticSiteExport(RELEASE_EXAMPLE,lang);pages.add(html);
  assert.ok(html.startsWith('<!doctype html>\n<html lang="'+lang+'">'));assert.doesNotMatch(html,/<script|\son[a-z]+\s*=|javascript:/i);
  assert.ok(html.includes(`<meta http-equiv="Content-Security-Policy" content="${STATIC_SITE_CSP}">`));assert.equal(STATIC_SITE_CSP,"default-src 'none'; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'");
  assert.ok(html.includes('<h1>My neighborhood studio</h1>'));assert.ok(html.includes('<p>Small tools I built for local clients.</p>'));
  for(const item of JSON.parse(RELEASE_EXAMPLE['project.json']).items){assert.ok(html.includes(`<h3>${item.name}</h3>`));assert.ok(html.includes(`<p>${item.detail}</p>`));assert.ok(html.includes(`<h2>${item.category}</h2>`));}
  assert.ok(html.includes('<a href="#group-1">Calculators</a>'));assert.ok(html.includes('<section id="group-2"><h2>Directories</h2>'));
  for(const label of labels[lang])assert.ok(html.includes(label),lang+' '+label);
  assert.ok(html.includes('<main class="portal layout-cards accent-ocean kind-portfolio">'));assert.ok(html.includes('--accent: #285c80;'));assert.ok(html.includes('.portal { width: 100%;'));
  assert.doesNotMatch(html,EXTERNAL);assert.doesNotMatch(html,SAVE_STATE);assert.doesNotMatch(html,/localStorage|storageKey|app-data/);
  assert.ok(Buffer.byteLength(html)<512*1024);assert.equal(buildStaticSiteExport(RELEASE_EXAMPLE,lang),html);
 }
 assert.equal(pages.size,3);
});

test('static site follows list layout, accent, uncategorized items and single-category pages',()=>{
 const files=withProduct({kind:'events',accent:'amber',layout:'list',items:[{name:'Morning run',detail:'',category:''},{name:'Night market',detail:'Food stalls',category:'Markets'}]});
 const en=buildStaticSiteExport(files,'en'),ko=buildStaticSiteExport(files,'ko');
 assert.ok(en.includes('<main class="portal layout-list accent-amber kind-events">'));assert.ok(en.includes('--accent: #8a561d;'));
 assert.ok(en.includes('<section id="group-1"><h2>Uncategorized</h2><ul class="items"><li><h3>Morning run</h3></li></ul></section>'));assert.ok(ko.includes('<h2>분류 없음</h2>'));assert.ok(buildStaticSiteExport(files,'ja').includes('<h2>未分類</h2>'));
 const single=buildStaticSiteExport(withProduct({items:[{name:'One',detail:'a',category:'Same'},{name:'Two',detail:'b',category:'Same'}]}),'en');
 assert.doesNotMatch(single,/<nav/);assert.equal((single.match(/<section/g)||[]).length,1);
});

test('player text stays inert text in the static site and the app package',async()=>{
 const title=`"&'&lt;img src=x onerror=alert(1)&gt;`;
 const files=withProduct({description:'</style><script>alert(1)</script>',items:[{name:'<img src=x onerror=alert(1)>',detail:'"><svg onload=alert(1)>',category:'</h2><script>x</script>'}]},withTitle(title));
 const html=buildStaticSiteExport(files,'en');
 assert.doesNotMatch(html,/<img|<svg|<script/i);assert.equal((html.match(/<\/style>/g)||[]).length,1);
 assert.ok(html.includes('<h1>&quot;&amp;&#39;&amp;lt;img src=x onerror=alert(1)&amp;gt;</h1>'));assert.ok(html.includes('<h3>&lt;img src=x onerror=alert(1)&gt;</h3>'));assert.ok(html.includes('<p>&quot;&gt;&lt;svg onload=alert(1)&gt;</p>'));
 assert.ok(html.includes('<meta name="description" content="&lt;/style&gt;&lt;script&gt;alert(1)&lt;/script&gt;">'));
 const pwa=readZip(buildPwaArchive(files,'en',ID));
 assert.doesNotMatch(pwa['index.html'],/<img|<svg/i);assert.equal((pwa['index.html'].match(/<script/g)||[]).length,3);
 assert.equal(JSON.parse(pwa['manifest.webmanifest']).name,title);assert.ok(pwa['icon.svg'].includes('>&quot;</text>'));assert.doesNotMatch(pwa['icon.svg'],/<img|<script|\son[a-z]+=/i);
 assert.equal(runtime(pwa['index.html']).nodes.items.children[0].children[0].textContent,'<img src=x onerror=alert(1)>');
 for(const content of [html,...pwa.names.map(name=>pwa[name])])assert.doesNotMatch(content,SAVE_STATE);
});

test('invalid sources, languages and app identities are rejected',()=>{
 for(const files of INVALID){assert.throws(()=>buildStaticSiteExport(files,'en'));assert.throws(()=>buildPwaArchive(files,'en',ID));}
 assert.throws(()=>buildStaticSiteExport(RELEASE_EXAMPLE,'fr' as never));assert.throws(()=>buildPwaArchive(RELEASE_EXAMPLE,'fr' as never,ID));
 for(const id of ['../../secret','','ABCDEF1234567890'])assert.throws(()=>buildPwaArchive(RELEASE_EXAMPLE,'en',id),/identity/);
});

test('app package has exactly five stored entries and a valid install manifest',()=>{
 const zip=buildPwaArchive(RELEASE_EXAMPLE,'en',ID),files=readZip(zip);
 assert.deepEqual(files.names,['index.html','manifest.webmanifest','sw.js','icon.svg','README.md']);
 assert.ok(zip.length<512*1024);assert.deepEqual(buildPwaArchive(RELEASE_EXAMPLE,'en',ID),zip);
 const manifest=JSON.parse(files['manifest.webmanifest']);
 assert.deepEqual(manifest,{name:'My neighborhood studio',short_name:'My neighborh',description:'Small tools I built for local clients.',lang:'en',start_url:'./',scope:'./',display:'standalone',theme_color:'#285c80',background_color:'#edf3f8',icons:[{src:'icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'}]});
 assert.equal(JSON.parse(readZip(buildPwaArchive(withTitle('우리 동네 지도'),'ko',ID))['manifest.webmanifest']).short_name,'우리 동네 지도');
 for(const name of ['index.html','manifest.webmanifest'])assert.doesNotMatch(files[name],EXTERNAL);
 assert.equal((files['icon.svg'].match(/https?:\/\//g)||[]).length,1);assert.ok(files['icon.svg'].startsWith('<svg xmlns="http://www.w3.org/2000/svg" '));
 assert.ok(files['icon.svg'].includes('fill="#285c80"'));assert.ok(files['icon.svg'].includes('>M</text>'));assert.doesNotMatch(files['icon.svg'],/href|<image|<foreignObject|<script/i);
 const icon=(title:string)=>readZip(buildPwaArchive(withTitle(title),'en',ID))['icon.svg'];
 assert.ok(icon('우리 동네').includes('>우</text>'));assert.ok(icon('tiny tools').includes('>T</text>'));assert.ok(icon('👩‍💻 Studio').includes('>👩‍💻</text>'));
 assert.ok(readZip(buildPwaArchive(withProduct({accent:'sage'}),'en',ID))['icon.svg'].includes('fill="#356553"'));
});

test('installable index is the same web app plus manifest, icon, stricter CSP additions and guarded worker registration',()=>{
 const index=readZip(buildPwaArchive(RELEASE_EXAMPLE,'en',ID))['index.html'],web=buildStudioExport(RELEASE_EXAMPLE,'en',ID);
 assert.ok(index.includes(`<meta http-equiv="Content-Security-Policy" content="${PWA_CSP}">`));
 assert.equal(PWA_CSP,"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; img-src 'self' data:; manifest-src 'self'; worker-src 'self'; form-action 'none'; base-uri 'none'");
 assert.ok(index.includes('<link rel="manifest" href="manifest.webmanifest">'));assert.ok(index.includes('<link rel="icon" href="icon.svg" type="image/svg+xml">'));assert.ok(index.includes('<meta name="theme-color" content="#285c80">'));
 assert.ok(index.includes("if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {"));
 const stripped=index.replace(PWA_CSP,STUDIO_EXPORT_CSP).replace(/\n<meta name="theme-color"[^\n]*\n<link rel="manifest"[^\n]*\n<link rel="icon"[^\n]*/,'').replace(/\n<script>\n'use strict';\n\/\/ Install support[\s\S]*?<\/script>/,'');
 assert.equal(stripped,web);assert.doesNotMatch(web,/manifest|serviceWorker/);assert.ok(web.includes(STUDIO_EXPORT_CSP));
 const app=runtime(index);assert.equal(app.nodes.items.children.length,2);
 app.nodes.search.value='bakery';app.nodes.search.events.input({preventDefault:()=>{}});assert.equal(app.nodes.items.children.length,1);
 app.nodes.category.value='Directories';app.nodes.category.events.change({preventDefault:()=>{}});assert.equal(app.nodes.items.children.length,0);assert.equal(app.nodes.empty.hidden,false);
 app.submit('Can I visit tomorrow?','Bakery calculator');assert.equal(app.nodes.requests.children.length,1);assert.match(app.nodes.status.textContent,/Nothing was sent to a server/);
 assert.deepEqual(Object.keys(app.store),['codeshift-app-'+ID]);assert.equal(JSON.parse(app.store['codeshift-app-'+ID])[0].message,'Can I visit tomorrow?');
 app.submit('x'.repeat(1001));assert.equal(app.nodes.requests.children.length,1);
});

test('worker registration runs only on HTTPS or localhost and fails silently',async()=>{
 const index=readZip(buildPwaArchive(RELEASE_EXAMPLE,'en',ID))['index.html'];
 const code=index.match(/<script>\n('use strict';\n\/\/ Install support[\s\S]*?)<\/script>/)![1];
 const run=(protocol:string,hostname:string,navigator:object)=>vm.runInNewContext(code,{navigator,location:{protocol,hostname}},{timeout:1000});
 const calls:string[]=[],serviceWorker={register:(url:string)=>{calls.push(url);return Promise.resolve();}};
 for(const [protocol,hostname,expected] of [['https:','me.github.io',1],['http:','localhost',1],['http:','127.0.0.1',1],['http:','example.com',0],['file:','',0]] as const){calls.length=0;run(protocol,hostname,{serviceWorker});assert.deepEqual(calls,expected?['./sw.js']:[],protocol+hostname);}
 const unhandled:unknown[]=[],listener=(reason:unknown)=>unhandled.push(reason);process.on('unhandledRejection',listener);
 try{
  assert.doesNotThrow(()=>run('https:','me.github.io',{}));
  assert.doesNotThrow(()=>run('https:','me.github.io',{serviceWorker:{register:()=>Promise.reject(Error('denied'))}}));
  assert.doesNotThrow(()=>run('https:','me.github.io',{serviceWorker:{register:()=>{throw Error('SecurityError');}}}));
  assert.doesNotThrow(()=>run('https:','me.github.io',Object.defineProperty({},'serviceWorker',{get(){throw Error('blocked');}})));
  await new Promise(resolve=>setTimeout(resolve,20));
 }finally{process.off('unhandledRejection',listener);}
 assert.deepEqual(unhandled,[]);
});

test('service worker caches only its own files, cleans only its older caches and ignores cross-origin requests',async()=>{
 const sw=readZip(buildPwaArchive(RELEASE_EXAMPLE,'en',ID))['sw.js'];
 assert.ok(sw.includes("const FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg'];"));assert.ok(sw.includes(`const PREFIX = 'localhost-hero-${ID}-';`));
 assert.doesNotMatch(sw,/https?:|importScripts|eval\(|new Function|\.put\(|\.add\(/);
 const current='localhost-hero-'+ID+'-'+sw.match(/const CACHE = PREFIX \+ '([a-f0-9]{16})';/)![1];
 const changed=readZip(buildPwaArchive(withProduct({description:'A newer description.'}),'en',ID))['sw.js'];assert.notEqual(changed,sw);assert.ok(changed.includes(`const PREFIX = 'localhost-hero-${ID}-';`));
 const base='https://me.github.io/app/sw.js',page=new Map([[new URL('./',base).href,'PAGE']]),opened:string[]=[],added:string[][]=[],deleted:string[]=[],network:string[]=[];let online=true;
 const cache={addAll:async(list:string[])=>{added.push(list);},match:async(request:string|{url:string})=>page.get(new URL(typeof request==='string'?request:request.url,base).href)};
 const caches={open:async(name:string)=>{opened.push(name);return cache;},keys:async()=>[current,'localhost-hero-'+ID+'-0000000000000000','localhost-hero-8765432187654321-0000000000000000','another-site-cache'],delete:async(key:string)=>{deleted.push(key);return true;}};
 const listeners:Record<string,(event:object)=>void>={},self={location:{origin:'https://me.github.io'},addEventListener:(name:string,fn:(event:object)=>void)=>{listeners[name]=fn;},skipWaiting:async()=>{},clients:{claim:async()=>{}}};
 const fetch=async(request:{url:string})=>{network.push(request.url);if(!online)throw Error('offline');return 'NETWORK';};
 vm.runInNewContext(sw,{self,caches,fetch,URL},{timeout:1000});
 const waits:unknown[]=[],waitUntil=(promise:unknown)=>{waits.push(promise);};
 listeners.install({waitUntil});listeners.activate({waitUntil});for(const wait of waits)await wait;
 assert.deepEqual(added.map(list=>[...list]),[['./','./index.html','./manifest.webmanifest','./icon.svg']]);assert.equal(opened[0],current);assert.deepEqual(deleted,['localhost-hero-'+ID+'-0000000000000000']);
 const request=(url:string,method='GET',mode='cors')=>{let response:unknown=null;listeners.fetch({request:{url,method,mode},respondWith:(value:unknown)=>{response=value;}});return response;};
 assert.equal(request('https://cdn.example.com/lib.js'),null);assert.equal(request('https://me.github.io/app/','POST','navigate'),null);
 assert.equal(await request('https://me.github.io/app/','GET','navigate'),'PAGE');assert.deepEqual(network,[]);
 assert.equal(await request('https://me.github.io/app/notes.txt'),'NETWORK');
 online=false;assert.equal(await request('https://me.github.io/app/?from=home','GET','navigate'),'PAGE');
 await assert.rejects(async()=>{await request('https://me.github.io/app/notes.txt');},/offline/);
});

test('README explains file use, HTTPS install via GitHub Pages and browser-local data in each language',()=>{
 const notOnFile={ko:'파일 주소(file://)에서 서비스 워커를 실행하지 않',en:'Browsers do not run service workers from file addresses (file://)',ja:'ファイルのアドレス（file://）ではサービスワーカーを動かさない'} as const;
 const readmes=new Set<string>();
 for(const lang of ['ko','en','ja'] as const){
  const readme=readZip(buildPwaArchive(RELEASE_EXAMPLE,lang,ID))['README.md'];readmes.add(readme);
  for(const text of ['index.html','manifest.webmanifest','sw.js','icon.svg','GitHub','Settings › Pages','HTTPS','localStorage',notOnFile[lang]])assert.ok(readme.includes(text),lang+' '+text);
  assert.equal(readme.includes('English: open index.html directly for an offline web app'),lang!=='en');
  assert.doesNotMatch(readme,/https?:\/\/[a-z0-9]/i);assert.doesNotMatch(readme,/My neighborhood studio/);
 }
 assert.equal(readmes.size,3);
});

test('download names are safe ASCII slugs with fixed defaults',()=>{
 assert.deepEqual((['web','webapp','pwa'] as const).map(branch=>finaleExportName(branch,'Bakery Tools')),['bakery-tools-site.html','bakery-tools-web-app.html','bakery-tools-app-pwa.zip']);
 for(const title of ['우리 동네 지도','Cafe 카페','!!!','   ',''])assert.deepEqual((['web','webapp','pwa'] as const).map(branch=>finaleExportName(branch,title)),['my-site.html','my-web-app.html','my-app-pwa.zip']);
 assert.equal(finaleExportName('web','../../etc/passwd'),'etc-passwd-site.html');assert.equal(finaleExportName('pwa','C:\\Windows\\evil'),'c-windows-evil-app-pwa.zip');assert.equal(finaleExportName('web','CON'),'con-site.html');
 assert.equal(finaleExportName('web','x'.repeat(200)),'x'.repeat(40)+'-site.html');assert.equal(finaleExportName('web','a'.repeat(39)+' b'),'a'.repeat(39)+'-site.html');
 for(const title of ['../../etc/passwd','C:\\Windows\\evil','x'.repeat(200),'Tom & "Jerry\'s"','a/b\\c..d']){
  const name=finaleExportName('webapp',title);assert.match(name,/^[a-z0-9]+(?:-[a-z0-9]+)*\.html$/);assert.ok(name.length<=60);assert.doesNotMatch(name,/[\\/]|\.\./);
 }
 assert.throws(()=>finaleExportName('exe' as never,'x'));
});
