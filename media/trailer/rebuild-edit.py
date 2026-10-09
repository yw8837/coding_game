"""30s first-release trailer. Actual gameplay, beat cuts, animated large type.

Serial FFmpeg jobs only. No generated gameplay, state injection or paid service.
The EDL is written separately so every source range/crop/caption is reviewable.
"""
from __future__ import annotations
import argparse, hashlib, json, math, re, shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from render import media_binary, run, probe, timestamp

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'output/trailer-rebuild'
EDIT=OUT/'edit'
FINAL=OUT/'final'
FPS=30
FF=media_binary('ffmpeg',None)
FP=media_binary('ffprobe',None)
CREAM='0xf5f0e4'
INK='172c35'
COLORS={'ink':'352c17','blue':'c87922','red':'4965d9','green':'65832a','gold':'328cad'}

def caption(ko,en,ja):return {'ko':ko,'en':en,'ja':ja}

def make_edl():
    # 128 BPM. Each bar is1.875s; round cumulative boundaries, never clip lengths.
    data=[
      ('wrong',0,1.5,12.96,14.95,'split',[374,255,340,354],caption('카페 계산대가 / 고장 났다.','THE CAFE TILL / IS BROKEN.','カフェのレジが / 壊れた。'),'red',caption('한 잔 4,500원 × 3잔','₩4,500 each × 3 coffees','1杯4,500ウォン × 3杯')),
      ('desktop',1.5,2,1.84,3.30,'wide',[0,0,1600,900],caption('첫 출근. 첫 의뢰.','FIRST DAY. FIRST JOB.','初出勤。最初の依頼。'),'blue',caption('내 컴퓨터. 내 작업실.','Your computer. Your workspace.','自分のPC。自分の作業場。')),
      ('code',2,3,15.40,16.02,'code',[178,300,620,174],caption('한 글자 / 바꾸면.','CHANGE / ONE CHARACTER.','1文字を / 変えると。'),'blue',caption('+ → *  ·  직접 고치는 실제 코드','+ → *  ·  Real code. Your edit.','+ → *  ·  自分で直す本物のコード')),
      ('fixed',3,4,22.75,23.58,'split',[374,255,340,354],caption('세 잔, / 13,500원.','THREE COFFEES. / ₩13,500.','3杯で / 13,500ウォン。'),'green',caption('이제 계산이 맞는다.','Now the numbers add up.','今度は計算が合っている。')),
      ('latte',4,4.5,18.67,19.60,'split',[374,255,340,409],caption('라테도 / 정확하게.','LATTES? / CHECK.','ラテも / ぴったり。'),'green',caption('다른 주문도 직접 확인','Try it on a different order','別の注文でも確かめる')),
      ('order',4.5,5,29.56,31.20,'wide',[305,260,995,310],caption('주문 들어왔습니다!','ORDER IN!','注文が入りました！'),'green',caption('내가 연결한 주문함으로.','Into the inbox you connected.','自分がつないだ注文箱へ。')),
      ('reward',5,6,31.75,33.42,'split',[560,142,480,616],caption('의뢰 완료. / +750 cr','JOB COMPLETE. / +750 cr','依頼完了。 / +750 cr'),'gold',caption('이번 주문함 의뢰의 보상','Reward for the order-inbox job','注文箱の依頼で獲得した報酬')),
      ('open',6,7,33.88,36.28,'hero',[440,372,794,447],caption('내 코드로, OPEN.','YOUR CODE. GRAND OPENING.','自分のコードで、OPEN。'),'green',caption('세 의뢰를 해결한 카페의 첫날','Three jobs done. The cafe opens.','3つの依頼を終えて、カフェ開店。')),
      ('monitor',7,7.5,37.31,38.86,'wide',[245,260,1330,510],caption('벌었으면,','EARN IT.','稼いだら、'),'gold',caption('보조 모니터 · 600 cr','Second monitor · 600 cr','サブモニター · 600 cr')),
      ('theme',7.5,8,39.35,40.70,'wide',[35,407,1530,349],caption('써야지.','SPEND IT.','使おう。'),'gold',caption('오피스텔 배경 · 180 cr','Officetel wallpaper · 180 cr','ワンルームの壁紙 · 180 cr')),
      ('workspace',8,9,40.98,42.44,'wide',[0,0,1600,900],caption('내 취향으로, 레벨 업.','MAKE IT YOURS.','自分好みに、レベルアップ。'),'gold',caption('장비를 사고 작업실을 꾸미자.','Buy tools. Personalize your desktop.','道具を買って、作業場を飾ろう。')),
      ('map',9,10,43.48,45.36,'hero',[330,328,1120,540],caption('이번엔, 동네 전체.','NEXT UP: THE NEIGHBORHOOD.','次は、街全体へ。'),'blue',caption('카페에서 시작해, 더 큰 의뢰로.','From one cafe to bigger jobs.','カフェから始めて、もっと大きな依頼へ。')),
      ('reply',10,11,47.90,49.68,'wide',[260,462,1270,330],caption('고쳐주면, 답장이 온다.','FIX IT. HEAR BACK.','直したら、返事が届く。'),'green',caption('코드 너머에는 사람이 있다.','There is someone behind every job.','コードの向こうに、人がいる。')),
      ('places',11,12,51.65,52.80,'split',[730,140,360,400],caption('이젠, 내 서비스. / 동네ON','NOW, YOUR OWN APP. / NEIGHBORHOOD ON','今度は自分のアプリ。 / 街をつなぐ'),'blue',caption('장소를 모으고.','Bring local places together.','街のスポットを集める。')),
      ('inquiry',12,13,52.85,54.24,'split',[730,140,360,400],caption('문의도 / 받게 만들고.','MAKE IT / TAKE REQUESTS.','問い合わせも / 受け付ける。'),'blue',caption('직접 이름 붙인 동네 생활 웹앱','A local-life web app you name yourself','自分で名付けた街の生活Webアプリ')),
      ('release',13,14,54.70,57.24,'wide',[334,132,1150,650],caption('버전 1.0. 출시 완료.','VERSION 1.0. SHIPPED.','バージョン1.0。リリース完了。'),'green',caption('게임 속 내 웹앱의 첫 출시','Your first web-app release in the game','ゲームの中で、自分のWebアプリを初リリース')),
      ('end',14,16,0,0,'end',None,caption('만들었다. / 내 첫 출시.','YOU MADE IT. / YOUR FIRST RELEASE.','できた。 / はじめてのリリース。'),'blue',caption('코딩을 몰라도, 첫 의뢰부터.','New to code? Start with your first job.','コードを知らなくても、最初の依頼から。')),
    ]
    shots=[]
    for ident,b0,b1,s,e,layout,crop,copy,color,detail in data:
      a=math.floor(b0*1.875*30+.5);b=math.floor(b1*1.875*30+.5)
      shots.append(dict(id=ident,fromFrame=a,frames=b-a,start=s,end=e,layout=layout,crop=crop,copy=copy,color=color,detail=detail))
    main_capture=json.loads((OUT/'capture-evidence.json').read_text(encoding='utf-8'))
    ids={'wrong':'wrong-total','fixed':'fixed-three','latte':'correct-total','order':'order-arrives','reward':'cafe-reward','open':'cafe-open','monitor':'buy-monitor','map':'neighborhood','reply':'client-reply','release':'release'}
    insert=json.loads((OUT/'insert/evidence.json').read_text(encoding='utf-8'))
    for s in shots:
      if s['id'] in ids:
        take=next(item for item in main_capture['shots'] if item['id']==ids[s['id']])
        s.update(start=take['start'],end=take['end'])
        if s['id']=='open':s['start']+=.22
        if s['id'] in ('wrong','fixed','latte','order','reward','open'):
          box=take['focus'];s['crop']=[math.floor(box['x']),math.floor(box['y']),math.floor(box['width']),math.floor(box['height'])]
        if s['id']=='fixed':s['crop']=[374,415,340,281]
      if s['id'] in ('places','inquiry'):
        take=next(item for item in insert['shots'] if item['id']==s['id']);s.update(start=take['start'],end=take['end'],source='insert/raw.webm',crop=[856,280,360,474])
      if s['id']=='code' and (OUT/'code-insert/evidence.json').is_file():
        take=json.loads((OUT/'code-insert/evidence.json').read_text(encoding='utf-8'))['shots'][0]
        s.update(start=take['start'],end=take['end'],source='code-insert/raw.webm',crop=[180,206,610,155])
        if take.get('crop'):s['crop']=take['crop']
      if s['id'] in ('desktop','theme','workspace'):
        take=next(item for item in json.loads((OUT/'wallpaper/evidence.json').read_text(encoding='utf-8'))['shots'] if item['id']==s['id'])
        s.update(start=take['start'],end=take['end'],source='wallpaper/raw.webm')
        if s['id']=='theme':
          box=take['focus'];s['crop']=[math.floor(box['x']),math.floor(box['y']),math.floor(box['width']),math.floor(box['height'])]
      # Portrait reframes keep the actual result legible, without stretching UI.
      portrait={'monitor':[240,330,620,430],
                'reply':[240,480,650,258],'release':[1016,140,380,638],
                'map':[490,328,650,540]}
      if s['id'] in portrait:s['portraitCrop']=portrait[s['id']]
    return {'fps':FPS,'bpm':128,'frames':900,'source':'../../output/trailer-rebuild/raw.webm','capture':'UI-driven Korean gameplay; localized editorial typography; chapter jumps; speed changes; editorial SFX','shots':shots}

