# CODE:SHIFT 0.11 웹 보안 검토

검토일: 2026-10-09. 범위: `components/game`, `app` 라우트, `tools/playtest`, 미리보기 iframe·HTML 처리, 편집기·가져오기·로컬 저장, React/Vite/Sites 경계. 게임 엔진·Electron IPC·의존성 전체 감사는 다른 담당자의 별도 결과와 함께 판단해야 한다.

확정한 문제는 플레이테스트 기록 도구의 크기 한도 불일치 1건(Medium, 로컬 기록의 가용성·이식성)이었으며 수정했다. 검사한 Chromium 경로에서 저장 가져오기를 통한 상위 문서 XSS, 미리보기 스크립트 실행, 미리보기의 외부 요청 또는 연습 코드의 호스트 접근은 재현되지 않았다. 이것은 전체 브라우저·모든 입력에 대한 무취약성 보장이 아니다. 운영 웹 응답 헤더는 배포 계층에서 확인해야 하며, `braces`의 미패치 의존성 경고는 별도 잔여 위험으로 남는다.

## 실제 구조와 신뢰 경계

- 웹은 Next.js 형식의 App Router 파일을 사용하지만 실제 개발·Sites 빌드는 `vite.config.ts`의 vinext·Cloudflare Vite 플러그인을 거친다. `build/sites-worker.ts:26`이 vinext fetch handler로 요청을 전달한다. 일반적인 Next.js Node 서버 설정만 적용됐다고 가정하지 않았다.
- 앱 라우트는 `/`, `/about`, `/about/en`, `/about/ja`의 페이지다. 검토 범위에서 게임 상태를 서버에 저장하는 Route Handler·Server Action·업로드 API를 찾지 못했다. 게임 속 주소창·터미널·API 호출은 `GameState`의 가상 파일·로컬 시뮬레이션을 사용한다. 가상 `curl`, `ssh`, `npm`, `node`를 운영체제 명령 실행이나 SSRF로 분류하지 않았다.
- 사용자가 편집·가져온 문자열은 비신뢰 입력이다. 게임 진행·파일명·터미널 출력·메모·최근 작업은 JSX 텍스트 또는 textarea 값으로 표시된다. 플레이테스트 도구는 `textContent`, `createElement`, `replaceChildren`을 사용한다.
- `app/chatgpt-auth.ts`는 Sites 인증 헤더를 신뢰하는 유틸리티지만 현재 게임 페이지에서 호출하지 않는다. `build/sites-vite-plugin.ts`의 로컬 mock 인증은 개발 configureServer 안에서만 작동하며 loopback Host·remoteAddress 검증, 사용자 인증 헤더 제거, 상대 return URL 검사, SameSite·HttpOnly cookie 처리가 있다. 실제 운영 프록시의 인증 헤더 제거 정책은 이 소스 검토만으로 입증하지 않았다.

## WEB-01 — Medium — 기록 크기 불일치로 자체 백업을 읽지 못함 (수정)

**관련 규칙:** JS-STORAGE-001, REACT-FILE-001, 런타임 입력·크기 제한의 일관성.

**위치:** `tools/playtest/data.js:11,27,30,31,35,36`, `tools/playtest/kit.js:10,13,14,20,24,26`.

**수정 전 근거:** `validate`는 세션 최대 100개와 각 메모 최대 2,000자만 확인했다. JSON·CSV 내보내기와 저장은 전체 크기를 제한하지 않았고, JSON·CSV 파서는 2,000,000 **문자**, 파일 가져오기는 2,000,000 **바이트**를 제한했다. 기존 `collect()`는 검증 전에 활성 기록을 직접 수정했다.

**안전한 재현:** 실제 참가자나 실제 localStorage를 사용하지 않은 메모리 합성 기록으로 확인했다.

| 합성 입력 | 수정 전 검증 | JSON 크기 | 수정 전 다시 읽기 |
| --- | --- | --- | --- |
| 48개 기록, 각 허용 메모를 ASCII로 채움 | 통과 | 2,165,296자 / 바이트 | 자체 JSON·CSV 파서에서 거부 |
| 20개 기록, 각 허용 메모를 한국어로 채움 | 통과 | 902,216자 / UTF-8 2,662,216바이트 | JSON 파서는 통과하지만 실제 파일 크기 검사에서 거부 |

