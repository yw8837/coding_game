"""Deliver an already verified offline Windows RC into a new folder.

No deployment, upload, executable launch, deletion or overwrite of older releases.
Run after committing the tested source. Evidence is selected explicitly, not copied
from older releases. The public demo is outside this workflow.
"""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import subprocess
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('--destination', required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
destination = Path(args.destination).resolve()
if destination.exists():
    raise FileExistsError('Delivery directory must be new: ' + str(destination))

def read(relative):
    return json.loads((root / relative).read_text(encoding='utf-8-sig'))

version = read('package.json')['version']
quality = read('output/quality-gate/receipt.json')
integrity = read('output/art-qa/offline-package-report.json')
studio = read('output/full-version-quality/studio-native-report.json')
career = read('output/full-version-quality/career-feedback-native-report.json')
assert quality['passed'] and quality['version'] == version
assert integrity['version'] == version and integrity['qaFlag'] is False
assert studio['passed'] and career['passed']
commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
assert not subprocess.check_output(['git', 'status', '--porcelain'], cwd=root, text=True).strip(), 'Commit tested changes before delivery'
package = root / 'desktop/release/CODE-SHIFT-win32-x64'
assert (package / 'CODE-SHIFT.exe').is_file()
assert not (package / 'QA-NOT-FOR-DISTRIBUTION.txt').exists()
destination.mkdir(parents=True)
shutil.copytree(package, destination / 'windows/CODE-SHIFT-win32-x64')
zip_path = destination / f'CODE-SHIFT-{version}-Windows-x64.zip'
with zipfile.ZipFile(zip_path, 'x', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for file in sorted(package.rglob('*')):
        if file.is_file():
            archive.write(file, Path('CODE-SHIFT-win32-x64') / file.relative_to(package))
with zipfile.ZipFile(zip_path) as archive:
    assert archive.testzip() is None
    zip_count = len(archive.namelist())

def copy(source, target):
    target = destination / target
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(root / source, target)

for folder in ['quality-gate', 'full-version-quality']:
    for file in (root / 'output' / folder).iterdir():
        if file.is_file() and file.suffix in ['.json', '.log', '.png'] and 'failure' not in file.name and file.name != 'state-input.json':
            copy(file, Path('qa') / folder / file.name)
for name in ['native-report.json', 'packaged-report.json', 'packaged-desktop.png']:
    copy(Path('output/steam-qa') / name, Path('qa') / name)
copy('output/art-qa/offline-package-report.json', 'qa/offline-package-report.json')
for name in ['QA-0.14-RC.md', 'full-version-quality-spec-2026-10-10.md', 'full-version-quality-plan-2026-10-10.md', 'references/coverage-and-release-2026-10-10.md']:
    copy(Path('docs') / name, Path('docs') / name)

def digest(file):
    h = hashlib.sha256()
    with file.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()

receipt = {'version': version, 'sourceCommit': commit, 'edition': 'offline-full-rc',
           'publicDemoChanged': False, 'steamUploaded': False, 'signed': False,
           'zip': {'file': zip_path.name, 'bytes': zip_path.stat().st_size,
                   'sha256': digest(zip_path), 'crcPassed': True, 'files': zip_count}}
(destination / 'delivery-receipt.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2), encoding='utf-8')
(destination / '먼저 읽어주세요.md').write_text(f'''# CODE:SHIFT {version}

CODE:SHIFT는 가제입니다. 소스 커밋 `{commit}`.

`windows/CODE-SHIFT-win32-x64/CODE-SHIFT.exe`를 실행하세요.
공유할 때는 `{zip_path.name}` 전체를 보내고 압축을 모두 풀어야 합니다.
별도 게임 엔진·Node 설치는 필요하지 않습니다.

이번 정식판 RC에는 의뢰 검사 피드백, 완료 의뢰 기록, 첫 출시 후 작업실,
최근 5개 버전 기록, 실제 HTML 앱 내보내기가 포함되어 있습니다.
작업실은 장소 목록·행사 안내·작품 모음 형식을 지원합니다.
내보낸 앱의 문의는 연 브라우저에만 저장되며 서버 전송·온라인 배포는 포함하지 않습니다.
한국어·영어·일본어는 타이틀/설정에서 바꿀 수 있습니다.
진행은 `%APPDATA%/CODE-SHIFT/saves/`에 저장됩니다.

공개 데모는 변경하지 않았습니다. 이 파일은 서명되지 않은 오프라인 출시 후보입니다.
Steam 업로드/심사는 완료되지 않았으며 올바른 신규 AppID, 실제 사람의 플레이테스트,
다른 Windows PC 검사, 최종 제목과 언어 검토가 필요합니다.
한국 판매 계획가는 11,000원, 출시 첫 7일 20% 할인 계획가는 8,800원입니다.
플레이타임·재미·학습 성과를 실측한 제품이라고 홍보하지 마세요.
검증 범위와 미완료 항목은 `docs/QA-0.14-RC.md`에 있습니다.
''', encoding='utf-8')
manifest = [{'path': p.relative_to(destination).as_posix(), 'bytes': p.stat().st_size, 'sha256': digest(p)}
            for p in sorted(destination.rglob('*')) if p.is_file()]
(destination / 'integrity-manifest.json').write_text(json.dumps({'algorithm': 'SHA-256', 'files': manifest}, ensure_ascii=False, indent=2), encoding='utf-8')
for entry in manifest:
    assert digest(destination / entry['path']) == entry['sha256']
print(json.dumps({'destination': str(destination), 'filesVerified': len(manifest), **receipt}, ensure_ascii=False))
