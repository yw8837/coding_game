# CODE:SHIFT 0.11 RC — ESLint 도구 복구와 최종 상태

2026-10-09. ESLint 9.39.4와 eslint-config-next 16.3.8의 parser 로딩 오류를 해결했다. 최종 검사는 **231개 파일, 오류 0개, fatal 0개, 경고 68개, exit 0**이다. 경고는 유지했다. 소스의 동작을 바꾸는 대규모 effect 재작성이나 React/TypeScript 전체 규칙 비활성화는 하지 않았다.

## 원인과 해결

단일 파일 `lib/game/code-lab-state.ts`에서도 `Cannot find module 'next/dist/compiled/babel/eslint-parser'`를 재현했다. 실제 설치된 Next 16.3.8에는 해당 parser 파일과 `next/babel`이 존재했다. `createRequire()`로 비교하면 프로젝트 위치에서는 둘 다 해석되고, pnpm의 격리된 eslint-config-next 위치에서는 둘 다 해석되지 않았다.

eslint-config-next의 `dist/parser.js`는 Next parser를 require하지만 해당 패키지의 dependency/peer metadata에 Next가 없다. 따라서 외부 virtual store를 쓰는 strict pnpm 설치에서 그 연결이 없다. Next 버전을 다시 바꾸거나 공식 lint 규칙을 복사하는 것으로 해결할 문제가 아니었다.

부모 에이전트가 소유한 `pnpm-workspace.yaml`에 다음 metadata 보완을 적용하고 기존 store/virtual-store 경로로 lock/install을 갱신했다. 새로운 패키지나 버전은 추가하지 않았다.

```yaml
packageExtensions:
  eslint-config-next@16.3.8:
    peerDependencies:
      next: 16.3.8
```

복구 후 프로젝트의 일반 ESLint 실행은 임시 NODE_PATH, module loader hook, 캐시 패치 없이 성공한다. `eslint.config.mjs`는 공식 `core-web-vitals`와 `typescript` 설정을 계속 사용한다.

## 검사 범위를 바로잡은 설정

- 생성된 `desktop/renderer/**`와 `output/**`만 global ignore에 추가했다. 원본 React/TypeScript, Electron 소스와 작성한 스크립트는 검사한다.
- Electron main/preload와 Node fixture의 `.cjs`는 의도적으로 CommonJS를 사용한다. `@typescript-eslint/no-require-imports` 예외를 `.cjs`에만 적용했다. TypeScript/React 파일에서는 같은 규칙이 계속 오류 수준으로 활성화된다.
- 기존 shadcn vendored 파일 예외는 유지했다. 새로운 일반 React/TypeScript 전역 예외는 추가하지 않았다.

## 이전 baseline과 소스 수정

임시 NODE_PATH를 진단용 자식 프로세스에만 지정했을 때 최초 전체 검사 결과는 오류 122개, 경고 1,727개였다. 생성된 renderer bundle과 QA artifact, 의도된 CommonJS import 오류를 구분한 작성 소스 baseline은 **오류 30개, 경고 68개**였다. 원본 baseline은 [`lint-source-baseline.json`](../../output/0.11-security/lint-source-baseline.json)에 남아 있다.

| 작성 소스 baseline 오류 | 수 | 처리 |
| --- | ---: | --- |
| `prefer-const` | 5 | `code-lab-terminal.test.ts`, `engine.test.ts`, `setup.test.ts`에서 재할당하지 않는 선언만 const로 수정했다. |
| JSX의 unescaped quote | 4 | `Browser.tsx`의 commit 예제와 `CodeLab.tsx`의 property 예제에 `&quot;`를 사용했다. 화면의 따옴표와 복사할 내용은 동일하다. |
| CareerView의 선언 전 setter 참조 | 1 | `toolsRequest` effect를 state 선언 뒤로 옮겼다. Hook 실행 때의 실제 TDZ를 재현한 것은 아니며, effect는 초기화 후 실행한다. 선언 의존 순서를 명확하게 정리했다. |
| native home anchor | 2 | `AboutPage.tsx`의 게임 복귀는 전체 document navigation을 의도하므로 두 anchor 줄에만 설명과 해당 Next rule 예외를 넣었다. Vinext shim과 실제 Next 구성 양쪽에서 의도를 보존한다. |
| effect 내부 동기 setter | 18 | 외부 이벤트·파일/저장 상태와 local UI를 맞추는 의도를 각 줄에 명시하고 해당 줄만 예외를 적용했다. 목록은 아래와 같다. |

최종 JSON에는 설명이 있는 **20개 suppressed message**가 그대로 기록된다. 18개 setter와 2개 anchor를 제외한 곳에서는 해당 규칙이 활성화되어 있다.

## 국소 effect 예외의 근거

다음은 source 검토에서 확인한 외부 트리거와 보존할 동작이다. 소스상 state-dependent feedback loop를 발견하지 못했다는 판단이며, 모든 시간 순서에 대한 형식 검증이나 별도 UI regression 실행을 뜻하지 않는다.

