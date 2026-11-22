'use strict';

const MAX_TEXT = 60000;
function clipboardText(value) {
  if (typeof value !== 'string' || value.length > MAX_TEXT) throw new TypeError('Invalid clipboard text');
  return value;
}

/** IPC sender validation remains in main.handle; no files, images, or arbitrary formats. */
function createTextClipboard(clipboard, isFocused) {
  const check = () => {if (!isFocused()) throw new Error('Window is not focused');};
  return {
    read: () => {check();return clipboardText(clipboard.readText());},
    write: value => {check();clipboard.writeText(clipboardText(value));},
  };
}
module.exports = {createTextClipboard};
