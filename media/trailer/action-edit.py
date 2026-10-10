"""Gameplay-led English revision. Real footage, no generated game behavior.

Run with CODESHIFT_TRAILER_OUTPUT pointing at an English ACTION capture.
Shares the existing encoder, licensed audio assets and media verification.
"""
from pathlib import Path
import importlib.util
import json
import math
import os
import sys

HERE = Path(__file__).resolve().parent
os.environ.setdefault('CODESHIFT_TRAILER_OUTPUT', 'output/trailer-action-20261010/take2')
spec = importlib.util.spec_from_file_location('action_editor_base', HERE/'skills-edit.py')
edit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(edit)
base = edit.base

# Sixteen bars at 128 BPM. About fourteen seconds are code/terminal work.
ROWS = [
 ('broken', 1, 'BROKEN TILL. YOUR JOB.', 'Six buns: expected 10,000 won. Charged 12,600.', 'gold'),
 ('terminal-fail', 1, 'FIND THE BUG.', 'Run the checks. Find what breaks.', 'red'),
 ('terminal-open', 1, 'OPEN THE FILE.', 'code solution.js', 'blue'),
 ('code', 2.5, 'FIX. RUN. SHIP.', 'Your code changes the files in your simulated PC.', 'blue'),
 ('terminal-run', 1.5, 'RUN YOUR CODE.', 'Eight buns. One correct total.', 'blue'),
 ('terminal-pass', 1.5, 'ALL 20 CHECKS PASS.', 'Ready to deliver.', 'green'),
 ('fixed', 1, 'THE TILL WORKS.', 'Six buns: 10,000 won. Eight buns: 13,600 won.', 'green'),
 ('delivery', 1, 'JOB DONE. +200 cr.', 'Deliver the fix. Earn your upgrade.', 'gold'),
 ('monitor', .5, 'UPGRADE YOUR SETUP.', 'Second monitor purchased with game credits.', 'gold'),
 ('project-filter', 1, 'BUILD SOMETHING OF YOUR OWN.', 'Search and filter your first app.', 'blue'),
 ('build', .5, 'BUILD v1.0.0.', '', 'blue'),
 ('release', 1.5, 'YOUR FIRST RELEASE.', 'One click. Your first version goes live in the game.', 'green'),
 ('letter', 2, 'YOU BUILT THAT.', 'Now it\u2019s your turn.', 'gold'),
]
bar = 0
edit.PLAN = []
for ident, length, title, detail, color in ROWS:
    edit.PLAN.append((ident, bar, bar+length, 'wide', color,
                      edit.copy(title,title,title), edit.copy(detail,detail,detail)))
    bar += length
assert bar == 16


def make_edl():
    edl = edit.make_edl()
    edl['layoutVersion'] = 'action-cut-v1'
    edl['editorialIntent'] = 'Typed commands and source, real failure/pass, delivery, equipment, live release, final letter.'
    for shot in edl['shots']:
        ident = shot['id']
        shot['footageBox'] = [32, 128, 1856, 846]
        if ident == 'code':
            shot['crop'] = [0, 180, 840, 385]
        elif ident.startswith('terminal-'):
            # Recorded output and prompt are stacked without the empty terminal
            # space. Both bands come from the same frame at the same time.
            shot['terminalBands'] = {
                'terminal-fail': [[0,476,1020,232],[0,723,1020,67]],
                'terminal-open': [[0,476,1020,232],[0,723,1020,67]],
                'terminal-run': [[0,78,1020,230],[0,723,1020,67]],
                'terminal-pass': [[0,479,1020,229],[0,723,1020,67]],
            }[ident]
            # The open command genuinely changes to an editor within this take.
            if ident == 'terminal-open':
                shot.pop('terminalBands')
                shot['crop'] = [0,40,1100,790]
        elif ident == 'letter':
            shot['crop'] = edit.safe_crop(shot['recordedFocus'],margin=0)
            shot['footageBox'] = [120, 190, 1680, 590]
        elif ident == 'build':
            shot['crop'] = edit.safe_crop(shot['recordedFocus'],margin=8)
        if 'terminalBands' in shot:
            shot['cropReason'] = 'Two synchronous crops of the actual terminal: output above, input below. Empty space omitted.'
        elif ident in ('code','letter','build','terminal-open'):
            shot['cropReason'] = 'Reviewed actual English action-capture pixels.'
    edl['activeCodeAndTerminalSeconds'] = sum(s['frames'] for s in edl['shots'] if s['id']=='code' or s['id'].startswith('terminal-'))/30
    return edl


