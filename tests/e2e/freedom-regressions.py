from pathlib import Path
from playwright.sync_api import sync_playwright,expect
import json,os
out=Path(os.environ.get('CODESHIFT_QA_DIR','output/0.13-qa'));out.mkdir(parents=True,exist_ok=True)
KEY='codeshift-intro-demo-v1'
def saved(p):return p.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
def load(p,s):
 p.evaluate('({s,key})=>{localStorage.setItem(key,JSON.stringify(s));localStorage.setItem("codeshift-language","ko")}',{'s':s,'key':KEY});p.reload(wait_until='networkidle');p.locator('.pc-play').click();p.locator('.pc-shortcuts').get_by_role('button',name='의뢰 센터',exact=True).click()
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True);p=b.new_page(viewport={'width':1440,'height':960});p.set_default_timeout(15000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
 try:
  p.goto('http://127.0.0.1:5173/',wait_until='networkidle');load(p,json.loads(Path('output/0.12-qa/ko-cafe-save.json').read_text(encoding='utf-8')))
  p.get_by_test_id('career-job-bakery-price').click();p.get_by_test_id('career-accept').click();p.get_by_test_id('career-inspect').click();p.get_by_test_id('career-use-javascript').click()
  editor=p.get_by_test_id('career-js-editor').locator('textarea');draft='function solve(input) { return 17; }';editor.fill(draft)
  expect(p.get_by_test_id('career-test')).to_be_disabled();expect(p.get_by_test_id('career-use-config')).to_be_disabled()
  p.get_by_test_id('career-job-library-loans').click();p.get_by_test_id('career-job-bakery-price').click();expect(editor).to_have_value(draft);expect(p.get_by_test_id('career-test')).to_be_disabled()
  p.get_by_test_id('career-code-save').click();expect(p.get_by_test_id('career-test')).to_be_enabled()
  # Simulate a malformed external file in an isolated imported save, not a user profile.
  s=saved(p);s['machines']['local']['files']['/home/dev/jobs/bakery-price/solution-mode.json']='broken JSON';load(p,s);p.get_by_test_id('career-job-bakery-price').click()
  expect(p.get_by_test_id('career-js-editor')).to_be_visible();p.get_by_test_id('career-use-config').click();expect(p.get_by_test_id('career-learning')).to_be_visible()
  p.get_by_test_id('career-job-florist-stock').click();p.get_by_test_id('career-accept').click();p.get_by_test_id('career-inspect').click();s=saved(p)
  s['machines']['local']['files']['/home/dev/jobs/florist-stock/solution.js']='';s['machines']['local']['files']['/home/dev/jobs/florist-stock/solution-mode.json']='broken JSON'
  load(p,s);p.get_by_test_id('career-job-florist-stock').click();expect(p.get_by_test_id('career-learning')).to_be_visible()
  expect(p.get_by_test_id('career-code')).to_have_count(0)
  load(p,json.loads((out/'ko-chosen-route-save.json').read_text(encoding='utf-8')))
  p.get_by_test_id('career-release-button').click();p.get_by_test_id('release-load-places').click()
  expect(p.get_by_test_id('release-results').locator('li')).to_have_count(3)
  assert p.get_by_test_id('release-results').locator('p').first.evaluate('el=>getComputedStyle(el).color')=='rgb(64, 89, 77)'
  p.get_by_test_id('release-preview-title').scroll_into_view_if_needed();p.screenshot(path=str(out/'personal-release-final.png'),animations='disabled')
  assert not errors,errors
  report={'unsavedDraftSurvivesJobNavigation':True,'unsavedBlocksChecksAndModeSwitch':True,'malformedModeRecovery':True,'unsupportedJobEditorPreserved':True,'previewCardContrast':True,'errors':errors}
  (out/'freedom-regressions.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report))
 except Exception:
  p.screenshot(path=str(out/'regressions-failure.png'));raise
 finally:b.close()
