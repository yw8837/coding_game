import {spawn} from 'node:child_process';
import {mkdtemp, readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const executable = process.argv[2];
if (!executable || !path.isAbsolute(executable)) throw new Error('Supply the absolute QA executable path.');
const profile = await mkdtemp(path.join(os.tmpdir(), 'localhost-hero-qa-launch-'));
const child = spawn(executable, [`--qa-user-data=${profile}`, '--qa-launch-check'], {stdio: ['ignore', 'pipe', 'pipe']});
let output = '';
for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => { output = (output + chunk).slice(-16000); });
const timeout = setTimeout(() => child.kill('SIGKILL'), 45000);
const code = await new Promise((resolve, reject) => {
  child.once('error', reject);
  child.once('exit', resolve);
}).finally(() => clearTimeout(timeout));
if (code !== 0) { console.error(output); throw new Error(`Native QA startup failed: ${code}`); }
const report = JSON.parse(await readFile(path.join(profile, 'launch-check.json'), 'utf8'));
assert.equal(report.ok, true);
assert.equal(report.platform, process.platform);
assert.equal(report.arch, process.arch);
assert.deepEqual(new Set(report.observed), new Set(['renderer-loaded', 'desktop:platform', 'desktop:load']));
console.log(JSON.stringify(report));
