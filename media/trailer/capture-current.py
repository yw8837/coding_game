"""Record current UI: a real repair, earned reward, useful purchase and personal release."""
from pathlib import Path
import ast, hashlib, importlib.util, json, os, shutil, subprocess, time

ROOT=Path(__file__).resolve().parents[2]
STORE_CAPTURE=os.environ.get('CODESHIFT_CAPTURE_MODE')=='store'
LANG=os.environ.get('CODESHIFT_CAPTURE_LANGUAGE','ko')
assert LANG in ('ko','en'),'Supported capture languages: ko, en'
EN=LANG=='en'
ACTION=os.environ.get('CODESHIFT_CAPTURE_ACTION')=='1'
assert not ACTION or EN,'Action capture currently uses English UI'
OUT=ROOT/os.environ.get('CODESHIFT_CAPTURE_OUTPUT', 'output/steam-launch-20261010/capture' if STORE_CAPTURE else 'output/trailer-current')
WIDTH,HEIGHT=(1920,1080) if STORE_CAPTURE else (1600,900)
SEED=ROOT/('output/demo-20261010/en-cafe-save.json' if EN else 'output/0.13.1-qa/ko-cafe-save.json')
URL=os.environ.get('CODESHIFT_CAPTURE_URL','http://127.0.0.1:5173/')
spec=importlib.util.spec_from_file_location('capture_clock',Path(__file__).with_name('capture-art.py'))
clock=importlib.util.module_from_spec(spec);spec.loader.exec_module(clock)
tree=ast.parse((ROOT/'tests/e2e/freedom.py').read_text(encoding='utf-8'))
inputs={t.id:ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) for t in n.targets if isinstance(t,ast.Name) and t.id in ['jobs','solutions']}
inputs['solutions']['bakery-price']='function solve(input) {\n  let n = input.quantity;\n  let sum = 0;\n  while (n >= 6) {\n    sum += 10000;\n    n -= 6;\n  }\n  return sum + n * 1800;\n}'

