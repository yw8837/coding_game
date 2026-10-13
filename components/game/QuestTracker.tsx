'use client';
import {localizeUI,useLanguage} from '@/lib/game/i18n';
import {careerRouteCount} from '@/lib/game/career-progress';
import {careerCurrent,careerNext} from '@/lib/game/career';
import {CAREER_JOBS} from '@/lib/game/career-content';
import {DEMO_SAMPLE_JOB} from '@/lib/game/edition';
import {coachStage,COACH_COPY} from '@/lib/game/coach';
import {questGuidance} from '@/lib/game/quest-guidance';
import {questProgress,type QuestProgress} from '@/lib/game/quest-progress';
import {CampaignGoal} from './CampaignGoal';
import {DemoGoal} from './DemoBoundary';
import {Check,ArrowRight,Flag,Coins,X,TerminalSquare} from 'lucide-react';
import {MISSIONS} from '@/lib/game/content';
import {currentTask,type Task} from '@/lib/game/workflow';
import {CHAPTERS} from '@/lib/game/story';
import type {GameProps} from './types';
import type {WorkGuide} from '@/lib/game/work-context';

type QuestProps=GameProps&{visibleApps?:readonly string[];guide?:WorkGuide|null};
function CurrentWork({title,detail,task,target}:{title:string;detail:string;task:Task;target:string}){
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[lang];
 return localizeUI(<div key={title} className="quest-current" data-testid="quest-current-work"><small>{tr('현재 작업','Current task','現在の作業')}</small><strong>{title}</strong><TaskTarget task={task} target={target}/><details className="quest-help"><summary>{tr('작업 설명 보기','View task instructions','作業の説明を見る')}</summary><p>{detail}</p></details></div>);
}
function ProgressTrail({progress}:{progress:QuestProgress}){
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[lang];
 return <div className="quest-evidence"><div className="progress-label"><span>{tr('확인된 진행','Verified progress','確認済みの進捗')}</span><b>{progress.completed} / {progress.total}</b></div><div className="desk-progress" role="progressbar" aria-label={tr('확인된 진행','Verified progress','確認済みの進捗')} aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.completed}><span style={{width:(progress.total?progress.completed/progress.total*100:0)+'%'}}/></div>{progress.evidence?<p className="quest-proof-status">{progress.evidence[lang]}</p>:progress.checks&&<p className="quest-proof-status">{tr('현재 파일 검사','Current file checks','現在のファイル検査')} · {progress.checks.passed} / {progress.checks.total}</p>}<details className="quest-trail"><summary>{tr('진행 기록 보기','View progress trail','進捗の記録を見る')}</summary><ol>{progress.steps.map(item=><li key={item.id} className={item.done?'done':item.id===progress.currentId?'active':''} aria-current={item.id===progress.currentId?'step':undefined}><span aria-hidden="true">{item.done?<Check size={13}/>:item.id===progress.currentId?'›':'·'}</span><span>{item.label[lang]}</span><small>{item.done?tr('완료','Done','完了'):item.id===progress.currentId?tr('현재','Current','現在'):tr('대기','Pending','待機')}</small></li>)}</ol></details></div>;
}
function TaskTarget({task,target=task.app}:{task:Task;target?:string}){
 const lang=useLanguage(),names:Record<string,[string,string,string]>={repair:['수리 작업','Repair workspace','修理作業'],career:['의뢰 센터','Contracts','依頼センター'],messages:['메시지','Messages','メッセージ'],browser:['브라우저','Browser','ブラウザー'],computer:['컴퓨터','Computer','コンピューター'],editor:['에디터','Editor','エディター'],terminal:['터미널','Terminal','ターミナル'],server:['서버','Server','サーバー'],api:['API','API','API'],achievements:['초대장','Invitation','招待状'],python:['Python 자동화','Python automation','Python自動化'],sql:['SQL 데이터베이스','SQL database','SQLデータベース'],challenges:['코딩 연습실','Coding lab','コーディング練習室']};
 return <p className="quest-target"><span>{(task.id==='demo-complete'?['데모 완료 기록','Demo summary','デモの記録']:names[target]??[target,target,target])[lang==='ko'?0:lang==='en'?1:2]}</span>{task.file&&<code>{task.file}</code>}</p>;
}

