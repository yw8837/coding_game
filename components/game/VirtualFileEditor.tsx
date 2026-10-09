'use client';

import {useEffect,useRef,useState} from 'react';
import {FileCode2,Terminal,Play} from 'lucide-react';
import {useLanguage} from '@/lib/game/i18n';
import {LAB_JOBS} from '@/lib/game/code-lab';
import {labInputPath,labSourcePath,labTestPath} from '@/lib/game/code-lab-terminal';
import {RELEASE_ROOT} from '@/lib/game/release';
import {SmartCodeInput,type SmartCodeHandle} from './SmartCodeInput';
import type {GameProps} from './types';

/** Absolute editor targets use the canonical local virtual filesystem, including deletions. */
export function VirtualFileEditor({state,onAction,onCommand,onOpen,editorTarget}:GameProps){
 const language=useLanguage(),tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[language];
 const [path,setPath]=useState(editorTarget?.file??''),[notice,setNotice]=useState<string|null>(null);
 const smart=useRef<SmartCodeHandle>(null),numbers=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(editorTarget?.file.startsWith('/')){setPath(editorTarget.file);setNotice(null);}},[editorTarget?.file,editorTarget?.token]);
 const files=state.machines.local.files,exists=Object.hasOwn(files,path),content=exists?files[path]:'',folder=path.slice(0,path.lastIndexOf('/'))||'/',prefix=folder==='/'?'/':folder+'/',name=path.slice(path.lastIndexOf('/')+1);
 const siblings=Object.keys(files).filter(file=>file.startsWith(prefix)&&!file.slice(prefix.length).includes('/')).sort();
 const readOnly=state.gameplay.career.completed.some(id=>path.startsWith('/home/dev/jobs/'+id+'/'))||!!state.gameplay.career.release.published&&path.startsWith(RELEASE_ROOT+'/');
 const labJob=LAB_JOBS.find(job=>path===labSourcePath(job.id));
 const suite=labJob?labTestPath(labJob.id):null;
 const canTest=exists&&!readOnly&&!!suite&&Object.hasOwn(files,suite),limit=LAB_JOBS.some(job=>path===labInputPath(job.id))?4000:name.endsWith('.js')?12000:60000;
 const edit=(value:string)=>{if(!exists||readOnly)return;if(value.length>limit){setNotice(tr(`이 파일은 ${limit.toLocaleString()}자까지 저장할 수 있습니다.`,`This file can contain at most ${limit.toLocaleString()} characters.`,`このファイルは${limit.toLocaleString()}文字まで保存できます。`));return;}onAction({type:'genericfile-edit',path,content:value});setNotice(null);};
 const test=()=>{if(canTest&&suite){onCommand('node --test '+suite);onOpen('terminal');}else setNotice(tr('이 파일의 검사는 터미널에서 해당 명령을 직접 입력해 주세요.','Type the appropriate test command in the terminal for this file.','このファイルの検査コマンドはターミナルに直接入力してください。'));};
 return <div className="virtual-file-editor" data-testid="virtual-file-editor" data-no-translate>
  <header className="virtual-editor-header"><div><FileCode2 size={19}/><strong>{name||tr('파일','File','ファイル')}</strong><span>{exists?(readOnly?tr('읽기 전용','Read only','読み取り専用'):tr('자동 저장','Autosaved','自動保存')):tr('파일 없음','File missing','ファイルなし')}</span></div><button type="button" data-testid="virtual-file-terminal" onClick={()=>onOpen('terminal')}><Terminal size={15}/>{tr('터미널로 돌아가기','Back to terminal','ターミナルへ戻る')}</button></header>
  <p className="virtual-editor-path" data-testid="virtual-file-path">{path}</p>
  <nav className="virtual-editor-files" aria-label={tr('같은 폴더의 파일','Files in this folder','同じフォルダーのファイル')}>{siblings.map(file=><button type="button" key={file} data-testid={'virtual-file-'+file.slice(prefix.length)} aria-pressed={path===file} onClick={()=>{setPath(file);setNotice(null);}}>{file.slice(prefix.length)}</button>)}</nav>
  {notice&&<p className="virtual-editor-notice" role="status">{notice}</p>}
  {!exists?<section className="virtual-editor-missing" role="status"><h2>{tr('이 파일이 없거나 이동됐습니다.','This file is missing or was moved.','このファイルは存在しないか移動されました。')}</h2><p>{tr('열린 화면에 옛 내용을 남기지 않습니다. 위 목록에서 다른 파일을 고르거나 터미널에서 ls로 확인하세요.','The editor does not retain old contents. Choose another file above or inspect the folder with ls in the terminal.','古い内容は表示しません。上の一覧で別のファイルを選ぶか、ターミナルのlsで確認してください。')}</p><button type="button" onClick={()=>onOpen('terminal')}>{tr('터미널 열기','Open terminal','ターミナルを開く')}</button></section>:<>
   {readOnly?<p className="virtual-editor-notice">{tr('전달·배포한 파일은 읽기 전용입니다. 실험하려면 터미널에서 다른 폴더로 복사해 주세요.','Delivered or released files are read only. Copy them to another folder in the terminal to experiment.','提出・公開済みファイルは読み取り専用です。試すにはターミナルで別フォルダーへコピーしてください。')}</p>:<div className="virtual-editor-tools"><button type="button" onClick={()=>smart.current?.undo()}>{tr('실행 취소','Undo','元に戻す')}</button><button type="button" onClick={()=>smart.current?.redo()}>{tr('다시 실행','Redo','やり直す')}</button><button type="button" data-testid="virtual-editor-complete" onClick={()=>smart.current?.complete()}>{tr('자동완성','Complete','補完')}</button><span>Ctrl + Space · Tab · Ctrl / ⌘ + Enter</span></div>}
   <div className="virtual-code-surface"><div className="virtual-line-numbers" ref={numbers} aria-hidden="true">{content.split('\n').map((_,i)=><div key={i}>{i+1}</div>)}</div><div className="virtual-code-input" data-testid="virtual-file-source">{readOnly?<pre>{content}</pre>:<SmartCodeInput ref={smart} file={path} value={content} onChange={edit} onTest={test} onScroll={event=>{if(numbers.current)numbers.current.scrollTop=event.currentTarget.scrollTop;}}/>}</div></div>
   <footer className="virtual-editor-footer"><span>{content.length.toLocaleString()} / {limit.toLocaleString()} · {tr('가상 로컬 파일','Virtual local file','仮想ローカルファイル')}</span>{canTest&&<button type="button" data-testid="virtual-editor-test" onClick={test}><Play size={14}/>{tr('터미널에서 검사 실행','Run tests in terminal','ターミナルで検査を実行')}</button>}</footer>
   <section className="virtual-editor-test-note"><p>{canTest?tr('Ctrl+Enter는 실제 node --test 명령을 터미널에 보냅니다. Node가 설치되어 있어야 합니다. 실패한 입력·기대값·실제값은 터미널 출력에서 확인하세요.','Ctrl+Enter sends the actual node --test command to the terminal. Node must be installed. Inspect failed inputs, expected values and actual values in its output.','Ctrl+Enterは実際のnode --testをターミナルに送ります。Nodeのインストールが必要です。失敗した入力・期待値・実際の値はターミナル出力で確認してください。'):tr('입력 JSON과 검사 파일도 실제 저장소에 저장됩니다. 실행·검사는 터미널에서 명령을 직접 입력하세요.','Input JSON and test files also save to the actual virtual filesystem. Type run and test commands directly in the terminal.','入力JSONとテストファイルも実際の仮想ファイルに保存します。実行・検査コマンドはターミナルへ直接入力してください。')}</p>{state.machine!=='local'&&<p>{tr('현재 터미널은 서버에 연결되어 있습니다. 이 편집기는 내 PC 파일을 표시합니다. 로컬에서 검사하려면 터미널에서 exit를 입력하세요.','The terminal is connected to the server; this editor shows your local PC files. Type exit in the terminal to test locally.','現在のターミナルはサーバー接続中。このエディターは自分のPCのファイルです。ローカルで検査するにはexitを入力してください。')}</p>}</section>
  </>}
 </div>;
}