| 파일/컴포넌트 | 외부 트리거와 의도 |
| --- | --- |
| `Activities.tsx` / MessagesView | mission 전환 때 새 고객 메시지를 한 번 선택한다. 이후 수동 메시지 선택을 보존한다. |
| `Browser.tsx` / BrowserView | 외부 URL 이동을 편집 가능한 주소와 세션 탐색 기록에 반영한다. history 자체를 effect 트리거로 만들지 않는다. |
| `Browser.tsx` / CatHubView | 외부 URL의 tab 요청을 반영하고 요청 사이의 수동 탭 선택을 보존한다. |
| `Browser.tsx` / CafePreview | 실행 중인 가상 서버의 언어/source snapshot을 iframe에 전달하고 마지막 제공 문서를 유지한다. |
| `CafeCoach.tsx` | 외부 lesson stage 전환에서 이전 입력·오류·힌트를 초기화하고 새 단계에 focus한다. |
| `CareerView.tsx` / tools request | 부모의 일회성 request token으로 Tools를 열고, 그 뒤 사용자의 탐색을 보존한다. |
| `CareerView.tsx` / focus request | 부모의 focus token으로 현재 의뢰를 선택하고 목록을 닫는다. |
| `CareerView.tsx` / current job | 외부에서 새 의뢰를 수락하면 그 ID를 선택한다. ID 변경 사이의 사용자 탐색을 보존한다. |
| `CareerView.tsx` / file request | 검증된 외부 파일 열기 요청에 맞춰 의뢰·파일·code mode·tab을 함께 선택한다. |
| `DesktopOS.tsx` / Notepad | SSR 후 client mount에서 localStorage 메모를 복원하고 저장소 접근 오류를 기록한다. |
| `Editor.tsx` / mission | 외부 mission 전환에서 정해진 파일을 선택하고 해당 mission 내 수동 선택을 보존한다. |
| `Editor.tsx` / editor target | 외부 editor 열기 요청을 반영하고 explorer의 사용자 선택을 보존한다. |
| `Editor.tsx` / file list | 외부 파일 삭제/이동 후 없어진 선택 파일을 기존 파일로 바꾼다. |
| `ReleaseLearning.tsx` | 외부 검사 단계가 바뀌면 이전 입력·힌트·오류를 초기화한다. |
| `ReleaseProject.tsx` | source snapshot이 바뀌면 이전 iframe load·가상 요청 처리 표시를 무효화한다. |
| `StartScreen.tsx` | client hydration 완료를 표시하고 첫 focus를 예약한다. SSR에서는 Start가 비활성이다. |
| `Terminal.tsx` | 부모 command queue를 편집 가능한 입력에 전달하고 소비·focus한다. 명령을 자동 실행하지 않는다. |
| `VirtualFileEditor.tsx` | 외부 절대 경로/token 요청을 선택 파일과 notice에 반영하고 수동 sibling 선택을 보존한다. |

## 검증과 남은 경고

최종 lint 명령은 다음과 같으며 exit 0을 확인했다. 이 명령은 package.json의 lint 명령에 JSON 출력만 추가한다.

```text
node node_modules/eslint/bin/eslint.js . --ignore-pattern dist --ignore-pattern .next --format json --output-file output/0.11-security/lint-final.json
```

[`lint-final.json`](../../output/0.11-security/lint-final.json)의 남은 경고:

| 규칙 | 경고 수 |
| --- | ---: |
| `@typescript-eslint/no-unused-vars` | 48 |
| `react-hooks/exhaustive-deps` | 14 |
| `@next/next/no-img-element` | 5 |
| `@typescript-eslint/no-unused-expressions` | 1 |

이 68개 경고는 이번 도구 복구에서 일괄 삭제하거나 비활성화하지 않았다. 특히 dependency warning의 개별 동작 검토와 asset 정책은 후속 개선 범위다. lint exit 0이 warning 해결이나 모든 runtime 동작 검증을 뜻하지 않는다.

[`scripts/lint-config-check.mjs`](../../scripts/lint-config-check.mjs)는 실제 config를 로드해 Next JSX와 TypeScript를 파싱하고, 잘못된 conditional hook과 `any`가 여전히 오류를 내는지 확인한다. CommonJS 예외 범위와 generated-output ignore도 확인한다. 이 helper는 애플리케이션·브라우저를 실행하거나 파일을 수정하지 않는다.

- `node scripts/lint-config-check.mjs`: 통과.
- `node node_modules/typescript/bin/tsc --noEmit`: 통과.
- `npm test`: 루트 **169/169 통과**, 실패 0.
- 이 담당 작업에서는 브라우저·renderer/desktop 빌드·native E2E·Git 커밋을 실행하지 않았다. 소스는 동결했으며, 부모 에이전트가 전체 browser/native 회귀를 진행한다.
