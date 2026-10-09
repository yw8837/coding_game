"""Export an actual-frame poster and early-motion proof frames after final render."""
from pathlib import Path
import json
from PIL import Image,ImageDraw
from render import media_binary,run
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'output/trailer-rebuild'
proof=OUT/'edit/review/entrances';proof.mkdir(parents=True,exist_ok=True)
ff=media_binary('ffmpeg',None)
shots=json.loads((Path(__file__).with_name('edl-first-release.json')).read_text(encoding='utf-8'))['shots']
for lang in ['ko','en','ja']:
 sheet=Image.new('RGB',(1920,4*298),'#f5f0e4');d=ImageDraw.Draw(sheet)
 for row,name in enumerate(['code','fixed','open','end']):
  shot=next(s for s in shots if s['id']==name)
  for col,offset in enumerate([1/30,.10,.18,.5]):
   t=shot['fromFrame']/30+offset;dst=proof/f'{lang}-{name}-{col}.png'
   run([ff,'-y','-v','error','-threads','2','-ss',str(t),'-i',str(OUT/'final'/f'codeshift-{lang}.mp4'),'-frames:v','1','-update','1',str(dst)],cwd=ROOT)
   im=Image.open(dst);im.thumbnail((480,270));x=col*480;y=row*298;sheet.paste(im,(x,y+28));d.text((x+6,y+8),f'{name} +{offset:.3f}s',fill='#172c35')
 sheet.save(proof/f'{lang}-motion.png')
run([ff,'-y','-v','error','-ss','12.45','-i',str(OUT/'final/codeshift-ko.mp4'),'-frames:v','1','-q:v','2','-update','1',str(ROOT/'public/media/first-release-poster.jpg')],cwd=ROOT)
print('Poster exported from actual trailer; early-motion proof sheets ready.')
