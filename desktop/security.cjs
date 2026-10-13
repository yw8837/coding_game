'use strict';
const path = require('node:path');

const ORIGIN = 'codeshift://app';
const ENTRY = `${ORIGIN}/index.html`;
const authoredRuntime = require('./authored-runtime.json');
const CSP = [
  "default-src 'none'", `script-src 'self' 'sha256-${authoredRuntime.sha256}'`, "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:", "font-src 'self'", "media-src 'self' blob:",
  "connect-src 'none'", "worker-src 'none'", "frame-src 'self' about: blob:",
  "object-src 'none'", "base-uri 'none'", "form-action 'none'", "frame-ancestors 'none'",
].join('; ');

function isAppURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'codeshift:' && url.hostname === 'app' &&
      !url.port && !url.username && !url.password;
  } catch { return false; }
}

function resolveAsset(root, value) {
  if (!isAppURL(value)) throw new Error('Untrusted asset origin');
  const url = new URL(value);
  const decoded = decodeURIComponent(url.pathname);
  if (decoded.includes('\\') || decoded.includes('\0') ||
      decoded.split('/').some(segment => segment === '..' || segment === '.')) {
    throw new Error('Invalid asset path');
  }
  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const resolved = path.resolve(root, relative);
  const boundary = path.resolve(root) + path.sep;
  if (!resolved.startsWith(boundary)) throw new Error('Asset path escapes renderer bundle');
  return resolved;
}

function isTrustedSender(event, webContents) {
  const frame = event.senderFrame;
  return event.sender === webContents && !!frame && frame === webContents.mainFrame &&
    frame.origin === ORIGIN && isAppURL(frame.url);
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};
module.exports = {ORIGIN, ENTRY, CSP, MIME, isAppURL, resolveAsset, isTrustedSender};
