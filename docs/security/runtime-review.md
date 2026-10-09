# CODE:SHIFT 0.11 RC — 플레이어 코드·저장 보안 검토

검토일: 2026-10-09. 게임 내부 AST 해석기, Lab 파일/검사/보상 연결, JSON 저장 가져오기·쓰기 경계를 독립적으로 읽고 경량 재현했다. 현재 검사 범위에서 host 실행 탈출, prototype 오염, 무한 실행 또는 반복 보상 결함을 재현하지 못했다. **오프라인 RC 진행에 대한 이 범위의 보안 차단 사항은 없다.** 이 판단은 전체 제품·Steam 심사·Electron 배포판에 대한 보안 인증이 아니다.

## 범위와 위협 모델

- 플레이어가 게임의 소스 편집기, 터미널, 입력 JSON과 저장 가져오기 기능을 통해 악의적 텍스트를 제공할 수 있다고 가정했다.
- 실제 로컬 파일·네트워크·프로세스 접근, 호스트 전역/함수 접근, prototype 오염, 무한 반복과 자료 증가를 우선 검토했다.
- 저장은 사용자가 소유하는 오프라인 JSON이다. 서버 검증, 경쟁 순위, 결제 또는 신뢰할 수 있는 학습 인증 자료로 사용하지 않는다. 운영체제/프로세스를 이미 통제하는 사용자의 치트 방지는 별도 요구사항이다.
- `lib/game/code-lab-runtime.ts`, `save.ts`, `code-lab-save.ts`, `code-lab-terminal.ts`, `code-lab-state.ts`, `engine.ts`를 검토했다. 보안 스킬의 일반 JavaScript/React 지침에서 untrusted storage와 동적 실행 경계를 적용했다. Next.js 서버 경로와 전체 UI DOM/Electron IPC 감사는 이번 담당 범위에 포함하지 않았다.

## 발견 사항과 남은 한계

### RUNTIME-001 — Low / 알려진 설계 한계: 일관된 수동 저장 위조는 인증하지 않는다

**위치:** `lib/game/code-lab-save.ts:25`, `lib/game/save.ts:30`.

검증기는 `proof.source`와 draft/seed를 비교하고, 작성된 입력·기대값과 `actual`·`passed`의 내부 일관성을 검사한다. 가져오기에서 플레이어 프로그램을 다시 실행하지 않는다. 따라서 사용자가 저장의 source/draft를 함께 바꾸고 성공 결과·완료 기록을 일관되게 작성하면 표시할 성공 기록을 수동 위조할 수 있다. fixture에서는 성공 기록의 소스를 무한 반복 함수로 함께 바꾼 저장을 받아들이는 것을 확인했다. 가져오기에서 해당 소스는 실행되지 않았고, 실제 재검사에서는 5,000 단계 제한으로 실패했으며 보상이 추가되지 않았다.

**영향:** 해당 사용자의 오프라인 진행·성공 표시를 신뢰 인증 자료로 사용할 수 없다. 호스트 실행, 다른 사용자의 데이터 접근 또는 외부 자금 손실을 재현한 것은 아니다. 일반 UI/명령을 통한 중복 보상과 별개다.

**권고:** 저장·성취·검사 기록을 인증된 학습 증명이나 치트 방지 기록으로 홍보하지 않는다. 경쟁/서버 성취가 필요해지는 경우 서버에서 실제 실행 결과와 보상 원장을 검증한다. 로컬에 비밀 키를 넣어 보호하는 방식은 이 위협 모델의 대책이 아니다. 현재 저장 호환성과 안전한 가져오기를 유지하며 알려진 한계로 수용한다.

### RUNTIME-002 — Low / 사용 경계: 외부 CommonJS 예제의 vm은 보안 샌드박스가 아니다

**위치:** `lib/game/code-lab-terminal.ts:10`, `lib/game/code-lab-terminal.ts:14`, `lib/game/code-lab-terminal.ts:105`.

