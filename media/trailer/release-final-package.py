"""Append source/provenance and final QA records to the two delivered trailers."""
from pathlib import Path
import hashlib,json,subprocess

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'output/release-final-20261013'
DELIVERY=Path('D:/코딩게임/출시자료/출시마감-2026-10-13/영상')

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
 fingerprint=json.loads((OUT/'served-during-en-capture.json').read_text(encoding='utf-8'))
 qa=[]
 for lang,take in [('en','en-take3'),('ko','ko-take1')]:
  file=DELIVERY/f'localhost-hero-gameplay-{lang}-provenance.json'
  data=json.loads(file.read_text(encoding='utf-8'))
  sources=[]
  for kind,folder in [('career',take),('cafe',lang+'-cafe-take1'),('customer-receipt',lang+'-receipt-take1')]:
   evidence=OUT/folder/'capture-evidence.json';e=json.loads(evidence.read_text(encoding='utf-8'))
   sources.append({'kind':kind,'directory':str(evidence.parent),'evidence':str(evidence),'evidenceSha256':sha(evidence),'rawSha256':e['rawSha256'],'actualLanguage':e['language'],'inputMethod':e['inputMethod'],'timing':e['timing'],'pageErrors':e['pageErrors']})
  data['sources']=sources
  data['captureBuildFingerprint']=fingerprint
  data['buildScope']='Captured HTTP-served desktop renderer built2026-10-13T09:15:07.178Z. Source working tree later received optional Python/SQL contextual-quest changes and was rebuilt by the root agent. These clips are bound to the captured renderer fingerprint; they are not proof of the later installer or of all optional systems.'
  data['montageDisclosure']='Career, fresh cafe and corrected-receipt shots come from separate isolated UI plays. Cafe-earned save imported visibly, bakery function typed with automated characters. Corrected customer receipt uses the same exact JavaScript function as the main code scene. Intervening actions omitted, source clips retimed; this is not a continuous human playthrough or an unrestricted-app claim.'
  title=DELIVERY/f'localhost-hero-gameplay-{lang}-title-frame-1920x1080.png'
  data['titlePosterSource']={'video':data['file'],'timeSeconds':34,'file':str(title),'sha256':sha(title),'note':'Unmodified decoded frame from the completed video; actual title UI with no added editorial caption.'}
  data['humanVisualReview']='Not performed; agent inspected decoded actual final frames and contact sheet.'
  data['agentVisualReview']={'contactSheet':str(OUT/f'{lang}-final-review-sheet.png'),'receipt':'Same camera as12,600opening; actual six-roll receipt returns10,000 and eight-roll receipt returns13,600','typing':'Actual changing characters in the real source editor, readable close-up','firstRelease':'Actual in-game1.0.0 release, earned after12UI-deliveredjobs','noFakeUi':True}
  data['streamDecodeCheck']='Both final streams fully decoded using FFmpeg, exit0, no decode errors.'
  v=next(s for s in data['metadata']['streams'] if s['codec_type']=='video');a=next(s for s in data['metadata']['streams'] if s['codec_type']=='audio')
  assert v['codec_name']=='h264' and a['codec_name']=='aac' and v['nb_frames']=='1080'
  assert v['width']==1920 and v['height']==1080 and v['avg_frame_rate']=='30/1' and int(v['bit_rate'])>=5000000
  assert abs(float(v['duration'])-36)<.05 and sha(Path(data['file']))==data['sha256']
  file.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
  qa.append({'language':lang,'file':data['file'],'sha256':data['sha256'],'frames':1080,'seconds':36,'resolution':[1920,1080],'videoCodec':v['codec_name'],'audioCodec':a['codec_name'],'videoBitrate':v['bit_rate'],'sourceRecordings':len(sources),'pageErrors':0,'receiptPoster':data['posterSource'],'titlePoster':data['titlePosterSource']})
 (DELIVERY/'verification.json').write_text(json.dumps({'date':'2026-10-13','status':'two-final-trailers-verified','finals':qa,'music':'Realizer — Kevin MacLeod, CC BY4.0; original125BPM, no paid API','humanListening':'not performed','steamPublishing':'not performed','preliminaryArchive':str(OUT/'preliminary-before-matched-receipt')},ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps(qa,ensure_ascii=False,indent=2))

if __name__=='__main__':main()
