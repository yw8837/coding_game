'use strict';
// Isolated source Electron UI evidence. Fixtures use the real engine; checks and navigation use UI actions.
const path=require('node:path'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {_electron}=require(process.env.PLAYWRIGHT_PACKAGE||path.join(process.env.USERPROFILE,'.codex/skills/webapp-testing/.venv/Lib/site-packages/playwright/driver/package'));
const root=path.resolve(__dirname,'../..'),out=path.join(root,'output/full-version-quality');
const profile=path.join(out,'career-feedback-native-'+Date.now()),save=path.join(profile,'saves/game.json');
const errors=[],report={profile,startedAt:new Date().toISOString(),passed:false,errors,locales:[],screenshots:[]};
let app,page;
const moduleAt=file=>import(pathToFileURL(path.join(root,'lib/game',file)).href);
const diagnostic=()=>page.getByTestId('career-diagnostic');
const active=()=>page.locator('.pc-window[data-active="true"]');

async function until(fn,value){
 const deadline=Date.now()+15000;
 while(Date.now()<deadline){try{if(await fn()===value)return;}catch{}await new Promise(resolve=>setTimeout(resolve,50));}
 assert.equal(await fn(),value);
}
async function read(){return JSON.parse(await fs.readFile(save,'utf8'));}
async function launch(){
 await fs.access(path.join(root,'desktop/renderer/index.html'));
 const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 app=await _electron.launch({executablePath:path.join(root,'desktop/node_modules/electron/dist/electron.exe'),args:[path.join(root,'desktop'),'--qa-user-data='+profile],env,timeout:25000});
 page=await app.firstWindow();page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(String(error.stack||error)));
 await page.getByTestId('title-continue').waitFor({state:'visible'});
 await until(()=>page.getByTestId('title-continue').isEnabled(),true);
}
async function close(){
 const stopped=app.waitForEvent('close');await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].close());await stopped;app=null;
}
async function language(lang){
 await page.locator('.pc-tray-settings').click();await page.getByRole('combobox',{name:'Language',exact:true}).selectOption(lang);await page.keyboard.press('Escape');
 await until(()=>page.locator('html').getAttribute('lang'),lang);
}
async function openCareer(lang){
 await page.locator('.pc-shortcuts').getByRole('button',{name:{en:'Contracts',ko:'의뢰 센터',ja:'依頼センター'}[lang],exact:true}).click();
 await page.locator('.career-app').waitFor({state:'visible'});
 if(!(await active().getAttribute('class')).includes('arranged'))await active().getByRole('button',{name:/Maximize or restore window|창 최대화 또는 복원|ウィンドウを最大化または復元/}).click();
}
async function nav(testid){
 const backdrop=page.locator('.pc-quest-backdrop');if(await backdrop.isVisible())await backdrop.click();
 const button=page.getByTestId(testid);
 if(!await button.isVisible()){await page.locator('.career-list-toggle').click();await button.waitFor({state:'visible'});}
 await button.click();
}
async function keyboardActivate(locator){await locator.focus();assert.equal(await locator.evaluate(element=>document.activeElement===element),true);await page.keyboard.press('Enter');}
async function hintsClosed(){
 assert.equal(await page.locator('.career-answer>button').getAttribute('aria-expanded'),'false');
 assert.equal(await page.locator('.career-answer>div').count(),0);
 assert.equal(await page.locator('.career-help-section p').count(),0);
 assert.equal(await page.locator('.career-hint-buttons button[aria-pressed="true"]').count(),0);
 assert.equal(await page.locator('.career-code-hint').count(),0);
 if(await page.getByTestId('career-code-help').count())assert.equal(await page.getByTestId('career-code-help').getAttribute('aria-expanded'),'false');
}
async function screenshot(name){
 const destination=path.join(out,name);await page.screenshot({path:destination,animations:'disabled'});report.screenshots.push(destination);
}
async function assertDiagnostic(evaluation,lang){
 const passed=evaluation.checks.filter(check=>check.passed).length,first=evaluation.checks.find(check=>!check.passed);
 await until(()=>diagnostic().getAttribute('data-status'),'checked');
 assert.match(await page.getByTestId('career-check-count').innerText(),new RegExp('^'+passed+' / '+evaluation.checks.length+'(?:\\s|$)'));
 if(first){
  assert.ok((await page.getByTestId('career-first-failure').innerText()).includes(first.name[lang]));
  assert.equal(await page.getByTestId('career-failure-expected').innerText(),first.expected);
  assert.equal(await page.getByTestId('career-failure-actual').innerText(),first.actual);
 }else assert.equal(await page.getByTestId('career-first-failure').count(),0);
 return {passed,total:evaluation.checks.length,first:first?{name:first.name[lang],expected:first.expected,actual:first.actual}:null};
}
async function assertNoHorizontalOverflow(locator){
 const dimensions=await locator.evaluate(element=>({scroll:element.scrollWidth,client:element.clientWidth}));
 assert.ok(dimensions.scroll<=dimensions.client,JSON.stringify(dimensions));return dimensions;
}

