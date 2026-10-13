"""Built web demo: hydration, language fallback and imported full-save boundaries.
The imported save is an explicit adversarial fixture, not an earned playthrough.
"""
from pathlib import Path
import json, os
from playwright.sync_api import sync_playwright, expect

root = Path(__file__).resolve().parents[2]
out = root / 'output/release-ux-20261013/demo-boundary-locale'
out.mkdir(parents=True, exist_ok=True)
base = os.environ.get('CODESHIFT_QA_URL', 'http://127.0.0.1:5191/')
fixture = Path(os.environ.get('CODESHIFT_FULL_SAVE', 'C:/codex-workspaces/codeshift-release-20261012/output/curriculum-20261013/career/ending-save.json'))
report = {'locales': [], 'importedFullSave': False}

with sync_playwright() as pw:
    b = pw.chromium.launch(channel='chrome', headless=True)
    try:
        for lang, locale, zone in [('ko', 'ko-KR', 'Asia/Seoul'), ('en', 'en-US', 'America/New_York'), ('ja', 'ja-JP', 'Asia/Tokyo')]:
            c = b.new_context(locale=locale, timezone_id=zone, viewport={'width':1366, 'height':768})
            # Model a region service with no answer; the built page still hydrates normally.
            c.route('**/api/locale', lambda r: r.fulfill(status=200, content_type='application/json', body='{"language":null}'))
            c.route('**/cdn-cgi/trace', lambda r: r.fulfill(status=200, content_type='text/plain', body='loc=XX\n'))
            p = c.new_page(); p.set_default_timeout(12000); errors = []
            p.on('pageerror', lambda e: errors.append(str(e)))
            p.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
            p.goto(base, wait_until='networkidle')
            expect(p.locator('html')).to_have_attribute('lang',lang)
            expect(p.get_by_test_id('title-continue')).to_be_disabled()
            p.get_by_test_id('title-settings').click()
            p.get_by_role('combobox', name='Language').select_option('en' if lang != 'en' else 'ja')
            chosen = 'en' if lang != 'en' else 'ja'
            p.keyboard.press('Escape'); p.reload(wait_until='networkidle')
            expect(p.locator('html')).to_have_attribute('lang',chosen)
            assert not errors, errors
            report['locales'].append({'language':lang,'browserFallback':True,'manualChoiceSurvivesReload':True,'hydrationErrors':errors})
            c.close()

        seed = json.loads(fixture.read_text(encoding='utf-8'))
        assert seed['gameplay']['career']['ending']
        c = b.new_context(locale='en-US', timezone_id='America/New_York', viewport={'width':1366,'height':768})
        c.add_init_script('localStorage.setItem("codeshift-language","en");localStorage.setItem("codeshift-intro-demo-v1",'+json.dumps(json.dumps(seed))+');')
        p = c.new_page(); p.set_default_timeout(12000); errors = []
        p.on('pageerror',lambda e: errors.append(str(e)))
        p.goto(base,wait_until='networkidle'); p.get_by_test_id('title-continue').click()
        if p.get_by_test_id('demo-complete').is_visible():
            p.get_by_test_id('demo-complete').locator('.primary-button').click()
        for app in ['Python Automation','SQL Database','Practice jobs']:
            assert p.locator('.pc-shortcuts').get_by_role('button',name=app,exact=True).count() == 0
        p.get_by_test_id('taskbar-start').click()
        for app in ['Python Automation','SQL Database','Practice jobs']:
            assert p.locator('.pc-start-apps').get_by_role('button',name=app,exact=True).count() == 0
        p.locator('.pc-start-apps').get_by_role('button',name='Contracts',exact=True).click()
        expect(p.get_by_test_id('career-job-bakery-price')).to_be_attached()
        assert p.locator('[data-testid^="career-job-"]').count() == 1
        for id in ['career-release-button','career-tools-button','career-map-button','studio-start','studio-editor']:
            assert p.get_by_test_id(id).count() == 0, id
        p.locator('.pc-shortcuts').get_by_role('button',name='Terminal',exact=True).click()
        field=p.locator('.pc-window[data-active=true] .terminal-form input')
        for command in ['cd /home/dev','cat /home/dev/studio/index.html','cd /home/dev/database','code /home/dev/jobs/library-loans/rules.json']:
            field.fill(command); field.press('Enter')
            p.wait_for_function('(command)=>JSON.parse(localStorage.getItem("codeshift-intro-demo-v1")).history.at(-1)?.command===command',arg=command)
            if command != 'cd /home/dev':
                assert p.evaluate('JSON.parse(localStorage.getItem("codeshift-intro-demo-v1")).history.at(-1).error'),command
        current=p.evaluate('JSON.parse(localStorage.getItem("codeshift-intro-demo-v1"))')
        assert current['credits']==seed['credits']
        assert current['gameplay']['career']['completed']==seed['gameplay']['career']['completed']
        assert not errors,errors
        p.screenshot(path=str(out/'imported-save-boundary.png'))
        report['importedFullSave']={'hiddenPaidApps':True,'onlyBakeryContract':True,'privateTerminalPathsBlocked':True,'progressAndRewardsPreserved':True,'errors':errors}
        c.close(); report['passed']=True
    except Exception as error:
        report['error']=str(error)
        if 'p' in locals() and not p.is_closed():
            p.screenshot(path=str(out/'failure.png'))
            (out/'failure.txt').write_text(p.locator('body').inner_text(),encoding='utf-8')
        raise
    finally:
        b.close()
        (out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
        print(json.dumps(report,ensure_ascii=False))
