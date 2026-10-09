"""Functional Code Lab tests with explicit worked examples; not human learning evidence."""
from playwright.sync_api import sync_playwright, expect
from pathlib import Path
import json

out=Path('output/0.11-qa');out.mkdir(parents=True,exist_ok=True)
audit_inputs={
 'receipt':{'price':500,'quantity':0},'discount':{'total':10000},
 'stock':{'quantity':0,'stock':5},'fallback':{'fee':0},
 'sum':{'orders':[{'price':500,'quantity':2}]},'catalog':{'items':[{'name':'tea','stock':0}]},
 'dedupe':{'names':['A','a']},'report':{'orders':[{'paid':False,'total':500}]},
 'endpoint':{'path':'/other','method':'POST'},
 'retry':{'requests':[{'id':'a','amount':500},{'id':'b','amount':100},{'id':'a','amount':500}]},
 'atomic':{'stock':5,'quantities':[2,-1]},'cache':{'now':10,'ttl':5,'fresh':'new','cache':{'savedAt':5,'value':'old'}}
}

def state(p):return p.evaluate("JSON.parse(localStorage.getItem('codeshift-intro-demo-v1'))")
def open_lab(p,lang):
 p.locator('.pc-shortcuts').get_by_role('button',name={'ko':'연습 의뢰','en':'Practice jobs','ja':'練習の依頼'}[lang],exact=True).click()
 p.locator('.pc-window[data-active=true] .pc-window-buttons button').nth(3).click()
 p.get_by_test_id('code-lab-tab').click()

with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True);reports=[]
 try:
  for lang,locale in [('ko','ko-KR'),('en','en-US'),('ja','ja-JP')]:
   c=b.new_context(viewport={'width':1440,'height':960},locale=locale);p=c.new_page();p.set_default_timeout(12000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
   p.goto('http://127.0.0.1:5173/',wait_until='networkidle');expect(p.locator('html')).to_have_attribute('lang',lang)
   p.locator('.pc-play').click();assert p.locator('.pc-window:visible').count()==0;open_lab(p,lang)
   p.get_by_test_id('lab-observe').click();p.get_by_test_id('lab-run').click();assert not state(p)['gameplay']['lab']['proofs']['receipt']['passed']
   p.get_by_test_id('lab-operator-multiply').click();p.get_by_test_id('lab-run').click();assert state(p)['gameplay']['lab']['proofs']['receipt']['passed']
   p.screenshot(path=str(out/f'{lang}-lab-first-success.png'),animations='disabled')
   for id in audit_inputs:
    p.get_by_test_id('lab-job-'+id).click()
    if id!='receipt':
     helpers=p.locator('.lab-help-buttons button');helpers.nth(0).click();helpers.nth(1).click()
     p.get_by_test_id('lab-example-toggle').click();p.get_by_test_id('lab-example-apply').click();p.get_by_test_id('lab-run').click()
    assert state(p)['gameplay']['lab']['proofs'][id]['passed'],(lang,id)
    paid=state(p)['credits'];p.get_by_test_id('lab-run').click();assert state(p)['credits']==paid
    p.get_by_test_id('lab-audit-card').locator('summary').first.click()
    p.get_by_test_id('lab-audit-input').fill(json.dumps(audit_inputs[id]));p.get_by_test_id('lab-audit-run').click()
    assert id in state(p)['gameplay']['lab']['audited'],(lang,id,'audit')
    paid=state(p)['credits'];p.get_by_test_id('lab-audit-run').click();assert state(p)['credits']==paid
    p.get_by_test_id('lab-new-data').click();assert id not in state(p)['gameplay']['lab']['proofs']
    p.get_by_test_id('lab-run').click();assert state(p)['gameplay']['lab']['proofs'][id]['passed']
   saved=state(p);assert len(saved['gameplay']['lab']['completed'])==12;assert len(saved['gameplay']['lab']['audited'])==12
   p.screenshot(path=str(out/f'{lang}-lab-service.png'),animations='disabled')
   p.set_viewport_size({'width':390,'height':844});assert not p.evaluate('document.documentElement.scrollWidth>innerWidth');p.screenshot(path=str(out/f'{lang}-lab-mobile.png'),animations='disabled')
   p.set_viewport_size({'width':1440,'height':960});p.reload(wait_until='networkidle');p.locator('.pc-play').click();assert p.locator('.pc-window:visible').count()==0
   open_lab(p,lang);assert state(p)['gameplay']['lab']['completed']==saved['gameplay']['lab']['completed'];assert state(p)['credits']==saved['credits']
   # A bad/infinite program must return controlled evidence and leave the game responsive.
   p.get_by_test_id('lab-job-receipt').click();editor=p.get_by_test_id('lab-source').locator('textarea')
   editor.fill('function solve(input) { while (true) {} }');editor.press('Control+Enter')
   assert state(p)['gameplay']['lab']['proofs']['receipt']['cases'][0]['error']['kind']=='budget'
   p.get_by_test_id('lab-restore').click();p.get_by_test_id('lab-operator-multiply').click();p.get_by_test_id('lab-run').click()
   assert state(p)['gameplay']['lab']['proofs']['receipt']['passed'];assert not errors,errors
   reports.append({'language':lang,'jobs':12,'audits':12,'noviceOperatorRepair':True,'usedWorkedExamples':True,'noDuplicateRewards':True,'newDataAndReload':True,'budgetRecovery':True,'mobileDocumentOverflow':False,'pageErrors':errors})
   (out/f'{lang}-lab-save.json').write_text(json.dumps(state(p),ensure_ascii=False),encoding='utf-8');c.close()
  (out/'code-lab-report.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(reports,ensure_ascii=False))
 except Exception:
  p.screenshot(path=str(out/'code-lab-failure.png'),animations='disabled');(out/'code-lab-failure.txt').write_text(p.locator('body').inner_text(),encoding='utf-8');raise
 finally:b.close()
