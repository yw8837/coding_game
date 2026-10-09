'use client';
import {useState} from 'react';
import Image from 'next/image';
import {Check,Lock,ArrowRight,MapPin,Trophy} from 'lucide-react';
import {useLanguage} from '@/lib/game/i18n';
import {CAREER_JOBS} from '@/lib/game/career-content';
import {careerRouteReady,careerRouteCount} from '@/lib/game/career-progress';
import {careerNext,careerUnlocked} from '@/lib/game/career';
import type {GameState} from '@/lib/game/engine';

// Positions refer to the authored neighborhood illustration, in percentages.
const PLACES=[[8,53],[36,61],[16,57],[25,59],[45,68],[58,74],
 [68,32],[13,24],[31,19],[36,29],[46,20],[57,28],
 [62,9],[77,16],[93,22],[82,36],[91,42],[88,56]];

export function NeighborhoodMap({state,onSelect,onRelease}:{state:GameState;onSelect:(id:string)=>void;onRelease:()=>void}){
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[lang];
 const suggested=careerNext(state)??CAREER_JOBS[0];
 const [act,setAct]=useState(suggested.act),[selected,setSelected]=useState(suggested.id);
 const career=state.gameplay.career,job=CAREER_JOBS.find(item=>item.id===selected)??suggested;
 const done=career.completed.includes(job.id),unlocked=careerUnlocked(state,job);
 const titles=[tr('골목의 첫 의뢰','Local requests','路地の最初の依頼'),tr('동네의 공용 도구','Shared tools','まちの共用ツール'),tr('나의 작업실','Your studio','自分の作業場')];
 return <section className="neighborhood-view" data-testid="neighborhood-map">
  <header><div><span className="career-section-label">{tr('의뢰 지도','NEIGHBORHOOD','依頼マップ')}</span><h2>{tr('당신이 고친 동네','The neighborhood you repair','あなたが直すまち')}</h2></div><div className="map-total"><Trophy size={20}/><strong>{careerRouteCount(career.completed)}<small> / 12</small></strong></div></header>
  <p>{tr('각 구역의 6개 의뢰 중 4개를 골라 해결하세요. 나머지는 같은 보상을 받는 선택 의뢰로 남아요.','Choose four of the six jobs in each district. The rest remain optional, with full rewards.','各エリアの6件から4件を選んで解決。残りは同じ報酬の任意依頼として残ります。')}</p>
  {careerRouteReady(career.completed)&&<div className="map-final-call"><div><strong>{career.release.published?tr('내 첫 1.0 배포 완료','Your first 1.0 is released','初めての1.0を公開しました'):tr('세 구역에서 경험을 쌓았어요. 이제 내 첫 프로젝트를 배포할 수 있어요.','Your route is complete. You can now release your own project.','3エリアで経験を積みました。自分の作品を公開できます。')}</strong></div><button className="primary-button" data-testid="map-final-project" onClick={onRelease}>{career.release.published?tr('마지막 편지 보기','View final letter','最後の手紙を見る'):tr('최종 프로젝트 열기','Open final project','最後の作品を開く')}<ArrowRight size={16}/></button></div>}
  <nav className="map-chapters" aria-label={tr('의뢰 지도 장 선택','Map chapter','マップの章を選択')}>
   {([1,2,3] as const).map(value=>{const count=CAREER_JOBS.filter(item=>item.act===value&&career.completed.includes(item.id)).length;return <button key={value} type="button" aria-pressed={act===value} onClick={()=>{setAct(value);setSelected(CAREER_JOBS.find(item=>item.act===value)!.id);}}><span>{count>=4?<Check size={16}/>:value}</span><b>{titles[value-1]}</b><small>{count}/6 · {tr('4개로 다음 구역','4 to advance','4件で次へ')}</small></button>;})}
  </nav>
  <div className="map-board"><div className="map-scroll" tabIndex={0} aria-label={tr('동네 지도 · 작은 화면에서는 옆으로 이동','Neighborhood map · scroll sideways on small screens','まちの地図 · 小さい画面では横にスクロール')}>
   <div className="map-canvas"><Image unoptimized src="/game-art/neighborhood.png" alt="" width={1672} height={941} loading="eager" draggable={false}/>
    {CAREER_JOBS.map((item,index)=>{if(item.act!==act)return null;const delivered=career.completed.includes(item.id),available=careerUnlocked(state,item);return <button type="button" key={item.id} data-testid={'map-pin-'+item.id} className={'map-pin '+(delivered?'delivered':available?'available':'locked')} style={{left:PLACES[index][0]+'%',top:PLACES[index][1]+'%'}} aria-pressed={selected===item.id} aria-label={`${item.client[lang]} · ${delivered?tr('전달 완료','Delivered','提出済み'):available?tr('의뢰 보기','View request','依頼を見る'):tr('아직 잠김','Locked','未解放')}`} onClick={()=>setSelected(item.id)}><span>{delivered?<Check size={20}/>:available?String(index+1).padStart(2,'0'):<Lock size={17}/>}</span>{selected===item.id&&<b>{item.client[lang]}</b>}</button>;})}
   </div>
  </div>
  <article className={'map-request '+(done?'delivered':'')} aria-live="polite"><div className="map-request-icon">{done?<Check/>:unlocked?<MapPin/>:<Lock/>}</div><div><small>{job.client[lang]} · {done?tr('전달 완료','Delivered','提出済み'):`+${job.credits} cr · +${job.xp} XP`}</small><h3>{job.title[lang]}</h3><p>{unlocked?job.brief[lang]:tr(`앞선 각 구역에서 4개씩 골라 전달하면 열립니다.`,`Choose and deliver four jobs in each earlier district to unlock.`,`前の各エリアで4件ずつ選んで提出すると解放されます。`)}</p></div><button type="button" className="primary-button" disabled={!unlocked} data-testid="map-open-request" onClick={()=>onSelect(job.id)}>{done?tr('작업 기록 보기','View your work','仕事の記録を見る'):tr('의뢰 열기','Open request','依頼を開く')}<ArrowRight size={17}/></button></article>
  </div>
 </section>;
}
