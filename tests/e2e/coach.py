"""Cafe source-editing playthrough with real checks, three sequential locales.
Functional QA only, not a study of novice learning or enjoyment.
"""
from playwright.sync_api import sync_playwright, expect
from pathlib import Path
import json, os, re

out = Path(os.environ.get('CODESHIFT_QA_DIR', 'output/0.10-qa'))
out.mkdir(parents=True, exist_ok=True)
demo = os.environ.get('CODESHIFT_EDITION') == 'demo'
base = os.environ.get('CODESHIFT_QA_URL', 'http://127.0.0.1:5173/')


def state(p):
    return p.evaluate("JSON.parse(localStorage.getItem('codeshift-intro-demo-v1'))")


def click(p, id):
    p.get_by_test_id(id).click()


def source(p):
    return p.get_by_test_id('coach-source-input').locator('textarea')


def write(p, content, save=True):
    source(p).fill(content)
    if save:
        click(p, 'coach-apply')


def acknowledge_reward(p):
    p.locator('[role=dialog] .primary-button').click()
    # Level-up is a real second modal, not an automatic timed notification.
    p.wait_for_timeout(350)
    overlay = p.get_by_test_id('level-up-overlay')
    if overlay.is_visible():
        overlay.get_by_role('button').last.click()


def finish(p):
    click(p, 'coach-test')
    p.get_by_test_id('coach-deliver').wait_for()
    click(p, 'coach-deliver')
    acknowledge_reward(p)


