import type {GameState} from './engine.ts';
import {runPython,formatPyError} from './py-runtime.ts';
import {executeSql,formatSqlResult,formatSqlCell,describeSchema,listTables,type SqlDatabase,type SqlResult} from './sql-engine.ts';
import {OPS_ROOTS,DB_MARKER,OPS_JOBS,opsJob,opsJobs,opsFolder,opsStartFiles,opsDataFiles,type OpsJob,type OpsTrack,type PythonJob,type SqlJob} from './ops-content.ts';

/** Curriculum stages 3–4. Player scripts and queries only ever run inside the
 * restricted interpreters; nothing here touches the host. */
export type OpsRun={hash:string;passed:boolean;output:string};
export type OpsProgress={accepted:string[];completed:string[];runs:Record<string,OpsRun>};
export type OpsAction={type:'ops-accept'|'ops-restore';id:string};
export function createOps():OpsProgress{return {accepted:[],completed:[],runs:{}};}
export const SQL_UNLOCK_PYTHON=3;
const MAX_RUN_OUTPUT=4000;

function progress(s:GameState):OpsProgress{return s.gameplay.ops??(s.gameplay.ops=createOps());}
export function opsDone(s:GameState,track:OpsTrack):number{const done=s.gameplay.ops?.completed??[];return opsJobs(track).filter(job=>done.includes(job.id)).length;}
export function opsTrackUnlocked(s:GameState,track:OpsTrack):boolean{return s.gameplay.openingCelebrated&&(track==='python'||opsDone(s,'python')>=SQL_UNLOCK_PYTHON);}
export function opsJobUnlocked(s:GameState,job:OpsJob):boolean{
 if(!opsTrackUnlocked(s,job.track))return false;
 const list=opsJobs(job.track),index=list.findIndex(item=>item.id===job.id);
 return index<=0||(s.gameplay.ops?.completed??[]).includes(list[index-1].id);
}
export function opsHash(text:string):string{let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16);}
const inside=(path:string,root:string)=>path===root||path.startsWith(root+'/');
/** Authored data files stay read-only; the script/query is what the player edits. */
export function opsPathReadOnly(path:string):boolean{
 return OPS_JOBS.some(job=>opsDataFiles(job).some(name=>path===opsFolder(job)+'/'+name));
}
export function opsPrivatePath(path:string):boolean{return Object.values(OPS_ROOTS).some(root=>inside(path,root));}

function placeFiles(s:GameState,job:OpsJob,overwrite:(name:string)=>boolean):void{
 const m=s.machines.local,folder=opsFolder(job);
 for(const dir of ['/home','/home/dev',OPS_ROOTS[job.track],folder])if(!m.dirs.includes(dir))m.dirs.push(dir);
 for(const [name,content] of Object.entries(opsStartFiles(job))){const path=folder+'/'+name;if(m.files[path]===undefined||overwrite(name))m.files[path]=content;}
}
export function applyOps(s:GameState,action:OpsAction):GameState{
 const job=opsJob(action.id),ops=progress(s);
 if(!job||!opsJobUnlocked(s,job))return s;
 if(action.type==='ops-accept'){if(!ops.accepted.includes(job.id)){ops.accepted.push(job.id);placeFiles(s,job,()=>false);}return s;}
 if(!ops.accepted.includes(job.id))return s;
 const data=opsDataFiles(job);placeFiles(s,job,name=>data.includes(name));return s;
}

// ---------- shared check report ----------
type Mismatch={label:string;summary:string;expected?:string;actual?:string};
const datasetLabel=(index:number)=>index===0?'공개 데이터':`숨은 데이터 #${index}`;
function report(s:GameState,job:OpsJob,source:string,mismatch:Mismatch|null,shownStdout:string):string[]{
 const ops=progress(s),lines=['── 의뢰 검사 ──'];
 const passed=!mismatch;
 for(let i=0;i<job.data.length;i++){
  if(mismatch&&mismatch.label===datasetLabel(i)){lines.push(`✘ ${mismatch.label}: ${mismatch.summary}`);if(mismatch.expected!==undefined)lines.push('  기대: '+mismatch.expected,'  실제: '+(mismatch.actual??''));break;}
  lines.push(`✔ ${datasetLabel(i)} 결과 일치`);
 }
 ops.runs[job.id]={hash:opsHash(source),passed,output:shownStdout.slice(0,MAX_RUN_OUTPUT)};
 if(!passed)return lines;
 if(ops.completed.includes(job.id)){lines.push('★ 이미 완료한 의뢰예요. 마음껏 더 고쳐 보세요.');return lines;}
 ops.completed.push(job.id);s.credits+=job.credits;s.xp+=job.xp;
 lines.push(`★ 의뢰 완료! +${job.credits} cr · +${job.xp} XP`);
 return lines;
}
const normalizeOut=(text:string)=>text.replace(/\r\n/g,'\n').split('\n').map(line=>line.replace(/\s+$/,'')).join('\n').replace(/\n+$/,'');

