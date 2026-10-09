'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

test('notices include only represented packages, exact license texts and vendored CSS', async t => {
  const {collectNotices} = await import('../scripts/notices.mjs');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'codeshift-notices-test-'));
  t.after(() => fs.rm(root, {recursive: true, force: true}));
  for (const name of ['included', 'unused', 'styles']) {
    const dir = path.join(root, 'node_modules', name);
    await fs.mkdir(dir, {recursive: true});
    await fs.writeFile(path.join(dir, 'package.json'), JSON.stringify({name, version: '1.0.0', license: 'MIT'}));
    await fs.writeFile(path.join(dir, 'LICENSE'), `${name} exact copyright and permission text`);
  }
  await fs.mkdir(path.join(root, 'app')); await fs.mkdir(path.join(root, 'vendor'));
  await fs.writeFile(path.join(root, 'vendor', 'copied.LICENSE.md'), 'Vendor exact license text');
  const css = path.join(root, 'app', 'globals.css');
  await fs.writeFile(css, '@import "styles";\n@import "../vendor/copied.css";');
  const id = path.join(root, 'node_modules', 'included', 'index.js');
  const result = await collectNotices([id, id + '?commonjs-proxy', path.join(root, 'app', 'entry.tsx')], [css]);
  assert.deepEqual(result.packages.map(pkg => pkg.name), ['included', 'styles']);
  assert.ok(result.source.includes('included exact copyright and permission text'));
  assert.ok(result.source.includes('Vendor exact license text'));
  assert.ok(!result.source.includes('unused exact'));
});
test('missing license text fails instead of emitting an incomplete shipping notice', async t => {
  const {collectNotices} = await import('../scripts/notices.mjs');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'codeshift-notices-test-'));
  t.after(() => fs.rm(root, {recursive: true, force: true}));
  const dir = path.join(root, 'node_modules', 'missing'); await fs.mkdir(dir, {recursive: true});
  await fs.writeFile(path.join(dir, 'package.json'), JSON.stringify({name: 'missing', version: '1.0.0'}));
  await assert.rejects(collectNotices([path.join(dir, 'index.js')]), /No license\/notice text/);
});
test('upstream fallback is version-bound and rejects modified license bytes', async t => {
  const {readPackageNotices} = await import('../scripts/notices.mjs');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'codeshift-notices-test-'));
  t.after(() => fs.rm(root, {recursive: true, force: true}));
  const emptyPackage = path.join(root, 'empty-package'); await fs.mkdir(emptyPackage);
  const pkg = {directory: emptyPackage, name: 'react-remove-scroll-bar', version: '2.3.8', license: 'MIT'};
  const result = await readPackageNotices(pkg);
  assert.ok(result[0].text.includes('2025 Anton Korzunov <thekashey@gmail.com>'));
  assert.equal(result[0].provenance.source.gitBlob, '7c08c3990396ecefd90f99ff5d9a34f26f5b5616');
  await assert.rejects(readPackageNotices({...pkg, version: '2.3.9'}), /No license\/notice text/);
  const fallback = path.join(root, 'fallback'); await fs.mkdir(fallback);
  await fs.copyFile(path.join(__dirname, '../vendor-notices/manifest.json'), path.join(fallback, 'manifest.json'));
  await fs.writeFile(path.join(fallback, 'react-remove-scroll-bar.LICENSE'), 'modified bytes');
  await assert.rejects(readPackageNotices(pkg, fallback), /checksum mismatch/);
});
