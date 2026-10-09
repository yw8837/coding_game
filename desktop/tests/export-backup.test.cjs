'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {writeBackup} = require('../export-backup.cjs');
const {nativeLanguage, messages} = require('../native-i18n.cjs');

test('native export writes validated JSON and leaves no temporary file', async t => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'codeshift-export-test-'));
  t.after(() => fs.rm(directory, {recursive: true, force: true}));
  const raw = JSON.stringify({version: 1, mission: 0, completed: [],
    machines: {local: {}, server: {}}, gameplay: {}});
  const target = path.join(directory, 'backup.json');
  await writeBackup(target, raw);
  assert.equal(await fs.readFile(target, 'utf8'), raw);
  await assert.rejects(writeBackup(target, '{}'));
  await assert.rejects(writeBackup(path.join(directory, 'other.txt'), raw));
  assert.deepEqual(await fs.readdir(directory), ['backup.json']);
});
test('native dialogs choose supported Steam language then OS preference', () => {
  assert.equal(nativeLanguage('japanese', ['ko-KR']), 'ja');
  assert.equal(nativeLanguage(undefined, ['fr-FR', 'ko-KR']), 'ko');
  assert.equal(nativeLanguage(undefined, ['en_US']), 'en');
  assert.equal(nativeLanguage(undefined, ['fr-FR']), 'en');
  for (const language of ['ko', 'en', 'ja']) assert.ok(messages[language].discard);
});
