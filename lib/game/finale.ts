import type {GameState} from './engine.ts';
import {releasePublishedFresh} from './release.ts';

/** Stage 5: after 1.0.0 is published, the player decides what form their creation
 * takes outside the game. Both branches are serverless single files; the optional
 * PWA package is the "app" flavor of the web-app branch. */
export type FinaleBranch='web'|'webapp';
export type FinaleExport='web'|'webapp'|'pwa';
export type FinaleProgress={branch:FinaleBranch|null;exports:FinaleExport[]};
export type FinaleAction={type:'finale-choose';branch:FinaleBranch}|{type:'finale-export';kind:FinaleExport};
export const FINALE_BRANCHES:readonly FinaleBranch[]=['web','webapp'];
export const FINALE_EXPORTS:readonly FinaleExport[]=['web','webapp','pwa'];
export function createFinale():FinaleProgress{return {branch:null,exports:[]};}
export function finaleUnlocked(s:GameState):boolean{return !!s.gameplay.career.release.published&&releasePublishedFresh(s);}
export function exportAllowed(branch:FinaleBranch|null,kind:FinaleExport):boolean{return branch==='web'?kind==='web':branch==='webapp'?kind!=='web':false;}
export function applyFinale(s:GameState,action:FinaleAction):GameState{
 if(!finaleUnlocked(s))return s;
 const finale=s.gameplay.finale??(s.gameplay.finale=createFinale());
 if(action.type==='finale-choose'){if(FINALE_BRANCHES.includes(action.branch))finale.branch=action.branch;return s;}
 if(FINALE_EXPORTS.includes(action.kind)&&exportAllowed(finale.branch,action.kind)&&!finale.exports.includes(action.kind))finale.exports.push(action.kind);
 return s;
}

type Copy={ko:string;en:string;ja:string};
const c=(ko:string,en:string,ja:string):Copy=>({ko,en,ja});
export const FINALE_COPY:Record<FinaleBranch,{label:Copy;title:Copy;pitch:Copy;features:Copy[];epilogue:Copy[]}>={
 web:{
  label:c('갈래 A · 웹','Branch A · Web','ルートA · Web'),
  title:c('동네의 첫 페이지','The neighborhood’s first page','まちの最初のページ'),
  pitch:c('누구나 링크 하나로 보는 정적 웹사이트. 자바스크립트 없이 HTML과 CSS만으로 가볍고 튼튼해요.','A static website anyone can open from a link. Pure HTML and CSS, with no JavaScript: light and sturdy.','誰でもリンクひとつで見られる静的Webサイト。JavaScriptなし、HTMLとCSSだけで軽くて丈夫です。'),
  features:[c('더블클릭하면 브라우저에서 바로 열려요','Double-click to open it in any browser','ダブルクリックでブラウザーですぐ開きます'),c('GitHub Pages에 index.html로 올리면 바로 공개돼요','Upload it as index.html to GitHub Pages to publish','GitHub Pagesにindex.htmlとして上げればすぐ公開'),c('서버도 계정도 필요 없어요','No server, no account','サーバーもアカウントも不要')],
  epilogue:[c('당신의 페이지 링크는 동네 단톡방을 타고 퍼졌어요. 지우는 계산대 옆에 QR코드를 붙였고, 해나는 빵 봉투에 주소를 찍었죠.','Your page’s link spread through the neighborhood group chat. Jiwoo taped a QR code by the till, and Hana stamped the address on her bread bags.','あなたのページのリンクは、まちのグループチャットで広まりました。ジウはレジの横にQRコードを貼り、ハナはパンの袋にアドレスを印刷しました。'),c('서버 한 대 없이도 페이지는 매일 열려요. 가장 단순한 웹이 가장 오래 남는다는 걸, 당신은 첫 작품으로 증명했어요.','It opens every day without a single server. With your first creation you proved that the simplest web lasts the longest.','サーバーが一台もなくても、ページは毎日開かれています。いちばんシンプルなWebがいちばん長く残ることを、あなたは最初の作品で証明しました。')]},
 webapp:{
  label:c('갈래 B · 웹앱','Branch B · Web app','ルートB · Webアプリ'),
  title:c('매일 여는 작은 도구','A small tool opened every day','毎日開く小さな道具'),
  pitch:c('검색·분류·문의 기록이 브라우저(localStorage)에 저장되는 오프라인 웹앱. 원하면 "앱으로 설치" 패키지(PWA)도 받을 수 있어요.','An offline web app whose search, categories and inquiry log live in the browser (localStorage). Optionally grab an installable app package (PWA).','検索・分類・問い合わせ記録がブラウザー(localStorage)に保存されるオフラインWebアプリ。希望すれば「アプリとしてインストール」パッケージ(PWA)も。'),
  features:[c('파일 하나로 인터넷 없이 동작해요','One file that works without the internet','ファイルひとつでネットなしで動きます'),c('입력한 기록은 그 브라우저에 계속 남아요','What you enter stays in that browser','入力した記録はそのブラウザーに残ります'),c('PWA 패키지를 HTTPS로 올리면 홈 화면에 설치돼요','Host the PWA package over HTTPS to install it','PWAパッケージをHTTPSで公開するとホーム画面にインストールできます')],
  epilogue:[c('해나는 매일 아침 당신의 앱을 열어 오늘의 할 일을 적어요. 루나는 동아리 회의 때마다 검색창을 띄우고, 준은 도서관 컴퓨터 바탕화면에 앱 아이콘을 만들었어요.','Every morning Hana opens your app to jot down the day’s tasks. Luna pulls up its search at every club meeting, and Jun put its icon on the library computer’s desktop.','ハナは毎朝あなたのアプリを開いて今日の用事を書きます。ルナはクラブの会議のたびに検索を開き、ジュンは図書館のPCのデスクトップにアイコンを作りました。'),c('서버도 계정도 없지만, 각자의 브라우저 안에서 당신의 코드는 오늘도 조용히 일하고 있어요. 진짜 개발자의 첫 제품이에요.','No server, no accounts — yet inside each browser your code quietly goes to work every day. A real developer’s first product.','サーバーもアカウントもないけれど、それぞれのブラウザーの中であなたのコードは今日も静かに働いています。本物の開発者の最初のプロダクトです。')]},
};