def render_shots(edl,vertical):
    fmt='vertical' if vertical else 'landscape';folder=EDIT/fmt;folder.mkdir(parents=True,exist_ok=True)
    w,h=(1080,1920) if vertical else (1920,1080)
    paths=[];source_hashes={}
    for s in edl['shots']:
      dst=folder/(s['id']+'.mp4');paths.append(dst)
      source=OUT/s.get('source','raw.webm')
      if source not in source_hashes:source_hashes[source]=hashlib.sha256(source.read_bytes()).hexdigest()
      layout_version='layout-v6' if s['layout']=='hero' and not vertical else 'layout-v5'
      signature=hashlib.sha256(json.dumps([s,vertical,layout_version,source_hashes[source]]).encode()).hexdigest()
      sig=dst.with_suffix('.sha256')
      if dst.exists() and sig.exists() and sig.read_text()==signature:continue
      duration=s['frames']/FPS
      base=[FF,'-y','-v','error','-threads','4','-filter_complex_threads','1']
      if s['layout']=='end':
        args=['-f','lavfi','-i',f'color=c={CREAM}:s={w}x{h}:r=30:d={duration}']
      else:
        if vertical:
          if s['layout']=='split':vx,vy,vw,vh=80,670,920,1040
          elif s['layout']=='code':vx,vy,vw,vh=50,730,980,620
          else:vx,vy,vw,vh=40,660,1000,1020
        elif s['layout']=='hero':vx,vy,vw,vh=0,300,1920,780
        elif s['layout']=='split':vx,vy,vw,vh=1050,144,790,792
        elif s['layout']=='code':vx,vy,vw,vh=790,355,1080,400
        else:vx,vy,vw,vh=60,280,1800,710
        x,y,cw,ch=s.get('portraitCrop',s['crop']) if vertical else s['crop'];assert x>=0 and y>=0 and x+cw<=1600 and y+ch<=900
        speed=(s['end']-s['start'])/duration
        # Contain the full selected evidence rectangle. Subtle2% punch-ins stay
        # inside preselected safe margins; no stretching or fake screen content.
        fw=min(vw/cw,vh/ch);sw=int(cw*fw)//2*2;sh=int(ch*fw)//2*2
        zoom=f"zoompan=z='1+0.018*on/{s['frames']}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s={sw}x{sh}:fps=30"
        filt=(f'[0:v]trim=duration={s["end"]-s["start"]:.6f},setpts=(PTS-STARTPTS)/{speed:.8f},fps=30,'
              f'crop={cw}:{ch}:{x}:{y},scale={sw}:{sh}:flags=lanczos,{zoom},'
              f'tpad=stop_mode=clone:stop_duration=1,trim=end_frame={s["frames"]},'
              f'pad={w}:{h}:{vx+(vw-sw)//2}:{vy+(vh-sh)//2}:color={CREAM},setsar=1[v]')
        args=['-ss',str(s['start']),'-i',str(source),'-filter_complex',filt,'-map','[v]']
      run(base+args+['-frames:v',str(s['frames']),'-an','-c:v','libx264','-threads','4','-preset','fast','-crf','18','-pix_fmt','yuv420p',str(dst)],cwd=ROOT,timeout=180)
      sig.write_text(signature)
    concat=folder/'concat.txt';concat.write_text(''.join("file '"+p.as_posix()+"'\n" for p in paths),encoding='utf-8')
    master=folder/'silent.mp4'
    run([FF,'-y','-v','error','-f','concat','-safe','0','-i',str(concat),'-c','copy',str(master)],cwd=ROOT)
    return master

