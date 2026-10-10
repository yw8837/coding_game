import {CAREER_JOBS,type Localized} from './career-content.ts';
import {careerFiles,careerFresh,careerHash} from './career.ts';
import {evaluateCareer,exampleSolution} from './career-evaluation.ts';
import {careerCodeModeSafe} from './career-code.ts';
import {applyLearningStep,careerLearningSteps,learningInput} from './career-learning.ts';
import {CAREER_ACT_TARGET,careerActCount,careerPriorActsReady,careerRouteCount,careerRouteReady} from './career-progress.ts';
import type {GameState} from './engine.ts';

export type CareerImpactModel={
 jobId:string;phase:'passed'|'delivered';hash:string;
 rows:Array<{label:Localized;before:string;after:string}>;
 unchanged:number;additional:number;credits:number;xp:number;
 district:number;districtCompleted:number;districtTotal:number;districtTarget:number;
 routeCompleted:number;nextDistrict:number|null;releaseReady:boolean;
 /** Set only while the current files pass: 'javascript' for code mode, 'config' when the files differ from every reference answer. */
 ownSolution:'javascript'|'config'|null;
};

/** Spacing, key order, row order, attribute order and comments do not make a different answer. */
function canonical(path:string,source:string):string {
 const text=source.replace(/\r\n?/g,'\n'),squash=(value:string)=>value.replace(/\s+/g,' ').trim();
 if(path.endsWith('.json'))try{
  const sorted=(value:unknown):unknown=>Array.isArray(value)?value.map(sorted):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,item])=>[key,sorted(item)])):value;
  return JSON.stringify(sorted(JSON.parse(text)));
 }catch{return squash(text);}
 if(path.endsWith('.csv')){const [head='',...rows]=text.split('\n').map(line=>line.split(',').map(cell=>cell.trim()).join(',')).filter(line=>line.replace(/,/g,''));return [head,...rows.sort()].join('\n');}
 if(path.endsWith('.css'))return text.replace(/\/\*[\s\S]*?\*\//g,'').split('}').map(block=>{const [selector,body='']=block.split('{');return squash(selector)+'{'+body.split(';').map(rule=>squash(rule).replace(/\s*:\s*/,':')).filter(Boolean).sort().join(';')+'}';}).filter(block=>block!=='{}').join('');
 if(path.endsWith('.html'))return squash(text.replace(/<!--[\s\S]*?-->/g,'').replace(/<([a-z][\w-]*)([^>]*)>/gi,(_all,tag:string,attrs:string)=>'<'+tag.toLowerCase()+[...attrs.matchAll(/([^\s=/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)].map(m=>{const value=m[2]??m[3]??m[4];return ' '+m[1].toLowerCase()+(value?'="'+value+'"':'');}).sort().join('')+'>').replace(/>\s+/g,'>').replace(/\s+</g,'<'));
 return squash(text);
}
/** The files a player ends with after following every guided step with the intended value. */
function guidedSolution(id:string,files:Record<string,string>,act:number):Record<string,string> {
 for(const step of careerLearningSteps(id)){const result=applyLearningStep(id,step.id,files,learningInput(step,step.correct,act));if(result.ok)files={...files,[result.file]:result.content};}
 return files;
}
/** Which way a passing solution was reached. Never call it for failing files: a wrong answer is not a different answer. */
export function careerOwnSolution(id:string,files:Record<string,string>):'javascript'|'config'|null {
 const job=CAREER_JOBS.find(item=>item.id===id);if(!job)return null;
 if(careerCodeModeSafe(files)==='javascript')return 'javascript';
 const same=(reference:Record<string,string>)=>Object.keys(job.files).every(path=>canonical(path,files[path]??'')===canonical(path,reference[path]??''));
 return same(exampleSolution(id))||same(guidedSolution(id,{...job.files},job.act))?null:'config';
}

/** A view of real evaluated output and recorded rewards. Reading it never grants a reward. */
export function careerImpact(state:GameState,id:string,unsaved=false):CareerImpactModel|null {
 const job=CAREER_JOBS.find(item=>item.id===id);
 if(!job)return null;
 const completed=state.gameplay.career.completed,delivered=completed.includes(id);
 if(!delivered&&(unsaved||!state.gameplay.career.accepted.includes(id)||!state.gameplay.career.inspected.includes(id)||!careerFresh(state,id)))return null;
 const files=careerFiles(state,id),current=evaluateCareer(id,files);
 if(!delivered&&!current.passed)return null;
 const original=evaluateCareer(id,job.files);
 // Config and JavaScript can have different check counts. Match names, never positions.
 const baseline=new Map(original.checks.map(row=>[JSON.stringify(row.name),row]));
 const rows:CareerImpactModel['rows']=[];
 let unchanged=0,additional=0;
 for(const row of current.checks){
  const before=baseline.get(JSON.stringify(row.name));
  if(!before){additional++;continue;}
  if(before.actual===row.actual){unchanged++;continue;}
  rows.push({label:row.name,before:before.actual,after:row.actual});
 }
 return {jobId:id,phase:delivered?'delivered':'passed',hash:careerHash(files),rows,unchanged,additional,
  credits:job.credits,xp:job.xp,district:job.act,districtCompleted:careerActCount(completed,job.act),
  districtTotal:CAREER_JOBS.filter(item=>item.act===job.act).length,districtTarget:CAREER_ACT_TARGET,
  routeCompleted:careerRouteCount(completed),
  nextDistrict:job.act<3&&careerPriorActsReady(completed,job.act+1)?job.act+1:null,
  releaseReady:careerRouteReady(completed),ownSolution:current.passed?careerOwnSolution(id,files):null};
}
