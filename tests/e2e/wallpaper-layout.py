"""Real wallpaper images, responsive shop layout and localized purchase notices."""
from pathlib import Path
import json,re
from playwright.sync_api import sync_playwright,expect
out=Path('output/0.11-wallpapers');out.mkdir(parents=True,exist_ok=True);report=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True)
 try:
  for lang in ['ko','en','ja']:
   for width in [1440,390]:
    c=b.new_context(viewport={'width':width,'height':900},locale={'ko':'ko-KR','en':'en-US','ja':'ja-JP'}[lang]);p=c.new_page();p.set_default_timeout(12000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
    p.goto('http://127.0.0.1:5173/',wait_until='networkidle');p.get_by_test_id('title-settings').click();p.get_by_role('combobox',name='Language').select_option(lang);p.keyboard.press('Escape');p.locator('.pc-play').click()
    assert 'wallpaper-blue.png' in p.locator('.pc-stage>.pc-wallpaper').evaluate('el=>getComputedStyle(el).backgroundImage')
    if width==390 and p.locator('#mission-sidebar .panel-close').is_visible():p.locator('#mission-sidebar .panel-close').click()
    p.get_by_test_id('open-wallet').click()
    for ident in ['mint','amber','violet','loft']:
     card=p.get_by_test_id('wallpaper-'+ident);card.scroll_into_view_if_needed();expect(card.locator('img')).to_be_visible()
     expect(card.locator('img')).to_have_js_property('complete',True);assert card.locator('img').evaluate('el=>el.naturalWidth')>1000
     assert card.evaluate('el=>el.scrollWidth<=el.clientWidth+1')
    expect(p.get_by_test_id('wallpaper-loft').get_by_role('button')).to_be_disabled()
    p.get_by_test_id('wallpaper-amber').get_by_role('button').click()
    state=p.evaluate('JSON.parse(localStorage.getItem("codeshift-intro-demo-v1"))');assert state['credits']==30 and state['gameplay']['equippedCosmetic']=='amber'
    if lang!='ko':assert not re.search('[가-힣]',p.locator('[data-sonner-toast]').last.inner_text())
    p.get_by_test_id('wallpaper-amber').scroll_into_view_if_needed();p.screenshot(path=str(out/f'{lang}-{width}.png'))
    assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    p.get_by_test_id('wallpaper-mint').get_by_role('button').click();assert p.evaluate('JSON.parse(localStorage.getItem("codeshift-intro-demo-v1")).credits')==30
    assert not errors;report.append({'language':lang,'width':width,'loadedImages':4,'freeSwitch':True,'purchase':True,'pageErrors':errors});c.close()
  (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report))
 finally:b.close()
