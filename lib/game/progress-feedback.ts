import type {GameState} from './engine.ts';
import {CAREER_JOBS,L,type Localized} from './career-content.ts';
import {careerActReady,careerRouteReady} from './career-progress.ts';
import {careerFiles,careerFresh} from './career.ts';
import {evaluateCareer} from './career-evaluation.ts';

export type ProgressMoment={tier:'check'|'delivery'|'milestone';label:Localized;title:Localized;detail:Localized;credits:number;xp:number};
const checked=(count:number,title:Localized):ProgressMoment=>({tier:'check',label:L('문제 해결','ALL CHECKS PASS','問題解決'),title,detail:L(`${count}개 검사 통과 · 내 수정이 작동해요`,`${count} checks passed · your fix works`,`${count}件の検査に合格 · 修正が動いています`),credits:0,xp:0});

/** Feedback follows earned state transitions, never awards progress or runs on load. */
export function progressMoment(before:GameState,after:GameState):ProgressMoment|null {
 const old=before.gameplay.career,next=after.gameplay.career;
 const delivered=CAREER_JOBS.find(job=>next.completed.includes(job.id)&&!old.completed.includes(job.id));
 if(delivered){
  const milestone=!careerActReady(old.completed,delivered.act)&&careerActReady(next.completed,delivered.act);
  const ready=careerRouteReady(next.completed);
  return {tier:milestone?'milestone':'delivery',label:milestone?L('새 목표 열림','NEW GOAL UNLOCKED','新しい目標が開放'):L('의뢰 전달 완료','JOB DELIVERED','依頼提出完了'),
   title:milestone?(ready?L('이제, 내 첫 출시','Your first release awaits','いよいよ、初公開へ'):L('새로운 동네에서 온 의뢰','A new district is calling','新しいエリアからの依頼')):delivered.title,
   detail:milestone?(ready?L('내 작품을 만들 준비가 끝났어요.','You are ready to build your own project.','自分の作品を作る準備ができました。'):L('다음 구역의 고객을 만날 수 있어요.','The next district’s clients are now available.','次のエリアのお客さんに会えます。')):delivered.client,
   credits:after.credits-before.credits,xp:after.xp-before.xp};
 }
 if(next.release.published&&!old.release.published)return {tier:'milestone',label:L('정식 배포','RELEASED','正式公開'),title:L('내 첫 작품, v1.0.0','My first release, v1.0.0','初めての作品、v1.0.0'),detail:L('직접 만든 결과가 배포 기록에 남았어요.','Your own work is now in your release history.','自分で作った作品が公開記録に残りました。'),credits:0,xp:0};
 for(const job of CAREER_JOBS){
  const proof=next.proofs[job.id],previous=old.proofs[job.id];
  if(proof?.passed&&!next.completed.includes(job.id)&&(!previous?.passed||previous.hash!==proof.hash)&&careerFresh(after,job.id))return checked(evaluateCareer(job.id,careerFiles(after,job.id)).checks.length,job.title);
 }
 const tests=after.tests,previous=before.tests;
 if(tests?.checks.length&&tests.checks.every(check=>check.passed)&&(!previous?.checks.every(check=>check.passed)||previous.hash!==tests.hash))return checked(tests.checks.length,L('카페의 문제가 해결됐어요','The cafe fix works','カフェの問題が直りました'));
 return null;
}
