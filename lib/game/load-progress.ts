import {readSave} from './save.ts';
type Stored={raw:string|null;recovered:boolean;error?:string};
/** A syntactically valid native save may still fail the full game schema. */
export async function loadProgress(primary:Stored,backup?:()=>Promise<Stored>){
 if(primary.raw){try{return {state:readSave(primary.raw),recovered:primary.recovered};}catch{}}
 else if(!primary.error)return {state:null,recovered:false};
 if(backup){const fallback=await backup();if(fallback.raw)return {state:readSave(fallback.raw),recovered:true};}
 throw Error('No valid save could be recovered');
}
