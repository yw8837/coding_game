"""Prepare, capture, render and inspect a separate 24-second actual terminal teaser.

Default invocation only prints the shot plan. Browser capture and FFmpeg rendering
are explicit modes and must wait for the main task's capture-slot authorization.
"""
from __future__ import annotations

import argparse
import array
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
import shutil
import subprocess
import time
import wave

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "output/trailer-0.11-terminal"
EDL = ROOT / "media/trailer/edl-0.11-terminal.json"
MUSIC = ROOT / "output/trailer-0.9/original-pulse.wav"
SAVE_KEY = "codeshift-intro-demo-v1"
FPS = 30
PLAN = [
    ("open-code", 3, "터미널에서 내 파일을 연다."),
    ("red-run", 3, "실행해 보니, 계산이 이상하다."),
    ("red-test", 2, "여러 입력으로 실패를 확인."),
    ("repair", 3, "한 글자를 고친다. + → *"),
    ("green-run", 3, "다시 실행. 달라진 결과."),
    ("green-test", 4, "다른 주문도 검사. 빨강에서 초록으로."),
    ("reward", 3, "실제 첫 완료 보상 +35 cr."),
    ("title", 3, "CODE:SHIFT · 개발 중인 가제"),
]


def module(name, file):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(file))
    loaded = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loaded)
    return loaded


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def state(page):
    # Read-only evidence; never seed progress or edit files through evaluate.
    return page.evaluate("key => JSON.parse(localStorage.getItem(key))", SAVE_KEY)


