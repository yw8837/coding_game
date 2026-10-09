"""0.10 actual UI recording. Later scenes import a documented UI-earned old save."""
from pathlib import Path
import hashlib
import importlib.util
import json
import shutil
import time

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'output/trailer-0.10'
SEED=ROOT/'output/0.10-qa/legacy-0.9-save.json'
spec=importlib.util.spec_from_file_location('clock_capture',Path(__file__).with_name('capture-art.py'))
clock=importlib.util.module_from_spec(spec);spec.loader.exec_module(clock)

def main():
 from playwright.sync_api import sync_playwright,expect
 OUT.mkdir(parents=True,exist_ok=True);(OUT/'screenshots').mkdir(exist_ok=True)
 shots=[];anchors=[];errors=[]
 with sync_playwright() as pw:
  browser=pw.chromium.launch(channel='chrome',headless=True)
  context=browser.new_context(viewport={'width':1920,'height':1080},locale='ko-KR',record_video_dir=str(OUT/'recording'),record_video_size={'width':1920,'height':1080})
  t0=time.monotonic();page=context.new_page();page.set_default_timeout(15000)
  page.on('pageerror',lambda error:errors.append(str(error)))
  def active():return page.locator('.pc-window[data-active="true"]')
  def click(identity):page.get_by_test_id(identity).click()
  def pause(seconds):page.wait_for_timeout(int(seconds*1000))
  def begin():return time.monotonic()-t0
  def end(identity,start,duration,ko,en,ja):
   shots.append({'id':identity,'start':round(start,3),'end':round(time.monotonic()-t0,3),'duration':duration,'caption':{'ko':ko,'en':en,'ja':ja}})
  def shot(name):page.screenshot(path=str(OUT/'screenshots'/f'{name}.png'),animations='disabled')
  def maximize():active().get_by_role('button',name='창 최대화 또는 복원',exact=True).click()
  def write(value):page.get_by_test_id('coach-answer').fill(value);pause(.5);click('coach-apply')
  def finish():
   click('coach-test');click('coach-deliver');page.locator('[role=dialog] .primary-button').click()
  try:
   page.goto('http://127.0.0.1:5173/',wait_until='networkidle')
   anchors.append(clock.record_marker(page,t0,'start'))
   page.locator('.pc-play').click()
   s=begin();pause(3);shot('01-desktop');end('desktop',s,3,'내 컴퓨터에서 시작되는 이야기.','A story inside your own PC.','自分のパソコンから始まる物語。')
   s=begin();page.locator('.pc-shortcuts button').filter(has=page.locator('svg.lucide-message-circle')).click();pause(3);shot('02-message');end('message',s,3,'도착한 메시지. 작은 카페의 부탁.','A new message. A small café needs you.','届いたメッセージ。小さなカフェのお願い。')
   page.locator('.message-body>.primary-button').click();maximize();click('coach-prepare')
   s=begin();pause(3);shot('03-cafe-observe');click('coach-inspect');pause(.7);end('observe',s,3,'먼저 보고, 무엇이 다른지 찾아보자.','Look first. Find what feels wrong.','まず見て、違うところを探そう。')
   s=begin();click('coach-title-bakery');pause(1);click('coach-title-cafe');pause(3);shot('04-cafe-choice');end('choose',s,4,'골라 보고, 바뀐 코드도 만나고.','Make a choice. Meet the code it changes.','選んでみると、変わったコードに出会う。')
   click('coach-next');s=begin();click('coach-width-fit');pause(3);shot('05-cafe-phone');end('width',s,3,'작은 수정으로 휴대폰에 쏙.','A small change. A menu that fits.','小さな修正で、スマホにぴったり。')
   click('coach-next');finish();page.locator('.message-body>.primary-button').click();click('coach-inspect')
   s=begin();page.get_by_test_id('coach-answer').press_sequentially('*',delay=200);pause(1);shot('06-operator-input');click('coach-apply');pause(3);shot('07-operator-result');end('operator',s,4,'이번에는 한 글자를 직접 써 보자.','Now type one character yourself.','今度は1文字、自分で書いてみよう。')
   click('coach-next')
   for quantity in [2,3,1]:
    for _ in range(quantity):click('coach-add-cup')
    click('coach-serve')
   finish();page.locator('.message-body>.primary-button').click();write('/api/menu');click('coach-next');write('True');click('coach-next');click('coach-connect');click('coach-menu');click('coach-next')
   s=begin();click('coach-order');pause(3);shot('08-order-storage');end('order',s,3,'화면과 연결, 주문 보관까지.','Connect the screen. Keep the orders.','画面をつなぎ、注文も残そう。')
   click('coach-next');finish();active().get_by_role('button').filter(has_text='OPEN').click()
   # Import the existing real 0.9 playthrough through the visible save UI.
   # This editorial jump skips 18 deliveries; it never fabricates completion flags.
   page.locator('.pc-language').click();page.locator('.save-tools input[type=file]').set_input_files(str(SEED));page.get_by_role('button',name='이 저장으로 이어하기',exact=True).click();page.locator('.pc-play').click()
   click('open-wallet');maximize();s=begin();click('wallet-tools');maximize();pause(1)
   for upgrade in ['recovery-kit','second-screen','studio-sign']:click('career-upgrade-'+upgrade);pause(.4)
   pause(2);shot('09-studio-tools');end('tools',s,4,'번 크레딧으로 내 작업실을 채우고.','Put your earnings into your studio.','稼いだクレジットで作業場を整える。')
   click('career-map-button');pause(1);shot('10-neighborhood-map');click('career-release-button');click('release-start')
   for value in ['우리 동네 도움판','100%','/api/places']:
    page.get_by_test_id('release-token').fill(value);click('release-apply')
   s=begin();page.get_by_test_id('release-token').press_sequentially('true',delay=250);pause(.8);shot('11-project-code');click('release-apply');click('release-load-places');page.get_by_test_id('release-inquiry').fill('내일도 문을 여나요?');click('release-send-inquiry');pause(2);shot('12-project-preview');end('project',s,4,'배운 것을 연결해, 내 프로젝트로.','Bring what you learned into your own app.','学んだことをつなぎ、自分の作品へ。')
   s=begin();click('release-test');pause(.7);click('release-build');pause(.7);click('release-publish');pause(3);shot('13-first-release');end('release',s,4,'현재 파일을 검사하고, 첫 1.0 배포.','Check your files. Ship your first 1.0.','今のファイルを検査して、初めての1.0公開。')
   s=begin();click('release-letter');expect(page.get_by_test_id('final-letter')).to_be_visible();pause(4);shot('14-final-letter');end('letter',s,4,'동네에 남긴 선택, 마지막 편지.','Your choices around town. A final letter.','まちに残した選択と、最後の手紙。')
   page.locator('.pc-language').click();page.get_by_role('button',name='타이틀로 돌아가기',exact=True).click()
   s=begin();pause(3);end('title',s,3,'CODE:SHIFT · 개발 중인 작업명','CODE:SHIFT · Working title in development','CODE:SHIFT · 開発中の仮タイトル')
   assert not errors,errors
   final=page.evaluate('JSON.parse(localStorage.getItem("codeshift-intro-demo-v1"))')
   assert final['gameplay']['career']['release']['published']['version']=='1.0.0'
   pause(.25);anchors.append(clock.record_marker(page,t0,'end'))
   video=page.video;context.close();recorded=Path(video.path())
   media=clock.inspect_recording(recorded,clock.media_binary('ffmpeg'),clock.media_binary('ffprobe'))
   aligned,timing=clock.align_shots(shots,anchors,media);shutil.copyfile(recorded,OUT/'raw.webm')
   evidence={'gameCommit':'969f78b','captureViewport':[1920,1080],'uiLanguage':'ko','source':'Real local game UI; fresh cafe play; visible import of UI-earned legacy save for later scenes','saveImport':{'path':str(SEED.relative_to(ROOT)),'sha256':hashlib.sha256(SEED.read_bytes()).hexdigest(),'provenance':'Existing 0.9 UI playthrough; 18 career deliveries and reply-based ending. New 1.0 project edited, checked, built and published on camera.'},'captureTiming':timing,'errors':errors,'screenshots':'Clean native 1920x1080 game frames without marketing overlays','noSteamReleaseClaim':True}
   (OUT/'capture-evidence.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2),encoding='utf-8')
   edl={'source':'../../output/trailer-0.10/raw.webm','capture':evidence['source'],'captureViewport':[1920,1080],'captureTiming':timing,'shots':aligned}
   (ROOT/'media/trailer/edl-0.10.json').write_text(json.dumps(edl,ensure_ascii=False,indent=2),encoding='utf-8')
   print(json.dumps({'shots':len(shots),'duration':sum(s['duration'] for s in shots),'screenshots':len(list((OUT/'screenshots').glob('*.png'))),'raw':str(OUT/'raw.webm')}),flush=True)
  except Exception:
   if not page.is_closed():page.screenshot(path=str(OUT/'capture-failure.png'));(OUT/'capture-failure.txt').write_text(page.locator('body').inner_text(),encoding='utf-8')
   raise
  finally:browser.close()

if __name__=='__main__':main()
