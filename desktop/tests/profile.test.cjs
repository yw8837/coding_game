'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {selectProfile, prepareProfile} = require('../profile.cjs');
test('new production directory is created before Electron setPath', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codeshift-profile-test-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const profile = selectProfile({appData: root, argv: [], packaged: true, qaBuild: false});
  const prepared = prepareProfile(profile);
  assert.equal(profile.qa, false);
  assert.ok(fs.statSync(prepared.userData).isDirectory());
  assert.ok(fs.statSync(prepared.sessionData).isDirectory());
});
test('production packages reject QA override without touching profiles', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codeshift-profile-test-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  assert.throws(() => selectProfile({appData: root, argv: [`--qa-user-data=${path.join(root, 'qa')}`],
    packaged: true, qaBuild: false}));
  assert.deepEqual(fs.readdirSync(root), []);
});
test('isolated QA profile requires absolute nonoverlapping marked directory', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codeshift-profile-test-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const options = {appData: root, packaged: true, qaBuild: true};
  assert.throws(() => selectProfile({...options, argv: []}));
  assert.throws(() => selectProfile({...options, argv: ['--qa-user-data=relative']}));
  assert.throws(() => selectProfile({...options, argv: [`--qa-user-data=${path.join(root, 'CODE-SHIFT', 'qa')}`]}));
  const existing = path.join(root, 'other'); fs.mkdirSync(existing); fs.writeFileSync(path.join(existing, 'precious'), 'keep');
  assert.throws(() => selectProfile({...options, argv: [`--qa-user-data=${existing}`]}));
  const qa = path.join(root, 'qa');
  const profile = selectProfile({...options, argv: [`--qa-user-data=${qa}`]});
  prepareProfile(profile);
  assert.equal(selectProfile({...options, argv: [`--qa-user-data=${qa}`]}).qa, true);
  assert.equal(fs.readFileSync(path.join(existing, 'precious'), 'utf8'), 'keep');
  assert.equal(fs.existsSync(path.join(root, 'CODE-SHIFT')), false);
});
