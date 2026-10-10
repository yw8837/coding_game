"""Regression: title ambience always plays, including when the OS requests reduction."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE=os.environ.get('CODESHIFT_QA_BASE','http://127.0.0.1:5173/')
OUT=Path('output/launch-quality-20261010/title-motion');OUT.mkdir(parents=True,exist_ok=True)
report={'errors':[]}
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='chrome',headless=True)
 context=browser.new_context(viewport={'width':1440,'height':900},reduced_motion='reduce',locale='en-US',record_video_dir=str(OUT/'recordings'),record_video_size={'width':1440,'height':900})
 page=context.new_page();page.set_default_timeout(12000);page.on('pageerror',lambda e:report['errors'].append(str(e)))
 try:
  page.goto(BASE,wait_until='networkidle')
  title=page.locator('.title-home');code=page.locator('.title-editor-code code')
  expect(title).to_have_attribute('data-motion','animated')
  expect(page.get_by_test_id('title-motion')).to_have_count(0)
  # The continuous loop is confined to the title; gameplay reduction remains active.
  expect(page.locator('html')).to_have_attribute('data-game-reduced-motion','true')
  before=code.text_content()
  page.wait_for_function('(v)=>document.querySelector(".title-editor-code code").textContent!==v',arg=before)
  for selector in ['.title-rain line','.title-coffee-steam path']:
   first=page.locator(selector).first.evaluate('(e)=>getComputedStyle(e).transform')
   page.wait_for_function('(v)=>getComputedStyle(document.querySelector(v.selector)).transform!==v.first',arg={'selector':selector,'first':first})
   assert page.locator(selector).first.evaluate('(e)=>parseFloat(getComputedStyle(e).animationDuration)')>1
  box=page.get_by_test_id('title-new').bounding_box();page.mouse.move(1250,650)
  page.wait_for_function("document.querySelector('.title-room').style.getPropertyValue('--room-x')!==''")
  assert box==page.get_by_test_id('title-new').bounding_box()
  page.wait_for_function("document.querySelector('.title-terminal-log-entry')!==null")
  page.wait_for_function("document.querySelector('.title-editor-code').scrollTop>0",timeout=18000)
  page.wait_for_function("document.querySelector('.title-monitor-workspace').dataset.file==='style.css'",timeout=18000)
  report['animatedDespiteSystemReduction']=True;report['codeScrollAndFileCycle']=True
  page.screenshot(path=str(OUT/'animated.png'))
  page.get_by_test_id('title-settings').click();before=code.text_content()
  page.wait_for_timeout(600)  # Negative assertion: an open dialog must freeze the scene.
  assert code.text_content()==before
  assert page.locator('.title-rain line').first.evaluate('(e)=>getComputedStyle(e).animationPlayState')=='paused'
  page.keyboard.press('Escape')
  page.reload(wait_until='networkidle');expect(title).to_have_attribute('data-motion','animated')
  for language in ['ko','en','ja']:
   page.get_by_test_id('title-settings').click();page.get_by_role('combobox',name='Language').select_option(language)
   expect(page.get_by_test_id('title-motion')).to_have_count(0);page.keyboard.press('Escape')
  before=code.text_content();page.wait_for_function('(v)=>document.querySelector(".title-editor-code code").textContent!==v',arg=before)
  page.emulate_media(reduced_motion='no-preference');expect(title).to_have_attribute('data-motion','animated')
  assert page.evaluate("localStorage.getItem('codeshift-intro-demo-v1')") is None
  assert not report['errors'],report['errors']
  report.update({'dialogPauseAndResume':True,'automaticOnReload':True,'threeLanguages':True,'gameSaveUntouched':True,'passed':True})
 finally:
  context.close();browser.close();(OUT/'web-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
