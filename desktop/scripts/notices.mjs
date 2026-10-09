import {readFile, readdir, access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const noticeName = /^(?:licen[sc]e|copying|notice)(?:[._-].*)?$/i;
const exists = async file => {try {await access(file); return true;} catch {return false;}};
const vendorNotices = fileURLToPath(new URL('../vendor-notices/', import.meta.url));

/** Locate a real installed package, skipping nameless nested module manifests. */
export async function packageForModule(id) {
  let file = id.replace(/^\0+/, '').split('?')[0];
  if (file.startsWith('file:')) file = fileURLToPath(file);
  if (!file.replaceAll('\\', '/').includes('/node_modules/')) return null;
  let directory = path.dirname(file);
  for (;;) {
    try {
      const metadata = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'));
      if (typeof metadata.name === 'string' && typeof metadata.version === 'string') {
        return {directory, name: metadata.name, version: metadata.version,
          license: typeof metadata.license === 'string' ? metadata.license : JSON.stringify(metadata.license ?? 'unspecified')};
      }
    } catch { /* Virtual module or an intermediate directory without a manifest. */ }
    const parent = path.dirname(directory);
    if (parent === directory) return null;
    directory = parent;
  }
}

export async function readPackageNotices(pkg, fallbackDirectory = vendorNotices) {
  const entries = await readdir(pkg.directory, {withFileTypes: true});
  const files = entries.filter(entry => entry.isFile() && noticeName.test(entry.name))
    .map(entry => entry.name).sort();
  if (files.length) return Promise.all(files.map(async name => ({name, text: await readFile(path.join(pkg.directory, name), 'utf8')})));
  const missing = `No license/notice text installed for bundled ${pkg.name}@${pkg.version}; provide its verified license before shipping.`;
  let manifest;
  try { manifest = JSON.parse(await readFile(path.join(fallbackDirectory, 'manifest.json'), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') throw new Error(missing); throw error; }
  const key = `${pkg.name}@${pkg.version}`;
  if (manifest.schemaVersion !== 1 || !Object.hasOwn(manifest.entries ?? {}, key)) throw new Error(missing);
  const entry = manifest.entries[key];
  const file = path.resolve(fallbackDirectory, entry.file);
  const relative = path.relative(path.resolve(fallbackDirectory), file);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || entry.spdx !== pkg.license) {
    throw new Error(`Invalid version-bound license provenance for ${key}`);
  }
  const bytes = await readFile(file);
  if (createHash('sha256').update(bytes).digest('hex') !== entry.sha256) {
    throw new Error(`Vendored license checksum mismatch for ${key}`);
  }
  return [{name: entry.file, text: bytes.toString('utf8'), provenance: entry}];
}

/** Actual emitted JS modules plus direct stylesheet packages and vendored notices. */
export async function collectNotices(moduleIds, stylesheets = [], {fallbackDirectory = vendorNotices} = {}) {
  const packages = new Map();
  const addPackage = pkg => {if (pkg) packages.set(`${pkg.name}@${pkg.version}`, pkg);};
  for (const id of [...new Set(moduleIds)].sort()) addPackage(await packageForModule(id));
  const vendor = [];
  for (const stylesheet of stylesheets) {
    const source = await readFile(stylesheet, 'utf8');
    for (const match of source.matchAll(/@import\s+["']([^"']+)["']/g)) {
      const imported = match[1];
      if (imported.startsWith('.')) {
        const file = path.resolve(path.dirname(stylesheet), imported);
        const notice = file.replace(/\.css$/i, '.LICENSE.md');
        if (notice !== file && await exists(notice)) vendor.push({name: path.basename(file), text: await readFile(notice, 'utf8')});
      } else if (!/^(?:[a-z]+:|\/)/i.test(imported)) {
        const parts = imported.split('/');
        const name = imported.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
        // packageForModule walks upwards; the CSS import is represented as a
        // synthetic file inside that installed package, without reading code.
        let parent = path.dirname(stylesheet);
        let found = null;
        for (;;) {
          const pkgRoot = path.join(parent, 'node_modules', name);
          if (await exists(path.join(pkgRoot, 'package.json'))) {
            found = await packageForModule(path.join(pkgRoot, '__stylesheet_import__.css'));
            break;
          }
          const next = path.dirname(parent);
          if (next === parent) break;
          parent = next;
        }
        if (!found) throw new Error(`Cannot locate stylesheet license package: ${name}`);
        addPackage(found);
      }
    }
  }
  const records = [];
  const failures = [];
  for (const [, pkg] of [...packages].sort(([a], [b]) => a.localeCompare(b))) {
    try {
      records.push({name: pkg.name, version: pkg.version, license: pkg.license,
        notices: await readPackageNotices(pkg, fallbackDirectory)});
    } catch (error) { failures.push(error.message); }
  }
  if (failures.length) throw new Error(`Incomplete renderer license notices (${failures.length} packages):\n${failures.map(message => '- ' + message).join('\n')}`);
  const sections = [
    'CODE:SHIFT — bundled renderer third-party notices',
    'Generated from modules in emitted Vite chunks and directly imported stylesheet packages.',
    'Electron and Chromium runtime notices are supplied separately beside the executable.',
    '',
  ];
  for (const record of records) {
    sections.push('='.repeat(72), `${record.name}@${record.version} — ${record.license}`);
    for (const notice of record.notices) {
      if (notice.provenance) sections.push('Verified upstream fallback: ' + notice.provenance.source.licenseURL,
        notice.provenance.qualification);
      sections.push(`--- ${notice.name} ---`, notice.text.trim(), '');
    }
  }
  for (const notice of vendor.sort((a, b) => a.name.localeCompare(b.name))) {
    sections.push('='.repeat(72), `Vendored stylesheet: ${notice.name}`, notice.text.trim(), '');
  }
  return {source: sections.join('\n') + '\n', packages: records.map(({name, version, license, notices}) =>
    ({name, version, license, noticeFiles: notices.map(notice => notice.name),
      ...(notices.some(notice => notice.provenance) ? {fallbackProvenance: notices.filter(notice => notice.provenance).map(notice => notice.provenance)} : {})})),
    vendoredStylesheets: vendor.map(notice => notice.name)};
}

export function thirdPartyNoticesPlugin({stylesheets = []} = {}) {
  return {
    name: 'codeshift-third-party-notices', apply: 'build',
    async generateBundle(_options, bundle) {
      const moduleIds = Object.values(bundle).filter(item => item.type === 'chunk')
        .flatMap(chunk => Object.keys(chunk.modules));
      const result = await collectNotices(moduleIds, stylesheets);
      this.emitFile({type: 'asset', fileName: 'THIRD-PARTY-NOTICES.txt', source: result.source});
      this.emitFile({type: 'asset', fileName: 'third-party-manifest.json', source: JSON.stringify({
        packages: result.packages, vendoredStylesheets: result.vendoredStylesheets,
      }, null, 2)});
    },
  };
}
