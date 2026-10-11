"""Ultra-fast-paced gameplay action trailer (all cuts <= 2.8s, real English UI).
"""
from pathlib import Path
import importlib.util
import json
import math
import os
import sys

HERE = Path(__file__).resolve().parent
os.environ.setdefault('CODESHIFT_TRAILER_OUTPUT', 'output/trailer-action-20261010/take2')
spec = importlib.util.spec_from_file_location('action_editor_base', HERE / 'skills-edit.py')
edit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(edit)
base = edit.base

# 15 cuts, 16 musical bars at 128 BPM (30.00s / 900 frames). Every single cut is strictly <= 2.8s.
ROWS = [
    ('broken', 1.0, 'BROKEN TILL. YOUR JOB.', 'Six buns: expected 10,000 won. Charged 12,600.', 'gold',
     '고장 난 계산대. 해결 보상 200 cr.', '6개 주문 · 정상 10,000원 / 현재 12,600원'),
    ('terminal-fail', 1.0, 'FIND THE BUG.', 'Run the checks. Find what breaks.', 'red',
     '버그를 찾아라.', '테스트 실행 · 실패 지점 확인'),
    ('terminal-open', 1.0, 'OPEN THE FILE.', 'code solution.js', 'blue',
     '에디터 열기.', 'code solution.js'),
    ('code', 1.5, 'WRITE REAL JS.', 'Real code in your simulated workstation.', 'blue',
     '직접 고치고.', '가상 워크스테이션에서 실제 JS 작성'),
    ('terminal-run', 1.25, 'RUN YOUR CODE.', 'Eight buns: 13,600 won calculated.', 'blue',
     '코드 실행.', '8개 주문: 13,600원 계산 확인'),
    ('terminal-pass', 1.25, 'ALL 20 CHECKS PASS.', 'Every edge case verified.', 'green',
     '테스트 통과.', '20개 모든 검증 케이스 합격'),
    ('fixed', 1.0, 'THE TILL WORKS.', 'Six buns: 10,000 won. Eight buns: 13,600 won.', 'green',
     '계산대 수리 완료.', '6개 10,000원 · 8개 13,600원'),
    ('delivery', 1.0, 'JOB DONE. +200 CR.', 'Deliver the fix. Earn your upgrade.', 'gold',
     '납품 완료. +200 cr.', '수리 납품 완료 · +80 XP 보상 획득'),
    ('monitor', 0.5, 'UPGRADE SETUP.', 'Hardware shop: Second monitor purchased.', 'gold',
     '장비 업그레이드.', '하드웨어 샵 · 듀얼 모니터 구매'),
    ('monitor-use', 1.0, 'DUAL SCREEN WORKSPACE.', 'Code editor and test runner side by side.', 'blue',
     '듀얼 모니터 활용.', '코드 에디터와 터미널을 한눈에'),
    ('project-filter', 1.0, 'BUILD YOUR OWN APP.', 'Search and filter your personal portfolio.', 'blue',
     '나만의 앱 개발.', '직접 구현한 검색과 카테고리 필터'),
    ('build', 0.5, 'BUILD v1.0.0.', 'Production bundle ready.', 'blue',
     '빌드 실행.', '프로덕션 번들 빌드 v1.0.0'),
    ('release', 1.5, 'YOUR FIRST RELEASE.', 'One click to deploy live in the game.', 'green',
     '내 앱 첫 출시.', '게임 속 첫 번째 프로그램 배포 완료'),
    ('letter', 1.0, 'YOU BUILT THAT.', 'Congratulations from the neighborhood.', 'gold',
     '첫 출시 축하 편지.', '고마워요, 이제 진짜 개발자네요.'),
    ('end', 1.5, 'NOW IT’S YOUR TURN.', 'A freelance developer simulator.', 'gold',
     '이제 당신 차례입니다.', '프리랜서 개발자 시뮬레이터'),
]

bar = 0.0
edit.PLAN = []
for item in ROWS:
    ident, length, en_t, en_d, color, ko_t, ko_d = item
    edit.PLAN.append((ident, bar, bar + length, 'wide', color,
                      edit.copy(ko_t, en_t, en_t), edit.copy(ko_d, en_d, en_d)))
    bar += length
assert abs(bar - 16.0) < 1e-6, f'Expected 16.0 bars, got {bar}'


