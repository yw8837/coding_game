import assert from 'node:assert/strict';
import {ESLint} from 'eslint';

// Exercise the actual installed config and both official parser paths.
// No environment hooks, autofix, file writes, or application execution.
const eslint=new ESLint();
const parse=async(text,filePath)=>{
 const [result]=await eslint.lintText(text,{filePath});
 assert.equal(result.fatalErrorCount,0,JSON.stringify(result.messages));return result;
};
const js=await parse('export function Example() { return <main />; }','components/lint-probe.jsx');
assert.equal(js.errorCount,0,JSON.stringify(js.messages));
const ts=await parse('export const value: number = 1;','lib/game/lint-probe.ts');
assert.equal(ts.errorCount,0,JSON.stringify(ts.messages));
const badTs=await parse('export const value: any = 1;','lib/game/lint-probe.ts');
assert.ok(badTs.messages.some(message=>message.ruleId==='@typescript-eslint/no-explicit-any'&&message.severity===2));
const badHook=await parse('import {useState} from "react"; export function Example({enabled}) { if (enabled) useState(0); return <main />; }','components/lint-probe.jsx');
assert.ok(badHook.messages.some(message=>message.ruleId==='react-hooks/rules-of-hooks'&&message.severity===2));
const cjs=await parse('const path = require("node:path"); module.exports = path;','desktop/lint-probe.cjs');
assert.equal(cjs.errorCount,0,JSON.stringify(cjs.messages));
for(const generated of ['output/lint-probe.js','desktop/renderer/lint-probe.js'])assert.equal(await eslint.isPathIgnored(generated),true,generated);
const sourceConfig=await eslint.calculateConfigForFile('components/game/DesktopOS.tsx');
assert.equal(sourceConfig.rules['react-hooks/set-state-in-effect'][0],2);
assert.equal(sourceConfig.rules['@typescript-eslint/no-require-imports'][0],2);
console.log(JSON.stringify({ok:true,nextJsxParser:true,typescriptParser:true,reactHooksRuleActive:true,typeScriptRulesActive:true,commonJsScope:true,generatedOutputsIgnored:true}));
