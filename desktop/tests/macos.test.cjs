'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {packageTarget, packageLayout} = require('../package-target.cjs');
const {nativeMenuTemplate} = require('../native-menu.cjs');

test('mac packages use matching Steam bindings and the Mach-O library', () => {
  for (const arch of ['x64', 'arm64']) {
    const target = packageTarget('darwin', arch);
    assert.equal(target.steamBinding, `steamworksjs.darwin-${arch}.node`);
    assert.equal(target.steamLibrary, 'libsteam_api.dylib');
    assert.equal(target.steamDirectory, 'osx');
    const layout = packageLayout('release', target, 'Localhost Hero');
    assert.equal(layout.fuseTarget, path.join('release', 'Localhost Hero.app'));
    assert.equal(layout.executableDirectory, path.join(layout.app, 'Contents', 'MacOS'));
    assert.equal(layout.resources, path.join(layout.app, 'Contents', 'Resources'));
  }
});

test('Windows executable/config locations stay compatible; unsupported targets fail closed', () => {
  const target = packageTarget('win32', 'x64');
  const layout = packageLayout('release', target, 'CODE-SHIFT');
  assert.equal(layout.fuseTarget, path.join('release', 'CODE-SHIFT.exe'));
  assert.equal(layout.executableDirectory, 'release');
  assert.equal(target.steamBinding, 'steamworksjs.win32-x64-msvc.node');
  for (const [platform, arch] of [['linux', 'x64'], ['darwin', 'ia32'], ['win32', 'arm64']]) {
    assert.throws(() => packageTarget(platform, arch), /Unsupported package target/);
  }
});

test('Mac gets native edit shortcuts without developer menus; Windows menu unchanged', () => {
  const template = nativeMenuTemplate('darwin');
  assert.ok(template.some(item => item.role === 'editMenu'));
  assert.ok(template[0].submenu.some(item => item.role === 'quit'));
  assert.ok(!JSON.stringify(template).match(/toggleDevTools|reload|forceReload/));
  assert.equal(nativeMenuTemplate('win32'), null);
});
