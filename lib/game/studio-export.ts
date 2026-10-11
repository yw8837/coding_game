import {evaluateRelease,releaseFiles,releaseHash,releasePublishedFresh,type ReleaseEvaluation,type ReleaseStyle} from './release.ts';
import {STUDIO_FILE_NAMES,studioFiles,studioFresh,studioSourceMapValid,type StudioSourceMap} from './studio.ts';
import {GAME_BRAND,GAME_NAME,GAME_VERSION_LABEL} from './brand.ts';
import {buildZip} from './zip.ts';

export type StudioExportLanguage='ko'|'en'|'ja';
export const STUDIO_EXPORT_WORDS={
 ko:{search:'목록 검색',category:'분류',all:'모두',empty:'조건에 맞는 항목이 없어요.',inquiry:'이 작품에 문의',item:'문의할 항목',project:'전체 작품',message:'문의 내용',save:'이 브라우저에 보관',saved:'이 브라우저에 보관했습니다. 서버로 전송되지 않습니다.',local:'문의는 이 파일을 연 브라우저에만 보관됩니다. 파일을 다른 사람에게 보내도 문의는 함께 전달되지 않습니다. 서버와 온라인 배포는 포함되지 않습니다.',unavailable:'브라우저 저장소를 사용할 수 없습니다. 문의는 보관되지 않았습니다.',corrupt:'저장된 문의 형식을 읽을 수 없습니다. 기존 자료를 덮어쓰지 않았습니다.',invalid:'문의는 공백이 아닌 1~1,000자여야 합니다.',limit:'문의 보관함이 가득 찼습니다 (최대 50개).',requests:'이 브라우저의 문의',source:'코드를 계속 편집하려면 이 HTML 파일을 텍스트 편집기에서 여세요. 아래의 CSS, app-data와 JavaScript를 수정할 수 있습니다. 지원 형태: 장소 목록 · 행사 안내 · 작품 모음.',credit:'로컬호스트 히어로에서 만든 작품'},
 en:{search:'Search items',category:'Category',all:'All',empty:'No items match.',inquiry:'Ask about this project',item:'Item to ask about',project:'Whole project',message:'Your message',save:'Keep in this browser',saved:'Kept in this browser. Nothing was sent to a server.',local:'Inquiries stay only in the browser that opens this file. Sending the file does not send your inquiries. No server or online deployment is included.',unavailable:'Browser storage is unavailable. Your inquiry was not saved.',corrupt:'Stored inquiries could not be read. Existing data was not overwritten.',invalid:'Write a nonblank message of 1–1,000 characters.',limit:'The inquiry box is full (maximum 50).',requests:'Inquiries in this browser',source:'To continue coding, open this HTML file in a text editor. Edit the CSS, app-data and JavaScript below. Supported formats: directory, events and portfolio.',credit:'Made in Localhost Hero'},
 ja:{search:'一覧を検索',category:'分類',all:'すべて',empty:'条件に合う項目がありません。',inquiry:'この作品について問い合わせ',item:'問い合わせる項目',project:'作品全体',message:'問い合わせ内容',save:'このブラウザに保存',saved:'このブラウザに保存しました。サーバーには送信していません。',local:'問い合わせはこのファイルを開いたブラウザだけに保存されます。ファイルを送っても問い合わせは一緒に送られません。サーバーやオンライン公開は含まれません。',unavailable:'ブラウザの保存領域を使えません。問い合わせは保存されませんでした。',corrupt:'保存された問い合わせを読めません。既存のデータは上書きしていません。',invalid:'空白以外の1～1,000文字で書いてください。',limit:'問い合わせが上限に達しました（最大50件）。',requests:'このブラウザの問い合わせ',source:'コードを続けて編集するには、このHTMLをテキストエディターで開いてください。下のCSS、app-data、JavaScriptを編集できます。対応形式：場所一覧・イベント案内・作品集。',credit:'ローカルホスト・ヒーローで作った作品'},
} as const;
export const escapeHtml=(value:string)=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const scriptJson=(value:unknown)=>JSON.stringify(value,null,2).replaceAll('&','\\u0026').replaceAll('<','\\u003c').replaceAll('>','\\u003e').replaceAll('\u2028','\\u2028').replaceAll('\u2029','\\u2029');

