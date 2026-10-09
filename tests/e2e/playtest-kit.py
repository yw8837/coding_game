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
  self_notes='Synthetic recorder QA only. "쉼표, 줄바꿈"\n두 번째 줄'
  p.locator('#sessionNotes').fill(self_notes);p.locator('#nextAction').fill('=1+1')
  p.locator('#task-desktop-outcome').select_option('independent');p.locator('#task-desktop-help').select_option('none');p.locator('#task-desktop-evidence').fill('Synthetic QA control interaction, not participant evidence.')
  # Keep the old v1 self-only exports as legacy import fixtures.
  legacy_paths={}
  for format in ['json','csv']:
   with p.expect_download() as info:p.locator('#'+format).click()
   legacy_paths[format]=out/('synthetic-legacy.'+format);info.value.save_as(legacy_paths[format])
  legacy_report=json.loads(legacy_paths['json'].read_text(encoding='utf-8'));assert legacy_report['sessions'][0]['enjoyment'] is None
  p.reload(wait_until='load');assert p.locator('#code').input_value()=='TEST001'
  assert p.locator('#task-desktop-outcome').input_value()=='independent'
  p.locator('#import').set_input_files(legacy_paths['json']);expect(p.locator('#status')).to_contain_text('0회 기록')
  # Older v1 tools recorded experienced participants under kind=beginner.
  legacy_expert=json.loads(json.dumps(legacy_report));legacy_expert['sessions'][0].update(id='synthetic_legacy_expert',code='TEST003',kind='beginner',sessionNotes='Synthetic legacy experienced classification only.')
  p.locator('#import').set_input_files({'name':'legacy-expert.json','mimeType':'application/json','buffer':json.dumps(legacy_expert).encode('utf-8')})
  expect(p.locator('#status')).to_contain_text('1회 기록')
  p.locator('#new').click();p.locator('#code').fill('TEST002');p.locator('#kind').select_option('beginner');p.locator('#experience').select_option('none');p.locator('#consent').check()
  beginner_id=p.locator('#sessions').input_value()
  p.locator('#new').click();p.locator('#code').fill('TEST004');p.locator('#kind').select_option('experienced');p.locator('#experience').select_option('experienced');p.locator('#consent').check()
  expert_id=p.locator('#sessions').input_value()
  expert_notes='Synthetic optional observations only: 보상 사용처 발견·사용 / 계속할 마음 / 반복과 선택\n"다른 의뢰, 다음 작업"'
  reward_evidence='Synthetic QA only: 해결로 생긴 변화·보상 이해와 사용처 확인, 실제 참가자 결과 아님.'
  alternate_evidence='Synthetic QA only: 예시와 다른 해법·기대 결과·지원 문법 오류.'
  p.locator('#sessionNotes').fill(expert_notes);p.locator('#task-requests-evidence').fill(reward_evidence);p.locator('#task-transfer-evidence').fill(alternate_evidence)
  p.locator('#transferResponse').fill('Synthetic expert alternate solution note only.')
  p.locator('#record button[type="submit"]').click()
  expect(p.locator('#overview')).to_contain_text('초보자 1명 · 경험자 2명')
  for text in ['본인 1회:', '초보자 구분 1회:', '경험자 구분 2회:']:expect(p.locator('#overview')).to_contain_text(text)
  assert '경험자 구분' in p.locator('#sessions option:checked').inner_text()
  assert '보상 사용처' in p.locator('#task-requests-evidence').get_attribute('placeholder')
  assert '다른 해법' in p.locator('#task-transfer-evidence').get_attribute('placeholder')
  p.locator('#sessions').select_option(beginner_id);expect(p.locator('#kind')).to_have_value('beginner')
  p.locator('#sessions').select_option('synthetic_legacy_expert');expect(p.locator('#kind')).to_have_value('beginner')
  assert '경험자 구분' in p.locator('#sessions option:checked').inner_text()
  p.locator('#sessions').select_option(expert_id);p.reload(wait_until='load')
  p.locator('#sessions').select_option(expert_id);expect(p.locator('#kind')).to_have_value('experienced')
  assert p.locator('#sessionNotes').input_value()==expert_notes
  assert p.locator('#task-requests-evidence').input_value()==reward_evidence
  assert p.locator('#task-transfer-evidence').input_value()==alternate_evidence
  paths={}
  for format in ['json','csv']:
   with p.expect_download() as info:p.locator('#'+format).click()
   paths[format]=out/('synthetic.'+format);info.value.save_as(paths[format])
  report=json.loads(paths['json'].read_text(encoding='utf-8'));assert len(report['sessions'])==4
  assert all(s['enjoyment'] is None for s in report['sessions'])
  assert next(s for s in report['sessions'] if s['id']=='synthetic_legacy_expert')['kind']=='beginner'
  p.locator('#import').set_input_files(paths['json']);expect(p.locator('#status')).to_contain_text('0회 기록')
  before=p.evaluate('(key)=>localStorage.getItem(key)',key)
  p.locator('#import').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':b'{broken'})
  expect(p.locator('#status')).to_contain_text('가져오기 실패');assert p.evaluate('(key)=>localStorage.getItem(key)',key)==before
  p.set_viewport_size({'width':390,'height':844});assert not p.evaluate('document.documentElement.scrollWidth>innerWidth')
  p.screenshot(path=str(out/'recorder-mobile.png'),full_page=True);c.close()
  for format in ['json','csv']:
   c=b.new_context();p=c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.goto(url,wait_until='load')
   p.locator('#import').set_input_files(legacy_paths[format]);expect(p.locator('#status')).to_contain_text('1회 기록')
   assert p.locator('#code').input_value()=='TEST001';assert p.locator('#nextAction').input_value()=='=1+1'
   assert p.locator('#sessionNotes').input_value()==self_notes
   p.locator('#import').set_input_files(paths[format]);expect(p.locator('#status')).to_contain_text('3회 기록')
   for text in ['본인 1회:', '초보자 구분 1회:', '경험자 구분 2회:']:expect(p.locator('#overview')).to_contain_text(text)
   p.locator('#sessions').select_option(expert_id);expect(p.locator('#kind')).to_have_value('experienced')
   assert p.locator('#sessionNotes').input_value()==expert_notes
   assert p.locator('#task-requests-evidence').input_value()==reward_evidence
   assert p.locator('#task-transfer-evidence').input_value()==alternate_evidence
   assert p.locator('#transferResponse').input_value()=='Synthetic expert alternate solution note only.'
   p.reload(wait_until='load');p.locator('#sessions').select_option(expert_id)
   assert p.locator('#sessionNotes').input_value()==expert_notes;c.close()
  # Hold file I/O while an observer edits and adds a session. Import must merge
  # against the latest UI record, not a snapshot from before the asynchronous read.
  c=b.new_context();p=c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.goto(url,wait_until='load')
  p.locator('#new').click();p.locator('#code').fill('RACE001');race_id=p.locator('#sessions').input_value()
  p.evaluate('''() => {
    const original = Blob.prototype.text;
    window.importReadStarted = false;
    Blob.prototype.text = async function () {
      const raw = await original.call(this);
      window.importReadStarted = true;
      await new Promise(resolve => { window.releaseImportRead = resolve; });
      return raw;
    };
  }''')
  p.locator('#import').set_input_files(legacy_paths['json']);p.wait_for_function('window.importReadStarted')
  p.locator('#sessionNotes').fill('Synthetic edit made while the imported file is reading.')
  p.locator('#new').click();p.locator('#code').fill('RACE002')
  p.evaluate('window.releaseImportRead()');expect(p.locator('#status')).to_contain_text('1회 기록')
  race=json.loads(p.evaluate('(key)=>localStorage.getItem(key)',key))
  assert {s['code'] for s in race['sessions']}=={'RACE001','RACE002','TEST001'}
  assert next(s for s in race['sessions'] if s['id']==race_id)['sessionNotes']=='Synthetic edit made while the imported file is reading.'
  c.close()
  assert not errors,errors;assert not network,network
  result={'offlineFileOpen':True,'emptyDefaults':True,'localReload':True,'jsonCSVImportExport':True,'legacyV1Import':True,'experiencedClassification':True,'separateGroupOverview':True,'optionalObservationReloadAndImport':True,'malformedImportPreserves':True,'mobile390':True,'httpRequests':network,'pageErrors':errors,'syntheticToolTestOnly':True}
  result['importPreservesEditsDuringFileRead']=True
  (out/'report.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(result,ensure_ascii=False))
 finally:b.close()
