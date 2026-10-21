'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createLaunchProbe} = require('../launch-probe.cjs');

function probe(options = {}) {
  let report;
  let finish;
  const done = new Promise(resolve => { finish = resolve; });
  const instance = createLaunchProbe({enabled: true, timeoutMs: 100, settleMs: 1,
    report: async value => { report = value; }, exit: code => finish({code, report}), ...options});
  return {instance, done};
}
test('launch probe requires page load and both native bootstrap calls', async () => {
  const {instance, done} = probe();
  instance.mark('renderer-loaded'); instance.mark('desktop:platform'); instance.mark('desktop:platform');
  instance.mark('desktop:load');
  const result = await done;
  assert.equal(result.code, 0);
  assert.deepEqual(result.report.observed, ['renderer-loaded', 'desktop:platform', 'desktop:load']);
});
test('missing renderer bootstrap fails and crashes override a pending success', async () => {
  const missing = probe({timeoutMs: 5});
  missing.instance.mark('renderer-loaded');
  assert.equal((await missing.done).report.reason, 'startup-timeout');
  const crashed = probe();
  for (const event of ['renderer-loaded', 'desktop:platform', 'desktop:load']) crashed.instance.mark(event);
  crashed.instance.fail('renderer-crashed');
  assert.equal((await crashed.done).code, 1);
});
test('disabled probe cannot write or terminate production', () => {
  const disabled = createLaunchProbe({enabled: false, report() { assert.fail(); }, exit() { assert.fail(); }});
  disabled.mark('desktop:load'); disabled.fail('ignored');
});
