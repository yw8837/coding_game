"""Right-click regression checks against the local full-game renderer, isolated saves."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUT = Path('output/context-menu-qa')
OUT.mkdir(parents=True, exist_ok=True)
URL = os.environ.get('GAME_QA_URL', 'http://127.0.0.1:5186/')
SEED = json.loads((OUT / 'seed.json').read_text(encoding='utf-8'))
with sync_playwright() as pw:
    browser = pw.chromium.launch(channel='chrome', headless=True)
    try:
        context = browser.new_context(viewport={'width':1440,'height':960}, permissions=['clipboard-read','clipboard-write'])
        context.add_init_script('localStorage.setItem("codeshift-language","en");localStorage.setItem("codeshift-intro-demo-v1",'+json.dumps(json.dumps(SEED))+');')
        page = context.new_page()
        page.set_default_timeout(15000)
        errors=[]
        page.on('pageerror',lambda error: errors.append(str(error)))
        page.goto(URL,wait_until='networkidle',timeout=120000)
        page.get_by_role('button',name='Continue',exact=False).click()
        def app(name):
            page.locator('.pc-shortcuts').get_by_role('button',name=name,exact=True).click()
        def menu(target, label):
            target.click(button='right')
            page.get_by_role('menuitem',name=label,exact=True).click()
        def file_row(name):
            return page.locator('.computer-file-row').filter(has=page.locator('strong',has_text=name))
        def dialog_name(value, action):
            dialog=page.get_by_role('dialog')
            dialog.get_by_role('textbox',name='New name').fill(value)
            dialog.get_by_role('button',name=action,exact=True).click()
        app('This PC')
        row=page.locator('.computer-file-row').filter(has=page.locator('strong',has_text='index.html'))
        menu(row,'Copy path')
        assert page.evaluate('navigator.clipboard.readText()')==SEED['repo']['root']+'/index.html'
        menu(row,'Duplicate');dialog_name("my; draft's.html",'Duplicate')
        duplicate=file_row("my; draft's.html");expect(duplicate).to_be_visible()
        menu(duplicate,'Rename');dialog_name('index.html','Rename')
        expect(page.get_by_role('dialog').get_by_role('alert')).to_contain_text('already exists')
        dialog_name('renamed.html','Rename')
        renamed=file_row('renamed.html');expect(renamed).to_be_visible()
        menu(renamed,'Delete');page.get_by_role('dialog').get_by_role('button',name='Cancel',exact=True).click()
        expect(renamed).to_be_visible()
        menu(renamed,'Delete');page.get_by_role('dialog').get_by_role('button',name='Delete',exact=True).click()
        expect(renamed).to_have_count(0)
        heading=page.locator('.computer-files-heading')
        heading.focus();heading.press('Shift+F10')
        expect(page.get_by_role('menuitem',name='New folder',exact=True)).to_be_visible()
        page.keyboard.press('Escape');expect(heading).to_be_focused()
        menu(heading,'New folder');dialog_name('my workspace','New folder')
        file_row('my workspace').click()
        menu(heading,'New file');dialog_name('hello.html','New file')
        source=page.locator('.virtual-code-input textarea')
        expect(source).to_be_visible()
        source.fill('<h1>Hello</h1>')
        source.focus();source.press('Control+a')
        menu(source,'Copy')
        assert page.evaluate('navigator.clipboard.readText()')=='<h1>Hello</h1>'
        source.focus();source.press('Control+a');menu(source,'Cut');expect(source).to_have_value('')
        menu(source,'Undo');expect(source).to_have_value('<h1>Hello</h1>')
        menu(source,'Redo');expect(source).to_have_value('')
        menu(source,'Paste');expect(source).to_have_value('<h1>Hello</h1>')
        menu(page.get_by_test_id('virtual-file-path'),'Open terminal here')
        terminal=page.locator('#terminal-main')
        expect(terminal).to_be_visible()
        terminal.fill('echo old');terminal.press('Control+a')
        page.evaluate('navigator.clipboard.writeText("pwd\\nwhoami")')
        before=page.locator('.terminal-entry').count()
        menu(terminal,'Paste');expect(terminal).to_have_value('pwd whoami')
        assert page.locator('.terminal-entry').count()==before
        terminal.fill('pwd');terminal.press('Enter')
        expect(page.locator('.terminal-entry').last).to_contain_text('/my workspace')
        output=page.locator('.terminal-entry').last.locator('pre')
        output.select_text();menu(output,'Copy')
        assert page.evaluate('navigator.clipboard.readText()').endswith('/my workspace')
        for width,height in [(1440,960),(960,640)]:
            page.set_viewport_size({'width':width,'height':height})
            terminal.click(button='right')
            box=page.get_by_role('menu').bounding_box()
            assert box['x']>=0 and box['y']>=0 and box['x']+box['width']<=width and box['y']+box['height']<=height,box
            page.screenshot(path=str(OUT/f'en-menu-{width}.png'))
            page.keyboard.press('Escape');expect(terminal).to_be_focused()
        menu(terminal,'Clear screen');expect(page.locator('.terminal-entry')).to_have_count(0)
        for language,app_label,copy_label,paste_label in [('ko','터미널','복사','붙여넣기'),('ja','ターミナル','コピー','貼り付け')]:
            # A separate isolated context makes the language preference deterministic.
            localized=browser.new_context(viewport={'width':960,'height':640})
            localized.add_init_script('localStorage.setItem("codeshift-language",'+json.dumps(language)+');localStorage.setItem("codeshift-intro-demo-v1",'+json.dumps(json.dumps(SEED))+');')
            p=localized.new_page();p.goto(URL,wait_until='networkidle');p.get_by_test_id('title-continue').click()
            p.locator('.pc-shortcuts').get_by_role('button',name=app_label,exact=True).click()
            p.locator('#terminal-main').click(button='right')
            expect(p.get_by_role('menuitem',name=copy_label,exact=True)).to_be_visible()
            expect(p.get_by_role('menuitem',name=paste_label,exact=True)).to_be_visible()
            p.screenshot(path=str(OUT/f'{language}-menu.png'))
            localized.close()
        assert not errors,errors
        report={'fileCopyRenameDeleteAndCancel':True,'collisionBlocked':True,'folderNavigationAndCreate':True,'keyboardMenuAndEscape':True,'editorCopyCutPasteUndoRedo':True,'terminalPasteDoesNotExecute':True,'terminalWorkingDirectory':True,'outputCopy':True,'menuFitsViewports':[1440,960],'languages':['en','ko','ja'],'pageErrors':errors}
        (OUT/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
        print(json.dumps(report),flush=True)
    except Exception:
        page.screenshot(path=str(OUT/'failure.png'))
        print(page.locator('body').inner_text()[-3500:],flush=True)
        raise
    finally:
        browser.close()
