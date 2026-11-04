'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {_electron}=require(process.env.PLAYWRIGHT_PACKAGE);
const root=process.cwd(),out=path.join(root,'output/full-version-quality');
const report={passed:false,checks:[],errors:[]};
let app;
async function pressNative(keyCode){
 await app.evaluate(({BrowserWindow},key)=>{
  const window=BrowserWindow.getAllWindows()[0];window.focus();
  window.webContents.sendInputEvent({type:'keyDown',keyCode:key});
  window.webContents.sendInputEvent({type:'keyUp',keyCode:key});
 },keyCode);
}
async function waitForMode(expected){
 for(let i=0;i<100;i++){
  const actual=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].isFullScreen());
  if(actual===expected)return;
  await new Promise(resolve=>setTimeout(resolve,50));
 }
 throw Error('Native fullscreen did not become '+expected);
}
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 app=await _electron.launch({executablePath:path.join(root,'desktop/node_modules/electron/dist/electron.exe'),args:[path.join(root,'desktop'),'--qa-user-data='+path.join(out,'fullscreen-profile-'+Date.now())],env,timeout:30000});
 const page=await app.firstWindow();
 page.on('pageerror',error=>report.errors.push(String(error)));
 await page.waitForFunction(()=>document.querySelector('.pc-play')&&!document.querySelector('.pc-play').disabled);
 await waitForMode(true);report.checks.push('starts-fullscreen');
 await pressNative('F11');await waitForMode(false);
 await pressNative('F11');await waitForMode(true);report.checks.push('F11-roundtrip');
 await pressNative('Escape');await waitForMode(true);report.checks.push('Escape-keeps-native-fullscreen');
 await page.getByTestId('title-settings').click();
 const toggle=page.getByTestId('display-mode-toggle');
 await toggle.waitFor({state:'visible'});
 await toggle.click();await waitForMode(false);
 await page.waitForFunction(()=>document.querySelector('[data-testid="display-mode-toggle"]')?.getAttribute('aria-pressed')==='false');
 await pressNative('F11');await waitForMode(true);
 await page.waitForFunction(()=>document.querySelector('[data-testid="display-mode-toggle"]')?.getAttribute('aria-pressed')==='true');
 await toggle.click();await waitForMode(false);report.checks.push('settings-and-keyboard-stay-synchronized');
 const rejected=await page.evaluate(async()=>{try{await window.desktopBridge.setFullscreen('true');return false;}catch{return true;}});
 assert.equal(rejected,true);report.checks.push('rejects-invalid-mode');
 await page.evaluate(()=>window.desktopBridge.setFullscreen(true));await waitForMode(true);
 await page.screenshot({path:path.join(out,'fullscreen-settings.png')});
 assert.deepEqual(report.errors,[]);report.passed=true;
})().catch(error=>{report.errors.push(String(error.stack||error));process.exitCode=1;}).finally(async()=>{
 if(app)await app.close();
 await fs.writeFile(path.join(out,'fullscreen-native.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
});
