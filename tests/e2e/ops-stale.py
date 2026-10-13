"""Regression: optional hints and current-vs-historical proof, using an earned save."""
from pathlib import Path
import json, os
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/release-ux-20261013/ops-stale'
OUT.mkdir(parents=True, exist_ok=True)
OLD = Path('C:/codex-workspaces/codeshift-release-20261012/output/curriculum-20261013')
SEED = json.loads((OLD / 'ops/checkpoint.json').read_text(encoding='utf8'))
INV = json.loads((OLD / 'inventory.json').read_text(encoding='utf8'))
REPORT = {'checks': [], 'errors': [], 'fixture': 'previous UI-earned completed ops save'}
URL = os.environ.get('CODESHIFT_QA_URL', 'http://127.0.0.1:5190/')

def app(p, name):
    p.locator('.pc-show-desktop').click()
    p.locator('.pc-shortcuts').get_by_role('button', name=name, exact=True).click()

def command(p, text):
    field = p.locator('.pc-window[data-active=true] .terminal-form input')
    field.fill(text)
    field.press('Enter')
    p.wait_for_function("s=>JSON.parse(localStorage.getItem('codeshift-intro-demo-v1')).history.at(-1)?.command===s", arg=text)

with sync_playwright() as pw:
    b = pw.chromium.launch(channel='chrome', headless=True)
    c = b.new_context(viewport={'width':1366,'height':768}, locale='en-US')
    p = c.new_page(); p.set_default_timeout(12000)
    p.on('pageerror', lambda e: REPORT['errors'].append(str(e)))
    try:
        p.goto(URL, wait_until='networkidle')
        p.evaluate('(s)=>{localStorage.setItem("codeshift-intro-demo-v1",JSON.stringify(s));localStorage.setItem("codeshift-language","en")}', SEED)
        p.reload(wait_until='networkidle')
        p.get_by_test_id('title-continue').click()
        for track, name in [('python','Python Automation'), ('sql','SQL Database')]:
            panel = p.get_by_test_id('ops-lab-'+track)
            job = INV[track][0]
            folder = ('/home/dev/automation/' if track=='python' else '/home/dev/database/') + job['id']
            app(p, name)
            p.get_by_test_id('ops-job-'+job['id']).click()
            expect(panel.locator('.ops-run .ops-badge')).to_have_text('Passed')
            assert panel.locator('.ops-hint').count()==0
            app(p, 'Terminal')
            command(p, 'exit')
            command(p, 'cd '+folder)
            command(p, 'code '+job['main'])
            p.get_by_test_id('virtual-file-source').locator('textarea').fill('print(1 / 0)' if track=='python' else 'SELECT missing FROM nowhere;')
            app(p, name)
            p.get_by_test_id('ops-job-'+job['id']).click()
            expect(panel.locator('.ops-run .ops-badge')).to_have_text('Not checked')
            assert 'Delivered!' not in panel.locator('.ops-world-status').inner_text()
            assert not panel.locator('.ops-world').evaluate("el=>el.classList.contains('is-done')")
            p.screenshot(path=str(OUT/(track+'-changed.png')), animations='disabled')
            app(p, 'Terminal')
            run = 'python3 '+job['main'] if track=='python' else 'sqlite3 '+job['db']+' < '+job['main']
            command(p, run)
            app(p, name)
            p.get_by_test_id('ops-job-'+job['id']).click()
            expect(panel.locator('.ops-run .ops-badge')).to_have_text('Needs a fix')
            assert panel.locator('.ops-hint').count()==0
            panel.get_by_role('button', name='Show hint 1', exact=True).click()
            expect(panel.locator('.ops-hint')).to_have_count(1)
            app(p, 'Terminal')
            command(p, 'code '+job['main'])
            p.get_by_test_id('virtual-file-source').locator('textarea').fill(job['reference'])
            p.get_by_test_id('virtual-file-terminal').click()
            command(p, run)
            app(p, name)
            p.get_by_test_id('ops-job-'+job['id']).click()
            expect(panel.locator('.ops-run .ops-badge')).to_have_text('Passed')
            p.screenshot(path=str(OUT/(track+'-rechecked.png')), animations='disabled')
            current = p.evaluate("JSON.parse(localStorage.getItem('codeshift-intro-demo-v1'))")
            assert current['credits']==SEED['credits']
            REPORT['checks'].append({'track':track,'staleThenFailureThenFreshPass':True,'hintOnlyOnRequest':True,'rewardOnce':True})
        assert not REPORT['errors'], REPORT['errors']
        REPORT['passed']=True
    except Exception as e:
        REPORT['failure']=str(e)
        p.screenshot(path=str(OUT/'failure.png'), animations='disabled')
        (OUT/'failure.txt').write_text(p.locator('body').inner_text(),encoding='utf8')
        raise
    finally:
        (OUT/'report.json').write_text(json.dumps(REPORT,ensure_ascii=False,indent=2),encoding='utf8')
        c.close(); b.close()
print(json.dumps(REPORT,ensure_ascii=False))
