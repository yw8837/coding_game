"""Real browser audio, preferences and an actual in-game purchase; no fake rewards."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import json, os, subprocess, wave, array

out=Path(os.environ.get('CODESHIFT_QA_DIR','output/techstudio-qa'));out.mkdir(parents=True,exist_ok=True)
root=Path(__file__).resolve().parents[2]
instrument="""(()=>{
 const Base=window.AudioContext;window.__soundStarts=[];
 window.AudioContext=class extends Base{
  constructor(...args){super(...args);window.__gameAudio=this;}
  createOscillator(){const node=super.createOscillator(),start=node.start.bind(node);node.start=(at)=>{window.__soundStarts.push({type:node.type,hz:node.frequency.value,at});start(at);};return node;}
 };
})()"""
reports=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='chrome',headless=True)
 try:
  for lang,labels in [('ko',('전체 음량','조작음','성공·보상음','효과음','보상','설정 닫기')),('en',('Master volume','Interface sounds','Success and rewards','Sound effects','Reward','Close settings')),('ja',('全体音量','操作音','成功・報酬音','効果音','報酬','設定を閉じる'))]:
   context=browser.new_context(viewport={'width':1440,'height':960},locale={'ko':'ko-KR','en':'en-US','ja':'ja-JP'}[lang],reduced_motion='reduce' if lang=='ja' else 'no-preference')
   context.add_init_script(instrument);page=context.new_page();page.set_default_timeout(12000);errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto('http://127.0.0.1:5173/',wait_until='networkidle');page.locator('.pc-play').click();page.locator('.pc-language').click()
   settings=page.get_by_test_id('audio-settings');expect(settings).to_be_visible()
   expect(settings.get_by_role('slider',name=labels[0],exact=True)).to_have_value('85')
   settings.get_by_role('slider',name=labels[0],exact=True).fill('60');settings.get_by_role('slider',name=labels[1],exact=True).fill('0');settings.get_by_role('slider',name=labels[2],exact=True).fill('75')
   settings.get_by_test_id('reduce-motion').click();expect(page.locator('.pc-shell')).to_have_attribute('data-reduced-motion','true')
   before=page.evaluate('window.__soundStarts.length');settings.get_by_role('button',name=labels[4],exact=True).click()
   page.wait_for_function('n=>window.__soundStarts.length>n',arg=before)
   # Exercise the browser visibility lifecycle without changing game state.
   page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))")
   page.wait_for_function("window.__gameAudio.state==='suspended'")
   count=page.evaluate('window.__soundStarts.length');settings.get_by_role('button',name=labels[4],exact=True).click();assert page.evaluate('window.__soundStarts.length')==count
   page.evaluate("delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))")
   settings.get_by_role('button',name=labels[4],exact=True).click();page.wait_for_function("window.__gameAudio.state==='running'")
   settings.get_by_role('button',name=labels[3],exact=True).click();expect(settings.get_by_role('button',name=labels[4],exact=True)).to_be_disabled()
   page.get_by_role('button',name=labels[5],exact=True).click()
   count=page.evaluate('window.__soundStarts.length');page.get_by_test_id('open-wallet').click();assert page.evaluate('window.__soundStarts.length')==count
   # Spend real starting credits through the shop; delta must match the stored balance.
   key='codeshift-intro-demo-v1';before_credits=int(''.join(c for c in page.get_by_test_id('credit-balance').inner_text() if c.isdigit()))
   page.locator('.cosmetic-shop article').nth(1).get_by_role('button').click()
   after_credits=page.evaluate('k=>JSON.parse(localStorage.getItem(k)).credits',key)
   delta=page.get_by_test_id('credit-change');expect(delta).to_have_attribute('data-kind','spent')
   expect(delta).to_have_text('−'+format(before_credits-after_credits,',')+' cr')
   assert delta.evaluate('el=>getComputedStyle(el).animationName')=='none'
   assert page.get_by_test_id('credit-balance').inner_text()==format(after_credits,',')+' cr'
   page.screenshot(path=str(out/f'{lang}-credit-spent.png'))
   page.reload(wait_until='networkidle');page.locator('.pc-play').click();expect(page.get_by_test_id('credit-change')).to_have_count(0)
   page.locator('.pc-language').click();settings=page.get_by_test_id('audio-settings')
   for label,value in zip(labels[:3],['60','0','75']):expect(settings.get_by_role('slider',name=label,exact=True)).to_have_value(value)
   expect(settings.get_by_test_id('reduce-motion')).to_have_attribute('aria-pressed','true')
   expect(settings.get_by_role('button',name=labels[3],exact=True)).to_have_attribute('aria-pressed','false')
   expect(page.locator('.settings-dialog')).to_have_css('opacity','1')
   page.screenshot(path=str(out/f'{lang}-audio-settings.png'),animations='disabled')
   page.set_viewport_size({'width':390,'height':844});assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
   page.screenshot(path=str(out/f'{lang}-audio-settings-mobile.png'))
   assert not errors,errors
   reports.append({'language':lang,'realAudioStarted':True,'mutedUI':True,'preferencesPersist':True,'purchaseDelta':before_credits-after_credits,'noReplayOnLoad':True,'reducedMotion':True,'mobileOverflow':False,'errors':errors});context.close()
  # Render the production synthesis functions with real OfflineAudioContext nodes.
  source=subprocess.run(['node','--input-type=module','-e',"import ts from 'typescript';import fs from 'node:fs';const s=['lib/game/feedback-preferences.ts','lib/game/audio-feedback.ts'].map(f=>fs.readFileSync(f,'utf8').replace(/^import .*$/mg,'').replace(/export /g,'')).join('\\n');process.stdout.write(ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText);"],cwd=root,text=True,encoding='utf-8',capture_output=True,check=True).stdout
  p=browser.new_page();p.goto('http://127.0.0.1:5173/')
  rendered=p.evaluate('''async source=>{
   const {createFeedbackPlayer,FEEDBACK_CUES}=new Function(source+';return {createFeedbackPlayer,FEEDBACK_CUES}')();
   const names=Object.keys(FEEDBACK_CUES),rate=24000,ctx=new OfflineAudioContext(1,rate*(names.length*1.1+1),rate);
   let now=0;const facade=new Proxy(ctx,{get:(target,key)=>key==='state'?'running':key==='currentTime'?now:typeof target[key]==='function'?target[key].bind(target):target[key]});
   const player=createFeedbackPlayer(facade);player.setMix({master:100,ui:100,events:100,reducedMotion:false});
   // Each cue uses a separate player so queued UI voices cannot be interrupted by later events.
   player.dispose();
   const players=[];for(const [i,name] of names.entries()){now=i*1.1;const one=createFeedbackPlayer(facade);one.setMix({master:100,ui:100,events:100,reducedMotion:false});one.play(name);players.push(one);}
   const data=(await ctx.startRendering()).getChannelData(0);let peak=0;for(const v of data)peak=Math.max(peak,Math.abs(v));
   const energy=names.map((name,i)=>{let sum=0,peak=0;for(let n=Math.floor(i*1.1*rate);n<Math.floor((i*1.1+.9)*rate);n++){sum+=data[n]*data[n];peak=Math.max(peak,Math.abs(data[n]));}return {name,peak,rms:Math.sqrt(sum/(rate*.9))};});
   for(const one of players)one.dispose();return {names,rate,peak,energy,pcm:Array.from(data,v=>Math.round(Math.max(-1,Math.min(1,v))*32767))};
  }''',source)
  # Peak verifies every brief cue is present; window RMS includes intentional silence.
  assert rendered['peak']<.8 and all(item['peak']>.002 for item in rendered['energy']),rendered['energy']
  with wave.open(str(out/'effect-sampler.wav'),'wb') as f:
   f.setnchannels(1);f.setsampwidth(2);f.setframerate(rendered['rate']);f.writeframes(array.array('h',(int(sample) for sample in rendered.pop('pcm'))).tobytes())
  (out/'audio-render.json').write_text(json.dumps(rendered,indent=2),encoding='utf-8')
  (out/'feedback-report.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding='utf-8')
  print(json.dumps({'browser':reports,'audio':rendered},ensure_ascii=False))
 finally:browser.close()
