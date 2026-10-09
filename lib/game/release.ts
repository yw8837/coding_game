import {CAREER_JOBS,type Localized} from './career-content.ts';

export const RELEASE_ROOT='/home/dev/studio/launch';
export const RELEASE_FILES:Record<string,string>={
 'index.html':'<h1>Untitled</h1>\n',
 'style.css':'.portal { width: 960px; }\n',
 'server.json':'{\n  "route": "/places",\n  "saveRequests": false\n}\n',
};
export const RELEASE_EXAMPLE:Record<string,string>={
 'index.html':'<h1>My neighborhood studio</h1>\n',
 'style.css':'.portal { width: 100%; }\n',
 'server.json':'{\n  "route": "/api/places",\n  "saveRequests": true\n}\n',
};
export type ReleaseProgress={started:boolean;proof:{hash:string;passed:boolean}|null;build:{hash:string;version:'1.0.0'}|null;published:{hash:string;version:'1.0.0'}|null};
export const createRelease=():ReleaseProgress=>({started:false,proof:null,build:null,published:null});
export type ReleaseAction={type:'career-release-start'|'career-release-test'|'career-release-build'|'career-release-publish'}|{type:'career-release-edit';file:string;content:string};
type Host={completed:number[];gameplay:{openingCelebrated:boolean;career:{completed:string[];release:ReleaseProgress}};machines:{local:{files:Record<string,string>;dirs:string[]}}};
export type ReleaseEvaluation={passed:boolean;checks:{id:string;title:Localized;expected:string;actual:string;passed:boolean}[];preview:{title:string;width:string;apiReady:boolean;storageReady:boolean}};
const l=(ko:string,en:string,ja:string):Localized=>({ko,en,ja});
const MAX_SOURCE=20000;
export function releaseFiles(s:Pick<Host,'machines'>):Record<string,string>{const prefix=RELEASE_ROOT+'/';return Object.fromEntries(Object.entries(s.machines.local.files).filter(([path])=>path.startsWith(prefix)).map(([path,value])=>[path.slice(prefix.length),value]));}
/** Framed data and every UTF-16 code unit participate, including emoji surrogates. */
export function releaseHash(files:Record<string,string>):string{const source=JSON.stringify(Object.keys(files).sort().map(path=>[path,files[path]]));let first=2166136261,second=3339675911;for(let i=0;i<source.length;i++){first=Math.imul(first^source.charCodeAt(i),16777619);second=Math.imul(second^source.charCodeAt(i),2246822519);}return (first>>>0).toString(16).padStart(8,'0')+(second>>>0).toString(16).padStart(8,'0');}
export function releaseUnlocked(s:Pick<Host,'completed'|'gameplay'>):boolean{return s.gameplay.openingCelebrated&&[0,1,2].every(id=>s.completed.includes(id))&&CAREER_JOBS.every(job=>s.gameplay.career.completed.includes(job.id));}

