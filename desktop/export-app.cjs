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

// Only these renderer-suggested names reach the save dialog; anything else uses the first.
const EXPORT_NAMES = Object.freeze({
  html: Object.freeze(['my-neighborhood-app.html', 'my-mono-cafe.html']),
  zip: Object.freeze(['my-neighborhood-app.zip', 'my-mono-cafe.zip']),
});
const MAX_ARCHIVE_BYTES = 2 * 1024 * 1024;

function exportName(kind, name) {
  const names = EXPORT_NAMES[kind];
  return names.includes(name) ? name : names[0];
}

// A stored ZIP built by the renderer: local-file signature, bounded size. Never extracted here.
function validateArchive(data) {
  if (!(data instanceof Uint8Array) || data.byteLength < 22 || data.byteLength > MAX_ARCHIVE_BYTES ||
      data[0] !== 0x50 || data[1] !== 0x4b || data[2] !== 0x03 || data[3] !== 0x04) {
    throw new Error('A bounded ZIP archive is required');
  }
}

async function writeAtomic(file, content, extension) {
  if (typeof file !== 'string' || !path.isAbsolute(file) || path.extname(file).toLowerCase() !== extension) {
    throw new Error(`An absolute ${extension} destination is required`);
  }
  const temporary = path.join(path.dirname(file), `.codeshift-app-${randomUUID()}.tmp`);
  let handle;
  try {
    handle = await fs.open(temporary, 'wx', 0o600);
    await handle.writeFile(content);
    await handle.sync();
    await handle.close(); handle = null;
    await fs.rename(temporary, file);
  } finally {
    if (handle) await handle.close();
    await fs.unlink(temporary).catch(() => {});
  }
}

async function writeApp(file, html) {
  validateApp(html);
  await writeAtomic(file, Buffer.from(html, 'utf8'), '.html');
}

async function writeArchive(file, data) {
  validateArchive(data);
  await writeAtomic(file, Buffer.from(data.buffer, data.byteOffset, data.byteLength), '.zip');
}

async function exportDocument(content, validate, write, {isBusy, setBusy, choose, invalid, failed}) {
  if (isBusy()) return {ok:false, canceled:true};
  try { validate(content); } catch { return {ok:false, error:invalid}; }
  setBusy(true);
  try {
    const choice = await choose();
    if (choice.canceled || !choice.filePath) return {ok:false, canceled:true};
    await write(choice.filePath, content);
    return {ok:true};
  } catch { return {ok:false, error:failed}; }
  finally { setBusy(false); }
}

// The caller shares this gate with progress-backup exports and the close flow.
function exportAppDocument(html, {isBusy, setBusy, choose, words, write = writeApp}) {
  return exportDocument(html, validateApp, write, {isBusy, setBusy, choose, invalid:words.appExportInvalid, failed:words.appExportFailed});
}

function exportArchiveDocument(data, {isBusy, setBusy, choose, words, write = writeArchive}) {
  return exportDocument(data, validateArchive, write, {isBusy, setBusy, choose, invalid:words.archiveExportInvalid, failed:words.archiveExportFailed});
}

module.exports = {
  MAX_APP_BYTES, MAX_ARCHIVE_BYTES, exportName, validateApp, validateArchive,
  writeApp, writeArchive, exportAppDocument, exportArchiveDocument,
};
