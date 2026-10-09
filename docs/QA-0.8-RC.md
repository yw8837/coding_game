# 0.8 RC 검증 기록

검사일: 2026-10-09. 대상: `0.8.0-rc.0`, 작업명 CODE:SHIFT. 실제 실행 위치는 Windows x64의 `C:\codex-workspaces\codeshift-game`이다. 배포 SHA, 공개 사이트 버전, 실행 파일/영상 해시는 출시 자료의 `delivery-receipt.json`으로 식별한다.

## 결과

| 검사 | 실제 결과와 범위 |
| --- | --- |
| 게임 단위·회귀 검사 | `node --test lib/game/*.test.ts`: **93/93 통과**. 세 엔딩 분기, 보상 중복, 의뢰 판정·저장·완료 파일 보호, 언어, 준비 동선 등을 포함한다. |
| 네이티브 단위 검사 | `node --test desktop/tests/*.test.cjs`: **20/20 통과**. 순차 저장·복구·내보내기, 권한 경계, QA 프로필, Steam 어댑터의 실패 처리와 고지 파일 검사를 포함한다. Steam 테스트는 가짜 클라이언트를 쓰며 실제 SDK 연결 증거는 아니다. |
| TypeScript | `node node_modules/typescript/bin/tsc --noEmit`: 종료 코드 **0**. |
| 브라우저 카페 | 새 저장에서 실제 화면 조작으로 입문 3장과 OPEN을 완료. 창 조작·메모 검사 포함, page error 없음. |
| 브라우저 후속 의뢰 | 한·영·일 각각 **18개 전달**, balanced 엔딩, 지출 전 8,320 cr, 업그레이드 세 개, 다시 불러오기와 좁은 화면을 확인. page error 없음. |
| 브라우저 반례·도구 | EN/JA 390×844 첫 장과 연습, 손상 저장 보존/명시적 초기화, Tab·명령 기록, 창 경계, 체크포인트 복원, 탭 이동 후 Undo, JSON 자동완성, 보조 화면, 내 PC의 정확한 파일 열기, 잘못된 가져오기 거부 통과. |
| 오프라인 Electron 전체 진행 | 실제 Electron 44.7.0에서 **카페 3장 + 의뢰 18개 + balanced 엔딩**을 UI로 완료. 첫 장의 iframe 검사, 저장 후 종료/재실행, 브라우저 저장 가져오기, 실제 파일 내보내기, 영어로 바꾼 네이티브 대화상자, 손상 primary의 backup 복구 통과. page error 없음. |
| 패키지 실행 | 별도 QA 패키지의 실제 `.exe`를 실행해 일본어 선택, 첫 의뢰 수락, 정상 종료, 파일 저장·재실행 및 Continue 뒤 빈 바탕화면을 확인. QA 패키지는 납품에서 제외한다. |
| 기본 배포 패키지 검사 | QA 플래그 false, Steam 모듈 파일 없음, App ID null, ASAR 전용 실행·무결성 및 Node 진입점 차단 설정 확인. 게임 런타임/renderer 파일 14개가 실행 검사한 QA 패키지와 바이트 단위로 동일. Electron·Chromium·renderer 52개 패키지 고지 포함. |
| 렌더러 경계 | `require`와 `process`가 renderer에 노출되지 않음. 외부 `fetch` 차단 확인. 실제 호스트 명령 실행 API 없음. |
| 홍보 영상 | 42초·1,260프레임·30fps H.264/AAC 4개. 가로 1920×1080 한·영·일, 한국어 세로 1080×1920. 네 파일 전체 디코딩 통과, 약 −16.01 LUFS / −3.34 dBTP. 공개 페이지의 재생·탐색 검사 통과. |

브라우저 후속 의뢰 검사는 카페를 실제 UI로 완료하여 만든 저장을 불러온 뒤 시작한다. 예시 답안을 화면에서 열어 읽고 실제 편집기에 입력한다. 네이티브 전체 진행은 새 프로필에서 시작한다. 이 둘은 **도움을 사용한 기능 검사**이며, 처음 접하는 사람이 설명 없이 푼 결과가 아니다. UI에서는 balanced 엔딩을 검증했으며 다른 두 엔딩 조건과 경계는 단위 검사로 검증했다.

