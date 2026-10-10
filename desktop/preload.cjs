'use strict';
const {contextBridge, ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld('desktopBridge', Object.freeze({
  getPlatformInfo: () => ipcRenderer.invoke('desktop:platform'),
  setLanguage: language => ipcRenderer.invoke('desktop:language', language),
  loadSave: () => ipcRenderer.invoke('desktop:load'),
  loadBackup: () => ipcRenderer.invoke('desktop:backup'),
  saveGame: raw => ipcRenderer.invoke('desktop:save', raw),
  exportBackup: raw => ipcRenderer.invoke('desktop:export', raw),
  exportApp: html => ipcRenderer.invoke('desktop:export-app', html),
  unlockAchievements: ids => ipcRenderer.invoke('desktop:achievements', ids),
  onBeforeClose: callback => {
    if (typeof callback !== 'function') throw new TypeError('Callback required');
    const listener = () => callback();
    ipcRenderer.on('desktop:before-close', listener);
    return () => ipcRenderer.removeListener('desktop:before-close', listener);
  },
  confirmClose: () => ipcRenderer.invoke('desktop:confirm-close'),
}));
