import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Exit codes alone cannot prove an asynchronous test reached its final assertion.
const read = async file => JSON.parse(await readFile(new URL('../output/' + file, import.meta.url), 'utf8'));
const terminal = await read('full-version-quality/terminal-editing-final.json');
assert.equal(terminal.passed, true, 'Terminal suite did not finish successfully');
assert.deepEqual(terminal.errors, []);
for (const language of ['en', 'ko', 'ja']) {
  const checks = terminal.checks.filter(check => check.name.startsWith(language + ':'));
  assert.ok(checks.length >= 10 && checks.every(check => check.passed), language + ' terminal evidence incomplete');
}
const context = await read('context-menu-qa/native-report.json');
assert.equal(context.passed, true);
assert.equal(context.realElectronIPC, true);
assert.equal(context.pasteRequiresEnter, true);
const campaign = await read('steam-qa/native-report.json');
assert.equal(campaign.nativeCafeUI, 3);
assert.equal(campaign.nativeCareerUI, 18);
for (const name of ['nativeFinalRelease', 'nativeCodeLab', 'closeSave', 'nativeExport', 'importAndEnding', 'corruptPrimaryRecovered']) {
  assert.equal(campaign[name], true, 'Missing campaign evidence: ' + name);
}
assert.deepEqual(campaign.errors, []);
const studio = await read('full-version-quality/studio-native-report.json');
assert.equal(studio.passed, true);
assert.deepEqual(studio.errors, []);
assert.deepEqual(new Set(studio.portableAppLocales), new Set(['en', 'ko', 'ja']));
assert.equal(studio.inertMarkupStorageQuotaAndCorruption, true);
const authored = await read('authored-project-native/report.json');
assert.equal(authored.passed, true);
assert.deepEqual(authored.errors, []);
assert.ok(authored.cases.length >= 4 && authored.cases.every(row => row.passed), 'Authored project cases incomplete');
for (const id of ['en-website', 'en-webapp', 'ko-webapp', 'ja-webapp']) {
  assert.ok(authored.cases.some(row => row.id === id && row.offlineExport), 'Missing authored export: ' + id);
}
console.log('Native evidence verified: terminal locales, clipboard IPC, 3 cafe chapters, 18 jobs, final release, save recovery, studio, authored exports.');
