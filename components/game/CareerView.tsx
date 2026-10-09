'use client';

import {useEffect,useRef,useState,type ReactNode} from 'react';
import {useLanguage,type Language} from '@/lib/game/i18n';
import {CAREER_JOBS,type CareerJob,type Localized} from '@/lib/game/career-content';
import {evaluateCareer,exampleSolution,type CareerEvaluation} from '@/lib/game/career-evaluation';
import {CAREER_UPGRADES,careerCurrent,careerFiles,careerFresh,careerHash,careerNext,careerUnlocked} from '@/lib/game/career';
import {NeighborhoodMap} from './NeighborhoodMap';
import {ReleaseProject} from './ReleaseProject';
import {CareerConclusion} from './CareerConclusion';
import {CareerLearning} from './CareerLearning';
import {StudioScene} from './StoryArt';
import {SmartCodeInput,type SmartCodeHandle} from './SmartCodeInput';
import type {GameProps} from './types';

type Text=(ko:string,en:string,ja:string)=>string;
type Localize=(value:Localized)=>string;
type WorkTab='files'|'preview'|'checks';

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
 const career=state.gameplay.career,current=careerCurrent(state);
 const [selectedId,setSelectedId]=useState(()=>current?.id??careerNext(state)?.id??CAREER_JOBS[0]?.id??'');
 const [view,setView]=useState<'map'|'job'|'tools'|'ending'|'release'>(career.completed.length===CAREER_JOBS.length?(career.release.published&&career.ending?'ending':'release'):'map');
 const main=useRef<HTMLElement>(null);
 useEffect(()=>{if(props.toolsRequest){setView('tools');setListOpen(false);}},[props.toolsRequest]);
 const [listOpen,setListOpen]=useState(false),[tab,setTab]=useState<WorkTab>('files');
 const [selectedFiles,setSelectedFiles]=useState<Record<string,string>>({});
 const [codeModes,setCodeModes]=useState<Record<string,boolean>>({});
 const [hintLevels,setHintLevels]=useState<Record<string,number>>({}),[answerFor,setAnswerFor]=useState<string|null>(null);
 const [replies,setReplies]=useState<Record<string,string>>({}),[session,setSession]=useState(0);
 const [message,setMessage]=useState<'checkpoint'|'restore'|'length'|null>(null);
 useEffect(()=>{if(main.current)main.current.scrollTop=0;},[view,selectedId]);
 const job=CAREER_JOBS.find(item=>item.id===selectedId)??current??CAREER_JOBS[0];
 useEffect(()=>{if(!props.focusRequest)return;const progress=props.state.gameplay.career;const target=careerCurrent(props.state);const remaining=careerNext(props.state);setView(progress.completed.length===CAREER_JOBS.length?(progress.release.published?'ending':'release'):'job');if(target&&!progress.completed.includes(target.id))setSelectedId(target.id);else if(remaining)setSelectedId(remaining.id);setListOpen(false);},[props.focusRequest]);
 useEffect(()=>{if(current?.id)setSelectedId(current.id);},[current?.id]);
 useEffect(()=>{
  const target=props.careerFileTarget;
  if(!target||!CAREER_JOBS.some(item=>item.id===target.jobId&&Object.hasOwn(item.files,target.file)))return;
  setSelectedId(target.jobId);setSelectedFiles(previous=>({...previous,[target.jobId]:target.file}));setCodeModes(previous=>({...previous,[target.jobId]:true}));setView('job');setTab('files');setListOpen(false);setMessage(null);
 },[props.careerFileTarget?.jobId,props.careerFileTarget?.file,props.careerFileTarget?.requestId]);
 if(!job)return <div className="career-app career-empty" data-no-translate><p>{text('불러올 의뢰가 없어요.','There are no jobs to load.','読み込める依頼がありません。')}</p></div>;

 const files=careerFiles(state,job.id),file=selectedFiles[job.id]??Object.keys(job.files)[0]??'';
 const accepted=career.accepted.includes(job.id),inspected=career.inspected.includes(job.id),completed=career.completed.includes(job.id),unlocked=careerUnlocked(state,job);
 const evaluation=evaluateCareer(job.id,files),proof=career.proofs[job.id];
 const hasProof=!!proof&&proof.hash===careerHash(files);
 const passed=careerFresh(state,job.id)&&evaluation.passed;
 const secondScreen=career.upgrades.includes('second-screen'),recovery=career.upgrades.includes('recovery-kit');
 const next=careerNext(state),allDone=CAREER_JOBS.every(item=>career.completed.includes(item.id));
 const lockReason=(item:CareerJob)=>!state.gameplay.openingCelebrated?text('모노 카페의 OPEN 간판을 켜면 열려요.','Open Mono Cafe by turning on its OPEN sign first.','モノカフェのOPEN看板をつけると開きます。'):text(`앞선 ${item.act-1}장 의뢰를 모두 전달하면 열려요.`,`Deliver all jobs in the first ${item.act-1} act${item.act===2?'':'s'} to unlock this job.`,`前の${item.act-1}章の依頼をすべて提出すると開きます。`);
 const stages=[text('요청 읽기','Read request','依頼を読む'),text('문제 확인','Inspect','問題を確認'),text('수정과 검사','Edit and test','修正と検査'),text('고객 답장','Reply to client','お客さんへの返事'),text('전달 완료','Delivered','提出済み')];
 const phase=completed?4:!accepted?0:!inspected?1:passed?3:2;
 const selectJob=(id:string)=>{
  setSelectedId(id);setView('job');setListOpen(false);setMessage(null);setTab('files');
  if(career.accepted.includes(id))onAction({type:'career-accept',id});
 };
 const test=()=>{if(accepted&&inspected&&!completed){onAction({type:'career-test',id:job.id});setTab('checks');setMessage(null);}};
 const openNext=()=>{if(next)selectJob(next.id);else setView('job');};
 const savedReply=job.choices.find(choice=>choice.id===career.choices[job.id]);
 const actTitles=[text('동네의 첫 의뢰','Neighborhood requests','まちの最初の依頼'),text('함께 쓰는 도구','Shared tools','みんなで使う道具'),text('독립 작업실','Independent studio','独立した作業場')];
 const helper=(label:string,children:ReactNode)=><div className="career-help-section"><h3>{label}</h3>{children}</div>;

 return <div className={'career-app '+(listOpen?'list-open':'')} data-no-translate>
  <header className="career-app-header"><button type="button" className="career-list-toggle" aria-expanded={listOpen} aria-controls="career-job-list" onClick={()=>setListOpen(open=>!open)}>{text('의뢰 목록','Job list','依頼一覧')}</button><h1>{text('의뢰 관리','Job desk','依頼管理')}</h1><button type="button" className="career-release-link" data-testid="career-release-button" onClick={()=>{setView('release');setListOpen(false);}}>{career.release.published?text('내 배포 기록','My release','公開記録'):text('최종 목표 · 내 첫 배포','Final goal · first release','最終目標 · 初公開')}</button><span>{career.completed.length} / {CAREER_JOBS.length} {text('전달','delivered','提出')}</span></header>
  <div className="career-app-layout">
   <nav id="career-job-list" className="career-job-list" aria-label={text('경력 의뢰 목록','Career jobs','仕事の依頼一覧')}>
    {([1,2,3] as const).map(act=><section key={act}><h2><span>{act}</span>{actTitles[act-1]}<small>{CAREER_JOBS.filter(item=>item.act===act&&career.completed.includes(item.id)).length} / {CAREER_JOBS.filter(item=>item.act===act).length}</small></h2>{CAREER_JOBS.filter(item=>item.act===act).map((item,index)=>{
     const done=career.completed.includes(item.id),open=careerUnlocked(state,item);
     return <button type="button" key={item.id} data-testid={'career-job-'+item.id} aria-current={view==='job'&&job.id===item.id?'page':undefined} className={(done?'delivered ':'')+(open?'':'locked')} onClick={()=>selectJob(item.id)}><span className="career-job-number">{done?'✓':String((act-1)*6+index+1).padStart(2,'0')}</span><span><strong>{localize(item.title)}</strong><small>{done?text('전달 완료','Delivered','提出済み'):open?localize(item.client):lockReason(item)}</small></span></button>;
    })}</section>)}
    <div className="career-list-footer"><button type="button" data-testid="career-map-button" aria-pressed={view==='map'} onClick={()=>{setView('map');setListOpen(false);}}>{text('동네 지도','Neighborhood map','まちの地図')}</button><button type="button" data-testid="career-tools-button" aria-pressed={view==='tools'} onClick={()=>{setView('tools');setListOpen(false);}}>{text('작업실 도구','Studio tools','作業場の道具')}</button><button type="button" data-testid="career-record-button" aria-pressed={view==='ending'} onClick={()=>{setView('ending');setListOpen(false);}}>{text('경력 기록','Career record','仕事の記録')}{allDone&&!career.ending&&<span>{text('새 이야기','New chapter','新しい物語')}</span>}</button></div>
   </nav>
   <main className="career-main" ref={main}>
    {view==='release'?<ReleaseProject props={props} onLetter={()=>setView('ending')} onMap={()=>setView('map')}/>:view==='map'?<NeighborhoodMap state={state} onSelect={selectJob} onRelease={()=>setView(career.release.published?'ending':'release')}/>:view==='tools'?<section className="career-shop"><StudioScene upgrades={career.upgrades}/><span className="career-section-label">{text('작업실','Studio','作業場')}</span><h2>{text('필요한 도구를 골라 준비하세요.','Choose tools for your workspace.','作業場に必要な道具を選びましょう。')}</h2><p>{text('의뢰로 모은 게임 크레딧을 사용합니다. 구입한 도구는 계속 사용할 수 있어요.','Use game credits earned from jobs. Purchased tools remain available.','依頼で得たゲーム内クレジットを使います。購入した道具は使い続けられます。')}</p><strong className="career-balance">{text('보유','Available','所持')} {state.credits.toLocaleString()} cr</strong><div className="career-upgrades">{CAREER_UPGRADES.map(item=>{
     const owned=career.upgrades.includes(item.id),affordable=state.credits>=item.price;
     return <article key={item.id}><div><h3>{localize(item.name)}</h3><p>{localize(item.detail)}</p></div><button type="button" className="outline-button" data-testid={'career-upgrade-'+item.id} disabled={owned||!affordable||!state.gameplay.openingCelebrated} onClick={()=>onAction({type:'career-upgrade',id:item.id})}>{owned?text('사용 중','Owned','購入済み'):affordable?`${item.price} cr · ${text('구입','Buy','購入')}`:`${item.price} cr · ${text('크레딧 부족','Not enough credits','クレジット不足')}`}</button></article>;
    })}</div><button type="button" className="career-text-button" onClick={()=>setView('job')}>{text('선택한 의뢰로 돌아가기','Return to the selected job','選択した依頼に戻る')}</button></section>:view==='ending'?<CareerConclusion props={props} onMap={()=>setView('map')} onRelease={()=>setView('release')}/>:<>
     <header className="career-request"><div className="request-world-strip" aria-hidden="true"/><div className="career-request-meta"><span>{localize(job.client)}</span><span>+{job.credits} cr · +{job.xp} XP</span></div><h2>{localize(job.title)}</h2><p>{localize(job.brief)}</p><div className="career-stage" aria-live="polite"><span>{text('현재 단계','Current step','現在のステップ')}</span><strong>{stages[phase]}</strong></div></header>
     {!accepted?<section className="career-accept"><p>{unlocked?text('수락하면 고객의 파일이 내 PC에 들어옵니다. 실행 결과를 먼저 확인하고 직접 고쳐 보세요.','Accept to copy the client’s files to your PC. Inspect their output first, then make your changes.','受けるとお客さんのファイルがPCに届きます。まず実行結果を見て、自分で修正してください。'):lockReason(job)}</p><button type="button" className="primary-button" data-testid="career-accept" disabled={!unlocked} onClick={()=>onAction({type:'career-accept',id:job.id})}>{text('의뢰 수락 · 파일 받기','Accept job · get files','依頼を受ける · ファイルを取得')}</button>{!state.gameplay.openingCelebrated&&<button type="button" className="career-text-button" onClick={props.onFollow}>{text('모노 카페 이야기 이어 하기','Continue the Mono Cafe story','モノカフェの物語を続ける')}</button>}</section>:<>
      {!completed&&recovery&&<div className="career-recovery"><span>{text('복구 노트','Recovery notebook','復元ノート')}</span><button type="button" onClick={()=>{onAction({type:'career-checkpoint',id:job.id});setMessage('checkpoint');}}>{text('현재 파일 보관','Save checkpoint','現在のファイルを保存')}</button><button type="button" disabled={!career.checkpoints[job.id]} onClick={()=>{onAction({type:'career-restore',id:job.id});setSession(value=>value+1);setMessage('restore');}}>{text('보관한 파일 복원','Restore checkpoint','保存したファイルを復元')}</button></div>}
      {message&&<p className="career-local-notice" role="status">{message==='checkpoint'?text('현재 파일을 복구 노트에 보관했습니다.','Current files saved in the recovery notebook.','現在のファイルを復元ノートに保存しました。'):message==='restore'?text('보관한 파일을 복원했습니다. 검사를 다시 실행해 주세요.','Checkpoint restored. Run the checks again.','保存したファイルを復元しました。もう一度検査してください。'):text('파일은 20,000자까지 저장할 수 있어요.','Files can contain up to 20,000 characters.','ファイルは20,000文字まで保存できます。')}</p>}
      {!inspected&&!completed?<section className="career-inspection"><PreviewResults evaluation={evaluation} text={text} localize={localize}/><p>{text('어떤 결과가 요청과 다른지 찾아보세요. 준비되면 파일을 여세요.','Find a result that differs from the request. Open the files when you are ready.','依頼と違う結果を探しましょう。準備ができたらファイルを開いてください。')}</p><button type="button" className="primary-button" data-testid="career-inspect" onClick={()=>{onAction({type:'career-inspect',id:job.id});setTab('files');}}>{text('문제 확인 · 파일 열기','Problem inspected · open files','問題を確認 · ファイルを開く')}</button></section>:<>
       <div className="career-work-toolbar"><WorkTabs tab={tab} onChange={setTab} text={text}/>{!completed&&<button type="button" className="primary-button" data-testid="career-test" onClick={test}>{text('현재 파일 검사','Check current files','現在のファイルを検査')}</button>}</div>
       <div className="career-proof-status" role="status">{completed?text('전달 완료 · 파일과 고객 답장을 다시 읽을 수 있습니다.','Delivered · you can revisit the files and client reply.','提出済み · ファイルとお客さんの返事を読み返せます。'):passed?text('현재 파일의 모든 검사 통과 · 고객에게 답장하고 전달하세요.','All current checks passed · reply to the client and deliver.','現在の検査はすべて通過 · お客さんに返事をして提出しましょう。'):hasProof?text('다시 고칠 항목이 있어요. 실패한 검사의 기대 결과와 실제 결과를 비교하세요.','Some checks need a fix. Compare the expected and actual results of failed checks.','修正する項目があります。失敗した検査の期待する結果と実際の結果を比べてください。'):text('파일을 직접 고친 뒤 검사하세요. 수정하면 검사 기록도 새로 필요합니다.','Edit the files, then run the checks. Each edit needs a fresh check.','ファイルを自分で修正し、検査してください。編集するたびに新しい検査が必要です。')}</div>
       {!completed&&<div className="career-learning-mode"><button type="button" className="outline-button" data-testid="career-code-mode" aria-pressed={!!codeModes[job.id]} onClick={()=>{setCodeModes(previous=>({...previous,[job.id]:!previous[job.id]}));setTab('files');}}>{codeModes[job.id]?text('한 부분씩 고치기','Fix one part at a time','1つずつ直す'):text('전체 코드 직접 편집','Edit full code','コード全体を編集')}</button><small>{text('두 방식 모두 같은 파일을 바꾸고 같은 보상을 받습니다.','Both ways edit the same files and earn the same rewards.','どちらも同じファイルを変更し、同じ報酬を得られます。')}</small></div>}
       <div className="career-work-panel" role="tabpanel" aria-label={stages[phase]}><div hidden={tab!=='files'}>{!completed&&!codeModes[job.id]?<CareerLearning key={job.id} job={job} files={files} onEdit={(name,content)=>{onAction({type:'career-edit',id:job.id,file:name,content});setMessage(null);}} onTest={test} onCodeMode={()=>{setCodeModes(previous=>({...previous,[job.id]:true}));setTab('files');}}/>:<div className={'career-editor-preview '+(secondScreen?'career-split':'')}><CareerEditor job={job} files={files} file={file} onFile={name=>setSelectedFiles(previous=>({...previous,[job.id]:name}))} onEdit={content=>{if(content.length>20000){setMessage('length');return;}onAction({type:'career-edit',id:job.id,file,content});setMessage(null);}} onTest={test} readOnly={completed} text={text} localize={localize} session={session}/>{secondScreen&&<PreviewResults evaluation={evaluation} text={text} localize={localize}/>}</div>}</div>{tab==='preview'?<PreviewResults evaluation={evaluation} text={text} localize={localize}/>:tab==='checks'?<CheckResults evaluation={evaluation} hasProof={hasProof} text={text} localize={localize}/>:null}</div>
       {!completed&&<aside className="career-help">{helper(text('도움말','Hints','ヒント'),<><div className="career-hint-buttons">{job.hints.map((_,index)=><button type="button" key={index} aria-pressed={hintLevels[job.id]===index+1} onClick={()=>setHintLevels(previous=>({...previous,[job.id]:index+1}))}>{text('힌트','Hint','ヒント')} {index+1}</button>)}</div>{!!hintLevels[job.id]&&<p>{localize(job.hints[hintLevels[job.id]-1])}</p>}</>)}<div className="career-answer"><button type="button" className="career-text-button" aria-expanded={answerFor===job.id} onClick={()=>setAnswerFor(answerFor===job.id?null:job.id)}>{answerFor===job.id?text('답안 닫기','Close example answer','解答例を閉じる'):text('답 보기','View an example answer','解答例を見る')}</button>{answerFor===job.id&&<div><p>{text('예시를 읽은 뒤 에디터에서 직접 수정하세요.','Read the example, then make the edits in the editor.','例を読んでからエディターで自分で修正してください。')}</p>{Object.entries(exampleSolution(job.id)).map(([name,source])=><div key={name}><strong>{name}</strong><pre>{source}</pre></div>)}</div>}</div></aside>}
       {completed?<section className="career-client-reply delivery-receipt"><div className="delivery-stamp"><span>✓</span><div><strong>{text('전달 완료','DELIVERED','提出完了')}</strong><small>+{job.credits} cr · +{job.xp} XP</small></div></div><h3>{text('고객에게 보낸 답장','Your reply to the client','お客さんに送った返事')}</h3>{savedReply&&<><p>{localize(savedReply.label)}</p><blockquote><strong>{localize(job.client)}</strong><p>{localize(savedReply.reply)}</p></blockquote></>}{next?<button type="button" className="primary-button" onClick={openNext}>{text('다음 의뢰 읽기','Read the next job','次の依頼を読む')}</button>:<button type="button" className="primary-button" data-testid="career-final-project" onClick={()=>setView(career.release.published?'ending':'release')}>{career.release.published?text('마지막 편지 읽기','Read the final letter','最後の手紙を読む'):text('최종 프로젝트 시작하기','Start the final project','最後の作品を始める')}</button>}</section>:passed?<section className="career-client-reply"><h3>{text('고객에게 어떻게 답장할까요?','How will you reply to the client?','お客さんにどう返事しますか？')}</h3><fieldset><legend>{text('답장을 고른 뒤 전달하세요. 두 답장 모두 보상은 같고, 쌓인 답장이 마지막 편지에 남아요.','Choose a reply, then deliver. Both earn the same reward. Your replies shape the final letter.','返事を選んで提出してください。報酬は同じです。返事の積み重ねが最後の手紙に残ります。')}</legend>{job.choices.map(choice=><label key={choice.id}><input type="radio" name={'career-reply-'+job.id} value={choice.id} checked={replies[job.id]===choice.id} data-testid={'career-reply-'+choice.id} onChange={()=>setReplies(previous=>({...previous,[job.id]:choice.id}))}/><span>{localize(choice.label)}</span></label>)}</fieldset><button type="button" className="primary-button" data-testid="career-deliver" disabled={!job.choices.some(choice=>choice.id===replies[job.id])} onClick={()=>onAction({type:'career-deliver',id:job.id,choice:replies[job.id]})}>{text('수정한 파일과 답장 전달','Deliver files and reply','修正したファイルと返事を提出')}</button></section>:null}
      </>}
     </>}
    </>}
   </main>
  </div>
 </div>;
}
