'use client';

import {useEffect,useRef,type RefObject} from 'react';
import type {Language} from '@/lib/game/i18n';
import type {CareerImpactModel} from '@/lib/game/career-impact';

export type CareerImpactEvent={jobId:string;sequence:number;kind:'test'|'deliver';hash:string;recheck:boolean};
export function CareerImpact({model,event,main,language,onShop}:{model:CareerImpactModel|null;event:CareerImpactEvent|null;main:RefObject<HTMLElement|null>;language:Language;onShop:()=>void}){
 const card=useRef<HTMLElement>(null),stamp=useRef<HTMLSpanElement>(null),seen=useRef<string|null>(null);
 const text=(ko:string,en:string,ja:string)=>language==='ko'?ko:language==='en'?en:ja;
 const eventKey=event?`${event.jobId}:${event.kind}:${event.sequence}`:null;
 const matches=!!model&&!!event&&model.jobId===event.jobId&&model.hash===event.hash&&(event.kind==='deliver'?model.phase==='delivered':model.phase==='passed');
 useEffect(()=>{
  if(!eventKey||seen.current===eventKey)return;
  seen.current=eventKey;
  if(!matches||!card.current||!main.current)return;
  const container=main.current,element=card.current;
  container.scrollTo({top:container.scrollTop+element.getBoundingClientRect().top-container.getBoundingClientRect().top-12,behavior:'instant'});
  if(event?.recheck||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const animation=stamp.current?.animate([{transform:'scale(.86)',opacity:.35},{transform:'scale(1.04)',opacity:1,offset:.72},{transform:'scale(1)',opacity:1}],{duration:280,easing:'cubic-bezier(.2,.8,.2,1)'});
  return ()=>animation?.cancel();
 },[eventKey,matches,event?.recheck,main]);
 if(!model)return null;
 const delivered=model.phase==='delivered',recheck=!delivered&&matches&&event?.recheck;
 return <section ref={card} className={'career-impact '+(delivered?'career-payoff':'')} data-testid={delivered?'career-payoff':'career-impact'} aria-label={delivered?text('전달한 의뢰의 기록','Delivered job record','提出した依頼の記録'):text('수정한 결과','Your fixed output','修正した結果')}>
  <header><span ref={stamp} className="career-impact-stamp" aria-hidden="true">✓</span><div><strong>{delivered?text('의뢰 전달 완료','Job delivered','依頼を提出しました'):recheck?text('현재 결과를 다시 확인했어요','Current result confirmed','現在の結果を再確認しました'):text('수정한 결과가 모두 통과했어요','Your fixed output passes every check','修正した結果はすべて通過しました')}</strong><p>{delivered?text('이 의뢰로 받은 보상 · 전달 기록에 저장됨','Reward earned for this job · saved in your delivery record','この依頼で得た報酬 · 提出記録に保存済み'):text('처음 받은 파일과 지금의 실제 실행 결과를 비교해 보세요.','Compare the original files with your actual output now.','最初のファイルと現在の実際の結果を比べてみましょう。')}</p>{model.ownSolution&&<span className="career-impact-own" data-testid="career-impact-own-solution" data-solution={model.ownSolution}><span aria-hidden="true">★</span>{text('나만의 풀이로 완수','Cleared with custom approach','独自のアプローチで完了')}</span>}</div>{delivered&&<b className="career-impact-reward">+{model.credits} cr <span>+{model.xp} XP</span></b>}</header>
  {!!model.rows.length&&<dl className="career-impact-rows">{model.rows.slice(0,3).map(row=><div key={JSON.stringify(row.label)}><dt>{row.label[language]}</dt><dd><span><small>{text('수정 전','Before','修正前')}</small><code data-testid="career-impact-before">{row.before}</code></span><span className="career-impact-after"><small>{text('수정 후','After','修正後')}</small><code data-testid="career-impact-after">{row.after}</code></span></dd></div>)}</dl>}
  {model.rows.length>3&&<p className="career-impact-note">{text(`달라진 결과 ${model.rows.length-3}개를 검사 기록에서 더 볼 수 있어요.`,`${model.rows.length-3} more changes in test results.`,`検査記録でさらに${model.rows.length-3}件の変更を確認できます。`)}</p>}
  {!model.rows.length&&<p className="career-impact-note">{model.additional>0?text('비교 가능한 변경 항목이 없어요. 추가 결과는 검사 기록에서 확인할 수 있어요.','No changed comparable results. You can review additional results in the test record.','比較できる変更項目はありません。追加の結果は検査記録で確認できます。'):text('기존 출력과 같아요. 현재 파일의 결과를 확인했습니다.','The output is unchanged. The current file results have been checked.','出力は変わっていません。現在のファイルの結果を確認しました。')}</p>}
  {(model.unchanged>0||model.additional>0)&&<p className="career-impact-note">{model.unchanged>0&&text(`처음부터 같았던 결과 ${model.unchanged}개`,`${model.unchanged} results were already the same`,`${model.unchanged}件は最初から同じ結果です`)}{model.unchanged>0&&model.additional>0?' · ':''}{model.additional>0&&text(`추가 검사 ${model.additional}개 통과`,`${model.additional} additional checks passed`,`追加の${model.additional}件も通過しました`)}</p>}
  {delivered&&<footer><div><strong>{text(`구역 ${model.district} · ${model.districtCompleted} / ${model.districtTotal}개 전달`,`District ${model.district} · ${model.districtCompleted} / ${model.districtTotal} jobs delivered`,`エリア${model.district} · ${model.districtTotal}件中${model.districtCompleted}件提出`)}</strong><progress value={Math.min(model.districtCompleted,model.districtTarget)} max={model.districtTarget} aria-label={text('이 구역의 배포 준비','Release preparation in this district','このエリアの公開準備')}/><p>{model.releaseReady?text('12개 의뢰 준비 완료 · 최종 프로젝트를 시작할 수 있어요.','12 jobs ready · you can start the final project.','12件の準備完了 · 最後の作品を始められます。'):model.nextDistrict?text(`구역 ${model.nextDistrict}의 의뢰를 고를 수 있어요.`,`Jobs in district ${model.nextDistrict} are available.`,`エリア${model.nextDistrict}の依頼を選べます。`):text(`이 구역에서 ${Math.max(0,model.districtTarget-model.districtCompleted)}개 더 전달하면 다음 단계가 열려요.`,`Deliver ${Math.max(0,model.districtTarget-model.districtCompleted)} more jobs in this district to open the next step.`,`このエリアであと${Math.max(0,model.districtTarget-model.districtCompleted)}件提出すると次へ進めます。`)}</p><small>{text(`배포 준비 ${model.routeCompleted} / 12`,`Release preparation ${model.routeCompleted} / 12`,`公開準備 ${model.routeCompleted} / 12`)}</small></div><button type="button" className="outline-button" data-testid="career-payoff-shop" onClick={onShop}>{text('보상으로 작업실 도구 살펴보기','Browse studio tools with your reward','報酬で作業場の道具を見る')}</button></footer>}
 </section>;
}
