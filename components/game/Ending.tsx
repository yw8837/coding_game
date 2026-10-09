'use client';
import {localizeUI} from '@/lib/game/i18n';
import {useEffect,useRef,useState} from 'react';
import {Check,Coffee,PartyPopper,Trophy} from 'lucide-react';
import {CafeScene} from './CafeScene';
import {CHAPTERS} from '@/lib/game/story';
import type {GameProps} from './types';

export function OpeningEnding({state,onAction,onOpen,onNavigate}:GameProps){
 const opened=state.gameplay.openingCelebrated;
 const [burst,setBurst]=useState(false);
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{root.current?.closest('.app-surface')?.scrollTo(0,0);},[opened]);
 useEffect(()=>{if(!burst)return;const timer=setTimeout(()=>setBurst(false),2800);return()=>clearTimeout(timer);},[burst]);
 return localizeUI(<div ref={root} className={'opening-ending '+(opened?'celebrated':'')}>
  {burst&&<div className="opening-confetti" aria-hidden="true">{Array.from({length:22},(_,i)=><i key={i} style={{left:(i*47%100)+'%',animationDelay:(i%5)*.09+'s',background:['#f4bf78','#72e4bf','#d0b0ef'][i%3]}}/>)}</div>}
  <span className="eyebrow-text">{opened?'엔딩 · 동네 해결사':'마지막 이야기 · 오픈 초대장'}</span><h1>{opened?'모노 카페가 문을 열었습니다.':'오픈 준비가 끝났어요.'}</h1><p>{opened?'메뉴판, 계산대, 주문함. 세 의뢰를 모두 해결했어요.':'메뉴판, 계산대, 주문함이 모두 준비됐어요. 지우와 민서가 기다리고 있어요.'}</p>
  <CafeScene completed={state.completed} opened={opened}/>
  {!opened?<><blockquote>지우: “혼자였다면 시작도 못 했을 거예요.<br/>우리 카페의 첫 오픈, 당신이 해 주실래요?”</blockquote><button className="primary-button opening-button" onClick={()=>{setBurst(true);onAction({type:'celebrate-opening'});}}><PartyPopper size={21}/>OPEN 간판 켜기</button><small>세 의뢰의 마지막 순간 · 누르면 엔딩이 저장돼요</small></>:<>
   <div className="ending-dialogue" aria-live="polite"><p><b>첫 손님</b>“메뉴가 잘 보이네요. 커피 두 잔, 9,000원 맞죠?”</p><p><b>지우</b>“네! 주문도 잘 들어왔어요. 따뜻하게 내려 드릴게요.”</p><p><b>민서</b>“처음엔 몰라도 괜찮았지? 보고, 바꾸고, 다시 해보면 돼.”</p></div>
   <div className="ending-medal"><Trophy size={36}/><div><small>최종 배지 획득</small><strong>동네 해결사</strong><span>끝까지 함께한 당신에게.</span></div></div>
   <div className="ending-recap">{CHAPTERS.map((c,i)=><div key={c.title}><Check size={17}/><span>{c.unlock}</span><small>{i===0?'화면을 고치다':i===1?'규칙을 만들다':'컴퓨터를 연결하다'}</small></div>)}</div>
   <div className="career-summary"><div><span>해결한 의뢰</span><strong>3<small> / 3</small></strong></div><div><span>누적 경험치</span><strong>{state.xp}<small> XP</small></strong></div><div><span>모은 배지</span><strong>{state.badges.length}<small> 개</small></strong></div></div>
   <div className="earned-badges">{state.badges.map(b=><span key={b}><Trophy size={15}/>{b}</span>)}</div>
   <p className="ending-credit">모노 카페 이야기 · 끝<br/><span>플레이해 주셔서 감사합니다.</span></p>
   <div className="ending-actions"><button className="primary-button" onClick={()=>onOpen('desktop')}><Coffee size={18}/>나의 바탕화면으로</button><button className="outline-button" onClick={()=>onOpen('workbench')}>남은 보너스 즐기기</button><button className="text-button" onClick={()=>onNavigate('https://mono.cafe')}>내가 완성한 카페 보기 →</button></div>
  </>}
 </div>);
}
