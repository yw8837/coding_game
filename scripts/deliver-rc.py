"""Copy a verified RC into a NEW delivery folder, zip the complete runtime, and hash it.
No deletes, moves, uploads, executable launches, or existing-release overwrites.
"""
from pathlib import Path
import argparse, hashlib, json, shutil, subprocess, zipfile

parser=argparse.ArgumentParser()
parser.add_argument('--destination',required=True)
parser.add_argument('--receipt',required=True)
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
destination=Path(args.destination).resolve()
receipt=json.loads(Path(args.receipt).read_text(encoding='utf-8-sig'))
version=receipt['version']
source_sha=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
assert receipt['source']['commit_sha']==source_sha,'Source receipt does not match HEAD'
assert receipt['publicDeployment']['status']=='succeeded','Deployment not confirmed'
package=root/'desktop/release/CODE-SHIFT-win32-x64'
verification=json.loads((root/'output/art-qa/offline-package-report.json').read_text())
assert verification['version']==version and verification['qaFlag'] is False
assert (package/'CODE-SHIFT.exe').is_file()
assert (root/'output/trailer-0.11-terminal/codeshift-terminal-ko.mp4').is_file(),'Terminal teaser has not been rendered'
if destination.exists():raise FileExistsError('Choose a new delivery directory: '+str(destination))
destination.mkdir(parents=True)

def copy(src,relative):
 src=Path(src);target=destination/relative;target.parent.mkdir(parents=True,exist_ok=True)
 if src.is_dir():shutil.copytree(src,target,ignore=shutil.ignore_patterns('__pycache__','*.pyc'))
 else:shutil.copy2(src,target)
def write(relative,value):
 target=destination/relative;target.parent.mkdir(parents=True,exist_ok=True)
 target.write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf-8')
def digest(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for block in iter(lambda:f.read(1024*1024),b''):h.update(block)
 return h.hexdigest()

copy(package,'windows/CODE-SHIFT-win32-x64')
zip_path=destination/f'CODE-SHIFT-{version}-Windows-x64.zip'
with zipfile.ZipFile(zip_path,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
 for path in sorted(package.rglob('*')):
  if path.is_file():archive.write(path,Path('CODE-SHIFT-win32-x64')/path.relative_to(package))
with zipfile.ZipFile(zip_path) as archive:
 assert archive.testzip() is None
 assert any(n.endswith('/CODE-SHIFT.exe') for n in archive.namelist())
 zip_count=len(archive.namelist())
copy(root/'docs','docs')
copy(root/'tools/playtest','tools/playtest')
for folder in ['0.11-qa','code-lab-ui-qa','playtest-kit-qa']:
 for path in (root/'output'/folder).glob('*'):
  if path.is_file() and 'failure' not in path.name and not path.name.endswith('-save.json'):copy(path,Path('qa')/folder/path.name)
for name in ['native-report.json','packaged-report.json']:
 copy(root/'output/steam-qa'/name,Path('qa')/name)
copy(root/'output/art-qa/offline-package-report.json','qa/offline-package-report.json')
copy(root/'output/pc-qa/final-smoke.json','qa/about-smoke.json')
for folder in ['trailer-0.10','trailer-0.11-terminal']:
 source=root/'output'/folder
 if not source.exists():raise FileNotFoundError(str(source))
 for path in source.glob('*'):
  if path.is_file() and (path.suffix in ['.mp4','.json','.md','.srt','.png']) and path.name!='gameplay-master.mp4':copy(path,Path('video')/folder/path.name)
copy(root/'output/trailer-0.10/screenshots','screenshots')
for path in (root/'output/0.11-qa').glob('ko-*.png'):
 if any(label in path.name for label in ['desktop-','start-','calendar-','terminal-']):copy(path,Path('screenshots/0.11')/path.name)
copy(Path(receipt['source']['archive']),'site-build.tar.gz')
receipt['windowsPackage']={'path':zip_path.name,'bytes':zip_path.stat().st_size,'sha256':digest(zip_path)}
write('delivery-receipt.json',receipt)
write('qa/zip-report.json',{'crcCheck':'passed','runtimeFiles':zip_count,'sha256':digest(zip_path)})
(destination/'먼저 읽어주세요.md').write_text(f'''# CODE:SHIFT {version}

CODE:SHIFT는 가제입니다. 소스 커밋 `{source_sha}`.

- 웹: {receipt['publicDeployment']['url']}
- Windows: `windows/CODE-SHIFT-win32-x64/CODE-SHIFT.exe`
- 공유: `{zip_path.name}` 전체를 압축 해제하세요. 실행 파일만 옮기면 안 됩니다.

별도 엔진·Node·개발 도구 설치 없이 실행하는 Windows x64 오프라인판입니다.
시작을 누르면 빈 바탕화면이 열립니다. 메시지를 열어 첫 의뢰를 받으세요.
기본 함께 배우기는 선택 → 한 글자 → 빈칸 → 짧은 코드로 이어집니다.
설정에서 직접 작업으로 바꿀 수 있고, 연습 의뢰의 코드 탭에서 함수 12개와 반례에 도전할 수 있습니다.
코드 의뢰에서 파일로 작업을 준비하면 가상 터미널과 에디터에서 직접 명령을 치고 실행·검사합니다.

카페 3장 → 동네 의뢰 18개 → 첫 프로그램 1.0.0 배포 → 마지막 편지가 전체 목표입니다.
한국어·영어·일본어를 환경에 따라 고르고 타이틀/설정에서 직접 바꿀 수 있습니다.
Windows 저장은 `%APPDATA%/CODE-SHIFT/saves/`이며, 설정의 백업 내보내기/가져오기로 웹과 옮길 수 있습니다.

`video/`에 42초 게임플레이 영상 4종과 별도의 빠른 코딩 티저가 있습니다.
42초 영상은0.10의 학습과 최종 배포 장면이며, 새 터미널 코딩은 별도 티저입니다.
`tools/playtest/index.html`을 열면 본인/주변 초보자의 플레이를 기록할 수 있습니다. 실제 인간 결과는 아직 없습니다.
`docs/steam-launch/`에는 세 언어 상점 문구, 업적 목록, 콘텐츠 설문 초안과 제출 순서가 있습니다.

이 실행판은 서명되지 않은 오프라인 RC입니다. Steam 등록·업로드·심사는 아직 완료되지 않았습니다.
게임용 새 AppID와 등록비 결제가 필요하며, 다른 게임의 앱을 사용하지 않습니다.
한국 Steam 판매 계획가는21,000원입니다. 플레이타임과 재미·학습 성과는 실제 사람의 검증 전입니다.
검사 범위는 `docs/QA-0.11-RC.md`, 배포 식별자는 `delivery-receipt.json`에 있습니다.
''',encoding='utf-8')
manifest=[{'path':str(p.relative_to(destination)).replace('\\','/'),'bytes':p.stat().st_size,'sha256':digest(p)} for p in sorted(destination.rglob('*')) if p.is_file()]
write('integrity-manifest.json',{'algorithm':'SHA-256','files':manifest})
for entry in manifest:
 assert digest(destination/entry['path'])==entry['sha256']
print(json.dumps({'destination':str(destination),'filesVerified':len(manifest),'zipFiles':zip_count,'package':receipt['windowsPackage']},ensure_ascii=False))
