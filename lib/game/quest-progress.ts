import {dirtyFiles,projectFiles,sourceHash,type GameState} from './engine.ts';
import {lessonFacts} from './lesson.ts';
import {setupReadiness} from './setup.ts';
import {MISSIONS} from './content.ts';
import {careerCurrent,careerNext,careerFiles,careerHash,careerFresh} from './career.ts';
import {careerRouteReady} from './career-progress.ts';
import {releaseFiles,releaseHash,releaseFresh,releaseBuildFresh,releasePublishedFresh,RELEASE_START_FILES} from './release.ts';
import type {Localized} from './career-content.ts';

const L=(ko:string,en:string,ja:string):Localized=>({ko,en,ja});
export type QuestMilestone={id:string;label:Localized;done:boolean};
export type QuestProgress={kind:'cafe'|'career'|'release';steps:QuestMilestone[];currentId:string|null;completed:number;total:number;checks:null|{passed:number;total:number};evidence:Localized|null};
function model(kind:QuestProgress['kind'],steps:QuestMilestone[],checks:QuestProgress['checks']=null,evidence:Localized|null=null):QuestProgress{
 return {kind,steps,currentId:steps.find(s=>!s.done)?.id??null,completed:Math.min(steps.length,steps.filter(s=>s.done).length),total:steps.length,checks,evidence};
}
const stale=L('수정됨 · 재검사 필요','Edited · check again','修正済み・再検査が必要');
const step=(id:string,label:Localized,done:boolean):QuestMilestone=>({id,label,done});

/** Presentation only: never grants progress or changes the source of mission validation. */
export function questProgress(s:GameState,edition:import('./edition.ts').GameEdition='full'):QuestProgress{
 if(edition==='demo'&&s.gameplay.openingCelebrated)return model('cafe',[
  step('chapter-1',L('메뉴판 완성','Menu board complete','メニュー完成'),s.completed.includes(0)),
  step('chapter-2',L('계산대 완성','Checkout complete','レジ完成'),s.completed.includes(1)),
  step('chapter-3',L('주문함 완성','Order box complete','注文箱完成'),s.completed.includes(2)),
  step('open',L('OPEN 행사','OPEN ceremony','OPENセレモニー'),s.gameplay.openingCelebrated),
 ]);
 if(s.gameplay.openingCelebrated){
  const c=s.gameplay.career,job=careerCurrent(s);
  if(careerRouteReady(c.completed)&&(!job||c.completed.includes(job.id))){
   const r=c.release,hash=releaseHash(releaseFiles(s)),outdated=(!!r.proof&&r.proof.hash!==hash)||r.started&&!releaseFresh(s)&&hash!==releaseHash(RELEASE_START_FILES);
   return model('release',[
    step('start',L('최종 프로젝트 시작','Start final project','最後の作品を開始'),r.started),
    step('check',L('현재 파일 검사','Check current files','現在のファイルを検査'),releaseFresh(s)),
    step('build',L('1.0.0 버전 기록','Build version 1.0.0','1.0.0を記録'),releaseBuildFresh(s)),
    step('publish',L('첫 버전 배포','Release first version','最初の版を公開'),releasePublishedFresh(s)),
    step('ending',L('마지막 편지','Final letter','最後の手紙'),!!c.ending),
   ],null,outdated?stale:null);
  }
  const active=job&&!c.completed.includes(job.id)?job:careerNext(s),id=active?.id;
  if(!id)return model('career',[]);
  const delivered=c.completed.includes(id),proof=c.proofs[id],fresh=careerFresh(s,id);
  return model('career',[
   step('accept',L('의뢰 수락','Accept request','依頼を受ける'),c.accepted.includes(id)),
   step('inspect',L('현재 결과 확인','Inspect current result','現在の結果を確認'),c.inspected.includes(id)),
   step('check',L('현재 파일 검사 통과','Pass current file checks','現在のファイルの検査に合格'),fresh),
   step('reply',L('고객 답장 선택','Choose client reply','顧客への返信を選択'),!!c.choices[id]),
   step('deliver',L('고객에게 전달','Deliver to client','顧客に納品'),delivered),
  ],null,((proof&&proof.hash!==careerHash(careerFiles(s,id)))||!fresh&&careerHash(careerFiles(s,id))!==careerHash(active!.files))?stale:null);
 }
 const f=lessonFacts(s),m=s.mission,message=['welcome','chapter-two','chapter-three'][m];
 const steps=[
  step('accept',L('의뢰 읽고 수락','Read and accept request','依頼を読んで受ける'),s.accepted&&s.gameplay.readMessages.includes(message)),
  step('prepare',L('프로젝트 준비','Prepare project','作品を準備'),setupReadiness(s).ready),
 ];
 if(m<2)steps.push(step('inspect',L('현재 결과 확인','Inspect current result','現在の結果を確認'),s.gameplay.inspected.includes(m)));
 if(m===0)steps.push(step('sign',L('카페 이름 수정','Fix cafe name','カフェ名を修正'),f.sign),step('size',L('메뉴 너비 수정','Fix menu width','メニュー幅を修正'),f.size));
 if(m===1)steps.push(step('rule',L('합계 계산 수정','Fix total calculation','合計計算を修正'),f.rule));
 if(m===2)steps.push(step('route',L('메뉴 주소 연결','Connect menu address','メニューの接続先を修正'),f.route),step('keep',L('주문 보관','Store orders','注文を保存'),f.keep));
 steps.push(step('check',L('현재 파일 검사 통과','Pass current file checks','現在のファイルの検査に合格'),f.trial),step('deliver',L('수정본 전달','Deliver changes','修正を納品'),f.deliver));
 const expected=MISSIONS[m].checkNames.length,valid=f.fresh&&s.tests?.checks.length===expected;
 const checks=valid?{passed:Math.min(expected,s.tests!.checks.filter(c=>c.passed).length),total:expected}:null;
 const outdated=!!s.tests&&s.tests.mission===m&&s.tests.hash!==sourceHash(projectFiles(s));
 return model('cafe',steps,checks,outdated||!f.fresh&&dirtyFiles(s).length>0?stale:null);
}
