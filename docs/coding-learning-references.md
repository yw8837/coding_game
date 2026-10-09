# 코딩 학습 엔진·저장소 참고 조사

2026-10-10 조사. `agent-reach`의 GitHub 경로(`gh api`)로 공개 저장소의 README, 라이선스 원문과 아래 소스를 읽었다. 검색 결과의 설명만으로 기능을 판단하지 않았다. 외부 프로젝트 설치·실행이나 학습 효과 검증은 하지 않았으며 이 문서는 도입 완료 기록이 아니다. 링크는 조사 시점 기본 브랜치의 커밋으로 고정했다. `google/blockly-games`는 현재 `blockly-games/blockly-games`로 연결된다.

**CODE:SHIFT에는 엔진을 바로 교체하기보다 결과 중심 검사를 유지하고, 수행 방식이 다른 과제를 섞고, 실행 흐름을 보여 주는 접근이 먼저 적합하다.** 현재 고객 상황 실행·Code Lab 결과 검사·반례 만들기는 이미 이 방향을 일부 구현한다. 아래 신규 제안은 그 다음 단계이며 재미·학습 효과가 개선됐다는 실측 결론은 아니다.

## 확인한 5개 프로젝트

| 프로젝트 | 실제 확인 내용 | CODE:SHIFT에 참고할 패턴 | 확인한 라이선스·주의점 |
| --- | --- | --- | --- |
| [CodeCombat Aether](https://github.com/codecombat/aether/tree/8018d3b8d7e5d7c138385f01e585c0272be7a73c) | 사용자 코드 오류 처리·실행 계측. `includeFlow`로 변수와 원본 코드 범위 기록, `includeMetrics`로 실행문·호출 수 기록, `executionLimit` 초과 중단 | “어느 조건에서 틀렸는지”를 입력·해당 코드 위치·변수 변화로 연결. 실행 횟수는 선택 최적화 피드백으로 사용 | [MIT](https://github.com/codecombat/aether/blob/8018d3b8d7e5d7c138385f01e585c0272be7a73c/LICENSE). Aether 라이선스 확인이며 CodeCombat의 레벨·그림·상표 전체를 복사할 허가로 확대하지 않는다. CoffeeScript·Esper 의존 구조를 가진 별도 시스템 |
| [JS-Interpreter](https://github.com/NeilFraser/JS-Interpreter/tree/45d00b0c86e48cca1bb3af0f711bc4c0d626c359) | ES5 해석기. `step()`과 `run()`, 명시적으로 추가하는 native API. 행 단위 데모는 AST 위치를 편집기 선택 범위에 연결 | 주문·예약·목록 함수의 한 단계 실행과 현재 행 강조. 게임 결과 API만 명시적으로 연결하는 구조 | [Apache-2.0](https://github.com/NeilFraser/JS-Interpreter/blob/45d00b0c86e48cca1bb3af0f711bc4c0d626c359/LICENSE). ES5 범위이므로 현재 게임 문법과 호환성 비교가 먼저 필요. README의 sandbox 설명을 독립 보안 검증으로 취급하지 않는다 |
| [Exercism JavaScript](https://github.com/exercism/javascript/tree/65a60cac2145e8c6549de39e807753e577a02f8d) | concept·practice 과제 분리, 해법·검사·대표 해법 파일 분리. Lasagna는 여러 정상·경계 입력의 함수 반환값 검사 | 처음 개념을 배우는 과제와 익힌 개념을 다른 상황에 적용하는 의뢰 구분. 통과 여부와 개선 제안을 분리 | [MIT](https://github.com/exercism/javascript/blob/65a60cac2145e8c6549de39e807753e577a02f8d/LICENSE). 현재 README에는 active maintainer 부재로 community contributions 중지 안내. 지원·활발한 유지보수를 전제하지 않는다 |
| [Blockly Games](https://github.com/blockly-games/blockly-games/tree/5d2ff6f39207f7ed31e3d11ba1de277c85efe4c2) | Maze 실행 기록을 캐릭터 이동으로 재생. Turtle은 그림의 alpha 결과 비교, 일부 대체 해법 허용, 마지막 단계 열린 그리기 | 값 수정 외에 이동·그리기·실행 기록 재생 같은 다른 결과 형태. 목표 결과를 제시하고 구현 경로는 일부 자유롭게 | [Apache-2.0](https://github.com/blockly-games/blockly-games/blob/5d2ff6f39207f7ed31e3d11ba1de277c85efe4c2/LICENSE). 일부 단계는 블록 수 제한으로 반복문 학습을 요구하므로 모든 해법을 무제한 허용하는 사례는 아니다. 복사 범위의 third-party 고지도 별도 확인 |
| [freeCodeCamp](https://github.com/freeCodeCamp/freeCodeCamp/tree/8c1b67142ad1e1ac58684b1599851af5e9b7dfbe) | Cash Register 과제는 고객 현금 입력→버튼 클릭→화면 메시지 검사. 사용자 이야기·테스트·초기 파일·대표 해법을 구분하고 개인 스타일 허용 | 영수증·예약 창구·최종 프로젝트의 사용자 행동 계약과 실제 화면 결과 검사. UI 스타일은 목표와 무관하면 자유롭게 | [소프트웨어 BSD-3-Clause](https://github.com/freeCodeCamp/freeCodeCamp/blob/8c1b67142ad1e1ac58684b1599851af5e9b7dfbe/LICENSE.md). **README는 `/curriculum` 학습 자료를 별도 copyright로 명시**. 과제 원문·테스트·해법 직접 재사용을 BSD 허가로 단정하지 않는다 |

## 소스에서 확인한 근거

### 1. Aether: 실행의 원인을 보여 주기

[README](https://github.com/codecombat/aether/blob/8018d3b8d7e5d7c138385f01e585c0272be7a73c/README.md)는 오류 수정과 실행 이해를 목적에 둔다. [src/interpreter.coffee](https://github.com/codecombat/aether/blob/8018d3b8d7e5d7c138385f01e585c0272be7a73c/src/interpreter.coffee)의 `updateState`는 실행문 원본 `range`, 변수 기록과 `userInfo`를 flow에 넣으며, `upgradeEvaluator`는 계측 횟수가 `executionLimit`를 넘으면 중단한다. 조사한 기본 브랜치 HEAD의 커밋 일자는 2018-06-29이므로 현대 런타임에서 바로 작동하거나 현재 적극 유지보수된다고 전제하지 않는다.

적용 제안: “할인 대상인가?” 실행에 `total=10000 → 조건=true → 반환=9000` 같은 짧은 기록을 붙이고 해당 코드 행을 함께 강조한다. 복잡한 시간 이동 디버거 전체보다 단일 입력의 흐름부터 시작한다. 실행 횟수가 적어야만 의뢰를 통과하게 만들 필요는 없다.

### 2. JS-Interpreter: 한 단계 실행과 제한된 연결

[docs.html](https://github.com/NeilFraser/JS-Interpreter/blob/45d00b0c86e48cca1bb3af0f711bc4c0d626c359/docs.html)은 기본 step이 단일 operation임을 명시하고, 반복 `step()`과 `createNativeFunction`으로 외부 API를 제공하는 예시를 보여 준다. 무한 루프에서 안전하다고 아는 경우에만 `run()`을 한 번 호출하는 예시를 제시한다. [demos/line.html](https://github.com/NeilFraser/JS-Interpreter/blob/45d00b0c86e48cca1bb3af0f711bc4c0d626c359/demos/line.html)은 `getStateStack()`의 AST `start/end`를 편집기 선택 위치에 연결한다.

적용 제안: 기존 제한 인터프리터의 단계 수 제한을 유지하면서 중간 값 관찰을 설계한다. 실제 네트워크·브라우저 객체를 학생 코드에 열 필요는 없다. 엔진 도입을 검토한다면 현재 사용하는 문법과 배열·객체·반환값 처리를 작은 호환성 목록으로 비교해야 한다. 상태 직렬화는 문서가 버전 호환을 보장하지 않으므로 현재 저장 형식의 대체로 바로 채택하지 않는다.

### 3. Exercism: 결과 통과와 학습 목표를 구분

[README](https://github.com/exercism/javascript/blob/65a60cac2145e8c6549de39e807753e577a02f8d/README.md)는 학생에게 스타일 규칙을 강요하지 않는 원칙과 concept/practice 구성을 설명한다. [Lasagna 테스트](https://github.com/exercism/javascript/blob/65a60cac2145e8c6549de39e807753e577a02f8d/exercises/concept/lasagna/lasagna.spec.js)는 `remainingMinutesInOven(25)=15`, `(40)=0`, `(0)=40` 등 결과를 검사한다. [과제 메타데이터](https://github.com/exercism/javascript/blob/65a60cac2145e8c6549de39e807753e577a02f8d/exercises/concept/lasagna/.meta/config.json)는 solution/test/exemplar 파일을 구분한다.

[Amusement Park 설계 문서](https://github.com/exercism/javascript/blob/65a60cac2145e8c6549de39e807753e577a02f8d/exercises/concept/amusement-park/.meta/design.md)는 학습 목표·범위 밖·선행 개념과 analyzer 제안을 구분한다. 축약하지 않은 객체 속성 표기는 허용하면서 정보성 피드백을 주자는 제안이 있지만, 특정 연습은 `??`·optional chaining 사용을 요구하자는 제안도 있다. **설계 문서의 analyzer 제안이 실제 배포된 검사임을 확인한 것은 아니다.**

적용 제안: 사업 의뢰는 동작이 맞으면 다른 구현도 통과시키고, 특정 문법을 익히는 선택 연습은 그 목적을 미리 알려 준다. “더 짧게 쓸 수 있어요”를 실패 이유로 쓰지 않는다. `입력→기대 결과` 계약과 대표 해법을 별도 데이터로 둔다.

### 4. Blockly Games: 같은 목표, 다른 구현·결과 형태

[Maze main.js](https://github.com/blockly-games/blockly-games/blob/5d2ff6f39207f7ed31e3d11ba1de277c85efe4c2/appengine/maze/src/main.js)의 `execute`는 interpreter에 10,000 tick 제한을 두고 동작 `log`를 기록한다. 실행 뒤 초기 상태로 돌아가 동작 기록을 애니메이션하고 블록을 강조한다. 이 tick 수는 프로젝트 전용 값이며 CODE:SHIFT에 그대로 복사할 설정 근거는 아니다.

[Turtle main.js](https://github.com/blockly-games/blockly-games/blob/5d2ff6f39207f7ed31e3d11ba1de277c85efe4c2/appengine/turtle/src/main.js)의 `checkAnswer`는 소스 동일성을 보지 않고 그림 alpha 값을 비교한다. `isCorrect`에는 level 8/9의 대체 해법을 허용하는 오차 기준이 있으며 마지막 레벨은 열린 그리기다. 일부 초기 레벨은 블록 개수 제한도 적용한다. 조사한 기본 브랜치 HEAD의 커밋 일자는 2024-05-13이며 현재 Blockly 라이브러리와 그대로 호환되는지 실행 검증하지 않았다.

적용 제안: 반복되는 텍스트 값 수정 사이에 안내판 배치, 배달 경로, 주문 처리 순서처럼 결과를 직접 볼 수 있는 짧은 과제를 섞는다. UI 배치는 픽셀 완전 일치보다 읽힘·화면 안 배치 같은 의미 있는 조건으로 평가한다. 블록 UI 도입이나 외부 그림 가져오기는 별도 결정이다.

### 5. freeCodeCamp: 사용자의 행동으로 프로젝트 검사

[Cash Register 과제](https://github.com/freeCodeCamp/freeCodeCamp/blob/8c1b67142ad1e1ac58684b1599851af5e9b7dfbe/curriculum/challenges/english/blocks/build-a-cash-register-project/657bdcc3a322aae1eac38392.md)는 `--description--`, `--hints--`의 테스트, `--seed--`, `--solutions--`를 분리한다. 테스트는 지정 DOM 입력에 값을 넣고 버튼을 눌러 메시지를 확인한다. 특정 input/button ID와 결과 계약은 요구하지만 모든 구현 코드가 대표 해법과 같아야 하는 방식은 아니다. 고정 사례 외에 생성한 현금·가격 사례도 포함한다.

적용 제안: 최종 프로젝트 검사를 “문자열 몇 개를 포함하는가”만으로 끝내지 않고 고객 행동과 화면 결과로 연결한다. CODE:SHIFT에서는 재현 가능한 seed를 남기고 실패한 입력을 그대로 다시 실행할 수 있게 한다. [README 라이선스 구분](https://github.com/freeCodeCamp/freeCodeCamp/blob/8c1b67142ad1e1ac58684b1599851af5e9b7dfbe/README.md#license)에 따라 이 과제의 문장·테스트·대표 해법은 복사하지 않고 자체 고객 이야기와 검사를 작성한다.

## 현재 게임에 맞춘 다음 검토

현재 소스에서 [고객 상황 실행](../components/game/CareerPlayground.tsx)은 상황별 기대/실제 결과를 보여 주고 파일 변경 후 실행 결과를 오래된 것으로 처리한다. [시나리오 목록](../lib/game/career-playground.ts)은 전달 검사와 같은 bounded evaluator의 실제 case를 사용한다. [Code Lab](../lib/game/code-lab.ts)은 입력별 반환값을 검사하며 mutant에 반례를 만드는 추가 도전을 제공한다. [화면](../components/game/CodeLab.tsx)에는 정상 풀이와 반례 도전이 따로 있다. 이 기능들은 새 제안으로 중복 구현할 대상이 아니다. 브라우저에서 실제 동작·학습 효과를 재검증한 결과는 아니다.

| 우선순위 | 다음 검토 제안 | 완료 기준 |
| --- | --- | --- |
| 1 | 자유 구현을 허용하는 의뢰에서 서로 다른 올바른 코드 수용 범위를 확인 | 지원 문법 안의 구조가 다른 해법 2개 통과, 경계값에서 틀린 해법 실패. 특정 문법 요구는 선택 연습에 명시 |
| 2 | 고객 과제를 “고치기 → 반례 만들기 → 처음부터 구성하기”로 교차 배치 | 단순 수치 변경만 연속되지 않으며 각 과제의 사용자 행동·출력 형태가 구별됨. 기존 반례 기능 재사용 |
| 3 | 짧은 실행 기록을 현재 행과 연결 | 한 입력에서 조건·중간 값·반환 결과를 설명하고 단계 제한 적용. 코드 변경 후 이전 기록을 최신으로 표시하지 않음 |
| 4 | 완성한 결과물을 이후 의뢰에서 다시 사용 | 플레이어가 이전에 만든 파일·기능이 다음 고객 화면에 실제로 반영됨. 장식적 완료 메시지만 추가하지 않음 |

엔진 채택은 위 설계의 필요가 확인된 뒤 판단한다. MIT는 저작권·허가문을, Apache-2.0은 라이선스·수정 고지·해당 NOTICE를, BSD-3-Clause는 저작권·조건·면책문을 보존해야 한다. 의존 패키지·자료·이미지·브랜드는 저장소 최상위 라이선스만으로 재사용 범위를 확정하지 않는다. 이번 조사에서는 외부 코드나 콘텐츠를 제품에 복사하지 않았다.

`agent-reach check-update` 결과는 v1.5.0 최신 상태였다. 유료 API·Elice·외부 설치를 사용하지 않았다.
