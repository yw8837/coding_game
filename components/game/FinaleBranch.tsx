'use client';
import {useEffect,useId,useRef,useState,type KeyboardEvent} from 'react';
import {AppWindow,BookOpen,Check,ChevronDown,Download,FastForward,Globe,Package,RotateCcw,Search,Sparkles} from 'lucide-react';
import {useLanguage} from '@/lib/game/i18n';
import {desktopBridge} from '@/lib/game/platform';
import {evaluateRelease,releaseFiles} from '@/lib/game/release';
import {buildStudioExport} from '@/lib/game/studio-export';
import {buildPwaArchive,buildStaticSiteExport,finaleExportName} from '@/lib/game/finale-export';
import {exportAllowed,FINALE_BRANCHES,FINALE_COPY,FINALE_EXPORTS,finaleUnlocked,type FinaleBranch as Branch,type FinaleExport} from '@/lib/game/finale';
import type {GameProps} from './types';

type SaveResult={ok:boolean;canceled?:boolean;error?:string};
const reducedMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.gameReducedMotion==='true';
/** Browser fallback, same as the studio export: a temporary object URL revoked after 10 seconds. */
function download(part:BlobPart,type:string,name:string):SaveResult{
 const url=URL.createObjectURL(new Blob([part],{type})),link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
 return {ok:true};
}

