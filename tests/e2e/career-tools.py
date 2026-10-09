from pathlib import Path
from playwright.sync_api import sync_playwright,expect
import json

out=Path('output/steam-qa');out.mkdir(parents=True,exist_ok=True)
seed=json.loads(Path('output/pc-qa/completed-save.json').read_text(encoding='utf-8'))
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True)
 try:
  p=b.new_page(viewport={'width':1440,'height':960},locale='ko-KR');p.set_default_timeout(10000)
  p.goto('http://127.0.0.1:5173/',wait_until='networkidle');p.evaluate('(s)=>localStorage.setItem("codeshift-intro-demo-v1",JSON.stringify(s))',seed);p.reload(wait_until='networkidle');p.locator('.pc-play').click();p.locator('.quest-next button').click()
  w=p.locator('.pc-window[data-active="true"]');w.locator('.pc-window-buttons button').nth(3).click()
  w.get_by_test_id('career-job-bakery-price').click();w.get_by_test_id('career-accept').click();w.get_by_test_id('career-inspect').click();w.get_by_test_id('career-code-mode').click()
  w.get_by_test_id('career-tools-button').click()
  for item in ['recovery-kit','second-screen']:w.get_by_test_id('career-upgrade-'+item).click()
  # Following the persistent quest also restores the work view from the shop.
  p.locator('.quest-next button').click();expect(w.locator('.career-editor')).to_be_visible()
  expect(w.locator('.career-split .career-preview')).to_be_visible()
  w.get_by_role('button',name='현재 파일 보관',exact=True).click();original=w.locator('.career-code-input textarea').input_value()
  w.locator('.career-code-input textarea').fill('{broken');w.get_by_test_id('career-test').click();w.get_by_role('tab',name='파일',exact=True).click()
  w.get_by_role('button',name='실행 취소',exact=True).click();assert w.locator('.career-code-input textarea').input_value()==original
  w.locator('.career-code-input textarea').fill('{broken again');w.get_by_role('button',name='보관한 파일 복원',exact=True).click();assert w.locator('.career-code-input textarea').input_value()==original
  # JSON boolean completion replaces only the word and preserves punctuation.
  field=w.locator('.career-code-input textarea');field.fill('{"enabled": tr');field.press('End');field.press('Control+Space');field.press('Tab');assert field.input_value()=='{"enabled": true'
  w.get_by_role('button',name='보관한 파일 복원',exact=True).click()
  # A multi-file job opened from This PC selects exactly the requested file.
  w.get_by_test_id('career-job-contacts-clean').click();w.get_by_test_id('career-accept').click();w.get_by_test_id('career-inspect').click()
  p.locator('.pc-taskbar').get_by_role('button',name='내 PC',exact=True).click();w.get_by_role('button',name='고객 의뢰',exact=True).click()
  w.locator('.computer-file-row').filter(has=p.get_by_text('clean.json',exact=True)).click()
  expect(w.locator('.career-code-input textarea')).to_be_visible()
  expect(w.locator('.career-file-tabs button[aria-pressed="true"]')).to_contain_text('clean.json')
  # Invalid JSON imports preserve current gameplay and show an actionable error.
  p.locator('.pc-language').click();p.locator('.save-tools input[type=file]').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':b'{invalid'})
  expect(p.locator('.save-tools [role=alert]')).to_be_visible()
  assert p.evaluate('JSON.parse(localStorage.getItem("codeshift-intro-demo-v1")).gameplay.career.accepted.includes("contacts-clean")')
  p.screenshot(path=str(out/'tools-import-guard.png'),animations='disabled')
  result={'checkpointRestore':True,'undoAcrossTabs':True,'jsonCompletion':True,'secondScreen':True,'computerFileTarget':True,'invalidImportPreserved':True}
  (out/'tools-report.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result))
 except Exception:p.screenshot(path=str(out/'tools-failure.png'));raise
 finally:b.close()
