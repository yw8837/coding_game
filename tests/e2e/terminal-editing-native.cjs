'use strict';
// Isolated Electron profile. Exercise real input events without changing the user's clipboard.
const path=require('node:path'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {_electron}=require(process.env.PLAYWRIGHT_PACKAGE||path.join(process.env.USERPROFILE,'.codex/skills/webapp-testing/.venv/Lib/site-packages/playwright/driver/package'));
const root=path.resolve(__dirname,'../..'),out=path.join(root,'output/full-version-quality');
const tag=process.env.CODESHIFT_TERMINAL_QA_TAG||'final',profile=path.join(out,'terminal-editing-native-'+Date.now());
const report={startedAt:new Date().toISOString(),profile,passed:false,checks:[],errors:[]};
let app,page,field;
async function check(name,action){
 try{await action();report.checks.push({name,passed:true});}
 catch(error){report.checks.push({name,passed:false,error:String(error.stack||error)});}
}
async function until(read,expected){
 const deadline=Date.now()+10000;
 while(Date.now()<deadline){try{if(await read()===expected)return;}catch{}await new Promise(resolve=>setTimeout(resolve,50));}
 assert.equal(await read(),expected);
}
async function caret(position){await field.evaluate((element,pos)=>{element.focus();element.setSelectionRange(pos,pos);},position);}
async function command(value){await field.fill(value);await field.press('Enter');await until(()=>field.inputValue(),'');}

(async()=>{
 await fs.mkdir(path.join(profile,'saves'),{recursive:true});
 await fs.writeFile(path.join(profile,'.codeshift-qa-profile'),'CODE:SHIFT isolated QA profile\n');
 const {createGame,runCommand}=await import(pathToFileURL(path.join(root,'lib/game/engine.ts')).href);
 let fixture=createGame();fixture=runCommand(fixture,'mkdir "my notes"').state;
 await fs.writeFile(path.join(profile,'saves/game.json'),JSON.stringify(fixture));
 const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 app=await _electron.launch({executablePath:path.join(root,'desktop/node_modules/electron/dist/electron.exe'),args:[path.join(root,'desktop'),'--qa-user-data='+profile],env,timeout:25000});
 page=await app.firstWindow();page.setDefaultTimeout(10000);page.on('pageerror',error=>report.errors.push(String(error.stack||error)));
 await page.getByTestId('title-settings').click();await page.getByRole('combobox',{name:'Language',exact:true}).selectOption('en');await page.keyboard.press('Escape');
 await until(()=>page.getByTestId('title-continue').isEnabled(),true);await page.getByTestId('title-continue').click();
 await page.locator('.pc-shortcuts').getByRole('button',{name:'Terminal',exact:true}).click();
 field=page.locator('.pc-window[data-active="true"] .terminal-form input');await field.waitFor({state:'visible'});
 await page.evaluate(()=>{
  document.addEventListener('keydown',event=>{
   if(event.ctrlKey&&event.key.toLowerCase()==='c'){
    window.terminalCopyEvent={prevented:event.defaultPrevented};
    event.preventDefault(); // Do not write to the real OS clipboard during QA.
   }
  });
 });
 for(const lang of ['en','ko','ja']){
  if(lang!=='en'){
   await page.locator('.pc-tray-settings').click();await page.getByRole('combobox',{name:'Language',exact:true}).selectOption(lang);await page.keyboard.press('Escape');
   await until(()=>page.locator('html').getAttribute('lang'),lang);
  }
  await command('cd /home/dev');await command('echo alpha > alpha.txt');await command('echo alpine > alpine.txt');
  await command('echo found > "my notes/check.txt"');
  await check(lang+': Ctrl+C leaves selected command available to copy',async()=>{
   await field.fill('cat welcome.txt');await field.press('Control+a');await field.press('Control+c');
   assert.equal(await field.inputValue(),'cat welcome.txt');
   assert.equal(await page.evaluate(()=>window.terminalCopyEvent.prevented),false);
  });
  await check(lang+': Ctrl+C also preserves an input draft when terminal output is selected',async()=>{
   await command('pwd');await field.fill('keep this draft');await caret(15);
   await page.locator('.pc-window[data-active="true"] .terminal-entry').last().locator('pre').evaluate(element=>{
    const selection=window.getSelection(),range=document.createRange();range.selectNodeContents(element);
    selection.removeAllRanges();selection.addRange(range);
   });
   await page.keyboard.press('Control+c');
   assert.equal(await field.inputValue(),'keep this draft');
   assert.equal(await page.evaluate(()=>window.terminalCopyEvent.prevented),false);
   await page.evaluate(()=>window.getSelection().removeAllRanges());
  });
  await check(lang+': Ctrl+C without a selection cancels only the draft',async()=>{
   await field.fill('echo do-not-run > cancelled.txt');await caret(31);await field.press('Control+c');
   assert.equal(await field.inputValue(),'');
   assert.equal(await page.evaluate(()=>window.terminalCopyEvent.prevented),true);
  });
  await check(lang+': Tab completes at the caret and preserves redirection until Enter',async()=>{
   await command('clear');await field.fill('cat wel > result.txt');await caret(7);await field.press('Tab');
   assert.equal(await field.inputValue(),'cat welcome.txt > result.txt');
   assert.equal(await field.evaluate(element=>element.selectionStart),15);
   assert.equal(await page.locator('.pc-window[data-active="true"] .terminal-entry').count(),0);
   await field.press('Enter');await until(()=>field.inputValue(),'');await command('cat result.txt');
   const actual=page.locator('.pc-window[data-active="true"] .terminal-entry').last().locator('pre');
   assert.equal(await actual.innerText(),fixture.machines.local.files['/home/dev/welcome.txt']);
  });
  await check(lang+': repeated Tab cycles matches without losing the tail or running them',async()=>{
   await command('clear');await field.fill('cat al > copied.txt');await caret(6);
   await field.press('Tab');assert.equal(await field.inputValue(),'cat alpha.txt > copied.txt');
   await field.press('Tab');assert.equal(await field.inputValue(),'cat alpine.txt > copied.txt');
   await field.press('Tab');assert.equal(await field.inputValue(),'cat alpha.txt > copied.txt');
   assert.equal(await field.evaluate(element=>element.selectionStart),13);
   assert.equal(await page.locator('.pc-window[data-active="true"] .terminal-entry').count(),0);
   await page.locator('.terminal-completions').getByRole('button',{name:'cat alpine.txt > copied.txt',exact:true}).click();
   assert.equal(await field.inputValue(),'cat alpine.txt > copied.txt');
   assert.equal(await field.evaluate(element=>element.selectionStart),14);
   assert.equal(await field.evaluate(element=>document.activeElement===element),true);
  });
  await check(lang+': quoted path completion replaces the remaining token and keeps the redirect',async()=>{
   await field.fill('cat "my notes/chOLD" > quoted.txt');await caret(16);await field.press('Tab');
   const value=await field.inputValue();
   assert.ok(value.includes('my notes/check.txt'));assert.ok(value.endsWith(' > quoted.txt'));
   assert.equal(value.slice(await field.evaluate(element=>element.selectionStart)),' > quoted.txt');
   await field.press('Escape');assert.equal(await page.locator('.terminal-completions').count(),0);
   assert.equal(await field.inputValue(),value);
  });
  await check(lang+': clicking the Tab button respects the caret just like the keyboard',async()=>{
   await field.fill('cp wel result.txt');await caret(6);
   await page.locator('.pc-window[data-active="true"] .terminal-form button[type="button"]').click();
   assert.equal(await field.inputValue(),'cp welcome.txt result.txt');
   assert.equal(await field.evaluate(element=>element.selectionStart),14);
   assert.equal(await field.evaluate(element=>document.activeElement===element),true);
  });
  await check(lang+': caret movement recomputes completion instead of cycling the old path',async()=>{
   await field.fill('cat al > wel');await caret(6);await field.press('Tab');
   await field.press('End');await field.press('Tab');
   assert.equal(await field.inputValue(),'cat alpha.txt > welcome.txt');
  });
  await check(lang+': Ctrl+L clears output while history navigation restores the unsubmitted draft',async()=>{
   await command('pwd');await field.fill('unsubmitted draft');await field.press('Control+l');
   assert.equal(await field.inputValue(),'unsubmitted draft');
   assert.equal(await page.locator('.pc-window[data-active="true"] .terminal-entry').count(),0);
   await field.press('ArrowUp');assert.equal(await field.inputValue(),'clear');
   await field.press('ArrowUp');assert.equal(await field.inputValue(),'pwd');
   await field.press('ArrowDown');assert.equal(await field.inputValue(),'clear');
   await field.press('ArrowDown');assert.equal(await field.inputValue(),'unsubmitted draft');
  });
  await check(lang+': Shift+Tab and Tab with no match still allow keyboard focus navigation',async()=>{
   await field.fill('cat no-such-file');await field.press('Tab');
   assert.equal(await field.evaluate(element=>document.activeElement===element),false);
   await field.focus();await field.press('Shift+Tab');
   assert.equal(await field.evaluate(element=>document.activeElement===element),false);
  });
  await check(lang+': IME composition does not trigger completion or cancel the draft',async()=>{
   const value=lang==='ja'?'cat メモ':lang==='ko'?'cat 메모':'cat composing';
   await field.fill(value);
   await field.evaluate(element=>{
    element.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',code:'Tab',bubbles:true,cancelable:true,isComposing:true}));
    element.dispatchEvent(new KeyboardEvent('keydown',{key:'c',code:'KeyC',ctrlKey:true,bubbles:true,cancelable:true,isComposing:true}));
   });
   assert.equal(await field.inputValue(),value);
  });
  await field.fill('cat al > copied.txt');await caret(6);await field.press('Tab');
  await page.screenshot({path:path.join(out,'terminal-editing-'+tag+'-'+lang+'.png')});
 }

 report.passed=report.checks.every(item=>item.passed)&&!report.errors.length;
})().catch(error=>{report.errors.push(String(error.stack||error));}).finally(async()=>{
 if(app){const stopped=app.waitForEvent('close');await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].close());await stopped;}
 report.completedAt=new Date().toISOString();await fs.mkdir(out,{recursive:true});
 await fs.writeFile(path.join(out,'terminal-editing-'+tag+'.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
});
