"""Source-bound 36s Localhost Hero trailer. Actual EN/KO pixels; no fake UI.

The capture adapter and this editor use separate language takes. New names and
new output directories preserve historical media. Rendering is deliberately
serial with two encoder threads to cooperate with the build/QA owner.
"""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import subprocess

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
spec = importlib.util.spec_from_file_location('release_clock', HERE / 'capture-art.py')
clock = importlib.util.module_from_spec(spec)
spec.loader.exec_module(clock)
FF, PROBE = clock.media_binary('ffmpeg'), clock.media_binary('ffprobe')
PLAN = json.loads((HERE / 'release-final-plan.json').read_text(encoding='utf-8'))
FPS = 30

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def run(args, cwd=None):
    subprocess.run(args, cwd=cwd, check=True, timeout=360, capture_output=True)

def stamp(seconds):
    total = round(seconds * 100)
    return f'{total//360000}:{total//6000%60:02}:{total//100%60:02}.{total%100:02}'

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--capture', type=Path, required=True)
    parser.add_argument('--language', choices=['en', 'ko'], required=True)
    parser.add_argument('--cafe-capture', type=Path)
    parser.add_argument('--receipt-capture', type=Path)
    parser.add_argument('--delivery', type=Path, default=Path('D:/코딩게임/출시자료/출시마감-2026-10-13/영상'))
    parser.add_argument('--audio', type=Path, default=Path('C:/codex-workspaces/codeshift-game/output/trailer-rebuild/audio/Realizer.mp3'))
    parser.add_argument('--prepare-only', action='store_true')
    args = parser.parse_args()
    args.capture=args.capture.resolve()
    args.delivery=args.delivery.resolve()
    args.audio=args.audio.resolve()
    if args.cafe_capture:args.cafe_capture=args.cafe_capture.resolve()
    if args.receipt_capture:args.receipt_capture=args.receipt_capture.resolve()
    evidence = json.loads((args.capture / 'capture-evidence.json').read_text(encoding='utf-8'))
    assert evidence['language'] == args.language, 'Actual capture UI language must match final'
    assert evidence['viewport'] == [1920, 1080]
    assert not evidence['pageErrors']
    assert sha(args.capture / 'raw.webm') == evidence['rawSha256']
    assert sha(args.audio) == PLAN['music']['sha256'], 'Original licensed music differs'
    edit = args.capture / 'edit-final'
    edit.mkdir(exist_ok=True)
    by_id = {s['id']: s for s in evidence['shots']}
    cafe=None
    if args.cafe_capture:
        cafe=json.loads((args.cafe_capture/'capture-evidence.json').read_text(encoding='utf-8'))
        assert cafe['language']==args.language and not cafe['pageErrors']
        assert sha(args.cafe_capture/'raw.webm')==cafe['rawSha256']
        by_id.update({s['id']:s for s in cafe['shots']})
    receipt=None
    if args.receipt_capture:
        receipt=json.loads((args.receipt_capture/'capture-evidence.json').read_text(encoding='utf-8'))
        assert receipt['language']==args.language and not receipt['pageErrors']
        assert sha(args.receipt_capture/'raw.webm')==receipt['rawSha256']
        by_id.update({s['id']:s for s in receipt['shots']})
    edl = []
    offset = 0
    for row in PLAN['shots']:
        source = by_id[row['id']]
        duration = row['duration']
        # For the typing shot preserve the complete visible character sequence.
        # For other shots keep the actual click/start plus a readable result hold.
        src_duration = source['end'] - source['start']
        consumed = src_duration
        speed = max(1, consumed / duration)
        assert speed <= 4, f'Typing source requires excessive speed: {speed}'
        shot = {**row, 'start':source['start'], 'end':source['start']+consumed,
                'fromFrame':offset, 'frames':round(duration*FPS), 'speed':speed,
                'recordedFocus':source['focus'], 'sourceRaw':str((args.receipt_capture if row['id'].startswith('receipt-') else args.cafe_capture if row['id']=='cafe-code' else args.capture)/'raw.webm')}
        # Use actual focus pixels for the code and terminal; preserve the rest of
        # the desktop whole. Final crop selection is visible in this EDL.
        if row['id'] in ['code', 'terminal-run', 'terminal-pass']:
            box = source['focus']
            x, y = max(0, int(box['x'])-12), max(0, int(box['y'])-36)
            w = min(1920-x, int(box['width'])+24)
            h = min(1080-y, int(box['height'])+64)
            if row['id'].startswith('terminal-'):
                # Keep input prompt and terminal window structure visible.
                x,y,w,h = 0,0,1920,1080
            shot['crop'] = [x//2*2,y//2*2,w//2*2,h//2*2]
        else:
            shot['crop'] = [0,0,1920,1080]
        if row['id']=='code':
            shot['crop']=[0,180,740,420]
        if row['id']=='broken':
            shot['crop']=[1010,484,886,270]
        if row['id'].startswith('receipt-'):
            # Reviewed EN/KO actual receipt boxes are the same position and size
            # as the opening failure. Match the camera for visible cause/effect.
            shot['crop']=[1010,484,886,270]
        edl.append(shot)
        offset += shot['frames']
    assert offset == 1080
    (edit / 'edl.json').write_text(json.dumps({'title':'Localhost Hero','sourceEvidence':str(args.capture/'capture-evidence.json'),'captureVersion':evidence['version'],'inputDisclosure':evidence.get('inputMethod', evidence['capture']),'durationSeconds':36,'shots':edl},ensure_ascii=False,indent=2),encoding='utf-8')
    if args.prepare_only:
        print(json.dumps({'prepared':str(edit/'edl.json'),'sourceLanguage':args.language,'frames':offset}))
        return
    parts = []
    for shot in edl:
        dst = edit / (shot['id']+'.mp4')
        x,y,w,h = shot['crop']
        vf = f"trim=duration={shot['end']-shot['start']:.6f},setpts=(PTS-STARTPTS)/{shot['speed']:.8f},fps=30,crop={w}:{h}:{x}:{y},scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x101c28,tpad=stop_mode=clone:stop_duration={shot['duration']},trim=end_frame={shot['frames']},setsar=1"
        run([FF,'-y','-v','error','-threads','2','-filter_threads','1','-ss',str(shot['start']),'-i',shot['sourceRaw'],'-vf',vf,'-an','-frames:v',str(shot['frames']),'-c:v','libx264','-threads','2','-preset','fast','-crf','16','-pix_fmt','yuv420p',str(dst)])
        parts.append(dst)
        print('Rendered '+shot['id'],flush=True)
    concat = edit/'concat.txt'
    concat.write_text(''.join("file '"+p.as_posix()+"'\n" for p in parts),encoding='utf-8')
    silent = edit/'silent.mp4'
    run([FF,'-y','-v','error','-f','concat','-safe','0','-i',str(concat),'-c','copy',str(silent)])
    font = 'Arial' if args.language=='en' else 'Malgun Gothic'
    ass = '[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\nWrapStyle: 2\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n'
    ass += f'Style: Caption,{font},42,&H00F4EEE7,&H00F4EEE7,&H70101C28,&H70101C28,-1,0,0,0,100,100,0,0,3,12,0,1,52,52,35,1\n'
    ass += '[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n'
    for shot in edl:
        if shot['id']=='title':continue
        # A clean corrected-result frame remains in the actual video for the
        # Steam thumbnail; the first part of the payoff has no added caption.
        start=shot['fromFrame']/FPS + (1.25 if shot['id']=='receipt-six' else 0)
        end=(shot['fromFrame']+shot['frames'])/FPS
        ass += f"Dialogue: 0,{stamp(start)},{stamp(end)},Caption,,0,0,0,,{shot[args.language]}\n"
    ass_path = edit/'type.ass'
    ass_path.write_text(ass,encoding='utf-8-sig')
    args.delivery.mkdir(parents=True,exist_ok=True)
    target = args.delivery/f'localhost-hero-gameplay-{args.language}-20261013.mp4'
    assert not target.exists(), 'Preserve existing delivery; use a new delivery directory'
    attribution = '"Realizer" Kevin MacLeod (incompetech.com)\nLicensed under Creative Commons: By Attribution 4.0 License\nhttps://creativecommons.org/licenses/by/4.0/\nSource: https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1900024\nChanges: 36-second excerpt from original music, fades, volume normalization and trailer mix. Original tempo and pitch retained.\n'
    (args.delivery/'ATTRIBUTION.txt').write_text(attribution,encoding='utf-8')
    audio_filter='atrim=start=0.046:duration=36,asetpts=PTS-STARTPTS,afade=t=in:d=0.12,afade=t=out:st=34.7:d=1.3,loudnorm=I=-16:TP=-1.8:LRA=9,aresample=48000'
    run([FF,'-y','-v','error','-threads','2','-filter_complex_threads','1','-i',str(silent),'-i',str(args.audio),'-filter_complex',f'[0:v]ass=type.ass[v];[1:a]{audio_filter}[a]','-map','[v]','-map','[a]','-c:v','libx264','-threads','2','-preset','fast','-b:v','8M','-minrate','8M','-maxrate','8M','-bufsize','16M','-x264-params','nal-hrd=cbr:force-cfr=1','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart','-t','36',str(target)],cwd=edit)
    poster=args.delivery/f'localhost-hero-gameplay-{args.language}-poster-1920x1080.png'
    fixed=next(s for s in edl if s['id']=='receipt-six')
    poster_time=fixed['fromFrame']/FPS+0.65
    run([FF,'-y','-v','error','-ss',str(poster_time),'-i',str(target),'-frames:v','1',str(poster)])
    probe = json.loads(subprocess.check_output([PROBE,'-v','error','-show_streams','-show_format','-of','json',str(target)]))
    video=next(s for s in probe['streams'] if s['codec_type']=='video')
    audio=next(s for s in probe['streams'] if s['codec_type']=='audio')
    assert video['codec_name']=='h264' and audio['codec_name']=='aac'
    assert [video['width'],video['height']]==[1920,1080] and video['avg_frame_rate']=='30/1'
    assert int(video['nb_frames'])==1080 and abs(float(video['duration'])-36)<0.05
    assert abs(float(probe['format']['duration'])-36)<0.15
    (args.delivery/f'localhost-hero-gameplay-{args.language}-provenance.json').write_text(json.dumps({'title':'Localhost Hero','file':str(target),'sha256':sha(target),'actualUiLanguage':args.language,'sourceCapture':str(args.capture),'sourceVersion':evidence['version'],'sourceEvidenceSha256':sha(args.capture/'capture-evidence.json'),'edl':str(edit/'edl.json'),'edlSha256':sha(edit/'edl.json'),'inputDisclosure':evidence.get('inputMethod',evidence['capture']),'music':PLAN['music'],'attribution':attribution,'posterSource':{'video':str(target),'timeSeconds':poster_time,'sha256':sha(poster)},'metadata':probe,'humanVisualReview':'pending','humanListening':'not performed'},ensure_ascii=False,indent=2),encoding='utf-8')
    print(str(target),flush=True)

if __name__=='__main__':
    main()
