// Manual release only. CI credentials are used in an ephemeral keychain, never in artifacts.
import {sign} from '@electron/osx-sign';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {randomBytes, createHash} from 'node:crypto';
import {access, copyFile, mkdtemp, mkdir, readFile, writeFile, rm, realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import configModule from '../macos-release-config.cjs';

const config = configModule.releaseConfig(process.env);
if (process.argv.includes('--check-config')) {
  console.log('Release configuration present; no certificate import, signing, or Apple request performed.');
  process.exit(0);
}
if (process.platform !== 'darwin') throw new Error('Release signing must run on macOS.');
const desktop = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const candidate = path.join(desktop, 'release', 'Localhost Hero-darwin-universal');
const output = path.join(desktop, 'release', 'macos-notarized');
const payload = path.join(output, 'payload');
// Never overwrite a prior release or accidentally reuse a stale notarized ZIP.
await mkdir(output);
await mkdir(payload);
const app = path.join(payload, 'Localhost Hero.app');
const exec = promisify(execFile);
async function run(command, args, timeout = 120_000) {
  try { return await exec(command, args, {timeout, maxBuffer: 8 * 1024 * 1024}); }
  catch { throw new Error(`${path.basename(command)} failed. No release artifact was approved; credentials and command arguments are intentionally omitted.`); }
}
await run('ditto', [path.join(candidate, 'Localhost Hero.app'), app]);
for (const notice of ['LICENSE', 'LICENSES.chromium.html', 'THIRD-PARTY-NOTICES.txt']) {
  await copyFile(path.join(candidate, notice), path.join(payload, notice));
}
const plist = path.join(app, 'Contents/Info.plist');
const {stdout: bundleId} = await run('/usr/libexec/PlistBuddy', ['-c', 'Print CFBundleIdentifier', plist]);
if (bundleId.trim() !== 'com.studioyeolmae.localhosthero') throw new Error('Refusing non-production bundle ID');
const steamConfig = JSON.parse(await readFile(path.join(app, 'Contents/MacOS/steam-config.json'), 'utf8'));
if (Number(steamConfig.appId) !== 5441360) throw new Error('Refusing incorrect Steam AppID');
await access(path.join(app, 'Contents/Resources/app.asar'));
for (const executable of ['CODE-SHIFT', 'libsteam_api.dylib']) {
  await run('lipo', [path.join(app, 'Contents/MacOS', executable), '-verify_arch', 'x86_64', 'arm64']);
}
const tempRoot = await realpath(tmpdir());
const secretDir = await mkdtemp(path.join(tempRoot, 'localhosthero-sign-'));
const keychain = path.join(secretDir, 'release.keychain-db');
const keychainPassword = randomBytes(32).toString('hex');
try {
  const cert = path.join(secretDir, 'certificate.p12');
  const apiKey = path.join(secretDir, 'notary.p8');
  await writeFile(cert, Buffer.from(process.env.MACOS_CERTIFICATE_P12_BASE64, 'base64'), {mode: 0o600});
  await writeFile(apiKey, Buffer.from(process.env.APPLE_API_KEY_P8_BASE64, 'base64'), {mode: 0o600});
  await run('security', ['create-keychain', '-p', keychainPassword, keychain]);
  await run('security', ['set-keychain-settings', '-lut', '7200', keychain]);
  await run('security', ['unlock-keychain', '-p', keychainPassword, keychain]);
  await run('security', ['import', cert, '-k', keychain, '-P', process.env.MACOS_CERTIFICATE_PASSWORD,
    '-T', '/usr/bin/codesign', '-T', '/usr/bin/security']);
  await run('security', ['set-key-partition-list', '-S', 'apple-tool:,apple:,codesign:', '-s', '-k', keychainPassword, keychain]);
  await sign({app, platform: 'darwin', identity: config.identity, keychain,
    preAutoEntitlements: false, preEmbedProvisioningProfile: false,
    optionsForFile: () => ({hardenedRuntime: true,
      entitlements: path.join(desktop, 'macos-steam-entitlements.plist')})});
  await run('codesign', ['--verify', '--deep', '--strict', '--verbose=2', app]);
  const signature = await run('codesign', ['-d', '--verbose=4', app]);
  if (!signature.stderr.includes(`TeamIdentifier=${config.team}`) || !signature.stderr.includes('runtime')) {
    throw new Error('Signed team or hardened runtime does not match release policy');
  }
  const submission = path.join(secretDir, 'notary-submission.zip');
  await run('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', app, submission]);
  console.log('Submitting signed app to Apple notarization. No Steam upload is performed.');
  const response = await run('xcrun', ['notarytool', 'submit', submission, '--key', apiKey,
    '--key-id', config.keyId, '--issuer', config.issuer, '--wait', '--timeout', '30m', '--output-format', 'json'], 1_900_000);
  const notary = JSON.parse(response.stdout);
  await writeFile(path.join(output, 'notary-result.json'), JSON.stringify(notary, null, 2));
  if (notary.status !== 'Accepted') throw new Error(`Apple notarization not accepted (submission ${notary.id}); no upload ZIP created.`);
  await run('xcrun', ['stapler', 'staple', app]);
  await run('xcrun', ['stapler', 'validate', app]);
  await run('codesign', ['--verify', '--deep', '--strict', '--verbose=2', app]);
  await run('spctl', ['--assess', '--type', 'execute', '--verbose=2', app]);
  const zip = path.join(output, 'Localhost-Hero-macOS-5441362.zip');
  await run('ditto', ['-c', '-k', '--sequesterRsrc', payload, zip]);
  const sha256 = createHash('sha256').update(await readFile(zip)).digest('hex');
  await writeFile(`${zip}.sha256`, `${sha256}  ${path.basename(zip)}\n`);
  await writeFile(path.join(output, 'release-report.json'), JSON.stringify({
    source: process.env.GITHUB_SHA ?? null, appId: 5441360, depotId: 5441362,
    team: config.team, notarization: notary.id, sha256, steamUploaded: false,
    macGameplayVerified: false, steamClientVerified: false,
  }, null, 2));
  console.log(`Notarized upload ZIP: ${zip}. Steam installation and gameplay checks remain required.`);
} finally {
  await run('security', ['delete-keychain', keychain]).catch(() => {});
  const resolved = await realpath(secretDir);
  if (path.dirname(resolved) !== tempRoot) throw new Error('Refusing cleanup outside temporary signing directory');
  await rm(resolved, {recursive: true, force: true});
}
