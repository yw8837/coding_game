"""Production hydration, image loading and input readiness with real browser errors."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import json, os

out=Path(os.environ.get('CODESHIFT_QA_DIR','output/built-smoke'));out.mkdir(parents=True,exist_ok=True)
report={'pageErrors':[],'consoleErrors':[],'failedRequests':[],'images':[]}
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='chrome',headless=True)
 page=browser.new_page(viewport={'width':1440,'height':960},locale='ko-KR')
 page.on('pageerror',lambda error:report['pageErrors'].append(str(error)))
 page.on('console',lambda message:report['consoleErrors'].append(message.text) if message.type=='error' else None)
 page.on('requestfailed',lambda request:report['failedRequests'].append({'url':request.url,'error':request.failure}))
 try:
  response=page.goto('http://127.0.0.1:5173/',wait_until='load');assert response.status==200
  expect(page.locator('.pc-play')).to_be_enabled(timeout=15000)
  image=page.locator('.title-environment')
  expect(image).to_have_attribute('width','1672')
  page.wait_for_function("document.querySelector('.title-environment').complete && document.querySelector('.title-environment').naturalWidth===1672")
  report['images'].append(image.evaluate('el=>({src:el.currentSrc,width:el.naturalWidth,height:el.naturalHeight})'))
  page.get_by_test_id('title-settings').click();page.get_by_role('combobox',name='Language').select_option('ko');page.keyboard.press('Escape')
  expect(page.locator('.pc-play')).to_have_text('새로 시작')
  page.locator('.pc-play').click();assert page.locator('.pc-window:visible').count()==0
  assert not report['pageErrors'] and not report['consoleErrors'] and not report['failedRequests'],report
  report['passed']=True
 except Exception:
  report['passed']=False;page.screenshot(path=str(out/'built-smoke-failure.png'));raise
 finally:
  (out/'built-smoke.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False));browser.close()
