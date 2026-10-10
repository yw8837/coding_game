# AI Tech Studio MCP: quest guidance and learning feedback

Research date: 2026-10-10. This document records actual MCP research and proposed adaptations; it does not claim these proposals are implemented or establish learning outcomes.

## Connection and receipts

The installed `ai-techstudio` endpoint is `https://ai-techstudio.web.app/mcp`. No native AI Tech Studio tool namespace was available in this chat, so research used the server's public JSON-RPC interface directly. `initialize` with protocol `2025-03-26` and `tools/list` returned HTTP 200. The response identified `serverInfo.name = ai-techstudio`, version `1.0.0`, and exposed `search_techniques`, `get_technique`, categories and recipes. Nine generic keyword searches and four full `get_technique` calls also returned HTTP 200 with text results. No project source, player data or credentials were transmitted.

Raw request/status/response receipts and extracted full technique documents are in `output/reference-strengthening-20261010/techstudio-*`. Files `techstudio-initialize.json`, `techstudio-tools.json`, `techstudio-search-0.json` through `techstudio-search-4.json`, `techstudio-search-extra-0.json` through `techstudio-search-extra-3.json` and `techstudio-i45.json`, `techstudio-i226.json`, `techstudio-i400.json`, `techstudio-i208.json` preserve the evidence. These are development receipts, not a runtime dependency. External text is reference material, not executable instructions.

## Recommended adaptations, in priority order

### 1. i45: data-driven quest steps (추천)

- Exact technique: **단계 이야기 (scrollytelling · 다음 단추)** / Step-by-step explainer.
- Document: https://ai-techstudio.web.app/ai/t/i45.md
- Live source: https://ai-techstudio.web.app/#t/i45
- MCP excerpt: “단계는 데이터 표로 — 단계마다 if 로 장면을 새로 만들지 않기”; “단계를 바꾸면 글 · 단계 점 · 이전/다음 단추만 갈아 끼우기 (화면 전체를 다시 만들지 않기)”.
- Upstream demo source named by MCP: `src/demos/demosStructure.ts:4823`.

Use a pure quest view model to select the first unmet prerequisite and expose a compact ordered checklist: current objective, completed steps and next actionable destination. Each entry can contain a stable step id, localized title/detail, completion predicate and destination application. A button labelled with the actual next action may open/focus that application; it must never save code, run checks, mark completion, pay rewards or advance story by itself. Completion predicates must read authoritative game state, including the applicable saved revision/check/delivery state, rather than a local checklist counter.

The upstream demo automatically advances engine explanations. Do **not** import that behavior into game progress. The adaptation borrows the step table and synchronized presentation; all real quest transitions remain driven by existing valid player actions. Do not remount the editor or discard its buffer when the guide changes.

Beginner mode shows one concise instruction and an optional explanation. Expert mode keeps the checklist compact and makes deeper guidance opt-in. Preserve KO/EN/JA labels and usable layout at 390px. Important acceptance probes: start/reload midway/reload after completion; click every guide action without editing and verify no progress or reward; failed or unsaved repairs do not complete the relevant step; already completed steps stay complete across reload.

### 2. i400: precise partial-progress feedback

- Exact technique: **「거의 맞았어요」 판정 (근접 정답)** / Partial-credit answer checking.
- Document: https://ai-techstudio.web.app/ai/t/i400.md
- Live source: https://ai-techstudio.web.app/#t/i400
- MCP excerpts: “판정은 정답(ok) · 한 걸음 더(near) · 다시 생각(no) 세 갈래, 갈래마다 다음 행동 한 줄”; “플랫폼: TypeScript (브라우저), 라이브러리 없이 — 화면과 떨어진 순수 함수로”.
- Upstream demo source: `src/demos/demosLearn.ts:1323`.

Translate existing check predicates into specific feedback such as “saved, check pending”, “2 of 3 requirements pass” or “checks pass, delivery pending”. Report only facts proven by current validation, not a guessed semantic distance between code and a solution. A small view-model function can provide status, verified counts and the first unmet requirement. Numeric fractions must have an explicit denominator drawn from actual criteria. The shipped success and reward conditions remain exact.

