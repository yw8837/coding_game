'use strict';
const fs = require('node:fs');
const path = require('node:path');
const MARKER = '.codeshift-qa-profile';
const normalize = value => path.resolve(value).toLowerCase();
function overlap(first, second) {
  const a = normalize(first), b = normalize(second);
  return a === b || a.startsWith(b + path.sep) || b.startsWith(a + path.sep);
}
function canonicalPath(value, filesystem = fs) {
  let ancestor = path.resolve(value);
  const missing = [];
  // Resolve the nearest existing ancestor too: a not-yet-created QA folder
  // beneath a junction must not bypass production profile isolation.
  const entryExists = candidate => {
    try { filesystem.lstatSync(candidate); return true; }
    catch (error) { if (error.code === 'ENOENT') return false; throw error; }
  };
  while (!entryExists(ancestor)) {
    const parent = path.dirname(ancestor);
    if (parent === ancestor) throw new Error('Profile path has no accessible ancestor');
    missing.unshift(path.basename(ancestor));
    ancestor = parent;
  }
  return path.resolve(filesystem.realpathSync(ancestor), ...missing);
}
function assertQAChildren(directory) {
  const canonicalRoot = normalize(canonicalPath(directory));
  const children = ['browser', 'saves', MARKER,
    path.join('saves', 'game.json'), path.join('saves', 'game.json.bak'),
    path.join('saves', 'game.json.tmp'), path.join('saves', 'game.json.bak.tmp')];
  // Check startup write targets only, not Chromium's potentially large cache.
  // lstat in canonicalPath detects dangling links and makes them fail closed.
  for (const child of children) {
    const resolved = normalize(canonicalPath(path.join(directory, child)));
    if (resolved !== canonicalRoot && !resolved.startsWith(canonicalRoot + path.sep)) {
      throw new Error('QA child path must stay inside the isolated profile');
    }
  }
}
function assertQASeparate(directory, production) {
  const resolved = canonicalPath(directory);
  if (resolved === path.parse(resolved).root || overlap(directory, production) ||
      overlap(resolved, canonicalPath(production))) {
    throw new Error('QA profile must be absolute and separate from production');
  }
}
function selectProfile({appData, argv, packaged, qaBuild}) {
  const production = path.join(appData, 'CODE-SHIFT');
  const supplied = argv.filter(value => value.startsWith('--qa-user-data='));
  if (supplied.length > 1) throw new Error('Only one QA profile argument is allowed');
  if (!supplied.length) {
    if (qaBuild) throw new Error('QA builds require an explicit isolated user-data directory');
    return {directory: production, qa: false};
  }
  if (packaged && !qaBuild) throw new Error('QA profiles are disabled in production packages');
  const value = supplied[0].slice('--qa-user-data='.length);
  if (!path.isAbsolute(value) || path.resolve(value) === path.parse(path.resolve(value)).root ||
      overlap(value, production)) throw new Error('QA profile must be absolute and separate from production');
  const directory = path.resolve(value);
  assertQASeparate(directory, production);
  if (fs.existsSync(directory)) {
    if (!fs.statSync(directory).isDirectory()) throw new Error('QA profile must be a directory');
    const entries = fs.readdirSync(directory);
    if (entries.length && !fs.existsSync(path.join(directory, MARKER))) {
      throw new Error('Refusing to use an existing unmarked profile for QA');
    }
  }
  assertQAChildren(directory);
  return {directory, qa: true, production};
}
function prepareProfile(profile) {
  if (profile.qa) { assertQASeparate(profile.directory, profile.production); assertQAChildren(profile.directory); }
  fs.mkdirSync(profile.directory, {recursive: true, mode: 0o700});
  if (profile.qa) { assertQASeparate(profile.directory, profile.production); assertQAChildren(profile.directory); }
  const browser = path.join(profile.directory, 'browser');
  fs.mkdirSync(browser, {recursive: true, mode: 0o700});
  if (profile.qa) { assertQAChildren(profile.directory); fs.writeFileSync(path.join(profile.directory, MARKER), 'CODE:SHIFT isolated QA profile\n'); }
  return {userData: profile.directory, sessionData: browser};
}
module.exports = {selectProfile, prepareProfile, overlap, canonicalPath};
