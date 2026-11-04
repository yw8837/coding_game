import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Exercise the installed dependency paths actually used by the lint configuration.
const chains = [
  ['eslint', 'minimatch'],
  ['eslint-config-next', 'eslint-plugin-react', 'minimatch'],
  ['eslint-config-next', 'eslint-plugin-import', 'minimatch'],
  ['eslint-config-next', 'eslint-plugin-jsx-a11y', 'minimatch'],
];
const cases = [
  ['components/game/window.tsx', '**/*.{ts,tsx}', true],
  ['components/game/window.js', '**/*.{ts,tsx}', false],
  ['lib/game/save.test.ts', '**/*.test.ts', true],
  ['lib/game/save.ts', '**/*.test.ts', false],
  ['.next/cache/output.js', '**/*.js', false],
];
for (const [entry, ...dependencies] of chains) {
  let file = import.meta.resolve(entry);
  for (const name of dependencies) file = createRequire(file).resolve(name);
  const require = createRequire(file);
  const match = require(file);
  const manifestPath = require.resolve('minimatch/package.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.version, '11.0.1');
  assert.equal(typeof match, 'function', `${entry}: legacy CommonJS API`);
  assert.equal(match.minimatch, match);
  for (const [input, pattern, expected] of cases) {
    assert.equal(match(input, pattern), expected);
    assert.equal(new match.Minimatch(pattern).match(input), expected);
  }
  assert.deepEqual(match.match(['a.ts', 'b.js'], '*.ts'), ['a.ts']);
  assert.deepEqual(['a.ts', 'b.js'].filter(match.filter('*.ts')), ['a.ts']);
  const esm = await import(pathToFileURL(resolve(dirname(manifestPath), manifest.exports['.'].import.default)).href);
  assert.equal(esm.minimatch('lib/game/save.ts', '**/*.ts'), true);
  console.log(`${entry} -> minimatch: legacy, named, class and ESM APIs pass`);
}

// React Hooks accepts Zod 4, but its error formatter must resolve the same API.
const nextRequire = createRequire(import.meta.resolve('eslint-config-next'));
const hooksRequire = createRequire(nextRequire.resolve('eslint-plugin-react-hooks'));
const { z } = hooksRequire('zod');
const { fromZodError } = hooksRequire('zod-validation-error');
const invalid = z.object({ count: z.number().min(1) }).safeParse({ count: 0 });
assert.equal(invalid.success, false);
assert.match(fromZodError(invalid.error).message, /count/);
console.log('React Hooks Zod validation error formatting passes');
