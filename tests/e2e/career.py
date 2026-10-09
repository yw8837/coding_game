"""UI-only contract completion from a cafe save produced by campaign.py.
Answers are read from the visible optional answer panel and typed into the editor.
This is an assisted functional playthrough, not a novice usability study.
"""
from playwright.sync_api import sync_playwright,expect
from pathlib import Path
import json,os

out=Path('output/steam-qa');out.mkdir(parents=True,exist_ok=True)
seed=json.loads(Path('output/pc-qa/completed-save.json').read_text(encoding='utf-8'))
ids=['bakery-price','library-loans','florist-stock','bike-hours','contacts-clean','clinic-form','market-filter','school-sort','workshop-slots','delivery-fees','museum-layout','bookstore-invoice','community-api','photo-cache','transit-logs','archive-backup','tutor-timezone','festival-report']
def state(p):return p.evaluate("JSON.parse(localStorage.getItem('codeshift-intro-demo-v1'))")
def active(p):return p.locator('.pc-window[data-active="true"]')
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True)
 reports=[]
 try:
  for lang in os.environ.get('CAREER_LANGUAGES','ko,en,ja').split(','):
   c=b.new_context(viewport={'width':1440,'height':960},locale={'ko':'ko-KR','en':'en-US','ja':'ja-JP'}[lang],record_video_dir=str(out/'raw') if lang=='ko' else None)
   p=c.new_page();p.set_default_timeout(12000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
   # A real UI-earned cafe save is the test fixture. No career progress is injected.
   p.goto('http://127.0.0.1:5173/',wait_until='networkidle')
   p.evaluate('({seed,lang})=>{localStorage.setItem("codeshift-intro-demo-v1",JSON.stringify(seed));localStorage.setItem("codeshift-language",lang)}',{'seed':seed,'lang':lang})
   p.reload(wait_until='networkidle');p.locator('.pc-play').click()
   assert p.locator('.pc-window:visible').count()==0
   p.locator('.quest-next button').click()
   # Maximize via real window control, not viewport/state mutation.
   active(p).locator('.pc-window-buttons button').nth(3).click()
   for index,job in enumerate(ids):
    w=active(p)
    w.get_by_test_id('career-job-'+job).click()
    w.get_by_test_id('career-accept').click();w.get_by_test_id('career-inspect').click()
    if index==0:
     w.get_by_test_id('career-test').click();assert not state(p)['gameplay']['career']['proofs'][job]['passed']
     w.get_by_role('tab').nth(0).click()
     w.locator('.career-code-input textarea').fill('{broken')
     w.get_by_test_id('career-test').click();assert not state(p)['gameplay']['career']['proofs'][job]['passed']
    w.locator('.career-answer>button').click()
    answers=[]
    for answer in w.locator('.career-answer>div>div').all():
     answers.append((answer.locator('strong').inner_text(),answer.locator('pre').inner_text()))
    assert answers,job
    w.get_by_role('tab').nth(0).click()
    for filename,source in answers:
     w.locator('.career-file-tabs button').filter(has=p.get_by_text(filename,exact=True)).click()
     w.locator('.career-code-input textarea').fill(source)
    w.locator('.career-answer>button').click()
    w.get_by_test_id('career-test').click()
    assert state(p)['gameplay']['career']['proofs'][job]['passed'],job
    if index in [0,6,12]:p.screenshot(path=str(out/f'{lang}-job-{index+1}.png'))
    w.get_by_test_id('career-reply-'+('care' if index%2==0 else 'craft')).check()
    before=state(p)['credits'];w.get_by_test_id('career-deliver').click()
    assert len(state(p)['gameplay']['career']['completed'])==index+1
    assert state(p)['credits']==before+([200,350,550][index//6])
   active(p).locator('.career-client-reply>.primary-button').click()
   active(p).get_by_test_id('career-ending').click()
   assert state(p)['gameplay']['career']['ending']=='balanced'
   assert state(p)['credits']==seed['credits']+6600
   p.screenshot(path=str(out/f'{lang}-ending.png'))
   ending_save=state(p)
   # Buy all three functioning upgrades; duplicate purchase remains disabled.
   active(p).locator('.career-list-footer button').nth(0).click()
   for upgrade in ['recovery-kit','second-screen','studio-sign']:
    button=active(p).get_by_test_id('career-upgrade-'+upgrade);button.click();expect(button).to_be_disabled()
   assert state(p)['credits']==seed['credits']+6600-1750
   p.locator('.pc-show-desktop').click();assert p.locator('.pc-desktop-caption span').inner_text()!='SHIFT OS'
   p.reload(wait_until='networkidle');p.locator('.pc-play').click()
   assert state(p)['gameplay']['career']['ending']=='balanced'
   assert p.locator('html').get_attribute('lang')==lang
   # Same campaign has usable compact layout; no clipped page-wide content.
   p.set_viewport_size({'width':390,'height':844});p.locator('.quest-next button').click()
   assert not p.evaluate('document.documentElement.scrollWidth>innerWidth')
   p.screenshot(path=str(out/f'{lang}-ending-mobile.png'))
   assert not errors,errors
   reports.append({'language':lang,'jobs':18,'ending':'balanced','creditsBeforeUpgrades':ending_save['credits'],'upgrades':3,'errors':errors,'assisted':True})
   if lang=='ko':(out/'completed-career-save.json').write_text(json.dumps(ending_save,ensure_ascii=False),encoding='utf-8')
   c.close()
  (out/'career-report.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding='utf-8')
  print(json.dumps(reports,ensure_ascii=False))
 except Exception:
  p.screenshot(path=str(out/'career-failure.png'));(out/'career-failure.txt').write_text(p.locator('body').inner_text(),encoding='utf-8');raise
 finally:b.close()