def render_shots(edl):
    folder=edit.EDIT/'landscape'
    folder.mkdir(parents=True,exist_ok=True)
    paths=[]
    for shot in edl['shots']:
        if 'terminalBands' not in shot:
            # Existing renderer accepts a one-shot EDL and emits that shot.
            edit.render_shots({**edl,'shots':[shot]},False)
        else:
            dst=folder/(shot['id']+'.mp4')
            a,b=shot['terminalBands']
            crop=lambda box: ':'.join(str(v) for v in (box[2],box[3],box[0],box[1]))
            dur=shot['frames']/30
            filt=(f'[0:v]trim=duration={shot["end"]-shot["start"]:.6f},'
                  f'setpts=(PTS-STARTPTS)/{shot["speed"]:.8f},fps=30,'
                  f'tpad=stop_mode=clone:stop_duration={dur},trim=end_frame={shot["frames"]},split=2[o][p];'
                  f'[o]crop={crop(a)}[out];[p]crop={crop(b)}[prompt];'
                  '[out][prompt]vstack=inputs=2,scale=1856:-2:flags=lanczos,'
                  f'pad=1920:1080:32:(1080-ih)/2:color={edit.CANVAS},setsar=1[v]')
            base.run([base.FF,'-y','-v','error','-threads','4','-filter_complex_threads','1',
                      '-ss',str(shot['start']),'-i',str(edit.OUT/'raw.webm'),'-filter_complex',filt,
                      '-map','[v]','-frames:v',str(shot['frames']),'-an','-c:v','libx264',
                      '-threads','4','-preset','fast','-crf','18','-pix_fmt','yuv420p',str(dst)],cwd=edit.ROOT,timeout=180)
        paths.append(folder/(shot['id']+'.mp4'))
    concat=folder/'concat.txt'
    concat.write_text(''.join("file '"+p.as_posix()+"'\n" for p in paths),encoding='utf-8')
    master=folder/'silent.mp4'
    base.run([base.FF,'-y','-v','error','-f','concat','-safe','0','-i',str(concat),'-c','copy',str(master)],cwd=edit.ROOT)
    return master


def typography(edl,lang,vertical):
    assert lang=='en' and not vertical
    lines=['''[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Type,Arial,52,&H00F4EEE7,&H00F4EEE7,&H00281C10,&H00281C10,-1,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
''']
    def text(a,b,value,x,y,size,color='ink',motion=False):
        tags=rf'\an7\fs{size}\c&H{base.COLORS[color]}&'
        tags+=rf'\move({x+32},{y},{x},{y},0,140)' if motion else rf'\pos({x},{y})'
        lines.append(f'Dialogue: 1,{base.timestamp(a,ass=True)},{base.timestamp(b,ass=True)},Type,,0,0,0,,{{{tags}}}{value}\n')
    for s in edl['shots']:
        a,b=s['fromFrame']/30,(s['fromFrame']+s['frames'])/30
        text(a,b,s['copy']['en'],64,42,56,s['color'],True)
        if s['id']=='letter':
            text(a+.2,b,s['detail']['en'],120,816,72,'gold',True)
            text(a+.3,b,'A neighborhood coding sim',120,918,32)
        else:
            text(a+.08,b,s['detail']['en'],64,1010,30)
    text(0,1.85,'ACTUAL GAMEPLAY',1480,65,20,'muted')
    text(26.25,30,'Music: Voxel Revolution - Kevin MacLeod (incompetech.com)',120,973,20,'muted')
    text(26.25,30,'CC BY 4.0 - creativecommons.org/licenses/by/4.0 | Edited excerpt, tempo change + effects',120,1003,20,'muted')
    path=edit.EDIT/'action-type-en.ass';path.write_text(''.join(lines),encoding='utf-8-sig')
    return path


def audio(edl):
    # Keep the bright licensed track; place tactile ticks on filmed typing and
    # the payoff accents on successful checks, delivery and the publish cut.
    args=[base.FF,'-y','-v','error','-threads','2','-filter_complex_threads','1']
    for name in list(edit.AUDIO_HASHES)[:4]:args+=['-i',str(edit.OUT/'audio'/name)]
    filters=["[0:a]atrim=start=15.7577:end=47.23310983606557,asetpts=PTS-STARTPTS,atempo=1.0491803278688525,apad,atrim=duration=30,volume=0.65,volume=0.5:enable='between(t,15.72,15.93)',afade=t=in:d=0.012,afade=t=out:st=29.35:d=0.65[m]"]
    starts={s['id']:s['fromFrame']/30 for s in edl['shots']}
    ticks=[starts['code']+i*.14 for i in range(31)]+[starts[k] for k in ('terminal-open','terminal-run','monitor','project-filter','build')]
    hits={1:ticks,2:[0,starts['code'],starts['release']],3:[starts['terminal-pass']+1.15,starts['delivery'],starts['release']+.35]}
    names=['[m]']
    for source,times in hits.items():
        filters.append(f'[{source}:a]asplit={len(times)}'+''.join(f'[s{source}_{i}]' for i in range(len(times))))
        for i,t in enumerate(times):
            label=f'e{source}_{i}'
            volume=.12 if source==1 else .32
            filters.append(f'[s{source}_{i}]volume={volume},adelay={round(t*1000)}:all=1[{label}]');names.append(f'[{label}]')
    filters.append(''.join(names)+f'amix=inputs={len(names)}:normalize=0,atrim=duration=30,loudnorm=I=-16:TP=-1.8:LRA=9,aresample=48000[a]')
    dst=edit.EDIT/'mix.wav'
    base.run(args+['-filter_complex',';'.join(filters),'-map','[a]','-c:a','pcm_s24le',str(dst)],cwd=edit.ROOT)
    return dst


