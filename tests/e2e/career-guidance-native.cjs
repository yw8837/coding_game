'use strict';
const path=require('node:path'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {_electron}=require(process.env.PLAYWRIGHT_PACKAGE||path.join(process.env.USERPROFILE,'.codex/skills/webapp-testing/.venv/Lib/site-packages/playwright/driver/package'));
const root=path.resolve(__dirname,'../..'),out=path.join(root,'output/full-version-quality');
const tag=process.env.CODESHIFT_GUIDANCE_QA_TAG||'final',profile=path.join(out,'career-guidance-'+Date.now()),save=path.join(profile,'saves/game.json');
const report={startedAt:new Date().toISOString(),profile,passed:false,checks:[],errors:[]};
let app,page;
const moduleAt=file=>import(pathToFileURL(path.join(root,'lib/game',file)).href);
async function until(read,expected){const end=Date.now()+10000;while(Date.now()<end){try{if(await read()===expected)return;}catch{}await new Promise(resolve=>setTimeout(resolve,50));}assert.equal(await read(),expected);}
async function check(name,action){try{await action();report.checks.push({name,passed:true});}catch(error){report.checks.push({name,passed:false,error:String(error.stack||error)});}}
async function nav(id){
 const backdrop=page.locator('.pc-quest-backdrop');if(await backdrop.isVisible())await backdrop.click();
 const target=page.getByTestId('career-job-'+id);
 if(!await target.isVisible()){await page.locator('.career-list-toggle').click();await target.waitFor({state:'visible'});}
 await target.click();await page.getByTestId('career-learning').waitFor({state:'visible'});
}
(async()=>{
 const {createGame,act}=await moduleAt('engine.ts'),{careerFiles}=await moduleAt('career.ts');
 const {exampleSolution}=await moduleAt('career-evaluation.ts'),{CAREER_JOBS}=await moduleAt('career-content.ts');
 const {careerLearningSteps,learningInput}=await moduleAt('career-learning.ts'),{readSave}=await moduleAt('save.ts');
 let fixture=createGame();fixture.completed=[0,1,2];fixture.mission=2;fixture=act(fixture,{type:'celebrate-opening'});
 for(const id of ['bakery-price','library-loans','contacts-clean','clinic-form','market-filter','school-sort','delivery-fees','bookstore-invoice']){
  fixture=act(fixture,{type:'career-accept',id});fixture=act(fixture,{type:'career-inspect',id});
  for(const [file,content] of Object.entries(exampleSolution(id)))fixture=act(fixture,{type:'career-edit',id,file,content});
  fixture=act(fixture,{type:'career-test',id});fixture=act(fixture,{type:'career-deliver',id,choice:'care'});
 }
 assert.equal(fixture.gameplay.career.completed.length,8);
 const ids=['florist-stock','workshop-slots','museum-layout',...CAREER_JOBS.filter(job=>job.act===3).map(job=>job.id)];
 for(const id of ids){fixture=act(fixture,{type:'career-accept',id});fixture=act(fixture,{type:'career-inspect',id});}
 fixture=readSave(JSON.stringify(fixture));await fs.mkdir(path.dirname(save),{recursive:true});
 await fs.writeFile(path.join(profile,'.codeshift-qa-profile'),'CODE:SHIFT isolated QA profile\n');await fs.writeFile(save,JSON.stringify(fixture));
 const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 app=await _electron.launch({executablePath:path.join(root,'desktop/node_modules/electron/dist/electron.exe'),args:[path.join(root,'desktop'),'--qa-user-data='+profile],env,timeout:25000});
 page=await app.firstWindow();page.setDefaultTimeout(12000);page.on('pageerror',error=>report.errors.push(String(error.stack||error)));
 await page.getByTestId('title-settings').click();await page.getByRole('combobox',{name:'Language',exact:true}).selectOption('en');await page.keyboard.press('Escape');
 await until(()=>page.getByTestId('title-continue').isEnabled(),true);await page.getByTestId('title-continue').click();
 await page.locator('.pc-shortcuts').getByRole('button',{name:'Contracts',exact:true}).click();
 const active=page.locator('.pc-window[data-active="true"]');
 if(!(await active.getAttribute('class')).includes('arranged'))await active.getByRole('button',{name:'Maximize or restore window',exact:true}).click();
 const saved=async()=>JSON.parse(await fs.readFile(save,'utf8'));
 const cache=async()=>JSON.parse(careerFiles(await saved(),'photo-cache')['cache.json']);
 for(const lang of ['en','ko','ja']){
  if(lang!=='en'){await page.locator('.pc-tray-settings').click();await page.getByRole('combobox',{name:'Language',exact:true}).selectOption(lang);await page.keyboard.press('Escape');await until(()=>page.locator('html').getAttribute('lang'),lang);}
  for(const id of ids)await check(lang+': '+id+' asks for a decision without exposing an answer line',async()=>{
   await nav(id);const job=CAREER_JOBS.find(item=>item.id===id),steps=careerLearningSteps(id);
   for(let i=0;i<steps.length;i++){
    const step=steps[i];await page.getByTestId('career-learning-step-'+i).click();
    const title=await page.locator('.career-learning-task h4').innerText();assert.ok(title.length>5);
    if(job.act===3)assert.ok(!title.includes(learningInput(step,step.correct,3)),title);
    else assert.ok(!title.includes(String(step.correct)),title);
    assert.equal(await page.getByTestId('career-learning-input').getAttribute('placeholder'),job.act<3||step.expression?'___':JSON.stringify(step.id.split('.').at(-1))+': ___');
    assert.equal(await page.getByTestId('career-learning-help').getAttribute('aria-expanded'),'false');
    assert.equal(await page.locator('.career-learning-choices').count(),0);
    assert.equal(await page.getByTestId('career-learning-apply').isEnabled(),false);
   }
  });
  await check(lang+': help is opt-in and only fills a draft; wrong values need correction',async()=>{
   await nav('photo-cache');await page.getByTestId('career-learning-step-0').click();
   const before=await saved(),beforeSource=careerFiles(before,'photo-cache')['cache.json'];
   await page.getByTestId('career-learning-help').click();await page.getByTestId('career-learning-choice-1').click();
   assert.equal(await page.getByTestId('career-learning-input').inputValue(),'"privateMaxAge": 0');
   assert.equal(careerFiles(await saved(),'photo-cache')['cache.json'],beforeSource);
   await page.getByTestId('career-learning-help').click();assert.equal(await page.locator('.career-learning-choices').count(),0);
   await page.getByTestId('career-learning-input').fill('"privateMaxAge": nope');await page.getByTestId('career-learning-apply').click();
   assert.equal(careerFiles(await saved(),'photo-cache')['cache.json'],beforeSource);
   await page.getByTestId('career-learning-input').fill('"privateMaxAge": 60');await page.getByTestId('career-learning-apply').click();
   await until(async()=>(await cache()).privateMaxAge,60);assert.equal(await page.locator('.career-learning-complete').count(),0);
   await page.getByTestId('career-learning-input').fill('"privateMaxAge": 0');await page.getByTestId('career-learning-apply').click();
   await until(async()=>(await cache()).privateMaxAge,0);
   const after=await saved();assert.equal(after.credits,before.credits);assert.equal(after.xp,before.xp);
   assert.equal(after.gameplay.career.completed.includes('photo-cache'),false);
   await page.screenshot({path:path.join(out,'career-guidance-'+tag+'-'+lang+'.png')});
  });
 }
 report.passed=report.checks.every(item=>item.passed)&&report.errors.length===0;
})().catch(error=>report.errors.push(String(error.stack||error))).finally(async()=>{
 if(app){const stopped=app.waitForEvent('close');await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].close());await stopped;}
 report.completedAt=new Date().toISOString();await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'career-guidance-'+tag+'.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
});