`LAB_RUNNER` 문자열에는 실제 Node용 fs/vm 예제가 있지만 게임은 이 문자열을 실행하지 않는다. 게임의 `node` 처리는 알려진 가상 파일의 정확한 bytes를 확인한 뒤 `runCode()`로 전달한다. 외부 Node 예제의 100ms vm 제한은 신뢰하는 작성자 소스의 실행 제한이며, 악성 코드를 실행해도 안전하다는 보장은 없다. 코드 주석에 이 경계가 명시되어 있다.

**영향과 권고:** 다운로드·복사한 임의 플레이어 코드를 실제 Node에서 실행해도 안전하다는 출시 문구를 사용하지 않는다. 이번 검사에서 외부 Node로 실행한 코드는 기존 unit의 작성자 정답 fixture뿐이다. 새로운 공격 텍스트는 게임 해석기에만 전달했다.

### RUNTIME-003 — P2 / 수정 완료: 전체 Lab 파일 삭제 뒤 초안 fallback

**위치:** `lib/game/code-lab-terminal.ts:46`, `lib/game/code-lab-terminal.ts:66`.

초기 검토에서는 입력 JSON → 테스트 → 소스를 모두 삭제한 뒤 작업 준비 여부를 잊고 retained draft로 검사·35 cr 보상을 지급하는 결함을 재현했다. 현재는 저장되는 `lab.workspaces` 준비 기록을 사용한다. 모든 6가지 삭제 순서, 저장/재시작, 명시적 재준비, 이전 저장 호환성 검사로 회귀를 확인했다. 현재 파일이 없으면 draft/proof를 제거하고 검사·보상을 차단한다. 수정은 이번 추가 보안 감사 전에 완료되었다.

## 확인한 보호와 증거

| 경계 | 코드 위치 | 확인 결과 |
| --- | --- | --- |
| 직접 실행 탈출 | `code-lab-runtime.ts:91`, `:246`, `:306` | AST 허용 목록과 해석기만 사용한다. process/globalThis/window/document/require/fetch/eval/Function/import/new/timer 및 함수 escape 등 22개 시도가 거부됐다. 플레이어 JS를 eval/Function/vm에 넘기는 경로를 발견하지 못했다. |
| prototype·accessor | `code-lab-runtime.ts:12`, `:62`, `:162` | own data만 읽고 prototype 이름을 차단한다. 입력 getter는 호출되지 않았고 prototype-key 입력과 computed 접근/쓰기, getter 문법이 거부됐다. Object.prototype 오염이 없었다. |
| 연산·자료 제한 | `code-lab-runtime.ts:8`, `:43`, `:91`, `:231`, `:306` | 무한 반복, 배열/문자열 성장, 중복 alias 그래프, 깊은 객체/구문, 100단계 closure chain, 큰 입력/출력과 split이 제한됐다. 반환 steps는 모두 5,000 이하였다. 파서 RangeError도 예산 오류로 처리한다. |
| 입력 소유권 | `code-lab-runtime.ts:62`, `:296` | 입력을 복제한다. 플레이어 내부 변경이 원본 입력을 변경하지 않았고, closure가 데이터 결과로 반환되지 않았다. |
| malformed save | `save.ts:22`, `:30`, `:31`, `code-lab-save.ts:25` | 잘못된 JSON, 크기 초과, 중복 완료/workspace, stale source, 위조 실제값/입력, 큰 source, 변조 runner, prototype/deep proof 값 등 11종 저장이 거부됐다. 잘못된 쓰기에서 storage.setItem이 호출되지 않았다. |
| 실행과 보상 | `code-lab-terminal.ts:92`, `:105`, `code-lab-state.ts:28` | GUI/터미널 반복 검사 15회와 반례 반복 15회에서 각각 첫 보상만 지급됐다. 샘플 실행은 보상을 지급하지 않는다. |
| 가상 파일 경계 | `engine.ts:121`, `:151`, `:188` | 기존 로컬 파일·읽기 전용·크기 검사와 generated runner/test 검증을 확인했다. 알려진 test script 밖 임의 실행을 거부한다. 단위 검사에서 terminal shell operator는 전체 명령을 거부한다. |
| 로컬 작업 복귀 | `code-lab-state.ts:9` | 최신 `lab-workspace`의 `s.machine='local'`은 활성 가상 machine만 바꾼다. 서버 files/cwd/tools/processes 전체 상태가 그대로 유지됨을 fixture와 회귀 unit에서 확인했다. |

