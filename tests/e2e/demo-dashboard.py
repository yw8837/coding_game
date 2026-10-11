"""Local Worker + real SQLite only. Synthetic sessions are not production visits."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE=os.environ.get('CODESHIFT_QA_BASE','http://127.0.0.1:5173').rstrip('/')
OUT=Path('output/launch-quality-20261010/dashboard');OUT.mkdir(parents=True,exist_ok=True)
OWNER={'oai-authenticated-user-id':'qa-owner','oai-authenticated-user-email':'qa-owner@example.invalid'}
report={'environment':'local Worker / synthetic QA only','errors':[]}
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='chrome',headless=True)
 context=browser.new_context(viewport={'width':1440,'height':960},locale='ko-KR')
 page=context.new_page();page.set_default_timeout(10000);page.on('pageerror',lambda e:report['errors'].append(str(e)))
 try:
  page.goto(BASE+'/admin',wait_until='networkidle');expect(page.get_by_text('ChatGPT로 로그인',exact=True)).to_be_visible()
  denied=context.request.get(BASE+'/api/admin/demo');assert denied.status==403
  assert 'no-store' in denied.headers['cache-control']
  outsider=pw.request.new_context(extra_http_headers={'oai-authenticated-user-id':'other','oai-authenticated-user-email':'other@example.invalid'})
  assert outsider.get(BASE+'/api/admin/demo').status==403;outsider.dispose()
  owner=pw.request.new_context(extra_http_headers=OWNER)
  initial=owner.get(BASE+'/api/admin/demo').json();assert 'summary'in initial,initial
  report['unauthorizedDenied']=True;print('authorization pass',flush=True)
  requests=[]
  page.on('request',lambda r: requests.append(r.url))
  page.goto(BASE+'/',wait_until='networkidle');page.get_by_test_id('title-settings').click();page.get_by_role('combobox',name='Language').select_option('ko')
  consent=page.get_by_test_id('demo-metrics-consent');expect(consent).not_to_be_checked()
  assert not any('/api/demo-metrics'in url for url in requests)
  with page.expect_response(lambda r:'/api/demo-metrics'in r.url and r.request.post_data_json.get('action')=='visit') as received:consent.check()
  assert received.value.status==200,received.value.text()
  sid=received.value.json()['session'];print('opt-in session created',flush=True)
  page.keyboard.press('Escape')
  with page.expect_response(lambda r:'/api/demo-metrics'in r.url and r.request.method=='POST' and r.request.post_data_json.get('mode')=='new',timeout=12000) as started:page.get_by_test_id('title-new').click()
  print('start response received',flush=True)
  assert started.value.status==200
  assert not started.value.json().get('skipped'),started.value.json()
  print('start body read',flush=True)
  totals=owner.get(BASE+'/api/admin/demo').json()['summary']
  assert totals['visits']==initial['summary']['visits']+1,totals
  assert totals['starts']==initial['summary']['starts']+1,totals
  report['visitAndStartRecorded']=True
  page.locator('.pc-tray-settings').click();consent.uncheck()
  page.locator('.demo-feedback-settings summary').click()
  textarea=page.locator('.demo-feedback-settings textarea')
  content='[Synthetic local QA] <script>window.badFeedback=true</script> The first step was unclear.'
  textarea.fill(content)
  with page.expect_response('**/api/demo-feedback') as sent:page.get_by_role('button',name='의견 보내기',exact=True).click()
  assert sent.value.status==200
  expect(page.locator('.demo-feedback-settings')).to_contain_text('보냈어요')
  report['feedbackReceived']=True
  headers={'Origin':BASE,'Content-Type':'application/json'}
  wrong=context.request.post(BASE+'/api/demo-metrics',headers={**headers,'Origin':'https://example.invalid'},data=json.dumps({'action':'visit','language':'ko'}));assert wrong.status==400
  oversized=context.request.post(BASE+'/api/demo-feedback',headers=headers,data='x'*6500);assert oversized.status==400,(oversized.status,oversized.text())
  bad=context.request.post(BASE+'/api/demo-metrics',headers=headers,data=json.dumps({'session':sid,'stage':'cafe-99-code','mode':'new','language':'ko','seconds':999}));assert bad.status==400
  bad=context.request.post(BASE+'/api/demo-metrics',headers=headers,data=json.dumps({'session':sid,'stage':'title','mode':'new','language':'ko','seconds':0,'code':'private code'}));assert bad.status==400
  report['invalidWritesRejected']=True
  before_count=len([url for url in requests if '/api/demo-metrics'in url])
  page.keyboard.press('Escape');page.locator('.quest-next button').click()
  page.wait_for_timeout(2200)  # A bounded negative assertion: pending stage upload stays cancelled.
  assert len([url for url in requests if '/api/demo-metrics'in url])==before_count
  page.reload(wait_until='networkidle');page.get_by_test_id('title-settings').click();expect(page.get_by_test_id('demo-metrics-consent')).not_to_be_checked()
  report['consentOffStopsCollection']=True
  admin=browser.new_context(viewport={'width':1440,'height':1100},extra_http_headers=OWNER)
  dash=admin.new_page();dash.on('pageerror',lambda e:report['errors'].append(str(e)))
  dash.goto(BASE+'/admin',wait_until='networkidle');expect(dash.locator('.demo-admin-feedback')).to_contain_text(content)
  assert dash.evaluate('window.badFeedback') is None
  dash.screenshot(path=str(OUT/'dashboard-local-qa.png'),full_page=True)
  dash.set_viewport_size({'width':390,'height':844});assert dash.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  dash.screenshot(path=str(OUT/'dashboard-mobile-local-qa.png'),full_page=True)
  assert not report['errors'],report['errors']
  report['passed']=True;admin.close();owner.dispose()
 except Exception:
  page.screenshot(path=str(OUT/'failure.png'),full_page=True);raise
 finally:
  (OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
  context.close();browser.close()
print(json.dumps(report,ensure_ascii=False))