def make_edl():
    edl = edit.make_edl()
    edl['layoutVersion'] = 'fast-action-cut-v2'
    edl['editorialIntent'] = '15 fast cuts under 3s, real English terminal/code footage, hardware shop, live app release.'
    for shot in edl['shots']:
        ident = shot['id']
        shot['footageBox'] = [32, 128, 1856, 846]
        if ident == 'code':
            shot['crop'] = [0, 180, 840, 385]
        elif ident.startswith('terminal-'):
            shot['terminalBands'] = {
                'terminal-fail': [[0, 476, 1020, 232], [0, 723, 1020, 67]],
                'terminal-open': [[0, 476, 1020, 232], [0, 723, 1020, 67]],
                'terminal-run': [[0, 78, 1020, 230], [0, 723, 1020, 67]],
                'terminal-pass': [[0, 479, 1020, 229], [0, 723, 1020, 67]],
            }[ident]
            if ident == 'terminal-open':
                shot.pop('terminalBands')
                shot['crop'] = [0, 40, 1100, 790]
        elif ident == 'letter':
            shot['crop'] = edit.safe_crop(shot['recordedFocus'], margin=0)
            shot['footageBox'] = [120, 190, 1680, 590]
        elif ident == 'build':
            shot['crop'] = edit.safe_crop(shot['recordedFocus'], margin=8)
        elif ident == 'monitor-use':
            shot['crop'] = [0, 0, 1600, 900]
        elif ident == 'end':
            shot['footageBox'] = [1040, 110, 820, 860]
        if 'terminalBands' in shot:
            shot['cropReason'] = 'Two synchronous crops of the actual terminal: output above, input below.'
        elif ident in ('code', 'letter', 'build', 'terminal-open', 'monitor-use'):
            shot['cropReason'] = 'Reviewed actual English action-capture pixels.'
    edl['activeCodeAndTerminalSeconds'] = sum(s['frames'] for s in edl['shots'] if s['id'] == 'code' or s['id'].startswith('terminal-')) / 30
    return edl


