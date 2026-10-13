import type {GameState} from './engine.ts';
import {OPS_JOBS,opsFolder,opsJob,opsJobs,opsDataFiles} from './ops-content.ts';
import {opsHash,opsJobUnlocked,opsTrackUnlocked} from './ops.ts';
import {LAB_JOBS,type LabId} from './code-lab.ts';
import {labSourcePath,labInputPath,labTestPath} from './code-lab-terminal.ts';

/** Navigation context is transient UI state; it never changes the campaign save. */
export type WorkContext={kind:'ops';id:string}|{kind:'lab';id:LabId};
type Copy={ko:string;en:string;ja:string};
export type WorkAction={kind:'queue';command:string}|{kind:'file';path:string}|{kind:'app';app:'python'|'sql'|'challenges'}|{kind:'accept';id:string}|{kind:'restore';id:string}|{kind:'lab-run';id:LabId};
export type WorkGuide={context:WorkContext;title:Copy;goal:Copy;detail:Copy;file:string;destination:Copy;actionLabel:Copy;action:WorkAction};
const copy=(ko:string,en:string,ja:string):Copy=>({ko,en,ja});

export function workContextApp(context:WorkContext):'python'|'sql'|'challenges'|null{
 return context.kind==='lab'?'challenges':opsJob(context.id)?.track??null;
}
export function defaultWorkContext(state:GameState,app:string):WorkContext|null{
 if(app==='python'||app==='sql'){
  if(!opsTrackUnlocked(state,app))return null;
  const job=opsJobs(app).find(job=>opsJobUnlocked(state,job)&&!state.gameplay.ops?.completed.includes(job.id))??opsJobs(app)[0];
  return {kind:'ops',id:job.id};
 }
 if(app==='challenges')return {kind:'lab',id:(LAB_JOBS.find(job=>!state.gameplay.lab?.completed.includes(job.id))??LAB_JOBS[0]).id};
 return null;
}
export function workContextForFile(path:string):WorkContext|null{
 const ops=OPS_JOBS.find(job=>path.startsWith(opsFolder(job)+'/'));
 if(ops)return {kind:'ops',id:ops.id};
 const lab=LAB_JOBS.find(job=>[labSourcePath(job.id),labInputPath(job.id),labTestPath(job.id)].includes(path));
 return lab?{kind:'lab',id:lab.id}:null;
}
/** Tool switches retain the current job; unrelated app/file switches use campaign guidance. */
export function visibleWorkContext(context:WorkContext|null,app:string,file?:string):WorkContext|null{
 if(app==='editor')return file?workContextForFile(file):null;
 if(app==='terminal')return context;
 return context&&workContextApp(context)===app?context:null;
}

/** Shared by work guidance and the on-screen Ops steps: other folders do not prove this job. */
export function workCommandSeen(state:GameState,folder:string,test:(command:string)=>boolean):boolean{
 return state.history.some(entry=>entry.machine==='local'&&!entry.error&&entry.cwd===folder&&test(entry.command.trim()));
}

