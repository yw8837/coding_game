from playwright.sync_api import sync_playwright,expect
from pathlib import Path
import json,re,time
out=Path('output/pc-qa');out.mkdir(parents=True,exist_ok=True)
def state(p):return p.evaluate("JSON.parse(localStorage.getItem('codeshift-intro-demo-v1')||'null')")
def active(p):return p.locator('.pc-window[data-active="true"]')
def follow(p):
 q=p.locator('.quest-next button:visible')
 (q if q.count() else p.get_by_test_id('follow-task')).click()
def shot(p,name):p.screenshot(path=str(out/(name+'.png')))
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True)
 page=b.new_page(viewport={'width':1440,'height':900});page.set_default_timeout(10000)
 errors=[];steps=[];page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto('http://127.0.0.1:5173/',wait_until='networkidle')
  page.get_by_role('button',name='시작하기',exact=True).click()
  assert page.locator('.pc-window:visible').count()==0
  page.locator('.pc-shortcuts').get_by_role('button',name='메시지',exact=True).click()
  active(page).get_by_role('button',name='의뢰 수락',exact=True).click()
  follow(page)
  for label in ['프로젝트 복사','준비물 받기','미리보기 켜기']:
   active(page).get_by_role('button',name=label,exact=True).click()
  shot(page,'setup-complete')
  follow(page);active(page).get_by_role('button',name='360px',exact=True).click()
  active(page).get_by_role('button',name='문제 확인 · 파일 고치기',exact=True).click()
  # Visual inspection is required before source edits. Wrong code stays a task.
  follow(page);active(page).get_by_role('button',name='고칠 글자 찾기',exact=True).click();page.keyboard.insert_text('다른 카페')
  active(page).get_by_role('button',name='검사 실행',exact=True).click()
  page.wait_for_function("JSON.parse(localStorage.getItem('codeshift-intro-demo-v1')).tests!==null")
  assert not all(c['passed'] for c in state(page)['tests']['checks'])
  active(page).get_by_role('button',name='고칠 글자 찾기',exact=True).click();page.keyboard.insert_text('모노 카페')
  follow(page);active(page).get_by_role('button',name='고칠 글자 찾기',exact=True).click();page.keyboard.insert_text('100%')
  active(page).get_by_role('button',name='검사 실행',exact=True).click()
  page.wait_for_function("JSON.parse(localStorage.getItem('codeshift-intro-demo-v1')).tests.checks.every(x=>x.passed)")
  shot(page,'editor-checks')
  # Bound each progression loop. Actions use visible controls only.
  for i in range(100):
   title=page.locator('.quest-next>strong').inner_text();steps.append(title)
   s=state(page)
   if s['gameplay']['openingCelebrated']:break
   if page.get_by_role('button',name='이야기 계속하기',exact=True).is_visible():
    page.get_by_role('button',name='이야기 계속하기',exact=True).click();expect(page.get_by_role('button',name='이야기 계속하기',exact=True)).not_to_be_visible();continue
   follow(page);w=active(page)
   if '메시지' in title or '의뢰 읽고' in title:
    btn=w.get_by_role('button',name='작업 시작하기',exact=True)
    if btn.is_visible():btn.click()
   elif '계산대에서' in title:
    for _ in range(3):w.get_by_role('button',name='수량 늘리기').click()
    w.get_by_role('button',name='문제 확인 · 파일 고치기',exact=True).click()
   elif 'app.js에서' in title or 'server.py에서' in title:
    answer='*' if 'app.js' in title else '/api/menu' if '주소' in title else 'True'
    w.get_by_role('button',name='고칠 글자 찾기',exact=True).click();page.keyboard.insert_text(answer)
   elif '서버 앱에서' in title:w.get_by_role('button',name='Ubuntu 설치',exact=True).click()
   elif 'API 앱에서' in title:
    if '주문' in title:w.get_by_role('button',name='POST 주문 보내기').click()
    w.get_by_role('button',name='전송',exact=True).click()
   elif '검사하기' in title:
    w.get_by_role('button',name='검사 실행',exact=True).click()
    page.wait_for_function("JSON.parse(localStorage.getItem('codeshift-intro-demo-v1')).tests.checks.every(x=>x.passed)")
   elif '검토 요청' in title:w.get_by_role('button',name=re.compile('PR 만들기')).click()
   elif '수정본 확정' in title:w.get_by_role('button',name='PR 병합',exact=True).click()
   elif '수정본 전달' in title:w.get_by_role('button',name='검토한 버전 배포',exact=True).click()
   elif 'OPEN' in title:
    print('ENDING_BUTTONS',w.locator('button').all_text_contents(),flush=True)
    w.get_by_role('button',name=re.compile('OPEN')).click()
   elif w.get_by_role('textbox',name='가상 터미널 명령어').is_visible():w.get_by_role('textbox',name='가상 터미널 명령어').press('Enter')
   else:raise AssertionError('Unhandled '+title+' '+w.inner_text()[:400])
  else:raise AssertionError('Campaign step bound exceeded')
  assert state(page)['completed']==[0,1,2]
  assert state(page)['credits']==1720
  shot(page,'ending');(out/'completed-save.json').write_text(json.dumps(state(page),ensure_ascii=False),encoding='utf-8')
  # Reload preserves earned ending, Start returns to an empty desktop.
  page.reload(wait_until='networkidle');page.get_by_role('button',name='이어하기',exact=True).click()
  assert page.locator('.pc-window:visible').count()==0
  assert state(page)['gameplay']['openingCelebrated']
  # Start menu, notes and independent windows.
  page.get_by_role('button',name='시작 메뉴',exact=True).click()
  page.get_by_role('textbox',name='앱 검색',exact=True).fill('메모')
  page.locator('.pc-start-menu').get_by_role('button',name='메모장',exact=True).click()
  note=page.get_by_role('textbox',name='메모 내용',exact=True);note.fill('단서 42 / clue / 手がかり')
  page.get_by_role('button',name='바탕화면 보기',exact=True).click()
  page.locator('.pc-shortcuts').get_by_role('button',name='메시지',exact=True).click()
  page.locator('.pc-taskbar').get_by_role('button',name='에디터',exact=True).click()
  assert page.locator('.pc-window:visible').count()==2
  w=active(page);box=w.bounding_box();bar=w.locator('.pc-titlebar').bounding_box()
  page.mouse.move(bar['x']+150,bar['y']+18);page.mouse.down();page.mouse.move(bar['x']+50,bar['y']+65,steps=8);page.mouse.up()
  moved=w.bounding_box();assert moved['x']!=box['x'] or moved['y']!=box['y']
  w.get_by_role('button',name='오른쪽 절반에 배치',exact=True).click();shot(page,'multitasking')
  w.get_by_role('button',name='창 최소화',exact=True).click();assert page.locator('[data-window="editor"]').is_hidden()
  assert page.evaluate("document.activeElement.closest('[data-window]')?.dataset.window")=='messages'
  page.locator('.pc-taskbar').get_by_role('button',name='에디터',exact=True).click();active(page).get_by_role('button',name='창 닫기',exact=True).click()
  page.locator('.pc-taskbar').get_by_role('button',name='메모장',exact=True).click();assert page.get_by_role('textbox',name='메모 내용',exact=True).input_value()=='단서 42 / clue / 手がかり'
  # Optional job uses editable rule and counterexample, reward once.
  page.get_by_role('button',name='바탕화면 보기',exact=True).click();page.locator('.pc-shortcuts').get_by_role('button',name='연습 의뢰',exact=True).click()
  print('PRACTICE',active(page).inner_text()[:2600],flush=True)
  shot(page,'practice')
  print(json.dumps({'ok':True,'completed':state(page)['completed'],'credits':state(page)['credits'],'errors':errors,'steps':steps},ensure_ascii=False),flush=True)
  (out/'campaign-report.json').write_text(json.dumps({'ok':True,'steps':steps,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
 except Exception:
  shot(page,'failure');(out/'failure.txt').write_text(page.locator('body').inner_text(),encoding='utf-8');print('FAILED STEPS',steps,flush=True);raise
 finally:b.close()
