'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {validAppId, readConfig, createSteam} = require('../steam.cjs');

test('no guessed app id or example app can initialize Steam', () => {
  for (const id of [null, undefined, 0, -1, 480, '480', Infinity, 1.5, 0x100000000]) {
    assert.equal(validAppId(id), false);
    const adapter = createSteam({appId: id}, () => { throw new Error('Must not load'); });
    assert.equal(adapter.available, false);
  }
  assert.deepEqual(readConfig([], {}), {appId: null, invalid: false});
  assert.deepEqual(readConfig([], {CODESHIFT_STEAM_APP_ID: '480'}), {appId: null, invalid: true});
});
test('optional module failure leaves the game offline', () => {
  const adapter = createSteam({appId: 1001}, () => { throw new Error('Module unavailable'); });
  assert.equal(adapter.available, false);
  assert.deepEqual(adapter.unlock(['CAFE_OPEN']), {ok: false});
});
test('only catalog achievement names reach the native Steam client', () => {
  const calls = [];
  const client = {utils: {getAppId: () => 1001}, apps: {currentGameLanguage: () => 'koreana'},
    achievement: {isActivated: () => false, activate: id => {calls.push(id); return true;}},
    stats: {store: () => true}};
  const adapter = createSteam({appId: 1001}, () => ({init: () => client}));
  assert.equal(adapter.available, true); assert.equal(adapter.language, 'koreana');
  assert.deepEqual(adapter.unlock(['CAFE_OPEN', 'CAFE_OPEN']), {ok: true});
  assert.deepEqual(calls, ['CAFE_OPEN']);
  assert.deepEqual(adapter.unlock(['../../unknown']), {ok: false});
  assert.deepEqual(calls, ['CAFE_OPEN']);
});
