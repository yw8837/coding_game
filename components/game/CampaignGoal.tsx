'use client';
import {Check,Flag} from 'lucide-react';
import {useLanguage} from '@/lib/game/i18n';
import {careerRouteReady,careerRouteCount} from '@/lib/game/career-progress';
import type {GameState} from '@/lib/game/engine';

export function CampaignGoal({state}:{state:GameState}) {
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[lang];
 const career=state.gameplay.career,opened=state.gameplay.openingCelebrated;
 const allJobs=careerRouteReady(career.completed);
 const published=!!career.release?.published;
 const steps=[
  {done:opened,label:tr('카페의 첫 오픈','Open the café','カフェを開店'),detail:opened?'3 / 3':`${state.completed.length} / 3`},
  {done:allJobs,label:tr('구역마다 의뢰 4개 선택','Choose 4 jobs per district','各エリアで4件選択'),detail:`${careerRouteCount(career.completed)} / 12`},
  {done:published,label:tr('내 첫 프로젝트 배포','Ship your first project','初めての作品を公開'),detail:'v1.0.0'},
 ];
 return <section className="campaign-goal" data-testid="campaign-goal" data-no-translate aria-label={tr('이야기의 최종 목표','Story goal','物語の最終目標')}>
  <h3><Flag size={14}/>{tr('최종 목표 · 내 첫 정식 배포','Your goal · a first release','最終目標 · 初の正式公開')}</h3>
  <ol>{steps.map((step,index)=><li key={index} className={step.done?'done':''} aria-current={!step.done&&(index===0||steps[index-1].done)?'step':undefined}><span>{step.done?<Check size={12}/>:index+1}</span><b>{step.label}</b><small>{step.detail}</small></li>)}</ol>
  <p>{published?tr('배포 기록과 마지막 편지를 의뢰 센터에서 읽을 수 있어요.','Your release record and final letter are in Contracts.','依頼センターで公開記録と最後の手紙を読めます。'):tr('마지막 프로젝트를 검사하고 1.0을 배포하면 엔딩이 열려요. 도구 구입과 연습은 선택이에요.','Check the final project and release 1.0 to reach the ending. Tools and practice are optional.','最後の作品を検査し1.0を公開するとエンディングへ。道具の購入と練習は任意です。')}</p>
 </section>;
}
