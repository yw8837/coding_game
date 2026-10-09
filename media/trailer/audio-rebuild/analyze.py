from pathlib import Path
import subprocess, json, hashlib, sys
import numpy as np
from scipy.signal import butter, sosfilt, find_peaks

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'output/trailer-rebuild/audio'
def run(*args):
    return subprocess.run(args,check=True,capture_output=True).stdout
report=[]
bright='--legacy' not in sys.argv
for title in (['Realizer','Nonstop'] if bright else ['Exit the Premises','EDM Detection Mode']):
    source=OUT/(title+'.mp3')
    data=np.frombuffer(run('ffmpeg','-v','error','-nostdin','-threads','1','-i',str(source),'-ac','1','-ar','12000','-f','f32le','-'),dtype='<f4')
    hop=120; n=len(data)//hop
    rms=np.sqrt(np.mean(data[:n*hop].reshape(n,hop)**2,axis=1))
    low=sosfilt(butter(3,150,fs=12000,output='sos'),data)
    lowrms=np.sqrt(np.mean(low[:n*hop].reshape(n,hop)**2,axis=1))
    onset=np.maximum(np.diff(lowrms,prepend=0),0)
    bpm=125 if title=='Realizer' else 128
    beat=60/bpm; bar=beat*4
    # Metadata tempo is verified; only phase is inferred from low-band attack peaks.
    phases=np.arange(0,beat,0.001)
    scores=[]
    for phase in phases:
        grid=np.arange(phase, min(120,len(data)/12000),beat)
        indices=np.round(grid/.01).astype(int)
        scores.append(float(np.mean(onset[np.clip(indices,0,n-1)])))
    phase=float(phases[np.argmax(scores)])
    peaks,_=find_peaks(onset,height=np.percentile(onset,90),distance=20)
    bars=[]
    for i in range(min(int(len(data)/12000/bar),100)):
        lo=int((phase+i*bar)/.01);hi=int((phase+(i+1)*bar)/.01)
        bars.append({'bar':i,'start':round(phase+i*bar,3),'rms_dbfs':round(float(20*np.log10(np.sqrt(np.mean(rms[lo:hi]**2))+1e-12)),2),
                     'low_dbfs':round(float(20*np.log10(np.sqrt(np.mean(lowrms[lo:hi]**2))+1e-12)),2)})
    item={'title':title,'metadataBpm':bpm,'duration':len(data)/12000,'estimatedBeatPhaseSeconds':phase,
          'phaseMethod':f'maximum mean positive low-band RMS attack on {bpm}-BPM grid; bar phase not musically confirmed',
          'bars':bars,'strongOnsetSeconds':[round(float(i*.01),3) for i in peaks[:150]]}
    report.append(item)
    print(title,'phase',phase,'duration',item['duration'])
    print(json.dumps(bars[:30],indent=2))
(OUT/('audio-analysis-bright.json' if bright else 'audio-analysis.json')).write_text(json.dumps(report,indent=2),encoding='utf-8')
