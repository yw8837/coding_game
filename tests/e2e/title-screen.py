"""Title UX: save safety, keyboard focus, locale persistence, decorative motion."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUT = Path(os.environ.get('CODESHIFT_QA_DIR', 'output/launch-quality-20261010/title'))
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.environ.get('CODESHIFT_QA_BASE', 'http://127.0.0.1:5173/')
KEY = 'codeshift-intro-demo-v1'
results = []
with sync_playwright() as pw:
 browser = pw.chromium.launch(channel='chrome', headless=True)
 try:
  for lang in ['ko', 'en', 'ja']:
   context = browser.new_context(viewport={'width':1440,'height':900},locale={'ko':'ko-KR','en':'en-US','ja':'ja-JP'}[lang])
   page = context.new_page()
   errors = []
   page.on('pageerror', lambda error: errors.append(str(error)))
   page.goto(BASE,wait_until='networkidle')
   new = page.get_by_test_id('title-new')
   resume = page.get_by_test_id('title-continue')
   settings = page.get_by_test_id('title-settings')
   expect(new).to_be_enabled();expect(new).to_be_focused();expect(resume).to_be_disabled()
   expect(page.locator('.title-home-menu button')).to_have_count(3)
   expect(page.locator('.title-goal-card, .pc-title-screen>header, .pc-title-screen>footer')).to_have_count(0)
   expect(page.get_by_role('combobox',name='Language')).to_have_count(0)
   page.keyboard.press('ArrowDown');expect(settings).to_be_focused()
   page.keyboard.press('Enter');expect(page.get_by_role('dialog')).to_be_visible()
   page.get_by_role('combobox',name='Language').select_option(lang)
   page.keyboard.press('Escape');expect(settings).to_be_focused()
   expect(page.locator('html')).to_have_attribute('lang',lang)
   box = new.bounding_box()
   code_before = page.locator('.title-editor-code code').text_content()
   page.mouse.move(1320,720)
   page.wait_for_function("document.querySelector('.title-room').style.getPropertyValue('--room-x') !== ''")
   assert new.bounding_box() == box, 'Menu must not follow the room'
   page.wait_for_function('(before)=>document.querySelector(".title-editor-code code").textContent!==before',arg=code_before)
   page.screenshot(path=str(OUT/f'{lang}-title-desktop.png'),animations='disabled')
   for width,height in [(1920,1080),(2560,1080),(1280,720),(844,390),(390,844),(320,640)]:
    page.set_viewport_size({'width':width,'height':height})
    assert page.locator('.title-home').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'), f'Overflow at {width}'
    for button in [new,resume,settings]:
     b=button.bounding_box();assert b['x']>=0 and b['x']+b['width']<=width+1
    if width==390: page.screenshot(path=str(OUT/f'{lang}-title-mobile.png'),animations='disabled')
   page.set_viewport_size({'width':1440,'height':900})
   page.emulate_media(reduced_motion='reduce')
   page.wait_for_function("getComputedStyle(document.querySelector('.title-rain line')).animationName==='title-rain-fall'")
   moving=page.locator('.title-editor-code code').text_content()
   page.wait_for_function('(before)=>document.querySelector(".title-editor-code code").textContent!==before',arg=moving)
   expect(page.locator('html')).to_have_attribute('data-game-reduced-motion','true')
   page.emulate_media(reduced_motion='no-preference')
   new.click();expect(page.locator('.pc-shortcuts')).to_be_visible()
   expect(page.locator('.pc-window:visible')).to_have_count(0)
   page.wait_for_function('(key)=>localStorage.getItem(key)!==null',arg=KEY)
   page.reload(wait_until='networkidle');expect(new).to_be_enabled();expect(resume).to_be_disabled()
   expect(page.locator('.title-home-edition')).to_have_count(0)
   new.click()
   page.locator('.pc-shortcuts').get_by_role('button',name={'ko':'터미널','en':'Terminal','ja':'ターミナル'}[lang],exact=True).click()
   command=page.locator('.pc-window[data-active=true] .terminal-form input')
   command.fill('pwd');command.press('Enter')
   page.wait_for_function("(key)=>JSON.parse(localStorage.getItem(key)).history.at(-1)?.command==='pwd'",arg=KEY)
   original = page.evaluate('(key)=>localStorage.getItem(key)',KEY)
   page.reload(wait_until='networkidle');expect(resume).to_be_enabled();expect(resume).to_be_focused()
   new.click();expect(page.get_by_role('alertdialog')).to_be_visible()
   assert page.evaluate('(key)=>localStorage.getItem(key)',KEY)==original
   page.keyboard.press('Escape');expect(page.get_by_role('alertdialog')).to_have_count(0)
   assert page.evaluate('(key)=>localStorage.getItem(key)',KEY)==original
   resume.click();expect(page.locator('.pc-shortcuts')).to_be_visible()
   assert not errors, errors
   results.append({'language':lang,'passed':True,'resolutions':7,'errors':errors})
   context.close()
 finally: browser.close()
(OUT/'title-screen-report.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(results,ensure_ascii=False))
