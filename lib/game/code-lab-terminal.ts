import type {GameState} from './engine.ts';
import {LAB_JOBS,labJob,createLab,evaluateLab,type LabId,type LabProof} from './code-lab.ts';
import {runCode,type CodeValue} from './code-lab-runtime.ts';

export const LAB_ROOT='/home/dev/code-lab';
export const labSourcePath=(id:string)=>`${LAB_ROOT}/${id}.js`;
export const labInputPath=(id:string)=>`${LAB_ROOT}/${id}.input.json`;
export const labTestPath=(id:string)=>`${LAB_ROOT}/${id}.test.cjs`;

// Portable CommonJS files. The game recognizes their exact bytes and NEVER runs
// fs/vm/require. Outside the game, vm is a timeout mechanism, not a security boundary:
// run only your own source. Native Node accepts more JS than the game's documented subset.
export const LAB_RUNNER=`'use strict';
// CODE:SHIFT Lab runner v1. Native Node: trusted local code only; vm is not a security sandbox.
const fs = require('node:fs');
const vm = require('node:vm');
function run(sourcePath, input) {
  const source = fs.readFileSync(sourcePath, 'utf8');
  if (source.length > 12000) throw new Error('Source is limited to 12000 characters.');
  const json = JSON.stringify(input);
  if (json.length > 4000) throw new Error('Input JSON is limited to 4000 characters.');
  const expression = source + '\\nconst __result = solve(JSON.parse(__input));\\n' +
    'if (__result === undefined) throw new Error("Return an explicit JSON value.");\\n' +
    'JSON.stringify(__result, (key, value) => { if (typeof value === "number" && !Number.isFinite(value)) throw new Error("Non-finite result."); if (["undefined", "function", "bigint", "symbol"].includes(typeof value)) throw new Error("Result must contain JSON values."); return value; });';
  const output = vm.runInNewContext(expression, {__input: json}, {timeout: 100});
  if (output.length > 20000) throw new Error('Output JSON is limited to 20000 characters.');
  return JSON.parse(output);
}
module.exports = {run};
if (require.main === module) {
  try {
    if (process.argv.length !== 4) throw new Error('Usage: node run.cjs <function.js> <input.json>');
    const raw = fs.readFileSync(process.argv[3], 'utf8');
    if (raw.length > 4000) throw new Error('Input JSON is limited to 4000 characters.');
    console.log(JSON.stringify(run(process.argv[2], JSON.parse(raw)), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
`;

