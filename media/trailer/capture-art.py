"""UI-only capture with decoded-frame clock calibration. No progress injection."""
from pathlib import Path
import json
import math
import re
import shutil
import subprocess
import time

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/trailer-0.9'
WINDOWS_FFMPEG = Path.home() / 'AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0-full_build/bin'
MARKER_SECONDS = 0.7
MARKER_SIZE = 8
MAX_CLOCK_UNCERTAINTY = 0.15


def media_binary(name):
    found = shutil.which(name)
    candidate = WINDOWS_FFMPEG / (name + '.exe')
    if found:
        return found
    if candidate.is_file():
        return str(candidate)
    raise RuntimeError(f'{name} is required for recording clock calibration')


def record_marker(page, t0, label):
    """Film a full-frame magenta marker, entirely outside the selected shots."""
    before = time.monotonic() - t0
    page.evaluate("""() => new Promise(resolve => {
      const marker = document.createElement('div');
      marker.id = 'trailer-clock-marker';
      marker.style = 'position:fixed;inset:0;z-index:2147483647;background:#ff00ff;pointer-events:none';
      document.body.append(marker);
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    })""")
    after = time.monotonic() - t0
    if after - before > 0.25:
        raise RuntimeError(f'{label} marker paint acknowledgement took too long to calibrate')
    page.wait_for_timeout(int(MARKER_SECONDS * 1000))
    page.evaluate("document.getElementById('trailer-clock-marker').remove()")
    page.wait_for_timeout(250)  # Keep compositor/recorder lag outside the first shot.
    return {'label': label, 'wallBefore': before, 'wallAfterPaint': after}


def marker_runs(timestamps, pixels, size=MARKER_SIZE):
    """Pure scan of RGB thumbnails; require the whole frame to be magenta."""
    frame_bytes = size * size * 3
    if len(pixels) != len(timestamps) * frame_bytes:
        raise ValueError('FFprobe and FFmpeg decoded frame counts disagree')
    runs = []
    current = None
    previous = None
    for index, timestamp in enumerate(timestamps):
        if not math.isfinite(timestamp) or (previous is not None and timestamp <= previous):
            raise ValueError('Recording frame timestamps must be finite and increasing')
        offset = index * frame_bytes
        frame = pixels[offset:offset + frame_bytes]
        match = all(frame[i] >= 235 and frame[i + 1] <= 20 and frame[i + 2] >= 235
                    for i in range(0, frame_bytes, 3))
        if match and current is None:
            current = {'firstPts': timestamp, 'lastPts': timestamp, 'frames': 0}
        if match:
            current['lastPts'] = timestamp
            current['frames'] += 1
        elif current is not None:
            runs.append(current)
            current = None
        previous = timestamp
    if current is not None:
        runs.append(current)
    return runs


def inspect_recording(path, ffmpeg, ffprobe):
    """Read timestamps and tiny RGB thumbnails; no video is re-encoded."""
    probe = subprocess.run([
        ffprobe, '-v', 'error', '-select_streams', 'v:0', '-show_frames',
        '-show_entries', 'format=duration:stream=avg_frame_rate:frame=best_effort_timestamp_time',
        '-of', 'json', str(path)
    ], check=True, capture_output=True, timeout=120)
    data = json.loads(probe.stdout)
    timestamps = [float(frame['best_effort_timestamp_time']) for frame in data['frames']]
    numerator, denominator = data['streams'][0]['avg_frame_rate'].split('/')
    fps = float(numerator) / float(denominator)
    duration = float(data['format']['duration'])
    if not math.isfinite(fps) or not 10 <= fps <= 120 or not math.isfinite(duration) or duration <= 0:
        raise ValueError('Unexpected recording frame rate or duration')
    decoded = subprocess.run([
        ffmpeg, '-v', 'error', '-threads', '2', '-i', str(path), '-map', '0:v:0',
        '-vf', f'scale={MARKER_SIZE}:{MARKER_SIZE}:flags=area,format=rgb24',
        '-fps_mode', 'passthrough', '-f', 'rawvideo', 'pipe:1'
    ], check=True, capture_output=True, timeout=120)
    return {'fps': fps, 'duration': duration, 'markers': marker_runs(timestamps, decoded.stdout)}


