"""Type commands through the terminal and edit actual virtual files. No state injection."""
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
import json

out=Path('output/0.11-qa');out.mkdir(parents=True,exist_ok=True)
def state(p):return p.evaluate("JSON.parse(localStorage.getItem('codeshift-intro-demo-v1'))")
def terminal(p,lang):
 p.locator('.pc-start-button').click()
 p.locator('.pc-start-apps').get_by_role('button',name={'ko':'터미널','en':'Terminal','ja':'ターミナル'}[lang],exact=True).click()
def command(p,text):
 field=p.locator('.pc-window[data-active=true] .terminal-form input');field.fill(text);field.press('Enter')
 p.wait_for_function("s=>JSON.parse(localStorage.getItem('codeshift-intro-demo-v1')).history.at(-1)?.command===s",arg=text)
 return state(p)['history'][-1]

with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True);reports=[]
 try:
  for lang,locale in [('ko','ko-KR'),('en','en-US'),('ja','ja-JP')]:
   c=b.new_context(viewport={'width':1440,'height':960},locale=locale);p=c.new_page();p.set_default_timeout(12000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
   p.goto('http://127.0.0.1:5173/',wait_until='networkidle');p.locator('.pc-play').click()
   p.locator('.pc-shortcuts').get_by_role('button',name={'ko':'연습 의뢰','en':'Practice jobs','ja':'練習の依頼'}[lang],exact=True).click();p.get_by_test_id('code-lab-tab').click()
   p.get_by_test_id('lab-terminal-workspace').locator('xpath=ancestor::details').locator('summary').first.click();p.get_by_test_id('lab-terminal-workspace').click()
   assert command(p,'node --test /home/dev/code-lab/receipt.test.cjs')['error']
   for text in ['sudo apt update','sudo apt install nodejs','cd /home/dev/code-lab']:
    assert not command(p,text)['error'],text
   assert 'function solve(input)' in command(p,'cat receipt.js')['output']
   first=command(p,'node --test receipt.test.cjs');assert first['error'];assert 'not ok' in first['output']
   assert not command(p,'code receipt.js')['error'];expect(p.get_by_test_id('virtual-file-path')).to_contain_text('/home/dev/code-lab/receipt.js')
   editor=p.get_by_test_id('virtual-file-source').locator('textarea');editor.fill(editor.input_value().replace(' + ',' * '));p.screenshot(path=str(out/f'{lang}-terminal-editor.png'),animations='disabled')
   p.get_by_test_id('virtual-file-terminal').click();assert not command(p,'node --test receipt.test.cjs')['error']
   saved=state(p);assert saved['gameplay']['lab']['proofs']['receipt']['passed'];paid=saved['credits'];assert paid==155
   assert not command(p,'node --test receipt.test.cjs')['error'];assert state(p)['credits']==paid
   assert not command(p,'code receipt.input.json')['error'];p.get_by_test_id('virtual-file-source').locator('textarea').fill('{"price":5000,"quantity":4}');p.get_by_test_id('virtual-file-terminal').click()
   assert command(p,'node run.cjs receipt.js receipt.input.json')['output']=='20000'
   p.screenshot(path=str(out/f'{lang}-terminal-result.png'),animations='disabled')
   # Commands and GUI both read the same file, and changed code invalidates proof.
   assert not command(p,'code receipt.js')['error'];editor=p.get_by_test_id('virtual-file-source').locator('textarea');editor.fill(editor.input_value().replace(' * ',' + '));assert 'receipt' not in state(p)['gameplay']['lab']['proofs']
   editor.press('Control+Enter');p.wait_for_function("JSON.parse(localStorage.getItem('codeshift-intro-demo-v1')).history.at(-1)?.error===true")
   assert not state(p)['gameplay']['lab']['proofs']['receipt']['passed']
   assert not command(p,'code receipt.js')['error'];editor=p.get_by_test_id('virtual-file-source').locator('textarea');editor.fill(editor.input_value().replace(' + ',' * '));editor.press('Control+Enter')
   p.wait_for_function("JSON.parse(localStorage.getItem('codeshift-intro-demo-v1')).gameplay.lab.proofs.receipt?.passed===true")
   assert command(p,'node -e "process.exit()"')['error']
   p.reload(wait_until='networkidle');p.locator('.pc-play').click();assert p.locator('.pc-window:visible').count()==0;terminal(p,lang)
   assert command(p,'pwd')['output']=='/home/dev/code-lab';assert command(p,'node run.cjs receipt.js receipt.input.json')['output']=='20000';assert not command(p,'node --test receipt.test.cjs')['error'];assert state(p)['credits']==paid
   assert not errors,errors;reports.append({'language':lang,'typedSetupAndCommands':True,'actualVirtualFileEdit':True,'customInputOutput':20000,'starterFailsRepairPasses':True,'editorCtrlEnter':True,'noDuplicateRewards':True,'reloadAndCwd':True,'unsupportedHostEvaluationRejected':True,'pageErrors':errors});c.close()
  (out/'lab-terminal-report.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(reports,ensure_ascii=False))
 except Exception:
  p.screenshot(path=str(out/'lab-terminal-failure.png'),animations='disabled');(out/'lab-terminal-failure.txt').write_text(p.locator('body').inner_text(),encoding='utf-8');raise
 finally:b.close()
