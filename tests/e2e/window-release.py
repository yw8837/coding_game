"""Focused release window checks, using an earned save and actual UI interactions.

One Chromium process; locales and viewport cases run sequentially. Effective zoom
cases resize the CSS viewport, not deviceScaleFactor (which changes raster density).
This does not claim to reproduce the browser chrome's actual zoom implementation.
"""
from pathlib import Path
import argparse
import copy
import json
import traceback
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('--url', default='http://127.0.0.1:5190/')
parser.add_argument('--save', type=Path, default=Path('C:/codex-workspaces/codeshift-release-20261012/output/curriculum-20261013/cafe/en-cafe-save.json'))
parser.add_argument('--out', type=Path, default=ROOT / 'output/release-ux-20261013')
parser.add_argument('--languages', default='ko,en,ja')
args = parser.parse_args()
args.out.mkdir(parents=True, exist_ok=True)
seed = json.loads(args.save.read_text(encoding='utf-8'))
SAVE_KEY = 'codeshift-intro-demo-v1'
LOCALES = {'ko': 'ko-KR', 'en': 'en-US', 'ja': 'ja-JP'}
MAX_LABELS = {'ko': '창 최대화 또는 복원', 'en': 'Maximize or restore window', 'ja': 'ウィンドウを最大化または元に戻す'}
REPORT = {'seed': str(args.save), 'url': args.url, 'cases': [], 'zoomMethod': 'CSS viewport = physical viewport / scale; actual browser zoom unverified'}


def active(page, app):
    return page.locator(f'.pc-window[data-window="{app}"][data-active="true"]:visible')


def settled(page):
    page.wait_for_function("()=>!document.getAnimations().some(a=>a.playState==='running'&&a.effect?.target?.closest?.('.pc-window'))")


def activate(page, app):
    if not active(page, app).count():
        page.locator(f'.pc-task-apps button[data-task-app="{app}"]').click()
    expect(active(page, app)).to_be_visible()
    settled(page)
    return active(page, app)


def stage_box(page):
    return page.locator('.pc-stage').bounding_box()


def inside(box, outer, tolerance=2):
    return (box['x'] >= outer['x'] - tolerance and box['y'] >= outer['y'] - tolerance
            and box['x'] + box['width'] <= outer['x'] + outer['width'] + tolerance
            and box['y'] + box['height'] <= outer['y'] + outer['height'] + tolerance)


def reachable(locator):
    locator.scroll_into_view_if_needed()
    assert locator.evaluate("el=>{const r=el.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !!hit&&el.contains(hit)}"), 'control center is covered or clipped'


def drag(page, handle, dx, dy):
    settled(page)
    box = handle.bounding_box()
    start = (box['x'] + box['width'] / 2, box['y'] + box['height'] / 2)
    page.mouse.move(*start)
    page.mouse.down()
    page.mouse.move(start[0] + dx, start[1] + dy, steps=8)
    page.mouse.up()
    settled(page)


def maximize_restore(page, lang, checks):
    editor = activate(page, 'editor')
    button = editor.get_by_role('button', name=MAX_LABELS[lang], exact=True)
    if not button.count():
        checks['compactSingleWindow'] = True
        assert inside(editor.bounding_box(), stage_box(page))
        return
    # Resize to the shared minimum via a visible handle; no injected window state.
    box = editor.bounding_box()
    drag(page, editor.locator('.handle-se'), -box['width'], -box['height'])
    normal = editor.bounding_box()
    assert abs(normal['width'] - 380) <= 2 and abs(normal['height'] - 280) <= 2, normal
    button.click()
    settled(page)
    assert inside(editor.bounding_box(), stage_box(page))
    button.click()
    settled(page)
    restored = editor.bounding_box()
    assert abs(restored['width'] - normal['width']) <= 2
    assert abs(restored['height'] - normal['height']) <= 2
    button.click()
    settled(page)
    stage = stage_box(page)
    header = editor.locator('.pc-titlebar').bounding_box()
    page.mouse.move(header['x'] + header['width'] * .4, header['y'] + 19)
    page.mouse.down()
    page.mouse.move(stage['x'] + stage['width'] * .5, stage['y'] + 100, steps=8)
    page.mouse.up()
    settled(page)
    restored = editor.bounding_box()
    assert not editor.evaluate("el=>el.classList.contains('arranged')")
    assert abs(restored['width'] - normal['width']) <= 2, restored
    assert abs(restored['height'] - normal['height']) <= 2, restored
    checks['maximizeButtonAndDragRestoreMinimum'] = True


