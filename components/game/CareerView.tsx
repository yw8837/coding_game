'use client';

import {useEffect,useRef,useState,type ReactNode} from 'react';
import {useLanguage,type Language} from '@/lib/game/i18n';
import {CAREER_JOBS,type CareerJob,type Localized} from '@/lib/game/career-content';
import {evaluateCareer,exampleSolution,type CareerEvaluation} from '@/lib/game/career-evaluation';
import {CAREER_UPGRADES,careerCurrent,careerFiles,careerFresh,careerHash,careerNext,careerUnlocked} from '@/lib/game/career';
import {careerRouteReady,careerRouteCount} from '@/lib/game/career-progress';
import {DEMO_SAMPLE_JOB,isDemoCafeComplete} from '@/lib/game/edition';
import {NeighborhoodMap} from './NeighborhoodMap';
import {ReleaseProject} from './ReleaseProject';
import {CareerConclusion} from './CareerConclusion';
import {CareerLearning} from './CareerLearning';
import {CareerPlayground} from './CareerPlayground';
import {CareerCode} from './CareerCode';
import {CareerImpact,type CareerImpactEvent} from './CareerImpact';
import {CareerDiagnostic} from './CareerDiagnostic';
import {CareerPortfolio} from './CareerPortfolio';
import {careerFeedback,type CareerSourceTarget} from '@/lib/game/career-feedback';
import '@/app/career-feedback.css';
import {careerImpact} from '@/lib/game/career-impact';
import '@/app/career-impact.css';
import {allowedCareerFile,careerCodeModeSafe} from '@/lib/game/career-code';
import {StudioScene} from './StoryArt';
import {SmartCodeInput,type SmartCodeHandle} from './SmartCodeInput';
import type {GameProps} from './types';

type Text=(ko:string,en:string,ja:string)=>string;
type Localize=(value:Localized)=>string;
type WorkTab='files'|'preview'|'checks';
const DEMO_JOBS=CAREER_JOBS.filter(job=>job.id===DEMO_SAMPLE_JOB);

function PreviewResults({evaluation,text,localize}:{evaluation:CareerEvaluation;text:Text;localize:Localize}){
 return <section className="career-preview" aria-label={text('현재 파일의 실행 결과','Output from the current files','現在のファイルの実行結果')}>
  <header><h3>{text('실행 결과','Live output','実行結果')}</h3><p>{text('지금 저장된 파일로 계산한 결과입니다. 요청과 비교해 보세요.','These results come from the currently saved files. Compare them with the request.','現在保存されているファイルから計算した結果です。依頼と比べてください。')}</p></header>
  {evaluation.preview.length?<dl>{evaluation.preview.map((row,index)=><div key={index}><dt>{localize(row.label)}</dt><dd>{row.value}</dd></div>)}</dl>:<p className="career-muted">{text('파일 내용을 읽지 못했어요. 파일과 검사 결과를 확인해 주세요.','The files could not be read. Check the file and test results.','ファイルを読み取れませんでした。ファイルと検査結果を確認してください。')}</p>}
 </section>;
}

function CheckResults({evaluation,hasProof,text,localize}:{evaluation:CareerEvaluation;hasProof:boolean;text:Text;localize:Localize}){
 return <section className="career-checks" aria-label={text('의뢰 검사 결과','Job test results','依頼の検査結果')}>
  <header><h3>{text('요청을 확인하는 검사','Checks for this request','依頼を確認する検査')}</h3><p>{hasProof?text('이 결과는 현재 파일을 검사한 기록입니다.','These results were checked against the current files.','これは現在のファイルを検査した記録です。'):text('파일을 바꿨다면 다시 검사해 주세요. 기대 결과는 아래에 남아 있어요.','Run the checks after editing. The expected results remain below.','編集したらもう一度検査してください。期待する結果は下にあります。')}</p></header>
  <div className="career-table-scroll"><table><thead><tr><th scope="col">{text('확인할 것','Check','確認すること')}</th><th scope="col">{text('기대 결과','Expected','期待する結果')}</th><th scope="col">{text('실제 결과','Actual','実際の結果')}</th></tr></thead><tbody>{evaluation.checks.map((check,index)=><tr key={index} className={hasProof?(check.passed?'passed':'failed'):''}><th scope="row">{localize(check.name)}{hasProof&&<small>{check.passed?text('통과','Passed','通過'):text('다시 확인','Needs a fix','要確認')}</small>}</th><td>{check.expected}</td><td>{hasProof?check.actual:text('검사 전','Not checked','未検査')}</td></tr>)}</tbody></table></div>
  {!evaluation.checks.length&&<p className="career-muted">{text('검사할 결과가 없어요. 요청의 파일이 모두 있는지 확인해 주세요.','No checks are available. Confirm that all requested files are present.','検査結果がありません。依頼のファイルがすべてあるか確認してください。')}</p>}
 </section>;
}

