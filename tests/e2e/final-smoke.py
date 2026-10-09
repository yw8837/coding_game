from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import json

out=Path('output/pc-qa');out.mkdir(parents=True,exist_ok=True);results=[];errors=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(channel='chrome',headless=True)
    try:
        for lang,route in [('ko','/about'),('en','/about/en'),('ja','/about/ja')]:
            context=browser.new_context(viewport={'width':1440,'height':900})
            page=context.new_page();page.set_default_timeout(10000)
            page.on('pageerror',lambda e:errors.append(str(e)))
            response=page.goto('http://127.0.0.1:5173'+route,wait_until='networkidle')
            assert response.status==200
            video=page.locator('video')
            video.evaluate('(v)=>{v.muted=true;v.load();return v.play()}')
            page.wait_for_function("document.querySelector('video').currentTime>0.3")
            media=video.evaluate('(v)=>({width:v.videoWidth,height:v.videoHeight,duration:v.duration,error:v.error,currentTime:v.currentTime})')
            assert media['width']==1920 and media['height']==1080 and abs(media['duration']-42)<.1 and media['error'] is None
            video.evaluate('(v)=>{v.pause();v.currentTime=16}')
            page.wait_for_function("!document.querySelector('video').seeking")
            page.screenshot(path=str(out/f'about-video-{lang}.png'),animations='disabled')
            results.append({'language':lang,'video':media,'metadata':page.locator('link[rel="canonical"]').get_attribute('href')})
            page.goto('http://127.0.0.1:5173/',wait_until='networkidle')
            page.evaluate('(lang)=>localStorage.setItem("codeshift-language",lang)',lang)
            page.reload(wait_until='networkidle');page.locator('.pc-play').click()
            assert page.locator('.pc-window:visible').count()==0
            page.locator('.pc-shortcuts').get_by_role('button',name={'ko':'터미널','en':'Terminal','ja':'ターミナル'}[lang],exact=True).click()
            field=page.locator('.pc-window[data-active="true"] .terminal-form input')
            field.fill('help');field.press('Enter')
            expect(page.locator('.pc-window[data-active="true"]')).to_contain_text({'ko':'지원하는 학습용 명령만','en':'Only supported learning commands','ja':'対応する学習用コマンドだけ'}[lang])
            context.close()
        assert not errors,errors
        (out/'final-smoke.json').write_text(json.dumps({'checks':results,'pageErrors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
        print('PASS: KO/EN/JA video playback, metadata, empty desktop start and localized terminal help; no page errors')
    finally:
        browser.close()