def edge_handles(page, checks):
    editor = activate(page, 'editor')
    handles = {}
    for direction in ['n', 's', 'w', 'e', 'nw', 'ne', 'sw', 'se']:
        handle = editor.locator('.handle-' + direction)
        reachable(handle)
        before = editor.bounding_box()
        dx = -16 if 'w' in direction else 16 if 'e' in direction else 0
        dy = -12 if 'n' in direction else 12 if 's' in direction else 0
        drag(page, handle, dx, dy)
        after = editor.bounding_box()
        assert inside(after, stage_box(page)), (direction, after)
        assert any(abs(after[k] - before[k]) > 2 for k in ['x', 'y', 'width', 'height']), direction
        handles[direction] = {'hit': True, 'before': before, 'after': after}
    checks['resizeHandles'] = handles


def run_case(browser, lang, size, label):
    context = browser.new_context(viewport={'width': size[0], 'height': size[1]}, locale=LOCALES[lang])
    saved = copy.deepcopy(seed)
    context.add_init_script("localStorage.setItem(" + json.dumps(SAVE_KEY) + "," + json.dumps(json.dumps(saved, ensure_ascii=False)) + ");localStorage.setItem('codeshift-language'," + json.dumps(lang) + ");localStorage.setItem('codeshift-guided','false');localStorage.setItem('codeshift-advanced','true');")
    page = context.new_page()
    page.set_default_timeout(10000)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    row = {'language': lang, 'viewport': size, 'case': label, 'checks': {}, 'pageErrors': errors}
    REPORT['cases'].append(row)
    checks = row['checks']
    try:
        page.goto(args.url, wait_until='networkidle')
        page.get_by_test_id('title-continue').click()
        # Dismiss the quest overlay through its topbar toggle if it is on screen.
        overlay = page.locator('.pc-quest-backdrop')
        if overlay.is_visible():
            page.locator('.pc-topbar button[aria-expanded="true"]').click()
        taskbar = page.locator('.pc-taskbar')
        assert inside(taskbar.bounding_box(), {'x': 0, 'y': 0, 'width': size[0], 'height': size[1]})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        checks['taskbarOnScreenNoDocumentOverflow'] = True

        terminal = activate(page, 'terminal')
        field = terminal.locator('.terminal-form input')
        expect(field).to_be_focused()
        draft = 'echo window-draft-' + lang
        field.fill(draft)
        field.press('Home')
        field.press('Shift+ArrowRight')
        terminal_selection = field.evaluate('el=>[el.selectionStart,el.selectionEnd]')
        reachable(terminal.locator('.terminal-form button[type="submit"]'))

        editor = activate(page, 'editor')
        code = editor.locator('.code-input-wrap textarea')
        expect(code).to_be_focused()
        original = code.input_value()
        text = original + '\n/* window selection ' + lang + ' */'
        code.fill(text)
        code.press('Home')
        for _ in range(5):
            code.press('Shift+ArrowRight')
        selection = code.evaluate('el=>[el.selectionStart,el.selectionEnd]')
        assert selection[1] - selection[0] == 5, selection
        activate(page, 'terminal')
        expect(field).to_be_focused()
        assert field.input_value() == draft
        assert field.evaluate('el=>[el.selectionStart,el.selectionEnd]') == terminal_selection
        activate(page, 'editor')
        expect(code).to_be_focused()
        assert code.input_value() == text
        assert code.evaluate('el=>[el.selectionStart,el.selectionEnd]') == selection
        checks['terminalDraftAndSelectionRetained'] = True
        checks['editorTextAndSelectionRetained'] = True
        reachable(editor.locator('.editor-actions .primary-button'))
        checks['editorTestControlReachableByScroll'] = True

        buttons = page.locator('.pc-task-apps button')
        buttons.first.focus()
        page.keyboard.press('End')
        expect(buttons.last).to_be_focused()
        reachable(buttons.last)
        page.keyboard.press('Home')
        expect(buttons.first).to_be_focused()
        page.keyboard.press('ArrowRight')
        expect(buttons.nth(1)).to_be_focused()
        target = buttons.nth(1).get_attribute('data-task-app')
        page.keyboard.press('Enter')
        expect(active(page, target)).to_be_visible()
        checks['taskbarArrowsHomeEndEnter'] = True
        activate(page, 'editor')
        page.keyboard.press('F6')
        expect(active(page, 'terminal')).to_be_visible()
        expect(field).to_be_focused()
        page.keyboard.press('Shift+F6')
        expect(active(page, 'editor')).to_be_visible()
        expect(code).to_be_focused()
        checks['F6ForwardBackwardStableOrder'] = True
        page.get_by_test_id('show-desktop').click()
        expect(page.locator('.pc-window:visible')).to_have_count(0)
        page.keyboard.press('F6')
        expect(page.locator('.pc-window[data-active="true"]:visible')).to_have_count(1)
        checks['F6RestoresMinimizedWindow'] = True

        if label == '1920x1080-100%':
            editor = activate(page, 'editor')
            original_box = editor.bounding_box()
            page.set_viewport_size({'width': 640, 'height': 340})
            page.wait_for_function("()=>{const el=document.querySelector('.pc-window[data-window=editor]');const stage=document.querySelector('.pc-stage');return el&&stage&&Math.abs(el.getBoundingClientRect().width-stage.getBoundingClientRect().width)<2}")
            assert inside(editor.bounding_box(), stage_box(page))
            assert inside(taskbar.bounding_box(), {'x': 0, 'y': 0, 'width': 640, 'height': 340})
            page.set_viewport_size({'width': size[0], 'height': size[1]})
            page.wait_for_function("r=>{const el=document.querySelector('.pc-window[data-window=editor]');const b=el?.getBoundingClientRect();return b&&Math.abs(b.width-r.width)<2&&Math.abs(b.height-r.height)<2}", arg=original_box)
            assert inside(editor.bounding_box(), stage_box(page))
            checks['viewportShrinkAndExpansionRestoresNormalGeometry'] = True
        maximize_restore(page, lang, checks)
        if label == '1366x768-100%':
            edge_handles(page, checks)
        activate(page, 'editor')
        page.screenshot(path=str(args.out / f'{lang}-{label}.png'), animations='disabled')
        current = page.evaluate("JSON.parse(localStorage.getItem('codeshift-intro-demo-v1'))")
        for key in ['xp', 'credits', 'completed', 'mission']:
            assert current[key] == seed[key], key
        checks['EarnedProgressPreserved'] = True
        assert not errors, errors
        row['passed'] = True
    except Exception as error:
        row['passed'] = False
        row['error'] = str(error)
        row['trace'] = traceback.format_exc()
        page.screenshot(path=str(args.out / f'{lang}-{label}-failure.png'), animations='disabled')
        (args.out / f'{lang}-{label}-failure.txt').write_text(page.locator('body').inner_text(), encoding='utf-8')
    finally:
        context.close()
        (args.out / 'window-report.json').write_text(json.dumps(REPORT, ensure_ascii=False, indent=2), encoding='utf-8')


with sync_playwright() as pw:
    browser = pw.chromium.launch(channel='chrome', headless=True)
    try:
        for language in args.languages.split(','):
            for physical in [(1280, 720), (1366, 768), (1920, 1080)]:
                for scale in [1, 1.25, 1.5]:
                    size = (round(physical[0] / scale), round(physical[1] / scale))
                    label = f'{physical[0]}x{physical[1]}-{round(scale * 100)}%'
                    run_case(browser, language, size, label)
            run_case(browser, language, (390, 360), '390x360-narrow-short')
    finally:
        browser.close()
passed = sum(case.get('passed', False) for case in REPORT['cases'])
print(json.dumps({'passed': passed, 'total': len(REPORT['cases']), 'report': str(args.out / 'window-report.json')}))
raise SystemExit(0 if passed == len(REPORT['cases']) else 1)
