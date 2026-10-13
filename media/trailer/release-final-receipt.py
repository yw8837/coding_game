"""Actual matched customer-receipt payoff, EN/KO sequential UI-only takes."""
from pathlib import Path
import hashlib, importlib.util, json, shutil, time
from playwright.sync_api import sync_playwright, expect

HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1];URL='http://127.0.0.1:5190/'
SEED=ROOT/'output/release-ux-20261013/cafe/en-cafe-save.json'
spec=importlib.util.spec_from_file_location('receipt_clock',HERE/'capture-art.py');clock=importlib.util.module_from_spec(spec);spec.loader.exec_module(clock)
SOLUTION='function solve(input) {\n  let n = input.quantity;\n  let sum = 0;\n  while (n >= 6) {\n    sum += 10000;\n    n -= 6;\n  }\n  return sum + n * 1800;\n}'

def main():
 with sync_playwright() as pw:
  b=pw.chromium.launch(channel='chrome',headless=True)
  try:
   for lang in ['en','ko']:
    out=ROOT/f'output/release-final-20261013/{lang}-receipt-take1';out.mkdir(parents=True,exist_ok=True);(out/'screenshots').mkdir(exist_ok=True)
    assert not (out/'capture-evidence.json').exists()
    c=b.new_context(viewport={'width':1920,'height':1080},locale='en-US' if lang=='en' else 'ko-KR',record_video_dir=str(out/'recording'),record_video_size={'width':1920,'height':1080})
    p=c.new_page();p.set_default_timeout(12000);t0=time.monotonic();shots=[];errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
    p.goto(URL,wait_until='networkidle');p.get_by_test_id('title-settings').click();p.get_by_role('combobox',name='Language').select_option(lang);p.locator('.save-tools input[type=file]').set_input_files(str(SEED));p.get_by_role('button',name='Continue from this save' if lang=='en' else '이 저장으로 이어하기',exact=True).click()
    anchors=[clock.record_marker(p,t0,'start')];p.locator('.pc-play').click();p.locator('.quest-next button').click()
    active=p.locator('.pc-window[data-active="true"]')
    if active.bounding_box()['width']<1800:active.get_by_role('button',name='Maximize or restore window' if lang=='en' else '창 최대화 또는 복원',exact=True).click()
    side=p.locator('#mission-sidebar .panel-close')
    if side.is_visible():side.click()
    def click(id):p.get_by_test_id(id).click()
    click('career-job-bakery-price');click('career-accept');click('career-inspect');click('career-use-javascript')
    editor=p.get_by_test_id('career-js-editor').locator('textarea');editor.fill('');editor.focus()
    for char in SOLUTION:p.keyboard.insert_text(char);p.wait_for_timeout(25)
    expect(editor).to_have_value(SOLUTION);click('career-code-save')
    if p.get_by_test_id('career-scenario-toggle').get_attribute('aria-expanded')!='true':click('career-scenario-toggle')
    for index,target in [(0,'10,000'),(1,'13,600')]:
     p.get_by_test_id('career-scenario-select').select_option(str(index));p.get_by_test_id('career-scenario-run').scroll_into_view_if_needed()
     start=time.monotonic()-t0;click('career-scenario-run');expect(p.get_by_test_id('career-scenario-actual')).to_have_text(target);expect(p.get_by_test_id('career-scenario-result')).to_have_class('career-scenario-ticket matched');p.wait_for_timeout(2500)
     ident='receipt-six' if index==0 else 'receipt-eight';shots.append({'id':ident,'start':start,'end':time.monotonic()-t0,'focus':p.get_by_test_id('career-scenario-result').bounding_box()});p.screenshot(path=str(out/f'screenshots/{ident}.png'))
    click('career-test');expect(p.get_by_test_id('career-impact')).to_be_visible();state=p.evaluate("JSON.parse(localStorage.getItem('codeshift-intro-demo-v1'))");assert state['gameplay']['career']['proofs']['bakery-price']['passed'];assert state['gameplay']['career']['completed']==[]
    anchors.append(clock.record_marker(p,t0,'end'));video=p.video;c.close();raw=Path(video.path());shutil.copy2(raw,out/'raw.webm');media=clock.inspect_recording(raw,clock.media_binary('ffmpeg'),clock.media_binary('ffprobe'));aligned,timing=clock.align_shots(shots,anchors,media)
    data={'version':json.loads((ROOT/'package.json').read_text())['version'],'language':lang,'viewport':[1920,1080],'pageErrors':errors,'capture':'Prior UI-earned cafe save imported through Settings. Same bakery JavaScript function as main footage typed and saved; actual customer scenarios run with six/eight rolls showing matched10,000/13,600 totals. All bakery checks pass; job not delivered in this supplemental take. No progress injection.','inputMethod':'Automated per-character keyboard input,25ms delay; supplemental matched customer result from same function as main montage, separate isolated UI play.','shots':aligned,'timing':timing,'rawSha256':hashlib.sha256((out/'raw.webm').read_bytes()).hexdigest(),'solution':SOLUTION,'saveImport':{'path':str(SEED),'sha256':hashlib.sha256(SEED.read_bytes()).hexdigest(),'careerJobsAtImport':0},'proof':state['gameplay']['career']['proofs']['bakery-price']}
    assert not errors;(out/'capture-evidence.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'language':lang,'seconds':media['duration'],'shots':len(aligned),'errors':errors}),flush=True)
  finally:b.close()

if __name__=='__main__':main()
