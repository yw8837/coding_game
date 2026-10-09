'use strict';
const fs = require('node:fs');
const catalog = require('./achievements.json');
const allowed = new Set(catalog.map(item => item.id));

function validAppId(value) {
  return Number.isSafeInteger(value) && value > 0 && value <= 0xffffffff && value !== 480;
}
function readConfig(files, env = process.env) {
  if (env.CODESHIFT_STEAM_APP_ID !== undefined) {
    const id = /^\d+$/.test(env.CODESHIFT_STEAM_APP_ID) ? Number(env.CODESHIFT_STEAM_APP_ID) : NaN;
    return {appId: validAppId(id) ? id : null, invalid: !validAppId(id)};
  }
  for (const file of files) {
    try {
      const info = fs.statSync(file);
      if (info.size > 4096) return {appId: null, invalid: true};
      const config = JSON.parse(fs.readFileSync(file, 'utf8'));
      return {appId: validAppId(config.appId) ? config.appId : null,
        invalid: config.appId != null && !validAppId(config.appId)};
    } catch (error) { if (error.code !== 'ENOENT') return {appId: null, invalid: true}; }
  }
  return {appId: null, invalid: false};
}
function createSteam(config, load = () => require('steamworks.js')) {
  let client = null;
  let language;
  if (validAppId(config.appId)) {
    try {
      client = load().init(config.appId);
      if (!client || client.utils.getAppId() !== config.appId) throw new Error('Steam app identity mismatch');
      language = client.apps.currentGameLanguage();
    } catch { client = null; }
  }
  return {
    get available() { return !!client; },
    get language() { return client && typeof language === 'string' ? language.slice(0, 40) : undefined; },
    unlock(ids) {
      if (!Array.isArray(ids) || ids.length > allowed.size ||
          ids.some(id => typeof id !== 'string' || !allowed.has(id))) return {ok: false};
      if (!client) return {ok: false};
      try {
        let success = true;
        for (const id of new Set(ids)) {
          if (!client.achievement.isActivated(id) && !client.achievement.activate(id)) success = false;
        }
        if (ids.length && !client.stats.store()) success = false;
        return {ok: success};
      } catch { return {ok: false}; }
    },
  };
}
module.exports = {validAppId, readConfig, createSteam};
