import {build} from 'vite';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {access, readFile, writeFile, appendFile, cp, copyFile} from 'node:fs/promises';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const desktop = path.join(project, 'desktop');
const {version} = JSON.parse(await readFile(path.join(project, 'package.json'), 'utf8'));
// CI uses the source commit time so native builds can share one universal ASAR.
const sourceEpoch = process.env.SOURCE_DATE_EPOCH;
if (sourceEpoch !== undefined && !/^\d+$/.test(sourceEpoch)) throw new Error('Invalid SOURCE_DATE_EPOCH');
const builtAt = new Date(sourceEpoch === undefined ? Date.now() : Number(sourceEpoch) * 1000).toISOString();
await access(path.join(project, 'app', 'career.css'));
await build({configFile: path.join(desktop, 'vite.config.mjs')});
await cp(path.join(project, 'public', 'game-art'), path.join(desktop, 'renderer', 'game-art'), {recursive: true});
await cp(path.join(project, 'public', 'licenses'), path.join(desktop, 'renderer', 'licenses'), {recursive: true});
await copyFile(path.join(project, 'public', 'favicon.svg'), path.join(desktop, 'renderer', 'favicon.svg'));
const techniqueLicense = await readFile(path.join(project, 'public', 'licenses', 'ai-techstudio.txt'), 'utf8');
await appendFile(path.join(desktop, 'renderer', 'THIRD-PARTY-NOTICES.txt'), '\n\nAI Tech Studio — referenced audio and feedback techniques\nhttps://github.com/uibsee/ai-techstudio\n\n' + techniqueLicense);
await writeFile(path.join(desktop, 'renderer', 'build-info.json'), JSON.stringify({
  version, runtime: 'desktop', networkRequired: false,
  builtAt,
}, null, 2));
console.log('Offline renderer written to desktop/renderer. No Electron process was started.');
