import {makeUniversalApp} from '@electron/universal';
import {sign} from '@electron/osx-sign';
import {access, copyFile, mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

if (process.platform !== 'darwin') throw new Error('Universal merging must run on macOS.');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../release');
const source = arch => path.join(root, `Localhost Hero-darwin-${arch}`);
const destination = path.join(root, 'Localhost Hero-darwin-universal');
const app = path.join(destination, 'Localhost Hero.app');
for (const arch of ['x64', 'arm64']) await access(path.join(source(arch), 'Localhost Hero.app/Contents/Resources/app.asar'));
await mkdir(destination, {recursive: true});
await makeUniversalApp({
  x64AppPath: path.join(source('x64'), 'Localhost Hero.app'),
  arm64AppPath: path.join(source('arm64'), 'Localhost Hero.app'), outAppPath: app,
  mergeASARs: true,
  // steamworks.js ships both architecture-specific bindings under distinct names.
  x64ArchFiles: '**/steamworksjs.darwin-*.node',
});
await sign({app, platform: 'darwin', identity: '-', identityValidation: false,
  preAutoEntitlements: false, preEmbedProvisioningProfile: false,
  optionsForFile: () => ({hardenedRuntime: false})});
for (const notice of ['LICENSE', 'LICENSES.chromium.html', 'THIRD-PARTY-NOTICES.txt']) {
  await copyFile(path.join(source('arm64'), notice), path.join(destination, notice));
}
await writeFile(path.join(destination, 'MACOS-CANDIDATE-NOT-FOR-RELEASE.txt'),
  'Universal Intel/Apple Silicon candidate. Ad-hoc signed, not Developer ID signed or notarized. Steam installation and gameplay verification remain required.\n');
console.log(destination);
