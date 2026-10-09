"""UI-only operator edit insert, held visibly in the full editor."""
from pathlib import Path
import importlib.util, json, shutil, subprocess, time

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/trailer-rebuild/code-insert'
spec = importlib.util.spec_from_file_location('insert_clock', Path(__file__).with_name('capture-art.py'))
clock = importlib.util.module_from_spec(spec)
spec.loader.exec_module(clock)


def main():
    from playwright.sync_api import sync_playwright, expect
    OUT.mkdir(parents=True, exist_ok=True)
    shots, anchors, errors = [], [], []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel='chrome', headless=True)
        context = browser.new_context(viewport={'width': 1600, 'height': 900}, locale='ko-KR',
            record_video_dir=str(OUT / 'recording'), record_video_size={'width': 1600, 'height': 900})
        t0 = time.monotonic()
        page = context.new_page()
        page.set_default_timeout(10000)
        page.on('pageerror', lambda error: errors.append(str(error)))

        def active():
            return page.locator('.pc-window[data-active="true"]')

        def click(identity):
            if time.monotonic() - t0 > 100:
                raise TimeoutError('Operator insert exceeded its bounded capture window')
            page.get_by_test_id(identity).click()

        def maximize():
            if active().bounding_box()['width'] < 1500:
                active().get_by_role('button', name='창 최대화 또는 복원', exact=True).click()

        def now():
            return time.monotonic() - t0

        def end(identity, start, focus):
            shots.append({'id': identity, 'start': round(start, 3), 'end': round(now(), 3),
                'focus': page.locator(focus).first.bounding_box()})
            page.screenshot(path=str(OUT / (identity + '.png')))
            print('captured ' + identity, flush=True)

        try:
            page.goto('http://127.0.0.1:5173/', wait_until='networkidle', timeout=20000)
            anchors.append(clock.record_marker(page, t0, 'start'))
            # Pointer decoration follows real inputs; it does not affect game state.
            page.evaluate("""()=>{const dot=document.createElement('div');dot.style='position:fixed;width:14px;height:14px;border:2px solid white;border-radius:50%;pointer-events:none;z-index:99999;box-shadow:0 0 0 4px #72baff44;left:-30px;top:-30px';document.body.append(dot);document.addEventListener('pointermove',e=>{dot.style.left=(e.clientX-7)+'px';dot.style.top=(e.clientY-7)+'px'});document.addEventListener('pointerdown',()=>dot.style.background='#ffffff99');document.addEventListener('pointerup',()=>dot.style.background='transparent');}""")
            page.locator('.pc-play').click()
            page.locator('.pc-shortcuts').get_by_role('button', name='메시지', exact=True).click()
            page.locator('.message-body>.primary-button').click()
            maximize()
            close = page.get_by_role('button', name='퀘스트 상세 접기', exact=True)
            if close.is_visible():
                close.click()
            click('coach-prepare')
            click('coach-inspect')
            click('coach-title-cafe')
            click('coach-next')
            click('coach-width-fit')
            click('coach-next')
            click('coach-test')
            page.get_by_test_id('coach-deliver').wait_for()
            click('coach-deliver')
            page.locator('.reward-dialog').wait_for()
            page.get_by_role('button', name='이야기 계속하기', exact=True).click()
            page.locator('.message-body>.primary-button').click()
            expect(page.get_by_test_id('coach-total')).to_have_text('4,503')
            click('coach-inspect')
            active().get_by_role('button', name='전체 코드 보기', exact=True).click()
            maximize()
            page.locator('.pc-language').click()
            mode = page.get_by_test_id('guided-mode-toggle')
            if mode.get_attribute('aria-pressed') == 'true':
                mode.click()
            expect(mode).to_have_text('직접 작업')
            page.get_by_role('button', name='설정 닫기', exact=True).click()
            page.locator('.pc-start-button').click()
            page.locator('.pc-start-apps').get_by_role('button', name='에디터', exact=True).click()
            maximize()
            editor = page.locator('.pc-window[data-window="editor"]')
            expect(editor).to_have_attribute('data-active', 'true')
            textarea = editor.locator('.code-input-wrap textarea')
            before = textarea.input_value()
            assert 'return price + quantity;' in before
            start = now()
            editor.get_by_role('button', name='고칠 글자 찾기', exact=True).click()
            page.wait_for_timeout(650)
            page.screenshot(path=str(OUT / 'operator-before.png'))
            page.keyboard.insert_text('*')
            expect(textarea).to_have_value(before.replace('price + quantity', 'price * quantity'))
            expect(editor).to_have_attribute('data-active', 'true')
            page.wait_for_timeout(1500)
            expect(editor).to_have_attribute('data-active', 'true')
            end('code-repair-visible', start, '.pc-window[data-window="editor"] .code-surface')
            after = textarea.input_value()
            start = now()
            editor.get_by_role('button', name='검사 실행', exact=True).click()
            page.wait_for_function("JSON.parse(localStorage.getItem('codeshift-intro-demo-v1')).tests?.mission===1 && JSON.parse(localStorage.getItem('codeshift-intro-demo-v1')).tests.checks.every(c=>c.passed)")
            page.wait_for_timeout(1300)
            end('code-check-passed', start, '.pc-window[data-window="editor"] .check-panel')
            assert not errors, errors
            anchors.append(clock.record_marker(page, t0, 'end'))
            video = page.video
            context.close()
            recorded = Path(video.path())
            browser.close()
            media = clock.inspect_recording(recorded, clock.media_binary('ffmpeg'), clock.media_binary('ffprobe'))
            aligned, timing = clock.align_shots(shots, anchors, media)
            shutil.copyfile(recorded, OUT / 'raw.webm')
            evidence = {'gameCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
                'viewport': [1600, 900], 'capture': 'Actual fresh UI progression and real keyboard operator edit; no state injection',
                'mode': '직접 작업', 'sourceBefore': before, 'sourceAfter': after, 'correctCodeHoldSeconds': 1.5,
                'timing': timing, 'shots': aligned, 'pageErrors': errors, 'browserClosed': True}
            (OUT / 'evidence.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2), encoding='utf-8')
            print(json.dumps({'shots': aligned, 'browserClosed': True}, ensure_ascii=False), flush=True)
        except Exception:
            if not page.is_closed():
                page.screenshot(path=str(OUT / 'failure.png'))
                (OUT / 'failure.txt').write_text(page.locator('body').inner_text(), encoding='utf-8')
            raise
        finally:
            browser.close()


if __name__ == '__main__':
    main()
