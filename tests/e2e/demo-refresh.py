"""Demo refresh: real CLI setup, tray controls, tiling and current public copy.

Isolated browser storage. No progress injection or production admin writes.
"""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE=os.environ.get('CODESHIFT_QA_BASE','http://127.0.0.1:5173/').rstrip('/')
OUT=Path(os.environ.get('CODESHIFT_QA_DIR','output/demo-refresh'))
OUT.mkdir(parents=True,exist_ok=True)
KEY='codeshift-intro-demo-v1'
report={'base':BASE,'checks':[],'pageErrors':[]}

with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='chrome',headless=True)
 try:
  context=browser.new_context(viewport={'width':1440,'height':900},locale='en-US')
  page=context.new_page();page.set_default_timeout(12000)
  page.on('pageerror',lambda error:report['pageErrors'].append(str(error)))
  page.goto(BASE,wait_until='networkidle')
  expect(page.get_by_test_id('title-new')).to_be_enabled()
  page.get_by_test_id('title-settings').click()
  page.get_by_role('combobox',name='Language').select_option('en')
  page.keyboard.press('Escape')
  expect(page.get_by_test_id('title-continue')).to_be_disabled()
  expect(page.locator('.title-home-logo')).to_have_attribute('aria-label','Localhost Hero')
  page.screenshot(path=str(OUT/'title-en.png'))
  page.get_by_test_id('title-new').click()
  expect(page.locator('.pc-window:visible')).to_have_count(0)
  page.locator('.pc-shortcuts').get_by_role('button',name='Messages',exact=True).click()
  expect(page.locator('.pc-mail-toast')).to_have_count(0)
  page.locator('.message-body>.primary-button').click()
  commands=[]
  for _ in range(10):
   if page.get_by_test_id('coach-inspect').is_visible():break
   prompt=page.get_by_test_id('coach-next-command').locator('code')
   expect(prompt).to_be_visible()
   command=prompt.inner_text().removeprefix('$ ').strip()
   assert command and command not in commands,commands
   field=page.locator('.cafe-coach .terminal-form input')
   field.fill(command);field.press('Enter')
   page.wait_for_function('(v)=>JSON.parse(localStorage.getItem(v.key)).history.at(-1)?.command===v.command',arg={'key':KEY,'command':command})
   page.wait_for_function("(c)=>!document.querySelector('[data-testid=coach-next-command] code') || document.querySelector('[data-testid=coach-next-command] code').textContent.trim()!=='$ '+c",arg=command)
   commands.append(command)
  expect(page.get_by_test_id('coach-inspect')).to_be_visible()
  assert len(commands)>=5,commands
  assert page.evaluate('(k)=>JSON.parse(localStorage.getItem(k)).completed',KEY)==[]
  page.screenshot(path=str(OUT/'manual-terminal-setup.png'))
  report['checks'].append({'manualSetupCommands':commands,'setupDoesNotCompleteMission':True})

  page.locator('.pc-shortcuts').get_by_role('button',name='Terminal',exact=True).click()
  field=page.locator('.pc-window[data-window=terminal] .terminal-form input')
  field.fill('pw');field.press('Tab');expect(field).to_have_value('pwd')
  field.press('Enter')
  page.wait_for_function('(k)=>JSON.parse(localStorage.getItem(k)).history.at(-1)?.command==="pwd"',arg=KEY)
  field.press('ArrowUp');expect(field).to_have_value('pwd')
  field.fill('clear');field.press('Enter')
  expect(field).to_have_value('')
  page.get_by_test_id('taskbar-tile').click()
  terminal=page.locator('.pc-window[data-window=terminal]:visible')
  expect(terminal).to_be_visible()
  windows=page.locator('.pc-window:visible').all()
  assert len(windows)>=2
  boxes=[w.bounding_box() for w in windows]
  assert all(b['x']>=0 and b['y']>=0 and b['x']+b['width']<=1441 and b['y']+b['height']<=901 for b in boxes),boxes
  assert len({round(b['x']) for b in boxes})>=2,boxes
  page.screenshot(path=str(OUT/'tiled-windows.png'))
  report['checks'].append({'terminalTabHistoryClear':True,'windowTiling':True})

  for lang in ['ko','ja','en']:
   page.get_by_test_id('tray-language').click()
   expect(page.get_by_test_id('tray-language-panel')).to_be_visible()
   page.get_by_test_id('tray-language-'+lang).click()
   expect(page.locator('html')).to_have_attribute('lang',lang)
   expect(page.get_by_test_id('tray-language-panel')).to_have_count(0)
  page.get_by_test_id('tray-sound').click()
  level=page.get_by_test_id('tray-volume-master')
  level.focus();level.press('Home')
  for _ in range(41):level.press('ArrowRight')
  expect(level).to_have_value('41')
  page.get_by_test_id('tray-mute').click()
  expect(page.get_by_test_id('tray-mute')).to_have_attribute('aria-pressed','true')
  page.keyboard.press('Escape')
  expect(page.get_by_test_id('tray-sound-panel')).to_have_count(0)
  expect(page.get_by_test_id('tray-sound')).to_be_focused()
  page.reload(wait_until='networkidle')
  expect(page.get_by_test_id('title-continue')).to_be_enabled()
  page.get_by_test_id('title-continue').click()
  page.get_by_test_id('tray-sound').click()
  expect(page.get_by_test_id('tray-volume-master')).to_have_value('41')
  expect(page.get_by_test_id('tray-mute')).to_have_attribute('aria-pressed','true')
  page.keyboard.press('Escape')
  for width,height in [(1280,720),(390,844)]:
   page.set_viewport_size({'width':width,'height':height})
   for panel in ['language','sound']:
    page.get_by_test_id('tray-'+panel).click()
    flyout=page.get_by_test_id('tray-'+panel+'-panel');expect(flyout).to_be_visible()
    bounds=flyout.bounding_box()
    assert bounds['x']>=0 and bounds['x']+bounds['width']<=width+1,bounds
    assert bounds['y']>=0 and bounds['y']+bounds['height']<=height+1,bounds
    page.screenshot(path=str(OUT/f'{panel}-{width}.png'))
    page.keyboard.press('Escape')
  report['checks'].append({'trayLocales':['ko','en','ja'],'volumeMutePersistence':True,'trayViewports':[1280,390]})
  context.close()

  for route,lang in [('/about','ko'),('/about/en','en'),('/about/ja','ja')]:
   page=browser.new_page(viewport={'width':390,'height':844})
   page.on('pageerror',lambda error:report['pageErrors'].append(str(error)))
   response=page.goto(BASE+route,wait_until='networkidle');assert response.status==200
   assert 'Localhost Hero' in page.title()
   assert 'CODE:SHIFT' not in page.locator('body').inner_text()
   assert page.locator('meta[property="og:site_name"]').get_attribute('content')=='Localhost Hero'
   data=json.loads(page.locator('script[type="application/ld+json"]').inner_text())
   assert data['name']=='Localhost Hero' and data['isAccessibleForFree'] is True
   if lang=='en':expect(page.locator('body')).to_contain_text('Actual English gameplay')
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),route
   page.screenshot(path=str(OUT/f'about-{lang}-mobile.png'),full_page=True)
   report['checks'].append({'about':route,'currentBrand':True,'mobileOverflow':False})
   page.close()
  assert not report['pageErrors'],report['pageErrors']
  report['passed']=True
 except Exception:
  if not page.is_closed():
   page.screenshot(path=str(OUT/'failure.png'))
   (OUT/'failure.txt').write_text(page.locator('body').inner_text(),encoding='utf-8')
  raise
 finally:
  browser.close()
  (OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