export const STUDIO_EXPORT_CSP="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; img-src data:; form-action 'none'; base-uri 'none'";
export const STUDIO_ACCENT_COLORS={sage:'#356553',ocean:'#285c80',amber:'#8a561d'} as const;
export const studioPortalCss=(style:ReleaseStyle)=>`.portal { width: ${style.width}; ${style.maxWidth?'max-width: '+style.maxWidth+';':''} box-sizing: ${style.boxSizing}; padding: ${style.padding}px; margin: ${style.margin??'0 auto'}; }`;
/** Shared export gate: the complete source map, a supported language and every release check. */
export function studioExportPreview(files:StudioSourceMap,language:StudioExportLanguage):ReleaseEvaluation['preview']{
 if(!studioSourceMapValid(files,true)||!Object.hasOwn(STUDIO_EXPORT_WORDS,language))throw Error('Invalid studio export source');
 const evaluation=evaluateRelease(files,true);if(!evaluation.passed)throw Error('Studio files must pass all checks before export');
 return evaluation.preview;
}
/** Generated markup only (never player text): replaces the CSP and appends to the head and body. */
export type StudioHtmlExtras={csp:string;head:string;tail:string};

/** Compile supported fields to a readable portable app. Player HTML/CSS is never executed. */
export function buildStudioExport(files:StudioSourceMap,language:StudioExportLanguage,appId?:string):string{
 return buildStudioAppHtml(files,language,appId);
}
/** The portable app; extras (installable variant) leave the app markup and script unchanged. */
export function buildStudioAppHtml(files:StudioSourceMap,language:StudioExportLanguage,appId?:string,extras?:StudioHtmlExtras):string{
 const {title,product,style}=studioExportPreview(files,language),w=STUDIO_EXPORT_WORDS[language];
 // The game passes the immutable first-release identity, so edits retain this app's inquiries.
 const identity=appId??releaseHash({'app-title':title});if(!/^[a-f0-9]{16}$/.test(identity))throw Error('Invalid studio app identity');
 const color=STUDIO_ACCENT_COLORS[product.accent];
 const data={title,product,storageKey:'codeshift-app-'+identity,words:w};
 return `<!doctype html>
<html lang="${language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${extras?.csp??STUDIO_EXPORT_CSP}">
<meta name="generator" content="${GAME_BRAND} ${GAME_VERSION_LABEL}">
<title>${escapeHtml(title)}</title>${extras?.head??''}
<!-- This is a standalone file. Edit this CSS and the app-data/JavaScript below. -->
<style>
:root { color-scheme: light; font-family: system-ui, sans-serif; color: #24332d; background: #f6f4ee; --accent: ${color}; }
* { box-sizing: border-box; } body { margin: 0; } input, select, textarea, button { font: inherit; }
${studioPortalCss(style)}
h1 { overflow-wrap: anywhere; color: var(--accent); } p { line-height: 1.6; overflow-wrap: anywhere; }
.filters, form { display: flex; flex-wrap: wrap; gap: 1rem; align-items: end; } label { display: grid; gap: .4rem; flex: 1 1 12rem; min-width: 0; }
input, select, textarea { width: 100%; min-height: 2.8rem; padding: .6rem; border: 1px solid #9baaa2; border-radius: .4rem; background: white; color: #24332d; }
button { min-height: 2.8rem; border: 0; padding: .7rem 1rem; background: var(--accent); color: white; border-radius: .4rem; cursor: pointer; }
:focus-visible { outline: 3px solid #af6726; outline-offset: 3px; }
ul { list-style: none; padding: 0; display: ${product.layout==='cards'?'grid':'block'}; ${product.layout==='cards'?'grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));':''} gap: 1rem; }
li { background: white; border: 1px solid #d3ddd6; border-radius: .5rem; padding: 1rem; margin-block: .6rem; overflow-wrap: anywhere; }
li p { margin: .4rem 0; } small { color: #52635b; } section { margin-block: 2rem; } .note { padding: 1rem; border-left: 3px solid var(--accent); } textarea { min-height: 6rem; }
@media (prefers-reduced-motion: no-preference) { button { transition: filter 120ms ease-out; } button:active { filter: brightness(.85); } }
</style>
</head>
<body>
<main class="portal">
<header><h1>${escapeHtml(title)}</h1><p>${escapeHtml(product.description)}</p></header>
<div class="filters"><label>${escapeHtml(w.search)}<input id="search" type="search" maxlength="120"></label><label>${escapeHtml(w.category)}<select id="category"><option value="">${escapeHtml(w.all)}</option></select></label></div>
<p id="count" role="status"></p><ul id="items"></ul><p id="empty" hidden>${escapeHtml(w.empty)}</p>
<section><h2>${escapeHtml(w.inquiry)}</h2><p class="note">${escapeHtml(w.local)}</p>
<form id="inquiry"><label>${escapeHtml(w.item)}<select id="item"><option value="">${escapeHtml(w.project)}</option></select></label><label>${escapeHtml(w.message)}<textarea id="message" maxlength="1000" required></textarea></label><button type="submit">${escapeHtml(w.save)}</button></form>
<p id="status" role="status" aria-live="polite"></p><h3>${escapeHtml(w.requests)}</h3><ol id="requests"></ol></section>
<footer><p>${escapeHtml(w.source)}</p><p><small>${escapeHtml(w.credit)} · ${escapeHtml(GAME_NAME[language])}</small></p></footer>
</main>
<!-- Readable content: all player fields are JSON text, never executable markup. -->
<script id="app-data" type="application/json">${scriptJson(data)}</script>
<script>
'use strict';
// Search, filters and local inquiries run entirely in this file. No network or eval.
const app = JSON.parse(document.getElementById('app-data').textContent);
const byId = id => document.getElementById(id);
const words = app.words;
const items = app.product.items;
const category = byId('category');
const itemChoice = byId('item');
for (const name of [...new Set(items.map(item => item.category).filter(Boolean))]) {
  const option = document.createElement('option'); option.value = name; option.textContent = name; category.append(option);
}
for (const item of items) {
  const option = document.createElement('option'); option.value = item.name; option.textContent = item.name; itemChoice.append(option);
}
function renderItems() {
  const query = byId('search').value.trim().slice(0, 120).toLocaleLowerCase();
  const visible = items.filter(item => (!category.value || item.category === category.value) && (!query || [item.name, item.detail, item.category].some(value => value.toLocaleLowerCase().includes(query))));
  byId('items').replaceChildren();
  for (const item of visible) {
    const row = document.createElement('li');
    const name = document.createElement('strong'); name.textContent = item.name;
    const detail = document.createElement('p'); detail.textContent = item.detail;
    const tag = document.createElement('small'); tag.textContent = item.category;
    row.append(name, detail, tag); byId('items').append(row);
  }
  byId('count').textContent = visible.length + ' / ' + items.length;
  byId('empty').hidden = visible.length !== 0;
}
byId('search').addEventListener('input', renderItems); category.addEventListener('change', renderItems); renderItems();
let requests = [];
let storageReady = true;
// JSON may escape each UTF-16 unit as six characters; this cap covers all 50 valid rows.
const MAX_STORED_CHARS = 400000;
function validRequests(value) {
  return Array.isArray(value) && value.length <= 50 && value.every(row => row && typeof row === 'object' && !Array.isArray(row) && Object.keys(row).length === 3 && typeof row.item === 'string' && Array.from(row.item).length <= 80 && typeof row.message === 'string' && row.message.trim().length > 0 && row.message.length <= 1000 && !/[\\x00-\\x08\\x0b\\x0c\\x0e-\\x1f\\x7f]/.test(row.message + row.item) && typeof row.date === 'string' && /^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$/.test(row.date) && Number.isFinite(Date.parse(row.date)));
}
function renderRequests() {
  byId('requests').replaceChildren();
  for (const request of requests) {
    const row = document.createElement('li');
    row.textContent = (request.item ? request.item + ' · ' : '') + request.message + ' · ' + new Date(request.date).toLocaleString(document.documentElement.lang);
    byId('requests').append(row);
  }
}
try {
  const raw = localStorage.getItem(app.storageKey);
  if (raw !== null) {
    if (raw.length > MAX_STORED_CHARS) throw new Error('corrupt');
    let value; try { value = JSON.parse(raw); } catch { throw new Error('corrupt'); }
    if (!validRequests(value)) throw new Error('corrupt'); requests = value;
  }
} catch (error) {
  storageReady = false; byId('status').textContent = error.message === 'corrupt' ? words.corrupt : words.unavailable;
}
renderRequests();
byId('inquiry').addEventListener('submit', event => {
  event.preventDefault();
  const message = byId('message').value.trim();
  const request = { item: itemChoice.value, message, date: new Date().toISOString() };
  if (!validRequests([request]) || (request.item && !items.some(item => item.name === request.item))) { byId('status').textContent = words.invalid; return; }
  if (!storageReady) { byId('status').textContent = words.unavailable; return; }
  if (requests.length >= 50) { byId('status').textContent = words.limit; return; }
  const next = [request, ...requests];
  const serialized = JSON.stringify(next);
  if (serialized.length > MAX_STORED_CHARS) { byId('status').textContent = words.limit; return; }
  try { localStorage.setItem(app.storageKey, serialized); }
  catch { byId('status').textContent = words.unavailable; return; }
  requests = next; byId('message').value = ''; byId('status').textContent = words.saved; renderRequests();
});
</script>${extras?.tail??''}
</body>
</html>\n`;
}

