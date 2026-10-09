'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');

const MAX_SAVE_BYTES = 16 * 1024 * 1024;
const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
function validateRaw(raw) {
  if (typeof raw !== 'string' || Buffer.byteLength(raw, 'utf8') > MAX_SAVE_BYTES) {
    throw new Error('Save must be JSON text within 16 MiB');
  }
  const value = JSON.parse(raw);
  if (!object(value) || value.version !== 1 || !object(value.machines) ||
      !object(value.machines.local) || !object(value.machines.server) ||
      !object(value.gameplay) || !Array.isArray(value.completed) ||
      !Number.isInteger(value.mission) || value.mission < 0 || value.mission > 2) {
    throw new Error('Save does not have the expected game structure');
  }
  return raw;
}

class SaveStore {
  constructor(userData) {
    this.directory = path.join(userData, 'saves');
    this.primary = path.join(this.directory, 'game.json');
    this.backup = path.join(this.directory, 'game.json.bak');
    this.queue = Promise.resolve();
    this.lastError = null;
    this.protectBackup = false;
  }
  async read(file) {
    const info = await fs.stat(file);
    if (!info.isFile() || info.size > MAX_SAVE_BYTES) throw new Error('Invalid save file');
    return validateRaw(await fs.readFile(file, 'utf8'));
  }
  async loadBackup() {
    await this.queue;
    try {
      const raw = await this.read(this.backup);
      this.protectBackup = true;
      return {raw, recovered: true};
    }
    catch (error) {
      return {raw: null, recovered: false,
        ...(error.code === 'ENOENT' ? {} : {error: 'Backup progress is damaged or unreadable.'})};
    }
  }
  async load() {
    await this.queue;
    try { return {raw: await this.read(this.primary), recovered: false}; }
    catch (primaryError) {
      try {
        const raw = await this.read(this.backup);
        this.protectBackup = true;
        return {raw, recovered: true};
      }
      catch (backupError) {
        const absent = primaryError.code === 'ENOENT' && backupError.code === 'ENOENT';
        return {raw: null, recovered: false,
          ...(absent ? {} : {error: 'Saved progress is damaged or unreadable.'})};
      }
    }
  }
  async atomicWrite(file, raw) {
    const temporary = file + '.tmp';
    const handle = await fs.open(temporary, 'w', 0o600);
    try { await handle.writeFile(raw, 'utf8'); await handle.sync(); }
    finally { await handle.close(); }
    try { await fs.rename(temporary, file); }
    catch (error) { await fs.unlink(temporary).catch(() => {}); throw error; }
  }
  save(raw) {
    const task = this.queue.then(async () => {
      // Validation failures must participate in call order too: a previous
      // queued success must not erase the latest rejected save's close warning.
      try { validateRaw(raw); }
      catch { this.lastError = 'Progress was not valid JSON or exceeded the save limit.';
        return {ok: false, error: this.lastError}; }
      try {
        await fs.mkdir(this.directory, {recursive: true, mode: 0o700});
        let previous = null;
        try { previous = await this.read(this.primary); } catch { /* Preserve a valid backup. */ }
        if (previous !== null && !this.protectBackup) await this.atomicWrite(this.backup, previous);
        await this.atomicWrite(this.primary, raw);
        this.protectBackup = false;
        this.lastError = null;
        return {ok: true};
      } catch {
        this.lastError = 'Progress could not be written. Check free space and folder access.';
        return {ok: false, error: this.lastError};
      }
    });
    this.queue = task.then(() => undefined, () => undefined);
    return task;
  }
  async drain() { await this.queue; return {ok: !this.lastError, ...(this.lastError ? {error: this.lastError} : {})}; }
}
module.exports = {SaveStore, validateRaw, MAX_SAVE_BYTES};
