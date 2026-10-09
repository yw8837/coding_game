import {CAREER_JOBS} from './career-content.ts';

export const CAREER_ACT_TARGET=4;
export const CAREER_ROUTE_TARGET=12;
export function careerActCount(completed:readonly string[],act:number):number {
 return CAREER_JOBS.filter(job=>job.act===act&&completed.includes(job.id)).length;
}
export function careerActReady(completed:readonly string[],act:number):boolean {
 return careerActCount(completed,act)>=CAREER_ACT_TARGET;
}
export function careerPriorActsReady(completed:readonly string[],act:number):boolean {
 return [1,2,3].filter(value=>value<act).every(value=>careerActReady(completed,value));
}
export function careerRouteReady(completed:readonly string[]):boolean {
 return [1,2,3].every(act=>careerActReady(completed,act));
}
/** Extra commissions never conceal how close the chosen route is to release. */
export function careerRouteCount(completed:readonly string[]):number {
 return [1,2,3].reduce((sum,act)=>sum+Math.min(CAREER_ACT_TARGET,careerActCount(completed,act)),0);
}
export function careerEndingFor(completed:readonly string[],choices:Record<string,string>):'community'|'studio'|'balanced' {
 const jobs=CAREER_JOBS.filter(job=>completed.includes(job.id));
 const care=jobs.filter(job=>job.choices.find(choice=>choice.id===choices[job.id])?.style==='care').length;
 return care*3>=jobs.length*2?'community':care*3<=jobs.length?'studio':'balanced';
}