function WorkTabs({tab,onChange,text}:{tab:WorkTab;onChange:(tab:WorkTab)=>void;text:Text}){
 const buttons=useRef<Array<HTMLButtonElement|null>>([]);
 const tabs:Array<{id:WorkTab;label:string}>=[{id:'files',label:text('파일','Files','ファイル')},{id:'preview',label:text('실행 결과','Live output','実行結果')},{id:'checks',label:text('검사 기록','Test results','検査記録')}];
 return <div className="career-work-tabs" role="tablist" aria-label={text('작업 화면','Workspace views','作業画面')}>{tabs.map((item,index)=><button type="button" role="tab" key={item.id} ref={element=>{buttons.current[index]=element;}} aria-selected={tab===item.id} tabIndex={tab===item.id?0:-1} onClick={()=>onChange(item.id)} onKeyDown={event=>{
  const offset=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;
  if(!offset&&event.key!=='Home'&&event.key!=='End')return;
  event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+offset+tabs.length)%tabs.length;
  onChange(tabs[next].id);buttons.current[next]?.focus();
 }}>{item.label}</button>)}</div>;
}

function CareerEditor({job,files,file,onFile,onEdit,onTest,readOnly,text,localize,session}:{job:CareerJob;files:Record<string,string>;file:string;onFile:(file:string)=>void;onEdit:(content:string)=>void;onTest:()=>void;readOnly:boolean;text:Text;localize:Localize;session:number}){
 const smart=useRef<SmartCodeHandle>(null),numbers=useRef<HTMLDivElement>(null);
 const source=files[file]??'';
 return <section className="career-editor" aria-label={text('의뢰 파일 편집','Edit job files','依頼ファイルの編集')}>
  <nav className="career-file-tabs" aria-label={text('프로젝트 파일','Project files','プロジェクトのファイル')}>{Object.keys(job.files).map(name=><button type="button" key={name} aria-pressed={file===name} onClick={()=>onFile(name)}><span>{name}</span>{files[name]!==job.files[name]&&<span className="career-file-mark" aria-label={text('수정됨','Edited','変更あり')}>M</span>}</button>)}</nav>
  <p className="career-file-description">{job.fileDescriptions[file]?localize(job.fileDescriptions[file]):file}</p>
  {!readOnly&&<div className="career-editor-tools"><button type="button" onClick={()=>smart.current?.undo()}>{text('실행 취소','Undo','元に戻す')}</button><button type="button" onClick={()=>smart.current?.redo()}>{text('다시 실행','Redo','やり直す')}</button><button type="button" onClick={()=>smart.current?.complete()}>{text('자동완성','Complete','補完')}</button><span>{text('Tab 들여쓰기 · Ctrl+Enter 검사','Tab indent · Ctrl+Enter checks','Tabで字下げ · Ctrl+Enterで検査')}</span></div>}
  {readOnly?<pre className="career-readonly">{source}</pre>:<div className="career-code-surface"><div className="career-lines" ref={numbers} aria-hidden="true">{source.split('\n').map((_,index)=><div key={index}>{index+1}</div>)}</div><div className="career-code-input"><SmartCodeInput key={job.id+':'+session} ref={smart} file={file} value={source} onChange={onEdit} onTest={onTest} onScroll={event=>{if(numbers.current)numbers.current.scrollTop=event.currentTarget.scrollTop;}}/></div></div>}
  <footer><span>{readOnly?text('전달한 파일 · 읽기 전용','Delivered files · read only','提出済みファイル · 読み取り専用'):text('내 PC에 자동 저장','Autosaved on your PC','PCに自動保存')}</span><span>{source.length.toLocaleString()} / 20,000</span></footer>
 </section>;
}

