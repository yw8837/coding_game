"""Type npm test in the real TerminalView and check repair feedback on that surface."""
import json
import sys
from playwright.sync_api import sync_playwright, expect

payload=json.load(sys.stdin)
checks=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(channel='chrome',headless=True)
    try:
        for language in ['ja','zh']:
            print('Checking TerminalView: '+language,file=sys.stderr,flush=True)
            page=browser.new_page(viewport={'width':1280,'height':800})
            page.set_content('<!doctype html><div id="root"></div>')
            page.add_script_tag(content=payload['script'])
            page.evaluate('(language)=>TerminalQA.mount(language)',language)
            print('Mounted: '+language,file=sys.stderr,flush=True)
            field=page.locator('.terminal-form input')
            field.fill('npm test');field.press('Enter')
            panel=page.get_by_test_id('terminal-check-feedback')
            expect(panel).to_be_visible()
            expect(panel.locator('[data-testid^="terminal-repair-check-"]')).to_have_count(2)
            assert 'index.html' in panel.inner_text() and 'style.css' in panel.inner_text()
            assert '100%' in panel.inner_text()
            assert not any('\uac00'<=c<='\ud7a3' for c in panel.inner_text()),panel.inner_text()
            page.get_by_test_id('terminal-repair-check-1').click()
            expect(page.locator('#opened-file')).to_have_text('style.css')
            # Edit through the ordinary simulated terminal, then rerun npm test.
            field.fill("echo '<h1>"+('モノカフェ' if language=='ja' else '莫诺咖啡馆')+"</h1>' > index.html")
            field.press('Enter')
            expect(panel).to_have_count(0)
            field.fill('npm test');field.press('Enter')
            expect(panel).to_be_visible()
            expect(page.get_by_test_id('terminal-repair-check-0')).to_have_count(0)
            expect(page.get_by_test_id('terminal-repair-check-1')).to_be_visible()
            checks.append(language+': npm test shows current localized reasons and opens the exact repair file; editing invalidates old results')
            page.close()
        print(json.dumps({'passed':len(checks),'checks':checks},ensure_ascii=False))
    finally:
        browser.close()