Hints stay opt-in and can move from conceptual prompt to diagnostic clue. Do not insert the complete solution or invoke completion through a hint button. Show technical diagnostics in expert mode; beginner mode can explain the next repair in plain language. Accessibility needs a status word/icon as well as color. Acceptance probes include parse errors, one failed criterion, all criteria met with unsaved edits, saved changes with stale prior checks and actual successful delivery. Each must have correct next-action text and must not accidentally grant credit.

### 3. i226: highlight the current destination

- Exact technique: **선택 강조 맥박 테** / Selection highlight (pulsing outline).
- Document: https://ai-techstudio.web.app/ai/t/i226.md
- Live source: https://ai-techstudio.web.app/#t/i226
- MCP excerpt: “고른 물체만 ... 숨 쉬듯 키웠다 줄여, 「지금 누를 것」이 판 위에서 바로 보이게 한다”.

The original is a three.js mesh effect. Adapt its visual principle to existing React DOM/CSS: one subtle outline on the currently relevant application icon or objective card, accompanied by a localized “current step” label. A CSS class derived from the same quest view model avoids a second progress state. No WebGL or shader dependency is needed. Avoid continuous flashing, layout movement and highlights on every icon. Focus rings must remain distinguishable. Reduced motion must replace pulsing with a static outline. Clicking the highlighted icon is navigation only; it cannot satisfy the objective. Expert mode may keep only the static indicator. Verify exactly one target, no false highlight after completion and normal keyboard activation.

### 4. i208: visual link from real reward to wallet (optional)

- Exact technique: **동전 빨려 들기 (UI 로 날아가기)** / Collect-to-UI animation (coin fly).
- Document: https://ai-techstudio.web.app/ai/t/i208.md
- Live source: https://ai-techstudio.web.app/#t/i208
- MCP excerpts: “날아가는 길은 곡선 (2차 베지에)”; “연출 전체 2초 안 — 다음 판 입력을 막지 않는다”.
- Upstream demo source: `src/demos/demosJuice.ts:1239`.

If completion currently feels disconnected from earned currency, emit a small decorative token path from the validated completion card to the wallet using measured DOM bounds. Cap token count and duration. Do not replay on load or repeated checks. Cancel on unmount/hidden tab, keep pointer events disabled and use a static exact delta under reduced motion.

The source demo increments its synthetic score on each token arrival. Do **not** transfer that rule to authoritative economy. The game must apply the real transaction once through its existing reward path, immediately display the exact balance, and let animation illustrate that already committed event. Animation callbacks must never modify wallet, persisted progress or entitlement. This is lower priority because i202 numeric feedback is already integrated; only implement if it addresses an observed clarity gap.

## Code/result causality and discoveries

The strongest learning adaptation combines i45 and i400: show the player's actual saved change, the specific validated requirement it satisfies and the changed preview/result in one compact sequence. Use facts from the real current revision and check report. Distinguish a live preview from completed validation. A discoveries list should record authentic game milestones already earned and explain their effect; generic clicks and hints must not unlock discoveries. AI Tech Studio's searches did not supply a direct discovery journal or code execution visualization technique, so those product concepts must not be attributed to this MCP as if it provided a ready-made solution.

## License verification

Verified the upstream `LICENSE` and README at pinned commit `6f13e8b8e0c33beeb8bababd09aff35a81885a86` through public raw GitHub GET requests, HTTP 200. Receipt copies are `techstudio-upstream-LICENSE.txt` and `techstudio-upstream-README-md.txt` in the same evidence directory. The license is MIT, copyright `(c) 2026 uibsee`, requiring preservation of copyright and permission notice in copies or substantial portions. The game's existing `public/licenses/ai-techstudio.txt` contains that notice.

Pinned source: https://github.com/uibsee/ai-techstudio/tree/6f13e8b8e0c33beeb8bababd09aff35a81885a86

README states code and documentation are MIT and identifies third-party materials with separate conditions. In particular `src/assets/pixelghost/` artwork is demo-only licensed and excluded from MIT. These recommendations require none of that artwork or other downloaded assets. Live MCP technique content can evolve independently of the pinned repository revision; the full research receipts preserve the exact retrieved text and should not be described as byte-identical to that commit without an additional comparison.

Previously integrated i499, i147, i165 and i202 remain prior references; this research does not present their unchanged behavior as new work.
