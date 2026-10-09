'use client';
import {useState} from 'react';
import {Check,Lock,ArrowRight,MapPin,Trophy} from 'lucide-react';
import {useLanguage} from '@/lib/game/i18n';
import {CAREER_JOBS} from '@/lib/game/career-content';
import {careerNext,careerUnlocked} from '@/lib/game/career';
import type {GameState} from '@/lib/game/engine';

// Positions refer to the authored neighborhood illustration, in percentages.
const PLACES=[[8,53],[36,61],[16,57],[25,59],[45,68],[58,74],
 [68,32],[13,24],[31,19],[36,29],[46,20],[57,28],
 [62,9],[77,16],[93,22],[82,36],[91,42],[88,56]];

export function NeighborhoodMap({state,onSelect}:{state:GameState;onSelect:(id:string)=>void}){
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[lang];
 const suggested=careerNext(state)??CAREER_JOBS[0];
 const [act,setAct]=useState(suggested.act),[selected,setSelected]=useState(suggested.id);
 const career=state.gameplay.career,job=CAREER_JOBS.find(item=>item.id===selected)??suggested;
 const done=career.completed.includes(job.id),unlocked=careerUnlocked(state,job);
 const titles=[tr('골목의 첫 의뢰','Local requests','路地の最初の依頼'),tr('동네의 공용 도구','Shared tools','まちの共用ツール'),tr('나의 작업실','Your studio','自分の作業場')];
 return <section className="neighborhood-view" data-testid="neighborhood-map">
  <header><div><span className="career-section-label">{tr('의뢰 지도','NEIGHBORHOOD','依頼マップ')}</span><h2>{tr('당신이 고친 동네','The neighborhood you repair','あなたが直すまち')}</h2></div><div className="map-total"><Trophy size={20}/><strong>{career.completed.length}<small> / 18</small></strong></div></header>
  <p>{tr('장소를 골라 의뢰를 읽어 보세요. 전달한 곳에는 완료 도장이 남습니다.','Choose a place to read its request. Each delivery leaves a completion stamp.','場所を選んで依頼を読みましょう。提出した場所には完了スタンプが残ります。')}</p>
  <nav className="map-chapters" aria-label={tr('의뢰 지도 장 선택','Map chapter','マップの章を選択')}>
   {([1,2,3] as const).map(value=>{const count=CAREER_JOBS.filter(item=>item.act===value&&career.completed.includes(item.id)).length;return <button key={value} type="button" aria-pressed={act===value} onClick={()=>{setAct(value);setSelected(CAREER_JOBS.find(item=>item.act===value)!.id);}}><span>{count===6?<Check size={16}/>:value}</span><b>{titles[value-1]}</b><small>{count}/6</small></button>;})}
  </nav>
  <div className="map-board"><div className="map-scroll" tabIndex={0} aria-label={tr('동네 지도 · 작은 화면에서는 옆으로 이동','Neighborhood map · scroll sideways on small screens','まちの地図 · 小さい画面では横にスクロール')}>
   <div className="map-canvas"><img src="/game-art/neighborhood.png" alt="" width={1672} height={941} draggable={false}/>
    {CAREER_JOBS.map((item,index)=>{if(item.act!==act)return null;const delivered=career.completed.includes(item.id),available=careerUnlocked(state,item);return <button type="button" key={item.id} data-testid={'map-pin-'+item.id} className={'map-pin '+(delivered?'delivered':available?'available':'locked')} style={{left:PLACES[index][0]+'%',top:PLACES[index][1]+'%'}} aria-pressed={selected===item.id} aria-label={`${item.client[lang]} · ${delivered?tr('전달 완료','Delivered','提出済み'):available?tr('의뢰 보기','View request','依頼を見る'):tr('아직 잠김','Locked','未解放')}`} onClick={()=>setSelected(item.id)}><span>{delivered?<Check size={20}/>:available?String(index+1).padStart(2,'0'):<Lock size={17}/>}</span>{selected===item.id&&<b>{item.client[lang]}</b>}</button>;})}
   </div>
  </div>
  <article className={'map-request '+(done?'delivered':'')} aria-live="polite"><div className="map-request-icon">{done?<Check/>:unlocked?<MapPin/>:<Lock/>}</div><div><small>{job.client[lang]} · {done?tr('전달 완료','Delivered','提出済み'):`+${job.credits} cr · +${job.xp} XP`}</small><h3>{job.title[lang]}</h3><p>{unlocked?job.brief[lang]:tr(`앞선 ${job.act-1}장의 의뢰를 모두 전달하면 열립니다.`,`Deliver all jobs in the previous ${job.act-1} act(s) to unlock.`,`前の${job.act-1}章の依頼をすべて提出すると解放されます。`)}</p></div><button type="button" className="primary-button" disabled={!unlocked} data-testid="map-open-request" onClick={()=>onSelect(job.id)}>{done?tr('작업 기록 보기','View your work','仕事の記録を見る'):tr('의뢰 열기','Open request','依頼を開く')}<ArrowRight size={17}/></button></article>
  </div>
 </section>;
}
