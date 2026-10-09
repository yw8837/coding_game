import type {GameState} from './engine.ts';
import {createLab,auditLab,labJob} from './code-lab.ts';
import {materializeLabWorkspace,labSourcePath,labInputPath,labTestPath,updateLabTestTemplate,labEvaluationSource,recordLabProof} from './code-lab-terminal.ts';
export type LabAction={type:'lab-draft';id:string;source:string}|{type:'lab-run'|'lab-new-data'|'lab-audit'|'lab-workspace';id:string}|{type:'lab-audit-draft';id:string;input:string};
/** Called with the reducer's cloned state. Actual evaluation owns every reward. */
export function applyLab(s:GameState,action:LabAction):GameState{
 const job=labJob(action.id);if(!job)return s;
 const lab=s.gameplay.lab??(s.gameplay.lab=createLab());
 if(action.type==='lab-workspace'){materializeLabWorkspace(s,job.id);s.notice='Workspace ready: /home/dev/code-lab';return s;}
 if(action.type==='lab-draft'){
  if(typeof action.source!=='string'||action.source.length>12000){s.notice='Lab source is limited to 12,000 characters. The previous file was preserved.';return s;}
  lab.drafts[job.id]=action.source;delete lab.proofs[job.id];
  const files=s.machines.local.files;if(lab.workspaces.includes(job.id)||files[labSourcePath(job.id)]!==undefined||files[labInputPath(job.id)]!==undefined||files[labTestPath(job.id)]!==undefined)files[labSourcePath(job.id)]=action.source;
  return s;
 }
 if(action.type==='lab-audit-draft'){
  if(typeof action.input==='string'&&action.input.length<=4000)lab.testInputs[job.id]=action.input;
  return s;
 }
 if(action.type==='lab-new-data'){
  const oldSeed=lab.seeds[job.id]??1;lab.seeds[job.id]=oldSeed%9999+1;delete lab.proofs[job.id];updateLabTestTemplate(s,job.id,oldSeed);return s;
 }
 if(action.type==='lab-run'){
  const selected=labEvaluationSource(s,job.id);if(selected.error){s.notice=selected.error;return s;}
  recordLabProof(s,job.id,selected.source!);
  return s;
 }
 if(action.type==='lab-audit'&&lab.completed.includes(job.id)){
  const audit=auditLab(job.id,lab.testInputs[job.id]??JSON.stringify(job.auditSample));
  if(audit.passed&&!lab.audited.includes(job.id)){lab.audited.push(job.id);s.credits+=30;s.xp+=15;}
 }
 return s;
}
