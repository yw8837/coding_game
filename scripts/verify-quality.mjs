import {spawnSync} from 'node:child_process';
import {mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'output','quality-gate');
mkdirSync(output,{recursive:true});
const checks=[
  ['lint',['node_modules/eslint/bin/eslint.js','.','--ignore-pattern','dist','--ignore-pattern','.next','--max-warnings','0','--format','json','--output-file',path.join(output,'lint.json')]],
  ['typecheck',['node_modules/typescript/bin/tsc','--noEmit']],
  ['dependency-mitigation',['scripts/verify-braces-install.mjs']],
  ['game-units',['--test',...readdirSync(path.join(root,'lib/game')).filter(f=>f.endsWith('.test.ts')).map(f=>'lib/game/'+f)]],
  ['desktop-units',['--test',...readdirSync(path.join(root,'desktop/tests')).filter(f=>f.endsWith('.test.cjs')).map(f=>'desktop/tests/'+f)]],
];
const receipt={version:JSON.parse(readFileSync(path.join(root,'package.json'),'utf8')).version,startedAt:new Date().toISOString(),passed:false,checks:[]};
for(const [name,args] of checks){
  const run=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',timeout:120_000,maxBuffer:16*1024*1024});
  writeFileSync(path.join(output,name+'.log'),(run.stdout||'')+(run.stderr||'')+(run.error?String(run.error):''));
  const result={name,exit:run.status,signal:run.signal,passed:run.status===0&&!run.error};
  receipt.checks.push(result);
  writeFileSync(path.join(output,'receipt.json'),JSON.stringify(receipt,null,2));
  console.log(`${name}: ${result.passed?'PASS':'FAIL'} (exit ${run.status})`);
  if(!result.passed)process.exit(1);
}
const lint=JSON.parse(readFileSync(path.join(output,'lint.json'),'utf8'));
receipt.lint={files:lint.length,errors:lint.reduce((n,f)=>n+f.errorCount,0),warnings:lint.reduce((n,f)=>n+f.warningCount,0)};
if(receipt.lint.errors||receipt.lint.warnings)throw new Error('Lint report contradicts a passing exit.');
receipt.passed=true;
receipt.completedAt=new Date().toISOString();
writeFileSync(path.join(output,'receipt.json'),JSON.stringify(receipt,null,2));
console.log(JSON.stringify(receipt));