def capture(url, workspace_testid):
    if not workspace_testid:
        raise ValueError('Final visible workspace button testid is required before browser capture')
    from playwright.sync_api import sync_playwright, expect
    clock = module("terminal_capture_clock", "capture-art.py")
    OUT.mkdir(parents=True, exist_ok=True)
    screenshots = OUT / "screenshots"
    screenshots.mkdir(exist_ok=True)
    shots, anchors, errors, commands = [], [], [], []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel="chrome", headless=True)
        context = browser.new_context(viewport={"width":1920,"height":1080}, locale="ko-KR", record_video_dir=str(OUT / "recording"), record_video_size={"width":1920,"height":1080})
        t0 = time.monotonic()
        page = context.new_page()
        page.set_default_timeout(18000)
        page.on("pageerror", lambda error: errors.append(str(error)))
        active = lambda: page.locator('.pc-window[data-active="true"]')
        pause = lambda seconds: page.wait_for_timeout(round(seconds * 1000))
        begin = lambda: time.monotonic() - t0

        def finish(identity, start):
            item = next(row for row in PLAN if row[0] == identity)
            shots.append({"id":identity,"start":round(start,3),"end":round(begin(),3),"duration":item[1],"caption":{"ko":item[2],"en":item[2],"ja":item[2]}})
            page.screenshot(path=str(screenshots / (identity + ".png")), animations="disabled")

        def open_terminal():
            # An existing taskbar item is reused after the editor opens.
            if active().locator('.terminal-form input:visible').count():
                return
            taskbar = page.locator('.pc-task-apps button').filter(has=page.locator('svg.lucide-terminal-square'))
            if taskbar.count():
                taskbar.first.click()
            else:
                page.locator('.pc-shortcuts button').filter(has=page.locator('svg.lucide-terminal-square')).click()
            expect(active().locator('.terminal-form input')).to_be_visible()

        def command(text, expected_error=None):
            field = active().locator('.terminal-form input').first
            field.press_sequentially(text, delay=65)
            field.press('Enter')
            page.wait_for_function("({key,text}) => {const s=JSON.parse(localStorage.getItem(key));return s?.history?.at(-1)?.command===text}", arg={"key":SAVE_KEY,"text":text})
            entry = state(page)['history'][-1]
            if expected_error is not None and bool(entry.get('error')) != expected_error:
                raise RuntimeError(f"Unexpected command outcome for {text}: {entry}")
            commands.append({"command":text,"output":entry.get('output'),"error":bool(entry.get('error'))})
            return entry

        def maximize():
            box = active().bounding_box()
            if box and box['width'] < 1700:
                active().get_by_role('button',name='창 최대화 또는 복원',exact=True).click()

        try:
            page.goto(url, wait_until="networkidle")
            expect(page.locator('.pc-play')).to_be_visible()
            # Fresh KO context; visible language selection if detection differs.
            if page.locator('html').get_attribute('lang') != 'ko':
                page.get_by_role('button',name='한국어',exact=True).click()
            anchors.append(clock.record_marker(page,t0,'start'))
            page.locator('.pc-play').click()
            # Create real workspace files through the final visible Lab action.
            # No act(), localStorage seed, or direct filesystem edit is allowed.
            page.locator('.pc-shortcuts button').filter(has=page.locator('svg.lucide-puzzle')).click()
            page.get_by_test_id('code-lab-tab').click()
            page.get_by_test_id('lab-job-receipt').click()
            workspace = page.get_by_test_id(workspace_testid)
            guide = workspace.locator('xpath=ancestor::details[1]')
            if guide.count() and guide.get_attribute('open') is None:
                guide.locator(':scope > summary').click()
            workspace.click()
            open_terminal()
            maximize()
            command('sudo apt update',False)
            command('sudo apt install nodejs npm',False)
            command('clear',False)

            s = begin()
            command('cd /home/dev/code-lab',False)
            command('code receipt.js',False)
            maximize()
            expect(page.get_by_test_id('virtual-file-editor')).to_be_visible()
            field = page.get_by_test_id('virtual-file-source').locator('textarea')
            expect(field).to_be_visible()
            source = field.input_value()
            if not re.search(r'input\.price\s*\+\s*input\.quantity',source):
                raise RuntimeError('Receipt starter must visibly contain its genuine + bug')
            pause(1.2)
            finish('open-code',s)

            open_terminal()
            s = begin()
            command('node run.cjs receipt.js receipt.input.json')
            pause(2.2)
            finish('red-run',s)
            s = begin()
            command('node --test receipt.test.cjs',True)
            pause(2.2)
            finish('red-test',s)

            s = begin()
            command('code receipt.js',False)
            maximize()
            field = page.get_by_test_id('virtual-file-source').locator('textarea')
            source = field.input_value()
            match = re.search(r'input\.price\s*(\+)\s*input\.quantity',source)
            if not match:
                raise RuntimeError('Refuse to replace an unrelated operator or entire function')
            position = match.start(1)
            field.focus()
            field.evaluate('(el,pos) => el.setSelectionRange(pos,pos+1)',position)
            field.press_sequentially('*',delay=250)
            expect(field).to_have_value(source[:position] + '*' + source[position+1:])
            pause(2.2)
            finish('repair',s)

            open_terminal()
            command('node run.cjs receipt.js receipt.input.json',False)
            # Keep this result at roughly1x. The command is still visible; its
            # automated typing happens outside this readable selected shot.
            s = begin()
            pause(3.2)
            finish('green-run',s)
            before_test = state(page)
            command('node --test receipt.test.cjs',False)
            # Deliberate readable dwell: actual result, not an invented overlay.
            s = begin()
            pause(4.2)
            finish('green-test',s)
            after_test = state(page)
            if 'receipt' not in after_test['gameplay']['lab']['completed']:
                raise RuntimeError('Terminal test must record actual receipt completion')
            delta = after_test['credits'] - before_test['credits']
            if delta != 35:
                raise RuntimeError('The fresh receipt terminal test must earn its actual35credit first reward')
            s = begin()
            pause(3.2)
            finish('reward',s)

            page.locator('.pc-language').click()
            page.get_by_role('button',name='타이틀로 돌아가기',exact=True).click()
            s = begin()
            pause(3.2)
            finish('title',s)
            if errors:
                raise RuntimeError(f'Browser page errors: {errors}')
            pause(.25)
            anchors.append(clock.record_marker(page,t0,'end'))
            video = page.video
            context.close()
            recorded = Path(video.path())
            media = clock.inspect_recording(recorded,clock.media_binary('ffmpeg'),clock.media_binary('ffprobe'))
            aligned,timing = clock.align_shots(shots,anchors,media)
            for shot in aligned:
                speed = (shot['end']-shot['start'])/shot['duration']
                shot['caption']['ko'] += f' · 편집 {speed:.2f}×'
            shutil.copyfile(recorded,OUT/'raw.webm')
            commit = subprocess.run(['git','rev-parse','HEAD'],cwd=ROOT,capture_output=True,text=True,check=True).stdout.strip()
            evidence = {"status":"captured-awaiting-render-review","gameCommit":commit,"viewport":[1920,1080],"uiLanguage":"ko","captureMethod":"Fresh game; actual UI controls and visibly typed commands; automation drives input; no progress injection","commands":commands,"firstRewardDeltaCredits":delta,"captureTiming":timing,"errors":errors,"speedDisclosure":"Every shot caption displays its measured source/edit speed; source input is automated QA, not novice pacing","notSteamRelease":True,"priorTrailerUntouched":True}
            write_json(OUT/'capture-evidence.json',evidence)
            write_json(EDL,{"status":"captured","source":"../../output/trailer-0.11-terminal/raw.webm","captureViewport":[1920,1080],"captureTiming":timing,"shots":aligned})
            print(json.dumps({"shots":len(aligned),"duration":sum(s['duration'] for s in aligned),"rewardDelta":delta}))
        except Exception:
            if not page.is_closed():
                page.screenshot(path=str(OUT/'capture-failure.png'))
                (OUT/'capture-failure.txt').write_text(page.locator('body').inner_text(),encoding='utf-8')
            raise
        finally:
            browser.close()