// ---------- python3 ----------
const referenceCache=new Map<string,string[]>();
function referenceOutputs(job:PythonJob):string[]{
 let cached=referenceCache.get(job.id);
 if(!cached){cached=job.data.map(files=>{const run=runPython(job.reference,{files,filename:job.main});if(!run.ok)throw Error(`reference ${job.id} failed`);return normalizeOut(run.stdout);});referenceCache.set(job.id,cached);}
 return cached;
}
function pythonMismatch(job:PythonJob,source:string):Mismatch|null{
 const expected=referenceOutputs(job);
 for(let i=0;i<job.data.length;i++){
  const run=runPython(source,{files:job.data[i],filename:job.main}),label=datasetLabel(i);
  if(!run.ok)return {label,summary:'실행 중 오류 — '+(run.error?.type??'Error')};
  const want=expected[i].split('\n'),got=normalizeOut(run.stdout).split('\n');
  const line=want.findIndex((row,index)=>row!==got[index]);
  if(line>=0)return {label,summary:`${line+1}번째 줄이 달라요`,expected:want[line],actual:got[line]??'(출력 없음)'};
  if(got.length!==want.length)return {label,summary:`줄 수가 달라요 (기대 ${want.length}줄, 실제 ${got.length}줄)`};
 }
 return null;
}
/** Files visible to a script: everything under its working directory, by relative and absolute path. */
function scriptFiles(s:GameState,cwd:string,canRead:(path:string)=>boolean):Record<string,string>{
 const files:Record<string,string>={},prefix=cwd==='/'?'/':cwd+'/';
 for(const [path,content] of Object.entries(s.machines[s.machine].files))if(path.startsWith(prefix)&&canRead(path)){files[path.slice(prefix.length)]=content;files[path]=content;}
 return files;
}
export function dispatchPython(s:GameState,args:readonly string[],resolve:(cwd:string,path:string)=>string,canRead:(path:string)=>boolean=()=>true):{output:string;error:boolean}{
 const m=s.machines[s.machine];
 if(!args.length)return {output:'Python 3.12.0 [simulated]\n대화형 모드 대신 python3 파일.py 또는 python3 -c "코드"를 사용하세요.',error:false};
 let source:string,filename='<string>',path:string|null=null;
 if(args[0]==='-c'){if(args[1]===undefined)return {output:'Argument expected for the -c option',error:true};source=args[1];}
 else{
  path=resolve(m.cwd,args[0]);const content=m.files[path];
  if(content===undefined)return {output:`python3: can't open file '${path}': [Errno 2] No such file or directory`,error:true};
  source=content;filename=args[0].split('/').at(-1)!;
 }
 const run=runPython(source,{files:scriptFiles(s,m.cwd,canRead),filename});
 const parts=[run.stdout.replace(/\n$/,'')];
 if(run.error)parts.push(formatPyError(run.error,filename));
 let output=parts.filter(part=>part!=='').join('\n'),error=!run.ok;
 const job=path&&s.machine==='local'?OPS_JOBS.find(item=>item.track==='python'&&path===opsFolder(item)+'/'+item.main) as PythonJob|undefined:undefined;
 if(job&&(s.gameplay.ops?.accepted??[]).includes(job.id)){
  const mismatch=run.ok?pythonMismatch(job,source):{label:datasetLabel(0),summary:'실행 중 오류 — '+(run.error?.type??'Error')};
  output=[output,...report(s,job,source,mismatch,run.stdout)].filter(Boolean).join('\n');
  error=!!mismatch;
 }
 return {output,error};
}

