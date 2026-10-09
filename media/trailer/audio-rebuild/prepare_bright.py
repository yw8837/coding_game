"""Prepare bright CC-BY soundtrack at the existing 128-BPM edit grid."""
from pathlib import Path
import json, subprocess, math
from hashlib import sha256

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'output/trailer-rebuild/audio'
source=OUT/'Realizer.mp3'
clip=OUT/'realizer-bright-30s-128bpm.wav'
start=.046
ratio=128/125
subprocess.run(['ffmpeg','-y','-v','error','-nostdin','-threads','1','-filter_threads','1',
                '-ss',str(start),'-i',str(source),'-af',f'atempo={ratio}',
                '-t','30','-ar','48000','-ac','2','-c:a','pcm_s16le',str(clip)],check=True)
probe=json.loads(subprocess.run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(clip)],check=True,capture_output=True).stdout)
assert abs(float(probe['format']['duration'])-30)<.0001
measure=subprocess.run(['ffmpeg','-hide_banner','-nostdin','-threads','1','-filter_threads','1','-i',str(clip),'-af','loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json','-f','null','-'],check=True,capture_output=True,text=True).stderr
loudness=json.loads(measure[measure.rfind('{'):measure.rfind('}')+1])
catalogue=json.loads((OUT/'official-catalogue.json').read_text('utf-8'))
track=next(p for p in catalogue if p['isrc']=='USUAN1900024')
credit='"Realizer" Kevin MacLeod (incompetech.com)\nLicensed under Creative Commons: By Attribution 4.0 License\nhttps://creativecommons.org/licenses/by/4.0/\nSource: https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1900024\nChanges: excerpt trimmed, tempo adjusted from 125 to 128 BPM (+2.4%, pitch preserved), and mixed for the CODE:SHIFT trailer.\n'
(OUT/'ATTRIBUTION.txt').write_text(credit,encoding='utf-8')
grid={'track':'Realizer','sourceBpm':125,'editBpm':128,'tempoFactor':ratio,
      'tempoMethod':'FFmpeg atempo; +2.4% speed, pitch preserved',
      'sourceOffsetSeconds':start,'sourceSpanSeconds':30*ratio,'beatSeconds':.46875,
      'barSeconds':1.875,'durationSeconds':30,'beats':64,'bars':16,'fps':30,
      'phaseConfidence':'Estimated low-frequency onset phase; musical downbeat not independently confirmed',
      'barCuts':[{'bar':i,'idealSeconds':i*1.875,'frame':math.floor(i*1.875*30+.5),'quantizedSeconds':math.floor(i*1.875*30+.5)/30} for i in range(17)],
      'editorialSuggestions':{'microbreak':{'start':7.3,'end':7.5,'note':'Main may dip music before actual game success; not baked into WAV'},
          'ending':'Music is ongoing at cut; main shapes publish/title ending using fade and/or editorial cue.'}}
(OUT/'beat-grid.json').write_text(json.dumps(grid,indent=2),encoding='utf-8')
files=['Realizer.mp3',clip.name,'Nonstop.mp3','USUAN1900024-source.html','USUAN1600042-source.html',
       'official-catalogue.json','official-faq.html','CC-BY-4.0-deed.html','CC-BY-4.0-legalcode.html',
       'acquisition-bright.json','audio-analysis-bright.json','ATTRIBUTION.txt','beat-grid.json']
assets=[{'file':name,'bytes':(OUT/name).stat().st_size,'sha256':sha256((OUT/name).read_bytes()).hexdigest()} for name in files]
report={'date':'2026-10-09','selected':'Realizer','composer':'Kevin MacLeod','license':'CC BY 4.0',
        'officialSource':'https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1900024',
        'downloadSource':'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Realizer.mp3',
        'officialMetadata':track,
        'selectionReason':'Official Grooving/Bright/Driving tags and synths+drums, with steady rhythmic energy from first bar. Replaces previous Driving/Intense track after brighter user steering.',
        'subjectiveLimit':'Official tags and waveform analysis support direction, not proof of listener taste or subjective brightness; no human listening approval.',
        'rejectedEarlier':'Exit the Premises: official Driving/Intense tags risk an unnecessarily tense/heavy tone; previous files are not selected.',
        'alternative':'Nonstop: exact128 BPM, Driving/Grooving/Uplifting, guitar/percussion/synths; acquired official original, not selected.',
        'clip':{'file':clip.name,'duration':30,'sourceStart':start,'sourceSecondsConsumed':30*ratio,
                'sampleRate':48000,'channels':2,'codec':'PCM signed16bit','tempoSource':125,'tempoOutput':128,'tempoFactor':ratio,
                'processing':['decode','trim','atempo1.024 preserving pitch','PCM encode'],'normalizationApplied':False},
        'measuredClipLoudness':loudness,'licenseEvidence':'Official catalogue entry plus current source page CC-BY4 attribution template, FAQ, CC deed/legalcode saved locally',
        'paidApiUsed':False,'downloadsExecuted':False,'listening':'Not subjectively approved; no human headphones/speakers',
        'assets':assets}
previous=OUT/'soundtrack-provenance.json'
if previous.exists() and not (OUT/'soundtrack-provenance-exit-rejected.json').exists():
    (OUT/'soundtrack-provenance-exit-rejected.json').write_bytes(previous.read_bytes())
previous.write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({'selected':'Realizer','file':clip.name,'duration':30,'sourceBpm':125,'editBpm':128,'factor':ratio,'measured':loudness,'sha256':sha256(clip.read_bytes()).hexdigest()},indent=2))
