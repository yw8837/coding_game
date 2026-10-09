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
from pathlib import Path
import shutil
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / 'output/trailer-current'
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

# Pin accepted assets. Never silently replace an existing current audio file.
AUDIO_HASHES = {
    'realizer-bright-30s-128bpm.wav': 'be4f1163deb5360d4d202424aa4b7656f78f0f5ab39a415d83c1f47ece43b0e2',
    'editorial-click.wav': '0e6a3b61314d7115ce3215236bb333059847301d3535274cae687553d3acb4c8',
    'editorial-impact.wav': '4ce31450aff82e6ed8fba8676d32339be353f2488a1dad0ed78b59dab3b92c28',
    'editorial-success.wav': '0470d45337b84865d5121d36ffbd6b68caa44559afb9b5151361fa0368116483',
    'ATTRIBUTION.txt': '4d5a35afac5b9a4e67774d9935ae258b70e9b815b52481e8304aea3ac695e84f',
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
    ('broken', 0, 1.5, 'split', 'red', copy('빵 여섯 개. / 금액은 엉뚱.', 'SIX BUNS. / WRONG TOTAL.', 'パン6個。 / 金額がおかしい。'), copy('6개 주문 · 기대 10,000원 / 현재 12,600원', '6 buns · Expected ₩10,000 / Actual ₩12,600', '6個の注文 · 正しくは10,000 / 表示は12,600ウォン')),
    ('desktop', 1.5, 2, 'wide', 'blue', copy('동네의 코딩 해결사.', 'THE LOCAL CODE FIXER.', '街のコード修理屋。'), copy('작업실에서 시작하는 동네 의뢰', 'Neighborhood jobs, from your desktop', '自分の作業場から、街の依頼へ')),
    ('code', 2, 3.5, 'wide', 'blue', copy('내 손으로 / 고친 코드.', 'YOUR HANDS. / YOUR CODE.', '自分の手で / コードを直す。'), copy('실제 편집기에 입력하고 실행', 'Type in the real editor. Run it.', '本物のエディターで入力して実行')),
    ('fixed', 3.5, 5, 'wide', 'green', copy('계산이 맞았다. / 다른 주문도 정확!', 'TOTAL FIXED. / NEXT ORDER? RIGHT.', '計算が合った。 / 別の注文も正しい！'), copy('실제 재검증 · 6개 10,000원 / 8개 13,600원', 'Retested · 6 = ₩10,000 / 8 = ₩13,600', '再検証 · 6個10,000 / 8個13,600ウォン')),
    ('delivery', 5, 6, 'wide', 'gold', copy('고쳤다. / 보상이 왔다.', 'FIXED IT. / GOT PAID.', '直せた。 / 報酬が来た。'), copy('빵집 의뢰 완료 · +200 cr · +80 XP', 'Bakery job complete · +200 cr · +80 XP', 'パン屋の依頼完了 · +200 cr · +80 XP')),
    ('monitor', 6, 6.5, 'wide', 'gold', copy('600 cr, 작업실에 투자.', '600 cr. UPGRADE TIME.', '600 crで、作業場を強化。'), copy('실제로 구매하는 보조 모니터', 'Buy the second monitor in game', 'ゲーム内でサブモニターを購入')),
    ('monitor-use', 6.5, 7.5, 'wide', 'gold', copy('이제, 나란히 비교.', 'NOW, SIDE BY SIDE.', '今度は、並べて比較。'), copy('보조 모니터로 코드와 결과를 한 화면에서', 'Your code and its results, on one screen', 'サブモニターでコードと結果を同じ画面に')),
    ('map', 7.5, 8.5, 'wide', 'blue', copy('여섯 의뢰. 어디부터?', 'SIX JOBS. WHERE FIRST?', '6つの依頼。どこから？'), copy('구역마다 6개 중 4개 선택 · 최종 프로젝트 조건 12개', 'Choose 4 of 6 jobs per district · Final project needs 12', '各エリア6依頼から4件選択 · 最終プロジェクトの条件は12件')),
    ('district', 8.5, 9.5, 'wide', 'green', copy('네 번째 해결. 다음 동네!', 'FOUR FIXES. NEXT DISTRICT!', '4件解決。次のエリアへ！'), copy('완료한 의뢰로 실제 새 구역 해금', 'Completed jobs unlock the next district', '依頼を完了して、次のエリアを解放')),
    ('project', 9.5, 11, 'showcase', 'blue', copy('내가 만든 / 도구함.', 'YOUR OWN / TOOLBOX.', '自分で作った / 道具箱。'), copy('내 작업을 소개하는 포트폴리오', 'A portfolio of the tools you repaired', 'パン屋・工房・図書館の貸出を紹介する作品集')),
    ('project-filter', 11, 12, 'showcase', 'blue', copy('눌러보면, / 진짜로 바뀐다.', 'CLICK IT. / IT REALLY WORKS.', 'クリックすると、 / ちゃんと変わる。'), copy('실제 앱에서 작동하는 프로젝트 필터', 'Working project filters in the actual app', '実際のアプリで動く作品フィルター')),
    ('release', 12, 14, 'wide', 'green', copy('버전 1.0.0, 출시 완료!', 'VERSION 1.0.0. SHIPPED!', 'バージョン1.0.0、公開完了！'), copy('게임 속 내가 만든 앱의 첫 출시', 'Your first app release inside the game', 'ゲームの中で、自分のアプリを初公開')),
    ('end', 14, 16, 'end', 'blue', copy('고치고. 벌고. / 내 것을 출시하고.', 'FIX IT. EARN IT. / SHIP YOUR OWN.', '直して、稼いで。 / 自分の作品を公開。'), copy('브라우저에서 지금 플레이', 'Play now in your browser', '今すぐブラウザーでプレイ')),
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
    if vertical:
        return [40, 740 if layout == 'split' else 570, 1000, 900 if layout == 'split' else 1100]
    if layout == 'split':
        return [850, 210, 1030, 790]
    if layout == 'showcase':
        return [890, 170, 940, 840]
    return [40, 225, 1840, 775]


def safe_crop(focus, overview=False):
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
    left, top = max(0, math.floor(x - 24)), max(0, math.floor(y - 24))
    right, bottom = min(1600, math.ceil(x + w + 24)), min(900, math.ceil(y + h + 24))
    return [left, top, right - left, bottom - top]


def make_edl(check_media=True):
    evidence_path, source = OUT / 'capture-evidence.json', OUT / 'raw.webm'
    evidence = json.loads(evidence_path.read_text(encoding='utf-8-sig'))
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
            shot.update(start=0, end=0, crop=None)
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
        'capture': 'Actual Korean UI; automated inputs; visible import of UI-earned cafe save; omitted intervening actions; retimed montage; editorial typography and SFX',
        'audioAssets': AUDIO_HASHES, 'maxSpeed': MAX_SPEED, 'layoutVersion': 'current-readable-v2', 'shots': shots,
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
    original = ROOT / 'output/trailer-rebuild/audio'
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
    # Preserve official-source evidence alongside the accepted mix inputs.
    for name in ('soundtrack-provenance.json', 'beat-grid.json'):
        src, dst = original / name, target / name
        if src.is_file() and not dst.exists():
            shutil.copy2(src, dst)


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
        if shot['layout'] == 'end':
            args += ['-f', 'lavfi', '-i', f'color=c={base.CREAM}:s={w}x{h}:r=30:d={duration}']
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
                    f'tpad=stop_mode=clone:stop_duration=1,trim=end_frame={shot["frames"]},'
                    f'pad={w}:{h}:{vx+(vw-sw)//2}:{vy+(vh-sh)//2}:color={base.CREAM},setsar=1[v]')
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
        stage = 1 if a < 9.375 else 2 if a < 14.0625 else 3 if a < 17.8125 else 4
        labels = {'ko': ('고치고', '벌고 쓰고', '동네를 넓히고', '내 것을 출시하고'), 'en': ('FIX IT', 'EARN & UPGRADE', 'GO FURTHER', 'SHIP YOUR OWN'), 'ja': ('直す', '稼いで強化', '街を広げる', '自分の作品を公開')}
        rect(a, b, 60, 146 if vertical else 90, 8, 58, color)
        text(a, b, f'0{stage} / {labels[lang][stage-1]}', 88, 151 if vertical else 93, 29, color, animate=False)
        title = shot['copy'][lang].split(' / ')
        if layout == 'end':
            for i, line in enumerate(title):
                text(a, b, line, 80, (460+i*215) if vertical else (325+i*220), 130 if vertical else 162, color if i else 'ink', delay=i*.16, maxw=w-160)
            text(a+.45, b, shot['detail'][lang], 84, 1100 if vertical else 800, 50, 'green', maxw=w-160)
            text(a+.62, b, 'CODE:SHIFT', 84, 1340 if vertical else 914, 66, maxw=w-160)
            label = copy('가제 · 코딩을 몰라도 첫 의뢰부터', 'Working title · Start with your first job', '仮タイトル · 最初の依頼から始めよう')[lang]
            text(a+.62, b, label, 84 if vertical else 620, 1450 if vertical else 950, 28, animate=False, maxw=930 if vertical else 1220)
            text(a+.75, b, 'codeshift-lab.bsfire1237.chatgpt.site', 84, 1580 if vertical else 1010, 30 if vertical else 25, 'blue', animate=False)
        elif layout in ('split', 'showcase'):
            maxw = 930 if vertical else (730 if layout == 'showcase' else 680)
            for i, line in enumerate(title):
                text(a, b, line, 80, (250+i*146) if vertical else (315+i*160), 110 if vertical else 116, color if i else 'ink', delay=i*.12, maxw=maxw)
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
                    text(a, b, line, 80, 250+i*146, 105, color if i else 'ink', delay=i*.1, maxw=w-160)
            else:
                # Panoramic evidence gets the frame width. Both beats of split
                # copy remain visible in one short headline above the footage.
                text(a, b, ' '.join(title), 80, 136 if not vertical else 275, 84 if not vertical else 105, color, maxw=w-160)
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
    text(0, 26.25, note, 88, 86 if vertical else 42, 19, animate=False, maxw=w-170)
    out.write_text(''.join(lines), encoding='utf-8-sig')
    return out


def mix_audio():
    assets = list(AUDIO_HASHES)[:4]
    args = [base.FF, '-y', '-v', 'error', '-threads', '2', '-filter_complex_threads', '1']
    for name in assets:
        args += ['-i', str(OUT/'audio'/name)]
    filters = ["[0:a]volume=0.63,volume=0.38:enable='between(t,6.38,6.56)',afade=t=in:d=0.025,afade=t=out:st=29.4:d=0.6[m]"]
    # Editorial cues follow actual cuts/results, not fabricated in-game sounds.
    hits = {1: [2.8125, 3.75, 11.25, 12.1875, 14.0625, 20.625], 2: [0, 6.5625, 17.8125, 26.25], 3: [9.375, 15.9375, 22.5]}
    names = ['[m]']
    for source, times in hits.items():
        filters.append(f'[{source}:a]asplit={len(times)}'+''.join(f'[s{source}_{i}]' for i in range(len(times))))
        for i, seconds in enumerate(times):
            label = f'e{source}_{i}'
            filters.append(f'[s{source}_{i}]volume=0.4,adelay={round(seconds*1000)}:all=1[{label}]')
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
