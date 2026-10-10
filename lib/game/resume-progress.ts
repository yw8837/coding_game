import {createGame,type GameState} from './engine.ts';

function progressState(state:GameState) {
 // System notices/logs and save-format migrations do not represent player work.
 return {...state,notice:'',logs:[],gameplay:{...state.gameplay,career:{
  ...state.gameplay.career,rulesRevision:2,
  release:{...state.gameplay.career.release,formatRevision:2},
 }}};
}

const initial=progressState(createGame());

function equalValue(a:unknown,b:unknown):boolean {
 if(a===b)return true;
 if(a===null||b===null||typeof a!=='object'||typeof b!=='object')return false;
 if(Array.isArray(a)||Array.isArray(b))return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>equalValue(v,b[i]));
 const left=a as Record<string,unknown>,right=b as Record<string,unknown>;
 const keys=Object.keys(left);
 return keys.length===Object.keys(right).length&&keys.every(key=>Object.hasOwn(right,key)&&equalValue(left[key],right[key]));
}

/** Resume unfinished work too; a completed mission is not required. */
export function hasGameProgress(state:GameState):boolean {
 return !equalValue(progressState(state),initial);
}
