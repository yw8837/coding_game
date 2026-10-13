'use client';

import {useEffect,useState} from 'react';
import {ArrowRight,Monitor,Pause,Play} from 'lucide-react';
import {Dialog,DialogContent,DialogDescription,DialogTitle} from '@/components/ui/dialog';
import {useLanguage} from '@/lib/game/i18n';
import {CAREER_JOBS} from '@/lib/game/career-content';
import type {GameState} from '@/lib/game/engine';
import '@/app/ending-credits.css';

export function EndingCredits({state,onClose,onContinue,onDesktop,onStudio,serviceTitle}:{state:GameState;onClose:()=>void;onContinue:()=>void;onDesktop:()=>void;onStudio?:()=>void;serviceTitle?:string}) {
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[lang];
 const [paused,setPaused]=useState(false),[finished,setFinished]=useState(false);
 const [region,setRegion]=useState<HTMLDivElement|null>(null);
 const remaining=Math.max(0,CAREER_JOBS.length-state.gameplay.career.completed.length);
 const finish=()=>{region?.scrollTo({top:region.scrollHeight,behavior:'auto'});setPaused(true);setFinished(true);};
 useEffect(()=>{
  if(!region||paused||finished)return;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  if(preference.matches||document.documentElement.dataset.gameReducedMotion==='true')return;
  let frame=0,last=0,position=region.scrollTop;
  const tick=(now:number)=>{
   const reduce=preference.matches||document.documentElement.dataset.gameReducedMotion==='true';
   if(!document.hidden&&!reduce&&last){
    const distance=region.scrollHeight-region.clientHeight;
    if(distance>0){
     position=Math.min(distance,position+Math.min(now-last,50)*.025);
     region.scrollTop=position;
     if(region.scrollTop>=distance-1){setFinished(true);return;}
    }
   }
   last=now;frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  return()=>cancelAnimationFrame(frame);
 },[region,paused,finished]);
 return <Dialog open onOpenChange={open=>{if(!open)onClose();}}>
  <DialogContent className="ending-credits" data-testid="ending-credits" data-no-translate showCloseButton={false} onEscapeKeyDown={event=>{event.preventDefault();onClose();}}>
   <header className="credits-heading"><span>v{state.gameplay.career.release.published?.version??'1.0.0'}</span><DialogTitle>{tr('첫 출시는, 여기서부터.','Your first release. A beginning.','初めての公開。その先へ。')}</DialogTitle><DialogDescription>{tr('카페의 이름 한 줄에서, 내 이름으로 만든 첫 작품까지.','From a café’s name on a page to a project of your own.','カフェの名前の一行から、自分の作品まで。')}</DialogDescription></header>
   <div className="credits-roll" ref={setRegion} tabIndex={0} role="region" aria-label={tr('엔딩 크레딧','Ending credits','エンディングクレジット')} data-testid="credits-roll" onScroll={()=>{if(region&&region.scrollTop>=region.scrollHeight-region.clientHeight-1)setFinished(true);}} onWheel={()=>setPaused(true)} onTouchStart={()=>setPaused(true)} onKeyDown={event=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key))setPaused(true);}}>
    <div className="credits-roll-content">
     <section className="credits-player"><small>{tr('첫 버전의 개발자','DEVELOPER OF YOUR FIRST RELEASE','最初の作品の開発者')}</small><h3>{tr('당신','You','あなた')}</h3>{serviceTitle&&<p className="credits-service-title" data-testid="credits-service-title">{serviceTitle}</p>}<p>{tr('고치고, 실행하고, 다시 고쳐서 여기까지 왔어요.','You changed it, ran it, and kept going.','直して、動かして、また直して。ここまで来ました。')}</p><strong>{tr(`해결한 의뢰 ${state.gameplay.career.completed.length+3}개 · 나의 첫 출시`,`${state.gameplay.career.completed.length+3} jobs delivered · Your first release`,`完了した依頼 ${state.gameplay.career.completed.length+3}件 · 初めての公開`)}</strong></section>
     <section><small>{tr('기획 · 개발','DESIGN & DEVELOPMENT','企画・開発')}</small><h3>yw8837</h3><p>{tr('개발 보조 · Codex','Development assistance · Codex','開発支援 · Codex')}</p></section>
     <section><small>{tr('배경 · 인물 · 문구','ART & WRITING','背景・人物・文章')}</small><p>{tr('AI 도구를 활용해 제작·편집한 아트와 문구','Artwork and writing created and edited with AI tools','AIツールを用いて制作・編集したアートと文章')}</p></section>
     <section><small>{tr('사운드 · 오픈소스','SOUND & OPEN SOURCE','サウンド・オープンソース')}</small><p>{tr('게임 효과음 · Web Audio 합성','In-game effects · Web Audio synthesis','ゲーム効果音 · Web Audio合成')}</p><p>AI Tech Studio · MIT<br/>React · Electron · Lucide</p><p className="credits-license">{tr('전체 저작권 고지: 설치 폴더의 THIRD-PARTY-NOTICES.txt 및 LICENSES.chromium.html','Full notices: THIRD-PARTY-NOTICES.txt and LICENSES.chromium.html in the game folder','著作権表記の全文：ゲームフォルダーのTHIRD-PARTY-NOTICES.txtとLICENSES.chromium.html')}</p></section>
     <section className="credits-thanks"><small>{tr('플레이해 주셔서 고맙습니다','THANK YOU FOR PLAYING','遊んでくれてありがとう')}</small><h3>{tr('내일도 컴퓨터를 켜요.','See you at the desktop.','また、パソコンを開こう。')}</h3><p>{remaining?tr(`동네에는 아직 ${remaining}개의 부탁이 남아 있어요.`,`There are still ${remaining} neighborhood jobs waiting.`,`まちには、まだ${remaining}件の依頼が残っています。`):tr('의뢰는 모두 끝났어요. 내 작품을 계속 만들거나 다른 아이디어를 시험해 보세요.','Every client job is done. Keep building your project or try another idea.','すべての依頼を終えました。自分の作品を作り続けたり、別のアイデアを試したりできます。')}</p></section>
    </div>
   </div>
   <footer className="credits-actions"><div><button type="button" className="credits-pause" data-testid="credits-pause" aria-pressed={paused} disabled={finished} onClick={()=>setPaused(value=>!value)}>{paused?<Play size={15}/>:<Pause size={15}/>}<span>{finished?tr('크레딧 완료','Credits complete','クレジット終了'):paused?tr('스크롤 재생','Resume scrolling','スクロール再開'):tr('스크롤 멈추기','Pause scrolling','スクロール停止')}</span></button>{!finished&&<button type="button" className="credits-close" data-testid="credits-finish" onClick={finish}>{tr('크레딧 끝으로','Go to the end','クレジットの最後へ')}</button>}<button type="button" className="credits-close" onClick={onClose}>{tr('편지로 돌아가기','Back to the letter','手紙に戻る')}</button></div><p role="status" data-testid="credits-status">{finished&&<strong>{tr('크레딧 완료 · ','Credits complete · ','クレジット終了 · ')}</strong>}{tr('진행 기록은 그대로예요. 언제든 계속할 수 있어요.','Your progress stays with you. Continue whenever you like.','進行状況はそのまま。いつでも続けられます。')}</p><div className="credits-continue-actions"><button type="button" className="primary-button" data-testid="credits-continue" onClick={onContinue}>{remaining?tr(`계속하기 · 남은 의뢰 ${remaining}개`,`Keep playing · ${remaining} jobs left`,`続ける · 残り${remaining}件`):tr('계속하기 · 동네 둘러보기','Keep playing · visit the neighborhood','続ける · まちを見る')}<ArrowRight size={17}/></button>{onStudio&&<button type="button" className="outline-button" data-testid="credits-studio" onClick={onStudio}>{tr('내 작품 계속 만들기','Keep building my project','自分の作品を作り続ける')}<ArrowRight size={16}/></button>}<button type="button" className="outline-button" data-testid="credits-desktop" onClick={onDesktop}><Monitor size={16}/>{tr('바탕화면으로','Back to desktop','デスクトップへ')}</button></div></footer>
  </DialogContent>
 </Dialog>;
}
