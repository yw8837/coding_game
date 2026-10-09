'use strict';
// Source runtime smoke with isolated on-disk saves, real IPC and blocked network.
const path=require('node:path'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
const {_electron}=require(process.env.PLAYWRIGHT_PACKAGE || path.join(process.env.USERPROFILE,'.codex/skills/webapp-testing/.venv/Lib/site-packages/playwright/driver/package'));
const root=path.resolve(__dirname,'../..'),out=path.join(root,'output/steam-qa');
const profile=path.join(out,'native-'+Date.now()),save=path.join(profile,'saves/game.json');
let app,page;const errors=[],report={profile};
async function launch(){
 await fs.access(path.join(root,"desktop/renderer/index.html"));
 const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 app=await _electron.launch({executablePath:path.join(root,'desktop/node_modules/electron/dist/electron.exe'),args:[path.join(root,'desktop'),'--qa-user-data='+profile],env,timeout:25000});
 page=await app.firstWindow();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(String(e)));
 await page.waitForFunction(()=>document.querySelector('.pc-play')&&!document.querySelector('.pc-play').disabled);
 return page;
}
async function close(){const stopped=app.waitForEvent('close');await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].close());await stopped;app=null;}
async function read(){return JSON.parse(await fs.readFile(save,'utf8'));}
async function until(fn,value){const end=Date.now()+12000;while(Date.now()<end){try{if(await fn()===value)return;}catch{}await new Promise(r=>setTimeout(r,50));}assert.equal(await fn(),value);}
(async()=>{
 await fs.mkdir(out,{recursive:true});await launch();
 assert.equal(await page.locator('.title-environment').evaluate(el=>el.complete&&el.naturalWidth>0),true);
 const info=await page.evaluate(()=>window.desktopBridge.getPlatformInfo());assert.equal(info.runtime,'desktop');assert.equal(info.steamAvailable,false);report.platform=info;
 const isolation=await page.evaluate(()=>({node:typeof window.require,process:typeof window.process,bridge:Object.keys(window.desktopBridge)}));assert.equal(isolation.node,'undefined');assert.equal(isolation.process,'undefined');report.isolation=isolation;
 assert.equal(await page.evaluate(async()=>{try{await fetch('https://example.com');return false;}catch{return true;}}),true);
 await page.getByRole('combobox',{name:'Language'}).selectOption('ko');await page.locator('.pc-play').click();
 assert.equal(await page.locator('.pc-window:visible').count(),0);
 await page.locator('.pc-language').click();const guided=page.getByTestId('guided-mode-toggle');if(await guided.getAttribute('aria-pressed')==='true')await guided.click();await page.getByRole('button',{name:'설정 닫기',exact:true}).click();
 await page.locator('.pc-shortcuts').getByRole('button',{name:'메시지',exact:true}).click();await page.getByRole('button',{name:'의뢰 수락',exact:true}).click();
 await until(async()=>(await read()).accepted,true);
 const active=()=>page.locator('.pc-window[data-active="true"]');
 const follow=async()=>{const button=page.locator('#mission-sidebar .quest-next button');if(await button.isVisible())await button.click();};
 await follow();
 for(const name of ['프로젝트 복사','준비물 받기','미리보기 켜기'])await active().getByRole('button',{name,exact:true}).click();
 await follow();await active().getByRole('button',{name:'360px',exact:true}).click();await active().getByRole('button',{name:'문제 확인 · 파일 고치기',exact:true}).click();
 for(const [file,answer] of [['index.html','모노 카페'],['style.css','100%']]){await follow();await active().locator('.file-explorer button').filter({has:page.getByText(file,{exact:true})}).click();await active().getByRole('button',{name:'고칠 글자 찾기',exact:true}).click();await page.keyboard.insertText(answer);}
 await active().getByRole('button',{name:'검사 실행',exact:true}).click();
 await until(async()=>!!(await read()).tests?.checks.every(c=>c.passed),true);report.nativeIframeLayoutChecks=true;
 for(let i=0;i<3;i++){await follow();await active().locator('.terminal-form input').press('Enter');}
 await follow();await active().getByRole('button',{name:/PR 만들기/}).click();await active().getByRole('button',{name:'PR 병합',exact:true}).click();await active().getByRole('button',{name:'검토한 버전 배포',exact:true}).click();await until(async()=>(await read()).completed.length,1);

 // Continue chapters two and three through the same visible quest instructions.
 for(let step=0;step<100;step++){
  const state=JSON.parse((await page.evaluate(()=>window.desktopBridge.loadSave())).raw);
  if(state.gameplay.openingCelebrated)break;
  const reward=page.getByRole('button',{name:'이야기 계속하기',exact:true});
  if(await reward.isVisible()){await reward.click();await reward.waitFor({state:'hidden'});continue;}
  const title=await page.locator('#mission-sidebar .quest-next>strong, #mission-sidebar .quest-current strong').innerText();await follow();const w=active();
  if(title.includes('메시지')||title.includes('의뢰 읽고')){const button=w.getByRole('button',{name:'작업 시작하기',exact:true});if(await button.isVisible())await button.click();}
  else if(title.includes('계산대에서')){for(let i=0;i<3;i++)await w.getByRole('button',{name:'수량 늘리기'}).click();await w.getByRole('button',{name:'문제 확인 · 파일 고치기',exact:true}).click();}
  else if(title.includes('app.js에서')||title.includes('server.py에서')){await w.getByRole('button',{name:'고칠 글자 찾기',exact:true}).click();await page.keyboard.insertText(title.includes('app.js')?'*':title.includes('주소')?'/api/menu':'True');}
  else if(title.includes('서버 앱에서'))await w.getByRole('button',{name:'Ubuntu 설치',exact:true}).click();
  else if(title.includes('API 앱에서')){if(title.includes('주문'))await w.getByRole('button',{name:'POST 주문 보내기'}).click();await w.getByRole('button',{name:'전송',exact:true}).click();}
  else if(title.includes('검사하기')){await w.getByRole('button',{name:'검사 실행',exact:true}).click();await until(async()=>!!(await read()).tests?.checks.every(c=>c.passed),true);}
  else if(title.includes('검토 요청'))await w.getByRole('button',{name:/PR 만들기/}).click();
  else if(title.includes('수정본 확정'))await w.getByRole('button',{name:'PR 병합',exact:true}).click();
  else if(title.includes('수정본 전달'))await w.getByRole('button',{name:'검토한 버전 배포',exact:true}).click();
  else if(title.includes('OPEN'))await w.getByRole('button',{name:/OPEN/}).click();
  else if(await w.locator('.terminal-form input').isVisible())await w.locator('.terminal-form input').press('Enter');
  else throw Error('Unhandled native task: '+title);
 }
 await until(async()=>(await read()).gameplay.openingCelebrated,true);report.nativeCafeUI=3;
 await follow();await active().locator('.pc-window-buttons button').nth(3).click();
 const jobs=await active().locator('[data-testid^=career-job-]').evaluateAll(elements=>elements.map(el=>el.dataset.testid));
 for(let index=0;index<jobs.length;index++){
  const w=active();await w.getByTestId(jobs[index]).click();await w.getByTestId('career-accept').click();await w.getByTestId('career-inspect').click();assert.equal(await w.getByTestId('career-code-mode').getAttribute('aria-pressed'),'true','Direct Work must start in full code');await w.locator('.career-answer>button').click();
  const answers=await w.locator('.career-answer>div>div').evaluateAll(elements=>elements.map(el=>[el.querySelector('strong').textContent,el.querySelector('pre').textContent]));
  for(const [filename,source] of answers){await w.locator('.career-file-tabs button').filter({has:page.getByText(filename,{exact:true})}).click();await w.locator('.career-code-input textarea').fill(source);}
  await w.locator('.career-answer>button').click();await w.getByTestId('career-test').click();await w.getByTestId('career-reply-'+(index%2===0?'care':'craft')).check();await w.getByTestId('career-deliver').click();await until(async()=>(await read()).gameplay.career.completed.length,index+1);
 }
 await active().getByTestId('career-final-project').click();
 const release=active();await release.getByTestId('release-start').click();assert.equal(await release.getByTestId('release-code-mode').getAttribute('aria-pressed'),'true','Direct Work must start release in full code');await release.getByTestId('release-example-toggle').click();
 const releaseAnswers=await release.locator('.release-examples>div').evaluateAll(elements=>elements.map(el=>[el.querySelector('strong').textContent,el.querySelector('pre').textContent]));assert.equal(releaseAnswers.length,3);
 for(const [filename,source] of releaseAnswers){await release.locator('.release-files .career-file-tabs button').filter({has:page.getByText(filename,{exact:true})}).click();await release.locator('.release-code textarea').fill(source);}
 await release.getByTestId('release-example-toggle').click();await release.getByTestId('release-test').click();await until(async()=>(await read()).gameplay.career.release.proof.passed,true);
 await release.getByTestId('release-build').click();await release.getByTestId('release-publish').click();await until(async()=>!!(await read()).gameplay.career.release.published,true);await release.getByTestId('release-letter').click();
 await active().getByTestId('career-ending').click();await until(async()=>(await read()).gameplay.career.ending,'balanced');report.nativeCareerUI=18;report.nativeFinalRelease=true;
 await page.locator('.pc-start-button').click();await page.locator('.pc-start-apps').getByRole('button',{name:'연습 의뢰',exact:true}).click();await page.getByTestId('code-lab-tab').click();
 await page.getByTestId('lab-source').locator('textarea').fill('function solve(input) { return input.price * input.quantity; }');await page.getByTestId('lab-run').click();
 await until(async()=>(await read()).gameplay.lab.completed.includes('receipt'),true);report.nativeCodeLab=true;
 await page.screenshot({animations:'disabled',path:path.join(out,'native-lab.png')});
 await page.getByTestId('lab-terminal-workspace').locator('xpath=ancestor::details').locator('summary').first().click();await page.getByTestId('lab-terminal-workspace').click();
 async function command(text){const input=page.locator('.pc-window[data-active=true] .terminal-form input');await input.fill(text);await input.press('Enter');await until(async()=>(await read()).history.at(-1)?.command,text);return (await read()).history.at(-1);}
 const labCredits=(await read()).credits;
 assert.equal((await command('cd /home/dev/code-lab')).error,false);assert.equal((await command('node --test receipt.test.cjs')).error,false);
 assert.equal((await command('code receipt.input.json')).error,false);await page.getByTestId('virtual-file-source').locator('textarea').fill('{"price":3,"quantity":4}');await page.getByTestId('virtual-file-terminal').click();
 assert.equal((await command('node run.cjs receipt.js receipt.input.json')).output,'12');assert.equal((await read()).credits,labCredits);
 await page.getByTestId('taskbar-clock').click();await page.getByTestId('calendar-next').click();await page.keyboard.press('Escape');assert.equal(await page.getByTestId('desktop-calendar').count(),0);
 report.nativeTerminalFiles=true;report.nativeCalendar=true;await close();

 const first=await read();assert.equal(first.gameplay.lab.proofs.receipt.passed,true);assert.equal(first.accepted,true);assert.equal(first.gameplay.career.completed.length,18);report.closeSave=true;
 await launch();assert.equal(await page.locator('html').getAttribute('lang'),'ko');await page.locator('.pc-play').click();
 await page.locator('.pc-shortcuts').getByRole('button',{name:'터미널',exact:true}).click();await command('code /home/dev/code-lab/receipt.js');await page.getByTestId('virtual-file-editor').waitFor({state:'visible'});
 // Import an actually UI-earned save from the browser edition through Settings.
 await page.locator('.pc-language').click();await page.locator('.save-tools input[type=file]').setInputFiles(path.join(out,'completed-career-save.json'));
 await page.getByRole('button',{name:'이 저장으로 이어하기',exact:true}).click();await until(async()=>(await read()).gameplay.career.ending,'balanced');
 await page.locator('.pc-play').click();await page.locator('.pc-shortcuts').getByRole('button',{name:'에디터',exact:true}).click();assert.equal(await page.getByTestId('virtual-file-editor').count(),0);report.importClearsEditorTarget=true;await page.locator('.quest-next button').click();await page.locator('.career-conclusion').waitFor({state:'visible'});
 await page.screenshot({animations:'disabled',path:path.join(out,'native-ending.png')});
 await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},path.join(profile,'exported.json'));
 await page.locator('.pc-language').click();await page.getByRole('button',{name:'백업 내보내기',exact:true}).click();
 await until(async()=>JSON.parse(await fs.readFile(path.join(profile,'exported.json'),'utf8')).gameplay.career.ending,'balanced');report.nativeExport=true;await page.getByRole('combobox',{name:'Language'}).selectOption('en');await app.evaluate(({dialog})=>{dialog.showSaveDialog=async(_window,options)=>{globalThis.qaExportTitle=options.title;return {canceled:true};};});await page.getByRole('button',{name:'Export backup',exact:true}).click();await until(async()=>await app.evaluate(()=>globalThis.qaExportTitle),'Export CODE:SHIFT progress backup');report.manualNativeDialogLanguage=true;await page.getByRole('combobox',{name:'Language'}).selectOption('ko');
 await close();report.importAndEnding=true;
 // Corrupt primary after an orderly close; backup must restore real progress.
 await fs.writeFile(save,'{corrupt');await launch();await page.locator('.pc-play').click();await page.locator('.quest-next button').click();await page.locator('.career-conclusion').waitFor({state:'visible'});await close();
 assert.equal((await read()).gameplay.career.ending,'balanced');report.corruptPrimaryRecovered=true;
 assert.deepEqual(errors,[]);report.errors=errors;
 await fs.writeFile(path.join(out,'native-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(async error=>{if(page&&!page.isClosed())await page.screenshot({animations:'disabled',path:path.join(out,'native-failure.png')}).catch(()=>{});console.error(error);process.exitCode=1;}).finally(async()=>{if(app)await app.close();});
