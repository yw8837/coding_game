from playwright.sync_api import sync_playwright,expect
from pathlib import Path
import json
out=Path('output/art-qa');errors=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True)
 try:
  c=b.new_context(viewport={'width':1600,'height':1000},locale='ko-KR');p=c.new_page();p.set_default_timeout(15000);p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto('http://127.0.0.1:5173/',wait_until='networkidle');p.screenshot(path=str(out/'title.png'),animations='disabled')
  assert p.locator('.title-environment').evaluate('(e)=>e.complete&&e.naturalWidth>0')
  p.locator('.pc-play').click();assert p.locator('.pc-window:visible').count()==0;p.screenshot(path=str(out/'desktop.png'),animations='disabled')
  p.locator('.quest-next button').click();expect(p.locator('.message-conversation .character-portrait')).to_be_visible();p.screenshot(path=str(out/'messages.png'),animations='disabled')
  p.locator('.pc-language').click();p.locator('.save-tools input[type=file]').set_input_files('output/pc-qa/completed-save.json');p.get_by_role('button',name='이 저장으로 이어하기',exact=True).click();p.locator('.pc-play').click()
  p.locator('.pc-shortcuts').get_by_role('button',name='의뢰 센터',exact=True).click();w=p.locator('.pc-window[data-active="true"]');w.locator('.pc-window-buttons button').nth(3).click()
  expect(p.get_by_test_id('neighborhood-map')).to_be_visible();p.screenshot(path=str(out/'map.png'),animations='disabled')
  p.locator('.map-chapters button').nth(1).click();expect(p.get_by_test_id('map-open-request')).to_be_disabled()
  p.locator('.map-chapters button').nth(0).click();p.get_by_test_id('map-pin-bakery-price').click();p.get_by_test_id('map-open-request').click();p.get_by_test_id('career-accept').click();p.get_by_test_id('career-inspect').click();p.locator('.career-answer>button').click()
  answers=[(a.locator('strong').inner_text(),a.locator('pre').inner_text()) for a in p.locator('.career-answer>div>div').all()]
  for filename,source in answers:
   p.locator('.career-file-tabs button').filter(has=p.get_by_text(filename,exact=True)).click();p.locator('.career-code-input textarea').fill(source)
  p.locator('.career-answer>button').click();p.get_by_test_id('career-test').click();p.get_by_test_id('career-reply-care').check();p.get_by_test_id('career-deliver').click();expect(p.locator('.game-moment')).to_be_visible();expect(p.locator('.delivery-stamp')).to_be_visible();p.screenshot(path=str(out/'delivery.png'),animations='disabled')
  p.get_by_test_id('career-map-button').click();expect(p.get_by_test_id('map-pin-bakery-price')).to_have_class('map-pin delivered');p.screenshot(path=str(out/'map-delivered.png'),animations='disabled');p.locator('.game-moment').wait_for(state='hidden')
  assert not errors,errors
  p.set_viewport_size({'width':390,'height':844});p.locator('.quest-tracker .panel-close').click();p.screenshot(path=str(out/'map-mobile.png'),animations='disabled');assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
  c.close()
  for lang in ['en','ja']:
   c=b.new_context(viewport={'width':390,'height':844},locale={'en':'en-US','ja':'ja-JP'}[lang],reduced_motion='reduce');p=c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.goto('http://127.0.0.1:5173/',wait_until='networkidle');p.screenshot(path=str(out/f'title-{lang}-mobile.png'),animations='disabled');assert p.evaluate('document.documentElement.scrollWidth<=innerWidth');assert p.locator('.title-environment').evaluate('(e)=>getComputedStyle(e).animationName')=='none';c.close()
  (out/'report.json').write_text(json.dumps({'titleAssets':True,'emptyDesktop':True,'portraits':True,'mapSelection':True,'lockedAct':True,'realDeliveryReward':True,'completedMapStamp':True,'mobileNoOverflow':True,'reducedMotion':True,'errors':errors},indent=2));print('PASS: visual assets, map to actual delivery, locks/stamps, mobile and reduced motion')
 finally:b.close()
