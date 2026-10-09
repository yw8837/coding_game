import {build} from 'vite';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {access, writeFile, cp} from 'node:fs/promises';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const desktop = path.join(project, 'desktop');
await access(path.join(project, 'app', 'career.css'));
await build({configFile: path.join(desktop, 'vite.config.mjs')});
await cp(path.join(project, 'public', 'game-art'), path.join(desktop, 'renderer', 'game-art'), {recursive: true});
await writeFile(path.join(desktop, 'renderer', 'build-info.json'), JSON.stringify({
  version: '0.11.0-rc.0', runtime: 'desktop', networkRequired: false,
  builtAt: new Date().toISOString(),
}, null, 2));
console.log('Offline renderer written to desktop/renderer. No Electron process was started.');