네이티브 내보내기는 파일 선택 대화상자의 선택 결과만 테스트 폴더로 대체한다. 이후 검증·쓰기에는 실제 handler와 디스크를 사용한다. 게임 프로필과 QA 프로필은 분리하며 실제 플레이어 저장을 쓰거나 덮어쓰지 않는다.

## 수정 후 닫은 결함

- 터미널의 복사·이동·파일/폴더 생성으로 완료한 의뢰 파일을 바꾸던 경로를 막았다. 완료 기록 읽기와 다른 폴더로 복사는 가능하다.
- 체크포인트에 임의 파일이 들어가 저장 스키마를 깨뜨리던 문제를 해결했다. 선언된 파일만 제한된 크기로 보관하고 복원한다.
- 카페 완료 이전의 경력 완료, 검사·답장·파일이 빠진 완료 저장과 조작된 `passed` 기록을 거부한다. 전달 전에 현재 파일을 다시 판정한다.
- 할인 기준·영업 시각·예약/원본 자료 삭제·비활성 예약 폼·잘못된 상자 크기가 정답으로 통과하던 반례를 막았다. 동등한 유효 행 순서와 형식은 허용한다.
- 저장을 읽기 전에 초기 상태로 덮어쓰는 종료 경로를 막았다. 불러오는 동안 새 게임·가져오기·초기화를 보호하고 손상 기록은 명시적 복구/초기화 전까지 보존한다.
- 누락된 의존성 LICENSE는 upstream 실제 원문과 출처·버전 한정·체크섬을 보관하여 보완했다. 검사 실패를 무시하는 방식은 사용하지 않았다.

## 실행 증거

생성된 원본 로그·스크린샷은 Git에 넣지 않고 출시 자료의 `qa`와 `video`에 보관한다.

- `output/pc-qa/campaign-report.json`, `adversarial-report.json`
- `output/steam-qa/career-report.json`, `tools-report.json`, `native-report.json`, `packaged-report.json`
- `output/steam-qa/unit-final.log`, `desktop-unit-final.log`, `typecheck-final.log`, `lint-final.log`
- `output/steam-qa/desktop-build-final.log`, `package-qa-final.log`, `native-final.log`, `packaged-final.log`
- `output/steam-qa/package-offline-final.log`, `offline-package-report.json`
- `output/trailer-0.8/verification.json`, `edl-used.json`, `contact-sheet.png`, 자막과 원본 촬영

영상의 42초 전체를 한 장면씩 추출한 contact sheet와 일본어 원본 크기 표본을 시각적으로 검토했다. 각 언어 영상의 브라우저 재생·탐색도 확인했다. 헤드폰/스피커를 통한 사람의 청취 검사는 수행하지 않았다.

## 미검증·제약

**ESLint는 통과가 아니다.** `eslint-config-next`가 `next/dist/compiled/babel/eslint-parser`를 찾지 못해 시작 단계에서 종료 코드 2로 중단된다. 현재 설치된 framework 의존성 해석 문제를 기록했으며, 이를 코드 검사 성공으로 대체하지 않는다. TypeScript·실행·회귀 검사 결과는 위와 같다.

Windows 기본 배포 패키지는 QA 기능을 끄고 Steam 모듈을 제외한 오프라인 portable 폴더/ZIP이다. 테스트용 exe와 배포용 exe는 QA 플래그가 다르므로 패키지 실행 검사를 배포 파일의 완전한 외부 검증으로 표현하지 않는다. 별도 깨끗한 Windows 장비, 최소 사양, 접근성 사용자 테스트, 실제 초보자 이해도·재미·플레이 시간, 전 엔딩의 수동 플레이는 아직 검증하지 않았다.

실제 Steam App ID·스토어 등록 여부는 이 작업에서 확인하지 못했다. 계정·SDK·실제 업적·Cloud·SteamPipe 업로드·심사/등급·서명·스토어 가격 적용은 완료로 주장하지 않는다. **21,000원은 한국 판매 계획 가격**이고, CODE:SHIFT는 가제다. 제공된 오프라인 RC와 Steam 정식 출시 완료는 별도로 판단한다.
