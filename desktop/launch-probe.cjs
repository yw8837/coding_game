'use strict';

// Internal QA startup check. No DOM injection, player commands, or production IPC.
function createLaunchProbe({enabled, report, exit, timeoutMs = 30000, settleMs = 2000}) {
  if (!enabled) return {mark() {}, fail() {}};
  const required = new Set(['renderer-loaded', 'desktop:platform', 'desktop:load']);
  const observed = new Set();
  let finished = false;
  let settle;
  const deadline = setTimeout(() => finish(false, 'startup-timeout'), timeoutMs);
  async function finish(ok, reason) {
    if (finished) return;
    finished = true;
    clearTimeout(deadline);
    clearTimeout(settle);
    try {
      await report({ok, reason, platform: process.platform, arch: process.arch, observed: [...observed]});
      exit(ok ? 0 : 1);
    } catch { exit(1); }
  }
  return {
    mark(event) {
      if (finished || !required.has(event)) return;
      observed.add(event);
      if (!settle && observed.size === required.size) settle = setTimeout(() => finish(true, 'startup-ready'), settleMs);
    },
    fail(reason) { void finish(false, reason); },
  };
}

module.exports = {createLaunchProbe};
