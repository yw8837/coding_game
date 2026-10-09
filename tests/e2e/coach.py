"""Assisted UI playthrough of the default game-first cafe path, with real checks.
Not a user learning study. One browser process, three sequential locales.
"""
from playwright.sync_api import sync_playwright,expect
from pathlib import Path
import json, os
out=Path(os.environ.get('CODESHIFT_QA_DIR','output/0.10-qa'));out.mkdir(parents=True,exist_ok=True)
def state(p): return p.evaluate("JSON.parse(localStorage.getItem('codeshift-intro-demo-v1'))")
def click(p,id):p.get_by_test_id(id).click()
def finish(p):
 click(p,'coach-test');p.get_by_test_id('coach-deliver').wait_for();click(p,'coach-deliver')
 p.locator('[role=dialog] .primary-button').click()
def write(p,value):p.get_by_test_id('coach-answer').fill(value);click(p,'coach-apply')
def width(p,value,save=True):
 control=p.get_by_test_id('coach-width');control.focus();control.press('Home')
 for _ in range((value-50)//5):control.press('ArrowRight')
 if save:click(p,'coach-apply')
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True);reports=[]
 try:
  for lang,locale in [('ko','ko-KR'),('en','en-US'),('ja','ja-JP')]:
   c=b.new_context(viewport={'width':1440,'height':960},locale=locale);p=c.new_page();p.set_default_timeout(12000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
   p.goto('http://127.0.0.1:5173/',wait_until='networkidle');p.get_by_role('combobox',name='Language').select_option(lang)
   p.locator('.pc-play').click();assert p.locator('.pc-window:visible').count()==0
   p.locator('.pc-shortcuts button').filter(has=p.locator('svg.lucide-message-circle')).click()
   p.locator('.message-body>.primary-button').click();click(p,'coach-prepare');click(p,'coach-inspect')
   # Typed text edits the actual source. A click alone cannot solve the sign.
   assert p.locator('.coach-hint').count()==0
   original=p.get_by_test_id('coach-name').input_value();click(p,'coach-hint-toggle');assert p.locator('.coach-hint').is_visible()
   p.screenshot(path=str(out/f'{lang}-hint-open.png'))
   assert p.get_by_test_id('coach-name').input_value()==original;click(p,'coach-hint-toggle');assert p.locator('.coach-hint').count()==0
   p.screenshot(path=str(out/f'{lang}-hint-closed.png'))
   p.get_by_test_id('coach-name').fill('');assert p.get_by_test_id('coach-apply').is_disabled()
   p.get_by_test_id('coach-name').fill('달빛 빵집');click(p,'coach-apply');assert p.locator('.coach-retry').is_visible();assert p.locator('.coach-hint').count()==0
   assert '달빛 빵집' in json.dumps(state(p)['machines']['local']['files'],ensure_ascii=False)
   p.get_by_test_id('coach-name').fill({'ko':'모노 카페','en':'Mono Cafe','ja':'モノカフェ'}[lang])
   p.screenshot(path=str(out/f'{lang}-sign-edit.png'));click(p,'coach-apply')
   p.screenshot(path=str(out/f'{lang}-first-discovery.png'))
   width(p,130);assert p.locator('.coach-retry').is_visible();assert p.locator('.coach-hint').count()==0
   width(p,100,save=False)
   if lang=='ko':
    p.set_viewport_size({'width':390,'height':844});p.locator('#mission-sidebar .panel-close').click()
    p.locator('.cafe-coach').evaluate('(el)=>el.scrollTop=0');p.screenshot(path=str(out/'ko-direct-mobile390.png'))
    assert p.locator('.cafe-coach').evaluate('(el)=>el.scrollWidth<=el.clientWidth+1')
    p.set_viewport_size({'width':1440,'height':960})
   click(p,'coach-apply');finish(p)
   p.locator('.message-body>.primary-button').click();click(p,'coach-inspect');assert p.locator('.coach-retry').is_visible()
   for _ in range(3):click(p,'coach-add-cup')
   assert p.get_by_test_id('coach-total').inner_text()=='4,503';click(p,'coach-inspect')
   write(p,'-');assert p.get_by_test_id('coach-total').inner_text()=='4,497';assert p.locator('.coach-retry').is_visible();assert p.locator('.coach-hint').count()==0
   p.screenshot(path=str(out/f'{lang}-operator-edit.png'))
   p.get_by_test_id('coach-answer').fill('');assert p.get_by_test_id('coach-apply').is_disabled();write(p,'*')
   # Repaired rule must work for fresh quantities; no timer or loss penalty.
   click(p,'coach-serve');assert p.locator('.coach-retry').is_visible()
   for qty in [2,3,1]:
    for i in range(qty):click(p,'coach-add-cup')
    click(p,'coach-serve')
   assert state(p)['gameplay']['servedCustomers']==3
   p.screenshot(path=str(out/f'{lang}-checkout.png'));finish(p)
   p.locator('.message-body>.primary-button').click();write(p,'/menu');assert p.locator('.coach-retry').is_visible();assert p.locator('.coach-hint').count()==0
   write(p,'/api/menu');click(p,'coach-storage');click(p,'coach-connect')
   click(p,'coach-menu');click(p,'coach-order');assert state(p)['orders']
   assert state(p)['apiEvidence']=={'menu':True,'order':True}
   p.screenshot(path=str(out/f'{lang}-order.png'));finish(p)
   p.locator('.pc-window[data-active=true] button').filter(has_text='OPEN').click()
   assert state(p)['gameplay']['openingCelebrated'];assert state(p)['completed']==[0,1,2]
   (out/f'{lang}-cafe-save.json').write_text(json.dumps(state(p),ensure_ascii=False),encoding='utf-8')
   assert not errors,errors
   reports.append({'language':lang,'cafeChapters':3,'customersServed':3,'actualApiEvidence':True,'typedEditsAndSlider':True,'blankInputBlocked':True,'hintsManualOnly':True,'hintsClosedAfterErrors':True,'wrongInputsRecover':True,'errors':errors,'assistedFunctionalTest':True})
   c.close()
  (out/'coach-report.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(reports,ensure_ascii=False))
 except Exception:
  p.screenshot(path=str(out/'coach-failure.png'));(out/'coach-failure.txt').write_text(p.locator('body').inner_text(),encoding='utf-8');raise
 finally:b.close()
