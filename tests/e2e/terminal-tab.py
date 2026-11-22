"""Actual browser key events: Tab completion must never eject terminal input focus."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

out=Path('output/terminal-tab-qa');out.mkdir(parents=True,exist_ok=True)
seed=json.loads(Path('output/context-menu-qa/seed.json').read_text(encoding='utf-8'))
url=os.environ.get('GAME_QA_URL','http://127.0.0.1:5186/')
results=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(channel='chrome',headless=True)
    try:
        for lang,label in [('en','Terminal'),('ko','터미널'),('ja','ターミナル')]:
            context=browser.new_context(viewport={'width':1440,'height':960})
            context.add_init_script('localStorage.setItem("codeshift-language",'+json.dumps(lang)+');localStorage.setItem("codeshift-intro-demo-v1",'+json.dumps(json.dumps(seed))+');')
            page=context.new_page();page.set_default_timeout(15000)
            errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
            page.goto(url,wait_until='networkidle',timeout=120000)
            page.get_by_test_id('title-continue').click()
            page.locator('.pc-shortcuts').get_by_role('button',name=label,exact=True).click()
            field=page.locator('#terminal-main')
            history=page.locator('.terminal-entry').count()
            for value in ['cat no-such-file','notacommand','', 'cat 메모', 'cat メモ']:
                field.fill(value)
                for _ in range(10):
                    field.press('Tab')
                    expect(field).to_be_focused()
                assert page.locator('.terminal-entry').count()==history
                if value:expect(field).to_have_value(value)
            field.fill('cat index.html');field.press('Control+a');field.press('Tab')
            expect(field).to_be_focused();expect(field).to_have_value('cat index.html')
            assert field.evaluate('(el)=>el.selectionStart===0 && el.selectionEnd===el.value.length')
            field.fill('cat ind > untouched.txt');field.evaluate('(el)=>el.setSelectionRange(7,7)');field.press('Tab')
            expect(field).to_have_value('cat index.html > untouched.txt');expect(field).to_be_focused()
            field.fill('cat composing')
            prevented=field.evaluate('''el=>{
              const e=new KeyboardEvent('keydown',{key:'Tab',code:'Tab',bubbles:true,cancelable:true,isComposing:true});
              el.dispatchEvent(e);return e.defaultPrevented;
            }''')
            assert prevented,'IME Tab must not fall through to focus navigation'
            expect(field).to_have_value('cat composing');expect(field).to_be_focused()
            modifiers=field.evaluate('''el=>['ctrlKey','altKey','metaKey'].map(mod=>{
              const e=new KeyboardEvent('keydown',{key:'Tab',code:'Tab',bubbles:true,cancelable:true,[mod]:true});
              el.dispatchEvent(e);return e.defaultPrevented;
            })''')
            assert modifiers==[False,False,False],modifiers
            field.press('Shift+Tab');expect(field).not_to_be_focused()
            field.focus();field.press('Shift+F10');expect(page.get_by_role('menu')).to_be_visible()
            page.keyboard.press('Escape');expect(field).to_be_focused()
            assert page.locator('.terminal-entry').count()==history
            assert not errors,errors
            page.screenshot(path=str(out/(lang+'-tab.png')))
            results.append({'language':lang,'emptyAndMissingAndRepeatedTab':True,'selectionPreserved':True,'completionAtCaret':True,'imeDefaultPrevented':True,'modifiedTabUntouched':True,'shiftTabExit':True,'contextMenuEscape':True,'noCommandExecuted':True,'pageErrors':errors})
            context.close()
        (out/'tab-report.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
        print(json.dumps(results),flush=True)
    except Exception as error:
        page.screenshot(path=str(out/'tab-failure.png'),timeout=10000)
        (out/'last-failure.txt').write_text(str(error),encoding='utf-8')
        raise
    finally:
        browser.close()
