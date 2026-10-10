import {CAREER_JOBS,type CareerJob,type CareerChoice} from './career-content.ts';
import {careerFiles,careerHash,careerUnlocked} from './career.ts';
import {careerImpact,type CareerImpactModel} from './career-impact.ts';
import {evaluateCareer} from './career-evaluation.ts';
import {allowedCareerFile,CAREER_CODE_MODE_FILE} from './career-code.ts';
import type {GameState} from './engine.ts';

export type CareerPortfolioEntry={job:CareerJob;reply:CareerChoice|null;impact:CareerImpactModel|null;files:string[];deliveryFilesIntact:boolean};
export type CareerPortfolioModel={entries:CareerPortfolioEntry[];available:CareerJob[];locked:number;totalJobs:number;creditsReceived:number;xpReceived:number};

/** The save's completed IDs and replies are receipts; browsing never executes a reward action. */
export function careerPortfolio(state:GameState):CareerPortfolioModel {
 const progress=state.gameplay.career,ids=[...new Set(progress.completed)];
 const entries:CareerPortfolioEntry[]=ids.flatMap(id=>{
  const job=CAREER_JOBS.find(item=>item.id===id);if(!job)return [];
  const files=careerFiles(state,id),proof=progress.proofs[id];
  return [{job,reply:job.choices.find(choice=>choice.id===progress.choices[id])??null,
   impact:careerImpact(state,id),
   files:Object.keys(files).filter(file=>file!==CAREER_CODE_MODE_FILE&&allowedCareerFile(id,file)),
   deliveryFilesIntact:!!proof?.passed&&proof.hash===careerHash(files)&&evaluateCareer(id,files).passed}];
 });
 const remaining=CAREER_JOBS.filter(job=>!ids.includes(job.id));
 return {entries,totalJobs:CAREER_JOBS.length,available:remaining.filter(job=>careerUnlocked(state,job)),locked:remaining.filter(job=>!careerUnlocked(state,job)).length,
  creditsReceived:entries.reduce((sum,entry)=>sum+entry.job.credits,0),xpReceived:entries.reduce((sum,entry)=>sum+entry.job.xp,0)};
}
