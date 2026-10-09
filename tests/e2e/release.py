"""UI migration and capstone check/build/edit/publish tests using an old UI-earned save."""
from playwright.sync_api import sync_playwright,expect
from pathlib import Path
import json
out=Path('output/0.10-qa');out.mkdir(parents=True,exist_ok=True)
legacy=out/'legacy-0.9-save.json'
if not legacy.exists():legacy.write_bytes(Path('output/steam-qa/completed-career-save.json').read_bytes())
seed=json.loads(legacy.read_text(encoding='utf-8'))
def state(p):return p.evaluate("JSON.parse(localStorage.getItem('codeshift-intro-demo-v1'))")
def click(p,id):p.get_by_test_id(id).click()
def resume(p):p.reload(wait_until='networkidle');p.locator('.pc-play').click();p.locator('.quest-next button').click()
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True);reports=[]
 try:
  for lang in ['ko','en','ja']:
   c=b.new_context(viewport={'width':1440,'height':960});p=c.new_page();p.set_default_timeout(12000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
   p.goto('http://127.0.0.1:5173/',wait_until='networkidle');p.evaluate('({seed,lang})=>{localStorage.setItem("codeshift-intro-demo-v1",JSON.stringify(seed));localStorage.setItem("codeshift-language",lang)}',{'seed':seed,'lang':lang});resume(p)
   assert state(p)['gameplay']['career']['ending']==seed['gameplay']['career']['ending']
   expect(p.get_by_test_id('release-start')).to_be_visible()
   click(p,'release-start');click(p,'release-test');expect(p.get_by_test_id('release-build')).to_be_disabled()
   # Test the initial broken preview and the guided blank-by-blank final project.
   p.locator('.release-preview-toggle:visible').click() if not p.get_by_test_id('release-load-places').is_visible() else None
   click(p,'release-load-places');assert '404' in p.locator('.release-board').inner_text()
   for value in [{'ko':'우리 동네 도움판','en':'Our neighborhood board','ja':'私たちのまちの案内板'}[lang],'100%','/api/places']:
    p.get_by_test_id('release-token').fill(value);click(p,'release-apply')
   p.get_by_test_id('release-inquiry').fill('Test inquiry');click(p,'release-send-inquiry');assert p.get_by_test_id('release-inquiries').locator('li').count()==0
   p.get_by_test_id('release-token').fill('true');click(p,'release-apply')
   p.get_by_test_id('release-inquiry').fill('Open tomorrow?');click(p,'release-send-inquiry');expect(p.get_by_test_id('release-inquiries')).to_contain_text('Open tomorrow?')
   click(p,'release-test');click(p,'release-build');assert state(p)['gameplay']['career']['release']['build']
   resume(p);assert state(p)['gameplay']['career']['release']['build']
   click(p,'release-code-mode');p.locator('.release-code textarea').fill('<h1>My next title</h1>\n')
   assert state(p)['gameplay']['career']['release']['proof'] is None
   assert state(p)['gameplay']['career']['release']['build'] is None
   expect(p.get_by_test_id('release-publish')).to_be_disabled()
   click(p,'release-test');click(p,'release-build');click(p,'release-publish');assert state(p)['gameplay']['career']['release']['published']
   assert state(p)['credits']==seed['credits']
   p.screenshot(path=str(out/f'{lang}-release.png'),animations='disabled');click(p,'release-letter');expect(p.get_by_test_id('final-letter')).to_be_visible()
   p.screenshot(path=str(out/f'{lang}-final-letter.png'),animations='disabled');click(p,'ending-map');expect(p.get_by_test_id('map-final-project')).to_be_visible();click(p,'map-final-project');click(p,'ending-desktop');assert p.locator('.pc-window:visible').count()==0
   resume(p);expect(p.get_by_test_id('final-letter')).to_be_visible();p.set_viewport_size({'width':390,'height':844});assert not p.evaluate('document.documentElement.scrollWidth>innerWidth');p.screenshot(path=str(out/f'{lang}-final-mobile.png'),animations='disabled')
   assert not errors,errors;reports.append({'language':lang,'legacyEndingPreserved':True,'guidedProject':True,'staleProofAndBuildInvalidated':True,'previewInquiryStored':True,'releasePersists':True,'rewardsUnchanged':True,'errors':errors})
   c.close()
  (out/'release-report.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(reports,ensure_ascii=False))
 except Exception:
  p.screenshot(path=str(out/'release-failure.png'));(out/'release-failure.txt').write_text(p.locator('body').inner_text(),encoding='utf-8');raise
 finally:b.close()
