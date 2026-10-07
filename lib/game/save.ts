import {z} from 'zod';
import type {GameState} from './engine.ts';
const text=z.string().max(60000);
const files=z.record(z.string().max(300),text);
const snapshot=z.object({id:z.string(),message:z.string(),files,mission:z.number().int().min(0).max(2),hash:z.string()});
const machine=z.object({cwd:z.string(),tools:z.array(z.string()),updated:z.boolean(),files,dirs:z.array(z.string()),dependencies:z.array(z.string()),pythonDeps:z.array(z.string()),processes:z.object({frontend:z.boolean(),backend:z.boolean()}),frontendRoot:z.string().nullable(),backendRoot:z.string().nullable(),backendSource:text.nullable(),cloned:z.boolean()});
const schema=z.object({version:z.literal(1),mission:z.number().int().min(0).max(2),accepted:z.boolean(),credits:z.number().finite().nonnegative(),xp:z.number().finite().nonnegative(),completed:z.array(z.number().int().min(0).max(2)),badges:z.array(z.string()),machine:z.enum(['local','server']),machines:z.object({local:machine,server:machine}),serverReady:z.boolean(),discovered:z.object({search:z.boolean(),repo:z.boolean(),preview:z.boolean()}),repo:z.object({root:z.string(),staged:z.record(z.string(),text.nullable()),commits:z.array(snapshot).min(1),remote:snapshot,merged:snapshot,deployed:snapshot,pr:z.object({commit:snapshot,status:z.enum(['changes-requested','approved','merged']),feedback:z.string()}).nullable()}).nullable(),tests:z.object({hash:z.string(),mission:z.number().int().min(0).max(2),checks:z.array(z.object({name:z.string(),passed:z.boolean(),detail:z.string().optional()}))}).nullable(),testRequest:z.number().int().nonnegative(),orders:z.array(z.object({id:z.number().int(),item:z.string(),quantity:z.number().int()})),localOrders:z.array(z.object({id:z.number().int(),item:z.string(),quantity:z.number().int()})),apiEvidence:z.object({menu:z.boolean(),order:z.boolean()}),notice:z.string(),logs:z.array(z.string()),history:z.array(z.object({command:z.string(),output:z.string(),error:z.boolean(),machine:z.enum(['local','server']),cwd:z.string()}))});
export const SAVE_KEY='codeshift-save-v1';
const MAX_SAVE_CHARS=4_000_000;
export function readSave(raw:string):GameState {if(raw.length>MAX_SAVE_CHARS)throw new Error('Save too large');return schema.parse(JSON.parse(raw)) as GameState;}
export function writeSave(storage:Pick<Storage,'setItem'>,state:GameState):void {
 const raw=JSON.stringify(state);
 if(raw.length>MAX_SAVE_CHARS)throw new Error('Save too large');
 schema.parse(state);
 storage.setItem(SAVE_KEY,raw);
}
