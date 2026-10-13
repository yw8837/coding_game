import {releaseHash} from './release.ts';
import {authoredProjectFormat,buildAuthoredHtml} from './release-authored.ts';
import type {StudioSourceMap} from './studio.ts';
import {GAME_BRAND,GAME_VERSION_LABEL} from './brand.ts';
import {buildStudioAppHtml,escapeHtml,STUDIO_ACCENT_COLORS,STUDIO_EXPORT_WORDS,studioExportPreview,studioPortalCss} from './studio-export.ts';
import {buildZip} from './zip.ts';

export type FinaleBranch='web'|'webapp';
export type FinaleLanguage='ko'|'en'|'ja';

const SITE_WORDS={ko:{other:'분류 없음'},en:{other:'Uncategorized'},ja:{other:'未分類'}} as const;
/** Pure HTML/CSS: nothing to run, fetch or store. */
export const STATIC_SITE_CSP="default-src 'none'; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'";
/** The web app policy plus exactly what installation needs: same-origin manifest, worker and icon. */
export const PWA_CSP="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; img-src 'self' data:; manifest-src 'self'; worker-src 'self'; form-action 'none'; base-uri 'none'";
const BACKGROUNDS={sage:'#eef3ef',ocean:'#edf3f8',amber:'#f8f1e8'} as const;
const graphemes=(value:string)=>Array.from(new Intl.Segmenter('en',{granularity:'grapheme'}).segment(value),part=>part.segment);

/** A zero-JavaScript page of the authored product, grouped by category. Uploadable as index.html. */
export function buildStaticSiteExport(files:StudioSourceMap,language:FinaleLanguage):string{
 if(authoredProjectFormat(files)){studioExportPreview(files,language);return buildAuthoredHtml(files,language);}
 const {title,product,style}=studioExportPreview(files,language),w=STUDIO_EXPORT_WORDS[language];
 const groups=new Map<string,typeof product.items>();
 for(const item of product.items)groups.set(item.category,[...(groups.get(item.category)??[]),item]);
 const sections=[...groups].map(([category,items],index)=>({id:'group-'+(index+1),label:category||SITE_WORDS[language].other,items}));
 const nav=sections.length>1?`<nav aria-label="${escapeHtml(w.category)}"><h2>${escapeHtml(w.category)}</h2><ul class="categories">${sections.map(section=>`<li><a href="#${section.id}">${escapeHtml(section.label)}</a> <small>${section.items.length}</small></li>`).join('')}</ul></nav>\n`:'';
 const body=sections.map(section=>`<section id="${section.id}"><h2>${escapeHtml(section.label)}</h2><ul class="items">${section.items.map(item=>`<li><h3>${escapeHtml(item.name)}</h3>${item.detail?`<p>${escapeHtml(item.detail)}</p>`:''}</li>`).join('')}</ul></section>`).join('\n');
 return `<!doctype html>
<html lang="${language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${STATIC_SITE_CSP}">
<meta name="generator" content="${GAME_BRAND} ${GAME_VERSION_LABEL}">
<meta name="description" content="${escapeHtml(product.description)}">
<title>${escapeHtml(title)}</title>
<!-- A static page: HTML and CSS only, no JavaScript. To publish it, upload this file as index.html (for example to GitHub Pages). -->
<style>
:root { color-scheme: light; font-family: system-ui, sans-serif; color: #24332d; background: #f6f4ee; --accent: ${STUDIO_ACCENT_COLORS[product.accent]}; }
* { box-sizing: border-box; } body { margin: 0; }
${studioPortalCss(style)}
h1, h2 { overflow-wrap: anywhere; color: var(--accent); } h3 { margin: 0; font-size: 1.05rem; overflow-wrap: anywhere; } p { line-height: 1.6; overflow-wrap: anywhere; }
a { color: var(--accent); } :focus-visible { outline: 3px solid #af6726; outline-offset: 3px; }
.categories { list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: .5rem 1rem; }
.items { list-style: none; padding: 0; display: block; gap: 1rem; }
.layout-cards .items { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr)); }
.items li { background: white; border: 1px solid #d3ddd6; border-radius: .5rem; padding: 1rem; margin-block: .6rem; overflow-wrap: anywhere; }
.layout-cards .items li { border-top: 4px solid var(--accent); }
.items li p { margin: .4rem 0 0; } small { color: #52635b; } section { margin-block: 2rem; } footer { margin-top: 3rem; }
@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
</style>
</head>
<body>
<main class="portal layout-${product.layout} accent-${product.accent} kind-${product.kind}">
<header><h1>${escapeHtml(title)}</h1><p>${escapeHtml(product.description)}</p></header>
${nav}${body}
<footer><p><small>${escapeHtml(w.credit)}</small></p></footer>
</main>
</body>
</html>\n`;
}

