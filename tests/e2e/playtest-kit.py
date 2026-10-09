"""Offline recorder smoke. Uses synthetic tool records, never claims novice results."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import json

root=Path(__file__).resolve().parents[2];out=root/'output'/'playtest-kit-qa';out.mkdir(parents=True,exist_ok=True)
url=(root/'tools'/'playtest'/'index.html').as_uri();key='codeshift-playtest-kit-v1'
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True)
 try:
  c=b.new_context(viewport={'width':1280,'height':900},accept_downloads=True);p=c.new_page();errors=[];network=[]
  p.on('pageerror',lambda e:errors.append(str(e)));p.on('request',lambda r:network.append(r.url) if r.url.startswith(('http:','https:')) else None)
  p.goto(url,wait_until='load');p.locator('#new').click();expect(p.locator('#record')).to_be_visible()
  assert p.locator('#task-desktop-outcome').input_value()=='untested';assert p.locator('#enjoyment').input_value()==''
  p.locator('#code').fill('TEST001');p.locator('#kind').select_option('self');p.locator('#consent').check();p.locator('#experience').select_option('experienced')
  p.locator('#sessionNotes').fill('Synthetic recorder QA only. "쉼표, 줄바꿈"\n두 번째 줄');p.locator('#nextAction').fill('=1+1')
  p.locator('#task-desktop-outcome').select_option('independent');p.locator('#task-desktop-help').select_option('none');p.locator('#task-desktop-evidence').fill('Synthetic QA control interaction, not participant evidence.')
  paths={}
  for format in ['json','csv']:
   with p.expect_download() as info:p.locator('#'+format).click()
   paths[format]=out/('synthetic.'+format);info.value.save_as(paths[format])
  report=json.loads(paths['json'].read_text(encoding='utf-8'));assert report['sessions'][0]['enjoyment'] is None
  p.reload(wait_until='load');assert p.locator('#code').input_value()=='TEST001'
  assert p.locator('#task-desktop-outcome').input_value()=='independent'
  p.locator('#import').set_input_files(paths['json']);expect(p.locator('#status')).to_contain_text('0회 기록')
  before=p.evaluate('(key)=>localStorage.getItem(key)',key)
  p.locator('#import').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':b'{broken'})
  expect(p.locator('#status')).to_contain_text('가져오기 실패');assert p.evaluate('(key)=>localStorage.getItem(key)',key)==before
  p.set_viewport_size({'width':390,'height':844});assert not p.evaluate('document.documentElement.scrollWidth>innerWidth')
  p.screenshot(path=str(out/'recorder-mobile.png'),full_page=True);c.close()
  for format in ['json','csv']:
   c=b.new_context();p=c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.goto(url,wait_until='load')
   p.locator('#import').set_input_files(paths[format]);expect(p.locator('#status')).to_contain_text('1회 기록')
   assert p.locator('#code').input_value()=='TEST001';assert p.locator('#nextAction').input_value()=='=1+1'
   assert p.locator('#sessionNotes').input_value()==report['sessions'][0]['sessionNotes'];c.close()
  assert not errors,errors;assert not network,network
  result={'offlineFileOpen':True,'emptyDefaults':True,'localReload':True,'jsonCSVImportExport':True,'malformedImportPreserves':True,'mobile390':True,'httpRequests':network,'pageErrors':errors,'syntheticToolTestOnly':True}
  (out/'report.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(result,ensure_ascii=False))
 finally:b.close()