export function workGuide(state:GameState,context:WorkContext|null):WorkGuide|null{
 if(!context)return null;
 if(context.kind==='lab'){
  const job=LAB_JOBS.find(job=>job.id===context.id);if(!job)return null;
  const lab=state.gameplay.lab,source=lab?.drafts[job.id]??job.starter,seed=lab?.seeds[job.id]??1;
  const proof=lab?.proofs[job.id],fresh=proof?.source===source&&proof.seed===seed;
  const passed=fresh&&proof.passed;
  const sourceMissing=(Object.hasOwn(state.machines.local.files,labInputPath(job.id))||Object.hasOwn(state.machines.local.files,labTestPath(job.id)))&&!Object.hasOwn(state.machines.local.files,labSourcePath(job.id));
  if(sourceMissing)return {context,title:job.title,goal:job.goal,file:labSourcePath(job.id),destination:copy('코딩 연습실','Coding lab','コーディング練習室'),actionLabel:copy('연습실에서 코드 파일 복원','Restore the code file in the lab','練習室でコードファイルを復元'),detail:copy('코드 파일이 없어요. 연습실의 처음 코드로 복원 버튼을 누른 뒤 다시 검사하세요.','The source file is missing. Use Restore starter in the lab, then test it again.','コードファイルがありません。練習室で最初のコードに戻してから再検査しましょう。'),action:{kind:'app',app:'challenges'}};
  return {context,title:job.title,goal:job.goal,file:labSourcePath(job.id),destination:copy('코딩 연습실','Coding lab','コーディング練習室'),
   detail:passed?copy('현재 코드가 검사에 통과했어요. 연습실에서 결과를 보고 다음 문제를 고르세요.','The current code passed. View its results and choose the next job in the lab.','現在のコードは検査合格です。練習室で結果を見て次の問題を選びましょう。'):copy('solve(input)를 고친 뒤 검사하세요. 입력·기대값·실제값은 이 문제의 결과에서 비교합니다.','Edit solve(input), then test it. Compare input, expected and actual values in this job’s results.','solve(input)を直して検査しましょう。この問題の結果で入力・期待値・実際の値を比べます。'),
   actionLabel:passed?copy('이 문제의 결과로 돌아가기','Return to this job’s results','この問題の結果に戻る'):copy('이 코드 검사 · 결과 보기','Test this code · view results','このコードを検査 · 結果を見る'),
   action:passed?{kind:'app',app:'challenges'}:{kind:'lab-run',id:job.id}};
 }
 const job=opsJob(context.id);if(!job||!opsJobUnlocked(state,job))return null;
 const folder=opsFolder(job),path=folder+'/'+job.main,m=state.machines.local,ops=state.gameplay.ops;
 const run=ops?.runs[job.id],source=m.files[path],stale=!!run&&(source===undefined||run.hash!==opsHash(source));
 const tool=job.track==='python'?'python3':'sqlite3';
 const base={context,title:job.title,goal:job.goal,file:path,destination:copy('터미널','Terminal','ターミナル')};
 const queue=(command:string,label:Copy,detail:Copy):WorkGuide=>({...base,actionLabel:label,detail,action:{kind:'queue',command}});
 if(!ops?.accepted.includes(job.id))return {...base,destination:copy('작업 폴더','Job folder','作業フォルダー'),actionLabel:copy('의뢰 수락 · 작업 파일 받기','Accept job · get work files','依頼を受ける · 作業ファイルを受け取る'),detail:copy('수락하면 내 PC에 이 의뢰의 코드와 데이터가 생겨요.','Accept to receive this job’s code and data on your PC.','受けると自分のPCにこの依頼のコードとデータが届きます。'),action:{kind:'accept',id:job.id}};
 if(source===undefined)return {...base,actionLabel:copy('빠진 작업 파일 복구','Restore missing work files','消えた作業ファイルを復元'),detail:copy('이 의뢰의 코드 파일이 없어요. 복구한 뒤 파일을 열어 고치세요.','This job’s code file is missing. Restore it, then open and edit it.','この依頼のコードがありません。復元してから開いて直しましょう。'),action:{kind:'restore',id:job.id}};
 if(state.machine!=='local')return queue('exit',copy('내 PC 터미널로 돌아가기','Return to the local PC terminal','自分のPCのターミナルに戻る'),copy('서버에 접속 중이에요. exit를 입력한 뒤 Enter를 누르세요.','The terminal is on the server. Insert exit, then press Enter.','ターミナルはサーバー接続中です。exitを入力してEnterを押しましょう。'));
 if(!m.tools.includes(tool))return queue(m.updated?`sudo apt install ${tool}`:'sudo apt update',copy(`${tool} 준비 명령 넣기`,`Insert ${tool} setup command`,`${tool}の準備コマンドを入力`),copy('이 의뢰는 내 PC에 도구가 필요해요. 명령을 넣은 뒤 Enter로 실행하세요.','This job needs the tool on your PC. Insert the command and press Enter.','この依頼には自分のPCのツールが必要です。コマンドを入れてEnterで実行しましょう。'));
 if(m.cwd!==folder)return queue(`cd ${folder}`,copy('이 의뢰의 작업 폴더로 이동','Enter this job’s folder','この依頼のフォルダーへ移動'),copy('실행할 파일이 있는 폴더로 먼저 이동하세요. 명령을 넣은 뒤 Enter를 누릅니다.','Enter the folder containing this job’s files. Insert the command, then press Enter.','先にこの依頼のファイルがあるフォルダーへ移動します。コマンドを入れてEnterを押しましょう。'));
 const command=job.track==='python'?`python3 ${job.main}`:`sqlite3 ${job.db} < ${job.main}`;
 if(stale)return queue(command,copy('바꾼 파일 다시 실행 · 검사','Run and check the changed file','変更したファイルを再実行 · 検査'),copy('코드를 바꿔 이전 검사는 현재 파일의 결과가 아니에요. Enter로 다시 실행해 확인하세요.','The old run predates your edits. Press Enter to run and check this version.','編集後なので前の検査は現在のファイルの結果ではありません。Enterで再実行して確認しましょう。'));
 if(run?.passed)return {...base,destination:copy('의뢰 결과','Job result','依頼の結果'),actionLabel:copy('의뢰 결과 · 다음 작업 보기','View job result · next work','依頼の結果 · 次の作業を見る'),detail:copy('현재 파일이 데이터 검사를 통과했어요. 고객 답장과 다음 의뢰는 작업 화면에 있어요.','The current file passed the dataset checks. The client reply and next job are in the job window.','現在のファイルはデータ検査合格です。依頼の画面にお客さんの返事と次の依頼があります。'),action:{kind:'app',app:job.track}};
 const changed=source!==job.files[job.main];
 if(changed&&!run)return queue(command,copy('바꾼 파일 실행 · 결과 확인','Run the changed file · check results','変更したファイルを実行 · 結果を確認'),copy('명령은 입력칸에만 들어갑니다. Enter로 실행하면 데이터 검사와 납품을 확인해요.','The command goes into the input only. Press Enter to run the dataset checks and verify delivery.','コマンドは入力欄に入るだけです。Enterでデータ検査と納品を確認します。'));
 const data=opsDataFiles(job)[0],read=workCommandSeen(state,folder,command=>job.track==='python'?/^(cat|head|tail|less|more)\s/.test(command)&&command.includes(data):command.startsWith('sqlite3 ')&&command.includes(job.db)&&!command.includes('<'));
 if(!run&&!read)return queue(job.track==='python'?`cat ${data}`:`sqlite3 ${job.db} ".schema"`,copy('이 의뢰의 데이터 먼저 읽기','Read this job’s data first','この依頼のデータを先に読む'),copy('데이터의 모양을 확인하고 목표와 비교하세요. 그다음 코드 파일을 고칩니다.','Inspect the data shape and compare it with the goal, then edit the code file.','データの形を確認して目標と比べ、それからコードを直しましょう。'));
 return {...base,destination:copy('에디터','Editor','エディター'),actionLabel:copy(`${job.main} 열어 고치기`,`Open ${job.main} and fix it`,`${job.main}を開いて直す`),detail:run?copy('실행 결과가 목표와 달라요. 이 파일을 고치고 터미널에서 다시 실행하세요.','The run differs from the goal. Edit this file, then run it again in the terminal.','実行結果が目標と違います。このファイルを直し、ターミナルで再実行しましょう。'):copy('목표에 맞도록 코드 파일을 직접 고치세요. 저장한 뒤 실행 명령으로 결과를 확인합니다.','Edit the code file to meet the goal. After saving, run it and check the result.','目標に合うようコードを直しましょう。保存後に実行コマンドで結果を確認します。'),action:{kind:'file',path}};
}
