"""Download only official audio and source/license evidence; never execute downloads."""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import quote
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
import json, sys

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'output/trailer-rebuild/audio'
OUT.mkdir(parents=True, exist_ok=True)
BASE = 'https://incompetech.com/music/royalty-free/'

def acquire(url, name):
    with urlopen(Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=30) as response:
        data = response.read(40 * 1024 * 1024 + 1)
        if len(data) > 40 * 1024 * 1024:
            raise ValueError('Unexpected download size')
        destination = OUT / name
        destination.write_bytes(data)
        return {'url': url, 'finalUrl': response.url, 'file': name,
                'contentType': response.headers.get('Content-Type'),
                'bytes': len(data), 'sha256': sha256(data).hexdigest()}

catalog = acquire(BASE + 'pieces.json', 'official-catalogue.json')
pieces = json.loads((OUT / catalog['file']).read_text('utf-8'))
bright = '--legacy' not in sys.argv
selected = [p for p in pieces if p['isrc'] in (['USUAN1900024', 'USUAN1600042'] if bright else ['USUAN1500029', 'USUAN1500026'])]
if len(selected) != 2:
    raise ValueError('Expected official catalogue entries not found')
jobs = [(BASE + 'index.html?isrc=' + p['isrc'], p['isrc'] + '-source.html') for p in selected]
jobs += [(BASE + 'mp3-royaltyfree/' + quote(p['filename']), p['filename']) for p in selected]
jobs += [('https://creativecommons.org/licenses/by/4.0/', 'CC-BY-4.0-deed.html'),
         ('https://creativecommons.org/licenses/by/4.0/legalcode.en', 'CC-BY-4.0-legalcode.html'),
         (BASE + 'faq.html', 'official-faq.html')]
with ThreadPoolExecutor(max_workers=3) as pool:
    downloads = list(pool.map(lambda pair: acquire(*pair), jobs))
report = {'acquiredDate': '2026-10-09', 'catalogue': catalog, 'tracks': selected,
          'downloads': downloads, 'paidServicesUsed': False, 'downloadsExecuted': False,
          'license': 'CC BY 4.0', 'audition': 'Not performed'}
(OUT / ('acquisition-bright.json' if bright else 'acquisition.json')).write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps({'tracks': [p['title'] for p in selected],
                  'downloads': [{k: d[k] for k in ['file', 'bytes', 'contentType']} for d in downloads]}, indent=2))
