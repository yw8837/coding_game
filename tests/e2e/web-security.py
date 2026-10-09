"""Real UI security probes. Run only with exclusive browser ownership.

All probe requests use 127.0.0.1:1 and are aborted before any connection.
The report records observed requests; it never rewrites a failed check as a pass.
"""
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect
import json
import os
import subprocess
import time

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output' / '0.11-security'
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.environ.get('CODESHIFT_WEB_URL', 'http://127.0.0.1:5173').rstrip('/')
KEY = 'codeshift-intro-demo-v1'
MARKER = '__codeshiftXssMarker'
PROBE = 'http://127.0.0.1:1/codeshift-security-probe'
HTML = (
    f'<img src="{PROBE}-img" onerror="parent.{MARKER}=\'img\'">'
    f'<iframe src="{PROBE}-iframe"></iframe>'
    f'<script>parent.{MARKER}=\'script\'</script>'
    '<a href="javascript:parent.__codeshiftXssMarker=1">security-probe-link</a>'
)
report = {'base': BASE, 'checks': [], 'requests': [], 'blockedOutbound': [], 'pageErrors': []}


def record(name, **facts):
    report['checks'].append({'name': name, **facts})
    (OUT / 'web-security-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')


def saved(page):
    return page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))', KEY)


def raw_save(page):
    return page.evaluate('(key)=>localStorage.getItem(key)', KEY)


def fixture():
    commands = ['sudo apt update', 'sudo apt install nodejs npm',
                'git clone https://cathub.dev/mono/menu-site.git',
                'cd /home/dev/menu-site', 'npm install', 'npm run dev',
                "echo '<img data-security-history=\"literal\" onerror=\"window.__codeshiftXssMarker=1\">'"]
    script = """
import {createGame,runCommand} from './lib/game/engine.ts';
import {readSave} from './lib/game/save.ts';
let state=createGame();
for(const command of COMMANDS){const r=runCommand(state,command);if(r.error)throw Error(command+': '+r.output);state=r.state;}
const path='/home/dev/menu-site/index.html';
state.machines.local.files[path]+=PAYLOAD;
readSave(JSON.stringify(state));
console.log(JSON.stringify(state));
""".replace('COMMANDS', json.dumps(commands)).replace('PAYLOAD', json.dumps(HTML))
    result = subprocess.run(['node', '--input-type=module', '--eval', script], cwd=ROOT,
                            capture_output=True, text=True, encoding='utf-8', check=True)
    return result.stdout.strip().encode('utf-8')


def open_settings(page):
    page.locator('.pc-language').click()
    expect(page.locator('.settings-dialog')).to_be_visible()


def file_import(page, contents, name='security-fixture.json'):
    page.locator('.save-tools input[type=file]').set_input_files(
        {'name': name, 'mimeType': 'application/json', 'buffer': contents})


def deny_outbound(route):
    url = route.request.url
    parts = urlsplit(url)
    base = urlsplit(BASE)
    is_probe = url.startswith(PROBE)
    if is_probe or (parts.scheme in ('http', 'https') and (parts.scheme, parts.netloc) != (base.scheme, base.netloc)):
        report['blockedOutbound'].append({'url': url, 'probe': is_probe, 'resourceType': route.request.resource_type})
        route.abort()
    else:
        route.continue_()


