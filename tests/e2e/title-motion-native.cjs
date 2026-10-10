'use strict';
// Real Windows Electron renderer, isolated profile, no Steam account or player save.
const path=require('node:path'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
const {_electron}=require(process.env.PLAYWRIGHT_PACKAGE||path.join(process.env.USERPROFILE,'.codex/skills/webapp-testing/.venv/Lib/site-packages/playwright/driver/package'));
const root=path.resolve(__dirname,'../..'),out=path.join(root,'output/launch-quality-20261010/title-motion');
const report={errors:[],steamRuntimeTested:false};
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 const app=await _electron.launch({executablePath:path.join(root,'desktop/node_modules/electron/dist/electron.exe'),args:[path.join(root,'desktop'),'--qa-user-data='+path.join(out,'native-profile-'+Date.now())],env,timeout:25000});
 try{
  const page=await app.firstWindow();page.setDefaultTimeout(12000);page.on('pageerror',e=>report.errors.push(String(e)));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.getByTestId('title-new').waitFor();await page.waitForFunction(()=>!document.querySelector('[data-testid="title-new"]').disabled);
  await page.waitForFunction(()=>document.querySelector('.title-home').dataset.motion==='animated');
  assert.equal((await page.evaluate(()=>window.desktopBridge.getPlatformInfo())).runtime,'desktop');
  assert.equal(await page.getByTestId('title-motion').count(),0);
  await page.waitForFunction(()=>document.querySelector('.title-home').dataset.motion==='animated');
  const before=await page.locator('.title-editor-code code').textContent();
  await page.waitForFunction(v=>document.querySelector('.title-editor-code code').textContent!==v,before);
  for(const selector of ['.title-rain line','.title-coffee-steam path']){
   const first=await page.locator(selector).first().evaluate(e=>getComputedStyle(e).transform);
   await page.waitForFunction(v=>getComputedStyle(document.querySelector(v.selector)).transform!==v.first,{selector,first});
  }
  assert.equal(await page.locator('html').getAttribute('data-game-reduced-motion'),'true');
  await page.waitForFunction(()=>document.querySelector('.title-terminal-log-entry')!==null);
  await page.reload();await page.waitForFunction(()=>document.querySelector('.title-home')?.dataset.motion==='animated');
  await page.screenshot({path:path.join(out,'windows-animated.png')});
  await page.getByTestId('title-settings').click();
  assert.equal(await page.locator('.title-rain line').first().evaluate(e=>getComputedStyle(e).animationPlayState),'paused');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.title-rain line').first().evaluate(e=>getComputedStyle(e).animationPlayState),'running');
  assert.deepEqual(report.errors,[]);report.windowsRendererPassed=true;report.automaticOnReload=true;report.passed=true;
 }finally{await app.close();await fs.writeFile(path.join(out,'native-report.json'),JSON.stringify(report,null,2));}
 console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
