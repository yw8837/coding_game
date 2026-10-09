"""Capture real wallpaper purchases; verify balances, images and persistence."""
from pathlib import Path
import importlib.util,json,shutil,time
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'output/trailer-rebuild/wallpaper';OUT.mkdir(parents=True,exist_ok=True)
spec=importlib.util.spec_from_file_location('clock',Path(__file__).with_name('capture-art.py'));clock=importlib.util.module_from_spec(spec);spec.loader.exec_module(clock)
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='chrome',headless=True)
 try:
  ctx=browser.new_context(viewport={'width':1600,'height':900},locale='ko-KR',record_video_dir=str(OUT/'recording'),record_video_size={'width':1600,'height':900})
  t0=time.monotonic();p=ctx.new_page();p.set_default_timeout(15000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));shots=[];events=[]
  def state():return p.evaluate('JSON.parse(localStorage.getItem("codeshift-intro-demo-v1"))')
  def shot(name,start,focus=None):
   box=p.locator(focus).bounding_box() if focus else None;shots.append({'id':name,'start':start,'end':time.monotonic()-t0,'focus':box});p.screenshot(path=str(OUT/(name+'.png')))
  p.goto('http://127.0.0.1:5173/',wait_until='networkidle');p.locator('.pc-play').click()
  anchors=[clock.record_marker(p,t0,'start')]
  s=time.monotonic()-t0;p.wait_for_timeout(1800);shot('desktop',s)
  assert 'wallpaper-blue.png' in p.locator('.pc-stage>.pc-wallpaper').evaluate('el=>getComputedStyle(el).backgroundImage')
  p.locator('.pc-language').click()
  p.locator('.save-tools input[type=file]').set_input_files(str(ROOT/'output/0.10-qa/legacy-0.9-save.json'));p.get_by_role('button',name='이 저장으로 이어하기',exact=True).click();p.locator('.pc-play').click()
  if p.locator('.pc-topbar button[aria-expanded="true"]').count():p.locator('.pc-topbar button[aria-expanded="true"]').click()
  p.get_by_test_id('open-wallet').click();active=p.locator('.pc-window[data-active="true"]')
  if active.bounding_box()['width']<1500:active.get_by_role('button',name='창 최대화 또는 복원',exact=True).click()
  p.locator('.cosmetic-shop').scroll_into_view_if_needed();p.wait_for_timeout(250)
  assert p.locator('.wallpaper-preview img').evaluate_all('els=>els.every(x=>x.complete&&x.naturalWidth>1000)')
  before=state()['credits'];s=time.monotonic()-t0;p.get_by_test_id('wallpaper-loft').get_by_role('button').click();p.wait_for_timeout(1350);shot('theme',s,'[data-testid="wallpaper-loft"]');assert state()['credits']==before-180;events.append({'purchase':'loft','before':before,'after':state()['credits']})
  p.locator('.pc-show-desktop').click();s=time.monotonic()-t0;p.wait_for_timeout(2400);shot('workspace',s);bg=p.locator('.pc-stage>.pc-wallpaper').evaluate('el=>getComputedStyle(el).backgroundImage');assert 'wallpaper-loft.png' in bg
  p.reload(wait_until='networkidle');p.locator('.pc-play').click();assert state()['gameplay']['equippedCosmetic']=='loft';assert 'wallpaper-loft.png' in p.locator('.pc-stage>.pc-wallpaper').evaluate('el=>getComputedStyle(el).backgroundImage')
  p.get_by_test_id('open-wallet').click();p.locator('.cosmetic-shop').scroll_into_view_if_needed();before=state()['credits'];p.get_by_test_id('wallpaper-amber').get_by_role('button').click();assert state()['credits']==before-90
  p.locator('.pc-show-desktop').click();assert 'wallpaper-coast.png' in p.locator('.pc-stage>.pc-wallpaper').evaluate('el=>getComputedStyle(el).backgroundImage')
  p.get_by_test_id('open-wallet').click();p.locator('.cosmetic-shop').scroll_into_view_if_needed();before=state()['credits'];p.get_by_test_id('wallpaper-violet').get_by_role('button').click();assert state()['credits']==before-90
  p.locator('.pc-show-desktop').click();p.wait_for_timeout(500);p.screenshot(path=str(OUT/'garden.png'));assert 'wallpaper-garden.png' in p.locator('.pc-stage>.pc-wallpaper').evaluate('el=>getComputedStyle(el).backgroundImage')
  p.reload(wait_until='networkidle');p.locator('.pc-play').click();assert state()['gameplay']['equippedCosmetic']=='violet';assert 'wallpaper-garden.png' in p.locator('.pc-stage>.pc-wallpaper').evaluate('el=>getComputedStyle(el).backgroundImage')
  p.get_by_test_id('open-wallet').click();p.locator('.cosmetic-shop').scroll_into_view_if_needed();before=state()['credits'];p.get_by_test_id('wallpaper-amber').get_by_role('button').click();assert state()['credits']==before
  p.locator('.pc-show-desktop').click();p.wait_for_timeout(200);anchors.append(clock.record_marker(p,t0,'end'))
  v=p.video;ctx.close();raw=Path(v.path());media=clock.inspect_recording(raw,clock.media_binary('ffmpeg'),clock.media_binary('ffprobe'));aligned,timing=clock.align_shots(shots,anchors,media);shutil.copyfile(raw,OUT/'raw.webm')
  evidence={'shots':aligned,'events':events,'timing':timing,'pageErrors':errors,'checks':['Default blue desktop','All four wallpaper images loaded','Loft costs180; coast/garden cost90','Desktop actually changes image','Refresh retains loft and garden','Switching owned wallpaper is free'],'capture':'Fresh default desktop, then visible import of previously UI-earned save; actual purchases through UI, no progress injection'}
  (OUT/'evidence.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2),encoding='utf-8');assert not errors;print(json.dumps(aligned,ensure_ascii=False))
 finally:browser.close()
