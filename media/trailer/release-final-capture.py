"""Fresh EN/KO recording adapter; preserves all historical capture scripts.

Run only after the build owner grants the browser. Each take gets its own OUT.
Input is visibly automated, not represented as human play. The imported save
must be a prior UI-earned cafe completion with zero completed career jobs.
"""
from pathlib import Path
import hashlib
import json
import os

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
LANG = os.environ.get('CODESHIFT_CAPTURE_LANGUAGE', 'en')
assert LANG in ('en', 'ko')
os.environ['CODESHIFT_CAPTURE_ACTION'] = '0'
os.environ.setdefault('CODESHIFT_CAPTURE_URL', 'http://127.0.0.1:5190/')
os.environ.setdefault('CODESHIFT_CAPTURE_OUTPUT', f'output/release-final-20261013/{LANG}-take1')

donor = HERE / 'capture-current.py'
source = donor.read_text(encoding='utf-8')

def replace_once(old, new):
    global source
    assert source.count(old) == 1, f'Capture donor changed: {old[:80]}'
    source = source.replace(old, new, 1)

replace_once("assert not ACTION or EN,'Action capture currently uses English UI'", "ACTION=True")
replace_once("WIDTH,HEIGHT=(1920,1080) if STORE_CAPTURE else (1600,900)", 'WIDTH,HEIGHT=1920,1080')
replace_once("SEED=ROOT/('output/demo-20261010/en-cafe-save.json' if EN else 'output/0.13.1-qa/ko-cafe-save.json')", "SEED=Path(os.environ.get('CODESHIFT_CAPTURE_SEED','C:/codex-workspaces/codeshift-release-20261012/output/curriculum-20261013/cafe/en-cafe-save.json'))")
replace_once("p.goto(URL,wait_until='networkidle');p.get_by_role('combobox',name='Language').select_option(LANG)", "p.goto(URL,wait_until='networkidle');p.get_by_test_id('title-settings').click();p.get_by_role('combobox',name='Language').select_option(LANG);p.keyboard.press('Escape')")
replace_once("name='Terminal',exact=True", "name='Terminal' if EN else '터미널',exact=True")
source = source.replace("name='Close window',exact=True", "name='Close window' if EN else '창 닫기',exact=True")
source = source.replace("p.locator('.pc-language').click()", "p.get_by_test_id('tray-settings').click()")
replace_once("def click(id):p.get_by_test_id(id).click()", """def click(id):
   overlay=p.get_by_test_id('level-up-overlay')
   if overlay.is_visible():overlay.locator('.prog-lvup-actions button').last.click()
   p.get_by_test_id(id).click()""")
replace_once("print('captured '+id,flush=True)", """(OUT/'in-progress-shots.json').write_text(json.dumps({'shots':shots,'anchors':anchors,'events':events},ensure_ascii=False),encoding='utf-8');print('captured '+id,flush=True)""")
replace_once("'path':str(SEED.relative_to(ROOT))", "'path':str(SEED)")
replace_once("p.locator('.quest-next button').click();maximize()", """# Actual CatHub history from the visibly imported, UI-earned cafe save.
   p.locator('.pc-start-button').click()
   p.locator('.pc-start-apps').get_by_role('button',name='Ghrom',exact=True).click();maximize()
   address=p.locator('.pc-window[data-active=\"true\"] .address-form input')
   address.press_sequentially('https://cathub.dev/mono/menu-site',delay=28);address.press('Enter')
   expect(p.locator('.cathub')).to_be_visible();s=start();pause(3.4);end('cathub',s,'.pc-window[data-active=\"true\"]')
   p.locator('.pc-window[data-active=\"true\"]').get_by_role('button',name='Close window' if EN else '창 닫기',exact=True).click()
   p.locator('.quest-next button').click();maximize()""")

ns = {'__file__': str(donor), '__name__': 'release_final_capture_adapter'}
exec(compile(source, str(HERE / 'release-final-capture-adapted.py'), 'exec'), ns)
if __name__ == '__main__':
    seed = json.loads(ns['SEED'].read_text(encoding='utf-8'))
    assert seed['gameplay']['career']['completed'] == [], 'Use an earned cafe-only save'
    assert seed['gameplay']['openingCelebrated'], 'Cafe import must have earned OPEN'
    ns['main']()
    evidence_path = ns['OUT'] / 'capture-evidence.json'
    evidence = json.loads(evidence_path.read_text(encoding='utf-8'))
    evidence['adapter'] = {'path': str(Path(__file__)), 'donor': str(donor), 'donorSha256': hashlib.sha256(donor.read_bytes()).hexdigest(), 'adapterSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
    evidence['actualGameTitle'] = 'Localhost Hero'
    evidence['inputMethod'] = 'Automated per-character keyboard input in the selected bakery action; background job completion uses explicit input fill and is omitted from edit. No completion-state injection.'
    evidence_path.write_text(json.dumps(evidence, ensure_ascii=False, indent=2), encoding='utf-8')
