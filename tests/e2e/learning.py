"""Exercise all curated learning controls through the visible UI, with optional help."""
from playwright.sync_api import sync_playwright,expect
from pathlib import Path
import json
out=Path('output/0.10-qa');reports=[]
def state(p):return p.evaluate("JSON.parse(localStorage.getItem('codeshift-intro-demo-v1'))")
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True)
 try:
  for lang in ['ko','en','ja']:
   seed=json.loads((out/f'{lang}-cafe-save.json').read_text(encoding='utf-8'))
   c=b.new_context(viewport={'width':1440,'height':960});p=c.new_page();p.set_default_timeout(12000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
   p.goto('http://127.0.0.1:5173/',wait_until='networkidle');p.evaluate('({seed,lang})=>{localStorage.setItem("codeshift-intro-demo-v1",JSON.stringify(seed));localStorage.setItem("codeshift-language",lang)}',{'seed':seed,'lang':lang});p.reload(wait_until='networkidle');p.locator('.pc-play').click();p.locator('.quest-next button').click()
   p.locator('.pc-window[data-active=true] .pc-window-buttons button').nth(3).click()
   ids=p.locator('[data-testid^=career-job-]').evaluate_all('els=>els.map(e=>e.dataset.testid)')
   for index,id in enumerate(ids):
    p.get_by_test_id(id).click();p.get_by_test_id('career-accept').click();p.get_by_test_id('career-inspect').click()
    for attempt in range(24):
     test=p.get_by_test_id('career-learning-test')
     if test.is_visible():test.click();break
     feedback=p.get_by_test_id('career-learning-feedback')
     if 'done' not in (feedback.get_attribute('class') or ''):
      if index>=6:p.get_by_test_id('career-learning-help').click()
      choices=p.locator('[data-testid^=career-learning-choice-]')
      for choice in choices.all():
       choice.click()
       if index>=6:p.get_by_test_id('career-learning-apply').click()
       if 'done' in (feedback.get_attribute('class') or ''):break
      assert 'done' in (feedback.get_attribute('class') or ''),(lang,id)
     nxt=p.get_by_test_id('career-learning-next')
     if nxt.is_visible():nxt.click()
    else:raise AssertionError('No bounded completion: '+id)
    assert state(p)['gameplay']['career']['proofs'][id.removeprefix('career-job-')]['passed']
    if index in [0,6,12]:
     # Reopen file view to capture the default learning surface.
     p.get_by_role('tab').nth(0).click();p.screenshot(path=str(out/f'{lang}-learning-act-{index//6+1}.png'),animations='disabled')
     p.set_viewport_size({'width':390,'height':844});assert not p.evaluate('document.documentElement.scrollWidth>innerWidth');p.screenshot(path=str(out/f'{lang}-learning-act-{index//6+1}-mobile.png'),animations='disabled');p.set_viewport_size({'width':1440,'height':960})
    p.get_by_test_id('career-reply-'+('care' if index%2==0 else 'craft')).check();p.get_by_test_id('career-deliver').click()
    assert len(state(p)['gameplay']['career']['completed'])==index+1
   p.get_by_test_id('career-final-project').click();p.get_by_test_id('release-start').click()
   # A supported uppercase heading must remain editable after switching modes.
   p.get_by_test_id('release-code-mode').click();p.locator('.release-code textarea').fill('<H1>Untitled</H1>\n');p.get_by_test_id('release-code-mode').click()
   for value in ['My neighborhood','100%','/api/places','true']:
    p.get_by_test_id('release-token').fill(value);p.get_by_test_id('release-apply').click()
   p.get_by_test_id('release-test').click();p.get_by_test_id('release-build').click();p.get_by_test_id('release-publish').click();p.get_by_test_id('release-letter').click();p.get_by_test_id('career-ending').click();expect(p.get_by_test_id('final-letter')).to_be_visible()
   assert state(p)['gameplay']['career']['ending']=='balanced';assert not errors,errors
   p.screenshot(path=str(out/f'{lang}-learned-release-ending.png'),animations='disabled');reports.append({'language':lang,'jobs':18,'learningPathWithHelp':True,'uppercaseHeadingRecovery':True,'firstRelease':'1.0.0','newEnding':'balanced','errors':errors})
   if lang=='ko':(out/'completed-learning-save.json').write_text(json.dumps(state(p),ensure_ascii=False),encoding='utf-8')
   c.close()
  (out/'learning-report.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(reports,ensure_ascii=False))
 except Exception:
  p.screenshot(path=str(out/'learning-failure.png'));(out/'learning-failure.txt').write_text(p.locator('body').inner_text(),encoding='utf-8');raise
 finally:b.close()
