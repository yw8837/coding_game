import type {GameState} from './engine.ts';
import {releaseUnlocked} from './release.ts';
import {opsTrackUnlocked} from './ops.ts';
import {PYTHON_JOBS,SQL_JOBS} from './ops-content.ts';

/** The five-stage roadmap shown to the player. Everything is derived from saved progress. */
export type StageId='linux'|'web'|'python'|'sql'|'finale';
export type StageStatus='locked'|'active'|'done';
type Copy={ko:string;en:string;ja:string};
const c=(ko:string,en:string,ja:string):Copy=>({ko,en,ja});
export type CurriculumStage={id:StageId;step:number;title:Copy;skills:Copy;unlock:Copy;done:number;total:number;status:StageStatus;app:'repair'|'career'|'python'|'sql'};

export function curriculum(s:GameState):CurriculumStage[]{
 const g=s.gameplay,career=g.career.completed.length;
 const linuxItems=[!!s.repo,(s.repo?.commits.length??0)>1,Object.values(g.exploration).every(Boolean),s.completed.includes(0)];
 const webItems=[s.completed.includes(1),s.completed.includes(2),g.openingCelebrated,...Array.from({length:12},(_,i)=>career>i)];
 const finaleItems=[!!g.career.release.published,(g.finale?.exports.length??0)>0];
 const stage=(id:StageId,step:number,title:Copy,skills:Copy,unlock:Copy,items:boolean[],open:boolean,app:CurriculumStage['app']):CurriculumStage=>{
  const done=items.filter(Boolean).length,total=items.length;
  return {id,step,title,skills,unlock,done,total,status:done===total?'done':open?'active':'locked',app};
 };
 return [
  stage('linux',1,c('리눅스 & Git 기초','Linux & Git basics','Linux & Gitの基礎'),c('cd · ls · cat · git clone · commit · push','cd · ls · cat · git clone · commit · push','cd · ls · cat · git clone · commit · push'),c('처음부터 열려 있어요','Open from the start','最初から開いています'),linuxItems,true,'repair'),
  stage('web',2,c('웹 & 프론트엔드','Web & front end','Web & フロントエンド'),c('HTML · CSS · JavaScript · 서버 설정 · JSON/CSV','HTML · CSS · JavaScript · server settings · JSON/CSV','HTML · CSS · JavaScript · サーバー設定 · JSON/CSV'),c('첫 홈페이지를 배포하면 본격 시작','Starts in earnest after your first deploy','最初のホームページ公開から本格スタート'),webItems,s.completed.includes(0),'career'),
  stage('python',3,c('파이썬 자동화','Python automation','Python自動化'),c('변수 · 반복문 · 조건문 · 딕셔너리 · 함수','Variables · loops · conditions · dicts · functions','変数 · ループ · 条件 · 辞書 · 関数'),c('카페 OPEN 뒤에 열려요','Unlocks after the cafe OPEN','カフェOPENのあとに開きます'),PYTHON_JOBS.map(job=>(g.ops?.completed??[]).includes(job.id)),opsTrackUnlocked(s,'python'),'python'),
  stage('sql',4,c('SQL 데이터베이스','SQL databases','SQLデータベース'),c('SELECT · WHERE · ORDER BY · LIMIT · GROUP BY · 집계','SELECT · WHERE · ORDER BY · LIMIT · GROUP BY · aggregates','SELECT · WHERE · ORDER BY · LIMIT · GROUP BY · 集計'),c('파이썬 의뢰 3개를 마치면 열려요','Unlocks after three Python jobs','Pythonの依頼を3件終えると開きます'),SQL_JOBS.map(job=>(g.ops?.completed??[]).includes(job.id)),opsTrackUnlocked(s,'sql'),'sql'),
  stage('finale',5,c('피날레: 내 작품 내보내기','Finale: ship your creation','フィナーレ: 作品を世に出す'),c('1.0.0 배포 · 웹 / 웹앱 / PWA 갈래','Release 1.0.0 · Web / Web app / PWA','1.0.0公開 · Web / Webアプリ / PWA'),c('세 구역 의뢰를 4개씩 마치면 열려요','Unlocks after four jobs in each district','3地区で依頼を4件ずつ終えると開きます'),finaleItems,releaseUnlocked(s),'career'),
 ];
}
export const curriculumComplete=(s:GameState)=>curriculum(s).every(stage=>stage.status==='done');
