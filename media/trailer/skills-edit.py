#!/usr/bin/env python3
"""Current 30s trailer: actual UI outcomes, source-bound EDL, bright beat cuts.

Historical capture/render assets remain untouched. All media work is serial.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import shutil
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / os.environ.get('CODESHIFT_TRAILER_OUTPUT', 'output/trailer-polish')
EDIT = OUT / 'edit'
FINAL = OUT / 'final'
FPS = 30
MAX_SPEED = 8
VIEWPORT = [1600, 900]
LANGS = ('ko', 'en', 'ja')
sys.path.insert(0, str(HERE))
spec = importlib.util.spec_from_file_location('codeshift_historical_editor', HERE / 'rebuild-edit.py')
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
base.OUT, base.EDIT, base.FINAL = OUT, EDIT, FINAL
# Muted desktop palette; the captured UI stays unchanged.
CANVAS = '0x101c28'
base.COLORS = {'ink': 'f4eee7', 'blue': 'ebba86', 'red': '9299ef', 'green': 'bad681', 'gold': '8ec8e8', 'muted': 'bead98'}

# Pin accepted assets. Never silently replace an existing current audio file.
AUDIO_HASHES = {
    'Voxel Revolution.mp3': '9977d93c698abacc29e5da7ff0bccee2b8f6de47ed7e567cb0f1ed9b7564f74e',
    'editorial-click.wav': '0e6a3b61314d7115ce3215236bb333059847301d3535274cae687553d3acb4c8',
    'editorial-impact.wav': '4ce31450aff82e6ed8fba8676d32339be353f2488a1dad0ed78b59dab3b92c28',
    'editorial-success.wav': '0470d45337b84865d5121d36ffbd6b68caa44559afb9b5151361fa0368116483',
    'ATTRIBUTION.txt': 'df482da4adcf3135867988fc78beb6a700718906d619340c8cb75f4e1c061c34',
}


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def copy(ko, en, ja):
    return dict(zip(LANGS, (ko, en, ja)))


# Cumulative 128 BPM boundaries; per-shot lengths are never rounded separately.
# The recording includes intervening actions. Cuts deliberately omit those gaps.
PLAN = [
    ('broken', 0, 1.5, 'split', 'gold', copy('고장 난 계산대. / 해결 보상 200 cr.', 'BROKEN TILL. / REWARD: 200 cr.', 'レジが故障。 / 報酬は200 cr。'), copy('6개 주문 · 정상 10,000원 / 현재 12,600원', '6 buns · Expected ₩10,000 / Actual ₩12,600', '6個の注文 · 正しくは10,000 / 表示は12,600ウォン')),
    ('desktop', 1.5, 2, 'wide', 'blue', copy('내 작업실.', 'YOUR WORKSPACE.', '自分の作業場。'), copy('', '', '')),
    ('code', 2, 3.5, 'wide', 'blue', copy('직접 고치고.', 'FIX IT YOURSELF.', '自分で直す。'), copy('코드를 입력하고 실행', 'Type your code. Run it.', 'コードを入力して実行')),
    ('fixed', 3.5, 5, 'wide', 'green', copy('됐다.', 'IT WORKS.', 'できた。'), copy('6개 10,000원 · 8개 13,600원', '6 = ₩10,000 · 8 = ₩13,600', '6個10,000 · 8個13,600ウォン')),
    ('delivery', 5, 6, 'wide', 'gold', copy('+200 cr.', '+200 cr.', '+200 cr.'), copy('납품 완료 · +80 XP', 'Job delivered · +80 XP', '納品完了 · +80 XP')),
    ('monitor', 6, 6.5, 'wide', 'gold', copy('번 돈은 장비로.', 'EARN IT. UPGRADE.', '稼いで、道具を買う。'), copy('보조 모니터 · 600 cr', 'Second monitor · 600 cr', 'サブモニター · 600 cr')),
    ('monitor-use', 6.5, 7.5, 'wide', 'blue', copy('바로 써먹는다.', 'PUT IT TO WORK.', 'さっそく使おう。'), copy('코드와 결과를 나란히', 'Code and results, side by side', 'コードと結果を並べて比較')),
    ('map', 7.5, 8.5, 'wide', 'blue', copy('다음 일은 내가 고른다.', 'CHOOSE YOUR NEXT JOB.', '次の仕事は、自分で選ぶ。'), copy('구역마다 6개 중 4개 선택', 'Choose 4 of 6 jobs per district', '各エリア6依頼から4件選択')),
    ('district', 8.5, 9.5, 'wide', 'green', copy('새 동네가 열린다.', 'A NEW DISTRICT OPENS.', '新しいエリアが開く。'), copy('', '', '')),
    ('project', 9.5, 11, 'showcase', 'blue', copy('이번엔 / 내 앱.', 'NOW, / YOUR OWN APP.', '今度は、 / 自分のアプリ。'), copy('내 작업을 소개하는 포트폴리오', 'A portfolio of your work', '自分の仕事を紹介する作品集')),
    ('project-filter', 11, 12, 'showcase', 'blue', copy('내가 만든 대로 / 움직인다.', 'YOUR CODE. / WORKING.', '自分のコードで、 / 動き出す。'), copy('직접 만든 검색과 분류', 'Your search. Your categories.', '自分で作った検索と分類')),
    ('release', 12, 14, 'wide', 'green', copy('v1.0.0 / 배포 완료.', 'v1.0.0 / RELEASED.', 'v1.0.0 / 公開完了。'), copy('게임 속 내가 만든 앱의 첫 출시', 'Your app\u2019s first release inside the game', 'ゲームの中で、自分のアプリを初公開')),
    ('end', 14, 16, 'end', 'gold', copy('내 첫 / 출시.', 'YOUR FIRST / RELEASE.', 'はじめての / リリース。'), copy('첫 의뢰 시작하기', 'Start your first job', '最初の依頼を始めよう')),
]

# Calibrated against the accepted 1600x900 raw capture screenshots. These are
# editorial selections of real pixels, not substitutes for recorded focus data.
# Keep both the captured focus and this reviewed selection in the editable EDL.
REVIEWED_CROPS = {
    'broken': ([852, 488, 728, 251], [852, 488, 728, 251], 'Actual bakery receipt, expected and actual six-bun totals'),
    'code': ([250, 164, 760, 390], [250, 164, 520, 390], 'Actual editor text, save and test controls; omit empty textarea width'),
    'fixed': ([235, 40, 1350, 440], [580, 40, 995, 440], 'Landscape: real toast and before/after cards. Portrait: full toast and corrected-results column, row meanings stated in editorial detail'),
    'delivery': ([235, 40, 1350, 545], [570, 40, 1005, 545], 'Actual delivery toast, +200 cr/+80 XP and job progress; portrait emphasizes toast and corrected-results column'),
    'monitor': ([235, 230, 1350, 470], [235, 230, 1350, 470], 'Real connected-screen badge and owned monitor shop row'),
    'monitor-use': ([235, 138, 1350, 700], [235, 138, 1350, 700], 'Real code editor and execution results side by side'),
    'district': ([235, 40, 1350, 610], [570, 40, 1005, 610], 'Real fourth-job unlock toast and district progress; portrait emphasizes the right-hand action/results'),
    'project': ([716, 278, 388, 488], [716, 278, 388, 488], 'Actual authored app viewport with title, filters and project descriptions'),
    'project-filter': ([716, 278, 388, 488], [716, 278, 388, 488], 'Same actual app viewport while its category/search filters change'),
    'release': ([320, 40, 1180, 730], [320, 40, 1180, 730], 'Full real release scene: toast, release banner, source code and project preview'),
}


def footage_box(layout, vertical):
    if layout == 'end':
        return [110, 610, 860, 1020] if vertical else [1040, 110, 720, 820]
    if vertical:
        return [40, 650 if layout == 'split' else 500, 1000, 990 if layout == 'split' else 1160]
    if layout == 'split':
        return [850, 210, 1030, 790]
    if layout == 'showcase':
        return [890, 170, 940, 840]
    return [28, 160, 1864, 842]


def safe_crop(focus, overview=False, margin=24):
    if overview or focus is None:
        return [0, 0, *VIEWPORT]
    vals = [focus.get(k) for k in ('x', 'y', 'width', 'height')]
    if any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) for v in vals):
        raise ValueError('Recorded focus must contain four finite numeric bounds')
    x, y, w, h = vals
    if w <= 0 or h <= 0 or x >= 1600 or y >= 900 or x+w <= 0 or y+h <= 0:
        raise ValueError(f'Focus has no recorded pixels in the 1600x900 viewport: {focus}')
    # Some tall UI elements extend beyond the viewport. Only their recorded
    # intersection can be shown; no reconstruction or invented outside pixels.
    # Extra recorded pixels protect UI labels from the inherited 1.8% punch-in.
    left, top = max(0, math.floor(x - margin)), max(0, math.floor(y - margin))
    right, bottom = min(1600, math.ceil(x + w + margin)), min(900, math.ceil(y + h + margin))
    return [left, top, right - left, bottom - top]


def make_edl(check_media=True):
    evidence_path, source = OUT / 'capture-evidence.json', OUT / 'raw.webm'
    evidence = json.loads(evidence_path.read_text(encoding='utf-8-sig'))
    english_ui = evidence.get('language') == 'en'
    if evidence.get('viewport') != VIEWPORT:
        raise ValueError('Current capture must be calibrated at 1600x900')
    takes = evidence.get('shots', [])
    if len({s['id'] for s in takes}) != len(takes):
        raise ValueError('Capture contains duplicate shot ids')
    by_id = {s['id']: s for s in takes}
    shots = []
    for ident, b0, b1, layout, color, title, detail in PLAN:
        a, b = (math.floor(bar * 1.875 * FPS + .5) for bar in (b0, b1))
        shot = dict(id=ident, fromFrame=a, frames=b-a, layout=layout, color=color, copy=title, detail=detail)
        if ident == 'end':
            take = by_id['project']
            start, end = take['end']-.6, take['end']
            shot.update(start=start, end=end, speed=1, source='raw.webm', recordedFocus=take['focus'], crop=[716,278,388,488], portraitCrop=[716,278,388,488], footageBox=footage_box('end',False), portraitFootageBox=footage_box('end',True), holdLastFrame=True, cropReason='Hold the real authored app; do not replace the payoff with a blank text card')
            if english_ui:
                shot['crop'] = shot['portraitCrop'] = safe_crop(take['focus'], margin=0)
        else:
            if ident not in by_id:
                raise ValueError(f'Missing recorded shot: {ident}')
            take = by_id[ident]
            start, end = take['start'], take['end']
            if any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) for v in (start, end)) or not 0 <= start < end:
                raise ValueError(f'Invalid source range for {ident}')
            speed = (end-start) / ((b-a)/FPS)
            if speed > MAX_SPEED:
                raise ValueError(f'{ident}: {speed:.2f}x exceeds {MAX_SPEED}x; shorten the recorded take explicitly')
            if ident in ('broken', 'code', 'fixed', 'delivery') and take.get('focus') is None:
                raise ValueError(f'{ident} needs its actual UI focus bounds')
            overview = ident in ('desktop', 'monitor-use', 'map', 'district')
            crop = safe_crop(take.get('focus'), overview)
            shot.update(start=start, end=end, speed=speed, crop=crop, source='raw.webm', recordedFocus=take.get('focus'))
            # Contain the same evidence in portrait; never center-crop away results.
            shot['portraitCrop'] = safe_crop(take.get('focus'), ident == 'desktop')
            if ident in REVIEWED_CROPS:
                shot['crop'], shot['portraitCrop'], shot['cropReason'] = REVIEWED_CROPS[ident]
                for selected in (shot['crop'], shot['portraitCrop']):
                    x, y, cw, ch = selected
                    if min(x, y) < 0 or min(cw, ch) <= 0 or x+cw > 1600 or y+ch > 900:
                        raise ValueError(f'{ident}: reviewed crop exceeds the actual viewport')
            if english_ui:
                if ident in ('project', 'project-filter'):
                    shot['crop'] = shot['portraitCrop'] = safe_crop(take['focus'], margin=0)
                    shot['cropReason'] = 'Recorded English app viewport, scrolled into view through UI'
                elif ident == 'broken':
                    shot['crop'] = shot['portraitCrop'] = [866, 502, 700, 224]
                    shot['cropReason'] = 'Reviewed English receipt with expected and actual results'
                elif ident == 'release':
                    shot['crop'] = shot['portraitCrop'] = [320, 40, 1180, 780]
                    shot['cropReason'] = 'English release banner, source and app preview'
            shot['footageBox'] = footage_box(layout, False)
            shot['portraitFootageBox'] = footage_box(layout, True)
        shots.append(shot)
    raw_hash = digest(source)
    if evidence.get('rawSha256') and evidence['rawSha256'].lower() != raw_hash:
        raise ValueError('Capture evidence rawSha256 does not match raw.webm')
    edl = {
        'schema': 'codeshift-current-edl-1', 'fps': FPS, 'bpm': 128, 'frames': 900,
        'source': '../raw.webm', 'sourceSha256': raw_hash,
        'captureEvidence': '../capture-evidence.json', 'captureEvidenceSha256': digest(evidence_path),
        'gameCommit': evidence.get('gameCommit', evidence.get('commit')),
        'gameVersion': evidence.get('version'),
        'workingTreeDiffSha256': evidence.get('workingTreeDiffSha256'),
        'gameSourceSha256': evidence.get('gameSourceSha256'),
        'captureTiming': evidence.get('timing'), 'sourceEvents': evidence.get('events', []),
        'saveImport': evidence.get('saveImport'),
        'sourceLanguage': evidence.get('language', 'ko'),
        'capture': evidence.get('capture', 'Actual Korean UI; automated inputs; visible import of UI-earned cafe save; omitted intervening actions; retimed montage; editorial typography and SFX'),
        'audioAssets': AUDIO_HASHES, 'maxSpeed': MAX_SPEED, 'layoutVersion': 'desktop-hook-v3', 'shots': shots,
    }
    if not edl['gameCommit']:
        raise ValueError('Capture evidence needs its gameCommit')
    cursor = 0
    for shot in shots:
        if shot['fromFrame'] != cursor or shot['frames'] <= 0:
            raise ValueError('Output cuts must be contiguous with no overlap')
        cursor += shot['frames']
    if cursor != 900:
        raise ValueError('Current trailer must have exactly 900 frames')
    if check_media:
        info = base.probe(base.FP, source)
        video = next(s for s in info['streams'] if s['codec_type'] == 'video')
        if [video['width'], video['height']] != VIEWPORT:
            raise ValueError('Source dimensions do not match calibrated focus bounds')
        duration = float(info['format']['duration'])
        for shot in shots:
            if shot['end'] > duration + .001:
                raise ValueError(f'{shot["id"]} ends beyond source duration {duration}')
        edl['sourceDuration'] = duration
    return edl


def prepare_audio():
    original = ROOT / ('output/trailer-polish/audio' if OUT != ROOT / 'output/trailer-polish' else 'output/trailer-rebuild/audio')
    target = OUT / 'audio'
    target.mkdir(parents=True, exist_ok=True)
    for name, expected in AUDIO_HASHES.items():
        src, dst = original / name, target / name
        if not dst.exists():
            if not src.is_file() or digest(src) != expected:
                raise ValueError(f'Accepted audio source changed or is missing: {name}')
            shutil.copy2(src, dst)
        if digest(dst) != expected:
            raise ValueError(f'Current audio changed; refusing overwrite: {dst}')
    # Voxel's original source and license evidence already live in this target.
    # Never inherit the previous soundtrack's provenance or beat grid.


def render_shots(edl, vertical):
    """Serial real-footage composition with reviewed evidence-sized rectangles.

    The inherited encoder/run/probe/final QA remain shared; current geometry is
    explicit in the EDL instead of inheriting narrow panoramic-video slots.
    """
    folder = EDIT/('vertical' if vertical else 'landscape')
    folder.mkdir(parents=True, exist_ok=True)
    w, h = (1080, 1920) if vertical else (1920, 1080)
    paths = []
    for shot in edl['shots']:
        dst = folder/(shot['id']+'.mp4')
        paths.append(dst)
        signature = hashlib.sha256(json.dumps([shot, vertical, edl['layoutVersion'], edl['sourceSha256']], sort_keys=True).encode()).hexdigest()
        sig = dst.with_suffix('.sha256')
        if dst.is_file() and sig.is_file() and sig.read_text() == signature:
            continue
        duration = shot['frames']/FPS
        args = [base.FF, '-y', '-v', 'error', '-threads', '4', '-filter_complex_threads', '1']
        if shot.get('source') is None:
            args += ['-f', 'lavfi', '-i', f'color=c={CANVAS}:s={w}x{h}:r=30:d={duration}']
        else:
            vx, vy, vw, vh = shot['portraitFootageBox'] if vertical else shot['footageBox']
            x, y, cw, ch = shot['portraitCrop'] if vertical else shot['crop']
            if vx < 0 or vy < 0 or vx+vw > w or vy+vh > h:
                raise ValueError(f'{shot["id"]}: footage rectangle exceeds output frame')
            ratio = min(vw/cw, vh/ch)
            sw, sh = int(cw*ratio)//2*2, int(ch*ratio)//2*2
            # Static containment preserves every selected pixel. Motion is in
            # recorded actions and typography; no punch-in clips real UI labels.
            filt = (f'[0:v]trim=duration={shot["end"]-shot["start"]:.6f},'
                    f'setpts=(PTS-STARTPTS)/{shot["speed"]:.8f},fps=30,'
                    f'crop={cw}:{ch}:{x}:{y},scale={sw}:{sh}:flags=lanczos,'
                    f'tpad=stop_mode=clone:stop_duration={duration},trim=end_frame={shot["frames"]},'
                    f'pad={w}:{h}:{vx+(vw-sw)//2}:{vy+(vh-sh)//2}:color={CANVAS},setsar=1[v]')
            args += ['-ss', str(shot['start']), '-i', str(OUT/'raw.webm'), '-filter_complex', filt, '-map', '[v]']
        base.run(args+['-frames:v', str(shot['frames']), '-an', '-c:v', 'libx264', '-threads', '4', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', str(dst)], cwd=ROOT, timeout=180)
        sig.write_text(signature)
    concat = folder/'concat.txt'
    concat.write_text(''.join("file '"+p.as_posix()+"'\n" for p in paths), encoding='utf-8')
    master = folder/'silent.mp4'
    base.run([base.FF, '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', str(concat), '-c', 'copy', str(master)], cwd=ROOT)
    return master


def ass(edl, lang, vertical):
    """Large rhythmic type, bounded by measured glyph widths in every language."""
    w, h = (1080, 1920) if vertical else (1920, 1080)
    out = EDIT / f'type-{lang}{"-vertical" if vertical else ""}.ass'
    lines = [f'''[Script Info]
ScriptType: v4.00+
PlayResX: {w}
PlayResY: {h}
WrapStyle: 2
ScaledBorderAndShadow: yes
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Type,{base.font(lang)},100,&H00352C17,&H00352C17,&H00E4F0F5,&H00E4F0F5,-1,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
''']
    def event(a, b, tags, text, layer=2):
        if a >= b:
            return
        lines.append(f'Dialogue: {layer},{base.timestamp(a,ass=True)},{base.timestamp(b,ass=True)},Type,,0,0,0,,{{{tags}}}{text}\n')
    def text(a, b, value, x, y, size, color='ink', delay=0, animate=True, maxw=None):
        if not value:
            return
        maxw = min(maxw or w-x-60, w-x-60)
        value = value.replace('\\', '＼').replace('{', '｛').replace('}', '｝')
        size = base.textsize(value, size, maxw, lang)
        measured = base.ImageFont.truetype(base.font_path(lang), size).getlength(value)
        dx = min(58, max(0, maxw-measured))
        scale = min(110, 100*(maxw-dx)/max(1, measured))
        motion = rf'\move({x+dx:.1f},{y+12},{x},{y},0,150)\fscx{scale:.2f}\fscy{scale:.2f}\t(0,170,\fscx100\fscy100)' if animate else rf'\pos({x},{y})'
        event(a+delay, b, rf'\an7\fs{size}\c&H{base.COLORS[color]}&{motion}', value)
    def rect(a, b, x, y, rw, rh, color):
        event(a, b, rf'\an7\pos({x},{y})\p1\c&H{base.COLORS[color]}&', f'm 0 0 l {rw} 0 l {rw} {rh} l 0 {rh}', 0)
    for shot in edl['shots']:
        a, b = shot['fromFrame']/FPS, (shot['fromFrame']+shot['frames'])/FPS
        color, layout, ident = shot['color'], shot['layout'], shot['id']
        title = shot['copy'][lang].split(' / ')
        if layout == 'end':
            for i, line in enumerate(title):
                text(a, b, line, 84, (210+i*155) if vertical else (240+i*170), 122 if vertical else 138, color if i else 'ink', delay=i*.10, maxw=910 if vertical else 860)
            text(a+.3, b, 'A neighborhood coding sim' if edl.get('sourceLanguage') == 'en' else 'CODE:SHIFT', 84, 1720 if vertical else 760, 40 if edl.get('sourceLanguage') == 'en' else 50, 'ink', maxw=900)
            text(a+.4, b, shot['detail'][lang]+'  →', 84, 1810 if vertical else 855, 42, 'gold', maxw=900 if vertical else 870)
            text(a+.4, b, copy('게임 속, 직접 만든 앱의 1.0.0', 'Your own app, version 1.0.0 in game', 'ゲーム内で作った、自分のアプリ1.0.0')[lang], 84, 530 if vertical else 630, 29, 'muted', animate=False, maxw=900 if vertical else 850)
        elif layout in ('split', 'showcase'):
            maxw = 930 if vertical else (730 if layout == 'showcase' else 680)
            for i, line in enumerate(title):
                text(a, b, line, 80, (140+i*146) if vertical else (250+i*160), 110 if vertical else 116, color if i else 'ink', delay=i*.12, maxw=maxw)
            if ident == 'broken':
                text(a+.15, b, copy('기대 10,000원', 'EXPECTED ₩10,000', '正しくは10,000ウォン')[lang], 84, 520 if vertical else 680, 56 if vertical else 45, 'green', maxw=maxw)
                text(a+.28, b, copy('현재 12,600원!', 'ACTUAL ₩12,600!', '表示は12,600ウォン！')[lang], 84, 610 if vertical else 755, 56 if vertical else 45, 'red', maxw=maxw)
                detail = copy('6개 주문을 직접 테스트', 'Test the six-bun order', '6個の注文を実際にテスト')[lang]
            else:
                detail = shot['detail'][lang]
            text(a+.1, b, detail, 84, 1760 if vertical else (850 if ident == 'broken' else 790), 32, maxw=930 if vertical else maxw)
        else:
            if vertical and len(title) > 1:
                for i, line in enumerate(title):
                    text(a, b, line, 80, 130+i*146, 105, color if i else 'ink', delay=i*.1, maxw=w-160)
            else:
                # Panoramic evidence gets the frame width. Both beats of split
                # copy remain visible in one short headline above the footage.
                text(a, b, ' '.join(title), 80, 54 if not vertical else 175, 84 if not vertical else 105, color, maxw=w-160)
            detail = shot['detail'][lang]
            # Two legible detail lines in portrait, instead of shrinking long UI context.
            if vertical and ident == 'fixed':
                parts = [copy('6개 10,000원 / 8개 13,600원', '6 = ₩10,000 / 8 = ₩13,600', '6個10,000 / 8個13,600ウォン')[lang]]
            elif vertical and ident == 'delivery':
                parts = [copy('빵집 의뢰 완료', 'Bakery job complete', 'パン屋の依頼完了')[lang], '+200 cr · +80 XP']
            else:
                parts = detail.split(' · ') if vertical else [detail]
            for i, line in enumerate(parts):
                emphasis = vertical and ident in ('fixed', 'delivery')
                text(a+.08, b, line, 84, (1710+i*90) if emphasis else (1740+i*50) if vertical else 1016, 49 if emphasis else 31 if vertical else 32, maxw=w-170)
        event(a, min(b, a+.2), rf'\an7\pos(0,0)\p1\c&H{base.COLORS[color]}&\fscx3\t(0,170,\fscx100)', f'm 0 0 l {w} 0 l {w} 12 l 0 12', 3)
    note = copy('실제 게임 화면 · 자동 조작·장면 생략·속도 편집', 'Actual Korean gameplay · automated input · cuts & retiming', '実際の韓国語版プレイ · 自動操作・場面省略・速度編集')[lang]
    if edl.get('sourceLanguage') == 'en':
        note = 'Actual gameplay footage'
        text(26.25, 30, 'Music: Voxel Revolution - Kevin MacLeod (incompetech.com)', 84, 936 if not vertical else 1570, 20, 'muted', animate=False, maxw=900)
        text(26.25, 30, 'CC BY 4.0 - creativecommons.org/licenses/by/4.0', 84, 962 if not vertical else 1596, 20, 'muted', animate=False, maxw=900)
        text(26.25, 30, 'Edited excerpt, tempo change and additional effects', 84, 988 if not vertical else 1622, 20, 'muted', animate=False, maxw=900)
    text(0, 2.8, note, 84, 50 if vertical else 32, 19, 'muted', animate=False, maxw=w-170)
    out.write_text(''.join(lines), encoding='utf-8-sig')
    return out


def mix_audio():
    assets = list(AUDIO_HASHES)[:4]
    args = [base.FF, '-y', '-v', 'error', '-threads', '2', '-filter_complex_threads', '1']
    for name in assets:
        args += ['-i', str(OUT/'audio'/name)]
    # Begin on the stronger eight-bar section; retime without changing pitch.
    # A short dip sets off the repair, then the music grows into the app release.
    # Finish across the final bar instead of abruptly truncating the ongoing song.
    filters = ["[0:a]atrim=start=15.7577:end=47.23310983606557,asetpts=PTS-STARTPTS,"
               "atempo=1.0491803278688525,apad,atrim=duration=30,volume=0.72,"
               "volume=0.55:enable='between(t,6.38,6.56)',"
               "volume=1.12:enable='gte(t,17.8125)',"
               "afade=t=in:d=0.012,afade=t=out:st=28.125:d=1.875:curve=qsin[m]"]
    # Editorial cues follow actual cuts/results, not fabricated in-game sounds.
    hits = {1: [2.8125, 3.75, 11.25, 12.1875, 14.0625, 20.625], 2: [0, 6.5625, 17.8125, 26.25], 3: [9.375, 15.9375, 22.5]}
    names = ['[m]']
    for source, times in hits.items():
        filters.append(f'[{source}:a]asplit={len(times)}'+''.join(f'[s{source}_{i}]' for i in range(len(times))))
        for i, seconds in enumerate(times):
            label = f'e{source}_{i}'
            filters.append(f'[s{source}_{i}]volume={0.22 if source == 2 else 0.32},adelay={round(seconds*1000)}:all=1[{label}]')
            names.append(f'[{label}]')
    filters.append(''.join(names)+f'amix=inputs={len(names)}:normalize=0,atrim=duration=30,loudnorm=I=-16:TP=-1.8:LRA=9,aresample=48000[a]')
    dst = EDIT/'mix.wav'
    base.run(args+['-filter_complex', ';'.join(filters), '-map', '[a]', '-c:a', 'pcm_s24le', str(dst)], cwd=ROOT)
    return dst


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lang', choices=[*LANGS, 'all'], default='ko')
    parser.add_argument('--vertical', action='store_true')
    parser.add_argument('--verify-only', action='store_true')
    parser.add_argument('--edl-only', action='store_true', help='Validate evidence and media bounds, write EDL; no render')
    args = parser.parse_args()
    EDIT.mkdir(parents=True, exist_ok=True)
    FINAL.mkdir(parents=True, exist_ok=True)
    edl = make_edl()
    (EDIT/'edl-current.json').write_text(json.dumps(edl, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    if args.edl_only:
        print('Source-bound EDL validated: 900 frames; contiguous cuts; speed <= 8x', flush=True)
        return
    languages = LANGS if args.lang == 'all' else [args.lang]
    base.ass = ass
    if not args.verify_only:
        prepare_audio()
        master = render_shots(edl, args.vertical)
        music = mix_audio()
    for lang in languages:
        target = FINAL/f'codeshift-{lang}{"-vertical" if args.vertical else ""}.mp4'
        report_path = FINAL/(target.stem+'-qa.json')
        if args.verify_only:
            previous = json.loads(report_path.read_text(encoding='utf-8'))
            expected = {'sha256': digest(target), 'edlSha256': digest(EDIT/'edl-current.json'), 'sourceSha256': edl['sourceSha256'], 'captureEvidenceSha256': edl['captureEvidenceSha256']}
            if any(previous.get(key) != value for key, value in expected.items()):
                raise ValueError(f'{target.name}: existing export is not bound to this exact EDL/source/evidence; render again')
        if not args.verify_only:
            base.render_final(edl, master, music, lang, args.vertical)
        base.verify(target, edl, args.vertical)
        report = json.loads(report_path.read_text(encoding='utf-8'))
        report.update(edlSha256=digest(EDIT/'edl-current.json'), sourceSha256=edl['sourceSha256'], captureEvidenceSha256=edl['captureEvidenceSha256'], gameCommit=edl['gameCommit'], gameVersion=edl['gameVersion'], workingTreeDiffSha256=edl['workingTreeDiffSha256'], gameSourceSha256=edl['gameSourceSha256'], outputCuts='contiguous; no overlap', maxSourceSpeed=max(s.get('speed', 0) for s in edl['shots']))
        report_path.write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')


if __name__ == '__main__':
    main()
