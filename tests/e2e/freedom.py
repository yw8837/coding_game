"""Chosen contracts and alternate JS implementations through actual UI, not a learning study."""
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
import json,os

out=Path(os.environ.get('CODESHIFT_QA_DIR','output/0.13-qa'));out.mkdir(parents=True,exist_ok=True)
seeds=Path('output/0.12-qa')
KEY='codeshift-intro-demo-v1'
jobs=['bakery-price','library-loans','contacts-clean','clinic-form','market-filter','workshop-slots','delivery-fees','museum-layout','community-api','photo-cache','archive-backup','festival-report']
solutions={
 'bakery-price':'function solve(input) { let n = input.quantity; let sum = 0; while (n >= 6) { sum += 10000; n -= 6; } return sum + n * 1800; }',
 'library-loans':'function solve(input) { if (input.overdueDays > 0) return false; return input.borrowed + input.requested <= 3; }',
 'contacts-clean':'function solve(input) { return input.emails.map(s => s.trim().toLowerCase()).filter(s => s !== "").reduce((out, s) => { if (!out.includes(s)) out.push(s); return out; }, []); }',
 'delivery-fees':'function solve(input) { return input.km > 10 ? "unavailable" : input.total >= 20000 ? 0 : 2000 + 300 * input.km; }',
 'festival-report':'function solve(input) { const paid = input.sales.filter(s => s.status === "paid"); const totals = {}; for (const s of paid) totals[s.booth] = 0; for (const s of paid) totals[s.booth] += s.quantity * s.unit; return {paidCount: paid.length, totals: totals}; }',
}
def state(p):return p.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
reports=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True)
 try:
  for lang in ['ko','en','ja']:
   seed=json.loads((seeds/f'{lang}-cafe-save.json').read_text(encoding='utf-8'))
   c=b.new_context(viewport={'width':1440,'height':960});p=c.new_page();p.set_default_timeout(15000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
   p.goto('http://127.0.0.1:5173/',wait_until='networkidle');p.evaluate('({seed,lang,key})=>{localStorage.setItem(key,JSON.stringify(seed));localStorage.setItem("codeshift-language",lang)}',{'seed':seed,'lang':lang,'key':KEY});p.reload(wait_until='networkidle');p.locator('.pc-play').click();p.locator('.quest-next button').click();p.locator('.pc-window[data-active=true] .pc-window-buttons button').nth(3).click()
   for index,id in enumerate(jobs):
    p.get_by_test_id('career-job-'+id).click();p.get_by_test_id('career-accept').click();p.get_by_test_id('career-inspect').click();credits=state(p)['credits']
    if id in solutions:
     p.get_by_test_id('career-use-javascript').click()
     expect(p.get_by_test_id('career-code-help')).to_have_attribute('aria-expanded','false')
     p.get_by_test_id('career-code-run').click();expect(p.get_by_test_id('career-code-result')).to_be_visible()
     assert state(p)['credits']==credits
     p.get_by_test_id('career-js-editor').locator('textarea').fill(solutions[id])
     p.get_by_test_id('career-code-save').click()
     if index==0:
      p.get_by_test_id('career-use-config').click();p.get_by_test_id('career-use-javascript').click()
      expect(p.get_by_test_id('career-js-editor').locator('textarea')).to_have_value(solutions[id])
      p.get_by_test_id('career-code-input').fill('{"quantity":17}')
     p.get_by_test_id('career-code-run').click()
     expect(p.get_by_test_id('career-code-result')).to_have_attribute('data-passed','true')
     if index==0:p.screenshot(path=str(out/f'{lang}-alternate-code.png'),animations='disabled')
    else:
     if p.get_by_test_id('career-code-mode').get_attribute('aria-pressed')!='true':p.get_by_test_id('career-code-mode').click()
     p.locator('.career-answer>button').click()
     answers=p.locator('.career-answer>div>div').evaluate_all('els=>els.map(el=>[el.querySelector("strong").textContent,el.querySelector("pre").textContent])')
     for file,source in answers:
      if id=='workshop-slots':source='id,start,end\nA,09:30,10:30\nB,10:45,11:45\nC,12:00,13:00\n'
      p.locator('.career-file-tabs button').filter(has_text=file).click();p.locator('.career-code-input textarea').fill(source)
     p.locator('.career-answer>button').click()
    p.get_by_test_id('career-test').click();p.get_by_test_id('career-reply-'+('care' if index<8 else 'craft')).check();p.get_by_test_id('career-deliver').click()
    assert len(state(p)['gameplay']['career']['completed'])==index+1
   p.get_by_test_id('career-final-project').click();p.get_by_test_id('release-start').click()
   assert state(p)['gameplay']['career']['completed']==jobs
   p.get_by_test_id('release-purpose').select_option('portfolio');p.get_by_test_id('release-accent').select_option('ocean');p.get_by_test_id('release-layout').select_option('cards')
   description={'ko':'내가 고쳐서 다시 쓰게 된 동네의 도구들','en':'Useful neighborhood tools I repaired','ja':'直して使えるようにしたまちの道具'}[lang]
   p.get_by_test_id('release-description').fill(description);p.get_by_test_id('release-items').fill('Bakery calculator | Boxes and single rolls | Tools\nWorkshop timetable | Three classes with breaks | Schedules\nLoan checker | A fair borrowing policy | Tools')
   p.get_by_test_id('release-author-save').click();expect(p.get_by_test_id('release-author-saved')).to_be_visible()
   for value in ['My first toolbox','90%','/api/places','true']:
    p.get_by_test_id('release-token').fill(value);p.get_by_test_id('release-apply').click()
   p.get_by_test_id('release-load-places').click();expect(p.get_by_test_id('release-results').locator('li')).to_have_count(3)
   expect(p.locator('.release-board')).to_have_attribute('data-layout','cards');expect(p.get_by_test_id('release-preview-description')).to_have_text(description)
   p.get_by_test_id('release-category-filter').select_option('Tools');expect(p.get_by_test_id('release-results').locator('li')).to_have_count(2)
   p.get_by_test_id('release-search').fill('bakery');expect(p.get_by_test_id('release-results').locator('li')).to_have_count(1)
   p.get_by_test_id('release-search').fill('nothing matches');expect(p.get_by_test_id('release-no-results')).to_be_visible()
   p.get_by_test_id('release-search').fill('');p.get_by_test_id('release-category-filter').select_option('')
   p.get_by_test_id('release-inquiry-item').select_option('Bakery calculator');p.get_by_test_id('release-inquiry').fill('Can I try this tool?');p.get_by_test_id('release-send-inquiry').click();expect(p.get_by_test_id('release-inquiries')).to_contain_text('Can I try this tool?')
   p.get_by_test_id('release-preview-title').scroll_into_view_if_needed();p.screenshot(path=str(out/f'{lang}-my-toolbox.png'),animations='disabled')
   p.set_viewport_size({'width':390,'height':844})
   close=p.locator('#mission-sidebar .panel-close')
   if close.is_visible():close.click()
   p.get_by_test_id('release-load-places').scroll_into_view_if_needed();assert not p.evaluate('document.documentElement.scrollWidth>innerWidth');p.screenshot(path=str(out/f'{lang}-my-toolbox-mobile.png'),animations='disabled');p.set_viewport_size({'width':1440,'height':960})
   p.get_by_test_id('release-test').click();p.get_by_test_id('release-build').click();p.get_by_test_id('release-publish').click();p.get_by_test_id('release-letter').click();p.get_by_test_id('career-ending').click();expect(p.get_by_test_id('final-letter')).to_be_visible()
   saved=state(p);assert saved['gameplay']['career']['ending']=='community';assert len(saved['gameplay']['career']['endingJobs'])==12
   # Start an optional job after ending, then reload. It must reopen the job, not the ending.
   p.get_by_test_id('ending-map').click();p.get_by_test_id('career-job-florist-stock').click();p.get_by_test_id('career-accept').click();p.reload(wait_until='networkidle');p.locator('.pc-play').click()
   p.locator('.pc-shortcuts').get_by_role('button',name={'ko':'의뢰 센터','en':'Contracts','ja':'依頼センター'}[lang],exact=True).click()
   # Career opens map by default for active work; selecting the record keeps the pending job.
   p.get_by_test_id('career-job-florist-stock').click();expect(p.get_by_test_id('career-inspect')).to_be_visible()
   assert state(p)['gameplay']['career']['ending']=='community';assert not errors,errors
   (out/f'{lang}-chosen-route-save.json').write_text(json.dumps(saved,ensure_ascii=False),encoding='utf-8')
   reports.append({'language':lang,'chosenJobs':12,'javascriptJobs':5,'alternateTimetable':True,'personalizedRelease':True,'searchAndCategory':True,'inquiry':True,'reloadWithOptionalJob':True,'errors':errors});c.close()
  (out/'freedom-report.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(reports,ensure_ascii=False))
 except Exception:
  p.screenshot(path=str(out/'freedom-failure.png'));(out/'freedom-failure.txt').write_text(p.locator('body').inner_text(),encoding='utf-8');raise
 finally:b.close()