// ---------- sqlite3 ----------
function databaseFor(s:GameState,path:string):{job:SqlJob;db:SqlDatabase}|string{
 const content=s.machines[s.machine].files[path];
 if(content===undefined)return `Error: unable to open database "${path.split('/').at(-1)}": file not found (simulated databases are read-only)`;
 const id=content.split('\n').find(line=>line.startsWith(DB_MARKER))?.slice(DB_MARKER.length).trim();
 const job=id?OPS_JOBS.find(item=>item.track==='sql'&&item.id===id) as SqlJob|undefined:undefined;
 return job?{job,db:job.data[0]}:'Error: file is not a database';
}
const lastResult=(results:readonly SqlResult[])=>results.at(-1)??null;
const rowText=(row:SqlResult['rows'][number])=>row.map(formatSqlCell).join(' | ');
function sqlMismatch(job:SqlJob,sql:string):Mismatch|null{
 for(let i=0;i<job.data.length;i++){
  const label=datasetLabel(i),want=executeSql(job.data[i],job.reference),got=executeSql(job.data[i],sql);
  if(!want.ok)throw Error(`reference ${job.id} failed`);
  if(!got.ok)return {label,summary:'쿼리 오류 — '+got.error};
  const expected=lastResult(want.results)!,actual=lastResult(got.results);
  if(!actual)return {label,summary:'SELECT 결과가 없어요'};
  if(actual.columns.length!==expected.columns.length)return {label,summary:`열 개수가 달라요 (기대 ${expected.columns.length}개, 실제 ${actual.columns.length}개)`,expected:expected.columns.join(' | '),actual:actual.columns.join(' | ')};
  if(actual.rows.length!==expected.rows.length)return {label,summary:`행 개수가 달라요 (기대 ${expected.rows.length}행, 실제 ${actual.rows.length}행)`};
  const wantRows=expected.rows.map(rowText),gotRows=actual.rows.map(rowText);
  if(!job.ordered){wantRows.sort();gotRows.sort();}
  const row=wantRows.findIndex((text,index)=>text!==gotRows[index]);
  if(row>=0){
   const sameSet=[...wantRows].sort().join('\n')===[...gotRows].sort().join('\n');
   return {label,summary:sameSet?'행은 맞지만 순서가 달라요':`${row+1}번째 행이 달라요`,expected:wantRows[row],actual:gotRows[row]};
  }
 }
 return null;
}
const SQLITE_HELP='.help            이 도움말\n.tables          표 목록\n.schema [표]      표 구조(CREATE TABLE)\n.read FILE       파일의 SQL 실행';
export function dispatchSqlite(s:GameState,args:readonly string[],stdin:string|null,resolve:(cwd:string,path:string)=>string):{output:string;error:boolean}{
 const m=s.machines[s.machine];
 if(args[0]==='--version'||args[0]==='-version')return {output:'3.45.1 2024-01-30 [simulated]',error:false};
 if(!args[0])return {output:'사용법: sqlite3 <db 파일> "SELECT ...;"  또는  sqlite3 <db 파일> < query.sql',error:true};
 const found=databaseFor(s,resolve(m.cwd,args[0]));
 if(typeof found==='string')return {output:found,error:true};
 const {job,db}=found;
 let sql:string,from:string|null=null;
 const command=args[1]?.trim();
 if(stdin!==null){if(command)return {output:'Error: use either a SQL argument or < file, not both',error:true};from=resolve(m.cwd,stdin);}
 else if(command===undefined)return {output:'SQLite version 3.45.1 [simulated]\n대화형 모드 대신 sqlite3 '+args[0]+' "SELECT ...;" 또는 sqlite3 '+args[0]+' < query.sql을 사용하세요.',error:false};
 else if(command==='.help')return {output:SQLITE_HELP,error:false};
 else if(command==='.tables')return {output:listTables(db),error:false};
 else if(command==='.schema'||command.startsWith('.schema ')){const name=command.slice(7).trim()||undefined,text=describeSchema(db,name);return {output:text,error:false};}
 else if(command.startsWith('.read ')){from=resolve(m.cwd,command.slice(6).trim().replace(/^['"]|['"]$/g,''));}
 else if(command.startsWith('.'))return {output:`Error: unknown command or invalid arguments: "${command.slice(1).split(/\s/)[0]}". Enter ".help" for help`,error:true};
 if(from!==null){const content=m.files[from];if(content===undefined)return {output:`Error: cannot open "${from.split('/').at(-1)}"`,error:true};sql=content;}
 else sql=command!;
 const outcome=executeSql(db,sql);
 const shown=outcome.results.map(result=>result.columns.length?formatSqlResult(result,'column'):'').filter(Boolean);
 if(!outcome.ok)shown.push(outcome.error);
 let output=shown.join('\n\n'),error=!outcome.ok;
 if(s.machine!=='local'||!(s.gameplay.ops?.accepted??[]).includes(job.id))return {output,error};
 const deliverable=from===opsFolder(job)+'/'+job.main;
 if(deliverable){const mismatch=outcome.ok?sqlMismatch(job,sql):{label:datasetLabel(0),summary:'쿼리 오류 — '+(outcome.ok?'':outcome.error)};output=[output,...report(s,job,sql,mismatch,output)].filter(Boolean).join('\n');error=!!mismatch;}
 else if(outcome.ok&&outcome.results.length&&!sqlMismatch(job,sql))output+=`\n✔ 결과가 맞아요! 이 쿼리를 ${job.main}에 저장하고 sqlite3 ${job.db} < ${job.main} 로 납품하세요.`;
 return {output,error};
}
export {OPS_JOBS,opsJob,opsJobs,opsFolder};