def font(lang):return 'Yu Gothic' if lang=='ja' else 'Malgun Gothic' if lang=='ko' else 'Arial'
def font_path(lang):return 'C:/Windows/Fonts/YuGothB.ttc' if lang=='ja' else 'C:/Windows/Fonts/malgunbd.ttf' if lang=='ko' else 'C:/Windows/Fonts/arialbd.ttf'
def textsize(text,size,maxw,lang):
    # Measure actual glyphs instead of trusting character-count heuristics.
    while ImageFont.truetype(font_path(lang),size).getlength(text)>maxw:size-=2
    return size
def ass(edl,lang,vertical):
    w,h=(1080,1920) if vertical else (1920,1080);out=EDIT/f'type-{lang}{"-vertical" if vertical else ""}.ass'
    lines=[f'''[Script Info]
ScriptType: v4.00+
PlayResX: {w}
PlayResY: {h}
WrapStyle: 2
ScaledBorderAndShadow: yes
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Type,{font(lang)},100,&H00352C17,&H00352C17,&H00E4F0F5,&H00E4F0F5,-1,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
''']
    def event(start,end,tags,text,layer=2):
      lines.append(f'Dialogue: {layer},{timestamp(start,ass=True)},{timestamp(end,ass=True)},Type,,0,0,0,,{{{tags}}}{text}\n')
    def txt(a,b,text,x,y,size,color='ink',delay=0,animate=True,maxw=None):
      if maxw:size=textsize(text,size,maxw,lang)
      measured=ImageFont.truetype(font_path(lang),size).getlength(text)
      # The whole entrance must fit, including translations much longer than KO.
      right_bound=min(w-60,x+maxw) if maxw else w-60
      dx=min(65,max(0,right_bound-x-measured));scale=min(112,100*(right_bound-x-dx)/max(1,measured))
      motion=rf'\move({x+dx:.1f},{y+12},{x},{y},0,160)\fscx{scale:.2f}\fscy{scale:.2f}\t(0,180,\fscx100\fscy100)' if animate else rf'\pos({x},{y})'
      event(a+delay,b,rf'\an7\fs{size}\c&H{COLORS[color]}&{motion}',text)
    def rect(a,b,x,y,rw,rh,color):
      event(a,b,rf'\an7\pos({x},{y})\p1\c&H{COLORS[color]}&',f'm 0 0 l {rw} 0 l {rw} {rh} l 0 {rh}',0)
    for s in edl['shots']:
      a=s['fromFrame']/FPS;b=a+s['frames']/FPS;c=s['color'];layout=s['layout']
      rect(a,b,60,90 if not vertical else 146,8,58,c)
      tag={'ko':'내 첫 출시','en':'MY FIRST RELEASE','ja':'はじめてのリリース'}[lang]
      txt(a,b,tag,88,93 if not vertical else 151,30,c,animate=False)
      copies=s['copy'][lang].split(' / ')
      if layout=='end':
        for i,t in enumerate(copies):txt(a,b,t,80,330+i*240 if not vertical else 470+i*215,184 if not vertical else 134,c if i else 'ink',delay=i*.24,maxw=w-160)
        txt(a+.58,b,s['detail'][lang],84,850 if not vertical else 1150,38,maxw=w-160)
        txt(a+.78,b,'CODE:SHIFT',84,936 if not vertical else 1390,58,'ink',maxw=w-160)
        label={'ko':'가제 · 지금 첫 의뢰를 시작해 보세요','en':'Working title · Play your first job','ja':'仮タイトル · 最初の依頼を始めよう'}[lang]
        txt(a+.78,b,label,530 if not vertical else 84,958 if not vertical else 1490,27,'ink',animate=False,maxw=w-(620 if not vertical else 170))
        txt(a+.78,b,'codeshift-lab.bsfire1237.chatgpt.site',84,1012 if not vertical else 1590,23,'blue',animate=False)
      elif layout in ('split','code'):
        x=80;y=320 if not vertical else 250;gap=170 if not vertical else 146;mx=900 if not vertical and layout=='split' else 690 if not vertical else 930
        for i,t in enumerate(copies):txt(a,b,t,x,y+i*gap,136 if not vertical else 112,c if i else 'ink',delay=i*.14,maxw=mx)
        if s['id']=='wrong':
          normal={'ko':'정상 13,500원','en':'EXPECTED  ₩13,500','ja':'正しい合計 13,500ウォン'}[lang]
          actual={'ko':'현재 4,503원  !','en':'ACTUAL  ₩4,503  !','ja':'今の表示 4,503ウォン  !'}[lang]
          txt(a+.14,b,normal,84,680 if not vertical else 520,46,'green',maxw=mx)
          txt(a+.25,b,actual,84,760 if not vertical else 590,46,'red',maxw=mx)
          txt(a,b,s['detail'][lang],84,878 if not vertical else 1760,32,'ink',animate=False,maxw=mx)
        else:txt(a+.12,b,s['detail'][lang],84,790 if not vertical else 1760,34,'ink',maxw=mx if not vertical else 930)
      else:
        txt(a,b,copies[0],80,156 if not vertical else 275,100 if not vertical else 106,c,maxw=w-160)
        if layout!='hero' or vertical:txt(a+.10,b,s['detail'][lang],84,1016 if not vertical else 1760,29,'ink',maxw=w-160)
      # Lightweight cut accent:12px line expands on the opening beat.
      event(a,min(b,a+.23),rf'\an7\pos(0,0)\p1\c&H{COLORS[c]}&\fscx3\t(0,180,\fscx100)',f'm 0 0 l {w} 0 l {w} 12 l 0 12',3)
    note={'ko':'실제 게임 화면 · 자동 조작·속도 편집','en':'Actual Korean gameplay · automated input · retimed','ja':'実際の韓国語版プレイ · 自動操作・速度編集'}[lang]
    txt(0,26.25,note,88,42 if not vertical else 86,20,animate=False,maxw=w-170)
    out.write_text(''.join(lines),encoding='utf-8-sig');return out