def short_edl(path,max_speed):
    """Isolated 20..25s policy, retaining frame/speed/source/caption checks."""
    document = json.loads(path.read_text(encoding='utf-8-sig'))
    if document.get('status') != 'captured':
        raise ValueError('Only a calibrated captured EDL can be rendered')
    source = (path.parent / document['source']).resolve()
    if not source.is_file():
        raise ValueError('Captured source is missing')
    shots,ids = [],set()
    previous = -1
    for item in document['shots']:
        identity = item['id']
        if not re.fullmatch(r'[A-Za-z0-9_-]+',identity) or identity in ids:
            raise ValueError('Invalid or duplicate shot id')
        ids.add(identity)
        start,end,duration = (float(item[k]) for k in ['start','end','duration'])
        if not all(math.isfinite(v) for v in [start,end,duration]) or not 0<=start<end or duration<=0 or start<previous:
            raise ValueError('Invalid shot bounds or overlap')
        frames = round(duration*FPS)
        speed = (end-start)/duration
        if abs(frames/FPS-duration)>1e-6 or not .25<=speed<=max_speed:
            raise ValueError('Invalid frame grid or speed')
        if any(not item.get('caption',{}).get(lang) for lang in ['ko','en','ja']) or '편집' not in item['caption']['ko']:
            raise ValueError('Captions and actual speed disclosure are required')
        if item.get('crop'):
            raise ValueError('This teaser preserves the full recorded game window')
        shots.append({**item,'frames':frames,'speed':speed})
        previous = end
    frames = sum(s['frames'] for s in shots)
    if not 20*FPS<=frames<=25*FPS:
        raise ValueError('Terminal teaser must total20..25seconds')
    return source,shots,frames


def reused_music(duration):
    """Cut/fade the existing PCM synthesis without generating new music."""
    target = OUT/'reused-pulse.wav'
    with wave.open(str(MUSIC),'rb') as original:
        if original.getsampwidth()!=2:
            raise ValueError('Expected existing signed16bit pulse WAV')
        rate,channels = original.getframerate(),original.getnchannels()
        length = round(duration*rate)
        if original.getnframes()<length:
            raise ValueError('Existing music is shorter than the teaser')
        samples = array.array('h',original.readframes(length))
    fade = min(rate,length)
    for frame in range(length-fade,length):
        gain = (length-1-frame)/max(1,fade-1)
        for channel in range(channels):
            index = frame*channels+channel
            samples[index] = round(samples[index]*gain)
    with wave.open(str(target),'wb') as wav:
        wav.setnchannels(channels);wav.setsampwidth(2);wav.setframerate(rate);wav.writeframes(samples.tobytes())
    write_json(OUT/'music-provenance.json',{'source':str(MUSIC.relative_to(ROOT)),'sourceSha256':hashlib.sha256(MUSIC.read_bytes()).hexdigest(),'edit':'First24seconds of existing original0.9mathematical pulse; final1second fade','duration':duration,'editedSha256':hashlib.sha256(target.read_bytes()).hexdigest(),'downloadedSamples':False})
    return target


def render():
    renderer = module('terminal_renderer','render.py')
    _,_,frames = short_edl(EDL,8)
    # Reuse the verified encoder/normalizer/full-decode path; historical renderer
    # and all 0.10 exports remain unchanged. Only this module's EDL policy differs.
    renderer.read_edl = short_edl
    renderer.NOTES['ko'] = '실제 UI · QA 자동 입력 · 컷별 편집 배속 표시 · 개발 중인 가제'
    renderer.render(argparse.Namespace(edl=str(EDL),output=str(OUT),languages=['ko'],vertical_languages=[],no_vertical=True,max_speed=8,ffmpeg=None,ffprobe=None,audio_source=str(reused_music(frames/FPS))))
    source = OUT/'codeshift-ko.mp4'
    source.replace(OUT/'codeshift-terminal-ko.mp4')
    report = json.loads((OUT/'verification.json').read_text(encoding='utf-8'))
    report['outputs'][0]['file'] = 'codeshift-terminal-ko.mp4'
    report['source_audio'] = 'Not captured; reused original0.9pulse cut/fade provenance in music-provenance.json'
    write_json(OUT/'verification.json',report)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mode',choices=['plan','capture','render'],default='plan')
    parser.add_argument('--url',default='http://127.0.0.1:5173/')
    parser.add_argument('--workspace-testid',default='lab-terminal-workspace',help='Confirmed visible receipt workspace preparation button')
    args = parser.parse_args()
    if args.mode=='plan':
        print(json.dumps({'status':'prepared-not-captured','duration':sum(row[1] for row in PLAN),'shots':PLAN,'requires':'Main task capture-slot authorization; selectors must match final terminal implementation'},ensure_ascii=False,indent=2))
    elif args.mode=='capture':
        capture(args.url,args.workspace_testid)
    else:
        render()


if __name__=='__main__':
    main()
