'use strict';
const fs = require('node:fs');
const path = require('node:path');
const MARKER = '.codeshift-qa-profile';
const normalize = value => path.resolve(value).toLowerCase();
function overlap(first, second) {
  const a = normalize(first), b = normalize(second);
  return a === b || a.startsWith(b + path.sep) || b.startsWith(a + path.sep);
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
  if (fs.existsSync(directory)) {
    if (!fs.statSync(directory).isDirectory()) throw new Error('QA profile must be a directory');
    const entries = fs.readdirSync(directory);
    if (entries.length && !fs.existsSync(path.join(directory, MARKER))) {
      throw new Error('Refusing to use an existing unmarked profile for QA');
    }
  }
  return {directory, qa: true};
}
function prepareProfile(profile) {
  fs.mkdirSync(profile.directory, {recursive: true, mode: 0o700});
  const browser = path.join(profile.directory, 'browser');
  fs.mkdirSync(browser, {recursive: true, mode: 0o700});
  if (profile.qa) fs.writeFileSync(path.join(profile.directory, MARKER), 'CODE:SHIFT isolated QA profile\n');
  return {userData: profile.directory, sessionData: browser};
}
module.exports = {selectProfile, prepareProfile, overlap};