**영향·도달 조건:** 로컬 기록을 많이 작성하거나 큰 기록을 가져온 사용자가 자기 백업을 다시 가져오지 못하거나, 재접속 시 저장된 보고서를 읽지 못할 수 있었다. 원격 코드 실행이나 데이터 외부 전송은 아니다. 기존 원본 localStorage 값은 실패 시 삭제되지 않지만 UI에서 읽는 데 실패하므로 기록의 가용성 문제가 된다.

**적용한 수정:**

1. UTF-8 기준 2,000,000바이트를 정상 보고서 검증·저장·파일 가져오기·JSON/CSV 파싱에 공통 적용했다. 한글·일본어·emoji·잘못 짝지어진 surrogate의 바이트 계산을 검증했다.
2. JSON의 들여쓰기 때문에 한도를 넘으면 동일한 데이터를 compact JSON으로 내보낸다. CSV가 반복된 세션 정보 때문에 한도를 넘으면 내보내기를 거부하고 JSON 사용 안내를 보여준다. 성공한 내보내기 파일은 같은 형식으로 다시 읽을 수 있어야 한다.
3. UI 편집은 복사한 후보 보고서에서 검증한 다음 마지막 유효 보고서에 반영한다. 전체 크기 초과 입력은 화면 값도 되돌리고 이전 저장을 보존한다. 참가자 코드 입력 중 `Q`처럼 일시적으로 형식이 미완성인 값은 계속 편집할 수 있으며 저장된 보고서를 오염시키지 않는다.
4. 가져오기의 잘못된 파일·중복 ID 충돌·합친 보고서의 크기 초과는 기존 보고서 대체 전에 거부한다.

**검증:** `node --test tools/playtest/data.test.cjs` **7/7 통과**. 실제 `kit.js`를 최소 DOM·Storage 모델에서 실행하여 크기 초과 편집의 rollback, 저장 호출 없음, 기존 값 보존 및 부분 코드 입력 후 정상 복구를 확인했다. 브라우저 E2E는 main 담당자가 별도로 실행한다.

**한계·기존 파일:** 이전 버전에서 이미 만든 한도 초과 원본을 자동 변환·분할하거나 삭제하지 않는다. 그러한 원본은 여전히 정상 2MB 가져오기로 읽을 수 없으며 별도 보관·분할이 필요하다. 새 검증은 이후에 재읽기 불가능한 정상 보고서를 만드는 경로를 차단한다. localStorage 자체가 비활성화됐거나 여유 용량이 없으면 계속 메모리 모드와 JSON 백업 안내를 사용한다.

증거: `output/0.11-security/web-source-probes-before.json`, 수정 후 `web-source-probes.json`, `tools/playtest/data.test.cjs`.

## 미리보기·XSS 검사 결과

**위치:** `lib/game/preview.ts:7-19,25`, `components/game/Browser.tsx:65`, `app/about/AboutPage.tsx:102`.

- 미리보기 생성기는 script·iframe·object·embed·link·meta·base·form 등의 요소와 이벤트·URL 속성을 제거한다. CSS의 `</style` 종료 문자열을 이스케이프한다.
- 최종 iframe은 `sandbox="allow-same-origin"`을 사용하며 **allow-scripts 권한은 없다**. 부모가 DOM을 측정하고 주문 버튼에 기능 콜백을 연결하기 위해 same-origin 접근이 필요하다. same-origin과 script 권한을 동시에 주는 위험한 조합으로 오판하지 않았다.
- iframe 문서는 `default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; form-action 'none'; base-uri 'none'` CSP를 먼저 둔다. 여기의 unsafe-inline은 사용자가 수정하는 CSS를 위한 **style-src**이며 script-src 허용이 아니다.
- JSON-LD의 유일한 app HTML 삽입은 정적 about 콘텐츠를 직렬화하며 `<`를 `\\u003c`로 치환한다. 파일·기록 데이터가 이 sink로 흐르는 경로를 찾지 못했다.
- CodeLab의 실제 UI에 무한 반복, `globalThis`, `input.constructor`를 입력했다. 각각 budget·unsupported 오류로 종료했고 보상을 주지 않았다. 이후 정상 영수증 수정은 통과하고 실제 +35 cr을 지급했다. `code-lab-terminal.ts`에 보이는 `vm.runInNewContext`는 가상 파일 템플릿 문자열이며 웹에서 그 사용자 코드를 native VM으로 실행하는 호출 경로가 아니다.

