"""Fresh, UI-driven gameplay capture for the result-first trailer rebuild."""
from pathlib import Path
import hashlib, importlib.util, json, shutil, subprocess, time

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'output/trailer-rebuild'
SEED=ROOT/'output/0.10-qa/legacy-0.9-save.json'
spec=importlib.util.spec_from_file_location('capture_clock',Path(__file__).with_name('capture-art.py'))
clock=importlib.util.module_from_spec(spec);spec.loader.exec_module(clock)

def main():
 from playwright.sync_api import sync_playwright,expect
 OUT.mkdir(parents=True,exist_ok=True);(OUT/'screenshots').mkdir(exist_ok=True)
 shots=[];anchors=[];errors=[];events=[]
 with sync_playwright() as pw:
  browser=pw.chromium.launch(channel='chrome',headless=True)
  context=browser.new_context(viewport={'width':1600,'height':900},locale='ko-KR',record_video_dir=str(OUT/'recording'),record_video_size={'width':1600,'height':900})
  t0=time.monotonic();page=context.new_page();page.set_default_timeout(14000)
  page.on('pageerror',lambda error:errors.append(str(error)))
  def active():return page.locator('.pc-window[data-active="true"]')
  def click(identity):page.get_by_test_id(identity).click()
  def pause(seconds):page.wait_for_timeout(round(seconds*1000))
  def begin():return time.monotonic()-t0
  def state():return page.evaluate('JSON.parse(localStorage.getItem("codeshift-intro-demo-v1"))')
  def end(identity,start,focus=None):
   box=page.locator(focus).first.bounding_box() if focus else None
   shots.append({'id':identity,'start':round(start,3),'end':round(begin(),3),'focus':box})
   page.screenshot(path=str(OUT/'screenshots'/f'{identity}.png'))
   print('captured '+identity,flush=True)
  def maximize():
   if active().bounding_box()['width']<1500:active().get_by_role('button',name='창 최대화 또는 복원',exact=True).click()
  def write(value):page.get_by_test_id('coach-answer').fill('');page.get_by_test_id('coach-answer').press_sequentially(value,delay=90);click('coach-apply')
  def finish(identity=None):
   click('coach-test');page.get_by_test_id('coach-deliver').wait_for();before=state()['credits'];s=begin();click('coach-deliver')
   page.locator('.reward-dialog').wait_for();pause(1.9)
   after=state()['credits'];events.append({'event':'mission-reward','before':before,'after':after,'delta':after-before})
   if identity:end(identity,s,'.reward-dialog')
   page.locator('[role=dialog] .primary-button').click()
  try:
   page.goto('http://127.0.0.1:5173/',wait_until='networkidle')
   anchors.append(clock.record_marker(page,t0,'start'))
   # A visible pointer follows actual pointer events; it never changes game state.
   page.evaluate("""()=>{const dot=document.createElement('div');dot.style='position:fixed;width:14px;height:14px;border:2px solid white;border-radius:50%;pointer-events:none;z-index:99999;box-shadow:0 0 0 4px #72baff44;left:-30px;top:-30px';document.body.append(dot);document.addEventListener('pointermove',e=>{dot.style.left=(e.clientX-7)+'px';dot.style.top=(e.clientY-7)+'px'});document.addEventListener('pointerdown',()=>dot.style.background='#ffffff99');document.addEventListener('pointerup',()=>dot.style.background='transparent');}""")
   page.locator('.pc-play').click();s=begin();pause(1.6);end('desktop',s)
   s=begin();page.locator('.pc-shortcuts button').filter(has=page.locator('svg.lucide-message-circle')).click();pause(2);end('request',s,'.message-body')
   page.locator('.message-body>.primary-button').click();maximize()
   close=page.get_by_role('button',name='퀘스트 상세 접기',exact=True)
   if close.is_visible():close.click()
   click('coach-prepare');s=begin();pause(1.5);end('broken-phone',s,'.coach-phone')
   click('coach-inspect');s=begin();page.get_by_test_id('coach-name').fill('모노 카페');click('coach-apply')
   slider=page.get_by_test_id('coach-width');slider.focus();slider.press('Home')
   for _ in range(10):slider.press('ArrowRight')
   click('coach-apply');pause(1.5);end('phone-fixed',s,'.coach-phone');finish()
   page.locator('.message-body>.primary-button').click()
   for _ in range(3):click('coach-add-cup')
   s=begin();pause(2.1);end('wrong-total',s,'.coach-receipt')
   assert page.get_by_test_id('coach-total').inner_text()=='4,503'
   click('coach-inspect');s=begin();write('*');pause(1.5);end('code-repair',s,'.coach-receipt')
   for _ in range(3):click('coach-add-cup')
   s=begin();pause(1.5);end('fixed-three',s,'.coach-receipt');assert page.get_by_test_id('coach-total').inner_text()=='13,500'
   page.get_by_role('button',name='한 잔 빼기',exact=True).click();click('coach-serve')
   s=begin()
   for _ in range(3):click('coach-add-cup');pause(.12)
   expect(page.get_by_test_id('coach-total')).to_have_text('15,000');pause(1.3);end('correct-total',s,'.coach-receipt')
   s=begin();click('coach-serve');pause(.7);click('coach-add-cup');pause(.2);click('coach-serve');pause(.8);end('customers-served',s,'.coach-layout')
   assert state()['gameplay']['servedCustomers']==3;finish('checkout-reward')
   page.locator('.message-body>.primary-button').click();write('/api/menu');click('coach-storage');click('coach-connect');click('coach-menu')
   s=begin();click('coach-order');pause(2);end('order-arrives',s,'.coach-order-box');assert len(state()['orders'])>0
   finish('cafe-reward')
   s=begin();pause(.45);active().get_by_role('button').filter(has_text='OPEN').click();pause(2.2);end('cafe-open',s,'.cafe-art-scene');assert state()['gameplay']['openingCelebrated']
   click('open-wallet');maximize();click('wallet-tools');maximize();s=begin();before=state()['credits'];click('career-upgrade-second-screen');pause(1.6);end('buy-monitor',s,'.career-shop');assert state()['credits']==before-600
   events.append({'event':'monitor-purchase','before':before,'after':state()['credits'],'cost':600})
   click('open-wallet');maximize();card=page.get_by_test_id('wallpaper-loft');card.scroll_into_view_if_needed();s=begin();before=state()['credits'];card.get_by_role('button').click();pause(1.4);end('buy-theme',s,'.cosmetic-shop');assert state()['credits']==before-180
   events.append({'event':'theme-purchase','before':before,'after':state()['credits'],'cost':180})
   page.locator('.pc-show-desktop').click();s=begin();pause(1.6);end('my-desktop',s)
   page.locator('.pc-start-button').click();page.locator('.pc-start-apps').get_by_role('button',name='의뢰 센터',exact=True).click();maximize();click('career-map-button');s=begin();pause(2);end('neighborhood',s,'.neighborhood-view')
   click('map-pin-bakery-price');click('map-open-request');s=begin();click('career-accept');pause(1.6);end('next-job',s,'.career-request')
   click('career-inspect');click('career-code-mode');active().locator('.career-answer>button').click()
   answers=active().locator('.career-answer>div>div').evaluate_all('els=>els.map(el=>[el.querySelector("strong").textContent,el.querySelector("pre").textContent])')
   for filename,source in answers:
    active().locator('.career-file-tabs button').filter(has=page.get_by_text(filename,exact=True)).click();active().locator('.career-code-input textarea').fill(source)
   active().locator('.career-answer>button').click();click('career-test');s=begin();page.get_by_test_id('career-reply-care').check();click('career-deliver');pause(2);end('client-reply',s,'.delivery-receipt')
   # Visible import of a previously UI-earned save supplies late-game footage.
   # It is an editorial chapter jump, not a claim of one continuous playthrough.
   page.locator('.pc-language').click();page.locator('.save-tools input[type=file]').set_input_files(str(SEED));page.get_by_role('button',name='이 저장으로 이어하기',exact=True).click();page.locator('.pc-play').click()
   page.locator('.pc-start-button').click();page.locator('.pc-start-apps').get_by_role('button',name='의뢰 센터',exact=True).click();maximize();click('career-release-button');click('release-start')
   for value in ['동네ON','100%','/api/places']:
    page.get_by_test_id('release-token').fill(value);click('release-apply')
   s=begin();page.get_by_test_id('release-token').press_sequentially('true',delay=110);click('release-apply');click('release-load-places');pause(.5);page.get_by_test_id('release-inquiry').fill('내일도 문을 여나요?');click('release-send-inquiry');pause(1.7);end('my-app',s,'.release-preview')
   click('release-test');click('release-build');s=begin();click('release-publish');pause(2.8);end('release',s,'.release-published')
   assert state()['gameplay']['career']['release']['published']['version']=='1.0.0'
   page.locator('.pc-language').click();page.get_by_role('button',name='타이틀로 돌아가기',exact=True).click();s=begin();pause(3);end('title',s)
   assert not errors,errors
   pause(.2);anchors.append(clock.record_marker(page,t0,'end'))
   video=page.video;context.close();recorded=Path(video.path())
   media=clock.inspect_recording(recorded,clock.media_binary('ffmpeg'),clock.media_binary('ffprobe'))
   aligned,timing=clock.align_shots(shots,anchors,media);shutil.copyfile(recorded,OUT/'raw.webm')
   evidence={'gameCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'viewport':[1600,900],'capture':'Actual game UI with automated inputs; late-game visible save import; no completion-state injection','saveImport':{'path':str(SEED.relative_to(ROOT)),'sha256':hashlib.sha256(SEED.read_bytes()).hexdigest(),'provenance':'Previously UI-earned 18-job save; final app edited and published on camera'},'timing':timing,'events':events,'pageErrors':errors,'shots':aligned}
   (OUT/'capture-evidence.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2),encoding='utf-8')
   print(json.dumps({'shots':len(aligned),'sourceDuration':media['duration'],'errors':errors}),flush=True)
  except Exception:
   if not page.is_closed():
    page.screenshot(path=str(OUT/'capture-failure.png'));(OUT/'capture-failure.txt').write_text(page.locator('body').inner_text(),encoding='utf-8')
   raise
  finally:browser.close()

if __name__=='__main__':main()