function interpret(files:Record<string,string>){
 let title='',width='',titleValid=false,widthValid=false,apiReady=false,storageReady=false;
 const mapValid=!!files&&typeof files==='object'&&!Array.isArray(files)&&Object.keys(files).length===Object.keys(RELEASE_FILES).length&&Object.keys(RELEASE_FILES).every(file=>Object.hasOwn(files,file)&&typeof files[file]==='string'&&files[file].length<=MAX_SOURCE);
 if(mapValid){
  // One inert heading and one simple width rule: no DOM insertion or code execution.
  const heading=files['index.html'].match(/^\s*<h1>\s*([^<>]*)\s*<\/h1>\s*$/i);
  if(heading){title=heading[1].trim();titleValid=Array.from(title).length>=1&&Array.from(title).length<=40&&title.toLowerCase()!=='untitled'&&!/[\x00-\x1f\x7f]/.test(title);}
  const css=files['style.css'].match(/^\s*\.portal\s*\{\s*width\s*:\s*(\d+(?:\.\d+)?)\s*(px|%)\s*;?\s*\}\s*$/);
  if(css){const amount=Number(css[1]);if(Number.isFinite(amount)&&amount<=10000)width=amount+css[2];widthValid=width==='100%';}
  try{const config=JSON.parse(files['server.json']);if(config&&typeof config==='object'&&!Array.isArray(config)&&Object.keys(config).length===2&&Object.hasOwn(config,'route')&&Object.hasOwn(config,'saveRequests')&&typeof config.route==='string'&&config.route.length<=100&&typeof config.saveRequests==='boolean'){apiReady=config.route==='/api/places';storageReady=apiReady&&config.saveRequests===true;}}catch{/* Invalid source remains a failing check. */}
 }
 return {mapValid,title,titleValid,width,widthValid,apiReady,storageReady};
}
/** Same bounded route/storage interpretation powers checks and the temporary UI demo. */
export function simulateReleaseRequest(files:Record<string,string>,message:string):{status:200|404;stored:boolean}{const parsed=interpret(files);return {status:parsed.apiReady?200:404,stored:parsed.storageReady&&typeof message==='string'&&message.trim().length>0&&message.length<=2000};}
export function evaluateRelease(files:Record<string,string>):ReleaseEvaluation{
 const parsed=interpret(files),request=simulateReleaseRequest(files,'A neighborhood request');
 const checks:ReleaseEvaluation['checks']=[
  {id:'title',title:l('내 프로젝트 제목','My project title','自分のプロジェクト名'),expected:'1–40 characters; not Untitled',actual:parsed.title||'Missing or unsupported heading',passed:parsed.mapValid&&parsed.titleValid},
  {id:'width',title:l('화면에 맞는 너비','Width fits the screen','画面に合う幅'),expected:'100%',actual:parsed.width||'Missing or unsupported width',passed:parsed.mapValid&&parsed.widthValid},
  {id:'route',title:l('동네 장소 요청','Neighborhood places request','まちの場所リクエスト'),expected:'GET /api/places → 200',actual:'GET /api/places → '+request.status,passed:request.status===200},
  {id:'storage',title:l('문의 보관','Keep client requests','問い合わせの保存'),expected:'saveRequests: true',actual:request.stored?'saveRequests: true':'Request not stored',passed:request.stored},
 ];
 return {passed:checks.every(check=>check.passed),checks,preview:{title:parsed.title,width:parsed.width,apiReady:parsed.apiReady,storageReady:parsed.storageReady}};
}
export function releaseFresh(s:Host):boolean{const progress=s.gameplay.career.release,files=releaseFiles(s);return releaseUnlocked(s)&&progress.started&&!!progress.proof?.passed&&progress.proof.hash===releaseHash(files)&&evaluateRelease(files).passed;}
export function releaseBuildFresh(s:Host):boolean{const progress=s.gameplay.career.release;return releaseFresh(s)&&progress.build?.version==='1.0.0'&&progress.build.hash===releaseHash(releaseFiles(s));}
export function releasePublishedFresh(s:Host):boolean{const progress=s.gameplay.career.release;return releaseBuildFresh(s)&&progress.published?.version==='1.0.0'&&progress.published.hash===releaseHash(releaseFiles(s));}
export function invalidateRelease(s:Host):void{const progress=s.gameplay.career.release;if(!progress.started||progress.published)return;const hash=releaseHash(releaseFiles(s));if(progress.proof&&progress.proof.hash!==hash)progress.proof=null;if(progress.build&&progress.build.hash!==hash)progress.build=null;}
/** Mutates only the engine's cloned state. No capstone credit or XP reward. */
export function applyRelease(s:Host,action:ReleaseAction):void{
 if(!releaseUnlocked(s))return;const progress=s.gameplay.career.release;if(progress.published)return;
 if(action.type==='career-release-start'){
  if(progress.started)return;progress.started=true;
  for(const directory of ['/home/dev/studio',RELEASE_ROOT])if(!s.machines.local.dirs.includes(directory))s.machines.local.dirs.push(directory);
  for(const [file,content] of Object.entries(RELEASE_FILES))s.machines.local.files[RELEASE_ROOT+'/'+file]=content;return;
 }
 if(!progress.started)return;
 if(action.type==='career-release-edit'){
  if(!Object.hasOwn(RELEASE_FILES,action.file)||typeof action.content!=='string'||action.content.length>MAX_SOURCE)return;
  s.machines.local.files[RELEASE_ROOT+'/'+action.file]=action.content;progress.proof=null;progress.build=null;return;
 }
 const files=releaseFiles(s);invalidateRelease(s);
 if(action.type==='career-release-test'){progress.proof={hash:releaseHash(files),passed:evaluateRelease(files).passed};return;}
 if(action.type==='career-release-build'){if(releaseFresh(s))progress.build={hash:releaseHash(files),version:'1.0.0'};return;}
 if(action.type==='career-release-publish'&&releaseBuildFresh(s))progress.published={hash:releaseHash(files),version:'1.0.0'};
}