export function FinaleBranch({props}:{props:GameProps}){
 const {state,onAction}=props,lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[lang];
 const branch=state.gameplay.finale?.branch??null,done=state.gameplay.finale?.exports??[];
 const uid=useId(),cards=useRef<Partial<Record<Branch,HTMLDivElement|null>>>({}),epilogueRef=useRef<HTMLElement>(null),busyRef=useRef(false);
 // A branch already chosen in an earlier session is shown in full; a new choice plays its epilogue.
 const [reveal,setReveal]=useState(()=>({key:branch,count:Number.MAX_SAFE_INTEGER}));
 const [busy,setBusy]=useState<FinaleExport|null>(null),[status,setStatus]=useState<{tone:'ok'|'error';text:string;name?:string}|null>(null);
 const paragraphs=branch?FINALE_COPY[branch].epilogue.map(paragraph=>Array.from(paragraph[lang])):[];
 const offsets=paragraphs.map((_,index)=>paragraphs.slice(0,index).reduce((sum,chars)=>sum+chars.length,0));
 const total=paragraphs.reduce((sum,chars)=>sum+chars.length,0),count=reveal.key===branch?Math.min(reveal.count,total):0,typing=!!branch&&count<total;
 const pause=count>0&&/[.。!?！？]/.test(paragraphs.flat()[count-1]??'');
 useEffect(()=>{
  if(!typing)return;
  const reduce=reducedMotion(),step=Math.max(1,Math.round(total/180));
  const timer=window.setTimeout(()=>setReveal({key:branch,count:reduce?total:count+step}),reduce?0:count===0?420:pause?380:28);
  return()=>window.clearTimeout(timer);
 },[typing,branch,count,total,pause]);
 if(!finaleUnlocked(state))return null;

 const choose=(next:Branch)=>{
  if(next===branch)return;
  onAction({type:'finale-choose',branch:next});setStatus(null);
  requestAnimationFrame(()=>epilogueRef.current?.scrollIntoView({block:'nearest',behavior:reducedMotion()?'auto':'smooth'}));
 };
 const onCardKey=(event:KeyboardEvent<HTMLDivElement>,id:Branch)=>{
  if(event.key===' '||event.key==='Enter'){event.preventDefault();choose(id);return;}
  const move=event.key==='ArrowRight'||event.key==='ArrowDown'?1:event.key==='ArrowLeft'||event.key==='ArrowUp'?-1:0;if(!move)return;
  event.preventDefault();const next=FINALE_BRANCHES[(FINALE_BRANCHES.indexOf(id)+move+FINALE_BRANCHES.length)%FINALE_BRANCHES.length];choose(next);cards.current[next]?.focus();
 };
 const save=async(kind:FinaleExport)=>{
  const published=state.gameplay.career.release.published;
  if(busyRef.current||!published||!exportAllowed(branch,kind))return;busyRef.current=true;setBusy(kind);setStatus(null);
  try{
   const files=releaseFiles(state),name=finaleExportName(kind,evaluateRelease(files).preview.title),bridge=desktopBridge();
   let result:SaveResult;
   if(kind==='pwa'){
    const data=buildPwaArchive(files,lang,published.hash);
    result=bridge?.exportArchive?await bridge.exportArchive(data,name):download(new Uint8Array(data),'application/zip',name);
   }else{
    const html=kind==='web'?buildStaticSiteExport(files,lang):buildStudioExport(files,lang,published.hash);
    result=bridge?await bridge.exportApp(html,name):download(html,'text/html;charset=utf-8',name);
   }
   if(result.ok){
    onAction({type:'finale-export',kind});
    const savedToDisk=!!bridge&&(kind!=='pwa'||!!bridge.exportArchive);
    setStatus({tone:'ok',name,text:kind==='pwa'
     ?savedToDisk?tr('저장했어요 · 압축을 풀고 index.html을 더블클릭해 열어 보세요','Saved · unzip it and double-click index.html to open it','保存しました · 展開してindex.htmlをダブルクリックして開いてみてください'):tr('다운로드를 시작했어요 · 압축을 풀고 index.html을 더블클릭해 열어 보세요','Download started · unzip it and double-click index.html to open it','ダウンロードを開始しました · 展開してindex.htmlをダブルクリックして開いてみてください')
     :savedToDisk?tr('저장했어요 · 파일을 더블클릭해 열어 보세요','Saved · double-click the file to open it','保存しました · ファイルをダブルクリックして開いてみてください'):tr('다운로드를 시작했어요 · 받은 파일을 더블클릭해 열어 보세요','Download started · double-click the file to open it','ダウンロードを開始しました · ファイルをダブルクリックして開いてみてください')});
   }else setStatus({tone:'error',text:result.canceled?tr('저장을 취소했어요. 언제든 다시 받을 수 있어요.','Save canceled. You can grab it again any time.','保存を取り消しました。いつでももう一度受け取れます。'):tr('파일을 저장하지 못했어요. 다시 시도해 주세요.','The file couldn’t be saved. Please try again.','ファイルを保存できませんでした。もう一度試してください。')});
  }catch{setStatus({tone:'error',text:tr('파일을 만들지 못했어요. 배포한 파일이 모든 검사를 통과하는지 확인하고 다시 시도해 주세요.','Couldn’t build the file. Make sure your released files still pass every check, then try again.','ファイルを作れませんでした。公開したファイルがすべての検査に合格しているか確かめて、もう一度試してください。')});}
  finally{busyRef.current=false;setBusy(null);}
 };

 const kindLabel=(kind:FinaleExport)=>kind==='web'?tr('웹사이트 .html','Website .html','Webサイト .html'):kind==='webapp'?tr('웹앱 .html','Web app .html','Webアプリ .html'):tr('PWA 패키지 .zip','PWA package .zip','PWAパッケージ .zip');
 const exportButton=(kind:FinaleExport,primary:boolean,label:string)=><button className={primary?'primary-button':'outline-button'} data-testid={'finale-export-'+kind} disabled={busy!==null} onClick={()=>void save(kind)}>{kind==='pwa'?<Package size={16}/>:<Download size={16}/>}{busy===kind?tr('저장 중…','Saving…','保存中…'):label}</button>;
 const copy=branch?FINALE_COPY[branch]:null,active=typing?paragraphs.findIndex((chars,index)=>count<offsets[index]+chars.length):-1;
 return <section className="finale-branch" data-testid="finale-branch" data-no-translate aria-labelledby={uid+'-heading'}>
  <header className="finale-heading">
   <small><Sparkles size={13}/>{tr('5단계 · 피날레','STAGE 5 · FINALE','ステージ5 · フィナーレ')}</small>
   <h3 id={uid+'-heading'}><span>{tr('엔딩 갈래','Ending branch','エンディング分岐')}</span> · {tr('내 작품은 어떤 모습으로 세상에 나갈까?','What shape will your work take out in the world?','あなたの作品はどんな姿で世界に出ていく?')}</h3>
   <p>{tr('두 갈래 모두 서버 없이 동작하는 HTML 파일 한 개로 나와요. 백엔드가 없고, 당신이 직접 올리기 전까지는 아무것도 이 PC 밖으로 나가지 않아요.','Both branches come out as a single HTML file that runs without a server. There is no backend, and nothing leaves this PC until you upload it yourself.','どちらのルートも、サーバーなしで動くHTMLファイルひとつになります。バックエンドはなく、あなたが自分でアップロードするまで、何もこのPCの外には出ません。')}</p>
  </header>
  <div className="finale-choices" role="radiogroup" aria-labelledby={uid+'-heading'} data-chosen={branch??undefined}>
   {FINALE_BRANCHES.map(id=>{const item=FINALE_COPY[id],checked=branch===id;return <div key={id} ref={node=>{cards.current[id]=node;}} className="finale-card" data-branch={id} data-testid={'finale-choose-'+id} role="radio" aria-checked={checked} aria-labelledby={`${uid}-${id}-title`} aria-describedby={`${uid}-${id}-pitch`} tabIndex={(branch?checked:id===FINALE_BRANCHES[0])?0:-1} onClick={()=>choose(id)} onKeyDown={event=>onCardKey(event,id)}>
    <div className="finale-card-top">{id==='web'?<Globe size={16}/>:<AppWindow size={16}/>}<span>{item.label[lang]}</span><span className="finale-card-badge">{checked?<><Check size={12}/>{tr('선택됨','Chosen','選択中')}</>:tr('이 갈래 고르기','Choose this','このルートを選ぶ')}</span></div>
    {id==='web'?<div className="finale-mock finale-mock-site" aria-hidden="true"><span className="finale-mock-chrome"><i/><i/><i/><b/></span><span className="finale-mock-title"/><span className="finale-mock-line"/><span className="finale-mock-line short"/><span className="finale-mock-tiles"><i/><i/><i/></span></div>
     :<div className="finale-mock finale-mock-app" aria-hidden="true"><span className="finale-mock-appbar"><i/><b/></span><span className="finale-mock-search"><Search size={10}/>{tr('목록 검색','Search','一覧を検索')}</span><span className="finale-mock-chips"><i className="on"/><i/><i/></span><span className="finale-mock-row"><i/><b/></span><span className="finale-mock-row"><i/><b/></span><span className="finale-mock-fab"/></div>}
    <strong className="finale-card-title" id={`${uid}-${id}-title`}>{item.title[lang]}</strong>
    <p id={`${uid}-${id}-pitch`}>{item.pitch[lang]}</p>
    <ul>{item.features.map((feature,index)=><li key={index}><Check size={13}/>{feature[lang]}</li>)}</ul>
   </div>;})}
  </div>
  <p className="finale-switch-note">{branch?tr('언제든 다른 갈래도 볼 수 있어요.','You can look at the other branch any time.','いつでももう一方のルートも見られます。'):tr('카드를 골라 이야기의 마지막 장을 열어 보세요.','Pick a card to open the last chapter.','カードを選んで、物語の最後の章を開きましょう。')}</p>
  {branch&&copy&&<>
   <article className="finale-epilogue" data-branch={branch} data-testid="finale-epilogue" data-typing={typing} ref={epilogueRef} aria-labelledby={uid+'-epilogue'}>
    <header><Sparkles size={16}/><h4 id={uid+'-epilogue'}>{tr('에필로그','Epilogue','エピローグ')} · {copy.title[lang]}</h4>{typing?<button className="finale-text-button" data-testid="finale-epilogue-skip" onClick={()=>setReveal({key:branch,count:total})}><FastForward size={14}/>{tr('바로 보기','Show all','すぐ表示')}</button>:<button className="finale-text-button" data-testid="finale-epilogue-replay" onClick={()=>setReveal({key:branch,count:0})}><RotateCcw size={14}/>{tr('다시 보기','Replay','もう一度')}</button>}</header>
    <div className="finale-epilogue-text" aria-hidden="true">{paragraphs.map((chars,index)=>{const shown=Math.max(0,Math.min(chars.length,count-offsets[index]));return <p key={index}>{chars.slice(0,shown).join('')}{index===active&&<span className="finale-caret"/>}<span className="finale-epilogue-rest">{chars.slice(shown).join('')}</span></p>;})}</div>
    <div className="finale-sr">{paragraphs.map((chars,index)=><p key={index}>{chars.join('')}</p>)}</div>
   </article>
   <section className="finale-export" data-testid="finale-export" aria-labelledby={uid+'-export'}>
    <header><h4 id={uid+'-export'}>{tr('내 작품 가져가기','Take your work with you','作品を持ち帰る')}</h4>{done.length>0&&<ul className="finale-done" data-testid="finale-exports-done" aria-label={tr('받은 파일','Files you took','受け取ったファイル')}>{FINALE_EXPORTS.filter(kind=>done.includes(kind)).map(kind=><li key={kind}><Check size={12}/>{kindLabel(kind)}</li>)}</ul>}</header>
    <p>{branch==='web'?tr('HTML과 CSS만 담긴 파일 한 개예요. 자바스크립트도 서버도 없어서 어떤 브라우저에서든 바로 열려요.','A single file with only HTML and CSS. No JavaScript, no server: it opens in any browser.','HTMLとCSSだけのファイルひとつ。JavaScriptもサーバーもないので、どのブラウザーでもすぐ開けます。'):tr('검색·분류·문의 보관이 들어 있는 HTML 파일 한 개예요. 문의는 그 파일을 연 브라우저에만 남고 어디로도 전송되지 않아요.','A single HTML file with search, categories and an inquiry log. Inquiries stay in the browser that opened it and are never sent anywhere.','検索・分類・問い合わせ保存が入ったHTMLファイルひとつ。問い合わせは開いたブラウザーにだけ残り、どこにも送信されません。')}</p>
    <div className="finale-export-actions">{branch==='web'?exportButton('web',true,tr('내 웹사이트 받기 (.html)','Get my website (.html)','自分のWebサイトを受け取る (.html)')):<>{exportButton('webapp',true,tr('내 웹앱 받기 (.html)','Get my web app (.html)','自分のWebアプリを受け取る (.html)'))}{exportButton('pwa',false,tr('앱으로 설치 패키지 받기 (PWA .zip)','Get the installable app package (PWA .zip)','アプリとしてインストールするパッケージ (PWA .zip)'))}</>}</div>
    {branch==='webapp'&&<p className="finale-pwa-note">{tr('PWA로 설치하려면 HTTPS 주소(예: GitHub Pages)에 올려야 해요. 브라우저는 파일(file://)에서 서비스 워커를 실행하지 않아서, 더블클릭으로 열면 설치 없이 평범한 웹앱으로만 동작해요. 설치 메뉴의 이름이나 지원 여부는 브라우저마다 달라요.','To install it as a PWA you must host it on an HTTPS address (for example GitHub Pages). Browsers don’t run service workers from file://, so opened by double-click it works as a normal web app without installation. The install menu’s name and support vary by browser.','PWAとしてインストールするには、HTTPSのアドレス(例: GitHub Pages)で公開する必要があります。ブラウザーはfile://ではサービスワーカーを動かさないため、ダブルクリックで開くとインストールなしの普通のWebアプリとして動きます。インストールメニューの名前や対応はブラウザーによって違います。')}</p>}
    <p className="finale-status" role="status" data-testid="finale-export-status" data-tone={status?.tone}>{status&&<>{status.text}{status.name&&<code>{status.name}</code>}</>}</p>
    <details className="finale-guide" data-testid="finale-guide">
     <summary><BookOpen size={15}/>{tr('GitHub Pages로 공개하는 법','How to publish with GitHub Pages','GitHub Pagesで公開する方法')}<ChevronDown size={15}/></summary>
     <ol>
      <li>{tr('GitHub에 가입하고 공개(Public) 저장소를 새로 만들어요.','Sign up on GitHub and create a new public repository.','GitHubに登録して、公開(Public)リポジトリを新しく作ります。')}</li>
      <li>{tr('받은 .html 파일 이름을 index.html로 바꿔요. PWA 패키지라면 압축을 풀어 나온 파일을 모두 준비해요.','Rename the downloaded .html file to index.html. For the PWA package, unzip it and use every file inside.','受け取った.htmlファイルの名前をindex.htmlに変えます。PWAパッケージなら、展開して出てきたファイルをすべて使います。')}</li>
      <li>{tr('저장소에서 Add file › Upload files로 파일을 올리고 Commit changes를 눌러요.','In the repository, choose Add file › Upload files, then Commit changes.','リポジトリでAdd file › Upload filesからファイルを上げ、Commit changesを押します。')}</li>
      <li>{tr('Settings › Pages에서 Deploy from a branch를 고르고, main 브랜치와 / (root)를 선택해 Save를 눌러요.','In Settings › Pages, choose Deploy from a branch, select the main branch and / (root), then Save.','Settings › PagesでDeploy from a branchを選び、mainブランチと/ (root)を指定してSaveを押します。')}</li>
      <li>{tr('몇 분 뒤 https://아이디.github.io/저장소이름/ 주소가 생겨요. 그 링크를 공유하면 돼요.','After a few minutes it appears at https://your-name.github.io/repository-name/. Share that link.','数分後、https://ユーザー名.github.io/リポジトリ名/ のアドレスができます。そのリンクを共有すれば完了です。')}</li>
     </ol>
     <p>{tr('GitHub Pages 주소는 누구나 볼 수 있으니 개인 정보는 넣지 마세요. 웹앱의 문의 기록은 방문자 각자의 브라우저에만 남고 당신에게 전달되지 않아요. GitHub 화면의 메뉴 이름은 바뀔 수 있어요.','Anyone can see a GitHub Pages address, so keep personal information out. The web app’s inquiries stay in each visitor’s own browser and never reach you. GitHub’s menu names may change.','GitHub Pagesのアドレスは誰でも見られるので、個人情報は入れないでください。Webアプリの問い合わせは訪問者それぞれのブラウザーにだけ残り、あなたには届きません。GitHubのメニュー名は変わることがあります。')}</p>
    </details>
   </section>
  </>}
 </section>;
}