export type CareerFileTarget={jobId:string;file:string;requestId?:number};
export function CareerView(props:GameProps&{careerFileTarget?:CareerFileTarget|null;focusRequest?:number;toolsRequest?:number}){
 const {state,onAction}=props,language:Language=useLanguage();
 const text:Text=(ko,en,ja)=>language==='ko'?ko:language==='en'?en:ja;
 const localize:Localize=value=>value[language];
 const demo=props.edition==='demo',jobs=demo?DEMO_JOBS:CAREER_JOBS;
 const career=state.gameplay.career,current=demo?(career.accepted.includes(DEMO_SAMPLE_JOB)?jobs[0]:null):careerCurrent(state);
 const [selectedId,setSelectedId]=useState(()=>demo?DEMO_SAMPLE_JOB:current?.id??careerNext(state)?.id??CAREER_JOBS[0]?.id??'');
 const [view,setView]=useState<'map'|'job'|'tools'|'ending'|'release'|'portfolio'>(demo?'job':careerRouteReady(career.completed)&&(!current||career.completed.includes(current.id))?(career.release.published&&career.ending?'ending':'release'):'map');
 const main=useRef<HTMLElement>(null);
 const [focusTarget,setFocusTarget]=useState<(CareerSourceTarget&{request:number;jobId:string})|null>(null);
 useEffect(()=>{
  if(!focusTarget)return;
  // Focus after the navigation scroll reset so opening a portfolio file reveals its code.
  const request=requestAnimationFrame(()=>{
   const input=main.current?.querySelector<HTMLElement>(focusTarget.file==='solution.js'?'[data-testid="career-js-editor"] textarea, .career-code > pre':'.career-editor textarea, .career-editor .career-readonly');
   if(!input)return;
   if(!(input instanceof HTMLTextAreaElement))input.setAttribute('tabindex','-1');
   input.focus();
   if(input instanceof HTMLTextAreaElement){const start=focusTarget.line?input.value.split('\n').slice(0,focusTarget.line-1).reduce((sum,line)=>sum+line.length+1,0):0;input.setSelectionRange(start,start);if(focusTarget.line)input.scrollTop=Math.max(0,(focusTarget.line-3)*24);}
  });
  return()=>cancelAnimationFrame(request);
 },[focusTarget]);
 const [listOpen,setListOpen]=useState(false),[tab,setTab]=useState<WorkTab>('files');
 const [selectedFiles,setSelectedFiles]=useState<Record<string,string>>({});
 const [codeModes,setCodeModes]=useState<Record<string,boolean>>({});
 const [codeDrafts,setCodeDrafts]=useState<Record<string,boolean>>({});
 const [draftCache,setDraftCache]=useState<Record<string,string>>({});
 const [hintLevels,setHintLevels]=useState<Record<string,number>>({}),[answerFor,setAnswerFor]=useState<string|null>(null);
 const [replies,setReplies]=useState<Record<string,string>>({}),[session,setSession]=useState(0);
 const [message,setMessage]=useState<'checkpoint'|'restore'|'length'|null>(null);
 const [impactEvent,setImpactEvent]=useState<CareerImpactEvent|null>(null);
 const appliedFocus=useRef<number|undefined>(undefined);
 const targetJobId=props.careerFileTarget?.jobId,targetFile=props.careerFileTarget?.file,targetRequestId=props.careerFileTarget?.requestId;
 // eslint-disable-next-line react-hooks/set-state-in-effect -- A parent tools request selects the permitted view once.
 useEffect(()=>{if(props.toolsRequest){setView(demo?'job':'tools');setListOpen(false);}},[props.toolsRequest,demo]);
 useEffect(()=>{if(main.current)main.current.scrollTop=0;},[view,selectedId]);
 const job=jobs.find(item=>item.id===selectedId)??current??jobs[0];
 const safeView=demo?'job':view;
 // eslint-disable-next-line react-hooks/set-state-in-effect -- A parent focus request selects the edition's active contract once.
 useEffect(()=>{if(!props.focusRequest){appliedFocus.current=undefined;return;}if(appliedFocus.current===props.focusRequest)return;appliedFocus.current=props.focusRequest;const progress=state.gameplay.career;const target=demo?jobs[0]:careerCurrent(state);const remaining=demo?jobs[0]:careerNext(state);setView(demo?'job':careerRouteReady(progress.completed)&&(!target||progress.completed.includes(target.id))?(progress.release.published?'ending':'release'):'job');if(target&&!progress.completed.includes(target.id))setSelectedId(target.id);else if(remaining)setSelectedId(remaining.id);setListOpen(false);},[props.focusRequest,state,demo,jobs]);
 // eslint-disable-next-line react-hooks/set-state-in-effect -- External accepted-contract changes update the local selection.
 useEffect(()=>{if(current?.id)setSelectedId(current.id);},[current?.id]);
 useEffect(()=>{
  if(!targetJobId||!targetFile||demo&&targetJobId!==DEMO_SAMPLE_JOB||!allowedCareerFile(targetJobId,targetFile))return;
  // eslint-disable-next-line react-hooks/set-state-in-effect -- A validated parent file-open request selects its contract and file atomically.
  setSelectedId(targetJobId);setSelectedFiles(previous=>({...previous,[targetJobId]:targetFile}));setCodeModes(previous=>({...previous,[targetJobId]:true}));setView('job');setTab('files');setListOpen(false);setMessage(null);setFocusTarget(previous=>({file:targetFile,jobId:targetJobId,request:(previous?.request??0)+1}));
 },[targetJobId,targetFile,targetRequestId,demo]);
 if(!job)return <div className="career-app career-empty" data-no-translate><p>{text('불러올 의뢰가 없어요.','There are no jobs to load.','読み込める依頼がありません。')}</p></div>;

 const files=careerFiles(state,job.id),file=selectedFiles[job.id]??Object.keys(job.files)[0]??'';
 const codeMode=demo||(codeModes[job.id]??(props.guided===false));
 const javascript=allowedCareerFile(job.id,'solution.js')&&careerCodeModeSafe(files)==='javascript',unsaved=javascript&&!!codeDrafts[job.id];
 const showSourceFile=javascript&&focusTarget?.jobId===job.id&&focusTarget.file!=='solution.js';
 const accepted=career.accepted.includes(job.id),inspected=career.inspected.includes(job.id),completed=career.completed.includes(job.id),unlocked=demo?isDemoCafeComplete(state):careerUnlocked(state,job);
 const evaluation=evaluateCareer(job.id,files),proof=career.proofs[job.id];
 const hasProof=!unsaved&&!!proof&&proof.hash===careerHash(files);
 const passed=!unsaved&&careerFresh(state,job.id)&&evaluation.passed;
 const secondScreen=!demo&&career.upgrades.includes('second-screen'),recovery=!demo&&career.upgrades.includes('recovery-kit');
 const next=demo?null:careerNext(state),allDone=demo?career.completed.includes(DEMO_SAMPLE_JOB):careerRouteReady(career.completed);
 const lockReason=()=>!state.gameplay.openingCelebrated?text('모노 카페의 OPEN 간판을 켜면 열려요.','Open Mono Cafe by turning on its OPEN sign first.','モノカフェのOPEN看板をつけると開きます。'):text(`앞선 각 구역에서 의뢰를 4개씩 골라 전달하면 열려요.`,`Choose and deliver four jobs in each earlier district to unlock this job.`,`前の各エリアで4件ずつ選んで提出すると開きます。`);
 const stages=[text('요청 읽기','Read request','依頼を読む'),text('문제 확인','Inspect','問題を確認'),text('수정과 검사','Edit and test','修正と検査'),text('고객 답장','Reply to client','お客さんへの返事'),text('전달 완료','Delivered','提出済み')];
 const phase=completed?4:!accepted?0:!inspected?1:passed?3:2;
 const selectJob=(id:string)=>{
  if(demo&&id!==DEMO_SAMPLE_JOB)return;
  setSelectedId(id);setView('job');setListOpen(false);setMessage(null);setTab('files');
  if(career.accepted.includes(id))onAction({type:'career-accept',id});
 };
 const test=()=>{if(accepted&&inspected&&!completed&&!unsaved){setImpactEvent(previous=>({jobId:job.id,sequence:(previous?.sequence??0)+1,kind:'test',hash:careerHash(files),recheck:passed}));onAction({type:'career-test',id:job.id});setTab('checks');setMessage(null);}};
 const deliver=()=>{if(passed&&job.choices.some(choice=>choice.id===replies[job.id])){setImpactEvent(previous=>({jobId:job.id,sequence:(previous?.sequence??0)+1,kind:'deliver',hash:careerHash(files),recheck:false}));onAction({type:'career-deliver',id:job.id,choice:replies[job.id]});}};
 const openFile=(id:string,target:CareerSourceTarget|null)=>{const saved=careerFiles(state,id),name=target?.file??(careerCodeModeSafe(saved)==='javascript'?'solution.js':Object.keys(CAREER_JOBS.find(item=>item.id===id)?.files??{})[0]);selectJob(id);setCodeModes(previous=>({...previous,[id]:true}));if(name){setSelectedFiles(previous=>({...previous,[id]:name}));setFocusTarget({...target,file:name,jobId:id,request:(focusTarget?.request??0)+1});}};
 const openNext=()=>{if(next)selectJob(next.id);else setView('job');};
 const savedReply=job.choices.find(choice=>choice.id===career.choices[job.id]);
 const actTitles=[text('동네의 첫 의뢰','Neighborhood requests','まちの最初の依頼'),text('함께 쓰는 도구','Shared tools','みんなで使う道具'),text('독립 작업실','Independent studio','独立した作業場')];
 const helper=(label:string,children:ReactNode)=><div className="career-help-section"><h3>{label}</h3>{children}</div>;

 return <div className={'career-app '+(listOpen?'list-open':'')} data-no-translate>
  <header className="career-app-header"><button type="button" className="career-list-toggle" aria-expanded={listOpen} aria-controls="career-job-list" onClick={()=>setListOpen(open=>!open)}>{text('의뢰 목록','Job list','依頼一覧')}</button><h1>{text('의뢰 관리','Job desk','依頼管理')}</h1>{!demo&&<button type="button" className="career-release-link" data-testid="career-release-button" onClick={()=>{setView('release');setListOpen(false);}}>{career.release.published?text('내 앱','My app','自分のアプリ'):text('최종 목표 · 내 첫 배포','Final goal · first release','最終目標 · 初公開')}</button>}<span>{demo?(career.completed.includes(DEMO_SAMPLE_JOB)?'1 / 1':'0 / 1'):careerRouteCount(career.completed)+' / 12'} {demo?text('첫 고객 의뢰','first client case','最初の顧客の依頼'):text('배포 준비','release progress','公開準備')}</span></header>
  <div className="career-app-layout">
   <nav id="career-job-list" className="career-job-list" aria-label={text('경력 의뢰 목록','Career jobs','仕事の依頼一覧')}>
    {(demo?[1] as const:[1,2,3] as const).map(act=><section key={act}><h2><span>{act}</span>{actTitles[act-1]}<small>{jobs.filter(item=>item.act===act&&career.completed.includes(item.id)).length} / {jobs.filter(item=>item.act===act).length}</small></h2>{jobs.filter(item=>item.act===act).map((item,index)=>{
     const done=career.completed.includes(item.id),open=demo?isDemoCafeComplete(state):careerUnlocked(state,item);
     return <button type="button" key={item.id} data-testid={'career-job-'+item.id} aria-current={view==='job'&&job.id===item.id?'page':undefined} className={(done?'delivered ':'')+(open?'':'locked')} onClick={()=>selectJob(item.id)}><span className="career-job-number">{done?'✓':String((act-1)*6+index+1).padStart(2,'0')}</span><span><strong>{localize(item.title)}</strong><small>{done?text('전달 완료','Delivered','提出済み'):open?localize(item.client):lockReason()}</small></span></button>;
    })}</section>)}
    {!demo&&<div className="career-list-footer"><button type="button" data-testid="career-map-button" aria-pressed={view==='map'} onClick={()=>{setView('map');setListOpen(false);}}>{text('동네 지도','Neighborhood map','まちの地図')}</button><button type="button" data-testid="career-portfolio-button" aria-pressed={view==='portfolio'} onClick={()=>{setView('portfolio');setListOpen(false);}}>{text('전달한 작업','Delivered work','提出した仕事')} <span>{career.completed.length}</span></button><button type="button" data-testid="career-tools-button" aria-pressed={view==='tools'} onClick={()=>{setView('tools');setListOpen(false);}}>{text('작업실 도구','Studio tools','作業場の道具')}</button><button type="button" data-testid="career-record-button" aria-pressed={view==='ending'} onClick={()=>{setView('ending');setListOpen(false);}}>{text('경력 기록','Career record','仕事の記録')}{allDone&&!career.ending&&<span>{text('새 이야기','New chapter','新しい物語')}</span>}</button></div>}
   </nav>
   <main className="career-main" ref={main}>
    {safeView==='portfolio'?<CareerPortfolio state={state} onJob={selectJob} onFile={(id,file)=>openFile(id,{file})} onMap={()=>setView('map')}/>:safeView==='release'?<ReleaseProject props={props} onLetter={()=>setView('ending')} onMap={()=>setView('map')}/>:safeView==='map'?<NeighborhoodMap state={state} onSelect={selectJob} onRelease={()=>setView(career.release.published?'ending':'release')}/>:safeView==='tools'?<section className="career-shop"><StudioScene upgrades={career.upgrades}/><span className="career-section-label">{text('작업실','Studio','作業場')}</span><h2>{text('필요한 도구를 골라 준비하세요.','Choose tools for your workspace.','作業場に必要な道具を選びましょう。')}</h2><p>{text('의뢰로 모은 게임 크레딧을 사용합니다. 구입한 도구는 계속 사용할 수 있어요.','Use game credits earned from jobs. Purchased tools remain available.','依頼で得たゲーム内クレジットを使います。購入した道具は使い続けられます。')}</p><strong className="career-balance">{text('보유','Available','所持')} {state.credits.toLocaleString()} cr</strong><div className="career-upgrades">{CAREER_UPGRADES.map(item=>{
     const owned=career.upgrades.includes(item.id),affordable=state.credits>=item.price;
     return <article key={item.id}><div><h3>{localize(item.name)}</h3><p>{localize(item.detail)}</p></div><button type="button" className="outline-button" data-testid={'career-upgrade-'+item.id} disabled={owned||!affordable||!state.gameplay.openingCelebrated} onClick={()=>onAction({type:'career-upgrade',id:item.id})}>{owned?text('사용 중','Owned','購入済み'):affordable?`${item.price} cr · ${text('구입','Buy','購入')}`:`${item.price} cr · ${text('크레딧 부족','Not enough credits','クレジット不足')}`}</button></article>;
    })}</div><button type="button" className="career-text-button" onClick={()=>setView('job')}>{text('선택한 의뢰로 돌아가기','Return to the selected job','選択した依頼に戻る')}</button></section>:safeView==='ending'?<CareerConclusion props={props} onMap={()=>setView('map')} onRelease={()=>setView('release')}/>:<>
     <header className="career-request"><div className="request-world-strip" aria-hidden="true"/><div className="career-request-meta"><span>{localize(job.client)}</span><span>+{job.credits} cr · +{job.xp} XP</span></div><h2>{localize(job.title)}</h2><p>{localize(job.brief)}</p><div className="career-stage" aria-live="polite"><span>{text('현재 단계','Current step','現在のステップ')}</span><strong>{stages[phase]}</strong></div>{demo&&<p className="demo-sample-location" data-testid="demo-sample-location">{text('의뢰 센터','Contracts','依頼センター')} → <code>{javascript?'solution.js':'pricing.json'}</code> · {completed?text('전달한 파일과 답장 보기','Review delivered files and reply','提出したファイルと返事を見る'):!accepted?text('아래에서 의뢰 수락','Accept the request below','下で依頼を受ける'):!inspected?text('현재 결과를 보고 문제 확인','Inspect the current output below','下で今の結果を確認する'):passed?text('아래에서 답장 선택 후 전달','Choose a reply below, then deliver','下で返事を選んで提出する'):text('파일에서 직접 수정 → 현재 파일 검사','Edit the source → Check current files','ファイルを直接修正 → 現在のファイルを検査')}</p>}</header>
     {!accepted?<section className="career-accept"><p>{unlocked?text('수락하면 고객의 파일이 내 PC에 들어옵니다. 실행 결과를 먼저 확인하고 직접 고쳐 보세요.','Accept to copy the client’s files to your PC. Inspect their output first, then make your changes.','受けるとお客さんのファイルがPCに届きます。まず実行結果を見て、自分で修正してください。'):lockReason()}</p><button type="button" className="primary-button" data-testid="career-accept" disabled={!unlocked} onClick={()=>onAction({type:'career-accept',id:job.id})}>{text('의뢰 수락 · 파일 받기','Accept job · get files','依頼を受ける · ファイルを取得')}</button>{!state.gameplay.openingCelebrated&&<button type="button" className="career-text-button" onClick={props.onFollow}>{text('모노 카페 이야기 이어 하기','Continue the Mono Cafe story','モノカフェの物語を続ける')}</button>}</section>:<>
      {!completed&&recovery&&<div className="career-recovery"><span>{text('복구 노트','Recovery notebook','復元ノート')}</span><button type="button" onClick={()=>{onAction({type:'career-checkpoint',id:job.id});setMessage('checkpoint');}}>{text('현재 파일 보관','Save checkpoint','現在のファイルを保存')}</button><button type="button" disabled={!career.checkpoints[job.id]} onClick={()=>{onAction({type:'career-restore',id:job.id});setSession(value=>value+1);setMessage('restore');}}>{text('보관한 파일 복원','Restore checkpoint','保存したファイルを復元')}</button></div>}
      {message&&<p className="career-local-notice" role="status">{message==='checkpoint'?text('현재 파일을 복구 노트에 보관했습니다.','Current files saved in the recovery notebook.','現在のファイルを復元ノートに保存しました。'):message==='restore'?text('보관한 파일을 복원했습니다. 검사를 다시 실행해 주세요.','Checkpoint restored. Run the checks again.','保存したファイルを復元しました。もう一度検査してください。'):text('파일은 20,000자까지 저장할 수 있어요.','Files can contain up to 20,000 characters.','ファイルは20,000文字まで保存できます。')}</p>}
      <CareerPlayground key={job.id+(inspected?"-work":"-inspect")} job={job} files={files} completed={completed} compact={inspected}/>{!inspected&&!completed?<section className="career-inspection"><p>{text('어떤 결과가 요청과 다른지 찾아보세요. 준비되면 파일을 여세요.','Find a result that differs from the request. Open the files when you are ready.','依頼と違う結果を探しましょう。準備ができたらファイルを開いてください。')}</p><button type="button" className="primary-button" data-testid="career-inspect" onClick={()=>{onAction({type:'career-inspect',id:job.id});setTab('files');}}>{text('문제 확인 · 파일 열기','Problem inspected · open files','問題を確認 · ファイルを開く')}</button></section>:<>
       <div className="career-work-toolbar"><WorkTabs tab={tab} onChange={setTab} text={text}/>{demo&&!completed&&<button type="button" className="outline-button" data-testid="demo-sample-locate" onClick={()=>{setTab('files');requestAnimationFrame(()=>{const input=main.current?.querySelector<HTMLTextAreaElement>(javascript?'[data-testid="career-js-editor"] textarea':'.career-editor textarea');if(!input)return;input.scrollIntoView({block:'center'});input.focus();const match=(javascript?/return\s+([^;\n}]+)/:/"packSize"\s*:\s*(\d+)/).exec(input.value);if(match){const start=match.index+match[0].lastIndexOf(match[1]);input.setSelectionRange(start,start+match[1].length);}});}}>{text('고칠 코드 위치로','Locate the code to edit','直すコードの場所へ')}</button>}{!completed&&<button type="button" className="primary-button" data-testid="career-test" disabled={unsaved} onClick={test}>{text('현재 파일 검사','Check current files','現在のファイルを検査')}</button>}</div>
       {completed?<div className="career-proof-status" role="status">{text('전달 완료 · 파일과 고객 답장을 다시 읽을 수 있습니다.','Delivered · you can revisit the files and client reply.','提出済み · ファイルとお客さんの返事を読み返せます。')}</div>:<CareerDiagnostic model={careerFeedback(job.id,files,evaluation,proof,unsaved)} language={language} onOpen={target=>openFile(job.id,target)} onChecks={()=>setTab('checks')}/>}
       {!demo&&<CareerImpact model={careerImpact(state,job.id,unsaved)} event={impactEvent} main={main} language={language} onShop={()=>{setView('tools');setListOpen(false);}}/>}
       {completed?<section className="career-client-reply delivery-receipt"><h3>{text('고객에게 보낸 답장','Your reply to the client','お客さんに送った返事')}</h3>{savedReply&&<><p>{localize(savedReply.label)}</p><blockquote><strong>{localize(job.client)}</strong><p>{localize(savedReply.reply)}</p></blockquote></>}{!demo&&<div className="career-next-paths"><button type="button" className="outline-button" data-testid="career-delivery-portfolio" onClick={()=>setView('portfolio')}>{text('전달한 작업 모아 보기','View delivered work','提出した仕事をまとめて見る')}</button>{(allDone||!next)&&<button type="button" className="outline-button" onClick={()=>setView('map')}>{text('다음 고객 직접 고르기','Choose your next client','次のお客さんを選ぶ')}</button>}<button type="button" className="outline-button" onClick={()=>props.onOpen('challenges')}>{text('선택 도전 · 코딩 연습실','Optional coding challenges','任意のコーディング挑戦')}</button></div>}{!demo&&<>{!allDone&&next?<><button type="button" className="primary-button" data-testid="career-delivery-map" onClick={()=>setView('map')}>{text('지도에서 다음 일감 둘러보기','Browse the map for your next job','地図で次の仕事を探す')}</button><button type="button" className="career-text-button" data-testid="career-delivery-next" onClick={openNext}>{text('추천 의뢰 바로 읽기','Read the suggested job now','おすすめの依頼をすぐ読む')} · {localize(next.title)}</button></>:<button type="button" className="primary-button" data-testid="career-final-project" onClick={()=>setView(career.release.published?'ending':'release')}>{career.release.published?text('마지막 편지 읽기','Read the final letter','最後の手紙を読む'):text('최종 프로젝트 시작하기','Start the final project','最後の作品を始める')}</button>}</>}{demo&&<button type="button" className="primary-button" data-testid="demo-sample-summary" onClick={props.onFollow}>{text('데모에서 해결한 일 돌아보기','Review your demo work','デモで解決した仕事を振り返る')}</button>}</section>:passed?<section className="career-client-reply"><h3>{text('고객에게 어떻게 답장할까요?','How will you reply to the client?','お客さんにどう返事しますか？')}</h3><fieldset><legend>{text('답장을 고른 뒤 전달하세요. 두 답장 모두 보상은 같고, 쌓인 답장이 마지막 편지에 남아요.','Choose a reply, then deliver. Both earn the same reward. Your replies shape the final letter.','返事を選んで提出してください。報酬は同じです。返事の積み重ねが最後の手紙に残ります。')}</legend>{job.choices.map(choice=><label key={choice.id}><input type="radio" name={'career-reply-'+job.id} value={choice.id} checked={replies[job.id]===choice.id} data-testid={'career-reply-'+choice.id} onChange={()=>setReplies(previous=>({...previous,[job.id]:choice.id}))}/><span>{localize(choice.label)}</span></label>)}</fieldset><button type="button" className="primary-button" data-testid="career-deliver" disabled={!job.choices.some(choice=>choice.id===replies[job.id])} onClick={deliver}>{text('수정한 파일과 답장 전달','Deliver files and reply','修正したファイルと返事を提出')}</button></section>:null}
       {!demo&&!completed&&!javascript&&<div className="career-learning-mode"><button type="button" className="outline-button" data-testid="career-code-mode" aria-pressed={!!codeMode} onClick={()=>{setCodeModes(previous=>({...previous,[job.id]:!(previous[job.id]??(props.guided===false))}));setTab('files');}}>{codeMode?text('한 부분씩 고치기','Fix one part at a time','1つずつ直す'):text('전체 코드 직접 편집','Edit full code','コード全体を編集')}</button><small>{text('두 방식 모두 같은 파일을 바꾸고 같은 보상을 받습니다.','Both ways edit the same files and earn the same rewards.','どちらも同じファイルを変更し、同じ報酬を得られます。')}</small></div>}
       <div className="career-work-panel" role="tabpanel" aria-label={stages[phase]}><div hidden={tab!=='files'}><div className={'career-editor-preview '+(secondScreen?'career-split':'')}><div className="career-edit-stack"><CareerCode key={'javascript-'+job.id} initialDraft={draftCache[job.id]} onDraftChange={draft=>setDraftCache(previous=>{if(previous[job.id]===draft||draft===null&&previous[job.id]===undefined)return previous;const next={...previous};if(draft===null)delete next[job.id];else next[job.id]=draft;return next;})} jobId={job.id} files={files} readOnly={completed} onMode={mode=>{onAction({type:'career-code-mode',id:job.id,mode});setTab('files');}} onEdit={(file,content)=>onAction({type:'career-edit',id:job.id,file,content})} onTest={test} hasProof={passed} onDirtyChange={dirty=>setCodeDrafts(previous=>previous[job.id]===dirty?previous:{...previous,[job.id]:dirty})}/>{javascript&&!showSourceFile?null:!completed&&!codeMode?<CareerLearning key={job.id} job={job} files={files} onEdit={(name,content)=>{onAction({type:'career-edit',id:job.id,file:name,content});setMessage(null);}} onTest={test} onCodeMode={()=>{setCodeModes(previous=>({...previous,[job.id]:true}));setTab('files');}}/>:<CareerEditor job={job} files={files} file={file} onFile={name=>setSelectedFiles(previous=>({...previous,[job.id]:name}))} onEdit={content=>{if(content.length>20000){setMessage('length');return;}onAction({type:'career-edit',id:job.id,file,content});setMessage(null);}} onTest={test} readOnly={completed} text={text} localize={localize} session={session}/>}</div>{secondScreen&&<PreviewResults evaluation={evaluation} text={text} localize={localize}/>}</div></div>{tab==='preview'?<PreviewResults evaluation={evaluation} text={text} localize={localize}/>:tab==='checks'?<CheckResults evaluation={evaluation} hasProof={hasProof} text={text} localize={localize}/>:null}</div>
       {!completed&&<aside className="career-help">{helper(text('도움말','Hints','ヒント'),<><div className="career-hint-buttons">{job.hints.map((_,index)=><button type="button" key={index} aria-pressed={hintLevels[job.id]===index+1} onClick={()=>setHintLevels(previous=>({...previous,[job.id]:previous[job.id]===index+1?0:index+1}))}>{text('힌트','Hint','ヒント')} {index+1}</button>)}</div>{!!hintLevels[job.id]&&<p>{localize(job.hints[hintLevels[job.id]-1])}</p>}</>)}<div className="career-answer"><button type="button" className="career-text-button" aria-expanded={answerFor===job.id} onClick={()=>setAnswerFor(answerFor===job.id?null:job.id)}>{answerFor===job.id?text('답안 닫기','Close example answer','解答例を閉じる'):text('답 보기','View an example answer','解答例を見る')}</button>{answerFor===job.id&&<div><p>{text('예시를 읽은 뒤 에디터에서 직접 수정하세요.','Read the example, then make the edits in the editor.','例を読んでからエディターで自分で修正してください。')}</p>{Object.entries(exampleSolution(job.id)).map(([name,source])=><div key={name}><strong>{name}</strong><pre>{source}</pre></div>)}</div>}</div></aside>}
      </>}
     </>}
    </>}
   </main>
  </div>
 </div>;
}
