'use strict';
// Seed a valid completed route, then exercise new behavior through the real native UI/IPC.
const path=require('node:path'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {_electron,chromium}=require(process.env.PLAYWRIGHT_PACKAGE||path.join(process.env.USERPROFILE,'.codex/skills/webapp-testing/.venv/Lib/site-packages/playwright/driver/package'));
const root=path.resolve(__dirname,'../..'),out=path.join(root,'output/full-version-quality');
const profile=path.join(out,'studio-native-'+Date.now()),save=path.join(profile,'saves/game.json');
let app,page,browser;const errors=[],report={profile,errors};
const moduleAt=file=>import(pathToFileURL(path.join(root,'lib/game',file)).href);
async function until(fn,value){const deadline=Date.now()+12000;while(Date.now()<deadline){try{if(await fn()===value)return;}catch{}await new Promise(r=>setTimeout(r,50));}assert.equal(await fn(),value);}
async function read(){return JSON.parse(await fs.readFile(save,'utf8'));}
async function launch(){
 const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 app=await _electron.launch({executablePath:path.join(root,'desktop/node_modules/electron/dist/electron.exe'),args:[path.join(root,'desktop'),'--qa-user-data='+profile],env,timeout:25000});
 page=await app.firstWindow();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(String(e)));
 await page.waitForFunction(()=>document.querySelector('[data-testid="title-continue"]')&&!document.querySelector('[data-testid="title-continue"]').disabled);
}
async function close(){const stopped=app.waitForEvent('close');await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].close());await stopped;app=null;}
async function language(lang){await page.locator('.pc-tray-settings').click();await page.getByRole('combobox',{name:'Language'}).selectOption(lang);await page.keyboard.press('Escape');}
async function openStudio(){
 await page.locator('.pc-shortcuts').getByRole('button',{name:'Contracts',exact:true}).click();
 await page.getByTestId('career-release-button').click();await page.getByTestId('release-open-studio').click();
}
(async()=>{
 await fs.mkdir(path.dirname(save),{recursive:true});
 await fs.writeFile(path.join(profile,'.codeshift-qa-profile'),'CODE:SHIFT isolated QA profile\n');
 const {act,createGame}=await moduleAt('engine.ts'),{CAREER_JOBS}=await moduleAt('career-content.ts');
 const {exampleSolution}=await moduleAt('career-evaluation.ts'),{RELEASE_EXAMPLE,releaseFiles}=await moduleAt('release.ts'),{readSave}=await moduleAt('save.ts');
 let state=createGame();state.completed=[0,1,2];state.mission=2;state=act(state,{type:'celebrate-opening'});
 for(const district of [1,2,3])for(const job of CAREER_JOBS.filter(j=>j.act===district).slice(0,4)){
  state=act(state,{type:'career-accept',id:job.id});state=act(state,{type:'career-inspect',id:job.id});
  for(const [file,content] of Object.entries(exampleSolution(job.id)))state=act(state,{type:'career-edit',id:job.id,file,content});
  state=act(state,{type:'career-test',id:job.id});state=act(state,{type:'career-deliver',id:job.id,choice:'care'});
 }
 state=act(state,{type:'career-release-start'});for(const [file,content] of Object.entries(RELEASE_EXAMPLE))state=act(state,{type:'career-release-edit',file,content});
 for(const type of ['career-release-test','career-release-build','career-release-publish','career-ending'])state=act(state,{type});
 readSave(JSON.stringify(state));await fs.writeFile(save,JSON.stringify(state));
 const released=releaseFiles(state),original={credits:state.credits,xp:state.xp,ending:state.gameplay.career.ending,endingJobs:state.gameplay.career.endingJobs};
 await launch();await page.getByTestId('title-settings').click();await page.getByRole('combobox',{name:'Language'}).selectOption('en');await page.keyboard.press('Escape');await page.getByTestId('title-continue').click();await openStudio();
 await page.getByTestId('studio-start').click();await until(async()=>!!(await read()).gameplay.career.studio,true);
 assert.equal(await page.getByTestId('studio-help').count(),0);
 await page.evaluate(()=>{globalThis.__saveStates=[];const el=document.querySelector('[data-testid="save-status"]');new MutationObserver(()=>globalThis.__saveStates.push(el.dataset.state)).observe(el,{attributes:true,attributeFilter:['data-state']});});
 const editor=page.getByTestId('studio-editor').locator('textarea');await editor.fill('<h1>My next neighborhood app</h1>\n');
 assert.equal(await page.getByTestId('studio-export').isDisabled(),true);
 await page.getByTestId('studio-test').click();await page.getByTestId('studio-snapshot').click();
 await until(async()=>(await read()).gameplay.career.studio.snapshots.length,1);
 await editor.fill('<h1>Unfinished draft</h1>\n');await page.getByTestId('studio-restore-1').click();await page.waitForFunction(()=>document.activeElement?.getAttribute('data-testid')==='studio-restore-cancel');await page.keyboard.press('Shift+Tab');assert.equal(await page.getByTestId('studio-restore-confirm').evaluate(el=>el===document.activeElement),true);await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement?.getAttribute('data-testid')==='studio-restore-1');assert.match(await editor.inputValue(),/Unfinished draft/);
 await page.getByTestId('studio-restore-1').click();await page.getByTestId('studio-restore-confirm').click();assert.match(await editor.inputValue(),/My next neighborhood app/);
 assert.equal(await page.getByTestId('studio-export').isDisabled(),true);await page.getByTestId('studio-test').click();
 await app.evaluate(({dialog})=>{dialog.showSaveDialog=async()=>({canceled:true});});await page.getByTestId('studio-export').click();await page.getByTestId('studio-export-status').filter({hasText:'canceled'}).waitFor();
 await page.waitForFunction(()=>document.querySelector('[data-testid="save-status"]').dataset.state==='saved');
 const saveStates=await page.evaluate(()=>globalThis.__saveStates);assert.ok(saveStates.includes('saving'));assert.ok(saveStates.includes('saved'));report.pendingSaveFeedback=true;
 report.restoreCancelAndFreshness=true;report.nativeExportCancel=true;
 // A real main-process write with a deterministic QA save-dialog result.
 const exported=[];
 for(const lang of ['en','ko','ja']){
  await language(lang);const destination=path.join(out,'exported-app-'+lang+'.html');
  await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},destination);
  await page.getByTestId('studio-export').click();await until(async()=>{try{return (await fs.stat(destination)).size>1000;}catch{return false;}},true);
  exported.push({lang,destination});
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1100,820));
  await page.getByTestId('studio-preview-title').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'studio-'+lang+'.png')});
  report.studioViewports??=[];
  for(const size of [[960,640],[1600,900]]){
   const actual=await app.evaluate(({BrowserWindow},size)=>{const w=BrowserWindow.getAllWindows()[0];w.setSize(...size);return w.getSize();},size);
   const backdrop=page.locator('.pc-quest-backdrop');if(await backdrop.isVisible())await backdrop.click();
   await page.getByTestId('studio-test').scrollIntoViewIfNeeded();
   assert.equal(await page.locator('.studio-grid').evaluate(el=>Array.from(el.children).every(child=>child.getBoundingClientRect().width<=el.getBoundingClientRect().width+1)),true);
   await page.screenshot({path:path.join(out,'studio-'+lang+'-'+size[0]+'.png')});report.studioViewports.push({lang,requested:size,actual,viewport:await page.evaluate(()=>[innerWidth,innerHeight])});
  }
 }
 await language('en');await close();const after=readSave(JSON.stringify(await read()));
 assert.deepEqual(releaseFiles(after),released);assert.deepEqual({credits:after.credits,xp:after.xp,ending:after.gameplay.career.ending,endingJobs:after.gameplay.career.endingJobs},original);
 assert.equal(after.gameplay.career.completed.length,12);report.sixOptionalJobsRemain=true;report.firstReleaseAndRewardsUnchanged=true;
 await launch();await page.getByTestId('title-continue').click();await openStudio();assert.match(await page.getByTestId('studio-editor').locator('textarea').inputValue(),/My next neighborhood app/);report.nativeRelaunchRestoresDraft=true;
 await close();
 // Open native-exported files in an isolated real browser, outside the game.
 browser=await chromium.launch({channel:'chrome',headless:true});
 for(const {lang,destination} of exported){
  const context=await browser.newContext({locale:lang,viewport:{width:960,height:720}}),p=await context.newPage();p.on('pageerror',e=>errors.push(String(e)));let external=0;p.on('request',r=>{if(/^https?:/.test(r.url()))external++;});
  await p.goto(pathToFileURL(destination).href);assert.equal(await p.locator('html').getAttribute('lang'),lang);assert.equal(await p.locator('#items>li').count(),2);
  await p.locator('#search').fill('Bakery');assert.equal(await p.locator('#items>li').count(),1);await p.locator('#search').fill('nothing-matches');assert.equal(await p.locator('#empty').isVisible(),true);await p.locator('#search').fill('');
  await p.locator('#message').fill('A real local enquiry ☕');await p.locator('#inquiry button').click();assert.equal(await p.locator('#requests>li').count(),1);await p.reload();assert.equal(await p.locator('#requests>li').count(),1);
  const hostile='</script><img src="https://invalid.example/probe" onerror="window.__injected=1">';
  await p.locator('#message').fill(hostile);await p.locator('#inquiry button').click();assert.equal(await p.locator('#requests>li').first().textContent().then(v=>v.includes(hostile)),true);assert.equal(await p.locator('#requests img').count(),0);assert.equal(await p.evaluate(()=>globalThis.__injected),undefined);
  await p.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Quota','QuotaExceededError');};});
  await p.locator('#message').fill('This must not claim saved');await p.locator('#inquiry button').click();assert.equal(await p.locator('#requests>li').count(),2);assert.equal(await p.locator('#status').textContent(),await p.evaluate(()=>JSON.parse(document.querySelector('#app-data').textContent).words.unavailable));
  await p.reload();await p.evaluate(()=>{const data=JSON.parse(document.querySelector('#app-data').textContent);localStorage.setItem(data.storageKey,'{"bad":true}');});await p.reload();assert.equal(await p.locator('#requests>li').count(),0);assert.equal(await p.locator('#status').textContent(),await p.evaluate(()=>JSON.parse(document.querySelector('#app-data').textContent).words.corrupt));
  await p.locator('#message').fill('Do not overwrite corrupt data');await p.locator('#inquiry button').click();assert.equal(await p.evaluate(()=>localStorage.getItem(JSON.parse(document.querySelector('#app-data').textContent).storageKey)),'{"bad":true}');
  await p.setViewportSize({width:360,height:740});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(external,0);
  await p.screenshot({path:path.join(out,'portable-app-'+lang+'.png')});await context.close();
 }
 await browser.close();browser=null;report.portableAppLocales=['en','ko','ja'];report.exportSearchAndLocalPersistence=true;report.inertMarkupStorageQuotaAndCorruption=true;assert.deepEqual(errors,[]);report.passed=true;
 await fs.writeFile(path.join(out,'studio-native-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(async error=>{report.error=String(error);console.error(error);process.exitCode=1;if(page&&!page.isClosed())await page.screenshot({path:path.join(out,'studio-failure.png')}).catch(()=>{});await fs.writeFile(path.join(out,'studio-native-report.json'),JSON.stringify(report,null,2));}).finally(async()=>{if(browser)await browser.close().catch(()=>{});if(app){await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(w=>w.destroy())).catch(()=>{});await app.close().catch(()=>{});}});