export const STUDIO_EXPORT_NAME='my-neighborhood-app';
const README={
 ko:['# 내 동네 앱','','로컬호스트 히어로에서 직접 만들고 배포한 앱입니다.','','## 파일','- `my-neighborhood-app.html` — 더블클릭하면 브라우저에서 바로 열리는 한 파일짜리 앱입니다. 검색·분류와 이 브라우저 안의 문의 보관이 동작합니다.','- `source/index.html`, `source/style.css`, `source/project.json`, `source/server.json` — 게임에서 직접 고친 원본 파일입니다.','- `project.json` — 내보낸 작품 정보입니다.','','## 이어서 고치기','`my-neighborhood-app.html`을 텍스트 편집기로 열면 CSS, app-data, JavaScript를 바로 고칠 수 있어요.','','게임 속 서버·배포는 가상이었고, 이 파일은 인터넷에 올라가 있지 않습니다.',''],
 en:['# My neighborhood app','','The app you built and released in Localhost Hero.','','## Files','- `my-neighborhood-app.html` — a single-file app. Double-click it to open it in a browser. Search, categories and browser-local inquiries work.','- `source/index.html`, `source/style.css`, `source/project.json`, `source/server.json` — the original files you edited in the game.','- `project.json` — information about this export.','','## Keep editing','Open `my-neighborhood-app.html` in a text editor to change its CSS, app-data and JavaScript.','','The servers and deployment in the game were virtual. This file is not online.',''],
 ja:['# わたしの街のアプリ','','ローカルホスト・ヒーローで作って公開したアプリです。','','## ファイル','- `my-neighborhood-app.html` — ダブルクリックでブラウザに開ける1ファイルのアプリです。検索・分類とブラウザ内の問い合わせ保存が動きます。','- `source/index.html`、`source/style.css`、`source/project.json`、`source/server.json` — ゲームで直した元のファイルです。','- `project.json` — 書き出した作品の情報です。','','## 続けて編集する','`my-neighborhood-app.html`をテキストエディターで開くと、CSS、app-data、JavaScriptを編集できます。','','ゲーム内のサーバー・公開は仮想のものでした。このファイルはインターネットに公開されていません。',''],
} as const;

