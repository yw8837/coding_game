'use client';
import {localizeUI,useLanguage} from '@/lib/game/i18n';
import {useEffect,useRef,useState} from 'react';
import {Check,Coffee,PartyPopper,Trophy,Download} from 'lucide-react';
import {CampaignGoal} from './CampaignGoal';
import {CafeScene} from './CafeScene';
import {CHAPTERS} from '@/lib/game/story';
import {cafeExportFiles,buildCafeExport} from '@/lib/game/cafe-export';
import {desktopBridge} from '@/lib/game/platform';
import type {GameProps} from './types';

export function OpeningEnding({state,onAction,onOpen,onNavigate,onFollow,edition}:GameProps){
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[lang];
 const opened=state.gameplay.openingCelebrated;
 const [burst,setBurst]=useState(false),[exported,setExported]=useState('');
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{root.current?.closest('.app-surface')?.scrollTo(0,0);},[opened]);
 useEffect(()=>{if(!burst)return;const timer=setTimeout(()=>setBurst(false),2800);return()=>clearTimeout(timer);},[burst]);
 const exportSite=async()=>{
  const files=cafeExportFiles(state);
  if(!files)return;
  try{
   const html=buildCafeExport(files,lang),bridge=desktopBridge();
   if(bridge){
    const res=await bridge.exportApp(html,'my-mono-cafe.html');
    if(res.ok)setExported(tr('HTML 파일을 저장했습니다! 브라우저에서 열어보세요.','Saved HTML file! Open it in your browser.','HTMLファイルを保存しました！ブラウザで開けます。'));
   }else{
    const blob=new Blob([html],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='my-mono-cafe.html';document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),10000);
    setExported(tr('HTML 다운로드를 시작했습니다!','HTML download started!','HTMLのダウンロードを開始しました！'));
   }
  }catch{setExported(tr('파일 내보내기에 실패했습니다.','Export failed.','ファイルの書き出しに失敗しました。'));}
 };
 return localizeUI(<div ref={root} className={'opening-ending '+(opened?'celebrated':'')}>
  {burst&&<div className="opening-confetti" aria-hidden="true">{Array.from({length:22},(_,i)=><i key={i} style={{left:(i*47%100)+'%',animationDelay:(i%5)*.09+'s',background:['#f4bf78','#72e4bf','#d0b0ef'][i%3]}}/>)}</div>}
  <span className="eyebrow-text">{opened?tr('첫 이야기 완료 · 동네 해결사','Introduction complete · Neighborhood helper','最初の物語完了 · 街の助っ人'):tr('카페 이야기 · 오픈 초대장','Cafe story · Opening invitation','カフェの物語 · 開店への招待')}</span><h1>{opened?'모노 카페가 문을 열었습니다.':'오픈 준비가 끝났어요.'}</h1><p>{opened?'메뉴판, 계산대, 주문함. 세 의뢰를 모두 해결했어요.':'메뉴판, 계산대, 주문함이 모두 준비됐어요. 지우와 민서가 기다리고 있어요.'}</p>
  <CafeScene completed={state.completed} opened={opened}/>
  {!opened?<><blockquote>지우: “혼자였다면 시작도 못 했을 거예요.<br/>우리 카페의 첫 오픈, 당신이 해 주실래요?”</blockquote><button className="primary-button opening-button" onClick={()=>{setBurst(true);onAction({type:'celebrate-opening'});}}><PartyPopper size={21}/>OPEN 간판 켜기</button><small>{edition==='demo'?tr('OPEN을 켜면 데모의 첫 새 고객 의뢰가 열려요.','Turn on OPEN to unlock the demo’s first new client case.','OPENを点けるとデモの最初の新しい顧客の依頼が届きます。'):tr('OPEN을 켜면 새로운 고객의 의뢰가 열려요.','Turn on OPEN to unlock jobs from new clients.','OPENを点けると新しい顧客の依頼が届きます。')}</small></>:<>
   <div className="ending-dialogue" aria-live="polite"><p><b>첫 손님</b>“메뉴가 잘 보이네요. 커피 두 잔, 9,000원 맞죠?”</p><p><b>지우</b>“네! 주문도 잘 들어왔어요. 따뜻하게 내려 드릴게요.”</p><p><b>민서</b>“처음엔 몰라도 괜찮았지? 보고, 바꾸고, 다시 해보면 돼.”</p></div>
   <div className="ending-medal"><Trophy size={36}/><div><small>{tr('첫 이야기 배지','Introduction badge','最初の物語のバッジ')}</small><strong>동네 해결사</strong><span>끝까지 함께한 당신에게.</span></div></div>
   <div className="ending-recap">{CHAPTERS.map((c,i)=><div key={c.title}><Check size={17}/><span>{c.unlock}</span><small>{i===0?'화면을 고치다':i===1?'규칙을 만들다':'컴퓨터를 연결하다'}</small></div>)}</div>
   <div className="career-summary"><div><span>해결한 의뢰</span><strong>3<small> / 3</small></strong></div><div><span>누적 경험치</span><strong>{state.xp}<small> XP</small></strong></div><div><span>모은 배지</span><strong>{state.badges.length}<small> 개</small></strong></div></div>
   <div className="earned-badges">{state.badges.map(b=><span key={b}><Trophy size={15}/>{b}</span>)}</div>
   <p className="ending-credit">{tr("내가 바꾼 화면 글자, 계산 규칙, 연결과 보관이 카페를 움직였어요.","Your heading, calculation rule, connection and storage made the cafe work.","自分で変えた見出し・計算ルール・接続・保存でカフェが動きました。")}<br/><span>{tr("이제 첫 새 고객의 부탁을 읽어 보세요. 이번에도 현재 결과를 보고, 값을 직접 바꾸고, 손님처럼 확인합니다.","Read your first new client’s request. Again, inspect the current result, change a value yourself and try it as a customer.","次は最初の新しいお客さんの依頼です。今の結果を見て、自分で値を変え、お客さんとして確かめましょう。")}</span></p>
   <CampaignGoal state={state}/>
   <div className="ending-actions">
    <button className="primary-button" data-testid="opening-first-client" onClick={onFollow}>{tr("첫 새 고객의 부탁 읽기","Read your first new client’s request","最初の新しいお客さんの依頼を読む")} →</button>
    <button className="outline-button" data-testid="export-cafe-site" onClick={()=>void exportSite()}><Download size={18}/>{tr("내 카페 사이트 파일로 내보내기 (.html)","Export my cafe site (.html)","カフェのサイトを保存 (.html)")}</button>
    <button className="primary-button" onClick={()=>onOpen('desktop')}><Coffee size={18}/>나의 바탕화면으로</button>
    <button className="outline-button" onClick={()=>onOpen('workbench')}>남은 보너스 즐기기</button>
    <button className="text-button" onClick={()=>onNavigate('https://mono.cafe')}>내가 완성한 카페 보기 →</button>
   </div>
   {exported&&<p className="ending-export-status" role="status" style={{textAlign:'center',color:'#72e4bf',fontSize:13,margin:'8px 0 0'}}>{exported}</p>}
  </>}
 </div>);
}
