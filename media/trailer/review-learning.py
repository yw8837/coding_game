"""Decode 0.10 trailer contact sheets and collect local delivery evidence."""
from pathlib import Path
import hashlib
import importlib.util
import json
import subprocess
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'output/trailer-0.10'
spec=importlib.util.spec_from_file_location('renderer',Path(__file__).with_name('render.py'))
renderer=importlib.util.module_from_spec(spec);spec.loader.exec_module(renderer)
FFMPEG=renderer.media_binary('ffmpeg',None)
def frame(video,seconds,path,width=480,height=270):
 subprocess.run([FFMPEG,'-y','-v','error','-threads','2','-filter_threads','1','-ss',str(seconds),'-i',str(video),'-frames:v','1','-vf',f'scale={width}:{height}','-update','1',str(path)],check=True,capture_output=True,timeout=30)
def sheet(samples,name,columns=4):
 canvas=Image.new('RGB',(columns*480,((len(samples)+columns-1)//columns)*296),'#101923');draw=ImageDraw.Draw(canvas)
 for index,(path,label) in enumerate(samples):
  x=index%columns*480;y=index//columns*296;canvas.paste(Image.open(path).convert('RGB'),(x,y));draw.text((x+8,y+276),label,fill='#ddd7cc')
 canvas.save(OUT/name)
def main():
 edl=json.loads((OUT/'edl-used.json').read_text(encoding='utf-8'));work=OUT/'review-frames';work.mkdir(exist_ok=True)
 midpoints=[];boundaries=[];cursor=0
 for index,shot in enumerate(edl['shots']):
  midpoint=cursor+shot['duration']/2;path=work/f'{index:02}-mid.png';frame(OUT/'codeshift-ko.mp4',midpoint,path);midpoints.append((path,f'{midpoint:05.2f}s {shot["id"]}'))
  if index:
   for delta in [-.15,.15]:
    path=work/f'{index:02}-boundary-{delta:+.2f}.png';frame(OUT/'codeshift-ko.mp4',cursor+delta,path);boundaries.append((path,f'{cursor+delta:05.2f}s cut {index}'))
  cursor+=shot['duration']
 sheet(midpoints,'contact-sheet.png');sheet(boundaries,'cut-boundaries.png')
 frame(OUT/'codeshift-ja.mp4',18,OUT/'japanese-sample.png',1920,1080)
 frame(OUT/'codeshift-ko-vertical.mp4',28,OUT/'vertical-sample.png',1080,1920)
 screenshots=[]
 for path in sorted((OUT/'screenshots').glob('*.png')):
  size=Image.open(path).size;assert size==(1920,1080),(path,size)
  screenshots.append({'file':str(path.relative_to(OUT)),'width':size[0],'height':size[1],'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
 for lang in ['ko','en','ja']:
  captions=[];start=0
  for shot in edl['shots']:
   end=start+shot['duration'];captions.append({'text':shot['caption'][lang],'startMs':round(start*1000),'endMs':round(end*1000),'timestampMs':None,'confidence':None});start=end
  (OUT/f'captions.{lang}.json').write_text(json.dumps(captions,ensure_ascii=False,indent=2),encoding='utf-8')
 report={'screenshots':screenshots,'reviewArtifacts':['contact-sheet.png','cut-boundaries.png','japanese-sample.png','vertical-sample.png'],'originalUiLanguage':'ko','localizedOverlays':['ko','en','ja'],'music':'Reused 0.9 original mathematical pulse; no downloaded samples','fonts':'Malgun Gothic / Yu Gothic from local Windows fonts; not redistributed','footage':'Fresh cafe UI + visible import of UI-earned legacy career save + new capstone completed on camera','publication':'Not uploaded; no Steam availability or final-title claim','humanListening':'Not performed; measured loudness/full decode in verification.json','visualReview':'Pending model inspection of review artifacts'}
 (OUT/'review-evidence.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'screenshots':len(screenshots),'duration':cursor,'contactSamples':len(midpoints),'boundarySamples':len(boundaries)}))
if __name__=='__main__':main()
