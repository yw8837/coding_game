'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {selectProfile, prepareProfile, canonicalPath} = require('../profile.cjs');
function removeFixture(root) {
  const boundary = path.resolve(__dirname, '../../output/0.11-security') + path.sep;
  assert.ok(path.resolve(root).startsWith(boundary));
  const entries = [], directories = [root], pending = [root];
  while (pending.length) {
    const directory = pending.pop();
    for (const name of fs.readdirSync(directory)) {
      const entry = path.join(directory, name), info = fs.lstatSync(entry);
      assert.ok(entry.startsWith(boundary));
      if (info.isSymbolicLink()) {
        assert.ok(path.resolve(path.dirname(entry), fs.readlinkSync(entry)).startsWith(boundary));
        entries.unshift(entry); // Unlink all junctions before ordinary contents.
      } else if (info.isDirectory()) { directories.push(entry); pending.push(entry); }
      else entries.push(entry);
    }
  }
  for (const entry of entries) fs.unlinkSync(entry);
  for (const directory of directories.sort((a, b) => b.length - a.length)) fs.rmdirSync(directory);
}
test('new production directory is created before Electron setPath', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codeshift-profile-test-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const profile = selectProfile({appData: root, argv: [], packaged: true, qaBuild: false});
  const prepared = prepareProfile(profile);
  assert.equal(profile.qa, false);
  assert.ok(fs.statSync(prepared.userData).isDirectory());
  assert.ok(fs.statSync(prepared.sessionData).isDirectory());
});
test('canonical paths resolve an existing ancestor before appending missing folders', () => {
  const alias = path.resolve('mock-alias');
  const actual = path.resolve('mock-production');
  const mock = {lstatSync: value => { if (value !== alias) throw Object.assign(new Error('missing'), {code: 'ENOENT'}); return {}; },
    realpathSync: value => { assert.equal(value, alias); return actual; }};
  assert.equal(canonicalPath(path.join(alias, 'future', 'qa'), mock), path.join(actual, 'future', 'qa'));
});
test('marked QA profile rejects child directories and save/marker links outside its root', t => {
  const output = path.resolve(__dirname, '../../output/0.11-security');
  fs.mkdirSync(output, {recursive: true});
  const root = fs.mkdtempSync(path.join(output, 'profile-children-'));
  t.after(() => removeFixture(root));
  const production = path.join(root, 'CODE-SHIFT');
  fs.mkdirSync(production);
  const marker = '.codeshift-qa-profile';
  const options = {appData: root, packaged: true, qaBuild: true};
  for (const child of ['browser', 'saves', marker, 'saves/game.json', 'saves/game.json.bak',
    'saves/game.json.tmp', 'saves/game.json.bak.tmp']) {
    const qa = path.join(root, 'qa-' + child.replaceAll('/', '-'));
    fs.mkdirSync(qa); fs.writeFileSync(path.join(qa, marker), 'marked');
    const childPath = path.join(qa, child);
    const isDirectory = ['browser', 'saves'].includes(child);
    if (!isDirectory) {
      fs.mkdirSync(path.dirname(childPath), {recursive: true});
      if (child === marker) fs.unlinkSync(childPath);
      // A directory junction avoids Windows file-symlink privilege requirements;
      // canonical target containment is independent of target file type.
    }
    fs.symlinkSync(production, childPath, process.platform === 'win32' ? 'junction' : 'dir');
    assert.throws(() => selectProfile({...options, argv: [`--qa-user-data=${qa}`]}), /inside the isolated profile/);
    assert.deepEqual(fs.readdirSync(production), []);
  }
});
test('prepare rejects child junction introduced after selection and dangling outside link', t => {
  const output = path.resolve(__dirname, '../../output/0.11-security');
  fs.mkdirSync(output, {recursive: true});
  const root = fs.mkdtempSync(path.join(output, 'profile-child-recheck-'));
  t.after(() => removeFixture(root));
  const production = path.join(root, 'CODE-SHIFT'); fs.mkdirSync(production);
  const qa = path.join(root, 'qa');
  const selected = selectProfile({appData: root, packaged: true, qaBuild: true, argv: [`--qa-user-data=${qa}`]});
  fs.mkdirSync(qa); fs.writeFileSync(path.join(qa, '.codeshift-qa-profile'), 'marked');
  fs.symlinkSync(production, path.join(qa, 'browser'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => prepareProfile(selected), /inside the isolated profile/);
  assert.deepEqual(fs.readdirSync(production), []);
  fs.unlinkSync(path.join(qa, 'browser'));
  fs.symlinkSync(path.join(root, 'missing-outside'), path.join(qa, 'saves'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => prepareProfile(selected));
  assert.equal(fs.existsSync(path.join(root, 'missing-outside')), false);
});
test('QA junction and not-yet-created child cannot alias production', t => {
  const output = path.resolve(__dirname, '../../output/0.11-security');
  fs.mkdirSync(output, {recursive: true});
  const root = fs.mkdtempSync(path.join(output, 'profile-regression-'));
  t.after(() => removeFixture(root));
  const production = path.join(root, 'CODE-SHIFT');
  fs.mkdirSync(production);
  const alias = path.join(root, 'qa-alias');
  fs.symlinkSync(production, alias, process.platform === 'win32' ? 'junction' : 'dir');
  const options = {appData: root, packaged: true, qaBuild: true};
  for (const directory of [alias, path.join(alias, 'future', 'qa')]) {
    assert.throws(() => selectProfile({...options, argv: [`--qa-user-data=${directory}`]}), /separate from production/);
  }
  assert.deepEqual(fs.readdirSync(production), []);
});
test('preparation rechecks a QA path whose parent was replaced by a junction', t => {
  const output = path.resolve(__dirname, '../../output/0.11-security');
  fs.mkdirSync(output, {recursive: true});
  const root = fs.mkdtempSync(path.join(output, 'profile-recheck-'));
  t.after(() => removeFixture(root));
  const production = path.join(root, 'CODE-SHIFT');
  fs.mkdirSync(production);
  const alias = path.join(root, 'future-alias');
  const selected = selectProfile({appData: root, packaged: true, qaBuild: true,
    argv: [`--qa-user-data=${path.join(alias, 'qa')}`]});
  fs.symlinkSync(production, alias, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => prepareProfile(selected), /separate from production/);
  assert.deepEqual(fs.readdirSync(production), []);
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