(async()=>{
 await fs.mkdir(path.dirname(save),{recursive:true});
 await fs.writeFile(path.join(profile,'.codeshift-qa-profile'),'CODE:SHIFT isolated QA profile\n');
 const {act,createGame}=await moduleAt('engine.ts'),{CAREER_JOBS}=await moduleAt('career-content.ts');
 const {evaluateCareer,exampleSolution}=await moduleAt('career-evaluation.ts'),{careerFiles,careerHash,careerUnlocked}=await moduleAt('career.ts'),{readSave}=await moduleAt('save.ts');
 let fixture=createGame();fixture.completed=[0,1,2];fixture.mission=2;fixture=act(fixture,{type:'celebrate-opening'});
 const receipts=[['library-loans','care'],['florist-stock','craft'],['bike-hours','care'],['clinic-form','craft'],['school-sort','care']];
 for(const [id,choice] of receipts){
  fixture=act(fixture,{type:'career-accept',id});fixture=act(fixture,{type:'career-inspect',id});
  for(const [file,content] of Object.entries(exampleSolution(id)))fixture=act(fixture,{type:'career-edit',id,file,content});
  fixture=act(fixture,{type:'career-test',id});fixture=act(fixture,{type:'career-deliver',id,choice});
 }
 fixture=act(fixture,{type:'career-accept',id:'bakery-price'});fixture=act(fixture,{type:'career-inspect',id:'bakery-price'});
 fixture=readSave(JSON.stringify(fixture));assert.equal(fixture.gameplay.career.completed.length,receipts.length);await fs.writeFile(save,JSON.stringify(fixture));
 const original={credits:fixture.credits,xp:fixture.xp,completed:fixture.gameplay.career.completed,choices:fixture.gameplay.career.choices};
 const available=CAREER_JOBS.filter(job=>careerUnlocked(fixture,job)&&!original.completed.includes(job.id));
 report.fixture={completed:original.completed,available:available.map(job=>job.id),active:'bakery-price',validatedBy:'readSave'};

 await launch();await page.getByTestId('title-settings').click();await page.getByRole('combobox',{name:'Language',exact:true}).selectOption('en');await page.keyboard.press('Escape');
 await page.getByTestId('title-continue').click();await openCareer('en');await nav('career-job-bakery-price');
 assert.equal(await diagnostic().getAttribute('data-status'),'unchecked');await hintsClosed();
 await page.getByTestId('career-test').click();
 await until(async()=>!!(await read()).gameplay.career.proofs['bakery-price'],true);
 let current=await read(),evaluation=evaluateCareer('bakery-price',careerFiles(current,'bakery-price'));
 assert.ok(evaluation.checks.some(check=>check.passed));assert.ok(evaluation.checks.some(check=>!check.passed));
 report.partialConfig=await assertDiagnostic(evaluation,'en');assert.ok((await page.getByTestId('career-failure-source').innerText()).includes('pricing.json'));
 await hintsClosed();await keyboardActivate(page.getByTestId('career-failure-open-file'));
 const configEditor=page.locator('.career-editor textarea');await configEditor.waitFor({state:'visible'});
 await until(()=>configEditor.evaluate(element=>document.activeElement===element),true);
 assert.equal(await configEditor.inputValue(),careerFiles(current,'bakery-price')['pricing.json']);
 assert.equal(await page.locator('.career-file-tabs button[aria-pressed="true"]').innerText(),'pricing.json');
 report.configFileKeyboardFocus=true;await hintsClosed();await screenshot('career-feedback-config-en.png');
 await page.getByTestId('career-diagnostic-checks').click();assert.equal(await page.locator('.career-checks tbody tr').count(),evaluation.checks.length);report.existingCheckTableAccessible=true;
 await page.getByTestId('career-failure-open-file').click();await page.getByTestId('career-use-javascript').click();
 const jsEditor=page.getByTestId('career-js-editor').locator('textarea');await jsEditor.waitFor({state:'visible'});
 const passingSource='function solve(input) {\n  return Math.floor(input.quantity / 6) * 10000 + input.quantity % 6 * 1800;\n}\n';
 await jsEditor.fill(passingSource);await page.getByTestId('career-code-save').click();
 await until(async()=>careerFiles(await read(),'bakery-price')['solution.js'],passingSource);
 await page.getByTestId('career-code-test').click();await until(async()=>!!(await read()).gameplay.career.proofs['bakery-price']?.passed,true);
 current=await read();evaluation=evaluateCareer('bakery-price',careerFiles(current,'bakery-price'));assert.equal(evaluation.passed,true);report.savedJavaScriptPass=await assertDiagnostic(evaluation,'en');
 await page.getByRole('tab',{name:'Files',exact:true}).click();
 await jsEditor.fill('function solve(input) {\n  return 0;\n}\n');
 await until(()=>diagnostic().getAttribute('data-status'),'draft');
 assert.doesNotMatch(await page.getByTestId('career-check-count').innerText(),/\d+\s*\/\s*\d+/);
 assert.equal(await page.getByTestId('career-test').isDisabled(),true);assert.equal(await page.getByTestId('career-code-test').isDisabled(),true);
 assert.equal(await page.getByTestId('career-deliver').count(),0);assert.equal(await page.getByTestId('career-first-failure').count(),0);
 assert.equal(await page.locator('[data-testid="progress-moment"][data-tier="check"]').count(),0,'Editing a draft must immediately clear the earlier check-success notification');
 assert.equal(careerFiles(await read(),'bakery-price')['solution.js'],passingSource);await hintsClosed();report.unsavedDraftHidesPreviousPass=true;
 await diagnostic().scrollIntoViewIfNeeded();await screenshot('career-feedback-unsaved-en.png');
 const errorSource='function solve(input) {\n  return input.quantity + ;\n}\n';
 await jsEditor.fill(errorSource);await page.getByTestId('career-code-save').click();await until(async()=>careerFiles(await read(),'bakery-price')['solution.js'],errorSource);
 await page.getByTestId('career-code-test').click();await until(async()=>(await read()).gameplay.career.proofs['bakery-price']?.hash,careerHash(careerFiles(await read(),'bakery-price')));
 current=await read();evaluation=evaluateCareer('bakery-price',careerFiles(current,'bakery-price'));
 report.syntaxFailure=await assertDiagnostic(evaluation,'en');assert.equal(await page.locator('[data-testid="progress-moment"][data-tier="check"]').count(),0,'A failed check must not retain an earlier success notification');report.staleCheckFeedbackCleared=true;assert.match(await page.getByTestId('career-failure-source').innerText(),/solution\.js.*line 2/);
 await keyboardActivate(page.getByTestId('career-failure-open-file'));await until(()=>jsEditor.evaluate(element=>document.activeElement===element),true);
 assert.equal(await jsEditor.evaluate(element=>element.selectionStart),errorSource.indexOf('\n')+1);report.actualJavaScriptLineKeyboardFocus=true;await hintsClosed();

 for(const lang of ['ko','en','ja']){
  await language(lang);
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(960,640));
  await page.waitForFunction(()=>innerWidth<1000);
  const nativeSize=await app.evaluate(({BrowserWindow})=>{const window=BrowserWindow.getAllWindows()[0];return {requested:[960,640],size:window.getSize(),minimum:window.getMinimumSize(),content:window.getContentSize()};});
  // Windows can round native frame dimensions; retain actual measurements instead of claiming exact outer pixels.
  assert.deepEqual(nativeSize.requested,nativeSize.minimum);assert.deepEqual(nativeSize.minimum,[960,640]);
  assert.ok(nativeSize.size[0]>=nativeSize.minimum[0]&&nativeSize.size[1]>=nativeSize.minimum[1]);
  nativeSize.viewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight,devicePixelRatio}));
  const backdrop=page.locator('.pc-quest-backdrop');if(await backdrop.isVisible())await backdrop.click();
  const proof=await assertDiagnostic(evaluation,lang);await hintsClosed();await diagnostic().scrollIntoViewIfNeeded();
  const feedbackLayout=await assertNoHorizontalOverflow(diagnostic());await screenshot('career-feedback-'+lang+'-minimum.png');
  await nav('career-portfolio-button');await page.getByTestId('career-portfolio').waitFor({state:'visible'});
  assert.equal(await page.getByTestId('career-portfolio-count').innerText(),receipts.length+' / '+CAREER_JOBS.length);
  assert.equal(await page.locator('[data-testid^="career-portfolio-entry-"]').count(),receipts.length);
  assert.equal(await page.locator('[data-testid^="career-portfolio-next-"]').count(),available.length);
  for(const [id,choice] of receipts){
   const job=CAREER_JOBS.find(item=>item.id===id),reply=job.choices.find(item=>item.id===choice);
   assert.equal(await page.getByTestId('career-portfolio-reply-'+id).locator('p').first().innerText(),reply.reply[lang]);
   assert.equal(await page.getByTestId('career-portfolio-changed-'+id).count(),0);
   assert.equal(await page.getByTestId('career-portfolio-entry-'+id).locator('.career-portfolio-received').innerText(),{ko:'이미 받은 보상',en:'Already received',ja:'受取済み'}[lang]+'\n'+job.credits+' cr · '+job.xp+' XP');
  }
  const schoolOutput=page.getByTestId('career-portfolio-output-school-sort');assert.equal(await schoolOutput.getAttribute('open'),'');
  const rank1=schoolOutput.locator('dl>div').filter({has:page.getByText({ko:'순위 1',en:'Rank 1',ja:'順位1'}[lang],{exact:true})});
  assert.equal(await rank1.locator('code').nth(0).innerText(),'Ari');assert.equal(await rank1.locator('code').nth(1).innerText(),'Mina');
  const portfolioLayout=await assertNoHorizontalOverflow(page.getByTestId('career-portfolio'));await page.getByTestId('career-portfolio').scrollIntoViewIfNeeded();await screenshot('career-portfolio-'+lang+'-minimum.png');
  await keyboardActivate(page.getByTestId('career-portfolio-file-school-sort-scores.csv'));
  const deliveredFile=page.locator('.career-readonly');await deliveredFile.waitFor({state:'visible'});await until(()=>deliveredFile.evaluate(element=>document.activeElement===element),true);
  assert.equal(await deliveredFile.textContent(),careerFiles(await read(),'school-sort')['scores.csv']);
  await nav('career-portfolio-button');await keyboardActivate(page.getByTestId('career-portfolio-next-contacts-clean'));
  await page.getByTestId('career-accept').waitFor({state:'visible'});assert.equal(await page.getByTestId('career-accept').isEnabled(),true);
  assert.equal((await read()).gameplay.career.accepted.includes('contacts-clean'),false);
  await nav('career-job-bakery-price');await assertDiagnostic(evaluation,lang);await hintsClosed();
  report.locales.push({language:lang,nativeSize,proof,feedbackLayout,portfolioLayout,clientReactionsVerified:receipts.length,keyboardReadonlyFile:true,unfinishedJobReachable:true});
 }
 current=readSave(JSON.stringify(await read()));
 assert.deepEqual({credits:current.credits,xp:current.xp,completed:current.gameplay.career.completed,choices:current.gameplay.career.choices},original);report.navigationAndRetriesDoNotPay=true;
 await close();await launch();await page.getByTestId('title-continue').click();await openCareer('ja');await nav('career-portfolio-button');
 assert.equal(await page.getByTestId('career-portfolio-count').innerText(),receipts.length+' / '+CAREER_JOBS.length);
 assert.equal(await page.getByTestId('career-portfolio-reply-school-sort').locator('p').first().innerText(),CAREER_JOBS.find(job=>job.id==='school-sort').choices.find(choice=>choice.id==='care').reply.ja);
 await page.getByTestId('career-portfolio').scrollIntoViewIfNeeded();await screenshot('career-portfolio-ja-relaunch.png');report.nativeRelaunchPreservesPortfolio=true;
 await close();assert.deepEqual(errors,[]);report.finishedAt=new Date().toISOString();report.passed=true;
 await fs.writeFile(path.join(out,'career-feedback-native-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(async error=>{
 report.error=String(error.stack||error);report.finishedAt=new Date().toISOString();console.error(error);process.exitCode=1;
 if(page&&!page.isClosed()){
  await screenshot('career-feedback-native-failure.png').catch(()=>{});
  report.failureUI=await page.evaluate(()=>({language:document.documentElement.lang,activeElement:document.activeElement?.outerHTML.slice(0,2000),diagnostic:document.querySelector('[data-testid="career-diagnostic"]')?.textContent,portfolio:document.querySelector('[data-testid="career-portfolio"]')?.textContent})).catch(()=>null);
 }
 await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'career-feedback-native-report.json'),JSON.stringify(report,null,2));
}).finally(async()=>{
 if(app){await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(window=>window.destroy())).catch(()=>{});await app.close().catch(()=>{});}
});
