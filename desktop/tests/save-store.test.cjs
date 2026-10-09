'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {SaveStore, validateRaw, MAX_SAVE_BYTES} = require('../save-store.cjs');
const raw = n => JSON.stringify({version: 1, mission: 0, completed: [],
  machines: {local: {}, server: {}}, gameplay: {}, marker: n});
async function setup(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'codeshift-save-test-'));
  t.after(() => fs.rm(directory, {recursive: true, force: true}));
  return new SaveStore(directory);
}
test('new installation has no corruption error; invalid shape/size are rejected', async t => {
  const store = await setup(t);
  assert.deepEqual(await store.load(), {raw: null, recovered: false});
  for (const bad of ['{}', '[]', 'null', '{', raw(1).replace('"version":1', '"version":2')]) {
    assert.throws(() => validateRaw(bad));
  }
  assert.throws(() => validateRaw('x'.repeat(MAX_SAVE_BYTES + 1)));
  assert.equal((await store.save('{}')).ok, false);
  assert.equal((await store.drain()).ok, false);
});
test('concurrent saves serialize atomically and backup retains prior valid progress', async t => {
  const store = await setup(t);
  const results = await Promise.all([store.save(raw(1)), store.save(raw(2)), store.save(raw(3))]);
  assert.ok(results.every(result => result.ok));
  assert.equal((await store.load()).raw, raw(3));
  assert.deepEqual(await store.loadBackup(), {raw: raw(2), recovered: true});
  assert.deepEqual(await store.drain(), {ok: true});
  assert.deepEqual((await fs.readdir(store.directory)).sort(), ['game.json', 'game.json.bak']);
});
test('corrupt primary recovers backup and next save preserves that backup', async t => {
  const store = await setup(t);
  await store.save(raw(1)); await store.save(raw(2));
  await fs.writeFile(store.primary, '{}');
  assert.deepEqual(await store.load(), {raw: raw(1), recovered: true});
  assert.equal((await store.save(raw(3))).ok, true);
  assert.equal((await store.loadBackup()).raw, raw(1));
});
test('two corrupt saves are distinguishable from a fresh install', async t => {
  const store = await setup(t);
  await store.save(raw(1)); await store.save(raw(2));
  await fs.writeFile(store.primary, '{'); await fs.writeFile(store.backup, '{}');
  const result = await store.load();
  assert.equal(result.raw, null); assert.ok(result.error);
});
test('failed filesystem write is reported and does not hang close drain', async t => {
  const store = await setup(t);
  await fs.writeFile(store.directory, 'blocked');
  assert.equal((await store.save(raw(1))).ok, false);
  assert.equal((await store.drain()).ok, false);
});
test('a queued earlier success cannot erase a later invalid-save close warning', async t => {
  const store = await setup(t);
  const earlier = store.save(raw(1));
  const latest = store.save('{}');
  assert.equal((await earlier).ok, true);
  assert.equal((await latest).ok, false);
  assert.equal((await store.drain()).ok, false);
  assert.equal((await store.load()).raw, raw(1));
});
test('renderer fallback to full-schema valid backup protects it from a shape-valid bad primary', async t => {
  const store = await setup(t);
  await store.save(raw(1)); await store.save(raw(2));
  const shapeOnly = JSON.stringify({version: 1, mission: 0, completed: [],
    machines: {local: {}, server: {}}, gameplay: {}});
  await fs.writeFile(store.primary, shapeOnly);
  assert.equal((await store.load()).raw, shapeOnly);
  assert.equal((await store.loadBackup()).raw, raw(1));
  await store.save(raw(3));
  assert.equal(await fs.readFile(store.backup, 'utf8'), raw(1));
  await store.save(raw(4));
  assert.equal(await fs.readFile(store.backup, 'utf8'), raw(3));
});
