import type {Files,GameState} from './engine.ts';
import {translate,type Language} from './translations.ts';
import {GAME_BRAND,GAME_NAME,GAME_VERSION_LABEL} from './brand.ts';
import {buildZip} from './zip.ts';

export const CAFE_EXPORT_NAME='my-mono-cafe';
const MAX_SOURCE=60000;
const WORDS={
 ko:{credit:'로컬호스트 히어로에서 직접 고친 모노 카페 웹사이트',cart:'주문 합계',empty:'담은 메뉴가 없어요.',reset:'비우기',untitled:'모노 카페',readme:'# 내 모노 카페 웹사이트\n\n로컬호스트 히어로에서 직접 고친 카페 웹사이트입니다.\n\n## 파일\n- `my-mono-cafe.html` — 더블클릭하면 브라우저에서 바로 열리는 한 파일짜리 사이트입니다. 메뉴의 담기 버튼으로 합계를 확인할 수 있어요.\n- `source/index.html` — 내가 고친 HTML 원본입니다. 같은 폴더의 `style.css`를 불러옵니다.\n- `source/style.css` — 내가 고친 CSS 원본입니다.\n- `source/app.js` — 내가 고친 주문 합계 계산 함수입니다. 사이트에는 연결되어 있지 않아요.\n- `project.json` — 내보낸 작품 정보입니다.\n\n## 이어서 고치기\n텍스트 편집기(메모장, VS Code 등)로 `source` 폴더의 파일을 열어 수정하고, `source/index.html`을 브라우저로 열어 확인하세요.\n\n게임 속 서버·Git·배포는 가상이었고, 이 파일은 인터넷에 올라가 있지 않습니다.\n'},
 en:{credit:'The Mono Cafe website you repaired in Localhost Hero',cart:'Order total',empty:'Nothing added yet.',reset:'Clear',untitled:'Mono Cafe',readme:'# My Mono Cafe website\n\nThe cafe website you repaired in Localhost Hero.\n\n## Files\n- `my-mono-cafe.html` — a single-file site. Double-click it to open it in a browser. Use the menu buttons to check the order total.\n- `source/index.html` — your HTML source. It loads `style.css` from the same folder.\n- `source/style.css` — your CSS source.\n- `source/app.js` — the order-total function you fixed. It is not connected to the site.\n- `project.json` — information about this export.\n\n## Keep editing\nOpen the files in `source` with any text editor (Notepad, VS Code…), then open `source/index.html` in a browser to check your changes.\n\nThe servers, Git and deployment in the game were virtual. This file is not online.\n'},
 ja:{credit:'ローカルホスト・ヒーローで直したモノカフェのWebサイト',cart:'注文の合計',empty:'まだ何も追加していません。',reset:'空にする',untitled:'モノカフェ',readme:'# わたしのモノカフェWebサイト\n\nローカルホスト・ヒーローで直したカフェのWebサイトです。\n\n## ファイル\n- `my-mono-cafe.html` — ダブルクリックでブラウザに開ける1ファイルのサイトです。メニューのボタンで合計を確認できます。\n- `source/index.html` — 自分で直したHTMLです。同じフォルダーの`style.css`を読み込みます。\n- `source/style.css` — 自分で直したCSSです。\n- `source/app.js` — 自分で直した合計計算の関数です。サイトにはつながっていません。\n- `project.json` — 書き出した作品の情報です。\n\n## 続けて編集する\n`source`フォルダーのファイルをテキストエディター（メモ帳、VS Codeなど）で開いて編集し、`source/index.html`をブラウザで開いて確認しましょう。\n\nゲーム内のサーバー・Git・公開は仮想のものでした。このファイルはインターネットに公開されていません。\n'},
} as const;

const escapeHtml=(value:string)=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const decodeText=(value:string)=>value.replace(/<[^>]*>/g,'').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&amp;','&').replace(/\s+/g,' ').trim();

/** The cafe the neighborhood sees: the last deployed snapshot, once at least one job shipped. */
export function cafeExportFiles(state:Pick<GameState,'completed'|'repo'>):Files|null{
 const files=state.completed.length?state.repo?.deployed.files:undefined;
 return files&&typeof files['index.html']==='string'&&typeof files['style.css']==='string'?files:null;
}

export function cafeTitle(files:Files,language:Language):string{
 const match=/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(files['index.html']??'');
 const title=match?decodeText(match[1]).slice(0,120):'';
 return title?translate(title,language):WORDS[language].untitled;
}

/**
 * Static markup only: active elements, handlers and URLs are removed, and the CSP blocks
 * anything left. Player code is never executed; only the game's own nonce script runs.
 */
