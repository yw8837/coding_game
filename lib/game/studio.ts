import {authoredProjectFormat,authoredStartFiles,MAX_ASSETS_SOURCE,type AuthoredFormat,type AuthoredLanguage} from './release-authored.ts';
import {evaluateRelease,releaseFiles,releaseHash,releasePublishedFresh,type ReleaseProgress} from './release.ts';

export const STUDIO_ROOT='/home/dev/studio/workbench';
export const STUDIO_FILE_NAMES=['index.html','style.css','server.json','project.json'] as const;
export const STUDIO_MAX_SOURCE=20000;
export const STUDIO_MAX_SNAPSHOTS=5;
export type StudioSourceMap=Record<string,string>;
export type StudioSnapshot={id:number;hash:string;files:StudioSourceMap};
export type StudioProgress={authoredFormat?:AuthoredFormat;appId:string;nextId:number;proof:{hash:string;passed:boolean}|null;snapshots:StudioSnapshot[]};
export type StudioAction={type:'career-studio-start'|'career-studio-test'|'career-studio-snapshot'}|{type:'career-studio-edit';file:string;content:string}|{type:'career-studio-restore';id:number;confirmLoss?:boolean}|{type:'career-studio-upgrade';format:AuthoredFormat;language:AuthoredLanguage;confirmLoss?:boolean};
type Host={notice?:string;completed:number[];gameplay:{openingCelebrated:boolean;career:{completed:string[];release:ReleaseProgress;studio?:StudioProgress|null}};machines:{local:{files:Record<string,string>;dirs:string[]}}};
export function studioSourceMapValid(files:unknown,complete=false):files is StudioSourceMap{
 if(!files||typeof files!=='object'||Array.isArray(files))return false;
 const entries=Object.entries(files);
 return entries.length<=5&&entries.every(([file,content])=>(STUDIO_FILE_NAMES.includes(file as typeof STUDIO_FILE_NAMES[number])||file==='assets.json')&&typeof content==='string'&&content.length<=(file==='assets.json'?MAX_ASSETS_SOURCE:STUDIO_MAX_SOURCE)&&!content.includes('\0'))&&(!complete||STUDIO_FILE_NAMES.every(file=>Object.hasOwn(files,file))&&(!Object.hasOwn(files,'assets.json')||!!authoredProjectFormat(files as StudioSourceMap)));
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
 return !!p?.proof?.passed&&p.proof.hash===releaseHash(files)&&studioSourceMapValid(files,true)&&evaluateRelease(files,true,(s.gameplay.career.studio?.authoredFormat??s.gameplay.career.release.authoredFormat)).passed;
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
const STUDIO_SAVE_LIMIT_CHARS=4_090_000;
function studioFitsSave(s:Host,files:StudioSourceMap,studio:StudioProgress):boolean{
 const localFiles={...s.machines.local.files};for(const path of Object.keys(localFiles))if(path.startsWith(STUDIO_ROOT+'/'))delete localFiles[path];for(const [file,content] of Object.entries(files))localFiles[STUDIO_ROOT+'/'+file]=content;
 const projected={...s,machines:{...s.machines,local:{...s.machines.local,files:localFiles}},gameplay:{...s.gameplay,career:{...s.gameplay.career,studio}}};
 if(JSON.stringify(projected).length<=STUDIO_SAVE_LIMIT_CHARS)return true;
 s.notice='사진과 버전 기록이 저장 용량에 가까워요. 사진 크기를 줄인 뒤 다시 시도하세요. / Photos and version history are close to the save limit. Import smaller images and try again. / 写真とバージョン履歴が保存容量に近づいています。小さい画像でもう一度お試しください。';return false;
}
function upgradeStudioFiles(files:StudioSourceMap,format:AuthoredFormat,language:AuthoredLanguage):StudioSourceMap{
 const evaluation=evaluateRelease(files,true),product=evaluation.preview.product,escape=(value:string)=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
 const result=authoredStartFiles(format,language);
 const items=format==='website'?'<section><ul>'+product.items.map(item=>'<li><h2>'+escape(item.name)+'</h2><p>'+escape(item.detail)+'</p><small>'+escape(item.category)+'</small></li>').join('')+'</ul></section>':'<section data-app="items"></section><section data-app="inquiry"></section>';
 result['index.html']='<!doctype html>\n<html lang="'+language+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>'+escape(evaluation.preview.title)+'</title><link rel="stylesheet" href="style.css"></head><body><main class="portal"><h1>'+escape(evaluation.preview.title)+'</h1><p>'+escape(product.description)+'</p>'+items+'</main></body></html>\n';
 result['style.css']+='\n'+files['style.css'];result['project.json']=JSON.stringify({...product,version:1,format,language},null,2)+'\n';
 return result;
}

export function canWriteStudio(s:Host,file:string,content:string):boolean{
 const p=s.gameplay.career.studio;if(!p||!studioSourceMapValid({[file]:content}))return false;
 return studioFitsSave({...s},{...studioFiles(s),[file]:content},p);
}
export function canSnapshotStudio(s:Host):boolean{
 const p=s.gameplay.career.studio;if(!p||!studioFresh(s)||p.nextId>=1_000_000_000)return false;
 const files=studioFiles(s),hash=releaseHash(files);if(p.snapshots.at(-1)?.hash===hash)return false;
 return studioFitsSave({...s},files,{...p,nextId:p.nextId+1,snapshots:[...p.snapshots,{id:p.nextId,hash,files:{...files}}].slice(-STUDIO_MAX_SNAPSHOTS)});
}
export function sourceEditFitsSave(s:Host,root:string,file:string,content:string):boolean{
 if(!['/home/dev/studio/launch',STUDIO_ROOT].includes(root)||!studioSourceMapValid({[file]:content}))return false;
 const projected={...s,machines:{...s.machines,local:{...s.machines.local,files:{...s.machines.local.files,[root+'/'+file]:content}}}};
 return JSON.stringify(projected).length<=STUDIO_SAVE_LIMIT_CHARS;
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
  if(!studioSourceMapValid(files,true)||!evaluateRelease(files,true,(s.gameplay.career.studio?.authoredFormat??s.gameplay.career.release.authoredFormat)).passed)return;
  const progress:StudioProgress={appId:c.release.published!.hash,nextId:1,proof:null,snapshots:[],...(c.release.authoredFormat?{authoredFormat:c.release.authoredFormat}:{})};if(!studioFitsSave(s,files,progress))return;
  replaceStudio(s,files);c.studio=progress;return;
 }
 const p=c.studio;if(!p)return;
 if(a.type==='career-studio-upgrade'){
  if(a.confirmLoss!==true||p.authoredFormat||c.release.authoredFormat||authoredProjectFormat(studioFiles(s))||!['website','webapp'].includes(a.format)||!['ko','en','ja'].includes(a.language))return;
  const original=studioFiles(s);if(!studioSourceMapValid(original,true)||!evaluateRelease(original,true).passed||p.nextId>=1_000_000_000)return;
  const hash=releaseHash(original),files=upgradeStudioFiles(original,a.format,a.language),snapshots=p.snapshots.at(-1)?.hash===hash?p.snapshots:[...p.snapshots,{id:p.nextId,hash,files:{...original}}].slice(-STUDIO_MAX_SNAPSHOTS),progress={...p,authoredFormat:a.format,proof:null,snapshots,nextId:p.nextId+(p.snapshots.at(-1)?.hash===hash?0:1)};
  if(!studioFitsSave(s,files,progress))return;replaceStudio(s,files);c.studio=progress;return;
 }
 if(a.type==='career-studio-edit'){
  if(!studioSourceMapValid({[a.file]:a.content}))return;
  if(!studioFitsSave(s,{...studioFiles(s),[a.file]:a.content},p))return;
  s.machines.local.files[STUDIO_ROOT+'/'+a.file]=a.content;invalidateStudio(s);return;
 }
 const files=studioFiles(s),hash=releaseHash(files);
 if(a.type==='career-studio-test'){p.proof={hash,passed:studioSourceMapValid(files,true)&&evaluateRelease(files,true,(s.gameplay.career.studio?.authoredFormat??s.gameplay.career.release.authoredFormat)).passed};return;}
 if(a.type==='career-studio-snapshot'){
  if(!studioFresh(s)||p.snapshots.at(-1)?.hash===hash||p.nextId>=1_000_000_000)return;
  const snapshots=[...p.snapshots,{id:p.nextId,hash,files:{...files}}].slice(-STUDIO_MAX_SNAPSHOTS);
  if(!studioFitsSave(s,files,{...p,nextId:p.nextId+1,snapshots}))return;
  p.snapshots=snapshots;p.nextId++;return;
 }
 if(a.type==='career-studio-restore'){
  const version=p.snapshots.find(v=>v.id===a.id);
  if(!version||!studioSourceMapValid(version.files,true)||releaseHash(version.files)!==version.hash||!evaluateRelease(version.files,true).passed)return;
  if(hash===version.hash)return;
  if(studioHasUnsnapshottedChanges(s)&&a.confirmLoss!==true)return;
  const format=authoredProjectFormat(version.files);if(c.release.authoredFormat&&format!==c.release.authoredFormat)return;
  if(!studioFitsSave(s,version.files,{...p,proof:null,authoredFormat:format??undefined}))return;
  replaceStudio(s,version.files);p.proof=null;if(format)p.authoredFormat=format;else delete p.authoredFormat;
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
 if(p.proof&&(p.proof.hash!==releaseHash(files)||p.proof.passed!==(studioSourceMapValid(files,true)&&evaluateRelease(files,true,(s.gameplay.career.studio?.authoredFormat??s.gameplay.career.release.authoredFormat)).passed)))throw Error('Studio proof must match current source');
}
