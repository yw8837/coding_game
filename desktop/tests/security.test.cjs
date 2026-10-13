'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {CSP, ENTRY, ORIGIN, resolveAsset, isAppURL, isTrustedSender} = require('../security.cjs');

test('desktop CSP permits only the exact trusted authored preview runtime beside packaged scripts', () => {
 const {createHash} = require('node:crypto');
 const runtime = require('../authored-runtime.json');
 const digest = createHash('sha256').update(runtime.source, 'utf8').digest('base64');
 assert.equal(digest, runtime.sha256);
 const scriptPolicy = CSP.split('; ').find(value => value.startsWith('script-src '));
 assert.equal(scriptPolicy, "script-src 'self' 'sha256-" + digest + "'");
 assert.equal(scriptPolicy.includes('unsafe-inline'), false);
 assert.equal(scriptPolicy.includes('nonce-'), false);
 assert.ok(CSP.includes("connect-src 'none'"));
 assert.ok(CSP.includes("worker-src 'none'"));
});

test('only packaged origin and files inside renderer root are accepted', () => {
  const root = path.resolve('renderer');
  assert.equal(resolveAsset(root, ENTRY), path.join(root, 'index.html'));
  assert.equal(resolveAsset(root, `${ORIGIN}/assets/game.js`), path.join(root, 'assets', 'game.js'));
  for (const url of ['https://example.com/index.html', 'file:///C:/secret',
    'codeshift://other/index.html', 'codeshift://user@app/index.html',
    'codeshift://app:443/index.html', 'codeshift://app/%2e%2e%2fsecret',
    'codeshift://app/assets%5c..%5csecret', 'codeshift://app/%00']) {
    assert.throws(() => resolveAsset(root, url));
  }
  assert.equal(isAppURL('not a url'), false);
});
test('IPC trusts only the owned main frame at the custom origin', () => {
  const frame = {origin: ORIGIN, url: ENTRY};
  const contents = {mainFrame: frame};
  assert.equal(isTrustedSender({sender: contents, senderFrame: frame}, contents), true);
  assert.equal(isTrustedSender({sender: {}, senderFrame: frame}, contents), false);
  assert.equal(isTrustedSender({sender: contents, senderFrame: {...frame}}, contents), false);
  assert.equal(isTrustedSender({sender: contents, senderFrame: null}, contents), false);
  frame.origin = 'null';
  assert.equal(isTrustedSender({sender: contents, senderFrame: frame}, contents), false);
});
