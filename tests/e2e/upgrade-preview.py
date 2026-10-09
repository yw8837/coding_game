"""A purchased monitor must work in guided, config and JS editing, including narrow windows."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import json, os

out=Path(os.environ.get('CODESHIFT_QA_DIR','output/0.13.2-qa'));out.mkdir(parents=True,exist_ok=True)
seeds=Path(os.environ.get('CODESHIFT_QA_SEEDS','output/0.13.1-qa'))
reports=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True)
 try:
  for lang in ['ko','en','ja']:
   c=b.new_context(viewport={'width':1440,'height':960});p=c.new_page();p.set_default_timeout(15000);errors=[]
   p.on('pageerror',lambda e:errors.append(str(e)))
   p.goto('http://127.0.0.1:5173/',wait_until='networkidle')
   seed=json.loads((seeds/f'{lang}-cafe-save.json').read_text(encoding='utf-8'))
   p.evaluate('({seed,lang})=>{localStorage.setItem("codeshift-intro-demo-v1",JSON.stringify(seed));localStorage.setItem("codeshift-language",lang)}',{'seed':seed,'lang':lang})
   p.reload(wait_until='networkidle');p.locator('.pc-play').click();p.locator('.quest-next button').click()
   p.locator('.pc-window[data-active=true] .pc-window-buttons button').nth(3).click()
   p.get_by_test_id('career-job-bakery-price').click();p.get_by_test_id('career-accept').click();p.get_by_test_id('career-inspect').click()
   expect(p.locator('.career-editor-preview > .career-preview')).to_have_count(0)
   p.get_by_test_id('career-tools-button').click();p.get_by_test_id('career-upgrade-second-screen').click()
   p.get_by_test_id('career-job-bakery-price').click()
   preview=p.locator('.career-editor-preview > .career-preview');expect(preview).to_be_visible()
   expect(p.get_by_test_id('career-learning-input')).to_be_visible()
   first=preview.text_content();p.get_by_test_id('career-learning-input').fill('6');p.get_by_test_id('career-learning-apply').click()
   expect(preview).not_to_have_text(first)
   p.get_by_test_id('career-code-mode').click();expect(p.locator('.career-code-input textarea')).to_be_visible();expect(preview).to_be_visible()
   p.get_by_test_id('career-use-javascript').click();editor=p.get_by_test_id('career-js-editor').locator('textarea');expect(editor).to_be_visible();expect(preview).to_be_visible()
   before=preview.text_content();editor.fill('function solve(input) { return 123; }');expect(preview).to_have_text(before)
   p.get_by_test_id('career-code-save').click();expect(preview).to_contain_text('123')
   p.set_viewport_size({'width':700,'height':900})
   close=p.locator('#mission-sidebar .panel-close')
   if close.is_visible():close.click()
   preview.scroll_into_view_if_needed();expect(preview).to_be_visible()
   assert not p.evaluate('document.documentElement.scrollWidth>innerWidth')
   p.screenshot(path=str(out/f'{lang}-monitor-narrow.png'))
   assert not errors,errors
   reports.append({'language':lang,'purchaseRequired':True,'guidedEditsUpdateOutput':True,'configPreview':True,'javascriptPreview':True,'unsavedDraftNotExecuted':True,'narrowPreview':True,'errors':errors});c.close()
  (out/'upgrade-preview-report.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(reports))
 except Exception:
  p.screenshot(path=str(out/'upgrade-preview-failure.png'));raise
 finally:b.close()
