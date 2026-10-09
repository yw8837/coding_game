"""Real UI regressions for navigation events versus editable local state.

Run serially against the server owned by the QA runner. Each scenario imports
the UI-earned cafe fixture into an isolated context; no player storage is used.
"""
from pathlib import Path
import json
import os
import traceback

from playwright.sync_api import sync_playwright, expect


OUT = Path(os.environ.get('CODESHIFT_QA_DIR', 'output/0.13-qa'))
SEEDS = Path(os.environ.get('CODESHIFT_QA_SEEDS', 'output/0.12-qa'))
URL = os.environ.get('CODESHIFT_QA_URL', 'http://127.0.0.1:5173/')
KEY = 'codeshift-intro-demo-v1'
OUT.mkdir(parents=True, exist_ok=True)
report = {'scenarios': [], 'browserClosed': False}


def saved(page):
    return page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))', KEY)


def assert_no_errors(errors):
    assert not errors, errors


def window(page, app):
    return page.locator(f'.pc-window[data-window="{app}"]')


def open_app(page, app, label):
    page.get_by_test_id('show-desktop').click()
    page.locator('.pc-shortcuts').get_by_role('button', name=label, exact=True).click()
    target = window(page, app)
    expect(target).to_be_visible()
    expect(target).to_have_attribute('data-active', 'true')
    return target


def run_command(page, command):
    terminal = window(page, 'terminal')
    field = terminal.locator('.terminal-form input')
    before = len(saved(page)['history'])
    field.fill(command)
    field.press('Enter')
    page.wait_for_function(
        '({key,command,before})=>{const s=JSON.parse(localStorage.getItem(key));'
        'return s.history.length===before+1&&s.history.at(-1).command===command}',
        arg={'key': KEY, 'command': command, 'before': before},
    )
    last = saved(page)['history'][-1]
    assert not last['error'], last
    expect(field).to_have_value('')


def browser_history(page, check):
    browser = open_app(page, 'browser', 'Ghrom')
    address = browser.get_by_role('textbox', name='Ghrom 주소창', exact=True)
    back = browser.get_by_role('button', name='이전 페이지', exact=True)
    forward = browser.get_by_role('button', name='다음 페이지', exact=True)
    home = 'https://coocle.game/'
    cat = 'https://cathub.dev/mono/menu-site'
    docs = 'https://docs.coocle.game/terminal'
    css = 'https://docs.coocle.game/css'

    def navigate(url):
        address.fill(url)
        address.press('Enter')
        expect(address).to_have_value(url)

    check('initialBackDisabled', lambda: expect(back).to_be_disabled())
    navigate(cat)
    expect(browser.locator('.cathub')).to_be_visible()
    navigate(docs)
    expect(browser.locator('.docs-page')).to_be_visible()
    back.click()
    check('backReturnsToCatHub', lambda: expect(address).to_have_value(cat))
    forward.click()
    check('forwardReturnsToDocs', lambda: expect(address).to_have_value(docs))
    back.click()
    expect(address).to_have_value(cat)
    navigate(css)
    check('newNavigationTruncatesForward', lambda: expect(forward).to_be_disabled())
    back.click()
    check('branchHasOneHistoryEntry', lambda: expect(address).to_have_value(cat))
    back.click()
    check('branchReachesOriginalHome', lambda: expect(address).to_have_value(home))
    check('homeHasNoDuplicateBackEntry', lambda: expect(back).to_be_disabled())
    forward.click()
    expect(address).to_have_value(cat)
    address.fill('unfinished address draft')
    open_app(page, 'terminal', '터미널')
    run_command(page, 'pwd')
    open_app(page, 'browser', 'Ghrom')
    check('unrelatedCommandPreservesAddressDraft', lambda: expect(address).to_have_value('unfinished address draft'))