def main():
 from playwright.sync_api import sync_playwright,expect
 OUT.mkdir(parents=True,exist_ok=True);(OUT/'screenshots').mkdir(exist_ok=True)
 assert not (OUT/'capture-evidence.json').exists(),'Preserve accepted capture; use a new output directory for a replacement.'
 shots=[];events=[];errors=[];anchors=[]
 with sync_playwright() as pw:
  browser=pw.chromium.launch(channel='chrome',headless=True)
  c=browser.new_context(viewport={'width':WIDTH,'height':HEIGHT},locale='en-US' if EN else 'ko-KR',record_video_dir=str(OUT/'recording'),record_video_size={'width':WIDTH,'height':HEIGHT})
  t0=time.monotonic();p=c.new_page();p.set_default_timeout(15000);p.on('pageerror',lambda e:errors.append(str(e)))
  def click(id):p.get_by_test_id(id).click()
  def state():return p.evaluate('JSON.parse(localStorage.getItem("codeshift-intro-demo-v1"))')
  def now():return time.monotonic()-t0
  def pause(s):p.wait_for_timeout(round(s*1000))
  def start():return now()
  def end(id,t,focus=None):
   box=p.locator(focus).first.bounding_box() if focus else {'x':0,'y':0,'width':WIDTH,'height':HEIGHT}
   shots.append({'id':id,'start':round(t,3),'end':round(now(),3),'focus':box});p.screenshot(path=str(OUT/'screenshots'/f'{id}.png'));(OUT/'screenshots'/f'{id}.txt').write_text(p.locator('body').inner_text(),encoding='utf-8');print('captured '+id,flush=True)
  def maximize():
   active=p.locator('.pc-window[data-active="true"]')
   if active.bounding_box()['width']<WIDTH-100:active.get_by_role('button',name='Maximize or restore window' if EN else '창 최대화 또는 복원',exact=True).click()
  def terminal():
   p.locator('.pc-start-button').click()
   p.locator('.pc-start-apps').get_by_role('button',name='Terminal',exact=True).click()
   maximize()
  def command(text, error=False, delay=45):
   field=p.locator('.pc-window[data-active="true"] .terminal-form input')
   field.press_sequentially(text,delay=delay);field.press('Enter')
   p.wait_for_function("text=>JSON.parse(localStorage.getItem('codeshift-intro-demo-v1')).history.at(-1)?.command===text",arg=text)
   entry=state()['history'][-1]
   assert bool(entry.get('error'))==error,entry
   events.append({'type':'command','command':text,'output':entry.get('output'),'error':error})
   pause(.3)
  try:
   p.goto(URL,wait_until='networkidle');p.get_by_role('combobox',name='Language').select_option(LANG)
   anchors.append(clock.record_marker(p,t0,'start'));p.locator('.pc-play').click();s=start();pause(2.2);end('desktop',s)
   # Import through the actual Settings UI. Cafe completion was earned by prior UI QA.
   p.locator('.pc-language').click();p.locator('.save-tools input[type=file]').set_input_files(str(SEED));p.get_by_role('button',name='Continue from this save' if EN else '이 저장으로 이어하기',exact=True).click();p.locator('.pc-play').click()
   p.locator('.quest-next button').click();maximize()
   close=p.locator('#mission-sidebar .panel-close')
   if close.is_visible():close.click()
   assert not state()['gameplay']['career']['completed']
   for index,id in enumerate(inputs['jobs']):
    click('career-job-'+id);click('career-accept')
    if index==0:
     p.locator('.career-request').scroll_into_view_if_needed();s=start();pause(3);end('request',s,'.career-request')
    click('career-inspect')
    if index==0:
     if p.get_by_test_id('career-scenario-toggle').get_attribute('aria-expanded')!='true':click('career-scenario-toggle')
     p.get_by_test_id('career-scenario-select').select_option('0');p.get_by_test_id('career-scenario-run').scroll_into_view_if_needed();s=start();click('career-scenario-run');expect(p.get_by_test_id('career-scenario-actual')).to_have_text('12,600');pause(3);end('broken',s,'.career-playground')
    if id in inputs['solutions']:
     click('career-use-javascript');editor=p.get_by_test_id('career-js-editor').locator('textarea')
     if index==0 and ACTION:
      paths=[path for path in state()['machines']['local']['files'] if 'bakery-price' in path and path.endswith('/solution.js')]
      assert len(paths)==1,paths
      terminal()
      if 'nodejs' not in state()['machines']['local']['tools']:
       command('sudo apt update');command('sudo apt install nodejs')
      command('cd '+paths[0].rsplit('/',1)[0]);command('clear')
      s=start();command('node --test solution.js',error=True);pause(1.5);end('terminal-fail',s,'.pc-window[data-active="true"] .terminal-output')
      s=start();command('code solution.js');maximize();pause(.5);end('terminal-open',s,'.pc-window[data-active="true"]')
      field=p.get_by_test_id('virtual-file-source').locator('textarea');field.fill('');s=start()
      for char in inputs['solutions'][id]:
       p.keyboard.insert_text(char);pause(.025)
      expect(field).to_have_value(inputs['solutions'][id]);pause(1);end('code',s,'[data-testid="virtual-file-editor"]')
      click('virtual-file-terminal');maximize();command('clear')
      s=start();command('node solution.js \'{"quantity":8}\'');pause(1.4);end('terminal-run',s,'.pc-window[data-active="true"] .terminal-output')
      s=start();command('node --test solution.js');pause(2.5);end('terminal-pass',s,'.pc-window[data-active="true"] .terminal-output')
      assert state()['gameplay']['career']['proofs'][id]['passed']
      p.locator('.pc-window[data-active="true"]').get_by_role('button',name='Close window',exact=True).click()
      p.locator('.pc-window[data-active="true"]').get_by_role('button',name='Close window',exact=True).click()
     elif index==0:
      editor.fill('');editor.scroll_into_view_if_needed();s=start()
      for line in inputs['solutions'][id].splitlines(keepends=True):p.keyboard.insert_text(line);pause(.2)
      editor.click();expect(editor).to_have_value(inputs['solutions'][id]);click('career-code-save');pause(1.5);end('code',s,'[data-testid="career-js-editor"]')
     else:editor.fill(inputs['solutions'][id]);click('career-code-save')
     if index==1:
      p.locator('.career-editor-preview').evaluate('el=>el.scrollIntoView({block:"start"})');s=start();pause(3);end('monitor-use',s,'.career-editor-preview')
      assert p.locator('.career-editor-preview > .career-preview').is_visible()
    else:
     if p.get_by_test_id('career-code-mode').get_attribute('aria-pressed')!='true':click('career-code-mode')
     p.locator('.career-answer>button').click();answers=p.locator('.career-answer>div>div').evaluate_all('els=>els.map(el=>[el.querySelector("strong").textContent,el.querySelector("pre").textContent])')
     for file,source in answers:
      if id=='workshop-slots':source='id,start,end\nA,09:30,10:30\nB,10:45,11:45\nC,12:00,13:00\n'
      p.locator('.career-file-tabs button').filter(has_text=file).click();p.locator('.career-code-input textarea').fill(source)
     p.locator('.career-answer>button').click()
    s=start();click('career-test');expect(p.get_by_test_id('career-impact')).to_be_visible()
    if index==0:pause(3);end('fixed',s,'[data-testid="career-impact"]')
    p.get_by_test_id('career-reply-'+('care' if index<8 else 'craft')).check();before=state()['credits'];s=start();click('career-deliver')
    assert len(state()['gameplay']['career']['completed'])==index+1
    events.append({'type':'delivery','job':id,'credits':state()['credits']-before,'completed':index+1})
    if index==0:
     expect(p.get_by_test_id('progress-moment')).to_have_attribute('data-tier','delivery');pause(3);end('delivery',s,'[data-testid="career-payoff"]')
     click('career-payoff-shop');button=p.get_by_test_id('career-upgrade-second-screen');button.scroll_into_view_if_needed();before=state()['credits'];s=start();button.click();pause(2);end('monitor',s,'.career-shop');assert state()['credits']==before-600;events.append({'type':'purchase','id':'second-screen','credits':600})
    if index==3:
     expect(p.get_by_test_id('progress-moment')).to_have_attribute('data-tier','milestone');pause(2.6);end('district',s,'[data-testid="career-payoff"]')
     click('career-map-button');p.locator('.neighborhood-view').scroll_into_view_if_needed();s=start();pause(3);end('map',s,'.neighborhood-view')
   click('career-final-project');click('release-start')
   p.get_by_test_id('release-purpose').select_option('portfolio');p.get_by_test_id('release-accent').select_option('ocean');p.get_by_test_id('release-layout').select_option('cards')
   p.get_by_test_id('release-description').fill('Neighborhood tools, repaired and ready to use' if EN else '내가 고쳐서 다시 쓰게 된 동네의 도구들')
   p.get_by_test_id('release-items').fill('Bakery calculator | Box and single-item prices | Tools\nWorkshop schedule | Three classes with breaks | Schedules\nLibrary lending | Shared borrowing rules | Tools' if EN else '빵집 계산기 | 상자와 낱개 가격 계산 | 도구\n공방 시간표 | 쉬는 시간이 있는 세 수업 | 일정\n도서관 대출 | 함께 쓰는 대출 규칙 | 도구');click('release-author-save')
   for value in ['Neighborhood Toolbox' if EN else '우리 동네 도구함','90%','/api/places','true']:
    p.get_by_test_id('release-token').fill(value);click('release-apply')
   click('release-load-places');expect(p.get_by_test_id('release-results').locator('li')).to_have_count(3)
   if EN:
    p.locator('.release-preview').evaluate('el=>el.scrollIntoView({block:"start"})');p.locator('.release-preview-frame').evaluate('el=>el.scrollTo(0,0)')
   else:p.get_by_test_id('release-preview-title').scroll_into_view_if_needed()
   s=start();pause(3);end('project',s,'.release-preview-frame' if EN else '.release-preview')
   s=start();p.get_by_test_id('release-category-filter').select_option('Tools' if EN else '도구');expect(p.get_by_test_id('release-results').locator('li')).to_have_count(2);p.get_by_test_id('release-search').fill('Bakery' if EN else '빵집');expect(p.get_by_test_id('release-results').locator('li')).to_have_count(1);pause(2);end('project-filter',s,'.release-preview-frame' if EN else '.release-preview')
   p.get_by_test_id('release-search').fill('');p.get_by_test_id('release-category-filter').select_option('');p.get_by_test_id('release-inquiry').fill('Could I try the calculator?' if EN else '계산기를 써 봐도 될까요?');click('release-send-inquiry')
   click('release-test')
   if ACTION:
    p.get_by_test_id('release-build').scroll_into_view_if_needed();s=start();pause(.5);click('release-build');pause(.65)
    end('build',s,'.release-actions')
    p.get_by_test_id('release-publish').hover();pause(.5)
   else:click('release-build')
   s=start();click('release-publish');expect(p.locator('.release-published')).to_be_visible()
   if EN:p.locator('.release-preview-frame').evaluate('el=>el.scrollTo(0,0)')
   pause(3.8);end('release',s,'.release-published')
   assert state()['gameplay']['career']['release']['published']['version']=='1.0.0';assert len(state()['gameplay']['career']['completed'])==12
   if ACTION:
    click('release-letter');p.get_by_test_id('career-ending').scroll_into_view_if_needed();s=start();pause(.5);click('career-ending')
    expect(p.get_by_test_id('final-letter')).to_be_visible();p.get_by_test_id('final-letter').scroll_into_view_if_needed();pause(4)
    end('letter',s,'[data-testid="final-letter"]')
    events.append({'type':'ending','ending':state()['gameplay']['career']['ending'],'text':p.get_by_test_id('final-letter').inner_text()})
   p.locator('.pc-language').click();p.get_by_role('button',name='Return to title' if EN else '타이틀로 돌아가기',exact=True).click();s=start();pause(3);end('title',s)
   assert not errors,errors;pause(.2);anchors.append(clock.record_marker(p,t0,'end'))
   video=p.video;c.close();raw=Path(video.path());media=clock.inspect_recording(raw,clock.media_binary('ffmpeg'),clock.media_binary('ffprobe'));aligned,timing=clock.align_shots(shots,anchors,media);shutil.copy2(raw,OUT/'raw.webm')
   sha=lambda data:hashlib.sha256(data).hexdigest()
   evidence={'version':json.loads((ROOT/'package.json').read_text())['version'],'gameCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'workingTreeDiffSha256':sha(subprocess.check_output(['git','diff','HEAD'],cwd=ROOT)),'gameSourceSha256':{name:sha((ROOT/name).read_bytes()) for name in ['components/game/CareerView.tsx','app/career.css','components/game/GameShell.tsx']},'viewport':[WIDTH,HEIGHT],'language':LANG,'capture':f'Actual {"English" if EN else "Korean"} game UI with automated input; prior UI-earned cafe save imported visibly; all 12 career jobs and own project solved on this recording; selected shots form a retimed montage, not a continuous playthrough. No completion-state injection.','saveImport':{'path':str(SEED.relative_to(ROOT)),'sha256':sha(SEED.read_bytes()),'careerJobsAtImport':0},'timing':timing,'events':events,'pageErrors':errors,'shots':aligned,'rawSha256':sha((OUT/'raw.webm').read_bytes())}
   (OUT/'capture-evidence.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'shots':len(aligned),'seconds':media['duration'],'errors':errors}),flush=True)
  except Exception:
   if not p.is_closed():p.screenshot(path=str(OUT/'capture-failure.png'));(OUT/'capture-failure.txt').write_text(p.locator('body').inner_text(),encoding='utf-8')
   raise
  finally:browser.close()

if __name__=='__main__':main()