def align_shots(shots, anchors, media):
    """Apply one constant offset only when both painted anchors agree."""
    fps, duration = media['fps'], media['duration']
    if not math.isfinite(fps) or fps <= 0 or not math.isfinite(duration) or duration <= 0:
        raise ValueError('Invalid recording frame rate or duration')
    period = 1 / fps
    markers = media['markers']
    if len(anchors) != 2 or len(markers) != 2:
        raise ValueError('Expected exactly two full-frame magenta calibration intervals')
    bounds = []
    evidence = []
    for anchor, marker in zip(anchors, markers):
        before, after = anchor['wallBefore'], anchor['wallAfterPaint']
        first, last = marker['firstPts'], marker['lastPts']
        if not all(math.isfinite(v) for v in (before, after, first, last)):
            raise ValueError('Invalid clock anchor')
        if not 0 <= after - before <= 0.25 or last - first < 0.3 or marker['frames'] < 4:
            raise ValueError('Clock marker is too short or its acknowledgement is too slow')
        # First recorded marker frame may trail paint by up to two source frames.
        # The host timestamps bracket the DOM update and two animation frames.
        lower, upper = before - first, after - first + 2 * period
        bounds.append((lower, upper))
        evidence.append({**anchor, **marker, 'offsetBounds': [lower, upper]})
    lower, upper = max(x[0] for x in bounds), min(x[1] for x in bounds)
    if lower > upper:
        raise ValueError('Start/end marker clocks disagree; inspect recording before editing')
    offset = (lower + upper) / 2
    uncertainty = (upper - lower) / 2
    if uncertainty > MAX_CLOCK_UNCERTAINTY:
        raise ValueError('Recording clock uncertainty is too large')
    aligned = []
    previous_end = -1.0
    for shot in shots:
        start, end = round(shot['start'] - offset, 3), round(shot['end'] - offset, 3)
        if not all(math.isfinite(v) for v in (start, end)) or not 0 <= start < end <= duration - period:
            raise ValueError(f"Shot {shot['id']} is outside source bounds after calibration")
        if start < markers[0]['lastPts'] + period or end > markers[-1]['firstPts'] - period:
            raise ValueError(f"Shot {shot['id']} touches a calibration marker")
        if start < previous_end:
            raise ValueError(f"Shot {shot['id']} overlaps or precedes the previous shot")
        aligned.append({**shot, 'start': start, 'end': end})
        previous_end = end
    if not aligned:
        raise ValueError('No gameplay shots captured')
    timing = {
        'method': 'two full-frame magenta markers; constant host-to-decoded-PTS offset',
        'sourceDuration': duration, 'sourceFps': fps,
        'offsetSeconds': offset, 'offsetUncertaintySeconds': uncertainty,
        'captureDelayAllowanceFrames': 2, 'endSafetyFrames': 1,
        'anchors': evidence, 'wallShots': shots,
        'reviewRequired': 'Watch cut boundaries; compositor delay is bounded by assumption, not measured independently.'
    }
    return aligned, timing


