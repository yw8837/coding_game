import {projectFiles,sourceHash,type Check,type GameState} from './engine.ts';
import {MISSIONS} from './content.ts';

export type FailedMissionCheck=Check&{file:string;index:number};

/** Only show failures from the current saved files, with a concrete repair destination. */
export function currentMissionChecks(state:GameState){
 const tests=state.tests;
 return tests&&tests.mission===state.mission&&tests.hash===sourceHash(projectFiles(state))?tests:null;
}

export function failedMissionChecks(state:GameState):FailedMissionCheck[]{
 const tests=currentMissionChecks(state);
 if(!tests)return [];
 return tests.checks.flatMap((check,index)=>check.passed?[]:[{...check,index,file:state.mission===0?(index===0?'index.html':'style.css'):MISSIONS[state.mission].file}]);
}