def mix_audio():
    music=OUT/'audio/realizer-bright-30s-128bpm.wav'
    if not music.exists():raise RuntimeError('Bright licensed soundtrack not ready')
    # Original editorial foley. No assertion that browser recording has game audio.
    assets=[music,OUT/'audio/editorial-click.wav',OUT/'audio/editorial-impact.wav',OUT/'audio/editorial-success.wav']
    args=[FF,'-y','-v','error'];filters=[]
    for p in assets:args+=['-i',str(p)]
    filters.append("[0:a]volume=0.63,volume=0.35:enable='between(t,7.30,7.49)',afade=t=in:d=0.025,afade=t=out:st=29.4:d=0.6[m]")
    hits={1:[1.875,2.8125,3.75,13.125,14.0625,22.5],2:[0,7.5,16.875,26.25],3:[5.625,9.375,11.25,24.375]}
    names=['[m]']
    for input_id,times in hits.items():
      filters.append(f'[{input_id}:a]asplit={len(times)}'+''.join(f'[s{input_id}_{i}]' for i in range(len(times))))
      for i,t in enumerate(times):
        label=f'e{input_id}_{i}';filters.append(f'[s{input_id}_{i}]volume=0.4,adelay={round(t*1000)}:all=1[{label}]');names.append(f'[{label}]')
    filters.append(''.join(names)+f'amix=inputs={len(names)}:normalize=0,atrim=duration=30,loudnorm=I=-16:TP=-1.8:LRA=9,aresample=48000[a]')
    dst=EDIT/'mix.wav';run(args+['-filter_complex',';'.join(filters),'-map','[a]','-c:a','pcm_s24le',str(dst)],cwd=ROOT)
    return dst

