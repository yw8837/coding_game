import type {GameState} from './engine.ts';
import {applyCareer,careerFiles,careerHash,careerRoot} from './career.ts';
import {evaluateCareer} from './career-evaluation.ts';
import {CAREER_CODE_IDS,CAREER_CODE_FILE,careerCodeModeSafe,runCareerCode} from './career-code.ts';

/** Narrow dispatch for simulated node commands. Returns null for non-career
 * paths so the existing CodeLab dispatcher can handle them. Never invokes Node. */
export function dispatchCareerNode(state:GameState,args:string[],resolve:(cwd:string,path:string)=>string):{output:string;error:boolean}|null {
 const testing=args[0]==='--test',argument=args[testing?1:0];if(!argument)return null;
 const machine=state.machines[state.machine],path=resolve(machine.cwd,argument);
 const id=CAREER_CODE_IDS.find(id=>path===careerRoot(id)+'/'+CAREER_CODE_FILE);if(!id)return null;
 const fail=(output:string)=>({output,error:true});
 if(state.machine!=='local')return fail('Career JavaScript runs on the workstation only. Use exit to return to local files.');
 if(!machine.tools.includes('nodejs'))return fail('node: command not found. Install nodejs in the simulated workstation.');
 const source=machine.files[path];if(source===undefined)return fail('solution.js is missing. Select JavaScript mode or create the file first.');
 if(testing){
  if(args.length!==2)return fail('Usage: node --test solution.js');
  const files=careerFiles(state,id);if(careerCodeModeSafe(files)!=='javascript')return fail('Select JavaScript mode before running career JavaScript checks.');
  applyCareer(state,{type:'career-test',id});const proof=state.gameplay.career.proofs[id],evaluation=evaluateCareer(id,files);
  if(!proof||proof.hash!==careerHash(files))return fail('Accept this career job before recording its checks.');
  return {output:'# CODE:SHIFT limited JavaScript interpreter\n'+evaluation.checks.map((check,index)=>`${check.passed?'ok':'not ok'} ${index+1} - ${check.name.en}`+(check.passed?'':`\n  expected: ${check.expected}\n  actual: ${check.actual}`)).join('\n')+`\n# tests ${evaluation.checks.length}\n# pass ${evaluation.checks.filter(check=>check.passed).length}\n# fail ${evaluation.checks.filter(check=>!check.passed).length}`,error:!evaluation.passed};
 }
 if(args.length!==2)return fail("Usage: node solution.js '<input JSON>'");
 const result=runCareerCode(id,source,args[1]);
 if(result.error)return fail(`${result.error.kind}: ${result.error.message}${result.error.line?' (line '+result.error.line+')':''}`);
 return {output:'# CODE:SHIFT limited JavaScript interpreter\n'+JSON.stringify(result.actual,null,2),error:false};
}
