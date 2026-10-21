'use strict';

function nativeMenuTemplate(platform) {
  if (platform !== 'darwin') return null;
  // Electron localizes native roles. Edit roles are necessary for Cmd+C/V/Z
  // inside the game's code editor and terminal; no developer/network menus.
  return [
    {label: 'Localhost Hero', submenu: [
      {role: 'hide'}, {role: 'hideOthers'}, {role: 'unhide'},
      {type: 'separator'}, {role: 'quit'},
    ]},
    {role: 'editMenu'},
    {role: 'windowMenu'},
  ];
}

module.exports = {nativeMenuTemplate};
