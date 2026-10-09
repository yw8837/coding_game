# UltraQA Report

2026-10-09 · CODE:SHIFT 0.11.0-rc.0

## Goal and success criteria

정상 캠페인·터미널·저장·세 언어 UI가 작동하고, 잘못된 저장과 적대적 코드 입력 뒤에도 진행을 복구하며, 게임 입력이 호스트 코드/파일/네트워크 권한으로 넘어가는 확인된 경로를 해결하는 것이 이번 목표다. 운영 사용자 저장과 계정에는 시험 입력을 넣지 않았다. 원격 부하·비밀 추출·실제 Steam 구매/제출은 범위 밖이다. 최대 5회, 같은 제품 실패 3회에서 중단하는 규칙을 적용했다. 한 QA 회차에서 발견 사항을 수정하고 영향 범위를 재검증했다.

## Scenario matrix

[qa-matrix.md](qa-matrix.md)의 QA01–QA11은 상황, 행위자, 설정/명령, 기대 신호, 결과/수정, 증거와 정리를 기록한다. 게임 입력에 들어간 HTML·명령 문구는 데이터로 취급했다. 다른 작업의 dirty 파일을 삭제하거나 초기화하지 않았다.

## Commands run

각 실행은 한 개의 무거운 브라우저/네이티브 슬롯을 사용했다. 브라우저 locator와 native launch/wait는 하네스의 제한 시간으로 실패하며 무제한 테스트 재시도는 사용하지 않았다.

| 명령 | exit / 결과 | 목적·증거 |
| --- | --- | --- |
| `node --test lib/game/*.test.ts desktop/tests/*.test.cjs tools/playtest/data.test.cjs` | 0, 207 pass / 0 fail / 0 skip | `output/0.11-qa/unit.log` |
| `pnpm exec tsc --noEmit` | 0 | `output/0.11-qa/typecheck.log` |
| `pnpm exec eslint . ... --format json` | 0, 231 files / 0 error / 68 warnings | `output/0.11-security/lint-final.json` |
| `node scripts/lint-config-check.mjs` | 0 | 공식 parser와 hooks/TypeScript 오류 규칙 유지, `lint-status.md` |
| `desktop-shell.py`, `code-lab.py`, `lab-terminal.py`, `coach.py`, `final-smoke.py` | 모두 0 | 세 언어 UI/실제 가상 파일/초보자 경로, `output/0.11-qa/*-final.log` |
| `web-security.py`, `playtest-kit.py` | 모두 0 | 적대적 저장/미리보기/해석기와 관찰 도구의 실제 UI |
| `runtime-probe.mjs` | 0, 47 probes | host 탈출/자원 한도/잘못된 저장, `runtime-probe-result.json` |
| `node tests/e2e/native.cjs` | 0 | 캠페인→엔딩, 저장/백업/언어, host Node 미노출 |
| `node desktop/scripts/package.mjs --qa`, `node tests/e2e/packaged.cjs` | 모두 0 | 최신 QA 실행 폴더의 실제 실행/종료/재실행 |
| `node desktop/scripts/package.mjs`, `node desktop/scripts/verify-offline.mjs` | 모두 0 | 전달용 QA=false, 게임 파일 18개 일치, fuse/아트/라이선스 |
| `pnpm audit --prod`, desktop `npm audit` | 각 0건 | `production-audit.json`, `desktop-audit.json` |
| 전체 `pnpm audit` | High 1건으로 nonzero | 숨기지 않은 개발/빌드 braces 경고, `root-audit-after.json` |

## Failures found / Fixes applied

- QA 프로필 root·자식 junction이 격리 경로 밖을 가리키는 문제: 실제 경로와 기존 부모, 준비 단계 쓰기 대상을 확인하도록 수정했다. dangling link도 거부한다. Windows fixture 22개 관련 검사가 통과했다.
- 큰 플레이테스트 기록의 문자/바이트 한도 불일치: UTF-8 한도 통일, JSON compact fallback, CSV 한도 안내, 편집 실패 rollback을 적용했다. 7개 단위 검사와 offline UI 회귀가 통과했다.
- 작업 파일 삭제 후 초안으로 통과하거나 원격 서버에 남은 상태에서 로컬 의뢰 준비가 실패하는 문제: workspace 준비 기록을 지속 저장하고 로컬 machine을 선택한다. 삭제 순서 6개·reload·server 상태 보존을 확인했다.
- 취약 의존성은 가능한 패치로 갱신했다. ESLint parser 연결을 복구하고 작성 소스 오류를 처리했다. 잔여 경고는 그대로 보고한다.

세부 원인과 파일 위치는 [보안 종합](README.md), [desktop-review.md](desktop-review.md), [web-review.md](web-review.md), [runtime-review.md](runtime-review.md)에 있다.

## Cleanup and rollback

테스트 브라우저/네이티브 앱은 종료했다. junction fixture는 소유 경계와 대상을 확인한 뒤 링크부터 해제하고 파일·빈 폴더를 비재귀 방식으로 정리했다. 초기 광범위 정리는 자동 승인 검토에서 거절됐고 더 좁은 방식으로 완료했다. `cleanup.json` 및 `profile-final-verification.json`에 기록했다. 진단 로그/합성 프로필은 증거로 보존하며 전달 폴더에는 실행 중인 프로세스, 실제 사용자 저장, 임시 junction이나 실패 촬영물을 포함하지 않는다.

이 실행만의 OMX 상태는 `output/0.11-security/run-20261009`에 격리한다. CLI의 complete→clear→read 결과를 `output/0.11-security/ultraqa-lifecycle.json`에 기록해 상태가 비활성/제거되었는지 확인한다. 다른 OMX 상태는 수정하지 않는다.

최종 확인에서 complete 비활성 상태와 clear의 `cleared:true`, 후속 CLI read 및 상태 파일 부재를 확인했다. read/clear의 반환 형식을 일반 success wrapper로 가정한 검증 스크립트 오류는 실제 반환 형식에 맞춰 바로잡았으며 제품 결함으로 집계하지 않았다. 소유한 개발 서버도 종료했고 5173 포트의 listener가 남지 않았음을 확인했다.

## Residual risks

개발/빌드 braces의 미패치 High 1개, lint 권고 68개, 웹 운영 헤더 확인 제한, renderer 번들 크기 권고가 남는다. 오프라인 저장의 직접 편집 방지나 모든 동일 사용자 파일 경합 방지는 보장하지 않는다. 현재 Chrome의 한정된 적대 입력 관찰을 모든 브라우저/취약점 부재로 확대하지 않는다. 사람의 재미·학습·플레이타임, 별도 PC 성능, 코드 서명, 실제 Steam 등록/SDK/심사는 아직 완료되지 않았다.

## Evidence

소스 저장소에는 보고서와 재실행 가능한 테스트를, RC 전달 폴더에는 `qa/` 로그/JSON/스크린샷과 패키지 검증 및 SHA-256 manifest를 포함한다. 최종 공개 배포 성공은 별도의 native Sites receipt가 증명하며 QA 통과만으로 배포되었다고 주장하지 않는다.

ULTRAQA COMPLETE: Goal met after 1 cycle. 위 범위의 baseline·적대 시나리오·정리를 통과했으며 잔여 위험과 미검증 항목은 유지한다.
