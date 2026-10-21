'use strict';
const path = require('node:path');

// Native builds keep Steam's binary architecture and Electron's architecture aligned.
function packageTarget(platform, arch) {
  if (platform === 'win32' && arch === 'x64') return {
    platform, arch, steamDirectory: 'win64',
    steamBinding: 'steamworksjs.win32-x64-msvc.node', steamLibrary: 'steam_api64.dll',
  };
  if (platform === 'darwin' && ['x64', 'arm64'].includes(arch)) return {
    platform, arch, steamDirectory: 'osx',
    steamBinding: `steamworksjs.darwin-${arch}.node`, steamLibrary: 'libsteam_api.dylib',
  };
  throw new Error(`Unsupported package target: ${platform}/${arch}. Use Windows x64 or macOS x64/arm64.`);
}

function packageLayout(output, target, name) {
  const mac = target.platform === 'darwin';
  const app = mac ? path.join(output, `${name}.app`) : null;
  return {
    app,
    fuseTarget: mac ? app : path.join(output, 'CODE-SHIFT.exe'),
    executableDirectory: mac ? path.join(app, 'Contents', 'MacOS') : output,
    resources: mac ? path.join(app, 'Contents', 'Resources') : path.join(output, 'resources'),
  };
}

module.exports = {packageTarget, packageLayout};
