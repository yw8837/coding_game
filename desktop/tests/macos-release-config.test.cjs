'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {releaseConfig} = require('../macos-release-config.cjs');
const valid = {
  MACOS_CERTIFICATE_P12_BASE64: 'test-only', MACOS_CERTIFICATE_PASSWORD: 'never-log-this',
  MACOS_SIGNING_IDENTITY: 'Developer ID Application: Test (AB12345678)',
  APPLE_API_KEY_P8_BASE64: 'test-only', APPLE_API_KEY_ID: 'CD12345678',
  APPLE_API_ISSUER_ID: '12345678-1234-1234-1234-123456789abc',
};
test('release configuration fails closed without credentials and does not echo secret values', () => {
  assert.throws(() => releaseConfig({MACOS_CERTIFICATE_PASSWORD: 'never-log-this'}), error =>
    error.message.includes('MACOS_SIGNING_IDENTITY') && !error.message.includes('never-log-this'));
});
test('release signing rejects candidate and App Store identities', () => {
  for (const identity of ['-', 'Apple Development: Test (AB12345678)', '3rd Party Mac Developer Application: Test (AB12345678)']) {
    assert.throws(() => releaseConfig({...valid, MACOS_SIGNING_IDENTITY: identity}), /Developer ID Application/);
  }
});
test('release configuration retains correct Developer ID team and requires team notary credentials', () => {
  assert.equal(releaseConfig(valid).team, 'AB12345678');
  assert.throws(() => releaseConfig({...valid, APPLE_API_ISSUER_ID: 'wrong'}), /issuer UUID/);
});
