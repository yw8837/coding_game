'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const {randomUUID} = require('node:crypto');

const MAX_APP_BYTES = 512 * 1024;

// This is a file-export boundary, not an HTML execution service. The renderer
// compiles the supported app format; the main process never loads this content.
function validateApp(html) {
  if (typeof html !== 'string' || !/^<!doctype html>/i.test(html) ||
      html.includes('\0') || Buffer.byteLength(html, 'utf8') > MAX_APP_BYTES) {
    throw new Error('A bounded HTML app document is required');
  }
}

async function writeApp(file, html) {
  validateApp(html);
  if (typeof file !== 'string' || !path.isAbsolute(file) || path.extname(file).toLowerCase() !== '.html') {
    throw new Error('An absolute HTML destination is required');
  }
  const temporary = path.join(path.dirname(file), `.codeshift-app-${randomUUID()}.tmp`);
  let handle;
  try {
    handle = await fs.open(temporary, 'wx', 0o600);
    await handle.writeFile(html, 'utf8');
    await handle.sync();
    await handle.close(); handle = null;
    await fs.rename(temporary, file);
  } finally {
    if (handle) await handle.close();
    await fs.unlink(temporary).catch(() => {});
  }
}

// The caller shares this gate with progress-backup exports and the close flow.
async function exportAppDocument(html, {isBusy, setBusy, choose, words, write = writeApp}) {
  if (isBusy()) return {ok:false, canceled:true};
  try { validateApp(html); } catch { return {ok:false, error:words.appExportInvalid}; }
  setBusy(true);
  try {
    const choice = await choose();
    if (choice.canceled || !choice.filePath) return {ok:false, canceled:true};
    await write(choice.filePath, html);
    return {ok:true};
  } catch { return {ok:false, error:words.appExportFailed}; }
  finally { setBusy(false); }
}

module.exports = {MAX_APP_BYTES, validateApp, writeApp, exportAppDocument};