def render_shots(edl):
    folder = edit.EDIT / 'landscape'
    folder.mkdir(parents=True, exist_ok=True)
    paths = []
    for shot in edl['shots']:
        if 'terminalBands' not in shot:
            edit.render_shots({**edl, 'shots': [shot]}, False)
        else:
            dst = folder / (shot['id'] + '.mp4')
            a, b = shot['terminalBands']
            crop = lambda box: ':'.join(str(v) for v in (box[2], box[3], box[0], box[1]))
            dur = shot['frames'] / 30
            filt = (f'[0:v]trim=duration={shot["end"]-shot["start"]:.6f},'
                    f'setpts=(PTS-STARTPTS)/{shot["speed"]:.8f},fps=30,'
                    f'tpad=stop_mode=clone:stop_duration={dur},trim=end_frame={shot["frames"]},split=2[o][p];'
                    f'[o]crop={crop(a)}[out];[p]crop={crop(b)}[prompt];'
                    '[out][prompt]vstack=inputs=2,scale=1856:-2:flags=lanczos,'
                    f'pad=1920:1080:32:(1080-ih)/2:color={edit.CANVAS},setsar=1[v]')
            base.run([base.FF, '-y', '-v', 'error', '-threads', '4', '-filter_complex_threads', '1',
                      '-ss', str(shot['start']), '-i', str(edit.OUT / 'raw.webm'), '-filter_complex', filt,
                      '-map', '[v]', '-frames:v', str(shot['frames']), '-an', '-c:v', 'libx264',
                      '-threads', '4', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', str(dst)],
                     cwd=edit.ROOT, timeout=180)
        paths.append(folder / (shot['id'] + '.mp4'))
    concat = folder / 'concat.txt'
    concat.write_text(''.join("file '" + p.as_posix() + "'\n" for p in paths), encoding='utf-8')
    master = folder / 'silent.mp4'
    base.run([base.FF, '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', str(concat), '-c', 'copy', str(master)], cwd=edit.ROOT)
    return master


def typography(edl, lang='en'):
    font_name = 'Arial' if lang == 'en' else 'Malgun Gothic'
    lines = [f'''[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Type,{font_name},52,&H00F4EEE7,&H00F4EEE7,&H00281C10,&H00281C10,-1,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
''']
    def text(a, b, value, x, y, size, color='ink', motion=False):
        tags = rf'\an7\fs{size}\c&H{base.COLORS[color]}&'
        tags += rf'\move({x+32},{y},{x},{y},0,140)' if motion else rf'\pos({x},{y})'
        lines.append(f'Dialogue: 1,{base.timestamp(a, ass=True)},{base.timestamp(b, ass=True)},Type,,0,0,0,,{{{tags}}}{value}\n')
    for s in edl['shots']:
        a, b = s['fromFrame'] / 30, (s['fromFrame'] + s['frames']) / 30
        title_txt = s['copy'].get(lang, s['copy']['en'])
        detail_txt = s['detail'].get(lang, s['detail']['en'])
        text(a, b, title_txt, 64, 42, 54, s['color'], True)
        if s['id'] == 'end':
            text(a + 0.15, b, detail_txt, 64, 520, 56, 'gold', True)
        elif s['id'] == 'letter':
            text(a + 0.15, b, detail_txt, 120, 900, 56, 'gold', True)
        else:
            text(a + 0.06, b, detail_txt, 64, 1010, 30, 'ink')
    badge = 'ACTUAL GAMEPLAY' if lang == 'en' else '실제 인게임 플레이'
    text(0, 2.5, badge, 1480, 65, 20, 'muted')
    text(26.25, 30, 'Music: Voxel Revolution - Kevin MacLeod (incompetech.com)', 120, 973, 20, 'muted')
    text(26.25, 30, 'CC BY 4.0 - creativecommons.org/licenses/by/4.0 | Edited excerpt, tempo change + effects', 120, 1003, 20, 'muted')
    path = edit.EDIT / f'action-type-{lang}.ass'
    path.write_text(''.join(lines), encoding='utf-8-sig')
    return path


def audio(edl):
    args = [base.FF, '-y', '-v', 'error', '-threads', '2', '-filter_complex_threads', '1']
    for name in list(edit.AUDIO_HASHES)[:4]:
        args += ['-i', str(edit.OUT / 'audio' / name)]
    filters = ["[0:a]atrim=start=15.7577:end=47.23310983606557,asetpts=PTS-STARTPTS,atempo=1.0491803278688525,apad,atrim=duration=30,volume=0.68,volume=0.5:enable='between(t,15.72,15.93)',afade=t=in:d=0.012,afade=t=out:st=29.35:d=0.65[m]"]
    starts = {s['id']: s['fromFrame'] / 30 for s in edl['shots']}
    ticks = [starts['code'] + i * 0.09 for i in range(25)] + [starts[k] for k in ('terminal-open', 'terminal-run', 'monitor', 'project-filter', 'build')]
    hits = {
        1: ticks,
        2: [0, starts['code'], starts['release']],
        3: [starts['terminal-pass'] + 0.8, starts['delivery'], starts['release'] + 0.25]
    }
    names = ['[m]']
    for source, times in hits.items():
        filters.append(f'[{source}:a]asplit={len(times)}' + ''.join(f'[s{source}_{i}]' for i in range(len(times))))
        for i, t in enumerate(times):
            label = f'e{source}_{i}'
            volume = 0.14 if source == 1 else 0.35
            filters.append(f'[s{source}_{i}]volume={volume},adelay={round(t*1000)}:all=1[{label}]')
            names.append(f'[{label}]')
    filters.append(''.join(names) + f'amix=inputs={len(names)}:normalize=0,atrim=duration=30,loudnorm=I=-16:TP=-1.8:LRA=9,aresample=48000[a]')
    dst = edit.EDIT / 'mix.wav'
    base.run(args + ['-filter_complex', ';'.join(filters), '-map', '[a]', '-c:a', 'pcm_s24le', str(dst)], cwd=edit.ROOT)
    return dst


def main():
    edit.EDIT.mkdir(parents=True, exist_ok=True)
    edit.FINAL.mkdir(parents=True, exist_ok=True)
    edl = make_edl()
    path = edit.EDIT / 'edl-action.json'
    path.write_text(json.dumps(edl, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    edit.prepare_audio()
    print("Rendering shots...")
    master = render_shots(edl)
    print("Mixing audio...")
    music = audio(edl)
    
    # Render English version
    print("Rendering English trailer...")
    ass_en = typography(edl, 'en')
    target_en = edit.FINAL / 'codeshift-en.mp4'
    filt_en = f"ass='{ass_en.name}'"
    base.run([base.FF, '-y', '-v', 'error', '-i', str(master), '-i', str(music),
              '-filter_complex', f'[0:v]{filt_en}[v]', '-map', '[v]', '-map', '1:a',
              '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p',
              '-c:a', 'aac', '-b:a', '192k', str(target_en)], cwd=edit.EDIT)
    print(f'Rendered: {target_en} ({target_en.stat().st_size} bytes)')
    
    # Render Korean localized version
    print("Rendering Korean trailer...")
    ass_ko = typography(edl, 'ko')
    target_ko = edit.FINAL / 'codeshift-ko.mp4'
    filt_ko = f"ass='{ass_ko.name}'"
    base.run([base.FF, '-y', '-v', 'error', '-i', str(master), '-i', str(music),
              '-filter_complex', f'[0:v]{filt_ko}[v]', '-map', '[v]', '-map', '1:a',
              '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p',
              '-c:a', 'aac', '-b:a', '192k', str(target_ko)], cwd=edit.EDIT)
    print(f'Rendered: {target_ko} ({target_ko.stat().st_size} bytes)')


if __name__ == '__main__':
    main()
