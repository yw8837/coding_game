"""Prepare original editorial SFX, clip metadata, cue grid and provenance."""
from pathlib import Path
from hashlib import sha256
import json, subprocess, wave, math, sys, runpy
import numpy as np
from scipy.signal import butter, sosfilt

ROOT=Path(__file__).resolve().parents[3]
if '--legacy' not in sys.argv:
    runpy.run_path(str(Path(__file__).with_name('prepare_bright.py')), run_name='__main__')
    raise SystemExit(0)
OUT=ROOT/'output/trailer-rebuild/audio'
RATE=48000
rng=np.random.default_rng(20261009)

def write(name, samples):
    samples=np.asarray(samples)
    samples=samples/(np.max(np.abs(samples))+1e-9)*.3981
    stereo=np.stack([samples,samples],axis=1)
    pcm=np.clip(stereo*32767,-32768,32767).astype('<i2')
    with wave.open(str(OUT/name),'wb') as f:
        f.setnchannels(2);f.setsampwidth(2);f.setframerate(RATE);f.writeframes(pcm.tobytes())
    return {'file':name,'duration':len(samples)/RATE,'peakDbfs':-8,
            'origin':'Original deterministic mathematical synthesis; no samples, API, or game recordings',
            'purpose':'Editorial overlay, not a claim of recorded game sound'}

t=np.arange(int(RATE*.085))/RATE
noise=sosfilt(butter(2,[900,5000],btype='bandpass',fs=RATE,output='sos'),rng.normal(size=len(t)))
click=write('editorial-click.wav',noise*np.exp(-t*85)*(1-np.exp(-t*1300)))
t=np.arange(int(RATE*.33))/RATE
noise=sosfilt(butter(2,1800,fs=RATE,output='sos'),rng.normal(size=len(t)))
phase=2*np.pi*(55*t+35*(1-np.exp(-t*25))/25)
impact=write('editorial-impact.wav',(.55*np.sin(phase)*np.exp(-t*17)+noise*np.exp(-t*38))*(1-np.exp(-t*1800)))
t=np.arange(int(RATE*.5))/RATE
success=np.zeros_like(t)
for frequency,delay,weight in [(523.251,0,1),(659.255,.045,.8),(783.991,.09,.7),(1046.502,.12,.35)]:
    u=np.maximum(t-delay,0);mask=t>=delay
    timbre=sum(np.sin(2*np.pi*frequency*h*u)/h**2 for h in range(1,5))
    success+=weight*timbre*np.exp(-u*11)*(1-np.exp(-u*900))*mask
confirm=write('editorial-success.wav',success)

source=OUT/'Exit the Premises.mp3';clip=OUT/'exit-the-premises-30s.wav'
probe=json.loads(subprocess.run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(clip)],check=True,capture_output=True).stdout)
measure=subprocess.run(['ffmpeg','-hide_banner','-nostdin','-threads','1','-filter_threads','1','-i',str(clip),'-af','loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json','-f','null','-'],check=True,capture_output=True,text=True).stderr
loudness=json.loads(measure[measure.rfind('{'):measure.rfind('}')+1])
grid={'bpm':128,'beatSeconds':60/128,'barSeconds':1.875,'sourceOffsetSeconds':.033,
      'phaseConfidence':'Estimated by positive low-frequency RMS attack fit; musical downbeat not independently confirmed',
      'durationSeconds':30,'beats':64,'bars':16,'fps':30,
      'barCuts':[{'bar':i,'idealSeconds':i*1.875,'frame':math.floor(i*1.875*30+.5),'quantizedSeconds':math.floor(i*1.875*30+.5)/30} for i in range(17)],
      'editorialSuggestions':{'microbreak':{'start':7.3,'end':7.5,'note':'Main may dip music nearly silent before actual reward/open success; no dip baked into WAV'},
        'mainEnergyRiseSeconds':7.5,'finalSting':'Optional editorial-success on final publish/title; assess tonality by listening and leave room for decay'},
      'unmodifiedExcerpt':True,'note':'PCM decode and trim only. No retiming, synthesis, normalization, fade, or montage edits to music.'}
credit='"Exit the Premises" Kevin MacLeod (incompetech.com)\nLicensed under Creative Commons: By Attribution 4.0 License\nhttps://creativecommons.org/licenses/by/4.0/\nSource: https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1500029\nChanges: excerpt trimmed and mixed for the CODE:SHIFT trailer.\n'
(OUT/'ATTRIBUTION.txt').write_text(credit,encoding='utf-8')
(OUT/'beat-grid.json').write_text(json.dumps(grid,indent=2),encoding='utf-8')
assets=[]
for file in sorted(OUT.iterdir()):
    if file.is_file() and file.suffix.lower() in ['.mp3','.wav','.html','.json','.txt']:
        assets.append({'file':file.name,'bytes':file.stat().st_size,'sha256':sha256(file.read_bytes()).hexdigest()})
report={'date':'2026-10-09','chosen':'Exit the Premises','composer':'Kevin MacLeod',
        'license':'CC BY 4.0','officialSource':'https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1500029',
        'downloadSource':'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Exit%20the%20Premises.mp3',
        'licenseProof':'Current official page template renders the title + Kevin MacLeod + CC BY4 attribution; official pieces.json supplies ISRC/title/file/128 BPM; FAQ confirms attribution format; official CC deed/legalcode saved.',
        'alternative':{'title':'EDM Detection Mode','reasonNotFirstChoice':'Also 128 BPM and heavy bass, but first full energy rise is near15s; Exit has a quicker7.5s rise better matched to the payoff timeline.'},
        'clip':{'file':clip.name,'duration':30,'sourceStart':.033,'sampleRate':48000,'channels':2,'codec':'PCM signed16bit'},
        'encodedClipMeasuredLoudness':loudness,'normalizationApplied':False,
        'sfx':[click,impact,confirm],
        'listening':'Ten-second source excerpt emitted as a tool audio item; no human headphone/speaker listening or perceptual quality approval performed.',
        'paidGeneration':'Not used; no paid service or credential needed for this licensed-file workflow.',
        'assets':assets}
(OUT/'soundtrack-provenance.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({'chosen':report['chosen'],'clip':report['clip'],'loudness':loudness,'sfx':report['sfx']},indent=2))