### DOMParser 선행 리소스 요청 후보: 현재 Chromium에서는 미재현

HTML이 `DOMParser.parseFromString`에서 먼저 파싱된 후 URL 속성이 제거되는 점을 검토했다. 비활성 DOM 파싱에서도 일부 브라우저의 리소스 다운로드가 가능하다는 플랫폼 설명 때문에, iframe CSP만으로 파싱 전 단계까지 보호된다고 가정하지 않았다.

`tests/e2e/web-security.py`는 정상 엔진 상태를 실제 저장 가져오기 UI로 불러오고, 실제 `index.html`에 img·iframe·script·javascript URL payload를 넣어 미리보기를 열었다. 리소스 probe는 모두 `127.0.0.1:1`이고 route handler가 연결 전에 abort하도록 구성했다. main 담당자의 Chromium 실행 보고서에서 다음을 직접 확인했다.

- `parserProbeRequests=[]`, `blockedOutbound=[]`, `pageErrors=[]`.
- 최종 preview DOM의 script·iframe 개수 0, URL·onerror 속성 개수 0.
- 상위 문서 스크립트 marker 미실행, 최근 작업의 HTML 문자열은 텍스트로만 표시됨.

따라서 이 후보를 확인된 취약점으로 집계하지 않는다. 관찰은 iframe DOM 준비 신호 후 제한된 750ms 구간과 현재 Chromium에 해당한다. Firefox·WebKit, 모든 active HTML 변종·mXSS·CSS 리소스 변종을 검증한 것은 아니다. 미리보기 sanitizer는 자체 구현이므로 향후 허용 요소를 확대할 때 검토·브라우저별 회귀 검사가 필요하다.

## 잔여 위험·운영 확인 사항

### WEB-02 — Low / 운영 설정 확인 — 웹 셸 보안 헤더의 배포 증거가 소스에 없음

**관련 규칙:** REACT-HEADERS-001, REACT-CSP-001, NEXT-HEADERS-001.

`next.config.ts`는 별도 헤더 설정이 없고, `app/layout.tsx`는 웹 셸 CSP meta를 제공하지 않으며, `build/sites-worker.ts:26`은 fetch handler 응답을 그대로 전달한다. iframe과 standalone playtest의 meta CSP가 웹 셸 응답 전체의 CSP·frame-ancestors·nosniff·Referrer-Policy를 입증하지는 않는다.

이는 CDN/Sites 배포 계층에 헤더가 **없다는 증거가 아니다**. 운영 HTTPS 응답 헤더·배포 설정을 확인해야 한다. 실서비스 iframe 포함이 제품 요구인 경우 frame-ancestors는 그 요구와 맞는 정확한 origin 정책을 사용해야 한다. vinext/RSC의 필요한 inline script에 nonce/hash를 전달하지 않고 무작정 CSP를 강화하면 서비스가 깨질 수 있어 이번 감사에서 운영 설정을 임의 변경하지 않았다.

부모 담당이 보안 확인용 read-only HTTP HEAD를 운영 주소에 보냈으나 403 응답을 받았다. 오류/edge 응답의 헤더를 정상 게임 응답 정책으로 취급하지 않았다. 따라서 운영 웹 셸 헤더는 미확인으로 남는다. 로컬 renderer/iframe CSP 검사와 공개 배포 서비스의 성공 상태는 이 항목의 대체 증거가 아니다. 기록: `output/0.11-security/public-headers-before.json`.

### WEB-03 — 잔여 의존성 High 경고 / 현재 운영 입력 경로 미확인 — braces 3.0.3

main의 의존성 갱신 뒤 감사에 남은 `GHSA-vfj7-8cjw-p6xm` 경고에 대해 설치된 실제 소스를 추적했다. 취약성을 유발하는 대량 brace 패턴은 실행하지 않았다.

