"""Ending credits preserve the earned release and allow unfinished work afterward."""
from pathlib import Path
import json, os
from playwright.sync_api import sync_playwright, expect

OUT=Path(os.environ.get('CODESHIFT_QA_DIR','output/launch-quality-20261010/web'))
SEEDS=Path(os.environ.get('CODESHIFT_QA_SEEDS',str(OUT)))
OUT.mkdir(parents=True,exist_ok=True)
KEY='codeshift-intro-demo-v1'
reports=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='chrome',headless=True)
 try:
  for lang in ['ko','en','ja']:
   context=browser.new_context(viewport={'width':1366,'height':768})
   page=context.new_page();page.set_default_timeout(12000);errors=[]
   page.on('pageerror',lambda error:errors.append(str(error)))
   try:
    seed=json.loads((SEEDS/f'{lang}-chosen-route-save.json').read_text(encoding='utf-8'))
    page.goto('http://127.0.0.1:5173/',wait_until='networkidle')
    page.evaluate('({key,seed,lang})=>{localStorage.setItem(key,JSON.stringify(seed));localStorage.setItem("codeshift-language",lang)}',{'key':KEY,'seed':seed,'lang':lang})
    page.reload(wait_until='networkidle');page.locator('.pc-play').click();page.locator('.quest-next button').click()
    expect(page.get_by_test_id('final-letter')).to_be_visible()
    before=page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
    page.get_by_test_id('ending-credits-open').click()
    credits=page.get_by_test_id('ending-credits');expect(credits).to_be_visible()
    expect(credits.get_by_test_id('credits-continue')).to_contain_text('6')
    page.wait_for_function('document.querySelector("[data-testid=credits-roll]").scrollTop>5')
    page.get_by_test_id('credits-pause').click();expect(page.get_by_test_id('credits-pause')).to_have_attribute('aria-pressed','true')
    scroll=page.get_by_test_id('credits-roll').evaluate('el=>el.scrollTop')
    page.keyboard.press('Tab');assert page.get_by_test_id('credits-roll').evaluate('el=>el.scrollTop')<=scroll+2
    page.screenshot(path=str(OUT/f'{lang}-ending-credits.png'),animations='disabled')
    page.keyboard.press('Escape');expect(credits).to_have_count(0);expect(page.get_by_test_id('final-letter')).to_be_visible()
    page.emulate_media(reduced_motion='reduce');page.get_by_test_id('ending-credits-open').click()
    page.set_viewport_size({'width':390,'height':844})
    expect(page.get_by_test_id('credits-continue')).to_be_in_viewport()
    expect(page.get_by_test_id('credits-desktop')).to_be_in_viewport()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    assert page.get_by_test_id('credits-roll').evaluate('el=>el.scrollTop')==0
    page.screenshot(path=str(OUT/f'{lang}-ending-credits-390.png'),animations='disabled')
    after=page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
    assert after['credits']==before['credits'] and after['gameplay']['career']==before['gameplay']['career']
    page.get_by_test_id('credits-desktop').click();expect(credits).to_have_count(0)
    assert page.locator('.pc-window:visible').count()==0
    page.set_viewport_size({'width':1366,'height':768});page.locator('.pc-shortcuts').get_by_role('button',name={'ko':'의뢰 센터','en':'Contracts','ja':'依頼センター'}[lang],exact=True).click()
    page.get_by_test_id('ending-credits-open').click();page.get_by_test_id('credits-continue').click()
    page.get_by_test_id('career-job-florist-stock').click();page.get_by_test_id('career-accept').click()
    page.get_by_test_id('career-inspect').click();page.get_by_test_id('career-code-mode').click()
    # Use the job's opt-in example to verify the post-ending save/check/deliver path.
    page.locator('.career-answer>button').click()
    answers=page.locator('.career-answer>div>div').evaluate_all('els=>els.map(el=>[el.querySelector("strong").textContent,el.querySelector("pre").textContent])')
    for name,source in answers:
     page.locator('.career-file-tabs button').filter(has=page.get_by_text(name,exact=True)).click()
     page.locator('.career-code-input textarea').fill(source)
    page.get_by_test_id('career-test').click();page.get_by_test_id('career-reply-care').check();page.get_by_test_id('career-deliver').click()
    saved=page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
    assert len(saved['gameplay']['career']['completed'])==13
    assert saved['gameplay']['career']['ending']==before['gameplay']['career']['ending']
    assert saved['gameplay']['career']['endingJobs']==before['gameplay']['career']['endingJobs']
    assert saved['gameplay']['career']['release']['published']==before['gameplay']['career']['release']['published']
    assert saved['credits']>before['credits']
    page.reload(wait_until='networkidle');page.locator('.pc-play').click()
    restored=page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
    assert restored['credits']==saved['credits'] and len(restored['gameplay']['career']['completed'])==13
    assert not errors,errors
    reports.append({'language':lang,'scrollAndPause':True,'escapeReturnsToLetter':True,'reducedMotion':True,'mobile390':True,'creditsReplayNoReward':True,'desktopReturn':True,'unfinishedJobDeliveredAfterCredits':True,'endingAndReleasePreserved':True,'reloadPreserved':True,'errors':errors})
   except Exception:
    page.screenshot(path=str(OUT/f'{lang}-credits-failure.png'),animations='disabled');raise
   finally:context.close()
 finally:browser.close()
(OUT/'ending-credits-report.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(reports,ensure_ascii=False))
