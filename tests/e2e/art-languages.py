from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import json

out = Path('output/art-qa')
errors = []
results = []
with sync_playwright() as pw:
    browser = pw.chromium.launch(channel='chrome', headless=True)
    try:
        for lang, locale, app, heading in [
            ('en', 'en-US', 'Contracts', 'The neighborhood you repair'),
            ('ja', 'ja-JP', '依頼センター', 'あなたが直すまち'),
        ]:
            context = browser.new_context(viewport={'width': 1600, 'height': 1000}, locale=locale)
            page = context.new_page()
            page.set_default_timeout(15000)
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto('http://127.0.0.1:5173/', wait_until='networkidle')
            page.locator('.pc-play').click()
            page.locator('.pc-language').click()
            page.locator('.save-tools input[type=file]').set_input_files('output/pc-qa/completed-save.json')
            page.locator('.save-confirm .primary-button').click()
            page.locator('.settings-dialog').wait_for(state='hidden')
            page.get_by_role('combobox', name='Language', exact=True).select_option(lang)
            page.locator('.pc-play').click()
            page.locator('.pc-shortcuts').get_by_role('button', name=app, exact=True).click()
            page.locator('.pc-window[data-active="true"] .pc-window-buttons button').nth(3).click()
            expect(page.get_by_test_id('neighborhood-map').get_by_role('heading', name=heading)).to_be_visible()
            expect(page.get_by_test_id('map-open-request')).to_be_enabled()
            page.locator('.map-chapters button').nth(2).click()
            expect(page.get_by_test_id('map-open-request')).to_be_disabled()
            page.locator('.map-chapters button').nth(0).click()
            page.get_by_test_id('map-pin-bakery-price').focus()
            page.keyboard.press('Enter')
            page.screenshot(path=str(out / f'map-{lang}.png'), animations='disabled')
            page.set_viewport_size({'width': 390, 'height': 844})
            if page.locator('.quest-tracker .panel-close').is_visible():
                page.locator('.quest-tracker .panel-close').click()
            expect(page.get_by_test_id('map-open-request')).to_be_in_viewport()
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            page.screenshot(path=str(out / f'map-{lang}-mobile.png'), animations='disabled')
            page.get_by_test_id('map-open-request').click()
            expect(page.get_by_test_id('career-accept')).to_be_visible()
            results.append({'language': lang, 'localizedMap': True, 'lockedChapter': True,
                            'keyboardPin': True, 'mobileCTAVisible': True, 'opensActualRequest': True})
            context.close()
        assert not errors, errors
        (out / 'languages-report.json').write_text(json.dumps({'results': results, 'errors': errors}, indent=2))
        print(json.dumps(results))
    finally:
        browser.close()
