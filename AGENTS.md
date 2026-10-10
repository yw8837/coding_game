# AGENTS.md — AI 협업 공통 지침 (Codex · Claude 공용)

CODE:SHIFT는 코딩 입문자가 가상 PC에서 고객 의뢰를 해결하는 Steam PC용 게임입니다. 개요는 [README.md](README.md)를 참고하세요.

## 환경
- Node 22.13 이상, pnpm(`package.json`의 `packageManager`에 고정)
- 설치: `pnpm install --frozen-lockfile`
- D: exFAT 볼륨은 pnpm 링크 제약이 있습니다. 로컬 작업은 링크를 지원하는 경로에서 실행하세요.

## 변경 전후 반드시 실행
| 명령 | 용도 |
| --- | --- |
| `pnpm verify` | lint + typecheck + 게임/데스크톱 단위 테스트 (최종 게이트) |
| `pnpm test` | `lib/game/*.test.ts` 단위 테스트 |
| `pnpm typecheck` / `pnpm lint` | 타입 / 린트 (경고 0개 유지) |

`pnpm verify`가 통과하지 않은 변경은 완료로 보고하지 마세요.

## 코드 지도
- `lib/game/engine.ts`, `content.ts` — 명령·파일·Git·서버·API 판정, 의뢰와 보상
- `lib/game/workflow.ts`, `setup.ts` — 다음 작업 계산과 준비 동작
- `lib/game/practice.ts` — 규칙 연습 문제
- `lib/game/preview.ts`, `save.ts` — 미리보기 측정, 저장 스키마
- `components/game` — UI (타이틀, 바탕화면, 창, 개발 도구, 엔딩)
- `desktop/` — Windows 오프라인 실행판

## 규칙
- 설계 기준은 [GAME-DESIGN.md](GAME-DESIGN.md), [docs/spec.md](docs/spec.md), 검토 기준은 [REVIEW.md](REVIEW.md)를 따릅니다.
- 저장 키 `codeshift-intro-demo-v1` 호환성을 깨지 마세요. 새 필드는 기본값으로 채웁니다.
- 한국어/English/日本語 세 언어 문자열을 함께 갱신합니다.
- 게임 내 터미널·Git·서버는 가상입니다. 플레이어 코드를 호스트에서 실행하는 기능을 추가하지 마세요. NPC는 외부 AI/LLM을 호출하지 않습니다.
- 검증하지 않은 것(실제 플레이 재미, Steam 심사, 서명 등)을 완료로 주장하지 마세요.

## 협업 방식 (Codex ↔ Claude)
- 작업 단위는 GitHub Issue 하나 = PR 하나. 브랜치 이름: `codex/<주제>`, `claude/<주제>`.
- 한 AI가 만든 PR은 다른 AI가 리뷰합니다. 최종 머지는 사람이 합니다.
- PR 설명에 변경 이유, 실행한 검증 명령과 결과를 적습니다.
- 서로의 열린 브랜치를 직접 수정하지 말고 리뷰 댓글로 제안합니다.
