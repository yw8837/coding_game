import {CAREER_JOBS,type Localized} from './career-content.ts';
import {careerFiles,careerFresh,careerHash} from './career.ts';
import {evaluateCareer} from './career-evaluation.ts';
import {CAREER_ACT_TARGET,careerActCount,careerPriorActsReady,careerRouteCount,careerRouteReady} from './career-progress.ts';
import type {GameState} from './engine.ts';

export type CareerImpactModel={
 jobId:string;phase:'passed'|'delivered';hash:string;
 rows:Array<{label:Localized;before:string;after:string}>;
 unchanged:number;additional:number;credits:number;xp:number;
 district:number;districtCompleted:number;districtTotal:number;districtTarget:number;
 routeCompleted:number;nextDistrict:number|null;releaseReady:boolean;
};

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
  releaseReady:careerRouteReady(completed)};
}
