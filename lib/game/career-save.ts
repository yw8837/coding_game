import {z} from 'zod';
import {CAREER_JOBS} from './career-content.ts';
import {createCareer,CAREER_UPGRADES} from './career.ts';
import {createRelease} from './release.ts';
import {careerPriorActsReady,careerRouteReady,careerEndingFor} from './career-progress.ts';
import {allowedCareerFile} from './career-code.ts';
import {studioSourceMapValid,STUDIO_MAX_SNAPSHOTS} from './studio.ts';
const studioFilesSchema=z.record(z.string().max(100),z.string().max(500000)).refine(files=>studioSourceMapValid(files));
const jobId=z.string().max(64).refine(id=>CAREER_JOBS.some(j=>j.id===id));
const ids=z.array(jobId).max(18).refine(a=>new Set(a).size===a.length);
export const careerSchema=z.object({
 studio:z.object({authoredFormat:z.enum(['website','webapp']).optional(),appId:z.string().regex(/^[a-f0-9]{16}$/),nextId:z.number().int().min(1).max(1_000_000_000),proof:z.object({hash:z.string().regex(/^[a-f0-9]{16}$/),passed:z.boolean()}).nullable(),snapshots:z.array(z.object({id:z.number().int().min(1),hash:z.string().regex(/^[a-f0-9]{16}$/),files:studioFilesSchema})).max(STUDIO_MAX_SNAPSHOTS)}).nullable().default(null),
 rulesRevision:z.union([z.literal(1),z.literal(2)]).default(1),
 release:z.object({authoredFormat:z.enum(['website','webapp']).optional(),formatRevision:z.union([z.literal(1),z.literal(2)]).default(1),started:z.boolean(),proof:z.object({hash:z.string().max(40),passed:z.boolean()}).nullable(),build:z.object({hash:z.string().max(40),version:z.literal('1.0.0')}).nullable(),published:z.object({hash:z.string().max(40),version:z.literal('1.0.0')}).nullable()}).default(createRelease),
 active:jobId.nullable(),accepted:ids,inspected:ids,completed:ids,
 proofs:z.record(jobId,z.object({hash:z.string().max(40),passed:z.boolean()})),
 choices:z.record(jobId,z.string().max(64)),
 upgrades:z.array(z.string().refine(id=>CAREER_UPGRADES.some(u=>u.id===id))).max(3).refine(a=>new Set(a).size===a.length),
 checkpoints:z.record(jobId,z.record(z.string().max(100),z.string().max(20000))),
 ending:z.enum(['community','studio','balanced']).nullable(),
 endingJobs:ids.default([]),
}).superRefine((c,ctx)=>{
 const release=c.release;if(release.authoredFormat&&(!release.started||release.formatRevision!==2))ctx.addIssue({code:'custom',message:'Authored format requires a started current project'});if(!release.started&&(release.proof||release.build||release.published))ctx.addIssue({code:'custom',message:'Release records require a started project'});
 if(release.build&&(!release.proof?.passed||release.build.hash!==release.proof.hash))ctx.addIssue({code:'custom',message:'Release build requires matching passed proof'});
 if(release.published&&(!release.build||release.published.hash!==release.build.hash))ctx.addIssue({code:'custom',message:'Published release requires matching build'});
 if([...c.inspected,...c.completed,...(c.active?[c.active]:[])].some(id=>!c.accepted.includes(id)))ctx.addIssue({code:'custom',message:'Career stage requires accepted job'});
 if(c.completed.some(id=>!c.inspected.includes(id)||!c.choices[id]))ctx.addIssue({code:'custom',message:'Delivered job requires inspection and a reply'});
 if(c.accepted.some(id=>!careerPriorActsReady(c.completed,CAREER_JOBS.find(j=>j.id===id)!.act)))ctx.addIssue({code:'custom',message:'Earlier acts require four completed contracts each'});
 if(Object.entries(c.choices).some(([id,v])=>!CAREER_JOBS.find(j=>j.id===id)?.choices.some(x=>x.id===v)))ctx.addIssue({code:'custom',message:'Invalid customer reply'});
 const endingBasis=c.endingJobs.length?c.endingJobs:c.completed;
 if(!c.ending&&c.endingJobs.length)ctx.addIssue({code:'custom',message:'Ending snapshot requires an ending'});
 if(c.endingJobs.length&&!c.release.published)ctx.addIssue({code:'custom',message:'New ending snapshots require a published project'});
 if(c.ending&&(!careerRouteReady(endingBasis)||endingBasis.some(id=>!c.completed.includes(id))||(!c.endingJobs.length&&c.completed.length!==CAREER_JOBS.length)))ctx.addIssue({code:'custom',message:'Ending requires a completed route snapshot'});
 if(c.ending&&c.ending!==careerEndingFor(endingBasis,c.choices))ctx.addIssue({code:'custom',message:'Ending must match the saved replies'});
 for(const [id,files] of Object.entries(c.checkpoints))if(Object.keys(files).some(p=>!allowedCareerFile(id,p)))ctx.addIssue({code:'custom',message:'Invalid checkpoint file'});
}).default(()=>({...createCareer(),rulesRevision:1 as const}));
