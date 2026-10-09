'use strict';
const {spawn}=require('node:child_process'),path=require('node:path'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE||path.join(process.env.USERPROFILE,'.codex/skills/webapp-testing/.venv/Lib/site-packages/playwright/driver/package'));
const root=path.resolve(__dirname,'../..'),out=path.join(root,'output/steam-qa'),profile=path.join(out,'packaged-'+Date.now());
const exe=path.join(root,'desktop/release/CODE-SHIFT-QA-win32-x64/CODE-SHIFT.exe');
let child,browser;
async function launch(){
 child=spawn(exe,['--qa-user-data='+profile,'--remote-debugging-port=0'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
 const endpoint=await new Promise((resolve,reject)=>{let data='';const timer=setTimeout(()=>reject(Error('No Chromium debugging endpoint')),20000);child.once('exit',code=>{clearTimeout(timer);reject(Error('Premature exit '+code));});child.stderr.on('data',chunk=>{data+=chunk;const match=data.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timer);resolve(match[1]);}});});
 browser=await chromium.connectOverCDP(endpoint);const context=browser.contexts()[0];let page=context.pages()[0];if(!page)page=await context.waitForEvent('page');page.setDefaultTimeout(15000);await page.waitForFunction(()=>document.querySelector('.pc-play')&&!document.querySelector('.pc-play').disabled);await page.waitForFunction(()=>{const image=document.querySelector('.title-environment');return image?.complete&&image.naturalWidth>0;});return page;
}
async function close(page){const exited=new Promise(resolve=>child.once('exit',resolve));await page.evaluate(()=>window.close()).catch(()=>{});const result=await Promise.race([exited,new Promise(resolve=>setTimeout(()=>resolve('timeout'),12000))]);assert.notEqual(result,'timeout');await browser.close();child=null;browser=null;}
(async()=>{await fs.mkdir(out,{recursive:true});let page=await launch();const info=await page.evaluate(()=>window.desktopBridge.getPlatformInfo());assert.equal(info.steamAvailable,false);assert.equal(await page.evaluate(()=>typeof require),'undefined');await page.getByRole('combobox',{name:'Language'}).selectOption('ja');await page.locator('.pc-play').click();await page.locator('.quest-next button').click();await page.locator('.message-body>.primary-button').click();await close(page);
 const saved=JSON.parse(await fs.readFile(path.join(profile,'saves/game.json'),'utf8'));assert.equal(saved.accepted,true);
 page=await launch();assert.equal(await page.locator('html').getAttribute('lang'),'ja');await page.locator('.pc-play').click();assert.equal(await page.locator('.pc-window:visible').count(),0);await page.screenshot({path:path.join(out,'packaged-desktop.png'),animations:'disabled'});await close(page);
 const report={exe,profile,packagedQA:true,japanesePreference:true,nativeSaveAndReopen:true,nodeExposed:false};await fs.writeFile(path.join(out,'packaged-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close().catch(()=>{});if(child)child.kill();});
