"""Exercise the workspace shell using actual UI actions and a fresh save per locale."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import json

out = Path('output/0.11-qa'); out.mkdir(parents=True, exist_ok=True)
reports = []
with sync_playwright() as pw:
 b = pw.chromium.launch(channel='chrome', headless=True)
 try:
  for lang, locale in [('ko','ko-KR'),('en','en-US'),('ja','ja-JP')]:
   c = b.new_context(viewport={'width':1440,'height':960}, locale=locale)
   p = c.new_page(); p.set_default_timeout(12000); errors=[]
   p.on('pageerror', lambda e: errors.append(str(e)))
   p.goto('http://127.0.0.1:5173/', wait_until='networkidle')
   p.locator('.pc-play').click(); assert p.locator('.pc-window:visible').count()==0
   clock=p.get_by_test_id('taskbar-clock')
   expect(clock.locator('span')).not_to_have_text('--:--')
   assert clock.locator('span').inner_text()==p.evaluate("l=>new Date().toLocaleTimeString(l,{hour:'2-digit',minute:'2-digit',hour12:false})",locale)
   clock.click(); expect(p.get_by_test_id('calendar-today')).to_be_focused()
   original=p.locator('#workspace-calendar-month').inner_text()
   p.get_by_test_id('calendar-prev').click(); assert p.locator('#workspace-calendar-month').inner_text()!=original
   p.get_by_test_id('calendar-next').click(); assert p.locator('#workspace-calendar-month').inner_text()==original
   p.get_by_test_id('calendar-next').click(); p.get_by_test_id('calendar-today').click()
   assert p.locator('#workspace-calendar-month').inner_text()==original
   assert p.locator('.pc-calendar-grid [aria-current=date]').count()==1
   p.keyboard.press('Escape'); expect(p.get_by_test_id('desktop-calendar')).to_have_count(0); expect(clock).to_be_focused()
   p.get_by_test_id('taskbar-search').click(); expect(p.locator('.pc-search input')).to_be_focused()
   p.locator('.pc-search input').fill('Terminal'); assert p.locator('.pc-start-apps button').count()==1
   p.locator('.pc-start-apps button').click(); expect(p.get_by_test_id('desktop-start')).to_have_count(0)
   field=p.locator('.pc-window[data-active=true] .terminal-form input')
   for command in ['echo workspace > studio.txt','code studio.txt']:
    field.fill(command); field.press('Enter')
    p.wait_for_function("s=>JSON.parse(localStorage.getItem('codeshift-intro-demo-v1')).history.at(-1)?.command===s",arg=command)
   expect(p.get_by_test_id('virtual-file-path')).to_contain_text('/home/dev/studio.txt')
   expect(p.get_by_test_id('virtual-file-source').locator('textarea')).to_have_value('workspace\n')
   p.get_by_test_id('taskbar-start').click(); p.locator('.pc-search input').fill('')
   expect(p.get_by_test_id('start-recent-file-0')).to_contain_text('studio.txt')
   p.get_by_test_id('start-recent-file-0').click(); expect(p.get_by_test_id('virtual-file-path')).to_contain_text('studio.txt')
   # Closing a shell popup must leave the editor behind it intact.
   clock.click(); expect(p.locator('.pc-recent-work')).to_contain_text('code studio.txt')
   p.keyboard.press('Escape'); expect(p.get_by_test_id('virtual-file-editor')).to_be_visible()
   p.get_by_test_id('show-desktop').click(); assert p.locator('.pc-window:visible').count()==0
   label={'ko':'에디터','en':'Editor','ja':'エディター'}[lang]
   p.locator('.pc-task-apps').get_by_role('button',name=label,exact=True).click()
   expect(p.get_by_test_id('virtual-file-editor')).to_be_visible()
   p.locator('.pc-task-apps').get_by_role('button',name=label,exact=True).click()
   assert p.locator('.pc-window[data-active=true]:visible').count()<=1
   p.get_by_test_id('show-desktop').click()
   sizes=[]
   for width in [1440,725,390]:
    p.set_viewport_size({'width':width,'height':960 if width>759 else 844})
    expect(clock).to_be_visible(); box=clock.bounding_box()
    assert box['x']+box['width']<=width and box['x']>width/2
    assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
    p.screenshot(path=str(out/f'{lang}-desktop-{width}.png'),animations='disabled')
    p.get_by_test_id('taskbar-start').click(); p.screenshot(path=str(out/f'{lang}-start-{width}.png'),animations='disabled')
    clock.click(); expect(p.get_by_test_id('desktop-start')).to_have_count(0)
    expect(p.get_by_test_id('desktop-calendar')).to_be_visible()
    p.get_by_test_id('calendar-prev').click(); p.get_by_test_id('calendar-today').click()
    assert p.get_by_test_id('calendar-today').evaluate('(el)=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}')
    assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
    panel=p.get_by_test_id('desktop-calendar').bounding_box(); assert panel['x']>=0 and panel['x']+panel['width']<=width
    p.screenshot(path=str(out/f'{lang}-calendar-{width}.png'),animations='disabled')
    p.locator('.pc-menu-backdrop').click(position={'x':width//2,'y':45})
    expect(p.get_by_test_id('desktop-calendar')).to_have_count(0)
    sizes.append({'width':width,'clockVisible':True,'noDocumentOverflow':True})
   assert not errors,errors
   reports.append({'language':lang,'emptyDesktop':True,'realClock':True,'calendarNavigation':True,'escapeAndFocus':True,'startSearch':True,'actualRecentFileReopen':True,'recentCommands':True,'showDesktopAndRestore':True,'sizes':sizes,'pageErrors':errors})
   c.close()
  (out/'desktop-shell-report.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding='utf-8')
  print(json.dumps(reports,ensure_ascii=False))
 except Exception:
  p.screenshot(path=str(out/'desktop-shell-failure.png'),animations='disabled'); raise
 finally: b.close()