function ContextGuide({props,guide,compact=false}:{props:QuestProps;guide:WorkGuide;compact?:boolean}){
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[lang];
 const campaign=currentTask(props.state,props.edition);
 const campaignTitle=campaign.localized?.title[lang]??campaign.title;
 const perform=()=>{
  const action=guide.action;
  props.onWorkContext?.(guide.context);
  if(action.kind==='queue')props.queueCommand(action.command);
  else if(action.kind==='file')props.openFile(action.path);
  else if(action.kind==='app')props.onOpen(action.app);
  else if(action.kind==='accept')props.onAction({type:'ops-accept',id:action.id});
  else if(action.kind==='restore')props.onAction({type:'ops-restore',id:action.id});
  else {props.onAction({type:'lab-run',id:action.id});props.onOpen('challenges');}
 };
 return <section className={compact?'task-guidance quest-ribbon-compact':'quest-next quest-priority'} data-testid="context-work-guide" data-work-kind={guide.context.kind} data-work-id={guide.context.id} aria-label={tr('현재 작업 안내','Current work guidance','現在の作業案内')} data-no-translate>
  <div className="task-instruction"><small>{tr('현재 작업','Current work','現在の作業')}</small><strong>{guide.title[lang]}</strong><p className="quest-target"><span>{guide.destination[lang]}</span><code data-testid="work-target-file">{guide.file}</code></p><p className="quest-goal">{guide.goal[lang]}</p>{guide.action.kind==='queue'&&<><code data-testid="work-command">{guide.action.command}</code><p>{tr('명령을 넣은 뒤 Enter로 실행하세요.','Insert the command, then press Enter to run.','コマンドを入れた後、Enterで実行してください。')}</p></>}
   <details className="quest-help"><summary>{tr('작업 방법 보기','View work instructions','作業の手順を見る')}</summary><p>{guide.detail[lang]}</p></details>
   <details className="quest-campaign" data-testid="work-campaign-next"><summary>{tr('이야기 목표 · 다음 의뢰','Story goal · next request','物語の目標 · 次の依頼')}</summary><p>{campaignTitle}</p><button className="outline-button small" onClick={props.onFollow}>{tr('이야기 작업으로 이동','Go to the story task','物語の作業へ移動')}<ArrowRight size={14}/></button>{!compact&&<ProgressTrail progress={questProgress(props.state,props.edition)}/>}</details>
  </div>
  <button className="primary-button small" style={compact?{alignSelf:'flex-start',position:'sticky',top:0}:undefined} data-testid="work-task-action" onClick={perform}>{guide.actionLabel[lang]}<ArrowRight size={16}/></button>
 </section>;
}
export function QuestTracker(props:QuestProps&{onClose:()=>void}){
 const {state,onFollow}=props,lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[lang];
 if(props.guide)return <aside id="mission-sidebar" className="mission-sidebar quest-tracker quest-compact" aria-label={tr('현재 작업','Current work','現在の作業')}><div className="mission-sidebar-heading"><span><Flag size={16}/>{tr('현재 작업','Current work','現在の作業')}</span><button className="panel-close" onClick={props.onClose} aria-label={tr('작업 상세 접기','Close work details','作業の詳細を閉じる')}><X size={18}/></button></div><ContextGuide props={props} guide={props.guide}/></aside>;
 let task=currentTask(state,props.edition);
 const guidedActive=!!props.guided&&state.accepted&&!state.completed.includes(state.mission)&&!state.gameplay.openingCelebrated;
 if(guidedActive){const copy=COACH_COPY[coachStage(state)];task={...task,title:tr(...copy),detail:tr('값을 직접 바꾸고 화면에서 결과를 확인해요. 바뀐 코드도 함께 살펴봐요.','Change a value yourself and check the result on screen. Look at the code you changed too.','自分で値を変えて画面の結果を確かめましょう。変わったコードも一緒に見てみましょう。'),command:undefined};}
 const {showAction,target}=questGuidance(task,guidedActive,props.visibleApps??[],props.browserUrl),progress=questProgress(state,props.edition),job=props.edition==='demo'?CAREER_JOBS.find(job=>job.id===DEMO_SAMPLE_JOB)??null:careerCurrent(state),next=props.edition==='demo'?null:careerNext(state);
 const title=task.localized?.title[lang]??task.title,detail=task.localized?.detail[lang]??task.detail;
 const action=task.command?tr('명령 넣기','Insert command','コマンドを入力'):task.next?tr('다음 의뢰 받기','Get next request','次の依頼を受ける'):task.app==='career'?tr('의뢰 센터 열기','Open Contracts','依頼センターを開く'):tr('해당 앱 열기','Open app','アプリを開く');
 const chapter=task.id==='demo-complete'?tr('데모 이야기 완료','Demo story complete','デモの物語クリア'):task.localized?tr('독립 작업실','Independent studio','独立した作業場'):CHAPTERS[state.mission].title;
 const goal=task.id==='demo-complete'?tr('고친 파일과 진행은 저장되어 있어요.','Your edited files and progress are saved.','修正したファイルと進行状況は保存されています。'):task.localized?(progress.kind==='release'?tr('내 프로젝트 1.0을 배포하고 마지막 편지를 받아요.','Release your project 1.0 and receive the final letter.','自分の作品1.0を公開し、最後の手紙を受け取ります。'):(job&&!state.gameplay.career.completed.includes(job.id)?job.brief[lang]:next?.brief[lang]??tr('동네 고객의 의뢰를 해결해요.','Solve requests for neighborhood clients.','まちの顧客の依頼を解決します。'))):CHAPTERS[state.mission].goal;
 const reward=task.localized?(progress.kind==='career'?(job&&!state.gameplay.career.completed.includes(job.id)?job:next):null):null;
 return localizeUI(<aside id="mission-sidebar" className="mission-sidebar quest-tracker quest-compact" aria-label={tr('현재 퀘스트','Current quest','現在のクエスト')}><div className="mission-sidebar-heading"><span><Flag size={16}/>{tr('현재 퀘스트','Current quest','現在のクエスト')}</span><button className="panel-close" onClick={props.onClose} aria-label={tr('퀘스트 상세 접기','Close quest details','クエスト詳細を閉じる')}><X size={18}/></button></div><section key={task.id} className="quest-next quest-priority" aria-label={tr('현재 작업','Current task','現在の作業')} data-testid={!showAction?'quest-current-work':undefined}><small>{tr('현재 작업','Current task','現在の作業')}</small><strong>{title}</strong><TaskTarget task={task} target={target}/>{showAction&&<button className="primary-button" data-testid={task.localized?'quest-open-app':'quest-task-action'} onClick={onFollow}>{action}<ArrowRight size={16}/></button>}<p className="quest-goal">{goal}</p><details className="quest-help"><summary>{tr('작업 설명 보기','View task instructions','作業の説明を見る')}</summary><p>{detail}</p>{task.command&&<><code>{task.command}</code><small>{tr('명령을 넣은 뒤 Enter로 실행하세요.','Insert the command, then press Enter to run.','コマンドを入力した後、Enterで実行してください。')}</small></>}</details></section><div className="quest-chapter">{chapter} · {props.edition==='demo'&&task.localized?(state.gameplay.career.completed.includes(DEMO_SAMPLE_JOB)?'1 / 1':'0 / 1'):task.localized?careerRouteCount(state.gameplay.career.completed)+' / 12':state.mission+1+' / 3'}</div><ProgressTrail progress={progress}/>{task.id!=='demo-complete'&&(!task.localized||reward)&&<div className="sidebar-reward"><Coins size={18}/><b>+{reward?.credits??MISSIONS[state.mission].reward} cr</b><span>+{reward?.xp??MISSIONS[state.mission].xp} XP</span></div>}<details className="quest-campaign"><summary>{tr('최종 목표 보기','View final goal','最終目標を見る')}</summary>{props.edition==='demo'?<DemoGoal state={state}/>:<CampaignGoal state={state}/>}</details></aside>);
}
export function QuestRibbon(props:QuestProps){
 const {state,onFollow,guided,visibleApps=[],browserUrl}=props;
 let task=currentTask(state,props.edition);const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[lang],guidedActive=!!guided&&state.accepted&&!state.completed.includes(state.mission)&&!state.gameplay.openingCelebrated;
 if(props.guide)return <ContextGuide props={props} guide={props.guide} compact/>;
 if(guidedActive)task={...task,title:COACH_COPY[coachStage(state)][lang==='ko'?0:lang==='en'?1:2],detail:'',command:undefined};
 const title=task.localized?.title[lang]??task.title,detail=task.localized?.detail[lang]??task.detail;
 const {showAction,target}=questGuidance(task,guidedActive,visibleApps,browserUrl);
 if(!showAction)return <CurrentWork title={title} detail={detail} task={task} target={target}/>;
 return localizeUI(<section className="task-guidance quest-ribbon-compact" aria-label={tr('현재 행동 안내','Current action guidance','現在の行動案内')}><div className="task-icon">{task.command?<TerminalSquare size={20}/>:<Flag size={20}/>}</div><div className="task-instruction" aria-live="polite"><small>{tr('현재 작업','Current task','現在の作業')}</small><strong>{title}</strong><TaskTarget task={task} target={target}/>{detail&&<details className="quest-help"><summary>{tr('작업 설명 보기','View task instructions','作業の説明を見る')}</summary><p>{detail}</p></details>}</div><button className="primary-button small" onClick={onFollow} data-testid="follow-task">{task.command?tr('명령 넣기','Insert command','コマンドを入力'):task.next?tr('다음 의뢰 받기','Get next request','次の依頼を受ける'):tr('해당 앱 열기','Open app','アプリを開く')}<ArrowRight size={16}/></button></section>);
}
