# Japanese gameplay review — 2026-11-22

Source: https://youtu.be/tT4hRG1udm8 (43:13). The complete Japanese auto-caption JSON was read from `D:\코딩게임\임시작업\hinade.ja.json3`; two short video excerpts were inspected at 08:50 and 39:57. Auto-captions can misrecognize technical terms, so visual claims below are limited to those inspected frames. This is not a claim that every video frame was manually watched.

| Time | Evidence | Interpretation |
| --- | --- | --- |
| 02:16–04:43 | Captions: the player cannot find the input at first, then asks which instruction to follow. | Terminal setup competes with surrounding guidance. Current code already has the staged setup flow; no new causal claim about the old recording's exact UI. |
| 07:35 | Captions explicitly mention Korean in the source. | Starter source needs localization, beyond translated interface labels. |
| 08:48–09:02; inspected frame 08:50 | Captions question whether the preview is the saved file. Frame: source h1 contains `우리 동네 카페`, while the phone displays `街のカフェ`. | Reproduced: preview text translation silently changed learner-authored output without changing the file. |
| 14:05; 16:53–16:57 | Captions cite a 360px screen, 384px content, three menu items. | Not reproduced with the current starter: its original width produces 984px content, and the intended fix produces 360px content with all checks passing. The old 384px figure is not reported as a confirmed current engine bug. |
| 19:10–20:15 | Captions: the code is hard to see and does not match the output. | Consistent with the directly reproduced source/preview discrepancy; no unsupported claim about every edit made in the recording. |
| 23:04–23:17 | Captions: the player cannot recover the original value. | Editor recovery now uses the first actual project snapshot, preserving the starter's source language. |
| 32:19–33:24 | Captions: the player tries a percentage, then cannot tell the next task. | Current staged flow changes on source facts before successful check evidence. Feedback must identify current failed checks, not stale earlier failures. |
| 34:19 | Captions explicitly say localization is inadequate. | Localization is central to this failed playthrough. |
| 36:20–39:01 | Captions repeatedly ask what/where the result panel is. | Terminal's `npm test` response directed the player to a different panel without showing its result on the terminal. |
| 39:38–40:01; inspected frame 39:57 | Captions ask how to pass and ask the game to explain the two unresolved conditions. Frame shows raw Korean failure labels beneath the Japanese customer-test button. | Reproduced in current source: CafeCoach displayed only raw `check.name`, omitting translated detail and repair navigation. |
| 40:27–43:07 | Captions say the player cannot read the conditions, does not understand what is needed, and quits. | Consequential failure: comprehension and recovery break down during the first request. |

## Confirmed causes and changes

1. `previewDocument` translated only rendered HTML text in non-Korean UI. A Chrome assertion against the original bundle failed with actual `街のカフェ` versus saved `우리 동네 카페`. Preview now renders the sanitized saved source exactly. Sanitization and CSP remain in place.
2. New projects previously cloned Korean starter files in every language. `starterFiles` now creates actual authored en/ja/zh source on initial clone. The first Git snapshot and remote use the same files, so localization does not count as a player edit. Switching UI language or preparing an existing project does not rewrite saved code. Editor restore and the next mission retain the original source language.
3. Layout checks required Korean menu names anywhere in body text. A properly fitting Japanese menu failed both mobile and desktop checks. Checks now require three visible, nonempty menu headings, the actual cards/buttons, their dimensions, the required desktop row, and no overflow. Localized names pass; hidden/missing content and tiny buttons still fail.
4. CafeCoach failure names were raw Korean; details were not shown. Current results now show translated conditions, explanations, and a button to open the precise HTML/CSS/JS/Python file. Previous-mission or stale-source results are excluded.
5. `npm test` told players to find a result panel. TerminalView now displays the current test result on the same terminal surface, with translated reasons and per-failure file buttons. Pending and stale results are excluded. The initial terminal response now says results appear below in that terminal.
6. Layout failure details now distinguish a fixed-width overflow from missing/hidden menu labels/buttons. A desktop row alone no longer yields a misleading positive detail when other visibility checks failed.

## Targeted verification

- `& 'D:\코딩게임\작업.ps1' -PnpmArgs @('exec','node','--test','lib/game/starter-files.test.ts')`: 8 passed. Tests cover actual localized clones, initial/remote snapshot equality, clean Git state, template parser acceptance, unchanged existing learner code, both assisted/computer setup, and the next mission.
- `& 'D:\코딩게임\작업.ps1' -PnpmArgs @('exec','node','--test','lib/game/check-feedback.test.ts','lib/game/engine.test.ts','lib/game/setup.test.ts')`: 26 passed.
- `& 'D:\코딩게임\작업.ps1' -PnpmArgs @('exec','node','tests/e2e/preview-locales.mjs')`: real headless Chrome, 19 assertions passed, including all three localized starter projects after the two intended edits. It bundles the actual TypeScript module, preserving the source/preview check and requiring localized learner labels to pass; it also rejects hidden cards, hidden labels, overflow-hiding tricks, tiny buttons, and a single desktop column.
- `tests/e2e/terminal-checks.mjs`: real TerminalView + simulated engine + browser layout measurement, typing ordinary `npm test`, selecting the exact repair-file button, editing with normal simulated `echo > file`, and rerunning checks in Japanese and Chinese. 2 language scenarios passed (Japanese and Chinese), including localized reasons, repair-file navigation, stale-result removal, and the next current-file test. This harness also caught the previously unsupported Chinese cafe name; the real heading validator now accepts 莫诺咖啡馆 and 莫諾咖啡館, covered by a regression.
- Final `verify`, full application UI/build, and any desktop packaging are the integrating agent's gate. Targeted checks alone are not a completed release claim.

## Temporary artifacts

All review, bundles and captures were created under `D:\코딩게임\임시작업`. The two short video excerpts total only a few MB; no artifact over 1GB was created. No release checkout was changed.