def export_assets(edl,target):
    # Same real code scene, laid out as a readable 3-word video cover.
    # This is an editorial video-frame export, not a generated screenshot.
    header=typography(edl,'en',False).read_text(encoding='utf-8-sig').split('Dialogue:')[0]
    lines=[]
    for i,word in enumerate(('FIX.','RUN.','SHIP.')):
        tags=rf'\an7\pos(95,{210+i*180})\fs160\c&H{base.COLORS["gold" if i==2 else "ink"]}&'
        lines.append('Dialogue: 1,0:00:00.00,0:00:01.00,Type,,0,0,0,,{'+tags+'}'+word+'\n')
    ass=edit.EDIT/'cover.ass';ass.write_text(header+''.join(lines),encoding='utf-8-sig')
    shot=next(s for s in edl['shots'] if s['id']=='code')
    filt=f"crop=840:385:0:180,scale=1200:550:flags=lanczos,pad=1920:1080:660:265:color={edit.CANVAS},ass='cover.ass',scale=1280:720"
    base.run([base.FF,'-y','-v','error','-ss',str(shot['end']-.4),'-i',str(edit.OUT/'raw.webm'),'-frames:v','1','-vf',filt,'-q:v','2','-update','1',str(edit.FINAL/'gameplay-cover-en.jpg')],cwd=edit.EDIT)
    # Review thumbnail at actual small-feed size from the same video composition.
    base.run([base.FF,'-y','-v','error','-ss',str(shot['end']-.4),'-i',str(edit.OUT/'raw.webm'),'-frames:v','1','-vf',filt+',scale=320:180','-update','1',str(edit.EDIT/'review/cover-320.png')],cwd=edit.EDIT)
    gif=edit.FINAL/'reddit-gameplay-en.gif'
    filt='fps=12,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle'
    base.run([base.FF,'-y','-v','error','-threads','2','-filter_complex_threads','1','-ss','5.633333','-t','10.3','-i',str(target),'-filter_complex',filt,'-loop','0',str(gif)],cwd=edit.ROOT,timeout=120)
    info=base.probe(base.FP,gif)
    assert info['streams'][0]['width']==960 and info['streams'][0]['height']==540
    assert gif.stat().st_size<15_000_000
    base.run([base.FF,'-v','error','-i',str(gif),'-f','null','-'],cwd=edit.ROOT)
    (edit.FINAL/'gallery-assets-qa.json').write_text(json.dumps({'gifBytes':gif.stat().st_size,'gifSha256':edit.digest(gif),'gifDuration':info['format']['duration'],'gifAudio':False,'gifFullDecode':'pass','coverDimensions':[1280,720],'coverSha256':edit.digest(edit.FINAL/'gameplay-cover-en.jpg')},indent=2)+'\n',encoding='utf-8')


def main():
    edit.EDIT.mkdir(parents=True,exist_ok=True);edit.FINAL.mkdir(parents=True,exist_ok=True)
    if '--assets-only' in sys.argv:
        edl=json.loads((edit.EDIT/'edl-action.json').read_text(encoding='utf-8'))
        export_assets(edl,edit.FINAL/'codeshift-en.mp4')
        return
    edl=make_edl();path=edit.EDIT/'edl-action.json'
    path.write_text(json.dumps(edl,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    edit.prepare_audio();master=render_shots(edl);music=audio(edl)
    base.ass=typography
    target=base.render_final(edl,master,music,'en',False)
    base.verify(target,edl,False)
    report_path=target.with_name(target.stem+'-qa.json')
    report=json.loads(report_path.read_text())
    report.update(edlSha256=edit.digest(path),sourceSha256=edl['sourceSha256'],captureEvidenceSha256=edl['captureEvidenceSha256'],activeCodeAndTerminalSeconds=edl['activeCodeAndTerminalSeconds'],maxSourceSpeed=max(s['speed'] for s in edl['shots']))
    report_path.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    export_assets(edl,target)
    print(json.dumps(report),flush=True)


if __name__=='__main__':main()
