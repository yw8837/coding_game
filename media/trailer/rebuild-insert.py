"""UI-earned release insert with the running app kept inside the camera frame."""
from pathlib import Path
import importlib.util,json,shutil,time
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'output/trailer-rebuild/insert';OUT.mkdir(parents=True,exist_ok=True)
spec=importlib.util.spec_from_file_location('clock',Path(__file__).with_name('capture-art.py'));clock=importlib.util.module_from_spec(spec);spec.loader.exec_module(clock)
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='chrome',headless=True)
 try:
  ctx=browser.new_context(viewport={'width':1600,'height':900},locale='ko-KR',record_video_dir=str(OUT/'recording'),record_video_size={'width':1600,'height':900})
  t0=time.monotonic();p=ctx.new_page();p.set_default_timeout(15000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  def click(k):p.get_by_test_id(k).click()
  def shot(name,start):
   focus=p.locator('.release-preview-frame').bounding_box();shots.append({'id':name,'start':start,'end':time.monotonic()-t0,'focus':focus});p.screenshot(path=str(OUT/(name+'.png')))
  p.goto('http://127.0.0.1:5173/',wait_until='networkidle');p.locator('.pc-play').click();p.locator('.pc-language').click()
  p.locator('.save-tools input[type=file]').set_input_files(str(ROOT/'output/0.10-qa/legacy-0.9-save.json'));p.get_by_role('button',name='이 저장으로 이어하기',exact=True).click();p.locator('.pc-play').click()
  p.locator('.pc-start-button').click();p.locator('.pc-start-apps').get_by_role('button',name='의뢰 센터',exact=True).click()
  p.locator('.pc-window[data-active="true"]').get_by_role('button',name='창 최대화 또는 복원',exact=True).click();click('career-release-button');click('release-start')
  for value in ['동네ON','100%','/api/places','true']:p.get_by_test_id('release-token').fill(value);click('release-apply')
  click('release-code-mode');p.locator('.release-preview-frame').scroll_into_view_if_needed();p.wait_for_timeout(350)
  anchors=[clock.record_marker(p,t0,'start')];shots=[]
  start=time.monotonic()-t0;p.wait_for_timeout(650);click('release-load-places');p.wait_for_timeout(1400);shot('places',start)
  start=time.monotonic()-t0;p.get_by_test_id('release-inquiry').press_sequentially('내일도 문을 여나요?',delay=70);click('release-send-inquiry');p.wait_for_timeout(1400);shot('inquiry',start)
  expect(p.get_by_test_id('release-inquiries')).to_contain_text('내일도 문을 여나요?')
  anchors.append(clock.record_marker(p,t0,'end'));v=p.video;ctx.close();raw=Path(v.path());media=clock.inspect_recording(raw,clock.media_binary('ffmpeg'),clock.media_binary('ffprobe'));aligned,timing=clock.align_shots(shots,anchors,media);shutil.copyfile(raw,OUT/'raw.webm')
  (OUT/'evidence.json').write_text(json.dumps({'shots':aligned,'timing':timing,'errors':errors,'capture':'Visible import of previously UI-earned save; final project edited through UI; no state injection'},ensure_ascii=False,indent=2),encoding='utf-8');assert not errors
  print(json.dumps(aligned,ensure_ascii=False))
 finally:browser.close()