def render_final(edl,master,music,lang,vertical):
    subtitles=ass(edl,lang,vertical);name=f'codeshift-{lang}{"-vertical" if vertical else ""}.mp4';dst=FINAL/name
    # Relative filter path avoids Windows drive colon escaping.
    rel=subtitles.relative_to(EDIT).as_posix()
    credit=(OUT/'audio/ATTRIBUTION.txt').read_text(encoding='utf-8-sig').strip()
    (FINAL/'ATTRIBUTION.txt').write_text(credit+'\n',encoding='utf-8')
    run([FF,'-y','-v','error','-threads','4','-filter_threads','1','-i',str(master),'-i',str(music),'-vf',f"ass='{rel}'",'-map','0:v','-map','1:a','-t','30','-c:v','libx264','-threads','4','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','256k','-ar','48000','-metadata','title=CODE:SHIFT - My First Release','-metadata','comment='+credit,'-movflags','+faststart',str(dst)],cwd=EDIT,timeout=300)
    return dst

def verify(path,edl,vertical):
    info=probe(FP,path);v=next(s for s in info['streams'] if s['codec_type']=='video');a=next(s for s in info['streams'] if s['codec_type']=='audio')
    assert int(v['nb_frames'])==900 and v['r_frame_rate']=='30/1'
    assert [v['width'],v['height']]==([1080,1920] if vertical else [1920,1080])
    assert v['pix_fmt']=='yuv420p' and a['sample_rate']=='48000'
    assert v['codec_name']=='h264' and a['codec_name']=='aac' and a['channels']==2
    assert abs(float(info['format']['duration'])-30)<.04
    run([FF,'-v','error','-threads','4','-i',str(path),'-f','null','-'],cwd=ROOT,timeout=120)
    level=run([FF,'-v','info','-threads','2','-i',str(path),'-vn','-af','loudnorm=I=-16:TP=-1.5:LRA=9:print_format=json','-f','null','-'],cwd=ROOT,timeout=60)
    match=re.search(r'\{\s*"input_i"[\s\S]*?\}',level.stderr);loudness=json.loads(match.group())
    assert float(loudness['input_tp'])<=-1.0 and -18<float(loudness['input_i'])<-14
    report={'file':path.name,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'dimensions':[v['width'],v['height']],'frames':900,'fps':30,'duration':float(info['format']['duration']),'codec':[v['codec_name'],a['codec_name']],'fullDecode':'pass','encodedLoudness':loudness,'humanListening':'not performed'}
    (FINAL/(path.stem+'-qa.json')).write_text(json.dumps(report,indent=2),encoding='utf-8')
    thumbs=EDIT/'review'/path.stem;thumbs.mkdir(parents=True,exist_ok=True)
    tw,th=(270,480) if vertical else (480,270);cols=4;rows=math.ceil(len(edl['shots'])/cols)
    sheet=Image.new('RGB',(cols*tw,rows*(th+28)),'#f5f0e4');d=ImageDraw.Draw(sheet)
    for i,s in enumerate(edl['shots']):
      t=(s['fromFrame']+s['frames']*.65)/30;dst=thumbs/(s['id']+'.png')
      run([FF,'-y','-v','error','-ss',str(t),'-i',str(path),'-frames:v','1','-update','1',str(dst)],cwd=ROOT)
      im=Image.open(dst);im.thumbnail((tw,th));x=i%cols*tw;y=i//cols*(th+28);sheet.paste(im,(x,y+28));d.text((x+5,y+8),f'{t:.2f} {s["id"]}',fill='#172c35')
    sheet.save(EDIT/'review'/f'{path.stem}-contact.png')
    print(json.dumps(report),flush=True)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--lang',choices=['ko','en','ja','all'],default='ko');parser.add_argument('--vertical',action='store_true');parser.add_argument('--verify-only',action='store_true');args=parser.parse_args()
    EDIT.mkdir(parents=True,exist_ok=True);FINAL.mkdir(parents=True,exist_ok=True)
    edl=make_edl();(Path(__file__).with_name('edl-first-release.json')).write_text(json.dumps(edl,ensure_ascii=False,indent=2),encoding='utf-8')
    langs=['ko','en','ja'] if args.lang=='all' else [args.lang]
    if not args.verify_only:master=render_shots(edl,args.vertical);music=mix_audio()
    for lang in langs:
      target=FINAL/f'codeshift-{lang}{"-vertical" if args.vertical else ""}.mp4'
      if not args.verify_only:render_final(edl,master,music,lang,args.vertical)
      verify(target,edl,args.vertical)

if __name__=='__main__':main()