const SW_REGISTRATION=`
<script>
'use strict';
// Install support. Browsers run service workers only over HTTPS or on localhost, never from a file.
try {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
} catch {
  // Without a service worker the app still works; it just cannot be installed or cached offline.
}
</script>`;

/** Cache-first for this folder only; cross-origin and non-GET requests go straight to the network uncached. */
function serviceWorker(appId:string,version:string):string{
 return `'use strict';
// Offline cache for this app, generated by ${GAME_BRAND}. A new upload gets a new cache name.
const PREFIX = 'localhost-hero-${appId}-';
const CACHE = PREFIX + '${version}';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  // Only this app's older caches; other apps on the same site keep theirs.
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(caches.open(CACHE).then(cache => cache.match(request).then(hit => hit || fetch(request).catch(error => {
    if (request.mode === 'navigate') return cache.match('./').then(page => page || Promise.reject(error));
    throw error;
  }))));
});
`;
}

const README={
 ko:['# 내 앱 — 설치용 패키지','','로컬호스트 히어로에서 만든 웹앱을 "앱으로 설치"할 수 있게 묶은 폴더입니다.','','## 파일','- `index.html` — 앱 본체입니다. 검색·분류와 이 브라우저 안의 문의 보관이 동작합니다.','- `manifest.webmanifest` — 앱 이름·아이콘·색을 브라우저에 알려 주는 설치 정보입니다.','- `sw.js` — 서비스 워커입니다. HTTPS 주소에서 한 번 연 뒤에는 인터넷이 끊겨도 이 폴더의 파일을 캐시에서 엽니다.','- `icon.svg` — 앱 아이콘입니다.','','## 파일로 바로 열기','`index.html`을 더블클릭하면 평범한 오프라인 웹앱으로 바로 동작합니다. 다만 브라우저는 파일 주소(file://)에서 서비스 워커를 실행하지 않으므로, 이렇게 열면 앱 설치 기능은 동작하지 않습니다.','','## 앱으로 설치하기 (HTTPS 호스팅 필요)','1. GitHub에서 새 저장소(repository)를 만듭니다.','2. 이 폴더의 파일을 모두 저장소 맨 위에 업로드합니다.','3. Settings › Pages에서 배포할 브랜치를 고르고 저장합니다.','4. 잠시 뒤 표시되는 https:// 주소를 브라우저에서 엽니다.','5. 브라우저 메뉴에서 "앱 설치"(또는 "홈 화면에 추가")를 누릅니다.','','GitHub Pages 주소는 누구나 볼 수 있습니다. 브라우저와 기기에 따라 설치 메뉴의 이름이 다르거나 없을 수 있습니다. 새 버전을 올리면 몇 분 뒤 앱을 한두 번 다시 열 때 반영됩니다.','','## 데이터','문의는 서버로 보내지지 않고, 앱을 연 그 브라우저의 localStorage에만 보관됩니다. 파일로 연 앱과 https 주소로 연 앱, 다른 브라우저나 기기는 서로 다른 보관함을 씁니다. 브라우저 데이터를 지우면 문의도 사라집니다.','','---','English: open index.html directly for an offline web app; to install it as an app, host this folder over HTTPS (for example GitHub Pages) and choose "Install app" in the browser menu.',''],
 en:['# My app — install package','','The web app you made in Localhost Hero, packaged so it can be installed as an app.','','## Files','- `index.html` — the app itself. Search, categories and browser-local inquiries work.','- `manifest.webmanifest` — install information that tells the browser the app name, icon and colors.','- `sw.js` — a service worker. After the app has been opened once from an HTTPS address, it opens this folder\'s files from a cache even without internet.','- `icon.svg` — the app icon.','','## Open the file directly','Double-click `index.html` and it works right away as a normal offline web app. Browsers do not run service workers from file addresses (file://), so opened this way the app cannot be installed.','','## Install as an app (requires HTTPS hosting)','1. Create a new repository on GitHub.','2. Upload every file in this folder to the top of the repository.','3. In Settings › Pages, choose the branch to publish and save.','4. Open the https:// address it shows after a short wait.','5. In the browser menu, choose "Install app" (or "Add to Home Screen").','','Anyone can see a GitHub Pages address. Depending on the browser and device, the install menu may have another name or may not exist. After you upload a new version, it appears a few minutes later, once you reopen the app once or twice.','','## Data','Inquiries are never sent to a server. They stay only in the localStorage of the browser that opened the app. The app opened as a file, the app opened from the https address, and other browsers or devices each keep separate inquiries. Clearing browser data deletes them.',''],
 ja:['# わたしのアプリ — インストール用パッケージ','','ローカルホスト・ヒーローで作ったウェブアプリを「アプリとしてインストール」できるようにまとめたフォルダーです。','','## ファイル','- `index.html` — アプリ本体です。検索・分類とブラウザ内の問い合わせ保存が動きます。','- `manifest.webmanifest` — アプリ名・アイコン・色をブラウザに伝えるインストール情報です。','- `sw.js` — サービスワーカーです。HTTPSのアドレスで一度開いた後は、インターネットが切れてもこのフォルダーのファイルをキャッシュから開きます。','- `icon.svg` — アプリのアイコンです。','','## ファイルを直接開く','`index.html`をダブルクリックすると、普通のオフラインのウェブアプリとしてすぐ動きます。ただしブラウザはファイルのアドレス（file://）ではサービスワーカーを動かさないため、この開き方ではアプリのインストールはできません。','','## アプリとしてインストールする（HTTPSでの公開が必要）','1. GitHubで新しいリポジトリを作ります。','2. このフォルダーのファイルをすべてリポジトリの一番上にアップロードします。','3. Settings › Pagesで公開するブランチを選んで保存します。','4. しばらくして表示されるhttps://のアドレスをブラウザで開きます。','5. ブラウザのメニューで「アプリをインストール」（または「ホーム画面に追加」）を選びます。','','GitHub Pagesのアドレスは誰でも見られます。ブラウザや端末によって、インストールのメニュー名が違ったり、メニューがなかったりします。新しい版をアップロードすると、数分後、アプリを1～2回開き直したときに反映されます。','','## データ','問い合わせはサーバーに送られず、アプリを開いたそのブラウザのlocalStorageにだけ保存されます。ファイルで開いたアプリ、httpsのアドレスで開いたアプリ、ほかのブラウザや端末は、それぞれ別の保存場所を使います。ブラウザのデータを消すと問い合わせも消えます。','','---','English: open index.html directly for an offline web app; to install it as an app, host this folder over HTTPS (for example GitHub Pages) and choose "Install app" in the browser menu.',''],
} as const;

