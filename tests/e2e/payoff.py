"""Earned success feedback: no fake progress, repeated payout, focus lock or forced hints."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import json, os

out=Path(os.environ.get('CODESHIFT_QA_DIR','output/0.13.1-qa'));out.mkdir(parents=True,exist_ok=True)
seeds=Path(os.environ.get('CODESHIFT_QA_SEEDS',str(out)))
KEY='codeshift-intro-demo-v1'
GOOD='function solve(input) { let n = input.quantity; let sum = 0; while (n >= 6) { sum += 10000; n -= 6; } return sum + n * 1800; }'
def saved(p):return p.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
reports=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True)
 try:
  for lang in ['ko','en','ja']:
   c=b.new_context(viewport={'width':1440,'height':960},reduced_motion='reduce' if lang=='ja' else 'no-preference')
   p=c.new_page();p.set_default_timeout(15000);errors=[]
   p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
   p.goto('http://127.0.0.1:5173/',wait_until='networkidle')
   seed=json.loads((seeds/f'{lang}-cafe-save.json').read_text(encoding='utf-8'))
   p.evaluate('({seed,lang,key})=>{localStorage.setItem(key,JSON.stringify(seed));localStorage.setItem("codeshift-language",lang)}',{'seed':seed,'lang':lang,'key':KEY})
   p.reload(wait_until='networkidle');p.locator('.pc-play').click();p.locator('.quest-next button').click()
   p.locator('.pc-window[data-active=true] .pc-window-buttons button').nth(3).click()
   p.get_by_test_id('career-job-bakery-price').click();p.get_by_test_id('career-accept').click();p.get_by_test_id('career-inspect').click()
   p.get_by_test_id('career-use-javascript').click();editor=p.get_by_test_id('career-js-editor').locator('textarea')
   editor.fill('function solve(input) { return 17; }');p.get_by_test_id('career-code-save').click();p.get_by_test_id('career-test').click()
   expect(p.get_by_test_id('career-impact')).to_have_count(0);expect(p.get_by_test_id('progress-moment')).to_have_count(0)
   p.locator('.career-work-tabs button').first.click();editor.fill(GOOD);p.get_by_test_id('career-code-save').click()
   credits=saved(p)['credits'];p.get_by_test_id('career-test').click()
   impact=p.get_by_test_id('career-impact');expect(impact).to_be_visible();expect(p.get_by_test_id('progress-moment')).to_have_attribute('data-tier','check')
   before=p.get_by_test_id('career-impact-before').all_text_contents();after=p.get_by_test_id('career-impact-after').all_text_contents()
   assert before and len(before)==len(after) and any(a!=b for a,b in zip(before,after)),(before,after)
   assert saved(p)['credits']==credits,'Checking must not pay'
   p.wait_for_function('()=>{const el=document.querySelector("[data-testid=career-impact]");if(!el)return false;const a=el.getBoundingClientRect(),b=el.closest(".career-main").getBoundingClientRect();return a.top>=b.top-2&&a.top<b.bottom}')
   if lang=='ja':assert p.get_by_test_id('progress-moment').evaluate('el=>getComputedStyle(el).animationName')=='none'
   p.screenshot(path=str(out/f'{lang}-payoff-check.png'),animations='disabled')
   expect(p.get_by_test_id('progress-moment')).to_have_count(0,timeout=5000)
   p.get_by_test_id('career-test').click();expect(p.get_by_test_id('progress-moment')).to_have_count(0)
   p.locator('.career-work-tabs button').first.click();editor.fill('function solve(input) { return 1; }')
   expect(impact).to_have_count(0);expect(p.get_by_test_id('career-test')).to_be_disabled()
   editor.fill(GOOD+'\n');p.get_by_test_id('career-code-save').click();p.get_by_test_id('career-test').click()
   p.get_by_test_id('career-reply-care').check();p.get_by_test_id('career-deliver').click()
   payoff=p.get_by_test_id('career-payoff');expect(payoff).to_be_visible();expect(p.get_by_test_id('progress-moment')).to_have_attribute('data-tier','delivery')
   assert saved(p)['credits']==credits+200
   p.wait_for_function('()=>{const el=document.querySelector("[data-testid=career-payoff]");if(!el)return false;const a=el.getBoundingClientRect(),b=el.closest(".career-main").getBoundingClientRect();return a.top>=b.top-2&&a.top<b.bottom}')
   p.screenshot(path=str(out/f'{lang}-payoff-delivery.png'),animations='disabled')
   p.set_viewport_size({'width':390,'height':844})
   close=p.locator('#mission-sidebar .panel-close')
   if close.is_visible():close.click()
   p.get_by_test_id('career-payoff-shop').scroll_into_view_if_needed()
   assert not p.evaluate('document.documentElement.scrollWidth>innerWidth')
   p.get_by_test_id('career-payoff-shop').click();expect(p.get_by_test_id('career-upgrade-recovery-kit')).to_be_visible()
   p.set_viewport_size({'width':1440,'height':960})
   p.reload(wait_until='networkidle');p.locator('.pc-play').click()
   p.locator('.pc-shortcuts').get_by_role('button',name={'ko':'의뢰 센터','en':'Contracts','ja':'依頼センター'}[lang],exact=True).click()
   p.get_by_test_id('career-job-bakery-price').click();expect(p.get_by_test_id('career-payoff')).to_be_visible()
   expect(p.get_by_test_id('progress-moment')).to_have_count(0);assert saved(p)['credits']==credits+200
   assert not errors,errors
   reports.append({'language':lang,'actualBeforeAfter':True,'failedAndUnsavedHidden':True,'repeatTestNoMoment':True,'earnedPayoutOnly':True,'scopedScroll':True,'shopAction':True,'reloadNoReplay':True,'mobile390':True,'reducedMotion':lang=='ja','errors':errors});c.close()
  (out/'payoff-report.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(reports,ensure_ascii=False))
 except Exception:
  p.screenshot(path=str(out/'payoff-failure.png'));raise
 finally:b.close()
