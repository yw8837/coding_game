"""Continue must represent player progress, not a freshly reset save envelope."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE=os.environ.get('CODESHIFT_QA_BASE','http://127.0.0.1:5173/')
OUT=Path(os.environ.get('CODESHIFT_QA_DIR','output/title-save-state'));OUT.mkdir(parents=True,exist_ok=True)
report={'errors':[],'base':BASE}
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='chrome',headless=True)
 context=browser.new_context(viewport={'width':1440,'height':900},locale='ko-KR')
 page=context.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
 try:
  page.goto(BASE,wait_until='networkidle')
  page.get_by_test_id('title-settings').click()
  page.get_by_role('combobox',name='Language').select_option('ko')
  page.keyboard.press('Escape')
  expect(page.get_by_test_id('title-continue')).to_be_disabled()
  page.get_by_test_id('title-new').click()
  expect(page.locator('.pc-shortcuts')).to_be_visible()
  page.wait_for_function("localStorage.getItem('codeshift-intro-demo-v1')!==null")
  page.reload(wait_until='networkidle')
  page.get_by_test_id('title-new').click()
  # Old versions ask to overwrite even this empty workspace.
  if page.get_by_role('alertdialog').count():
   page.get_by_role('alertdialog').get_by_role('button',name='초기화하고 다시 시작',exact=True).click()
  expect(page.locator('.pc-shortcuts')).to_be_visible()
  page.reload(wait_until='networkidle')
  expect(page.get_by_test_id('title-new')).to_be_enabled()
  page.screenshot(path=str(OUT/'after-reset.png'))
  report['continueEnabledAfterReset']=page.get_by_test_id('title-continue').is_enabled()
  expect(page.get_by_test_id('title-continue')).to_be_disabled()
  report['emptyWorkspaceCannotContinue']=True
  expect(page.locator('.title-home-edition')).to_have_count(0)
  page.get_by_test_id('title-new').click()
  page.locator('.pc-shortcuts').get_by_role('button',name='터미널',exact=True).click()
  terminal=page.locator('.pc-window[data-active=true] .terminal-form input')
  terminal.fill('echo my-first-draft > notes.txt');terminal.press('Enter')
  page.wait_for_function("JSON.parse(localStorage.getItem('codeshift-intro-demo-v1')).history.at(-1)?.command==='echo my-first-draft > notes.txt'")
  original=page.evaluate("localStorage.getItem('codeshift-intro-demo-v1')")
  page.get_by_test_id('tray-settings').click()
  page.get_by_role('button',name='타이틀로 돌아가기',exact=True).click()
  expect(page.get_by_test_id('title-continue')).to_be_enabled()
  page.reload(wait_until='networkidle')
  expect(page.get_by_test_id('title-continue')).to_be_enabled()
  page.get_by_test_id('title-new').click();expect(page.get_by_role('alertdialog')).to_be_visible()
  page.keyboard.press('Escape')
  assert page.evaluate("localStorage.getItem('codeshift-intro-demo-v1')")==original
  page.get_by_test_id('title-continue').click()
  page.get_by_test_id('tray-settings').click()
  page.get_by_role('button',name='진행 기록 초기화',exact=True).click()
  page.get_by_role('alertdialog').get_by_role('button',name='초기화하고 다시 시작',exact=True).click()
  expect(page.locator('.pc-shortcuts')).to_be_visible()
  page.get_by_test_id('tray-settings').click()
  page.get_by_role('button',name='타이틀로 돌아가기',exact=True).click()
  expect(page.get_by_test_id('title-continue')).to_be_disabled()
  page.reload(wait_until='networkidle');expect(page.get_by_test_id('title-new')).to_be_enabled()
  expect(page.get_by_test_id('title-continue')).to_be_disabled()
  expect(page.locator('.title-home-edition')).to_have_count(0)
  page.screenshot(path=str(OUT/'after-reset.png'))
  report.update({'unfinishedTypedWorkResumes':True,'cancelPreservesWork':True,'settingsResetClearsResume':True,'noDemoEyebrow':True})
  assert not report['errors'],report['errors']
  report['passed']=True
 finally:
  context.close();browser.close();(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
