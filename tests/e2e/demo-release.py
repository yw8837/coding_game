"""Demo boundary/save/locale regression. Imported full save is a regression fixture,
not evidence of earning campaign progress during this run. coach.py plays fresh.
"""
from pathlib import Path
import json, os
from playwright.sync_api import sync_playwright, expect

out=Path(os.environ.get('CODESHIFT_QA_DIR','output/demo-20261010'));out.mkdir(parents=True,exist_ok=True)
base='http://127.0.0.1:5173'
key='codeshift-intro-demo-v1'
seed=Path('output/0.13.1-qa/ko-chosen-route-save.json')
reports=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='chrome',headless=True)
 try:
  for region, browser_locale, expected in [('ko','en-US','ko'),('ja','en-US','ja'),('en','ko-KR','en'),(None,'ja-JP','ja')]:
   context=browser.new_context(locale=browser_locale,viewport={'width':1280,'height':720})
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.route('**/api/locale',lambda route:route.fulfill(json={'language':region}))
   page.goto(base,wait_until='networkidle');expect(page.locator('html')).to_have_attribute('lang',expected)
   page.get_by_role('combobox',name='Language').select_option('en')
   page.reload(wait_until='networkidle');expect(page.locator('html')).to_have_attribute('lang','en')
   assert page.evaluate("localStorage.getItem('codeshift-language')")=='en'
   assert not errors,errors
   reports.append({'mockRegionLanguage':region,'browser':browser_locale,'detected':expected,'manualChoiceSurvivesReload':True})
   context.close()

  context=browser.new_context(locale='en-US',viewport={'width':1366,'height':768},accept_downloads=True)
  page=context.new_page();page.set_default_timeout(10000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base,wait_until='networkidle');page.get_by_role('combobox',name='Language').select_option('en')
  # Import through the real confirmation UI, preserving all earned full-game data.
  page.locator('.pc-title-screen').get_by_role('button',name='Settings',exact=True).click()
  page.locator('.save-tools input[type=file]').set_input_files(str(seed.resolve()))
  expect(page.locator('.save-confirm')).to_be_visible()
  page.get_by_role('button',name='Continue from this save',exact=True).click()
  page.locator('.pc-play').click();expect(page.get_by_test_id('demo-complete')).to_be_visible()
  before=page.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',key)
  expected_seed=json.loads(seed.read_text(encoding='utf-8'))
  assert before['gameplay']['career']==expected_seed['gameplay']['career']
  page.get_by_test_id('demo-complete').locator('.primary-button').click()
  expect(page.locator('.pc-window[data-window=career]')).to_have_count(0)
  expect(page.get_by_test_id('opening-first-client')).to_have_count(0)
  page.screenshot(path=str(out/'demo-imported-full-save.png'),animations='disabled')
  page.get_by_test_id('taskbar-start').click()
  expect(page.locator('.pc-start-apps').get_by_role('button',name='Contracts',exact=True)).to_have_count(0)
  page.keyboard.press('Escape')
  # Full data must still be exportable; no save truncation on load/reload/export.
  page.get_by_test_id('taskbar-start').click()
  page.get_by_role('button',name='Settings',exact=True).click()
  with page.expect_download() as dl:
   page.get_by_role('button',name='Export backup',exact=True).click()
  backup=out/'demo-full-save-backup.json';dl.value.save_as(str(backup))
  exported=json.loads(backup.read_text(encoding='utf-8'))
  for field in ['career','lab','practice']:
   assert exported['gameplay'][field]==before['gameplay'][field],field
  assert not errors,errors
  reports.append({'fullSaveImportedThroughUI':True,'careerBlocked':True,'fullSaveBackupPreserved':True,'pageErrors':errors})
  context.close()
  for path,lang in [('/about','ko'),('/about/en','en'),('/about/ja','ja')]:
   page=browser.new_page(viewport={'width':1280,'height':720})
   page.goto(base+path,wait_until='networkidle')
   assert page.locator('#requests ol > li').count()==3
   assert page.locator('link[rel=canonical]').get_attribute('href')=='https://code.yeolmaeapps.kr'+path
   assert page.locator('meta[name=description]').get_attribute('content')
   assert page.locator('meta[name="twitter:card"]').get_attribute('content')=='summary_large_image'
   data=json.loads(page.locator('script[type="application/ld+json"]').inner_text())
   assert data['@type']=='VideoGame' and data['isAccessibleForFree'] is True
   page.screenshot(path=str(out/f'demo-about-{lang}.png'),animations='disabled')
   reports.append({'aboutLanguage':lang,'threeChapters':True,'canonicalAndStructuredData':True})
   page.close()
 finally:browser.close()
(out/'demo-release-report.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(reports,ensure_ascii=False))