안전한 재현 스크립트는 [`runtime-probe.mjs`](../../output/0.11-security/runtime-probe.mjs), 실행 결과는 [`runtime-probe-result.json`](../../output/0.11-security/runtime-probe-result.json)에 있다. 부모 wrapper가 별도 Node worker를 128 MiB heap, 512 KiB stack, 5초 timeout으로 제한했다. **이 수치는 감사 fixture의 보호이며 배포 게임의 OS 격리 설정이라는 뜻이 아니다.** 최신 재현은 47개의 명시적 거부 검사와 별도 보상·입력복제·저장쓰기·서버보존 assertion을 통과했고 worker 자체 시간은 60ms였다. 시간은 이 개발 장비의 한 번 실행 결과이며 성능 보장은 아니다.

경량 unit 명령:

```text
node --test lib/game/code-lab-runtime.test.ts lib/game/code-lab-terminal.test.ts lib/game/code-lab.test.ts lib/game/save.test.ts lib/game/terminal.test.ts
```

**38/38 통과, 실패 0.** 이 명령에는 작성자 정답 12개 작업의 실제 Node용 generated test 비교도 포함됐다. 이 감사에서 브라우저, renderer/desktop 빌드, Steam 연결, 개인 파일·키·토큰 출력은 실행하지 않았다.

## 검토한 소스 식별

게임 소스는 공유 작업 중이므로 이 해시는 검토 당시 파일 bytes를 식별한다. 후속 변경은 다시 검토해야 한다.

| 파일 | SHA-256 |
| --- | --- |
| `code-lab-runtime.ts` | `5F2C80E2FBB738374077AF8DCDF828A80F0606AE9C72523CE49653ABF585CF4A` |
| `code-lab-terminal.ts` | `E00BEBAA37383A21B9E05EB2E3FF3D46228EE7F1E394DAA610B5ABAB2A8BF2F5` |
| `code-lab-state.ts` | `297B5D17E051144941CE6EFC725230FAB848297D65C54E2011C54491DF72A192` |
| `save.ts` | `3B93F1EDB290B7F31A90F8CE5E3A8769ABD29A9FD7F13DD34ADFBF69CBBA2E82` |
| `code-lab-save.ts` | `478EFA202447A269CD591804E758CF6463C241454CBC9A124DB6BF65F250609E` |
| `engine.ts` | `386F2A3DBE432EAB3EA68FD5959E069EEB72CE15866FA25F584871D7B738FDFF` |

## 판단의 한계와 승인 범위

지정된 입력 경계에 대한 코드 검토와 재현이며 모든 가능한 AST·하드웨어·브라우저 조합에 대한 형식 검증은 아니다. 5,000 단계/자료 크기/파서 한도는 논리적 자원 제한이고 게임 실행은 renderer에서 동기적으로 이뤄진다. 해석기의 새 구문·built-in·호스트 callback 추가는 이 경계를 다시 검토해야 한다.

현재 알려진 두 사용 한계를 문서대로 유지하는 조건에서 **지정된 runtime/save/terminal 범위의 오프라인 RC 진행은 승인 가능**하다. 자동 QA 결과가 인간 플레이 테스트, 보안 인증, 치트 방지 또는 Steam 출시 승인을 대신하지 않는다.
