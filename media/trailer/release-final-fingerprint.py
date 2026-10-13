"""Read-only fingerprint of the served renderer, separately from changing source."""
from pathlib import Path
from datetime import datetime, timezone
import argparse, hashlib, json, re, urllib.request

def snapshot(url):
    def read(path):
        return urllib.request.urlopen(url.rstrip('/')+path, timeout=20).read()
    html=read('/')
    paths=sorted(set(re.findall(r'(?:src|href)="(/assets/[^" ]+)"',html.decode('utf-8'))))
    assets=[]
    for path in paths:
        payload=read(path)
        assets.append({'url':path,'bytes':len(payload),'sha256':hashlib.sha256(payload).hexdigest()})
    info=read('/build-info.json')
    return {'observedAt':datetime.now(timezone.utc).isoformat(),'serverUrl':url,'indexSha256':hashlib.sha256(html).hexdigest(),'buildInfo':json.loads(info),'buildInfoSha256':hashlib.sha256(info).hexdigest(),'assets':assets,'note':'Actual HTTP-served renderer fingerprint. Working-tree source files can change independently; this identifies captured pixels more precisely.'}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--url',default='http://127.0.0.1:5190/');p.add_argument('--output',type=Path,required=True);args=p.parse_args()
    result=snapshot(args.url);args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps({'assets':len(result['assets']),'output':str(args.output),'build':result['buildInfo']}))