with sync_playwright() as pw:
    browser = pw.chromium.launch(channel='chrome', headless=True)
    context = browser.new_context(viewport={'width': 1440, 'height': 960}, locale='ko-KR')
    context.route('**/*', deny_outbound)
    page = context.new_page()
    page.set_default_timeout(15000)
    page.on('pageerror', lambda error: report['pageErrors'].append(str(error)))
    page.on('request', lambda request: report['requests'].append({'url': request.url, 'resourceType': request.resource_type}))
    page.add_init_script("localStorage.setItem('codeshift-guided','false');localStorage.setItem('codeshift-language-preference','ko')")
    try:
        page.goto(BASE + '/', wait_until='networkidle')
        page.locator('.pc-play').click()
        expect(page.locator('.pc-shortcuts')).to_be_visible()
        assert page.locator('.pc-window:visible').count() == 0
        page.locator('.pc-shortcuts').get_by_role('button', name='터미널', exact=True).click()
        field=page.locator('.pc-window[data-active=true] .terminal-form input')
        field.fill('pwd');field.press('Enter')
        page.wait_for_function('(key)=>localStorage.getItem(key)!==null', arg=KEY)
        page.get_by_test_id('show-desktop').click()
        original = raw_save(page)
        record('fresh-ui', emptyDesktop=True)

        open_settings(page)
        for name, contents in [('malformed.json', b'{broken-json'),
                               ('oversized.json', b' ' * (16 * 1024 * 1024 + 1))]:
            file_import(page, contents, name)
            expect(page.locator('.save-tools [role=alert]')).to_be_visible()
            expect(page.locator('.save-confirm')).to_have_count(0)
            assert raw_save(page) == original
            record(name, rejected=True, previousSavePreserved=True)

        imported = fixture()
        file_import(page, imported)
        expect(page.locator('.save-confirm')).to_be_visible()
        page.locator('.save-confirm .primary-button').click()
        expect(page.locator('.pc-play')).to_be_visible()
        page.locator('.pc-play').click()
        page.wait_for_function("(key)=>JSON.parse(localStorage.getItem(key)).machines.local.files['/home/dev/menu-site/index.html'].includes('codeshift-security-probe')", arg=KEY)
        page.get_by_test_id('taskbar-clock').click()
        expect(page.locator('.pc-recent-work')).to_contain_text('data-security-history')
        assert page.locator('.pc-recent-work img,.pc-recent-work iframe,.pc-recent-work script').count() == 0
        assert page.evaluate('(marker)=>window[marker]===undefined', MARKER)
        record('import-and-history-escaping', importedRealFile=True, historyMarkupInert=True)
        page.keyboard.press('Escape')

        page.locator('.pc-shortcuts').get_by_role('button', name='Ghrom', exact=True).click()
        address = page.locator('.pc-window[data-active=true] .address-form input')
        address.fill('http://localhost:5173')
        address.press('Enter')
        frame = page.locator('.pc-window[data-active=true] .cafe-frame-wrap iframe')
        expect(frame).to_be_visible()
        page.wait_for_function("()=>{const doc=document.querySelector('.cafe-frame-wrap iframe')?.contentDocument;return !!doc?.querySelector('h1')}")
        # Vite HMR may stay active; the iframe DOM above is the readiness signal.
        # Allow a bounded observation window for detached parser resource requests.
        page.wait_for_timeout(750)
        assert frame.get_attribute('sandbox') == 'allow-same-origin'
        content = frame.evaluate("el=>({scripts:el.contentDocument.querySelectorAll('script,iframe').length,urls:el.contentDocument.querySelectorAll('[src],[srcset],[href],[onerror]').length,csp:el.contentDocument.querySelector('meta[http-equiv=\"Content-Security-Policy\"]')?.content})")
        assert content['scripts'] == 0 and content['urls'] == 0, content
        assert "default-src 'none'" in content['csp']
        assert page.evaluate('(marker)=>window[marker]===undefined', MARKER)
        probe_requests = [entry for entry in report['requests'] if entry['url'].startswith(PROBE)]
        record('actual-preview-isolation', sandbox=frame.get_attribute('sandbox'), content=content,
               markerExecuted=False, parserProbeRequests=probe_requests)
        page.screenshot(path=str(OUT / 'web-preview-probe.png'), animations='disabled')

        # Runtime attacks are entered through the actual editor, not an eval surrogate.
        page.get_by_test_id('show-desktop').click()
        page.locator('.pc-shortcuts').get_by_role('button', name='연습 의뢰', exact=True).click()
        page.get_by_test_id('code-lab-tab').click()
        page.get_by_test_id('lab-job-receipt').click()
        editor = page.get_by_test_id('lab-source').locator('textarea')
        before = saved(page)['credits']
        for source, kind in [('function solve(input) { while (true) {} }', 'budget'),
                             ('function solve(input) { return globalThis; }', 'unsupported'),
                             ('function solve(input) { return input.constructor; }', 'unsupported')]:
            editor.fill(source)
            started = time.monotonic()
            editor.press('Control+Enter')
            page.wait_for_function("({key,source})=>{const proof=JSON.parse(localStorage.getItem(key)).gameplay.lab.proofs.receipt;return proof?.source===source}", arg={'key': KEY, 'source': source})
            proof = saved(page)['gameplay']['lab']['proofs']['receipt']
            assert not proof['passed'] and proof['cases'][0]['error']['kind'] == kind, proof
            assert saved(page)['credits'] == before
            record('bounded-lab-attack', source=source, errorKind=kind, seconds=round(time.monotonic()-started, 3), noReward=True)
        editor.fill('function solve(input) { return input.price * input.quantity; }')
        editor.press('Control+Enter')
        page.wait_for_function('(key)=>JSON.parse(localStorage.getItem(key)).gameplay.lab.proofs.receipt?.passed===true', arg=KEY)
        assert saved(page)['credits'] == before + 35
        assert page.evaluate('(marker)=>window[marker]===undefined', MARKER)
        record('valid-repair-after-attacks', passed=True, actualReward=35)
        page.screenshot(path=str(OUT / 'web-lab-recovery.png'), animations='disabled')
        assert not report['pageErrors'], report['pageErrors']
        assert not probe_requests, 'DOMParser/preview attempted probe requests: ' + json.dumps(probe_requests)
        assert not report['blockedOutbound'], report['blockedOutbound']
        record('final', passed=True)
        print(json.dumps(report, ensure_ascii=False))
    except Exception as error:
        record('failure', passed=False, error=str(error))
        page.screenshot(path=str(OUT / 'web-security-failure.png'), animations='disabled')
        (OUT / 'web-security-failure.txt').write_text(page.locator('body').inner_text(), encoding='utf-8')
        raise
    finally:
        context.close()
        browser.close()
