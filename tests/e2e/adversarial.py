from playwright.sync_api import sync_playwright,expect
from pathlib import Path
import json
out=Path('output/pc-qa');out.mkdir(parents=True,exist_ok=True);results=[]
def saved(p):return p.evaluate("JSON.parse(localStorage.getItem('codeshift-intro-demo-v1')||'null')")
def active(p):return p.locator('.pc-window[data-active="true"]')
def follow(p):p.get_by_test_id('follow-task').click()
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True)
 try:
  for lang in ['en','ja']:
   c=b.new_context(viewport={'width':390,'height':844});p=c.new_page();p.set_default_timeout(8000)
   p.add_init_script("localStorage.setItem('codeshift-language',"+json.dumps(lang)+")")
   p.goto('http://127.0.0.1:5173/',wait_until='networkidle');p.locator('.pc-play').click()
   follow(p);active(p).locator('.message-body>.primary-button').click();follow(p)
   for _ in range(3):active(p).locator('.computer-setup-steps li.available button').first.click()
   follow(p);active(p).locator('.preview-tools button').nth(1).click();active(p).locator('.preview-investigation button').click()
   follow(p);active(p).locator('.token-help button').click();p.keyboard.insert_text('Mono Cafe' if lang=='en' else 'モノカフェ')
   follow(p);active(p).locator('.token-help button').click();p.keyboard.insert_text('100%')
   active(p).locator('.editor-actions .primary-button').click();p.wait_for_function("JSON.parse(localStorage.getItem('codeshift-intro-demo-v1')).tests?.checks.every(x=>x.passed)")
   p.screenshot(path=str(out/f'editor-{lang}-mobile.png'),animations='disabled')
   for _ in range(3):follow(p);active(p).locator('.terminal-form input').press('Enter')
   follow(p);active(p).locator('.pr-heading .primary-button').click();active(p).locator('.pr-actions .outline-button').click();active(p).locator('.pr-actions .primary-button').click()
   expect(p.locator('.reward-dialog')).to_be_visible();assert saved(p)['completed']==[0]
   p.locator('.reward-dialog .primary-button').click();expect(p.locator('.reward-dialog')).not_to_be_visible()
   assert saved(p)['mission']==1
   # Localized practice proof and replay protection.
   p.locator('.pc-show-desktop').click();p.locator('.pc-shortcuts .pc-shortcut').last.click()
   rule=active(p).locator('.practice-rule-row input');before=saved(p)['credits']
   rule.fill('globalThis.alert(1)');active(p).locator('.practice-rule-row button').click();expect(active(p).locator('.practice-feedback-box.needs-work')).to_be_visible();assert saved(p)['credits']==before
   rule.fill('price * quantity');active(p).locator('.practice-rule-row button').click();expect(active(p).locator('.practice-feedback-box:not(.needs-work)')).to_be_visible();assert saved(p)['credits']==before+25
   active(p).locator('.practice-rule-row button').click();assert saved(p)['credits']==before+25
   p.screenshot(path=str(out/f'practice-{lang}-mobile.png'),animations='disabled')
   # Settings/Escape only closes dialog; app continues. Language persisted.
   p.locator('.pc-language').click();expect(p.locator('.settings-dialog')).to_be_visible();p.keyboard.press('Escape');expect(p.locator('.settings-dialog')).not_to_be_visible();expect(active(p)).to_be_visible()
   p.reload(wait_until='networkidle');p.locator('.pc-play').click();assert saved(p)['completed']==[0];assert p.locator('html').get_attribute('lang')==lang
   overflow=p.evaluate('document.documentElement.scrollWidth>innerWidth');assert not overflow
   results.append({'lang':lang,'firstChapter':True,'practice':True,'reload':True,'overflow':overflow});c.close()
  # Malformed local save must not crash. It remains intact until the player starts anew.
  c=b.new_context(viewport={'width':1024,'height':768});p=c.new_page();p.set_default_timeout(8000)
  p.add_init_script("localStorage.setItem('codeshift-intro-demo-v1','{bad-json')")
  p.goto('http://127.0.0.1:5173/',wait_until='networkidle');p.locator('.pc-play').click();assert p.locator('.pc-shortcuts').is_visible();assert p.evaluate("localStorage.getItem('codeshift-intro-demo-v1')")=='{bad-json'
  p.locator('.pc-shortcuts').get_by_role('button',name='터미널',exact=True).click();field=active(p).locator('.terminal-form input')
  field.fill('git st');field.press('Tab');assert field.input_value()=='git status';field.press('Enter')
  field.fill('unfinished draft');field.press('ArrowUp');field.press('ArrowDown');assert field.input_value()=='unfinished draft'
  field.fill('touch '+'x'*300);field.press('Enter');assert saved(p) is not None
  assert not any(len(k)>300 for k in saved(p)['machines']['local']['files'])
  w=active(p);handle=w.locator('.pc-resize').bounding_box();p.mouse.move(handle['x']+13,handle['y']+13);p.mouse.down();p.mouse.move(handle['x']-180,handle['y']-120,steps=8);p.mouse.up()
  p.set_viewport_size({'width':760,'height':620});bounds=w.bounding_box();stage=p.locator('.pc-stage').bounding_box();assert bounds['x']>=0 and bounds['x']+bounds['width']<=stage['width']+1
  p.screenshot(path=str(out/'resized-1024.png'),animations='disabled');c.close()
  results.append({'malformedSave':'recovered without overwrite before action','terminalTabHistory':True,'oversizedPathRejected':True,'resizeBounded':True})
  for route,lang in [('/about','ko'),('/about/en','en'),('/about/ja','ja')]:
   c=b.new_context();p=c.new_page();response=p.goto('http://127.0.0.1:5173'+route,wait_until='networkidle');assert response.status==200;assert p.locator('h1').count()==1;assert p.locator('script[type="application/ld+json"]').count()>=1;c.close()
  results.append({'aboutPages':3})
  (out/'adversarial-report.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(results,ensure_ascii=False))
 except Exception:
  p.screenshot(path=str(out/'adversarial-failure.png'),animations='disabled');(out/'adversarial-failure.txt').write_text(p.locator('body').inner_text(),encoding='utf-8');raise
 finally:b.close()
