import {z} from 'zod';
import {CAREER_JOBS} from './career-content.ts';
import {createCareer,CAREER_UPGRADES} from './career.ts';
import {createRelease} from './release.ts';
const jobId=z.string().max(64).refine(id=>CAREER_JOBS.some(j=>j.id===id));
const ids=z.array(jobId).max(18).refine(a=>new Set(a).size===a.length);
export const careerSchema=z.object({
 rulesRevision:z.union([z.literal(1),z.literal(2)]).default(1),
 release:z.object({started:z.boolean(),proof:z.object({hash:z.string().max(40),passed:z.boolean()}).nullable(),build:z.object({hash:z.string().max(40),version:z.literal('1.0.0')}).nullable(),published:z.object({hash:z.string().max(40),version:z.literal('1.0.0')}).nullable()}).default(createRelease),
 active:jobId.nullable(),accepted:ids,inspected:ids,completed:ids,
 proofs:z.record(jobId,z.object({hash:z.string().max(40),passed:z.boolean()})),
 choices:z.record(jobId,z.string().max(64)),
 upgrades:z.array(z.string().refine(id=>CAREER_UPGRADES.some(u=>u.id===id))).max(3).refine(a=>new Set(a).size===a.length),
 checkpoints:z.record(jobId,z.record(z.string().max(100),z.string().max(20000))),
 ending:z.enum(['community','studio','balanced']).nullable(),
}).superRefine((c,ctx)=>{
 const release=c.release;if(!release.started&&(release.proof||release.build||release.published))ctx.addIssue({code:'custom',message:'Release records require a started project'});
 if(release.build&&(!release.proof?.passed||release.build.hash!==release.proof.hash))ctx.addIssue({code:'custom',message:'Release build requires matching passed proof'});
 if(release.published&&(!release.build||release.published.hash!==release.build.hash))ctx.addIssue({code:'custom',message:'Published release requires matching build'});
 if([...c.inspected,...c.completed,...(c.active?[c.active]:[])].some(id=>!c.accepted.includes(id)))ctx.addIssue({code:'custom',message:'Career stage requires accepted job'});
 if(c.completed.some(id=>!c.inspected.includes(id)||!c.choices[id]))ctx.addIssue({code:'custom',message:'Delivered job requires inspection and a reply'});
 if(c.accepted.some(id=>CAREER_JOBS.filter(j=>j.act<CAREER_JOBS.find(j=>j.id===id)!.act).some(j=>!c.completed.includes(j.id))))ctx.addIssue({code:'custom',message:'Earlier acts must be completed'});
 if(Object.entries(c.choices).some(([id,v])=>!CAREER_JOBS.find(j=>j.id===id)?.choices.some(x=>x.id===v)))ctx.addIssue({code:'custom',message:'Invalid customer reply'});
 if(c.ending&&c.completed.length!==CAREER_JOBS.length)ctx.addIssue({code:'custom',message:'Ending requires all contracts'});
 if(c.ending){const care=CAREER_JOBS.filter(j=>j.choices.find(x=>x.id===c.choices[j.id])?.style==='care').length;if(c.ending!==(care>=12?'community':care<=6?'studio':'balanced'))ctx.addIssue({code:'custom',message:'Ending must match delivered replies'});}
 for(const [id,files] of Object.entries(c.checkpoints))if(Object.keys(files).some(p=>!Object.hasOwn(CAREER_JOBS.find(j=>j.id===id)!.files,p)))ctx.addIssue({code:'custom',message:'Invalid checkpoint file'});
}).default(()=>({...createCareer(),rulesRevision:1 as const}));
