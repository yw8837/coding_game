# 0.9 RC 검증 기록

검사일 2026-10-09. 버전 `0.9.0-rc.0`, 작업명 CODE:SHIFT. C:의 Windows x64 체크아웃에서 한 번에 브라우저 하나 또는 무거운 빌드·렌더 하나만 실행했다. 공개 배포 SHA, 사이트 버전과 납품 해시는 별도 `delivery-receipt.json`에 기록한다.

| 검사 | 결과와 범위 |
| --- | --- |
| 게임 회귀 검사 | 93/93 통과. 기존 의뢰 판정·저장·보상·엔딩 분기 검사. |
| 네이티브 단위 검사 | 20/20 통과. 저장·복구·IPC·패키지 보조 코드 검사. Steam 부분은 가짜 클라이언트이며 실서비스 증거가 아니다. |
| TypeScript | `tsc --noEmit` 종료 코드 0. |
| 신규 화면·게임 동작 | 타이틀 이미지 디코딩, Start 뒤 빈 바탕화면, 인물 표시, 지도 선택 → 실제 첫 의뢰 수락·편집·검사·답장·전달, 잠긴 다음 장, 완료 도장, 보상 표시 통과. page error 없음. |
| 언어·좁은 화면 | EN/JA 의뢰 지도와 실제 의뢰 열기, 잠금, 키보드 핀 선택, 390×844의 열기 버튼 노출·문서 가로 넘침 없음. KO 지도와 EN/JA 타이틀의 작은 화면도 확인. 동작 줄이기 환경에서 새 타이틀 애니메이션 없음. |
| 기존 편집 도구 | 체크포인트 복원, 탭 이동 뒤 Undo, JSON 자동완성, 보조 모니터, 내 PC에서 정확한 의뢰 파일 열기, 잘못된 가져오기 보존 통과. |
| Electron 전체 캠페인 | 새 격리 프로필에서 실제 UI로 카페 3장 + 후속 의뢰 18개 + balanced 엔딩 완료. 타이틀 이미지, iframe 검사, 저장·종료·재실행, 파일 내보내기, 저장 가져오기, 수동 언어 변경, 손상 primary의 backup 복구 통과. page error 없음. |
| 패키지 실행 | 별도 QA exe에서 타이틀 이미지 디코딩, 일본어 선택, 의뢰 수락, 파일 저장·종료·재실행, Continue 뒤 빈 바탕화면 통과. QA exe는 납품에서 제외. |
| 기본 배포 파일 | QA false, App ID null, Steam 모듈 파일 제외, Node 진입점 차단·ASAR 전용·무결성 fuse 확인. 게임 런타임/renderer 파일 18개가 실행한 QA 패키지와 동일. 네 PNG도 소스와 바이트 단위 일치. renderer 의존성 52개와 Electron/Chromium 고지 포함. |
| 렌더러 경계 | 네이티브 전체 검사에서 require/process 미노출 및 외부 fetch 차단 확인. 호스트 명령 실행 API 없음. |
| 영상 파일 | 42초 / 1,260프레임 / 30fps H.264·AAC 네 개, 가로 1920×1080 한·영·일 및 세로 1080×1920 한국어. 전체 디코딩 및 약 −16.01 LUFS / −3.34 dBTP 통과. |
| 소개 페이지 | 한·영·일 영상의 브라우저 재생·탐색, canonical 정보, 빈 바탕화면 시작과 현지화된 터미널 도움말 검사 통과. |

전체 캠페인 촬영은 UI 입력만 사용했고, 기능 검사와 촬영은 화면의 선택 예시 답안을 사용했다. 지도 검사에는 앞서 실제 UI로 카페를 완주한 저장을 설정의 가져오기로 불러왔다. 네이티브 전체 캠페인은 새 프로필에서 시작했다. 이 결과는 **도움을 사용한 기능 검사**이며 비전공 15세 사용자의 독립적인 완주·재미·교육 효과를 증명하지 않는다. 이번 UI 완주는 balanced 엔딩이며 나머지 두 엔딩 조건은 회귀 검사 범위다.

## 소스·화면 검토

소스 검토에서 지도 잠금과 완료 표시가 기존 `careerUnlocked`/`careerNext` 및 실제 완료 기록에서 계산되는지 확인했다. 잠긴 장소는 읽기만 가능하고 의뢰 열기는 비활성화된다. 새 효과는 추가 보상 지급이나 진행 변경을 하지 않는다. 별도 검토자는 새 컴포넌트·CSS·네이티브 이미지 전달 범위에서 남은 P1/P2를 보고하지 않았다. 이 검토 자체는 실행 검사나 Steam 승인이 아니다.

타이틀, 빈 바탕화면, 인물 메시지, 지도, 전달 직후, 완료 지도, KO/EN/JA 좁은 화면의 스크린샷을 시각적으로 확인했다. 42초 영상의 매초 표본과 모든 컷의 시작·끝 프레임, 일본어 자막 및 세로 영상 표본을 검토했다. 마지막 타이틀 앞의 설정창 닫기 프레임을 EDL에서 잘라냈고 변경 내역을 기록했다. 영상 전체의 사람 청취·헤드폰/스피커 검사는 수행하지 않았다.

## 실행 증거

- `output/art-qa/report.json`, `languages-report.json`, `tools.log`
- `output/art-qa/unit-final.log`, `desktop-unit-final.log`, `typecheck-final.log`
- `output/art-qa/native.log`, `packaged.log`, `desktop-build-final.log`
- `output/art-qa/package-qa.log`, `package-offline.log`, `offline-package-report.json`
- `output/steam-qa/native-report.json`, `packaged-report.json`, `tools-report.json`
- `output/pc-qa/final-smoke.json`
- `output/trailer-0.9/verification.json`, `edl-used.json`, `raw.webm`, 자막과 컷 검토 이미지
- `media/game-art-prompts.json` 및 `public/game-art/`의 최종 이미지

생성 출력은 Git 밖의 출시 자료에도 복사한다. 기존 0.8/0.7 증거는 역사적 범위로 보존하며 이번에 재실행하지 않은 검사를 0.9 결과로 옮겨 적지 않는다.

## 제한

ESLint는 설치된 `eslint-config-next`의 `next/dist/compiled/babel/eslint-parser` 해석 문제로 이전 검사에서 차단된 상태이며 통과로 주장하지 않는다. 이번 변경에서 이를 해결하거나 재검사하지 않았다. 빌드의 약 893KB JS 청크 경고도 남아 있다.

배포용 오프라인 패키지와 QA 패키지는 QA 플래그가 다르다. 위의 동일 파일 검사는 별도 깨끗한 PC에서 배포 파일을 검증한 결과가 아니다. 깨끗한 Windows 장비, 최소 사양 측정, 사용자 접근성 검사, 실제 초보자 플레이와 소요 시간은 미검증이다.

실제 Steam App ID·스토어 상태는 확인되지 않았다. Steam 업적·Cloud·SteamPipe·심사·서명·공식 연령 등급·가격 적용은 완료로 주장하지 않는다. 21,000원은 한국 판매 계획이며 CODE:SHIFT는 작업명이다.
