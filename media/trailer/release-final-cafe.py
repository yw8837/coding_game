"""Brief fresh EN/KO source edits, one browser and UI-only progress.

This is an automated actual gameplay insert, separate from the earned cafe save
used for later career scenes. It does not claim the full cafe campaign is filmed.
"""
from pathlib import Path
import hashlib, importlib.util, json, os, shutil, time
from playwright.sync_api import sync_playwright, expect

HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1]
spec=importlib.util.spec_from_file_location('cafe_clock',HERE/'capture-art.py');clock=importlib.util.module_from_spec(spec);spec.loader.exec_module(clock)
URL=os.environ.get('CODESHIFT_CAPTURE_URL','http://127.0.0.1:5190/')
OUT=ROOT/'output/release-final-20261013'

def main():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(channel='chrome',headless=True)
  try:
   for lang in ['en','ko']:
    out=OUT/(lang+'-cafe-take1');out.mkdir(parents=True,exist_ok=True);(out/'screenshots').mkdir(exist_ok=True)
    assert not (out/'capture-evidence.json').exists()
    c=browser.new_context(viewport={'width':1920,'height':1080},locale='en-US' if lang=='en' else 'ko-KR',record_video_dir=str(out/'recording'),record_video_size={'width':1920,'height':1080})
    p=c.new_page();p.set_default_timeout(12000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));t0=time.monotonic();shots=[];anchors=[]
    p.goto(URL,wait_until='networkidle');p.get_by_test_id('title-settings').click();p.get_by_role('combobox',name='Language').select_option(lang);p.keyboard.press('Escape')
    anchors.append(clock.record_marker(p,t0,'start'));p.locator('.pc-play').click()
    p.locator('.pc-shortcuts button').filter(has=p.locator('svg.lucide-message-circle')).click();p.locator('.message-body>.primary-button').click()
    p.get_by_test_id('coach-prepare').click();p.get_by_test_id('coach-inspect').click()
    active=p.locator('.pc-window[data-active="true"]')
    if active.bounding_box()['width']<1800:active.get_by_role('button',name='Maximize or restore window' if lang=='en' else '창 최대화 또는 복원',exact=True).click()
    before=time.monotonic()-t0
    p.get_by_test_id('coach-locate').click()
    for char in ('Mono Cafe' if lang=='en' else '모노 카페'):
     p.keyboard.insert_text(char);p.wait_for_timeout(45)
    p.get_by_test_id('coach-apply').click();p.get_by_test_id('coach-locate').click()
    for char in 'calc(100% - 0px)':
     p.keyboard.insert_text(char);p.wait_for_timeout(45)
    p.get_by_test_id('coach-apply').click();p.wait_for_timeout(800)
    focus=p.get_by_test_id('coach-source-editor').bounding_box()
    shots.append({'id':'cafe-code','start':before,'end':time.monotonic()-t0,'focus':focus})
    p.screenshot(path=str(out/'screenshots/cafe-code.png'))
    p.get_by_test_id('coach-source-test').click();expect(p.get_by_test_id('coach-deliver')).to_be_visible()
    p.wait_for_timeout(1200);p.screenshot(path=str(out/'screenshots/cafe-preview.png'))
    state=p.evaluate("JSON.parse(localStorage.getItem('codeshift-intro-demo-v1'))")
    assert all(check['passed'] for check in state['tests']['checks']);assert state['completed']==[]
    anchors.append(clock.record_marker(p,t0,'end'));video=p.video;c.close();raw=Path(video.path());shutil.copy2(raw,out/'raw.webm')
    media=clock.inspect_recording(raw,clock.media_binary('ffmpeg'),clock.media_binary('ffprobe'));aligned,timing=clock.align_shots(shots,anchors,media)
    data={'version':json.loads((ROOT/'package.json').read_text())['version'],'language':lang,'viewport':[1920,1080],'pageErrors':errors,'capture':'Fresh UI-only cafe play, name and responsive width source edits with automated character input; no imported progress. First chapter checks passed, not delivered; this insert is a montage segment.','inputMethod':'Automated per-character keyboard.insert_text with45ms delay; includes ordinary scene cuts and editorial speed changes.','shots':aligned,'timing':timing,'rawSha256':hashlib.sha256((out/'raw.webm').read_bytes()).hexdigest(),'checks':state['tests']['checks'],'finalProgress':state['completed']}
    assert not errors,errors;(out/'capture-evidence.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'language':lang,'seconds':media['duration'],'shots':len(aligned),'errors':errors}),flush=True)
  finally:browser.close()

if __name__=='__main__':main()
