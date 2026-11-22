"""Real Chromium regression for source/preview parity and localized menu checks."""
import json
import sys
from playwright.sync_api import sync_playwright

payload=json.load(sys.stdin)
with sync_playwright() as pw:
    browser=pw.chromium.launch(channel='chrome',headless=True)
    try:
        page=browser.new_page()
        page.add_script_tag(content=payload['script'])
        result=page.evaluate("""async()=>{
            const {INITIAL_FILES,starterFiles,previewDocument,checkLayout}=PreviewQA;
            const original=INITIAL_FILES;
            const fixed={...original,'index.html':original['index.html'].replace('우리 동네 카페','モノカフェ'),'style.css':original['style.css'].replace('width: 960px','width: 100%')};
            const assertions=[];
            const expect=(ok,message)=>{if(!ok)throw new Error(message);assertions.push(message);};
            for(const language of ['ko','en','ja','zh']){
                const doc=new DOMParser().parseFromString(previewDocument(original,language),'text/html');
                expect(doc.querySelector('h1').textContent==='우리 동네 카페',language+': preview preserves the saved heading');
                expect(doc.querySelector('.menu-card h2').textContent==='아메리카노',language+': preview preserves the saved menu text');
            }
            expect((await checkLayout(fixed)).every(c=>c.passed),'Authored Japanese heading and responsive width pass');
            const localized={...fixed,'index.html':fixed['index.html'].replace('아메리카노','アメリカーノ').replace('카페 라테','カフェラテ').replace('바닐라 라테','バニララテ')};
            expect((await checkLayout(localized)).every(c=>c.passed),'Learner-authored Japanese menu labels pass');
            for(const [language,title] of [['en','Mono Cafe'],['ja','モノカフェ'],['zh','莫诺咖啡馆']]){
                const starter=starterFiles(language);
                const responsive={...starter,'index.html':starter['index.html'].replace(new RegExp('(<h1>)[^<]*(</h1>)'),'$1'+title+'$2'),'style.css':starter['style.css'].replace('width: 960px','width: 100%')};
                expect((await checkLayout(responsive)).every(c=>c.passed),language+': localized starter passes after the two intended edits');
            }
            const originalChecks=await checkLayout(original);
            expect(!originalChecks[0].passed&&!originalChecks[1].passed,'Original heading and 960px menu still fail');
            for(const [label,css,index] of [
                ['hidden cards','.menu-card { display:none; }',1],
                ['hidden menu labels','.menu-card h2 { display:none; }',1],
                ['hidden overflow','.menu-grid { width:960px; } body { overflow:hidden; }',1],
                ['tiny buttons','.order-button { min-height:0; height:10px; }',1],
                ['one desktop column','@media (min-width:601px) { .menu-grid { grid-template-columns:1fr; } }',2],
            ]){
                const checks=await checkLayout({...fixed,'style.css':fixed['style.css']+'\\n'+css});
                expect(!checks[index].passed,label+' still fails');
            }
            return assertions;
        }""")
        print(json.dumps({'passed':len(result),'checks':result},ensure_ascii=False))
    finally:
        browser.close()