def terminal_queue(page, check):
    browser = open_app(page, 'browser', 'Ghrom')
    address = browser.get_by_role('textbox', name='Ghrom 주소창', exact=True)
    address.fill('https://cathub.dev/mono/menu-site')
    address.press('Enter')
    clone = browser.get_by_role('button', name='복제 명령 가져오기', exact=True)
    expect(clone).to_be_visible()
    before = len(saved(page)['history'])
    clone.click()
    terminal = window(page, 'terminal')
    field = terminal.locator('.terminal-form input')
    command = 'git clone https://cathub.dev/mono/menu-site.git'
    check('queuePopulatesCommand', lambda: expect(field).to_have_value(command))
    check('queueFocusesInput', lambda: expect(field).to_be_focused())
    check('queueDoesNotExecute', lambda: assert_history_count(page, before))
    field.fill('keep my terminal draft')
    page.get_by_test_id('open-wallet').click()
    wallet = window(page, 'workbench')
    choice = wallet.locator('.design-choices button').first
    choice.click()
    expect(choice).to_have_attribute('aria-pressed', 'true')
    open_app(page, 'terminal', '터미널')
    check('unrelatedGameActionDoesNotReplayQueue', lambda: expect(field).to_have_value('keep my terminal draft'))
    check('unrelatedActionDoesNotExecuteQueuedCommand', lambda: assert_history_count(page, before))
    open_app(page, 'browser', 'Ghrom')
    clone.click()
    check('sameCommandCanBeQueuedAgain', lambda: expect(field).to_have_value(command))
    check('secondQueueStillDoesNotExecute', lambda: assert_history_count(page, before))
    run_command(page, 'pwd')
    run_command(page, 'clear')
    check('clearHidesRenderedHistory', lambda: expect(terminal.locator('.terminal-entry')).to_have_count(0))
    field.fill('history draft')
    field.press('ArrowUp')
    check('historyRetainsClearCommand', lambda: expect(field).to_have_value('clear'))
    field.press('ArrowUp')
    check('historyRetainsPreviousCommand', lambda: expect(field).to_have_value('pwd'))
    field.press('ArrowDown')
    field.press('ArrowDown')
    check('historyRestoresDraft', lambda: expect(field).to_have_value('history draft'))
    before_clear = len(saved(page)['history'])
    field.press('Control+l')
    page.wait_for_function('({key,before})=>{const s=JSON.parse(localStorage.getItem(key));return s.history.length===before+1&&s.history.at(-1).command==="clear"}', arg={'key': KEY, 'before': before_clear})
    check('controlLPreservesInput', lambda: expect(field).to_have_value('history draft'))
    check('controlLClearsOnlyOutput', lambda: expect(terminal.locator('.terminal-entry')).to_have_count(0))


def assert_history_count(page, count):
    actual = len(saved(page)['history'])
    assert actual == count, {'expected': count, 'actual': actual}


def editor_selection(page, check):
    editor = open_app(page, 'editor', '에디터')
    style = editor.locator('.file-explorer button').filter(has_text='style.css')
    style.click()
    source = editor.locator('.code-surface textarea')
    draft = source.input_value() + '\n/* state sync regression */\n'
    source.fill(draft)
    check('editingPreservesManualFile', lambda: expect(style).to_have_class('selected'))
    open_app(page, 'terminal', '터미널')
    run_command(page, 'pwd')
    open_app(page, 'editor', '에디터')
    check('unrelatedCommandPreservesManualFile', lambda: expect(style).to_have_class('selected'))
    check('unrelatedCommandPreservesContent', lambda: expect(source).to_have_value(draft))
    open_app(page, 'terminal', '터미널')
    run_command(page, 'rm /home/dev/menu-site/style.css')
    open_app(page, 'editor', '에디터')
    check('removedFileDisappears', lambda: expect(style).to_have_count(0))
    selected = editor.locator('.file-explorer button.selected')
    check('removedSelectionFallsBackToExistingFile', lambda: expect(selected).to_have_count(1))
    filename = selected.locator('span').inner_text()
    check('fallbackHasMatchingEditorTab', lambda: expect(editor.locator('.editor-file-tab')).to_contain_text(filename))
    expected = saved(page)['machines']['local']['files']['/home/dev/menu-site/' + filename]
    check('fallbackDisplaysActualFile', lambda: expect(source).to_have_value(expected))


