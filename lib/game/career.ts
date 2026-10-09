import {CAREER_JOBS,type CareerJob,type Localized} from './career-content.ts';
import {evaluateCareer} from './career-evaluation.ts';
import {allowedCareerFile,careerCodeSpec,CAREER_CODE_FILE,CAREER_CODE_MODE_FILE,type CareerCodeMode} from './career-code.ts';
import {careerActReady,careerPriorActsReady,careerRouteReady,careerEndingFor} from './career-progress.ts';
import {createRelease,applyRelease,releasePublishedFresh,type ReleaseProgress,type ReleaseAction} from './release.ts';

export type CareerProgress={rulesRevision:1|2;active:string|null;accepted:string[];inspected:string[];completed:string[];proofs:Record<string,{hash:string;passed:boolean}>;choices:Record<string,string>;upgrades:string[];checkpoints:Record<string,Record<string,string>>;ending:'community'|'studio'|'balanced'|null;endingJobs:string[];release:ReleaseProgress};
export const createCareer=():CareerProgress=>({rulesRevision:2,active:null,accepted:[],inspected:[],completed:[],proofs:{},choices:{},upgrades:[],checkpoints:{},ending:null,endingJobs:[],release:createRelease()});
export type CareerAction=ReleaseAction|{type:'career-accept'|'career-inspect'|'career-test'|'career-checkpoint'|'career-restore';id:string}|{type:'career-code-mode';id:string;mode:CareerCodeMode}|{type:'career-edit';id:string;file:string;content:string}|{type:'career-deliver';id:string;choice:string}|{type:'career-upgrade';id:string}|{type:'career-ending'};
function isReleaseAction(action:CareerAction):action is ReleaseAction{return action.type.startsWith('career-release-');}
type Host={completed:number[];gameplay:{career:CareerProgress;openingCelebrated:boolean};machines:{local:{files:Record<string,string>;dirs:string[]}};credits:number;xp:number;notice:string};
const l=(ko:string,en:string,ja:string):Localized=>({ko,en,ja});
export const CAREER_UPGRADES=[
 {id:'recovery-kit',price:250,name:l('복구 노트','Recovery notebook','復元ノート'),detail:l('의뢰마다 수정본 한 묶음을 보관하고 다시 불러옵니다.','Keep and restore a checkpoint for each job.','依頼ごとに修正版を保存し、復元できます。')},
 {id:'second-screen',price:600,name:l('보조 모니터','Second monitor','サブモニター'),detail:l('파일과 실행 결과를 나란히 비교합니다.','Compare the file and output side by side.','ファイルと実行結果を並べて比較できます。')},
 {id:'studio-sign',price:900,name:l('내 작업실 간판','Studio sign','作業場の看板'),detail:l('바탕화면에 독립 작업실 이름표를 붙입니다.','Put your independent studio sign on the desktop.','デスクトップに独立した作業場の看板を飾ります。')},
] as const;
export function careerRoot(id:string){return '/home/dev/jobs/'+id;}
export function careerFiles(s:Host,id:string):Record<string,string>{const root=careerRoot(id)+'/';return Object.fromEntries(Object.entries(s.machines.local.files).filter(([p])=>p.startsWith(root)).map(([p,c])=>[p.slice(root.length),c]));}
export function careerHash(files:Record<string,string>){let n=2166136261;for(const ch of Object.keys(files).sort().map(p=>p+'\0'+files[p]).join('\0')){n^=ch.charCodeAt(0);n=Math.imul(n,16777619);}return (n>>>0).toString(16);}
export function careerUnlocked(s:Host,job:CareerJob){return s.gameplay.openingCelebrated&&careerPriorActsReady(s.gameplay.career.completed,job.act);}
export function careerCurrent(s:Host){return CAREER_JOBS.find(j=>j.id===s.gameplay.career.active)??null;}
export function careerFresh(s:Host,id:string){const p=s.gameplay.career.proofs[id],files=careerFiles(s,id);return !!p?.passed&&p.hash===careerHash(files)&&evaluateCareer(id,files).passed;}
export function careerNext(s:Host){const available=CAREER_JOBS.filter(j=>careerUnlocked(s,j)&&!s.gameplay.career.completed.includes(j.id));return available.find(j=>!careerActReady(s.gameplay.career.completed,j.act))??available[0]??null;}
export function careerPhase(s:Host){const job=careerCurrent(s),c=s.gameplay.career;if(!job)return 0;if(c.completed.includes(job.id))return 5;if(!c.inspected.includes(job.id))return 1;return careerFresh(s,job.id)?4:2;}
function replaceFiles(s:Host,id:string,files:Record<string,string>){const root=careerRoot(id);for(const p of ['/home/dev/jobs',root])if(!s.machines.local.dirs.includes(p))s.machines.local.dirs.push(p);for(const [p,c] of Object.entries(files))s.machines.local.files[root+'/'+p]=c;}
/** Called only on the engine's cloned state. The machine filesystem is canonical. */
export function applyCareer(s:Host,a:CareerAction):void{
 if(isReleaseAction(a)){applyRelease(s,a);return;}
 const c=s.gameplay.career;
 if(!s.gameplay.openingCelebrated)return;
 if(a.type==='career-ending'){
  if(c.ending||!careerRouteReady(c.completed)||!releasePublishedFresh(s))return;
  c.endingJobs=[...c.completed];c.ending=careerEndingFor(c.endingJobs,c.choices);return;
 }
 if(a.type==='career-upgrade'){
  const item=CAREER_UPGRADES.find(x=>x.id===a.id);if(!item||c.upgrades.includes(item.id)||s.credits<item.price)return;
  c.upgrades.push(item.id);s.credits-=item.price;return;
 }
 const job=CAREER_JOBS.find(j=>j.id===a.id);if(!job||!careerUnlocked(s,job))return;
 if(a.type==='career-accept'){
  c.active=job.id;if(!c.accepted.includes(job.id)){c.accepted.push(job.id);replaceFiles(s,job.id,job.files);}return;
 }
 if(!c.accepted.includes(job.id)||c.completed.includes(job.id))return;
 if(a.type==='career-inspect'){if(!c.inspected.includes(job.id))c.inspected.push(job.id);return;}
 if(a.type==='career-code-mode'){
  const spec=careerCodeSpec(job.id);if(!spec||!['config','javascript'].includes(a.mode))return;
  const root=careerRoot(job.id);if(a.mode==='javascript'&&!Object.hasOwn(s.machines.local.files,root+'/'+CAREER_CODE_FILE))s.machines.local.files[root+'/'+CAREER_CODE_FILE]=spec.starter;
  s.machines.local.files[root+'/'+CAREER_CODE_MODE_FILE]=JSON.stringify({mode:a.mode})+'\n';delete c.proofs[job.id];return;
 }
 if(a.type==='career-edit'){
  if(!allowedCareerFile(job.id,a.file)||typeof a.content!=='string'||a.content.length>(a.file===CAREER_CODE_FILE?12000:20000))return;
  s.machines.local.files[careerRoot(job.id)+'/'+a.file]=a.content;delete c.proofs[job.id];return;
 }
 if(a.type==='career-checkpoint'){
  if(c.upgrades.includes('recovery-kit')){const files=careerFiles(s,job.id);const snapshot=Object.fromEntries(Object.keys(files).filter(p=>allowedCareerFile(job.id,p)&&typeof files[p]==='string').map(p=>[p,files[p]]));if(Object.values(snapshot).every(value=>value.length<=20000))c.checkpoints[job.id]=snapshot;}return;
 }
 if(a.type==='career-restore'){
  if(c.upgrades.includes('recovery-kit')&&c.checkpoints[job.id]){for(const file of Object.keys(careerFiles(s,job.id)).filter(file=>allowedCareerFile(job.id,file)))delete s.machines.local.files[careerRoot(job.id)+'/'+file];replaceFiles(s,job.id,c.checkpoints[job.id]);delete c.proofs[job.id];}return;
 }
 const files=careerFiles(s,job.id);
 if(a.type==='career-test'){const proof=evaluateCareer(job.id,files);c.proofs[job.id]={hash:careerHash(files),passed:proof.passed};return;}
 if(a.type==='career-deliver'){
  if(!c.inspected.includes(job.id)||!careerFresh(s,job.id)||!job.choices.some(x=>x.id===a.choice)||!evaluateCareer(job.id,files).passed)return;
  c.completed.push(job.id);c.choices[job.id]=a.choice;s.credits+=job.credits;s.xp+=job.xp;
 }
}