export function labTestTemplate(id:LabId,seed:number):string{
 const job=labJob(id)!;
 return `'use strict';\n// CODE:SHIFT generated cases v1: ${id}, seed ${seed}.\nconst test = require('node:test');\nconst assert = require('node:assert/strict');\nconst path = require('node:path');\nconst {run} = require('./run.cjs');\nconst cases = ${JSON.stringify(job.cases(seed),null,2)};\ncases.forEach((row, index) => {\n  test('${id} case ' + (index + 1), () => {\n    assert.deepEqual(run(path.join(__dirname, '${id}.js'), row.input), row.expected);\n  });\n});\n`;
}
// Preparing files is a persistent contract: deleting every file must not revive
// the legacy draft-only evaluator. Current files also recognize older saves.
const materialized=(s:GameState,id:LabId)=>(s.gameplay.lab.workspaces??[]).includes(id)||s.machines.local.files[labInputPath(id)]!==undefined||s.machines.local.files[labTestPath(id)]!==undefined||s.machines.local.files[labSourcePath(id)]!==undefined;
export function checkLabFileWrite(path:string,content:string):void{
 if(LAB_JOBS.some(job=>labSourcePath(job.id)===path)&&content.length>12000)throw Error('Lab source is limited to 12,000 characters. The previous file was preserved.');
 if(LAB_JOBS.some(job=>labInputPath(job.id)===path)&&content.length>4000)throw Error('Lab input JSON is limited to 4,000 characters. The previous file was preserved.');
}
/** Synchronize actual files after mutations; no phantom successful proof survives. */
export function syncLabWorkspace(s:GameState):void{
 const lab=s.gameplay.lab??(s.gameplay.lab=createLab());
 lab.workspaces??=[];
 for(const job of LAB_JOBS){
  if(!materialized(s,job.id))continue;
  if(!lab.workspaces.includes(job.id))lab.workspaces.push(job.id);
  const source=s.machines.local.files[labSourcePath(job.id)],test=s.machines.local.files[labTestPath(job.id)];
  if(source===undefined){delete lab.drafts[job.id];delete lab.proofs[job.id];continue;}
  checkLabFileWrite(labSourcePath(job.id),source);
  if(lab.drafts[job.id]!==source){lab.drafts[job.id]=source;delete lab.proofs[job.id];}
  const proof=lab.proofs[job.id];if(test!==labTestTemplate(job.id,lab.seeds[job.id]??1)||s.machines.local.files[`${LAB_ROOT}/run.cjs`]!==LAB_RUNNER||proof&&(proof.source!==source||proof.seed!==(lab.seeds[job.id]??1)))delete lab.proofs[job.id];
 }
}
/** Save callers use this read-only check; saves without a workspace remain compatible. */
export function validateLabWorkspace(s:GameState):void{
 const lab=s.gameplay.lab;
 for(const job of LAB_JOBS){
  if(!materialized(s,job.id))continue;
  const source=s.machines.local.files[labSourcePath(job.id)],test=s.machines.local.files[labTestPath(job.id)];
  if(source!==undefined){checkLabFileWrite(labSourcePath(job.id),source);if(lab.drafts[job.id]!==source)throw Error('Lab file and draft differ.');}
  else if(lab.drafts[job.id]!==undefined||lab.proofs[job.id])throw Error('Missing Lab source has retained draft or proof.');
  if(lab.proofs[job.id]&&(test!==labTestTemplate(job.id,lab.seeds[job.id]??1)||s.machines.local.files[`${LAB_ROOT}/run.cjs`]!==LAB_RUNNER))throw Error('Lab proof uses a missing or modified generated runner/test file.');
  const input=s.machines.local.files[labInputPath(job.id)];if(input!==undefined)checkLabFileWrite(labInputPath(job.id),input);
 }
}
export function materializeLabWorkspace(s:GameState,id:string):boolean{
 const job=labJob(id);if(!job)return false;
 const lab=s.gameplay.lab??(s.gameplay.lab=createLab()),files=s.machines.local.files;
 lab.workspaces??=[];if(!lab.workspaces.includes(job.id))lab.workspaces.push(job.id);
 if(!s.machines.local.dirs.includes(LAB_ROOT))s.machines.local.dirs.push(LAB_ROOT);
 files[labSourcePath(id)]??=lab.drafts[job.id]??job.starter;
 files[labInputPath(id)]??=JSON.stringify(job.sample,null,2)+'\n';
 files[labTestPath(id)]??=labTestTemplate(job.id,lab.seeds[job.id]??1);
 files[`${LAB_ROOT}/run.cjs`]??=LAB_RUNNER;
 syncLabWorkspace(s);return true;
}
export function updateLabTestTemplate(s:GameState,id:LabId,oldSeed:number):void{
 const files=s.machines.local.files,path=labTestPath(id);
 if(files[path]===labTestTemplate(id,oldSeed))files[path]=labTestTemplate(id,s.gameplay.lab.seeds[id]??1);
}
export function recordLabProof(s:GameState,id:LabId,source:string):LabProof|null{
 const lab=s.gameplay.lab,job=labJob(id)!;const proof=evaluateLab(id,source,lab.seeds[id]??1);if(!proof)return null;
 lab.drafts[id]=source;lab.proofs[id]=proof;
 if(proof.passed){if(!lab.completed.includes(id)){lab.completed.push(id);s.credits+=job.credits;s.xp+=Math.floor(job.credits/2);}lab.bestSteps[id]=Math.min(lab.bestSteps[id]??Infinity,proof.steps);}return proof;
}
export function labEvaluationSource(s:GameState,id:LabId):{source?:string;error?:string}{
 if(!materialized(s,id))return {source:s.gameplay.lab.drafts[id]??labJob(id)!.starter};
 syncLabWorkspace(s);const source=s.machines.local.files[labSourcePath(id)];
 if(source===undefined)return {error:`Missing ${id}.js. Restore the file or prepare the workspace again.`};
 if(s.machines.local.files[`${LAB_ROOT}/run.cjs`]!==LAB_RUNNER)return {error:'run.cjs is missing or modified. The generated runner v1 is required.'};
 if(s.machines.local.files[labTestPath(id)]!==labTestTemplate(id,s.gameplay.lab.seeds[id]??1))return {error:`${id}.test.cjs is missing or modified. Only the generated cases are supported; no result or reward was granted.`};
 return {source};
}
export function dispatchLabNode(s:GameState,args:string[],resolve:(cwd:string,path:string)=>string):{output:string;error:boolean}{
 const fail=(output:string)=>({output,error:true});
 if(s.machine!=='local')return fail('Coding Lab runs on workstation only. exit to return to your local files.');
 syncLabWorkspace(s);const files=s.machines.local.files,cwd=s.machines.local.cwd;
 if(args[0]==='--test'){
  if(args.length!==2)return fail('Usage: node --test <job>.test.cjs');
  const path=resolve(cwd,args[1]),job=LAB_JOBS.find(job=>labTestPath(job.id)===path);
  if(!job)return fail('node --test: choose a generated test file in /home/dev/code-lab. Arbitrary test scripts are not supported.');
  if(files[`${LAB_ROOT}/run.cjs`]!==LAB_RUNNER){delete s.gameplay.lab.proofs[job.id];return fail('run.cjs is missing or modified. The generated runner v1 is required.');}
  const selected=labEvaluationSource(s,job.id);if(selected.error)return fail(selected.error);
  const proof=recordLabProof(s,job.id,selected.source!);if(!proof)return fail('Lab source is limited to 12,000 characters.');
  const output=proof.cases.map((row,index)=>`${row.passed?'ok':'not ok'} ${index+1} - ${job.id} case ${index+1}`+(row.passed?'':`\n  expected: ${JSON.stringify(row.expected)}\n  actual: ${JSON.stringify(row.actual)}${row.error?'\n  '+row.error.kind+': '+row.error.message+(row.error.line?' (line '+row.error.line+')':''):''}`)).join('\n')+`\n# tests ${proof.cases.length}\n# pass ${proof.cases.filter(row=>row.passed).length}\n# fail ${proof.cases.filter(row=>!row.passed).length}\n# steps ${proof.steps}`;
  return {output,error:!proof.passed};
 }
 if(args.length!==3)return fail('Usage: node run.cjs <function.js> <input.json> or node --test <job>.test.cjs');
 const runner=resolve(cwd,args[0]);if(runner!==`${LAB_ROOT}/run.cjs`||files[runner]!==LAB_RUNNER)return fail('Only the generated /home/dev/code-lab/run.cjs runner v1 is supported.');
 const source=files[resolve(cwd,args[1])],raw=files[resolve(cwd,args[2])];
 if(source===undefined)return fail(`node: source file not found: ${args[1]}`);if(source.length>12000)return fail('Lab source is limited to 12,000 characters.');
 if(raw===undefined)return fail(`node: input file not found: ${args[2]}`);if(raw.length>4000)return fail('Input JSON is limited to 4,000 characters.');
 let input:CodeValue;try{input=JSON.parse(raw) as CodeValue;}catch{return fail('Input file must contain valid JSON.');}
 const result=runCode(source,input);if(result.error)return fail(`${result.error.kind}: ${result.error.message}${result.error.line?' (line '+result.error.line+')':''}`);
 return {output:JSON.stringify(result.value,null,2),error:false};
}
