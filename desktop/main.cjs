'use strict';
const {app, BrowserWindow, dialog, ipcMain, protocol, session} = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const {SaveStore, validateRaw} = require('./save-store.cjs');
const {writeBackup} = require('./export-backup.cjs');
const {nativeLanguage, messages} = require('./native-i18n.cjs');
const {createSteam, readConfig} = require('./steam.cjs');
const {ENTRY, CSP, MIME, isAppURL, resolveAsset, isTrustedSender} = require('./security.cjs');
const {selectProfile, prepareProfile} = require('./profile.cjs');
const qaBuild = require('./qa-build.cjs');

app.setName('CODE-SHIFT');
let profile;
let profileError;
try {
  profile = selectProfile({appData: app.getPath('appData'), argv: process.argv,
    packaged: app.isPackaged, qaBuild});
  const paths = prepareProfile(profile);
  app.setPath('userData', paths.userData);
  app.setPath('sessionData', paths.sessionData);
} catch (error) { profileError = error; }
protocol.registerSchemesAsPrivileged([{scheme: 'codeshift', privileges: {
  standard: true, secure: true, supportFetchAPI: true, corsEnabled: true,
}}]);
const renderer = path.join(__dirname, 'renderer');
let window = null;
let store;
let steam;
let closing = false;
let allowClose = false;
let closeTimer;
let prompting = false;
let exporting = false;
let uiLanguage = null;
const words = () => messages[uiLanguage || nativeLanguage(steam?.language, app.getPreferredSystemLanguages())];

async function askToDiscard(message) {
  if (prompting || !window || window.isDestroyed()) return;
  prompting = true;
  try {
    const choice = await dialog.showMessageBox(window, {
      type: 'warning', title: 'CODE:SHIFT', message,
      detail: words().unsaved,
      buttons: [words().keepPlaying, words().discard], defaultId: 0, cancelId: 0, noLink: true,
    });
    if (choice.response === 1) { await store.drain(); allowClose = true; window?.close(); }
    else closing = false;
  } finally { prompting = false; }
}

function requestClose(event) {
  if (allowClose) return;
  event.preventDefault();
  if (closing) return;
  closing = true;
  window.webContents.send('desktop:before-close');
  closeTimer = setTimeout(() => {
    void askToDiscard(words().timeout);
  }, 8000);
}

function handle(channel, callback) {
  ipcMain.handle(channel, async (event, ...args) => {
    if (!window || !isTrustedSender(event, window.webContents)) throw new Error('Untrusted sender');
    return callback(...args);
  });
}

async function boot() {
  if (profileError) throw profileError;
  await fs.access(path.join(renderer, 'index.html'));
  store = new SaveStore(app.getPath('userData'));
  steam = createSteam(profile.qa ? {appId: null} : readConfig([
    path.join(path.dirname(app.getPath('exe')), 'steam-config.json'),
    path.join(__dirname, 'steam-config.json'),
  ]));
  const local = session.fromPartition('persist:codeshift-desktop');
  local.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  local.setPermissionCheckHandler(() => false);
  local.webRequest.onBeforeRequest((details, callback) => {
    const permitted = isAppURL(details.url) || /^(data:|blob:|about:)/.test(details.url);
    callback({cancel: !permitted});
  });
  local.on('will-download', event => event.preventDefault());
  local.protocol.handle('codeshift', async request => {
    try {
      if (request.method !== 'GET') return new Response(null, {status: 405});
      const file = resolveAsset(renderer, request.url);
      const mime = MIME[path.extname(file).toLowerCase()];
      if (!mime) return new Response(null, {status: 404});
      return new Response(await fs.readFile(file), {headers: {
        'Content-Type': mime, 'Content-Security-Policy': CSP,
        'X-Content-Type-Options': 'nosniff',
      }});
    } catch { return new Response(null, {status: 404}); }
  });
  window = new BrowserWindow({
    width: 1440, height: 960, minWidth: 960, minHeight: 640,
    backgroundColor: '#0b121b', title: 'CODE:SHIFT', show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'), session: local,
      contextIsolation: true, sandbox: true, nodeIntegration: false,
      nodeIntegrationInWorker: false, nodeIntegrationInSubFrames: false,
      webSecurity: true, allowRunningInsecureContent: false, webviewTag: false,
      devTools: !app.isPackaged, spellcheck: false,
    },
  });
  window.setMenu(null);
  window.webContents.setWindowOpenHandler(() => ({action: 'deny'}));
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.webContents.on('will-redirect', event => event.preventDefault());
  window.webContents.on('will-attach-webview', event => event.preventDefault());
  window.on('close', requestClose);
  window.on('closed', () => { clearTimeout(closeTimer); window = null; app.quit(); });
  handle('desktop:platform', () => ({runtime: 'desktop', version: app.getVersion(),
    steamAvailable: steam.available, ...(steam.language ? {steamLanguage: steam.language} : {}),
    osLanguages: app.getPreferredSystemLanguages().slice(0, 20)}));
  handle('desktop:language', language => {
    if (!['ko', 'en', 'ja'].includes(language)) return {ok: false};
    uiLanguage = language;
    return {ok: true};
  });
  handle('desktop:load', () => store.load());
  handle('desktop:backup', () => store.loadBackup());
  handle('desktop:save', raw => store.save(raw));
  handle('desktop:export', async raw => {
    if (exporting || closing) return {ok: false, canceled: true};
    try { validateRaw(raw); } catch { return {ok: false, error: words().exportInvalid}; }
    exporting = true;
    try {
      const choice = await dialog.showSaveDialog(window, {
        title: words().exportTitle, buttonLabel: words().exportButton,
        defaultPath: path.join(app.getPath('documents'), 'codeshift-backup.json'),
        filters: [{name: 'JSON', extensions: ['json']}],
        properties: ['showOverwriteConfirmation'],
      });
      if (choice.canceled || !choice.filePath) return {ok: false, canceled: true};
      await writeBackup(choice.filePath, raw);
      return {ok: true};
    } catch { return {ok: false, error: words().exportFailed}; }
    finally { exporting = false; }
  });
  handle('desktop:achievements', ids => steam.unlock(ids));
  handle('desktop:confirm-close', async () => {
    if (!closing) return {ok: false};
    clearTimeout(closeTimer);
    const result = await store.drain();
    if (!result.ok) { void askToDiscard(words().saveFailed); return {ok: false}; }
    if (prompting) return {ok: false};
    allowClose = true;
    setImmediate(() => window?.close());
    return {ok: true};
  });
  await window.loadURL(ENTRY);
  window.show();
}

if (profileError) {
  // Exit before acquiring a default-profile lock or creating a Chromium session.
  dialog.showErrorBox('CODE:SHIFT', 'The game profile could not be prepared. ' +
    (qaBuild || process.argv.some(value => value.startsWith('--qa-user-data='))
      ? 'Use a new absolute QA directory outside the production profile.'
      : 'Check access to the game data directory.'));
  app.exit(1);
} else if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (window) { if (window.isMinimized()) window.restore(); window.focus(); } });
  app.on('before-quit', event => {
    if (window && !allowClose) { event.preventDefault(); window.close(); }
  });
  app.whenReady().then(boot).catch(error => {
    dialog.showErrorBox(words().startupTitle, error.code === 'ENOENT'
      ? words().missingBundle : words().startupFailed);
    allowClose = true; app.quit();
  });
}
