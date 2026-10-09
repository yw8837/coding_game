import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync,rmSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'output/quality-gate');
mkdirSync(output,{recursive:true});
const receiptPath=path.join(output,'braces-install.json');
rmSync(receiptPath,{force:true});
const chains=[
  ['eslint-config-next','@next/eslint-plugin-next','fast-glob','micromatch','braces'],
  ['vinext','vite-plugin-commonjs','vite-plugin-dynamic-import','fast-glob','micromatch','braces'],
];
const reports=new Map(),paths=[];
for(const [entry,...dependencies] of chains){
  let file=import.meta.resolve(entry);
  for(const dependency of dependencies)file=createRequire(file).resolve(dependency);
  const installed=path.dirname(file);
  paths.push({chain:[entry,...dependencies],installed});
  if(reports.has(installed))continue;
  const run=spawnSync(process.execPath,['scripts/test-braces-security.cjs','--patched',installed],{cwd:root,encoding:'utf8',timeout:120_000,maxBuffer:1024*1024});
  assert.ifError(run.error);
  assert.equal(run.status,0,run.stderr||run.stdout);
  const report=JSON.parse(run.stdout);
  assert.equal(report.hostileProbes.length,73);
  assert.equal(report.compatibilityPatterns,47);
  assert.equal(report.boundedOutputs.length,10);
  reports.set(installed,report);
}
const receipt={passed:true,paths,reports:Object.fromEntries(reports),note:'Verified local resource-limit mitigation. The upstream 3.0.3 advisory remains visible in unfiltered registry audits.'};
writeFileSync(receiptPath,JSON.stringify(receipt,null,2));
console.log(JSON.stringify({passed:true,dependencyPaths:paths.length,installedCopies:reports.size,hostileProbes:73,normalPatterns:47,boundedOutputs:10}));
