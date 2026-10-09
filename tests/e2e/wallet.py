from playwright.sync_api import sync_playwright,expect
from pathlib import Path
import json
out=Path('output/0.10-qa')
def state(p):return p.evaluate("JSON.parse(localStorage.getItem('codeshift-intro-demo-v1'))")
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True)
 try:
  p=b.new_page(viewport={'width':1440,'height':960},locale='ko-KR');p.set_default_timeout(12000)
  p.goto('http://127.0.0.1:5173/',wait_until='networkidle');p.locator('.pc-play').click();p.get_by_test_id('open-wallet').click()
  expect(p.get_by_test_id('wallet-tools')).to_be_disabled()
  themes=p.locator('.cosmetic-shop article');themes.nth(1).get_by_role('button').click();assert state(p)['credits']==30;assert state(p)['gameplay']['equippedCosmetic']=='amber';expect(themes.nth(2).get_by_role('button')).to_be_disabled()
  assert 'wallpaper-coast.png' in p.locator('.pc-stage>.pc-wallpaper').evaluate('(e)=>getComputedStyle(e).backgroundImage')
  assert p.locator('.wallpaper-preview img').evaluate_all('els=>els.every(el=>el.complete&&el.naturalWidth>1000)')
  p.reload(wait_until='networkidle');p.locator('.pc-play').click();assert state(p)['gameplay']['ownedCosmetics']==['mint','amber'];assert state(p)['credits']==30
  # Import real UI-earned progress, never a fabricated wallet balance.
  p.locator('.pc-language').click();p.locator('.save-tools input[type=file]').set_input_files(str(out/'completed-learning-save.json'));p.get_by_role('button',name='이 저장으로 이어하기',exact=True).click();p.locator('.pc-play').click()
  before=state(p)['credits'];p.locator('.quest-next button').click();p.locator('.pc-language').click();p.get_by_role('button',name='타이틀로 돌아가기',exact=True).click();p.locator('.pc-play').click();p.get_by_test_id('open-wallet').click();p.get_by_test_id('wallet-tools').click();expect(p.locator('.career-shop')).to_be_visible()
  for item in ['recovery-kit','second-screen','studio-sign']:
   button=p.get_by_test_id('career-upgrade-'+item);button.click();expect(button).to_be_disabled()
  assert state(p)['credits']==before-1750
  p.screenshot(path=str(out/'wallet-tools.png'),animations='disabled');p.locator('.pc-show-desktop').click();assert p.locator('.pc-desktop-caption span').inner_text()!='SHIFT OS'
  p.reload(wait_until='networkidle');p.locator('.pc-play').click();assert len(state(p)['gameplay']['career']['upgrades'])==3;assert state(p)['credits']==before-1750
  report={'themeChangesWallpaper':True,'insufficientFundsBlocked':True,'walletShortcut':True,'toolsPurchased':3,'duplicatePurchaseBlocked':True,'purchasesPersist':True};(out/'wallet-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report))
 except Exception:p.screenshot(path=str(out/'wallet-failure.png'));raise
 finally:b.close()
