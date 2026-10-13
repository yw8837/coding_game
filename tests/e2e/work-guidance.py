"""UI regression for the current job's app/file/action and read-only source data."""
from pathlib import Path
import json, os
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/release-ux-20261013/work-guidance'
OUT.mkdir(parents=True, exist_ok=True)
OLD = Path('C:/codex-workspaces/codeshift-release-20261012/output/curriculum-20261013')
SEED = json.loads((OLD / 'ops/checkpoint.json').read_text(encoding='utf8'))
INV = json.loads((OLD / 'inventory.json').read_text(encoding='utf8'))
URL = os.environ.get('CODESHIFT_QA_URL', 'http://127.0.0.1:5190/')
REPORT = {'cases': [], 'fixture': 'previous UI-earned completed Python/SQL save'}
NAMES = {
    'en': {'python':'Python Automation','sql':'SQL Database','terminal':'Terminal','challenges':'Practice jobs','messages':'Messages'},
    'ko': {'python':'파이썬 자동화','sql':'SQL 데이터베이스','terminal':'터미널','challenges':'연습 의뢰','messages':'메시지'},
    'ja': {'python':'Python自動化','sql':'SQLデータベース','terminal':'ターミナル','challenges':'練習の依頼','messages':'メッセージ'},
}

def open_app(p, lang, app):
    p.locator('.pc-show-desktop').click()
    p.locator('.pc-shortcuts').get_by_role('button', name=NAMES[lang][app], exact=True).click()

def guide(p, job, kind='ops'):
    panel = p.locator('[data-testid=context-work-guide]:visible').first
    expect(panel).to_have_attribute('data-work-kind', kind)
    expect(panel).to_have_attribute('data-work-id', job)
    return panel

def command(p, value):
    field = p.locator('.pc-window[data-active=true] .terminal-form input')
    field.fill(value); field.press('Enter')
    p.wait_for_function('v=>JSON.parse(localStorage.getItem("codeshift-intro-demo-v1")).history.at(-1)?.command===v', arg=value)

with sync_playwright() as pw:
    b = pw.chromium.launch(channel='chrome', headless=True)
    try:
        for lang, locale in [('en','en-US'),('ko','ko-KR'),('ja','ja-JP')]:
            c = b.new_context(viewport={'width':1366,'height':768}, locale=locale)
            p = c.new_page(); p.set_default_timeout(12000)
            errors=[]; p.on('pageerror', lambda e: errors.append(str(e)))
            p.goto(URL, wait_until='networkidle')
            p.evaluate('(v)=>{localStorage.setItem("codeshift-intro-demo-v1",JSON.stringify(v.s));localStorage.setItem("codeshift-language",v.lang)}', {'s':SEED,'lang':lang})
            p.reload(wait_until='networkidle'); p.get_by_test_id('title-continue').click()
            py = INV['python'][0]; folder='/home/dev/automation/'+py['id']
            open_app(p,lang,'python'); p.get_by_test_id('ops-job-'+py['id']).click()
            g=guide(p,py['id']); expect(g.get_by_test_id('work-target-file')).to_contain_text(folder+'/'+py['main'])
            expect(g).to_contain_text(py['title'][lang])
            assert not g.get_by_test_id('work-campaign-next').evaluate('el=>el.open')
            g.get_by_test_id('work-task-action').click()
            field=p.locator('.pc-window[data-active=true] .terminal-form input')
            expect(field).to_have_value('cd '+folder)
            # Navigation assistance queues a command; it does not execute it.
            assert p.evaluate('JSON.parse(localStorage.getItem("codeshift-intro-demo-v1")).machines.local.cwd') != folder
            field.press('Enter'); guide(p,py['id'])
            command(p,'code orders.csv')
            expect(p.get_by_test_id('virtual-file-source').locator('pre')).to_be_visible()
            expect(p.get_by_test_id('virtual-file-source').locator('textarea')).to_have_count(0)
            guide(p,py['id'])
            p.get_by_test_id('virtual-file-'+py['main']).click()
            code=p.get_by_test_id('virtual-file-source').locator('textarea'); expect(code).to_be_visible()
            code.fill('print(0)')
            g=guide(p,py['id']); expect(g.get_by_test_id('work-command')).to_contain_text('python3 '+py['main'])
            g.get_by_test_id('work-task-action').click(); expect(field).to_have_value('python3 '+py['main'])
            field.press('Enter'); guide(p,py['id'])
            assert field.evaluate("el=>{const r=el.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('.pc-window')===el.closest('.pc-window')}"), 'Background window content covers the active terminal input'
            field.click()
            expect(field).to_be_focused()
            p.screenshot(path=str(OUT/(lang+'-python-current-job.png')), animations='disabled')
            # Identical SQL filenames in different jobs must route to the selected folder.
            for sql in INV['sql'][:2]:
                folder='/home/dev/database/'+sql['id']
                open_app(p,lang,'sql'); p.get_by_test_id('ops-job-'+sql['id']).click()
                g=guide(p,sql['id']); expect(g.get_by_test_id('work-target-file')).to_contain_text(folder+'/query.sql')
                g.get_by_test_id('work-task-action').click(); expect(field).to_have_value('cd '+folder)
                field.press('Enter'); command(p,'code query.sql'); guide(p,sql['id'])
                expect(p.get_by_test_id('virtual-file-path')).to_have_text(folder+'/query.sql')
            open_app(p,lang,'challenges'); p.get_by_test_id('code-lab-tab').click()
            p.get_by_test_id('lab-job-discount').click(); g=guide(p,'discount','lab')
            expect(g.get_by_test_id('work-target-file')).to_contain_text('discount.js')
            p.get_by_test_id('lab-terminal-guide').locator('summary').click()
            p.get_by_test_id('lab-terminal-workspace').click(); guide(p,'discount','lab')
            open_app(p,lang,'challenges'); guide(p,'discount','lab')
            p.get_by_test_id('rules-tab').click()
            expect(p.locator('[data-testid=context-work-guide]:visible')).to_have_count(0)
            assert not errors,errors
            assert p.evaluate('JSON.parse(localStorage.getItem("codeshift-intro-demo-v1")).credits') == SEED['credits']
            REPORT['cases'].append({'language':lang,'jobAndFileFollowSelection':True,'queueRequiresEnter':True,'readonlyData':True,'sameNamedSqlFiles':True,'labSurvivesToolSwitch':True,'rulesClearLabContext':True,'errors':errors})
            c.close()
        REPORT['passed']=True
    except Exception as error:
        REPORT['failure']=str(error)
        p.screenshot(path=str(OUT/'failure.png'),animations='disabled')
        (OUT/'failure.txt').write_text(p.locator('body').inner_text(),encoding='utf8')
        raise
    finally:
        (OUT/'report.json').write_text(json.dumps(REPORT,ensure_ascii=False,indent=2),encoding='utf8')
        b.close()
print(json.dumps(REPORT,ensure_ascii=False))
