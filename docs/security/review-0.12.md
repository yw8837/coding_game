# 0.12 코어 상태·입력·보상 검토

검토일: 2026-10-10 KST. 기준 소스: `main`의 `445d474`. 후속 수정 범위는 `lib/game/career-evaluation.ts`와 해당 테스트이며, 브라우저·빌드·Windows 패키지 실행이나 의존성 설치·업데이트는 수행하지 않았다. 이 검토는 후반 의뢰, 최종 출시, CodeLab, 저장 검증의 소스와 단위 결과를 대상으로 한다. 게임 전체 완성도·실제 재미·출시 패키지 안전성의 최종 승인으로 확대하지 않는다.

## 확인하고 수정한 결함

### CORE-01 — P2: 다섯 개 상자가 여섯 개 상자 의뢰를 통과

`career-content.ts:120`의 요청은 낱개 1,800원, **여섯 개 한 상자 10,000원**이다. 기존 `career-evaluation.ts`는 0·6·8·1·3개 합계만 검사했다. `{ "unitPrice": 1800, "packSize": 5, "packPrice": 8200 }`가 모두 통과했고, 실제 `career-deliver`가 200 cr를 지급했다. 다섯 개 주문은 9,000원이어야 하지만 이 설정에서는 8,200원이 된다.

수정: 기존 다섯 검사와 순서를 유지하고 뒤에 상자 개수 6, 상자 가격 10,000, 다섯 개 합계 9,000, 열 개 합계 17,200 검사를 추가했다. 위치: `career-evaluation.ts:73–76`. 회귀 검사는 잘못된 설정의 평가 실패뿐 아니라 최종 전달·크레딧 지급 거절과 저장 재불러오기도 확인한다 (`career-evaluation.test.ts:10`).

### CORE-02 — P2: 폼 밖 또는 보이지 않는 예약 컨트롤도 통과

기존 `clinic-form` 검사는 문서 전체에서 라벨·입력·버튼을 각각 찾고 별도의 `<form>` 존재만 확인했다. 아래 파일은 폼 소유 관계가 없지만 모두 통과하여 200 cr를 지급했다.

```html
<label for="name">Name</label>
<input id="name" name="name" type="text" required>
<button type="submit">Book</button>
<form></form>
```

`<form style="display:none">` 역시 실제 고객이 사용할 수 없는 폼인데 통과했다. 중복 `type` 속성은 검사기가 마지막 값을 읽는 반면 HTML 파서는 첫 값을 사용하여, `type="hidden" type="text"`를 잘못 통과시킬 수 있었다.

수정: 지원 문법을 **단일 form 안의 label → input → button**으로 명시했다. 앞뒤 공백과 HTML 주석은 허용하지만, 중첩/여러 폼·fieldset·추가 래퍼와 인라인 CSS는 지원하지 않는다. 입력과 버튼의 `form` 속성이 있으면 해당 단일 폼의 비어 있지 않은 `id`와 일치해야 한다. 중복 속성, 주석 속 가짜 컨트롤, 폼 밖 컨트롤과 다른 폼 소유를 거절한다. 기존 `hidden`·`disabled`·`novalidate`·`formnovalidate` 검사도 유지한다. 형식 오류에는 지원 범위가 표시된다. 위치: `career-evaluation.ts:53,116–124`; 회귀 검사: `career-evaluation.test.ts:23`.

기존 도움 예제, 따옴표·id·라벨 문구가 다른 지원 형식, 같은 폼 id를 명시한 입력·버튼, 기존 단계별 학습 편집은 통과한다. 일반 HTML 렌더러 전체를 구현한 것은 아니다.

## 저장 호환성 확인과 보존 정책

증거: `output/0.12-core-audit/legacy-save-probes.mjs`, `legacy-save-probes.json`, `legacy-false-pass-bakery-price.json`, `legacy-false-pass-clinic-form.json`, `legacy-normal-complete.json`.

재현은 기존 `output/0.11-direct-coach/ko-cafe-save.json`에서 시작했다. `git show 445d474:...`로 읽은 실제 이전 evaluator/career/save 모듈을 사용하고, UI에서 입력 가능한 파일 내용과 동일한 accept → inspect → edit → test → deliver 액션을 실행했다. 이번 감사에서 브라우저로 다시 클릭한 기록은 아니다.

| 이전 저장 | 445d474 판정 | 0.12 호환성 적용 후 판정 |
| --- | --- | --- |
| 다섯 개/8,200원 상자로 완료한 빵집 | 전달 성공, 200 cr 지급, 이전 `readSave` 통과 | 파일·완료·보상을 보존하여 읽기·쓰기·재불러오기 통과 |
| 폼 밖 컨트롤로 완료한 예약 의뢰 | 전달 성공, 200 cr 지급, 이전 `readSave` 통과 | 파일·완료·보상을 보존하여 읽기·쓰기·재불러오기 통과 |
| 정상 의뢰 18개·1.0.0 출시·community 결말 | 이전 `readSave` 통과 | 현재 `readSave`와 `writeSave` 모두 통과 |

초기 강화 판정만 적용했을 때 두 오통과 저장은 `Delivered job files are missing or invalid`로 거절되었다. 이 결과는 `legacy-save-probes.json`에 남아 있다. 이후 채택한 정책은 **이미 전달된 의뢰의 당시 판정과 파일·완료·보상·엔딩을 그대로 보존**하는 것이다. 최상위 저장 형식 `version: 1`은 유지하고 `gameplay.career.rulesRevision`을 추가했다. `createCareer`를 통해 새 게임은 2로 시작하며, 구 저장의 누락 필드는 1로 해석한다. career 또는 gameplay 자체가 없는 더 오래된 저장의 기본값도 1이다.