| 소스 경로 | 실제 사용 |
| --- | --- |
| vinext `dist/index.js:108,1022` | Vite CommonJS 변환 플러그인 등록 |
| vite-plugin-commonjs 0.10.4 `DynaimcRequire.generateRuntime` | 모듈 소스의 동적 require AST를 globFiles로 전달 |
| vite-plugin-dynamic-import 1.6.0 `dist/index.js:478-519` | import AST·저장소 importer 경로로 fileGlobs를 생성하고 fastGlob.sync 수행 |
| fast-glob 3.3.3 `out/managers/tasks.js:18-29` | build/development 패턴의 braceExpansion 처리 |
| fast-glob `out/utils/pattern.js:137` | micromatch.braces(pattern, {expand:true}) |
| micromatch 4.0.8 `index.js:456` | braces 3.0.3 호출 |

검토한 앱에서는 게임 파일을 RAM의 가상 파일 객체에 저장하고 별도 AST 해석기로 처리한다. 저장 가져오기·주소창·최근 파일·연습 코드가 빌드 서버의 파일 또는 glob 인수로 들어가는 경로를 확인하지 못했다. ESLint의 glob 사용도 개발자 작업이다. 현재 생산 Sites `dist/server` JavaScript 검색에서 fast-glob·micromatch·braceExpand·DynaimcRequire 문자열이 발견되지 않았으나, 문자열 검색만으로 완전한 제거를 증명하지는 않는다.

즉, 라이브 게임 입력으로 현재 도달하는 원격 서비스 취약점은 확인하지 못했지만, 개발·빌드가 비신뢰 저장소 소스·모듈 경로를 처리하는 경우의 DoS 가능성과 미패치 패키지 자체 경고는 남는다. 공개 Vite 개발 서버를 운영 서비스로 쓰지 말고, 향후 패치 또는 플러그인 대체를 추적해야 한다. 경고 수를 0이라고 보고해서는 안 된다. 소스 근거: `output/0.11-security/braces-reachability.json`.

### 로컬 저장의 환경 제한

게임 저장은 `lib/game/save.ts:22,30-37`의 최대 4,000,000 UTF-16 문자와 schema·게임 증거 검증을 사용하고, `SaveTools.tsx:13`은 읽기 전에 파일 16MiB 제한을 검사한다. 이는 Unicode 저장을 그대로 옮길 수 있는 충분한 파일 상한이며 플레이테스트의 이전 문자/바이트 불일치와 동일한 문제는 아니다. 다만 브라우저별 localStorage 남은 quota까지 보장하지 않는다. `GameShell.tsx:63-65`는 실패 시 saved=false를 표시하고 손상된 기존 저장을 자동 덮어쓰지 않도록 차단한다. 큰 저장의 quota 실패는 백업 안내와 함께 다뤄야 하며 성공적으로 지속 저장됐다는 의미로 과장하지 않는다.

## 검증·제한

- 이 감사 담당자는 소스 읽기와 안전한 메모리 fixture·unit만 실행했다. 브라우저는 main 담당자가 독점 실행했고, 최종 `output/0.11-security/web-security-report.json` 원본을 읽어 위 결과를 확인했다.
- 웹 UI harness: malformed JSON 및 16MiB+1 파일 거부/이전 저장 보존, 저장에 포함된 history HTML 텍스트 처리, 실제 preview payload, interpreter 실패 후 정상 복구. 최종 보고서 `final.passed=true`.
- 플레이테스트 경량 회귀: 7/7 통과. 수정 후 main이 `tests/e2e/playtest-kit.py`를 다시 실행해 file URL·기록 복원·JSON/CSV·잘못된 가져오기 후 보존·390px·외부 요청 없음도 통과했다. 크기 초과 rollback은 실제 kit.js를 실행하는 VM DOM harness로 검사했다. 증거는 `output/playtest-kit-qa/report.json` 및 `output/0.11-security/playtest-ui.log`다.
- 검토에 사용한 지침: `security-best-practices/SKILL.md`, `javascript-general-web-frontend-security.md`, `javascript-typescript-react-web-frontend-security.md`, `javascript-typescript-nextjs-web-server-security.md`. 적용은 실제 React/vinext/Sites 구조에 맞췄다.
- 실제 개인정보·참가자 기록·게임 저장을 변경하지 않았다. 합성 데이터는 사용자 학습 성과나 독립 플레이테스트 증거로 계산하지 않는다. 운영 배포 헤더, 모든 브라우저, 공격 라이브러리 전체 payload corpus, Electron native 경계, 의존성 전체 무취약성까지 보장하는 감사는 아니다.
