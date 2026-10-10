import {evaluateRelease,releaseFiles,releaseHash,releasePublishedFresh,type ReleaseProgress} from './release.ts';

export const STUDIO_ROOT='/home/dev/studio/workbench';
export const STUDIO_FILE_NAMES=['index.html','style.css','server.json','project.json'] as const;
export const STUDIO_MAX_SOURCE=20000;
export const STUDIO_MAX_SNAPSHOTS=5;
export type StudioSourceMap=Record<string,string>;
export type StudioSnapshot={id:number;hash:string;files:StudioSourceMap};
export type StudioProgress={appId:string;nextId:number;proof:{hash:string;passed:boolean}|null;snapshots:StudioSnapshot[]};
export type StudioAction={type:'career-studio-start'|'career-studio-test'|'career-studio-snapshot'}|{type:'career-studio-edit';file:string;content:string}|{type:'career-studio-restore';id:number;confirmLoss?:boolean};
type Host={completed:number[];gameplay:{openingCelebrated:boolean;career:{completed:string[];release:ReleaseProgress;studio?:StudioProgress|null}};machines:{local:{files:Record<string,string>;dirs:string[]}}};
export function studioSourceMapValid(files:unknown,complete=false):files is StudioSourceMap{
 if(!files||typeof files!=='object'||Array.isArray(files))return false;
 const entries=Object.entries(files);
 return entries.length<=4&&entries.every(([file,content])=>STUDIO_FILE_NAMES.includes(file as typeof STUDIO_FILE_NAMES[number])&&typeof content==='string'&&content.length<=STUDIO_MAX_SOURCE&&!content.includes('\0'))&&(!complete||STUDIO_FILE_NAMES.every(file=>Object.hasOwn(files,file)));
}
export function studioFiles(s:Pick<Host,'machines'>):StudioSourceMap{
 const prefix=STUDIO_ROOT+'/';return Object.fromEntries(Object.entries(s.machines.local.files).filter(([path])=>path.startsWith(prefix)).map(([path,source])=>[path.slice(prefix.length),source]));
}
/** All editor and terminal writes share these limits; never silently truncate work. */
export function checkStudioFileWrite(path:string,content:string):void{
 if(path!==STUDIO_ROOT&&!path.startsWith(STUDIO_ROOT+'/'))return;
 if(!studioSourceMapValid({[path.slice(STUDIO_ROOT.length+1)]:content}))throw Error('Studio supports index.html, style.css, server.json and project.json, up to 20,000 characters per file.');
}
export function studioFresh(s:Host):boolean{
 const p=s.gameplay.career.studio,files=studioFiles(s);
 return !!p?.proof?.passed&&p.proof.hash===releaseHash(files)&&studioSourceMapValid(files,true)&&evaluateRelease(files,true).passed;
}
export function invalidateStudio(s:Host):void{
 const p=s.gameplay.career.studio;if(p?.proof&&p.proof.hash!==releaseHash(studioFiles(s)))p.proof=null;
}
export function studioHasUnsnapshottedChanges(s:Host):boolean{
 const p=s.gameplay.career.studio;return !!p&&p.snapshots.at(-1)?.hash!==releaseHash(studioFiles(s));
}
function replaceStudio(s:Host,files:StudioSourceMap):void{
 for(const path of Object.keys(s.machines.local.files))if(path===STUDIO_ROOT||path.startsWith(STUDIO_ROOT+'/'))delete s.machines.local.files[path];
 for(const [file,source] of Object.entries(files))s.machines.local.files[STUDIO_ROOT+'/'+file]=source;
 for(const dir of ['/home/dev/studio',STUDIO_ROOT])if(!s.machines.local.dirs.includes(dir))s.machines.local.dirs.push(dir);
}
export function applyStudio(s:Host,a:StudioAction):void{
 if(!releasePublishedFresh(s))return;
 const c=s.gameplay.career;
 if(a.type==='career-studio-start'){
  if(c.studio)return;
  const files={...releaseFiles(s)};
  if(c.release.formatRevision===1&&!Object.hasOwn(files,'project.json')){
   const title=evaluateRelease(files).preview.title;
   files['project.json']=JSON.stringify({kind:'directory',description:title,items:[{name:'Mono Cafe',detail:'Coffee and menus',category:'Places'},{name:'Dawn Bakery',detail:'Six in a box',category:'Places'}],accent:'sage',layout:'list'},null,2)+'\n';
  }
  if(!studioSourceMapValid(files,true)||!evaluateRelease(files,true).passed)return;
  replaceStudio(s,files);c.studio={appId:c.release.published!.hash,nextId:1,proof:null,snapshots:[]};return;
 }
 const p=c.studio;if(!p)return;
 if(a.type==='career-studio-edit'){
  if(!studioSourceMapValid({[a.file]:a.content}))return;
  s.machines.local.files[STUDIO_ROOT+'/'+a.file]=a.content;invalidateStudio(s);return;
 }
 const files=studioFiles(s),hash=releaseHash(files);
 if(a.type==='career-studio-test'){p.proof={hash,passed:studioSourceMapValid(files,true)&&evaluateRelease(files,true).passed};return;}
 if(a.type==='career-studio-snapshot'){
  if(!studioFresh(s)||p.snapshots.at(-1)?.hash===hash||p.nextId>=1_000_000_000)return;
  p.snapshots.push({id:p.nextId++,hash,files:{...files}});p.snapshots=p.snapshots.slice(-STUDIO_MAX_SNAPSHOTS);return;
 }
 if(a.type==='career-studio-restore'){
  const version=p.snapshots.find(v=>v.id===a.id);
  if(!version||!studioSourceMapValid(version.files,true)||releaseHash(version.files)!==version.hash||!evaluateRelease(version.files,true).passed)return;
  if(hash===version.hash)return;
  if(studioHasUnsnapshottedChanges(s)&&a.confirmLoss!==true)return;
  replaceStudio(s,version.files);p.proof=null;
 }
}
/** Shape checks supplement Zod: cross-record hashes and workspace freshness are mandatory. */
export function validateStudioSave(s:Host):void{
 const p=s.gameplay.career.studio,files=studioFiles(s);
 if(Object.hasOwn(s.machines.local.files,STUDIO_ROOT))throw Error('Studio root must be a directory');
 if(!p){if(Object.keys(files).length||s.machines.local.dirs.some(path=>path===STUDIO_ROOT||path.startsWith(STUDIO_ROOT+'/')))throw Error('Studio workspace requires a started studio');return;}
 if(!releasePublishedFresh(s)||p.appId!==s.gameplay.career.release.published!.hash)throw Error('Studio requires its immutable first release');
 if(!studioSourceMapValid(files))throw Error('Invalid studio source map');
 if(!Number.isSafeInteger(p.nextId)||p.nextId<1||p.nextId>1_000_000_000||p.snapshots.length>STUDIO_MAX_SNAPSHOTS)throw Error('Invalid studio history');
 let previous=0;
 for(const version of p.snapshots){
  if(!Number.isSafeInteger(version.id)||version.id<=previous||version.id>=p.nextId||!studioSourceMapValid(version.files,true)||version.hash!==releaseHash(version.files)||!evaluateRelease(version.files,true).passed)throw Error('Invalid studio snapshot');
  previous=version.id;
 }
 if(p.proof&&(p.proof.hash!==releaseHash(files)||p.proof.passed!==(studioSourceMapValid(files,true)&&evaluateRelease(files,true).passed)))throw Error('Studio proof must match current source');
}
