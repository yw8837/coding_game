import {z} from 'zod';
import type {GameState} from './engine.ts';
import {createGameplay} from './gameplay.ts';
import {createPractice,PRACTICE_IDS} from './practice.ts';
import {careerSchema} from './career-save.ts';
import {labSchema,validateLabSave} from './code-lab-save.ts';
import {validateLabWorkspace} from './code-lab-terminal.ts';
import {CAREER_JOBS} from './career-content.ts';
import {careerFiles} from './career.ts';
import {deliveredCareerValid} from './career-legacy-validation.ts';
import {releaseUnlocked,releaseFiles,releaseHash,evaluateRelease,releasePublishedFresh} from './release.ts';
import {validateStudioSave} from './studio.ts';
import {migrateLegacyStudioWorkspace} from './studio-migration.ts';
const text=z.string().max(60000);
const files=z.record(z.string().max(300),text);
const snapshot=z.object({id:z.string(),message:z.string(),files,mission:z.number().int().min(0).max(2),hash:z.string()});
const machine=z.object({cwd:z.string(),tools:z.array(z.string()),updated:z.boolean(),files,dirs:z.array(z.string()),dependencies:z.array(z.string()),pythonDeps:z.array(z.string()),processes:z.object({frontend:z.boolean(),backend:z.boolean()}),frontendRoot:z.string().nullable(),backendRoot:z.string().nullable(),backendSource:text.nullable(),cloned:z.boolean()});
const practiceValue=z.union([z.number().finite(),z.string().max(80),z.boolean()]);
const practiceProof=z.object({answer:z.string().max(80),passed:z.boolean(),error:z.enum(['syntax','unknown']).nullable(),cases:z.array(z.object({input:z.record(z.string().max(20),practiceValue),expected:practiceValue,actual:practiceValue,passed:z.boolean()})).max(10)});
const practice=z.object({completed:z.array(z.enum(PRACTICE_IDS)).max(6).default([]),drafts:z.record(z.enum(PRACTICE_IDS),z.string().max(80)).default({}),results:z.record(z.enum(PRACTICE_IDS),practiceProof).default({})}).default(createPractice);
const gameplay=z.object({lab:labSchema,career:careerSchema,practice,inspected:z.array(z.number().int().min(0).max(2)).default([]),servedCustomers:z.number().int().min(0).max(3).default(0),openingCelebrated:z.boolean().default(false),readMessages:z.array(z.string()).default([]),exploration:z.object({pwd:z.boolean().default(false),ls:z.boolean().default(false),readme:z.boolean().default(false)}).default({pwd:false,ls:false,readme:false}),claimedBonuses:z.array(z.string()).default([]),ownedCosmetics:z.array(z.string()).default(['mint']),equippedCosmetic:z.enum(['mint','amber','violet','loft']).default('mint'),designChoice:z.enum(['sunrise','ocean']).nullable().default(null),designEvidence:z.object({hash:z.string(),choice:z.enum(['sunrise','ocean']),passed:z.boolean()}).nullable().default(null)}).default(()=>({...createGameplay(),career:careerSchema.parse(undefined)}));
const schema=z.object({gameplay,version:z.literal(1),mission:z.number().int().min(0).max(2),accepted:z.boolean(),credits:z.number().finite().nonnegative(),xp:z.number().finite().nonnegative(),completed:z.array(z.number().int().min(0).max(2)),badges:z.array(z.string()),machine:z.enum(['local','server']),machines:z.object({local:machine,server:machine}),serverReady:z.boolean(),discovered:z.object({search:z.boolean(),repo:z.boolean(),preview:z.boolean()}),repo:z.object({root:z.string(),staged:z.record(z.string(),text.nullable()),commits:z.array(snapshot).min(1),remote:snapshot,merged:snapshot,deployed:snapshot,pr:z.object({commit:snapshot,status:z.enum(['changes-requested','approved','merged']),feedback:z.string()}).nullable()}).nullable(),tests:z.object({hash:z.string(),mission:z.number().int().min(0).max(2),checks:z.array(z.object({name:z.string(),passed:z.boolean(),detail:z.string().optional()}))}).nullable(),testRequest:z.number().int().nonnegative(),orders:z.array(z.object({id:z.number().int(),item:z.string(),quantity:z.number().int()})),localOrders:z.array(z.object({id:z.number().int(),item:z.string(),quantity:z.number().int()})),apiEvidence:z.object({menu:z.boolean(),order:z.boolean()}),notice:z.string(),logs:z.array(z.string()),history:z.array(z.object({command:z.string(),output:z.string(),error:z.boolean(),machine:z.enum(['local','server']),cwd:z.string()}))});
export const SAVE_KEY='codeshift-intro-demo-v1';
// Preserve the former legacy input ceiling, reserving bounded headroom for defaults and migration.
const MAX_LEGACY_SAVE_CHARS=4_000_000;
const MAX_SAVE_CHARS=4_100_000;
function validateCareer(state:GameState){validateStudioSave(state);const c=state.gameplay.career;if(c.accepted.length&&(!state.gameplay.openingCelebrated||![0,1,2].every(m=>state.completed.includes(m))))throw Error('Career requires the cafe opening');for(const id of c.completed){const job=CAREER_JOBS.find(j=>j.id===id)!;const files=careerFiles(state,id);if(Object.keys(job.files).some(p=>typeof files[p]!=='string'||files[p].length>20000)||!deliveredCareerValid(id,files,c.rulesRevision))throw Error('Delivered job files are missing or invalid');}
 const release=c.release;if(!release)return;if(release.started&&!releaseUnlocked(state))throw Error('Release requires cafe OPEN and four deliveries per district');
 const files=releaseFiles(state),hash=releaseHash(files),evaluation=evaluateRelease(files,release.formatRevision===2);
 if(release.proof&&(release.proof.hash!==hash||release.proof.passed!==evaluation.passed))throw Error('Release proof must match current source');
 if(release.build&&(release.build.hash!==hash||!evaluation.passed))throw Error('Release build must match passing current source');
 if(release.published&&!releasePublishedFresh(state))throw Error('Published release source or records are invalid');
}
export function readSave(raw:string):GameState {
 if(raw.length>MAX_SAVE_CHARS)throw new Error('Save too large');
 const data=JSON.parse(raw),legacy=!data?.gameplay?.career||!Object.hasOwn(data.gameplay.career,'studio');
 if(legacy&&raw.length>MAX_LEGACY_SAVE_CHARS)throw new Error('Save too large');
 const state=schema.parse(data) as GameState;
 if(legacy)migrateLegacyStudioWorkspace(state);
 if(JSON.stringify(state).length>MAX_SAVE_CHARS)throw new Error('Save too large after migration');
 validateCareer(state);validateLabSave(state.gameplay.lab);validateLabWorkspace(state);return state;
}
export function writeSave(storage:Pick<Storage,'setItem'>,state:GameState):void {
 const raw=JSON.stringify(state);
 if(raw.length>MAX_SAVE_CHARS)throw new Error('Save too large');
 const parsed=schema.parse(state) as GameState;
 validateCareer(parsed);
 validateLabSave(parsed.gameplay.lab);
 validateLabWorkspace(parsed);
 const normalized=JSON.stringify(parsed);
 if(normalized.length>MAX_SAVE_CHARS)throw new Error('Save too large after normalization');
 storage.setItem(SAVE_KEY,normalized);
}