`career-legacy-validation.ts`는 revision 1의 이미 완료된 두 의뢰에만 고정된 0.11 판정을 적용한다. 나머지 의뢰와 revision 2 저장은 현재 evaluator로 검증한다. 필요한 파일의 존재·20,000자 제한, 기존 HTML 활성 콘텐츠 차단 및 원래의 타입·범위 검사는 유지한다. revision 1 저장을 이어서 플레이하더라도 새 `career-test`·`career-deliver`는 항상 강화된 현재 evaluator를 사용한다. 이전에 전달한 의뢰는 중복 보상을 받지 않으며, 파일 정답화·크레딧 차감·초기화를 수행하지 않는다.

후속 증거: `legacy-save-compatibility.mjs`와 `legacy-save-compatibility.json`. 실제 세 개의 baseline 전체 저장에서 새 revision 필드 외의 모든 상태가 그대로 보존되고 읽기 → 쓰기 → 재불러오기가 통과함을 확인했다. 회귀 검사용 고정된 baseline 의뢰·출시 스냅샷은 `lib/game/fixtures/career-legacy-0.11.json`에 있다. 이 로컬 revision 필드는 저장의 규칙 계보를 나타내며 인증·서명이나 anti-cheat 경계가 아니다. 직접 저장을 편집하는 사용자를 차단한다고 주장하지 않는다.

기존 QA 저장 다섯 개도 현재 읽기와 쓰기를 통과했다. 증거: `output/0.12-core-audit/existing-save-checks.json`.

- `output/steam-qa/completed-career-save.json`: 카페 3개·후반 18개·출시 1.0.0.
- `output/0.10-qa/completed-learning-save.json`: 카페 3개·후반 18개·출시 1.0.0.
- `output/pc-qa/completed-save.json`, `output/0.11-direct-coach/ko-cafe-save.json`: 카페 3개 완료.
- `output/0.11-qa/en-lab-save.json`: CodeLab 12개 완료.

## 검증 범위

후반 evaluator·career·learning·release·새 playground·legacy validation·save·load-progress 관련 **72개 단위 검사 통과**. 원본 검사 순서 유지, 기존 18개 예제와 학습 편집 호환, 전달 게이트와 재보상 방지, 현재 증거/빌드 없는 출시 차단, 공개된 파일의 읽기 전용 보호 및 정상 저장 재불러오기를 포함한다. 새 호환성 회귀 검사 5개는 정상 historical 저장과 실제 두 오통과 완료 스냅샷의 보존, read/write, 신규 및 revision 1에서의 엄격한 전달 차단, 잘못된 revision 거절을 검증한다. 증거: `output/0.12-core-audit/compatibility-unit-tests.tap`.

CodeLab runtime·terminal·save·load-progress·delivered-files 관련 **36개 단위 검사 통과**. 실행기/테스트 파일 변조와 누락, 자료 크기·구문/실행 예산, 실제 파일/초안 일치, 실패한 자동 저장의 기존 기록 유지 등을 검사한다. 증거: `output/0.12-core-audit/lab-save-unit-tests.tap`.

검토한 경로에서 추가 호스트 코드 실행이나 새 보상 중복 지급 결함은 확인하지 못했다. 플레이어 파일을 실행하는 native Node/VM이 아니라 제한된 AST 해석기를 사용한다. 로컬 저장의 직접 편집을 막는 인증·서명은 제공하지 않으며, 결과 증거의 구조 검증을 원격 안티치트로 해석하지 않는다.

## 남은 의존성 High — braces

공식 조회 증거: `output/0.12-core-audit/braces-fresh-status.json` (2026-10-09 16:29:55 UTC / 2026-10-10 01:29:55 KST).

- npm 공식 registry의 `braces` 최신 태그는 **3.0.3**이며, 실제 설치 경로 `C:/codex-cache/codeshift-virtual/braces@3.0.3/node_modules/braces/package.json`도 같은 버전이다. 잠금 파일 위치: `pnpm-lock.yaml:2341,6375,7507`.
- GitHub 공식 [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)는 `<= 3.0.3`의 깊은 중첩 패턴에 의한 스택 고갈 DoS를 **High**로 표시하고 `first_patched_version: null`을 반환했다. 공식 npm 최신 버전도 취약 범위에 있어 버전만 바꾸는 검증된 패치는 없다. 설치·업데이트·로컬 패키지 임의 패치를 수행하지 않았다.
- 이번 부모 에이전트의 새 감사 기록 `output/0.12-qa/audit-full.json`도 High 1건·`patched_versions: null`이다. `audit-prod.json`은 취약점 0건(생산 범위 총 242개), `audit-desktop-prod.json`은 취약점 0건(prod 3개; 보고서 총 53개)이다. 전체 개발 의존성까지 0건이라고 표현할 수 없다.
- 도달 경로는 ESLint 및 Vinext 빌드의 fast-glob → micromatch → braces이다. 기존 실제 소스 추적은 `output/0.11-security/braces-reachability.json`과 `docs/security/web-review.md`의 WEB-03에 있다. 이번 검토에서 가상 게임 파일·저장·CodeLab 입력이 이 빌드용 glob 경로로 전달되는 경로를 발견하지 못했다. 비신뢰 저장소의 동적 모듈 경로/패턴을 처리하는 개발·빌드 DoS 잔여 위험이며, 운영 게임 입력의 원격 코드 실행을 확인한 것은 아니다.

코어의 두 보상 게이트 수정과 기존 완료 저장 보존은 해당 단위 범위에서 승인한다. 기존 false-pass 저장의 호환성 문제는 위 정책으로 해결했다. braces High는 알려진 잔여 취약점으로 남는다. 배포 및 Windows RC의 실제 산출물 검증은 별도 담당 작업으로 진행한다.