def main():
    from playwright.sync_api import sync_playwright, expect
    ffmpeg, ffprobe = media_binary('ffmpeg'), media_binary('ffprobe')
    OUT.mkdir(parents=True, exist_ok=True)
    shots, anchors = [], []
    with sync_playwright() as pw:
     browser=pw.chromium.launch(channel='chrome',headless=True)
     context=browser.new_context(viewport={'width':1600,'height':900},locale='ko-KR',record_video_dir=str(OUT/'recording'),record_video_size={'width':1600,'height':900})
     t0=time.monotonic();page=context.new_page();page.set_default_timeout(12000)
     def active():return page.locator('.pc-window[data-active="true"]')
     def follow():page.locator('.quest-next button').click()
     def button(name):active().get_by_role('button',name=name,exact=True).click()
     def pause(seconds):page.wait_for_timeout(int(seconds*1000)) # Deliberate filmed dwell, not a readiness assertion.
     def begin():return time.monotonic()-t0
     def end(id,start,duration,ko,en,ja):shots.append({'id':id,'start':round(start,3),'end':round(time.monotonic()-t0,3),'duration':duration,'caption':{'ko':ko,'en':en,'ja':ja}})
     def edit(value):button('고칠 글자 찾기');page.keyboard.insert_text(value)
     def tests():
      button('검사 실행');page.wait_for_function("JSON.parse(localStorage.getItem('codeshift-intro-demo-v1')).tests?.checks.every(x=>x.passed)")
     def upload():
      for _ in range(3):follow();active().locator('.terminal-form input').press('Enter');pause(.3)
     def deliver():
      follow();active().get_by_role('button',name=re.compile('PR 만들기')).click();pause(.4);button('PR 병합');pause(.4);button('검토한 버전 배포');expect(page.locator('.reward-dialog')).to_be_visible()
     def reward():page.get_by_role('button',name='이야기 계속하기',exact=True).click();expect(page.locator('.reward-dialog')).not_to_be_visible()
     try:
      page.goto('http://127.0.0.1:5173/',wait_until='networkidle');page.locator('.pc-play').wait_for()
      anchors.append(record_marker(page,t0,'start'))
      # The recording uses a visible cursor overlay driven by real mouse events.
      page.evaluate("""()=>{const dot=document.createElement('div');dot.style='position:fixed;width:18px;height:18px;border:2px solid #fff;border-radius:50%;pointer-events:none;z-index:99999;box-shadow:0 0 0 5px #72baff33;left:-30px;top:-30px';document.body.append(dot);document.addEventListener('pointermove',e=>{dot.style.left=(e.clientX-9)+'px';dot.style.top=(e.clientY-9)+'px'});document.addEventListener('pointerdown',()=>dot.style.background='#ffffff55');document.addEventListener('pointerup',()=>dot.style.background='transparent');}""")
      s=begin();page.mouse.move(160,565);pause(2);page.locator('.pc-play').click();pause(2)
      end('start',s,3,'컴퓨터를 켜면, 이야기가 시작된다.','Start your PC. Start a story.','パソコンを開くと、物語が始まる。')
      s=begin();page.locator('.pc-shortcuts').get_by_role('button',name='메시지',exact=True).click();pause(3);button('의뢰 수락');pause(1)
      end('request',s,3,'도착한 메시지. 첫 번째 의뢰.','A new message. Your first case.','届いたメッセージ。最初の依頼。')
      s=begin();follow()
      for name in ['프로젝트 복사','준비물 받기','미리보기 켜기']:button(name);pause(.8)
      pause(1);end('setup',s,2,'파일을 가져오고, 내 PC에서 실행.','Get the files. Run them on your PC.','ファイルを受け取り、自分のPCで起動。')
      s=begin();follow();button('360px');pause(3);button('문제 확인 · 파일 고치기');pause(.5)
      end('inspect',s,3,'어디가 고장 났는지, 직접 확인하고.','See what is broken for yourself.','どこがおかしいのか、自分で確かめる。')
      s=begin();follow();edit('모노 카페');pause(.8);follow();edit('100%');pause(.8);tests();pause(2)
      end('fix',s,4,'작은 수정이 화면을 바꾼다.','A small edit changes the screen.','小さな修正で、画面が変わる。')
      s=begin();upload();pause(.8)
      end('terminal',s,2,'자동완성과 안내를 따라, 한 단계씩.','Autocomplete and clear steps guide you.','自動補完と案内で、一歩ずつ。')
      s=begin();deliver();pause(2);end('reward',s,3,'검사를 통과하고, 의뢰를 마무리.','Pass the checks. Deliver the fix.','検査に合格。依頼を仕上げる。');reward()
      follow()
      for _ in range(3):button('수량 늘리기')
      button('문제 확인 · 파일 고치기');follow();edit('*');tests();upload();deliver();reward();follow();edit('/api/menu');edit('True')
      # Progress using only visible quest actions. Select the server/API moment for the edit.
      for _ in range(30):
       title=page.locator('.quest-next>strong').inner_text()
       if title.startswith('API 앱'):break
       follow()
       if '서버 앱에서' in title:button('Ubuntu 설치')
       else:active().locator('.terminal-form input').press('Enter')
      s=begin();follow();button('전송');pause(.7);active().get_by_role('button',name='POST 주문 보내기').click();button('전송');pause(1);active().get_by_role('tab',name=re.compile('서버 주문 기록')).click();pause(2)
      end('server',s,3,'파일에서 서버까지. 세 사건을 연결하자.','From files to a server. Three connected cases.','ファイルからサーバーへ。三つの事件をつなごう。')
      follow();tests();deliver();reward()
      s=begin();active().get_by_role('button',name=re.compile('OPEN')).click();pause(3)
      end('cafe-open',s,2,'내 손으로 켠 첫 OPEN.','Your first OPEN sign.','自分の手で点けた最初のOPEN。')
      page.locator('.pc-show-desktop').click()
      s=begin();page.locator('.pc-shortcuts').get_by_role('button',name='의뢰 센터',exact=True).click();active().locator('.pc-window-buttons button').nth(3).click();active().get_by_test_id('map-pin-florist-stock').click();pause(1);active().get_by_test_id('map-pin-bakery-price').click();pause(2)
      end('contracts',s,4,'지도에서 고르는, 동네의 18개 의뢰.','Pick your next job on the neighborhood map.','地図で選ぶ、まちの18件の依頼。')
      ids=['bakery-price','library-loans','florist-stock','bike-hours','contacts-clean','clinic-form','market-filter','school-sort','workshop-slots','delivery-fees','museum-layout','bookstore-invoice','community-api','photo-cache','transit-logs','archive-backup','tutor-timezone','festival-report']
      for index,job in enumerate(ids):
       active().get_by_test_id('career-job-'+job).click();active().get_by_test_id('career-accept').click();active().get_by_test_id('career-inspect').click()
       active().locator('.career-answer>button').click()
       answers=[(item.locator('strong').inner_text(),item.locator('pre').inner_text()) for item in active().locator('.career-answer>div>div').all()]
       active().locator('.career-answer>button').click()
       if index==0:s=begin()
       for filename,source in answers:
        active().locator('.career-file-tabs button').filter(has=page.get_by_text(filename,exact=True)).click();active().locator('.career-code-input textarea').fill(source)
       active().get_by_test_id('career-test').click();active().get_by_test_id('career-reply-'+('care' if index%2==0 else 'craft')).check();active().get_by_test_id('career-deliver').click()
       if index==0:
        pause(2);end('client-reply',s,4,'파일을 고치고, 고객에게 직접 답한다.','Fix the files. Send your own reply.','ファイルを直し、自分の言葉で返事する。')
      active().get_by_test_id('career-tools-button').click()
      s=begin()
      for upgrade in ['recovery-kit','second-screen','studio-sign']:active().get_by_test_id('career-upgrade-'+upgrade).click();pause(.4)
      pause(2);end('studio-tools',s,3,'번 크레딧으로 내 작업실을 채우자.','Put your earnings back into your studio.','稼いだクレジットで作業場を整える。')
      active().get_by_test_id('career-record-button').click()
      s=begin();active().get_by_test_id('career-ending').click();pause(3);end('career-ending',s,3,'쌓아 온 선택이 남긴 마지막 편지.','A final letter shaped by your choices.','積み重ねた選択が残す、最後の手紙。')
      page.locator('.pc-language').click();page.get_by_role('button',name='타이틀로 돌아가기',exact=True).click()
      page.locator('.settings-dialog').wait_for(state='hidden');pause(.3)
      s=begin();pause(3);end('cta',s,3,'CODE:SHIFT · 개발 중인 작업명','CODE:SHIFT · Working title','CODE:SHIFT · 開発中の仮タイトル')
      assert page.evaluate("JSON.parse(localStorage.getItem('codeshift-intro-demo-v1')).gameplay.openingCelebrated")
      pause(.25)  # Leave a source-frame guard before the final calibration flash.
      anchors.append(record_marker(page,t0,'end'))
      video=page.video;context.close()
      recorded=Path(video.path())
      media=inspect_recording(recorded,ffmpeg,ffprobe)
      aligned,timing=align_shots(shots,anchors,media)
      shutil.copyfile(recorded,OUT/'raw.webm')
      edl=ROOT/'media/trailer/edl-0.9.json'
      pending=edl.with_suffix('.json.tmp')
      pending.write_text(json.dumps({'source':'../../output/trailer-0.9/raw.webm','captureViewport':[1600,900],'capture':'Real local gameplay; UI input only; optional example answers used; no progress injection','captureTiming':timing,'shots':aligned},ensure_ascii=False,indent=2),encoding='utf-8')
      pending.replace(edl)
      print(json.dumps({'shots':len(shots),'targetSeconds':sum(x['duration'] for x in shots),'source':str(OUT/'raw.webm'),'offsetSeconds':timing['offsetSeconds'],'offsetUncertaintySeconds':timing['offsetUncertaintySeconds']},ensure_ascii=False))
     except Exception:
      if not page.is_closed():
       page.screenshot(path=str(OUT/'capture-failure.png'),animations='disabled');print(page.locator('body').inner_text()[-2500:])
      raise
     finally:browser.close()


if __name__ == '__main__':
    main()
