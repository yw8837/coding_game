import assert from 'node:assert/strict';
import {readFile, access, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {listPackage, statFile, extractFile} from '@electron/asar';
import {getCurrentFuseWire, FuseV1Options} from '@electron/fuses';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const release = path.join(root, 'desktop/release/CODE-SHIFT-win32-x64');
const archive = path.join(release, 'resources/app.asar');
const qaArchive = path.join(root, 'desktop/release/CODE-SHIFT-QA-win32-x64/resources/app.asar');
const entries = listPackage(archive).map(name => name.replace(/^[/\\]+/, ''));
const files = entries.filter(name => !statFile(archive, name).files);
const read = name => extractFile(archive, path.normalize(name));
const manifest = JSON.parse(read('package.json'));
assert.equal(manifest.version, JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')).version);
assert.match(read('qa-build.cjs').toString(), /module\.exports = false;/);
assert.equal(JSON.parse(await readFile(path.join(release, 'steam-config.json'), 'utf8')).appId, null);
assert.equal(files.some(name => /^node_modules[\\/]steamworks\.js[\\/]/.test(name)), false);
for (const name of ['LICENSE', 'LICENSES.chromium.html', 'THIRD-PARTY-NOTICES.txt']) await access(path.join(release, name));
const notice = JSON.parse(read('renderer/third-party-manifest.json'));
assert.ok(notice.packages.length > 0);
assert.deepEqual(read('renderer/THIRD-PARTY-NOTICES.txt'), await readFile(path.join(release, 'THIRD-PARTY-NOTICES.txt')));
const matching = files.filter(name => /^renderer[/\\]/.test(name) || /^[^/\\]+\.cjs$/.test(name) && !name.endsWith('qa-build.cjs'));
for (const name of matching) assert.deepEqual(read(name), extractFile(qaArchive, name), `QA mismatch: ${name}`);
const rendererFiles = matching.filter(name => /^renderer[/\\]/.test(name));
for (const name of matching) {
  assert.deepEqual(read(name), await readFile(path.join(root, 'desktop', name)), `Current source/build mismatch: ${name}`);
}
assert.deepEqual(read('renderer/favicon.svg'), await readFile(path.join(root, 'public/favicon.svg')));
assert.match(read('renderer/index.html').toString(), /href="\/favicon\.svg"/);
const art = [];
for (const name of ['studio-evening.png', 'neighborhood.png', 'mono-cafe.png', 'portraits.png', 'wallpaper-blue.png', 'wallpaper-coast.png', 'wallpaper-garden.png', 'wallpaper-loft.png']) {
  const packed = read('renderer/game-art/' + name);
  assert.deepEqual(packed, await readFile(path.join(root, 'public/game-art', name)), `Art mismatch: ${name}`);
  art.push({file: name, bytes: packed.length, sha256: createHash('sha256').update(packed).digest('hex')});
}
const fuses = await getCurrentFuseWire(path.join(release, 'CODE-SHIFT.exe'));
for (const key of ['RunAsNode', 'EnableNodeOptionsEnvironmentVariable', 'EnableNodeCliInspectArguments']) assert.equal(fuses[FuseV1Options[key]], 48, key);
for (const key of ['EnableEmbeddedAsarIntegrityValidation', 'OnlyLoadAppFromAsar', 'EnableCookieEncryption']) assert.equal(fuses[FuseV1Options[key]], 49, key);
const report = {version: manifest.version, qaFlag: false, steamModuleIncluded: false, steamAppId: null,
  licenseFilesPresent: true, rendererNoticePackages: notice.packages.length, fuses,
  matchingQAGameFiles: matching.length, matchingCurrentSourceAndRendererFiles: matching.length, matchingCurrentRendererFiles: rendererFiles.length,
  desktopIconPresent: true, asarFiles: files.length, art};
await mkdir(path.join(root, 'output/art-qa'), {recursive: true});
await writeFile(path.join(root, 'output/art-qa/offline-package-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
