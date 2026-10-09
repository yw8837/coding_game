'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const {randomUUID} = require('node:crypto');
const {validateRaw} = require('./save-store.cjs');

async function writeBackup(file, raw) {
  validateRaw(raw);
  if (typeof file !== 'string' || path.extname(file).toLowerCase() !== '.json') {
    throw new Error('JSON destination required');
  }
  const temporary = path.join(path.dirname(file), `.codeshift-export-${randomUUID()}.tmp`);
  let handle;
  try {
    handle = await fs.open(temporary, 'wx', 0o600);
    await handle.writeFile(raw, 'utf8');
    await handle.sync();
    await handle.close(); handle = null;
    await fs.rename(temporary, file);
  } finally {
    if (handle) await handle.close();
    await fs.unlink(temporary).catch(() => {});
  }
}
module.exports = {writeBackup};
