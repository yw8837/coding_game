'use client';
import {useState} from 'react';
import {Monitor,Folder,FolderOpen,FileText,FileCode,ChevronRight,Check,Download,Package,Play,Globe,TerminalSquare,HardDrive,ArrowLeft} from 'lucide-react';
import {useLanguage} from '@/lib/game/i18n';
import {editionAllowsProject} from '@/lib/game/edition';
import {DemoBoundary} from './DemoBoundary';
import {dirtyFiles,projectFiles} from '@/lib/game/engine';
import {runSetupStep,setupReadiness,type SetupStep} from '@/lib/game/setup';
import {CAREER_JOBS} from '@/lib/game/career-content';
import {careerFiles,careerRoot} from '@/lib/game/career';
import type {GameProps} from './types';

export function ComputerView(props:GameProps){
 const {state,onOpen,onCommand,onNavigate}=props,language=useLanguage();
 const tr=(ko:string,en:string,ja:string)=>language==='ko'?ko:language==='en'?en:ja;
 const [tab,setTab]=useState<'pc'|'project'|'jobs'>('project'),[failure,setFailure]=useState('');
 const ready=setupReadiness(state),files=projectFiles(state),edited=new Set(dirtyFiles(state));
 const allowed=state.accepted&&state.discovered.repo;
 // First job only: softly point at the file the client's message is about, until it is opened or edited.
 const hintFile=!state.gameplay.fileHintSeen&&state.mission===0&&state.accepted&&!state.completed.includes(0)&&!edited.has('index.html')?'index.html':null;
 const projectName=state.repo?.root.split('/').at(-1)??'menu-site';
 const fileType=(file:string)=>{
  if(file.endsWith('.html'))return tr('웹페이지 구조','Page structure','ページの構造');
  if(file.endsWith('.css'))return tr('색상과 배치','Colors and layout','色とレイアウト');
  if(file.endsWith('.js'))return tr('동작과 계산','Behavior and calculations','動きと計算');
  if(file.endsWith('.py'))return tr('주문 서버','Order server','注文サーバー');
  if(file.endsWith('.json'))return tr('프로젝트 설정','Project settings','プロジェクト設定');
  return tr('텍스트 문서','Text document','テキスト文書');
 };
 const openFile=(file:string)=>{
  const open=(props as GameProps&{openFile?:(file:string)=>void}).openFile;
  if(open)open(file);else onOpen('editor');
 };
 const perform=(step:SetupStep)=>{
  if(!allowed)return;
  const result=runSetupStep(state,step,props.edition);
  for(const command of result.commands)onCommand(command);
  setFailure(result.error?result.output:'');
 };
 const steps=[
  {id:'copy' as const,Icon:Download,done:ready.copied,enabled:allowed,title:tr('프로젝트 복사','Copy project','プロジェクトをコピー'),description:tr('지우가 보낸 카페 파일을 내 PC에 가져와요.','Bring Jiwoo’s cafe files to your PC.','ジウのカフェのファイルをPCにコピーします。')},
  {id:'prepare' as const,Icon:Package,done:ready.prepared,enabled:allowed&&ready.copied,title:tr('준비물 받기','Prepare tools','必要なものをそろえる'),description:tr('사이트를 켤 Node와 npm, 필요한 파일을 준비해요.','Set up Node, npm and the files needed to run the site.','サイトを動かすNode、npmと必要なファイルをそろえます。')},
  {id:'preview' as const,Icon:Play,done:ready.preview,enabled:allowed&&ready.prepared,title:tr('미리보기 켜기','Start preview','プレビューを起動'),description:tr('내 파일로 카페 사이트를 켜요. 바꾸면 화면에도 반영돼요.','Run the cafe site from your files. Edits appear in the preview.','自分のファイルでサイトを起動します。編集が画面にも反映されます。')},
 ];
 const names=Object.keys(files).sort((a,b)=>a.localeCompare(b));
 if(state.repo&&!editionAllowsProject(props.edition,state.repo.root))return <DemoBoundary/>;
 return <div className="computer-view" data-no-translate>
  <div className="computer-toolbar">
   <button className="computer-back" onClick={()=>setTab('pc')} disabled={tab==='pc'} aria-label={tr('내 PC로 이동','Go to This PC','PCに移動')}><ArrowLeft size={16}/></button>
   <div className="computer-address"><Monitor size={17}/><button onClick={()=>setTab('pc')}>{tr('내 PC','This PC','PC')}</button>{tab==='project'&&<><ChevronRight size={14}/><Folder size={16}/><span>{projectName}</span></>}</div>
   <button className="outline-button" disabled={!ready.preview} onClick={()=>onNavigate('http://localhost:5173')}><Globe size={16}/>{tr('사이트 열기','Open site','サイトを開く')}</button>
  </div>
  <div className="computer-layout">
   <nav className="computer-sidebar" aria-label={tr('파일 탐색','File navigation','ファイルのナビゲーション')}>
    <button className={tab==='pc'?'selected':''} onClick={()=>setTab('pc')} aria-pressed={tab==='pc'}><Monitor size={18}/>{tr('내 PC','This PC','PC')}</button>
    <button className={tab==='project'?'selected':''} onClick={()=>setTab('project')} aria-pressed={tab==='project'}><Folder size={18}/>{tr('프로젝트','Project','プロジェクト')}</button>
    {props.edition!=='demo'&&state.gameplay.openingCelebrated&&<button className={tab==='jobs'?'selected':''} onClick={()=>setTab('jobs')} aria-pressed={tab==='jobs'}><Folder size={18}/>{tr('고객 의뢰','Client jobs','顧客の依頼')}</button>}
    <button onClick={()=>onOpen('terminal')}><TerminalSquare size={18}/>{tr('터미널','Terminal','ターミナル')}</button>
   </nav>
   <div className="computer-content">
    {props.edition!=='demo'&&tab==='jobs'&&<section className="computer-files"><h2>{tr('고객 의뢰 파일','Client job files','顧客の依頼ファイル')}</h2><p>/home/dev/jobs</p>{state.gameplay.career.accepted.length===0&&<button className="primary-button" onClick={()=>onOpen('career')}>{tr('의뢰 센터 열기','Open Contracts','依頼センターを開く')}</button>}{CAREER_JOBS.filter(j=>state.gameplay.career.accepted.includes(j.id)).map(job=><div key={job.id}><h3>{job.title[language]}</h3><p>{careerRoot(job.id)}</p>{Object.keys(careerFiles(state,job.id)).map(file=><button key={file} className="computer-file-row" onClick={()=>{if(props.openCareerFile)props.openCareerFile(job.id,file);else{props.onAction({type:'career-accept',id:job.id});onOpen('career');}}}><span><FileCode size={19}/>{file}</span><span>{tr('의뢰 센터에서 열기','Open in Contracts','依頼センターで開く')}</span></button>)}</div>)}</section>}

    {!ready.ready&&<section className="computer-setup" aria-label={tr('카페 사이트 준비','Prepare the cafe site','カフェのサイトを準備')}>
     <div className="computer-setup-heading"><FolderOpen size={28}/><div><h2>{tr('카페 사이트 준비','Prepare the cafe site','カフェのサイトを準備')}</h2><p>{tr('세 버튼을 차례로 누르면 시작할 수 있어요.','Use these three buttons in order to get started.','三つのボタンを順番に押すと始められます。')}</p></div></div>
     <p className="computer-concept">{tr('프로젝트는 사이트를 만드는 파일 묶음이에요. 폴더는 그 파일을 모아 두는 곳이에요.','A project is a set of files that make a site. A folder keeps those files together.','プロジェクトはサイトを作るファイルの集まりです。フォルダーにそのファイルをまとめます。')}</p>
     {!allowed&&<div className="computer-setup-gate"><p>{tr('지우의 의뢰를 수락하고, 보내 준 CatHub 프로젝트를 먼저 열어 주세요.','Accept Jiwoo’s request and open the CatHub project first.','ジウの依頼を受け、送られたCatHubのプロジェクトを先に開いてください。')}</p><button className="outline-button" onClick={props.onFollow}>{tr('지금 할 일 열기','Open current task','今の作業を開く')}</button></div>}
     <ol className="computer-setup-steps">{steps.map(({id,Icon,done,enabled,title,description},i)=><li key={id} className={done?'done':enabled?'available':'locked'}>
      <span className="computer-step-number">{done?<Check size={18}/>:i+1}</span><div><h3>{title}</h3><p>{description}</p><small>{done?tr('완료','Done','完了'):enabled?tr('시작할 수 있어요','Ready to start','開始できます'):tr('앞 단계를 먼저 완료해 주세요','Finish the previous step first','前のステップを先に終えてください')}</small></div>
      <button className={done?'outline-button':'primary-button'} disabled={done||!enabled} onClick={()=>perform(id)}><Icon size={17}/>{done?tr('완료','Done','完了'):title}</button>
     </li>)}</ol>
     {failure&&<div className="computer-setup-error" role="alert"><strong>{tr('실행을 마치지 못했어요. 아래 내용을 확인해 주세요.','This step could not finish. Check the message below.','実行を完了できませんでした。下の内容を確認してください。')}</strong><pre>{failure}</pre><button className="outline-button" onClick={()=>onOpen('terminal')}>{tr('터미널 기록 보기','View terminal history','ターミナルの履歴を見る')}</button></div>}
     <p className="computer-setup-note">{tr('설치는 게임 속 PC에서 실행돼요. 실행한 명령은 터미널 기록에 남아요.','Setup runs on the game’s PC. Each command appears in terminal history.','インストールはゲーム内のPCで実行されます。コマンドはターミナルの履歴に残ります。')}</p>
    </section>}
    {tab==='pc'&&<section className="computer-devices"><h2>{tr('폴더와 드라이브','Folders and drives','フォルダーとドライブ')}</h2><button className="computer-drive" onClick={()=>setTab('project')}><HardDrive size={37}/><span><strong>{tr('내 프로젝트','My project','自分のプロジェクト')}</strong><small>{ready.copied?projectName:tr('프로젝트를 복사하면 여기에 생겨요.','Your project appears here after you copy it.','コピーしたプロジェクトがここに表示されます。')}</small></span><ChevronRight size={18}/></button></section>}
    {tab==='project'&&ready.copied&&<section className="computer-files" aria-label={tr('프로젝트 파일','Project files','プロジェクトのファイル')}>
     <div className="computer-files-heading"><div><h2><FolderOpen size={23}/>{projectName}</h2><p>{tr('파일을 누르면 에디터에서 열려요.','Select a file to open it in the editor.','ファイルを押すとエディターで開きます。')}</p></div><span className={'computer-preview-status '+(ready.preview?'running':'')}><i/>{ready.preview?tr('미리보기 실행 중','Preview running','プレビュー実行中'):tr('미리보기 꺼짐','Preview stopped','プレビュー停止中')}</span></div>
     <div className="computer-file-table"><div className="computer-file-columns" aria-hidden="true"><span>{tr('이름','Name','名前')}</span><span>{tr('역할','Purpose','役割')}</span><span>{tr('상태','Status','状態')}</span></div>{names.map(file=><button className={'computer-file-row'+(file===hintFile?' file-hint-glow':'')} key={file} onClick={()=>{if(file===hintFile)props.onAction({type:'file-hint-seen'});openFile(file);}} aria-label={tr(file+' 열기','Open '+file,file+'を開く')}><span>{/\.(html|css|js|py|json)$/.test(file)?<FileCode size={19}/>:<FileText size={19}/>}<strong>{file}</strong>{file===hintFile&&<em className="file-hint-badge">{tr('여기부터!','Start here!','ここから！')}</em>}</span><span>{fileType(file)}</span><span className={edited.has(file)?'edited':''}>{edited.has(file)?tr('수정됨','Edited','変更あり'):tr('저장됨','Saved','保存済み')}</span></button>)}</div>
     <div className="computer-files-footer"><span>{names.length} {tr('개 파일','files','個のファイル')}</span><span>{tr('미리보기는 브라우저에서 사이트가 어떻게 보이는지 확인하는 화면이에요.','The preview shows how your site looks in the browser.','プレビューではブラウザーでのサイトの見た目を確認できます。')}</span></div>
    </section>}
   </div>
  </div>
 </div>;
}
