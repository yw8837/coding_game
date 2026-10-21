import {packager} from '@electron/packager';
import {flipFuses, FuseVersion, FuseV1Options} from '@electron/fuses';
import {readFile, access, copyFile, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const desktop = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const {readConfig, validAppId} = require('../steam.cjs');
const {packageTarget, packageLayout} = require('../package-target.cjs');
const steamBuild = process.argv.includes('--steam');
const qaBuild = process.argv.includes('--qa');
if (qaBuild && steamBuild) throw new Error('QA packages disable Steam and cannot be Steam release candidates.');
const target = packageTarget(process.platform, process.arch);
const mac = target.platform === 'darwin';
const name = mac ? (qaBuild ? 'Localhost Hero QA' : 'Localhost Hero') : (qaBuild ? 'CODE-SHIFT-QA' : 'CODE-SHIFT');
await access(path.join(desktop, 'renderer', 'index.html'));
await access(path.join(desktop, 'renderer', 'THIRD-PARTY-NOTICES.txt'));
const manifest = JSON.parse(await readFile(path.join(desktop, 'package.json'), 'utf8'));
const config = readConfig([path.join(desktop, 'steam-config.json')]);
let steamDll;
if (steamBuild) {
  if (!validAppId(config.appId)) throw new Error('Supply your real Steam AppID in steam-config.json or CODESHIFT_STEAM_APP_ID.');
  const moduleRoot = path.dirname(require.resolve('steamworks.js/package.json'));
  await access(path.join(moduleRoot, 'dist', target.steamDirectory, target.steamBinding));
  const candidates = [path.join(desktop, 'vendor', target.steamLibrary), path.join(moduleRoot, 'dist', target.steamDirectory, target.steamLibrary)];
  for (const candidate of candidates) {
    try { await access(candidate); steamDll = candidate; break; } catch { /* Check the next licensed SDK location. */ }
  }
  if (!steamDll) throw new Error(`Missing Steam SDK library for ${target.platform}/${target.arch}: ${target.steamLibrary}`);
}
const outputs = await packager({
  dir: desktop, name, executableName: 'CODE-SHIFT',
  platform: target.platform, arch: target.arch, electronVersion: manifest.devDependencies.electron,
  appVersion: mac ? manifest.version.split('-')[0] : manifest.version,
  buildVersion: mac ? manifest.version.split('-')[0] : '0.14.0.0', appCopyright: 'Localhost Hero',
  ...(mac ? {appBundleId: qaBuild ? 'com.studioyeolmae.localhosthero.qa' : 'com.studioyeolmae.localhosthero',
    appCategoryType: 'public.app-category.games', darwinDarkModeSupport: true} : {}),
  out: path.join(desktop, 'release'), overwrite: true, prune: true,
  asar: {unpack: '**/*.{node,dll,dylib}'},
  afterCopy: [async ({buildPath}) => {
    await writeFile(path.join(buildPath, 'qa-build.cjs'), `'use strict';\nmodule.exports = ${qaBuild};\n`);
    await writeFile(path.join(buildPath, 'steam-config.json'),
      JSON.stringify({appId: steamBuild ? config.appId : null}, null, 2));
  }],
  ignore: [/[/\\](?:release|client|tests|scripts|steam|vendor)(?:[/\\]|$)/,
    /[/\\]vite\.config\.mjs$/, /[/\\]steam_appid\.txt$/,
    ...(!steamBuild ? [/[/\\]node_modules[/\\]steamworks\.js(?:[/\\]|$)/] : [])],
  // Executable and profile names stay CODE-SHIFT so existing installs keep their saves.
  win32metadata: {ProductName: 'Localhost Hero', FileDescription: 'Localhost Hero offline game'},
});
for (const output of outputs) {
  const layout = packageLayout(output, target, name);
  // Electron and Chromium notices are part of the shipped runtime, never app code.
  await access(path.join(output, 'LICENSE'));
  await access(path.join(output, 'LICENSES.chromium.html'));
  await copyFile(path.join(desktop, 'renderer', 'THIRD-PARTY-NOTICES.txt'),
    path.join(output, 'THIRD-PARTY-NOTICES.txt'));
  if (steamBuild) await copyFile(steamDll, path.join(layout.executableDirectory, target.steamLibrary));
  // Explicit null prevents offline packages from inheriting local Steam config.
  await writeFile(path.join(layout.executableDirectory, 'steam-config.json'),
    JSON.stringify({appId: steamBuild ? config.appId : null}, null, 2));
  // Sign after every bundle mutation; Apple Silicon needs a valid ad-hoc signature.
  await flipFuses(layout.fuseTarget, {
    version: FuseVersion.V1,
    resetAdHocDarwinSignature: mac,
    [FuseV1Options.RunAsNode]: false,
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    [FuseV1Options.EnableNodeCliInspectArguments]: false,
    [FuseV1Options.EnableCookieEncryption]: true,
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
    [FuseV1Options.OnlyLoadAppFromAsar]: true,
  });
  if (mac) {
    const {sign} = await import('@electron/osx-sign');
    // Deep codesign alone misses SDK dylibs. Sign every discovered Mach-O, then
    // seal the outer bundle. This is explicitly an internal ad-hoc candidate.
    await sign({app: layout.app, platform: 'darwin', identity: '-', identityValidation: false,
      preAutoEntitlements: false, preEmbedProvisioningProfile: false,
      optionsForFile: () => ({hardenedRuntime: false})});
  }
  if (mac) await writeFile(path.join(output, 'MACOS-CANDIDATE-NOT-FOR-RELEASE.txt'),
    'Internal candidate: ad-hoc signed only; not Developer ID signed or notarized. Native playtest and Steam depot verification required before claiming macOS support.\n');
  if (qaBuild) await writeFile(path.join(output, 'QA-NOT-FOR-DISTRIBUTION.txt'),
    'Isolated QA build. Requires --qa-user-data=<absolute-directory>. Steam is disabled. Never distribute this build.\n');
  console.log(`${qaBuild ? 'QA only' : steamBuild ? 'Steam candidate' : 'Offline candidate'}: ${output}`);
}
console.log('No game executable, installer, notarization service or Steam upload was launched.');
