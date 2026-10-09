import {z} from 'zod';
import {createLab,LAB_IDS,labJob,equalValue,type LabProgress} from './code-lab.ts';
import type {CodeValue} from './code-lab-runtime.ts';
function validValue(value:unknown,depth=0,budget={nodes:0}):value is CodeValue{
 if(++budget.nodes>5000||depth>16)return false;
 if(value===null||typeof value==='boolean')return true;
 if(typeof value==='number')return Number.isFinite(value);
 if(typeof value==='string')return value.length<=4000;
 if(typeof value!=='object'||value===null)return false;
 if(Array.isArray(value))return value.length<=500&&value.every(v=>validValue(v,depth+1,budget));
 const entries=Object.entries(value);return entries.length<=200&&entries.every(([key,v])=>key.length<=4000&&!['__proto__','constructor','prototype'].includes(key)&&validValue(v,depth+1,budget));
}
const value=z.custom<CodeValue>(validValue);
const error=z.object({kind:z.enum(['syntax','unsupported','runtime','budget']),message:z.string().max(1000),line:z.number().int().min(1).max(12000).optional()}).nullable();
const proof=z.object({source:z.string().max(12000),seed:z.number().int().min(1).max(9999),passed:z.boolean(),steps:z.number().int().min(0).max(100000),cases:z.array(z.object({input:value,expected:value,actual:value,passed:z.boolean(),error})).max(10)});
export const labSchema=z.object({
 completed:z.array(z.enum(LAB_IDS)).max(LAB_IDS.length).default([]),audited:z.array(z.enum(LAB_IDS)).max(LAB_IDS.length).default([]),
 workspaces:z.array(z.enum(LAB_IDS)).max(LAB_IDS.length).default([]),
 drafts:z.record(z.enum(LAB_IDS),z.string().max(12000)).default({}),testInputs:z.record(z.enum(LAB_IDS),z.string().max(4000)).default({}),
 seeds:z.record(z.enum(LAB_IDS),z.number().int().min(1).max(9999)).default({}),bestSteps:z.record(z.enum(LAB_IDS),z.number().int().min(0).max(100000)).default({}),
 proofs:z.record(z.enum(LAB_IDS),proof).default({}),
}).default(createLab);

/** Validate retained evidence without executing player programs during autosave. */
export function validateLabSave(lab:LabProgress):void{
 if(new Set(lab.completed).size!==lab.completed.length||new Set(lab.audited).size!==lab.audited.length||new Set(lab.workspaces).size!==lab.workspaces.length||lab.audited.some(id=>!lab.completed.includes(id)))throw Error('Invalid lab progress');
 for(const id of LAB_IDS){
  const proof=lab.proofs[id];if(!proof)continue;
  const job=labJob(id)!;
  if(proof.source!==(lab.drafts[id]??job.starter)||proof.seed!==(lab.seeds[id]??1))throw Error('Lab proof is stale');
  const cases=job.cases(proof.seed);
  if(cases.length!==proof.cases.length||proof.passed!==proof.cases.every(c=>c.passed))throw Error('Invalid lab proof');
  for(let i=0;i<cases.length;i++){
   const result=proof.cases[i],expected=cases[i];
   if(!equalValue(result.input,expected.input)||!equalValue(result.expected,expected.expected)||result.passed!==(!result.error&&equalValue(result.actual,result.expected)))throw Error('Lab result does not match its case');
  }
 }
}
