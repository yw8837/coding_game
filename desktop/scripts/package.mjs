import {packager} from '@electron/packager';
import {flipFuses, FuseVersion, FuseV1Options} from '@electron/fuses';
import {readFile, access, copyFile, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const desktop = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const {readConfig, validAppId} = require('../steam.cjs');
const steamBuild = process.argv.includes('--steam');
const qaBuild = process.argv.includes('--qa');
if (qaBuild && steamBuild) throw new Error('QA packages disable Steam and cannot be Steam release candidates.');
if (process.platform !== 'win32' || process.arch !== 'x64') {
  throw new Error('Package and validate this Windows x64 release on Windows x64.');
}
await access(path.join(desktop, 'renderer', 'index.html'));
await access(path.join(desktop, 'renderer', 'THIRD-PARTY-NOTICES.txt'));
const manifest = JSON.parse(await readFile(path.join(desktop, 'package.json'), 'utf8'));
const config = readConfig([path.join(desktop, 'steam-config.json')]);
let steamDll;
if (steamBuild) {
  if (!validAppId(config.appId)) throw new Error('Supply your real Steam AppID in steam-config.json or CODESHIFT_STEAM_APP_ID.');
  const moduleRoot = path.dirname(require.resolve('steamworks.js/package.json'));
  await access(path.join(moduleRoot, 'dist', 'win64', 'steamworksjs.win32-x64-msvc.node'));
  const candidates = [path.join(desktop, 'vendor', 'steam_api64.dll'), path.join(moduleRoot, 'dist', 'win64', 'steam_api64.dll')];
  for (const candidate of candidates) {
    try { await access(candidate); steamDll = candidate; break; } catch { /* Check the next licensed SDK location. */ }
  }
  if (!steamDll) throw new Error('Place the licensed Windows x64 Steam SDK steam_api64.dll at desktop/vendor/steam_api64.dll.');
}
const outputs = await packager({
  dir: desktop, name: qaBuild ? 'CODE-SHIFT-QA' : 'CODE-SHIFT', executableName: 'CODE-SHIFT',
  platform: 'win32', arch: 'x64', electronVersion: manifest.devDependencies.electron,
  appVersion: manifest.version, buildVersion: '0.14.0.0', appCopyright: 'CODE:SHIFT',
  out: path.join(desktop, 'release'), overwrite: true, prune: true,
  asar: {unpack: '**/*.{node,dll}'},
  afterCopy: [async ({buildPath}) => {
    await writeFile(path.join(buildPath, 'qa-build.cjs'), `'use strict';\nmodule.exports = ${qaBuild};\n`);
  }],
  ignore: [/[/\\](?:release|client|tests|scripts|steam|vendor)(?:[/\\]|$)/,
    /[/\\]vite\.config\.mjs$/, /[/\\]steam_appid\.txt$/,
    ...(!steamBuild ? [/[/\\]node_modules[/\\]steamworks\.js(?:[/\\]|$)/] : [])],
  win32metadata: {ProductName: 'CODE:SHIFT', FileDescription: 'CODE:SHIFT offline game'},
});
for (const output of outputs) {
  // Electron and Chromium notices are part of the shipped runtime, never app code.
  await access(path.join(output, 'LICENSE'));
  await access(path.join(output, 'LICENSES.chromium.html'));
  await copyFile(path.join(desktop, 'renderer', 'THIRD-PARTY-NOTICES.txt'),
    path.join(output, 'THIRD-PARTY-NOTICES.txt'));
  await flipFuses(path.join(output, 'CODE-SHIFT.exe'), {
    version: FuseVersion.V1,
    [FuseV1Options.RunAsNode]: false,
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    [FuseV1Options.EnableNodeCliInspectArguments]: false,
    [FuseV1Options.EnableCookieEncryption]: true,
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
    [FuseV1Options.OnlyLoadAppFromAsar]: true,
  });
  if (steamBuild) {
    await copyFile(steamDll, path.join(output, 'steam_api64.dll'));
  }
  // Explicit null ensures an offline package does not inherit local Steam config.
  await writeFile(path.join(output, 'steam-config.json'),
    JSON.stringify({appId: steamBuild ? config.appId : null}, null, 2));
  if (qaBuild) await writeFile(path.join(output, 'QA-NOT-FOR-DISTRIBUTION.txt'),
    'Isolated QA build. Requires --qa-user-data=<absolute-directory>. Steam is disabled. Never distribute this build.\n');
  console.log(`${qaBuild ? 'QA only' : steamBuild ? 'Steam candidate' : 'Offline candidate'}: ${output}`);
}
console.log('No executable, installer, signing service or Steam upload was launched.');
