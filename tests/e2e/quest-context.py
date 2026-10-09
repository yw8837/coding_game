"""Regression: opening an app consumes navigation, never mission progress."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright, expect

OUT=Path('output/0.11-qa/quest-context');OUT.mkdir(parents=True,exist_ok=True)
reports=[]
labels={
 'ko':{'messages':'메시지','editor':'에디터','min':'창 최소화','max':'창 최대화 또는 복원','quest':'퀘스트 열기 또는 접기','work':'현재 작업'},
 'en':{'messages':'Messages','editor':'Editor','min':'Minimize window','max':'Maximize or restore window','quest':'Toggle quest','work':'Current task'},
 'ja':{'messages':'メッセージ','editor':'エディター','min':'ウィンドウを最小化','max':'ウィンドウを最大化または復元','quest':'クエストを開閉','work':'現在の作業'},
}
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='chrome',headless=True)
 try:
  for lang,locale in [('ko','ko-KR'),('en','en-US'),('ja','ja-JP')]:
   for width in [1440,390]:
    context=browser.new_context(viewport={'width':width,'height':960 if width>1000 else 844},locale=locale)
    page=context.new_page();page.set_default_timeout(10000);errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
    try:
     page.goto('http://127.0.0.1:5173/',wait_until='networkidle',timeout=20000);page.locator('.pc-play').click()
     area=page.locator('#mission-sidebar') if width>1000 else page.locator('.pc-compact-quest')
     cta=area.locator('button').filter(has=page.locator('svg.lucide-arrow-right'))
     current=area.get_by_test_id('quest-current-work')
     state=lambda:page.evaluate('JSON.parse(localStorage.getItem("codeshift-intro-demo-v1"))')
     expect(cta).to_be_visible()
     page.locator('.pc-shortcuts').get_by_role('button',name=labels[lang]['messages'],exact=True).click()
     message=page.locator('.pc-window[data-window="messages"]')
     expect(cta).to_have_count(0);expect(current).to_be_visible();expect(current.locator('summary')).to_contain_text(labels[lang]['work'])
     assert state() is None or not state()['accepted']
     expect(current).not_to_have_attribute('open','');current.locator('summary').click();expect(current).to_have_attribute('open','');expect(current.locator('p')).to_be_visible();current.locator('summary').click()
     message.get_by_role('button',name=labels[lang]['min'],exact=True).click();expect(cta).to_be_visible()
     page.locator('.pc-task-apps').get_by_role('button',name=labels[lang]['messages'],exact=True).click();expect(cta).to_have_count(0)
     message.locator('.pc-close').click();expect(cta).to_be_visible()
     expect(page.locator('.pc-mail-toast')).to_have_count(0)
     expect(page.locator('.pc-shortcut.first-message')).to_have_count(0)
     cta.click();expect(cta).to_have_count(0);expect(message).to_be_visible()
     if width>1000:
      message.get_by_role('button',name=labels[lang]['max'],exact=True).click()
      page.get_by_test_id('taskbar-start').click();page.locator('.pc-start-apps').get_by_role('button',name=labels[lang]['editor'],exact=True).click()
      editor=page.locator('.pc-window[data-window="editor"]');editor.get_by_role('button',name=labels[lang]['max'],exact=True).click()
      expect(cta).to_be_visible();cta.click();expect(cta).to_have_count(0)
      area.locator('.panel-close').click();expect(area).to_have_count(0);page.get_by_role('button',name=labels[lang]['quest'],exact=True).click();expect(current).to_be_visible()
     page.keyboard.press('Escape');expect(cta).to_be_visible()
     page.get_by_test_id('show-desktop').click();expect(cta).to_be_visible();cta.click();expect(cta).to_have_count(0)
     assert state() is None or not state()['accepted'];assert state() is None or not state()['completed']
     page.screenshot(path=str(OUT/f'{lang}-{width}-opened.png'),animations='disabled')
     if width>1000:
      old=current.locator('summary').inner_text();page.locator('.message-body>.primary-button').click()
      expect(current.locator('summary')).not_to_have_text(old);expect(cta).to_have_count(0)
      assert state()['accepted'];assert state()['completed']==[]
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
     assert not errors,errors
     reports.append({'language':lang,'width':width,'openPromptConsumed':True,'minimizeCloseEscapeRestore':True,'noCompletionByOpening':True,'manualDetailsToggle':True,'pageErrors':errors})
     print(f'passed {lang} {width}',flush=True)
    except Exception:
     page.screenshot(path=str(OUT/f'{lang}-{width}-failure.png'));(OUT/'failure.txt').write_text(page.locator('body').inner_text(),encoding='utf-8');raise
    finally:context.close()
 finally:browser.close()
(OUT/'report.json').write_text(json.dumps({'reports':reports,'browserClosed':True},ensure_ascii=False,indent=2),encoding='utf-8')