function staticMarkup(html:string,language:Language):string{
 const stripped=html
  .replace(/<(script|style|iframe|object|embed|template|noscript|textarea|title)\b[\s\S]*?<\/\1\s*>/gi,'')
  .replace(/<\/?(?:script|style|iframe|object|embed|link|meta|base|form|frame|frameset|applet|svg|math|video|audio|source|template|noscript)\b[^>]*>/gi,'')
  .replace(/\s(?:on[a-z]+|src|srcset|href|action|formaction|xlink:href)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,'');
 return language==='ko'?stripped:stripped.replace(/>([^<>]+)</g,(whole,text:string)=>text.trim()?'>'+escapeHtml(translate(decodeText(text),language))+'<':whole);
}

function nonce():string{
 const bytes=new Uint8Array(16);globalThis.crypto.getRandomValues(bytes);
 return Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('');
}

function validSource(files:Files):void{
 for(const name of ['index.html','style.css'])if(typeof files[name]!=='string'||files[name].length>MAX_SOURCE||files[name].includes('\0'))throw Error('Invalid cafe export source');
}

/** One portable HTML file: the deployed cafe page, its stylesheet and a small order total. */
export function buildCafeExport(files:Files,language:Language):string{
 validSource(files);if(!Object.hasOwn(WORDS,language))throw Error('Invalid cafe export language');
 const w=WORDS[language],key=nonce(),title=cafeTitle(files,language);
 const css=files['style.css'].replace(/<\/style/gi,'<\\/style');
 return `<!doctype html>
<html lang="${language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${key}'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'">
<meta name="generator" content="${GAME_BRAND} ${GAME_VERSION_LABEL}">
<title>${escapeHtml(title)} · ${escapeHtml(GAME_NAME[language])}</title>
<!-- ${escapeHtml(w.credit)}. Edit the CSS below or the page markup in <body>. -->
<style>
${css}
</style>
</head>
<body>
${staticMarkup(files['index.html'],language)}
<aside id="lh-cart" aria-live="polite" style="position:sticky;bottom:0;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:center;padding:12px 16px;background:#24332dee;color:#fff;font:14px/1.5 system-ui,sans-serif"><strong>${escapeHtml(w.cart)}</strong><span id="lh-cart-lines">${escapeHtml(w.empty)}</span><b id="lh-cart-total">0</b><button id="lh-cart-reset" type="button" style="min-height:36px;padding:0 14px;border:1px solid #fff8;border-radius:6px;background:transparent;color:inherit;font:inherit;cursor:pointer">${escapeHtml(w.reset)}</button></aside>
<p style="margin:0;padding:10px 16px 18px;text-align:center;font:12px/1.5 system-ui,sans-serif;color:#6d786c">${escapeHtml(w.credit)} · ${escapeHtml(GAME_NAME[language])}</p>
<script nonce="${key}">
'use strict';
// Order total written by the game: price × quantity, read from each menu card's price text.
(() => {
  const empty = ${JSON.stringify(w.empty)};
  const lines = new Map();
  const format = value => value.toLocaleString(document.documentElement.lang);
  const render = () => {
    let total = 0;
    const parts = [];
    for (const [name, line] of lines) { total += line.price * line.quantity; parts.push(name + ' × ' + line.quantity); }
    document.getElementById('lh-cart-lines').textContent = parts.length ? parts.join(', ') : empty;
    document.getElementById('lh-cart-total').textContent = format(total);
  };
  document.querySelectorAll('.order-button').forEach(button => {
    button.addEventListener('click', () => {
      const card = button.closest('article') || button.parentElement;
      const name = (card.querySelector('h2, h3') || {}).textContent || '?';
      const price = Number(((card.querySelector('strong') || {}).textContent || '').replace(/[^0-9]/g, '')) || 0;
      const line = lines.get(name) || { price, quantity: 0 };
      line.quantity = Math.min(99, line.quantity + 1); lines.set(name, line); render();
    });
  });
  document.getElementById('lh-cart-reset').addEventListener('click', () => { lines.clear(); render(); });
})();
</script>
</body>
</html>
`;
}

/** Full document wrapper so the raw source opens with its stylesheet. */
function sourceIndex(files:Files,language:Language):string{
 return `<!doctype html>
<html lang="${language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(cafeTitle(files,language))}</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
${files['index.html']}
</body>
</html>
`;
}

/** ZIP with the portable page, the player's original sources, project info and a README. */
export function buildCafeArchive(files:Files,language:Language):Uint8Array{
 const html=buildCafeExport(files,language),title=cafeTitle(files,language);
 const project={name:CAFE_EXPORT_NAME,title,language,generator:`${GAME_BRAND} ${GAME_VERSION_LABEL}`,entry:`${CAFE_EXPORT_NAME}.html`,source:['source/index.html','source/style.css',...(typeof files['app.js']==='string'?['source/app.js']:[])]};
 return buildZip([
  {name:`${CAFE_EXPORT_NAME}.html`,content:html},
  {name:'source/index.html',content:sourceIndex(files,language)},
  {name:'source/style.css',content:files['style.css']},
  ...(typeof files['app.js']==='string'?[{name:'source/app.js',content:files['app.js']}]:[]),
  {name:'project.json',content:JSON.stringify(project,null,2)+'\n'},
  {name:'README.md',content:WORDS[language].readme},
 ]);
}