/** Original sources, the portable app, project info and a README, bundled as a ZIP. */
export function buildStudioArchive(files:StudioSourceMap,language:StudioExportLanguage,appId?:string):Uint8Array{
 const html=buildStudioExport(files,language,appId),title=evaluateRelease(files,true).preview.title;
 const project={name:STUDIO_EXPORT_NAME,title,language,generator:`${GAME_BRAND} ${GAME_VERSION_LABEL}`,entry:`${STUDIO_EXPORT_NAME}.html`,source:STUDIO_FILE_NAMES.map(name=>'source/'+name)};
 return buildZip([
  {name:`${STUDIO_EXPORT_NAME}.html`,content:html},
  ...STUDIO_FILE_NAMES.map(name=>({name:'source/'+name,content:files[name]})),
  {name:'project.json',content:JSON.stringify(project,null,2)+'\n'},
  {name:'README.md',content:README[language].join('\n')},
 ]);
}

type WorkHost=Parameters<typeof studioFresh>[0]&Parameters<typeof releasePublishedFresh>[0];
/** The newest checked work: a passing studio draft, otherwise the released 1.0.0 files. */
export function exportableWork(state:WorkHost):{files:StudioSourceMap;appId:string}|null{
 const published=state.gameplay.career.release.published;if(!published)return null;
 const appId=state.gameplay.career.studio?.appId??published.hash;
 const files=studioFresh(state)?studioFiles(state):releasePublishedFresh(state)?releaseFiles(state):null;
 return files&&studioSourceMapValid(files,true)&&evaluateRelease(files,true).passed?{files,appId}:null;
}
