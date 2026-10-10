'use strict';
const path=require('node:path'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
const {_electron}=require(process.env.PLAYWRIGHT_PACKAGE||path.join(process.env.USERPROFILE,'.codex/skills/webapp-testing/.venv/Lib/site-packages/playwright/driver/package'));
const root=path.resolve(__dirname,'../..'),out=path.join(root,'output/title-save-state');
const profile=path.join(out,'native-profile-'+Date.now()),report={errors:[],steamRuntimeTested:false};
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
let app;
async function enabled(page,id,value){await page.waitForFunction(({id,value})=>{const el=document.querySelector(`[data-testid="${id}"]`);return !!el&&!el.disabled===value;},{id,value});}
async function launch(){
 app=await _electron.launch({executablePath:path.join(root,'desktop/node_modules/electron/dist/electron.exe'),args:[path.join(root,'desktop'),'--qa-user-data='+profile],env,timeout:25000});
 const page=await app.firstWindow();page.setDefaultTimeout(12000);page.on('pageerror',e=>report.errors.push(String(e)));
 await enabled(page,'title-new',true);return page;
}
(async()=>{
 await fs.mkdir(out,{recursive:true});
 try{
  let page=await launch();
  await page.getByTestId('title-settings').click();await page.getByRole('combobox',{name:'Language'}).selectOption('ko');await page.keyboard.press('Escape');
  await enabled(page,'title-continue',false);
  assert.equal(await page.locator('.title-home-edition').count(),0);
  await page.getByTestId('title-new').click();await page.locator('.pc-shortcuts').waitFor({state:'visible'});
  await app.close();app=null;page=await launch();
  await enabled(page,'title-continue',false);
  await page.getByTestId('title-new').click();
  await page.locator('.pc-shortcuts').getByRole('button',{name:'터미널',exact:true}).click();
  const input=page.locator('.pc-window[data-active=true] .terminal-form input');
  await input.fill('echo first-draft > notes.txt');await input.press('Enter');
  await page.waitForFunction(async()=>JSON.parse((await window.desktopBridge.loadSave()).raw).history.at(-1)?.command==='echo first-draft > notes.txt');
  const saved=await page.evaluate(()=>window.desktopBridge.loadSave());
  await app.close();app=null;page=await launch();
  await enabled(page,'title-continue',true);
  await page.getByTestId('title-new').click();await page.getByRole('alertdialog').waitFor({state:'visible'});await page.keyboard.press('Escape');
  assert.equal((await page.evaluate(()=>window.desktopBridge.loadSave())).raw,saved.raw);
  await page.getByTestId('title-settings').click();await page.getByRole('button',{name:'진행 기록 초기화',exact:true}).click();
  await page.getByRole('alertdialog').getByRole('button',{name:'초기화하고 다시 시작',exact:true}).click();
  await page.locator('.pc-shortcuts').waitFor({state:'visible'});
  await page.waitForFunction(async()=>JSON.parse((await window.desktopBridge.loadSave()).raw).history.length===0);
  await app.close();app=null;page=await launch();
  await enabled(page,'title-continue',false);
  await page.waitForFunction(()=>document.activeElement===document.querySelector('[data-testid="title-new"]'));
  await page.screenshot({path:path.join(out,'native-after-reset.png')});
  assert.deepEqual(report.errors,[]);Object.assign(report,{emptySaveDisabled:true,typedWorkSurvivesRelaunch:true,cancelPreservesWork:true,resetSurvivesRelaunch:true,passed:true});
 }finally{if(app)await app.close();await fs.writeFile(path.join(out,'native-report.json'),JSON.stringify(report,null,2));}
 console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