/** The web app plus manifest, offline service worker, icon and an honest hosting guide. */
export function buildPwaArchive(files:StudioSourceMap,language:FinaleLanguage,appId:string):Uint8Array{
 const {title,product}=studioExportPreview(files,language),color=STUDIO_ACCENT_COLORS[product.accent],letters=graphemes(title);
 const index=buildStudioAppHtml(files,language,appId,{csp:PWA_CSP,head:`\n<meta name="theme-color" content="${color}">\n<link rel="manifest" href="manifest.webmanifest">\n<link rel="icon" href="icon.svg" type="image/svg+xml">`,tail:SW_REGISTRATION});
 const manifest=JSON.stringify({name:title,short_name:letters.length<=12?title:letters.slice(0,12).join('').trim(),description:product.description,lang:language,start_url:'./',scope:'./',display:'standalone',theme_color:color,background_color:BACKGROUNDS[product.accent],icons:[{src:'icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'}]},null,2)+'\n';
 const icon=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><rect width="512" height="512" rx="112" fill="${color}"/><text x="256" y="256" dy=".35em" text-anchor="middle" font-family="system-ui, sans-serif" font-size="280" font-weight="700" fill="#ffffff">${escapeHtml(letters[0].toUpperCase())}</text></svg>\n`;
 const version=releaseHash({'index.html':index,'manifest.webmanifest':manifest,'icon.svg':icon});
 return buildZip([
  {name:'index.html',content:index},
  {name:'manifest.webmanifest',content:manifest},
  {name:'sw.js',content:serviceWorker(appId,version)},
  {name:'icon.svg',content:icon},
  {name:'README.md',content:README[language].join('\n')},
 ]);
}

const EXPORT_SUFFIX={web:'-site.html',webapp:'-web-app.html',pwa:'-app-pwa.zip'} as const;
/** ASCII download names; non-ASCII or empty titles use my-site.html, my-web-app.html and my-app-pwa.zip. */
export function finaleExportName(branch:FinaleBranch|'pwa',title:string):string{
 if(!Object.hasOwn(EXPORT_SUFFIX,branch))throw Error('Invalid finale export branch');
 const ascii=typeof title==='string'&&/^[\x20-\x7e]+$/.test(title);
 const slug=ascii?title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40).replace(/-+$/,''):'';
 return (slug||'my')+EXPORT_SUFFIX[branch];
}