with sync_playwright() as pw:
    b = pw.chromium.launch(channel='chrome', headless=True)
    reports = []
    try:
        for lang, locale in [('ko', 'ko-KR'), ('en', 'en-US'), ('ja', 'ja-JP')]:
            c = b.new_context(viewport={'width': 1366, 'height': 768}, locale=locale)
            p = c.new_page()
            p.set_default_timeout(12000)
            errors = []
            p.on('pageerror', lambda e: errors.append(str(e)))
            p.on('console', lambda m: errors.append(f'{m.text} ({m.location.get("url", "unknown source")})') if m.type == 'error' and not (os.environ.get('CODESHIFT_STATIC_QA') == '1' and any(x in m.location.get('url', '') for x in ['/api/locale', '/cdn-cgi/trace'])) else None)
            p.goto(base, wait_until='networkidle')
            click(p, 'title-settings')
            p.get_by_role('combobox', name='Language').select_option(lang)
            p.keyboard.press('Escape')
            p.locator('.pc-play').click()
            assert p.locator('.pc-window:visible').count() == 0
            legacy = p.add_style_tag(content='.game-desktop{display:grid;grid-template-columns:82px minmax(0,1fr) 302px;}')
            assert p.locator('.pc-shell').evaluate('(el)=>getComputedStyle(el).display') == 'flex'
            legacy.evaluate('(el)=>el.remove()')
            p.locator('.pc-shortcuts button').filter(has=p.locator('svg.lucide-message-circle')).click()
            p.locator('.message-body>.primary-button').click()
            click(p, 'coach-prepare')
            click(p, 'coach-inspect')

            assert p.get_by_test_id('coach-hint').count() == 0
            assert p.get_by_test_id('coach-goal').is_visible()
            assert p.get_by_test_id('coach-apply').is_disabled()
            original = source(p).input_value()
            click(p, 'coach-locate')
            selection = source(p).evaluate('(el)=>[el.selectionStart,el.selectionEnd]')
            assert selection[1] > selection[0]
            assert source(p).input_value() == original
            click(p, 'coach-source-test')
            p.get_by_test_id('coach-check-feedback').wait_for()
            assert any(not check['passed'] for check in state(p)['tests']['checks'])
            assert state(p)['completed'] == [] and state(p)['credits'] == 120
            assert source(p).input_value() == original and p.get_by_test_id('coach-apply').is_disabled()
            click(p, 'coach-hint-toggle')
            expect(p.get_by_test_id('coach-hint')).to_be_visible()
            assert p.get_by_test_id('coach-hint-code').count() == 1
            assert source(p).input_value() == original
            p.screenshot(path=str(out / f'{lang}-hint-concept.png'))
            click(p, 'coach-hint-code')
            p.screenshot(path=str(out / f'{lang}-hint-code.png'))
            assert source(p).input_value() == original
            click(p, 'coach-hint-toggle')
            assert p.get_by_test_id('coach-hint').count() == 0

            wrong = re.sub(r'(<h1\b[^>]*>).*?(</h1>)', r'\1달빛 빵집\2', original)
            write(p, wrong)
            assert '달빛 빵집' in json.dumps(state(p)['machines']['local']['files'], ensure_ascii=False)
            assert p.get_by_test_id('coach-source-editor').locator('header strong').inner_text() == 'index.html'
            assert p.get_by_test_id('coach-hint').count() == 0
            name = {'ko': '모노 카페', 'en': 'Mono Cafe', 'ja': 'モノカフェ'}[lang]
            write(p, wrong.replace('달빛 빵집', name), save=False)
            source(p).focus()
            source(p).press('End')
            source(p).press('Space')
            assert source(p).evaluate('(el)=>document.activeElement===el')
            p.screenshot(path=str(out / f'{lang}-source-edit-1366.png'))
            zoom_style = p.add_style_tag(content='html{zoom:1.5}')
            p.get_by_test_id('coach-source-editor').scroll_into_view_if_needed()
            p.screenshot(path=str(out / f'{lang}-source-edit-150pct.png'))
            assert p.locator('.cafe-coach').evaluate('(el)=>el.scrollWidth<=el.clientWidth+1')
            zoom_style.evaluate('(el)=>el.remove()')
            click(p, 'coach-apply')
            css = source(p).input_value()
            assert p.get_by_test_id('coach-hint').count() == 0
            write(p, css.replace('width: 960px', 'width: 130%'))
            click(p, 'coach-source-test')
            p.get_by_test_id('coach-check-feedback').wait_for()
            assert any(not check['passed'] for check in state(p)['tests']['checks'])
            assert p.get_by_test_id('coach-source-editor').locator('header strong').inner_text() == 'style.css'
            assert p.get_by_test_id('coach-hint').count() == 0
            write(p, source(p).input_value().replace('width: 130%', 'width: calc(100% - 0px)'))
            click(p, 'coach-source-test')
            p.get_by_test_id('coach-deliver').wait_for()
            assert all(check['passed'] for check in state(p)['tests']['checks'])
            p.screenshot(path=str(out / f'{lang}-alternate-css.png'))
            click(p, 'coach-deliver')
            acknowledge_reward(p)

            p.locator('.message-body>.primary-button').click()
            click(p, 'coach-inspect')
            assert p.locator('.coach-retry').is_visible()
            for _ in range(3):
                click(p, 'coach-add-cup')
            assert p.get_by_test_id('coach-total').inner_text() == '4,503'
            click(p, 'coach-inspect')
            assert p.get_by_test_id('coach-apply').is_disabled()
            broken = source(p).input_value()
            write(p, broken.replace('price + quantity', '13500'))
            click(p, 'coach-source-test')
            p.get_by_test_id('coach-check-feedback').wait_for()
            assert any(not check['passed'] for check in state(p)['tests']['checks'])
            assert state(p)['completed'] == [0]
            assert p.get_by_test_id('coach-hint').count() == 0
            write(p, '// alternate authored program\nfunction calculateTotal(price, quantity) {\n  const cups = quantity;\n  const amount = cups * price;\n  return amount;\n}\n')
            click(p, 'coach-serve')
            assert p.locator('.coach-retry').is_visible()
            for qty, target in [(2, '9,000'), (3, '15,000'), (1, '5,500')]:
                assert target in p.get_by_test_id('coach-order-target').inner_text()
                for _ in range(qty):
                    click(p, 'coach-add-cup')
                click(p, 'coach-serve')
            assert state(p)['gameplay']['servedCustomers'] == 3
            p.screenshot(path=str(out / f'{lang}-checkout.png'))
            finish(p)

            p.locator('.message-body>.primary-button').click()
            server = source(p).input_value()
            assert p.get_by_test_id('coach-apply').is_disabled()
            assert p.get_by_test_id('coach-storage').count() == 0
            write(p, server.replace('MENU_PATH = "/menu"', 'MENU_PATH = "/api/menu"'))
            assert p.get_by_test_id('coach-hint').count() == 0
            assert p.get_by_test_id('coach-apply').is_disabled()
            write(p, source(p).input_value().replace('SAVE_ORDERS = False', 'SAVE_ORDERS = True'))
            click(p, 'coach-connect')
            click(p, 'coach-menu')
            menu = p.get_by_test_id('coach-returned-menu')
            expect(menu).to_be_visible()
            assert menu.locator('li').count() == 1
            assert '4,500' in menu.inner_text() and '5,000' not in menu.inner_text()
            click(p, 'coach-order')
            assert state(p)['orders']
            assert state(p)['apiEvidence'] == {'menu': True, 'order': True}
            p.screenshot(path=str(out / f'{lang}-order.png'))
            finish(p)
            p.locator('.pc-window[data-active=true] button').filter(has_text='OPEN').click()
            assert state(p)['gameplay']['openingCelebrated']
            assert state(p)['completed'] == [0, 1, 2]
            (out / f'{lang}-cafe-save.json').write_text(json.dumps(state(p), ensure_ascii=False), encoding='utf-8')
            if demo:
                # OPEN hands off a real independent job; completion waits for delivery.
                expect(p.get_by_test_id('demo-complete')).to_have_count(0)
                click(p, 'opening-first-client')
                expect(p.get_by_test_id('career-accept')).to_be_visible()
                assert p.get_by_test_id('career-release-button').count() == 0
                assert p.get_by_test_id('career-job-library-loans').count() == 0
                click(p, 'career-accept')
                click(p, 'career-inspect')
                click(p, 'career-test')
                assert state(p)['gameplay']['career']['proofs']['bakery-price']['passed'] is False
                assert state(p)['gameplay']['career']['completed'] == []
                p.get_by_role('tab', name={'ko': '파일', 'en': 'Files', 'ja': 'ファイル'}[lang], exact=True).click()
                editor = p.locator('.career-editor textarea')
                expect(editor).to_be_visible()
                draft = json.loads(editor.input_value())
                draft['packSize'] = 6
                draft['packPrice'] = 10000
                editor.fill(json.dumps(draft, ensure_ascii=False, indent=2))
                click(p, 'career-test')
                assert state(p)['gameplay']['career']['proofs']['bakery-price']['passed'] is True
                assert p.get_by_test_id('career-deliver').is_disabled()
                p.get_by_test_id('career-reply-care').check()
                credits_before = state(p)['credits']
                click(p, 'career-deliver')
                assert state(p)['gameplay']['career']['completed'] == ['bakery-price']
                assert state(p)['credits'] > credits_before
                expect(p.get_by_test_id('demo-complete')).to_be_visible()
                expect(p.get_by_test_id('demo-next-case')).to_be_visible()
                p.screenshot(path=str(out / f'{lang}-demo-complete.png'), animations='disabled')
                p.get_by_test_id('demo-complete').locator('.primary-button').click()
                expect(p.get_by_test_id('demo-revisit-sample')).to_be_visible()
                saved_credits = state(p)['credits']
                p.reload(wait_until='networkidle')
                p.locator('.pc-play').click()
                expect(p.get_by_test_id('demo-complete')).to_be_visible()
                assert state(p)['gameplay']['career']['completed'] == ['bakery-price']
                assert state(p)['credits'] == saved_credits
                assert state(p)['completed'] == [0, 1, 2] and state(p)['gameplay']['openingCelebrated']
                (out / f'{lang}-complete-demo-save.json').write_text(json.dumps(state(p), ensure_ascii=False), encoding='utf-8')
            else:
                click(p, 'opening-first-client')
                expect(p.get_by_test_id('career-accept')).to_be_visible()
                assert p.get_by_test_id('career-job-bakery-price').get_attribute('aria-current') == 'page'
            assert state(p)['gameplay']['career']['accepted'] == (['bakery-price'] if demo else [])
            assert state(p)['gameplay']['career']['completed'] == (['bakery-price'] if demo else [])
            assert not errors, errors
            reports.append({'language': lang, 'cafeChapters': 3, 'customersServed': 3,
                'actualApiEvidence': True, 'actualMenuResponse': True, 'fixedOrderTarget': True,
                'firstClientHandoff': True, 'demoBakeryCaseDelivered': demo, 'demoCompletionAndReload': demo,
                'authoredFullSource': True, 'clickOnlyRepairBlocked': True, 'alternateCssMeasured': True,
                'alternateProgramPassed': True, 'constantAnswerRejected': True, 'hintsManualOnly': True,
                'hintLevels': 2, 'sourceFocusPreserved': True, 'viewport1366And150pct': True,
                'errors': errors, 'functionalTestOnly': True})
            c.close()
        (out / 'coach-report.json').write_text(json.dumps(reports, ensure_ascii=False, indent=2), encoding='utf-8')
        print(json.dumps(reports, ensure_ascii=False))
    except Exception:
        p.screenshot(path=str(out / 'coach-failure.png'))
        (out / 'coach-failure.txt').write_text(p.locator('body').inner_text(), encoding='utf-8')
        raise
    finally:
        b.close()