def career_focus(page, check):
    page.get_by_test_id('quest-open-app').click()
    career = window(page, 'career')
    bakery = career.get_by_test_id('career-job-bakery-price')
    library = career.get_by_test_id('career-job-library-loans')
    bakery.click()
    career.get_by_test_id('career-accept').click()
    career.get_by_test_id('career-inspect').click()
    library.click()
    check('manualUnacceptedJobCanBeBrowsed', lambda: expect(library).to_have_attribute('aria-current', 'page'))
    open_app(page, 'terminal', '터미널')
    run_command(page, 'pwd')
    open_app(page, 'career', '의뢰 센터')
    check('stateChangeDoesNotReplayFocusRequest', lambda: expect(library).to_have_attribute('aria-current', 'page'))
    # Tools resets the parent's focus token to zero. A later request with the
    # same number as the first request must still select the active contract.
    page.get_by_test_id('open-wallet').click()
    window(page, 'workbench').get_by_test_id('wallet-tools').click()
    expect(career.locator('.career-shop')).to_be_visible()
    library.click()
    page.get_by_test_id('show-desktop').click()
    page.get_by_test_id('quest-open-app').click()
    check('zeroResetAllowsRepeatedFocusToken', lambda: expect(bakery).to_have_attribute('aria-current', 'page'))
    library.click()
    page.get_by_test_id('show-desktop').click()
    page.get_by_test_id('quest-open-app').click()
    check('newFocusRequestSelectsActiveJob', lambda: expect(bakery).to_have_attribute('aria-current', 'page'))


with sync_playwright() as pw:
    browser = pw.chromium.launch(channel='chrome', headless=True)
    try:
        seed = json.loads((SEEDS / 'ko-cafe-save.json').read_text(encoding='utf-8'))
        for name, scenario in [('browserHistory', browser_history), ('terminalQueue', terminal_queue), ('editorSelection', editor_selection), ('careerFocus', career_focus)]:
            result = {'name': name, 'passed': False, 'assertions': [], 'pageErrors': [], 'consoleErrors': []}
            report['scenarios'].append(result)
            context = browser.new_context(viewport={'width': 1440, 'height': 960}, locale='ko-KR')
            page = context.new_page()
            page.set_default_timeout(12000)
            page.on('pageerror', lambda error, r=result: r['pageErrors'].append(str(error)))
            page.on('console', lambda message, r=result: r['consoleErrors'].append(message.text) if message.type == 'error' else None)

            def check(label, assertion):
                try:
                    assertion()
                    result['assertions'].append({'name': label, 'passed': True})
                except Exception as error:
                    result['assertions'].append({'name': label, 'passed': False, 'error': str(error)})
                    raise

            try:
                page.goto(URL, wait_until='networkidle')
                page.evaluate('({key,seed})=>{localStorage.setItem(key,JSON.stringify(seed));localStorage.setItem("codeshift-language","ko");localStorage.setItem("codeshift-guided","false")}', {'key': KEY, 'seed': seed})
                page.reload(wait_until='networkidle')
                page.locator('.pc-play').click()
                expect(page.get_by_test_id('show-desktop')).to_be_visible()
                scenario(page, check)
                check('noPageErrors', lambda: assert_no_errors(result['pageErrors']))
                check('noConsoleErrors', lambda: assert_no_errors(result['consoleErrors']))
                page.screenshot(path=str(OUT / f'state-sync-{name}.png'), animations='disabled')
                result['passed'] = True
            except Exception as error:
                result['error'] = str(error)
                result['traceback'] = traceback.format_exc()
                try:
                    page.screenshot(path=str(OUT / f'state-sync-{name}-failure.png'), animations='disabled')
                except Exception as screenshot_error:
                    result['screenshotError'] = str(screenshot_error)
            finally:
                context.close()
                result['contextClosed'] = True
                print(json.dumps(result, ensure_ascii=False), flush=True)
    finally:
        browser.close()
        report['browserClosed'] = True
        (OUT / 'state-sync-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')

assert report['scenarios'] and all(item['passed'] for item in report['scenarios']), report
