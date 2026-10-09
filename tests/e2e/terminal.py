from playwright.sync_api import sync_playwright,expect
from pathlib import Path
import json
out=Path('output/0.10-qa');reports=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True)
 try:
  for lang in ['ko','en','ja']:
   c=b.new_context(viewport={'width':1440,'height':960});p=c.new_page();p.set_default_timeout(12000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
   p.goto('http://127.0.0.1:5173/',wait_until='networkidle');p.get_by_role('combobox',name='Language').select_option(lang);p.locator('.pc-play').click()
   expect(p.locator('.pc-shortcuts').get_by_role('button',name='Ghrom',exact=True)).to_be_visible()
   p.locator('.pc-shortcuts').get_by_role('button',name='Ghrom',exact=True).click();assert p.locator('.pc-window[data-active=true] .grom-icon').count()>0
   p.screenshot(path=str(out/f'{lang}-ghrom.png'),animations='disabled')
   p.locator('.pc-shortcuts').get_by_role('button',name={'ko':'터미널','en':'Terminal','ja':'ターミナル'}[lang],exact=True).click()
   field=p.locator('.pc-window[data-active=true] .terminal-form input');output=p.locator('.pc-window[data-active=true] .terminal-output')
   def run(text):field.fill(text);field.press('Enter')
   run('/pwd');expect(output).to_contain_text('pwd');assert p.locator('.terminal-error').count()==1
   run('pwd');expect(output).to_contain_text('/home/dev')
   run('mkdir -p "my notes"');run('echo first > "my notes/check.txt"');run('echo second >> "my notes/check.txt"');run('cat "my notes/check.txt"');expect(output).to_contain_text('first\nsecond')
   run('ls -la');expect(output).to_contain_text('my notes')
   run('cd "my notes"');run('cd -');expect(output).to_contain_text('/home/dev')
   run('clear');assert p.locator('.terminal-entry').count()==0
   field.press('ArrowUp');expect(field).to_have_value('clear');field.press('ArrowUp');expect(field).to_have_value('cd -')
   run('cat "my notes/check.txt"');expect(output).to_contain_text('first\nsecond')
   field.fill('cat "my notes/ch');field.press('Tab');assert 'check.txt' in field.input_value();field.press('Escape')
   field.fill('draft');field.press('Control+l');expect(field).to_have_value('draft');assert p.locator('.terminal-entry').count()==0
   field.press('Control+c');expect(field).to_have_value('')
   run('echo no > blocked.txt && pwd');run('ls');assert 'blocked.txt' not in p.locator('.terminal-entry').last.inner_text()
   p.screenshot(path=str(out/f'{lang}-terminal.png'),animations='disabled')
   assert not errors,errors;reports.append({'language':lang,'ghromBrand':True,'shellHistoryAfterClear':True,'redirectionAndFiles':True,'tabQuotedPath':True,'ctrlLAndC':True,'atomicUnsupportedChains':True,'errors':errors});c.close()
  (out/'terminal-report.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(reports,ensure_ascii=False))
 except Exception:
  p.screenshot(path=str(out/'terminal-failure.png'));raise
 finally:b.close()
