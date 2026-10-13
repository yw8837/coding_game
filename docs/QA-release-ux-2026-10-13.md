# Release UX and gameplay QA — 2026-10-13

Status: scoped functional QA passed on October 13, 2026. Steam submission is blocked by missing product registration; this is not a release approval or a human playtest result.

## Scope and baseline

Isolated branch `release/ux-gameplay-20261013`, baseline `0517c9a9482c18ca4a26abe250641e8e420d78e6`. All 634 baseline files matched both originals before fixes. Originals and prior recordings remain preserved. Baseline `pnpm verify` passed (353 linted files, zero errors/warnings, typecheck, dependency mitigation, game and desktop tests).

## Scenario matrix

| ID | Intent / player | Setup and harness | Expected | Actual / evidence | Cleanup |
| --- | --- | --- | --- | --- | --- |
| PLAY-01 | Novice clicks through cafe | Fresh save; inspect/repair/help/test buttons without authoring | Broken code cannot complete jobs | PASS KO/EN/JA: unchanged source cannot finish; hints do not write source | Browser closed |
| PLAY-02 | Novice repairs cafe | Direct edits and opt-in hints, all three chapters | Visible result follows own valid change; rewards once | PASS KO/EN/JA through three chapters + OPEN, real API evidence and three customers; `output/release-ux-20261013/cafe/coach-report.json` | Browser closed, isolated earned saves retained |
| PLAY-03 | Expert alternative code | Editor/terminal, valid alternative CSS/logic | Behavior accepted without exact-answer typing gate | PASS alternate `calc(100% - 0px)` CSS and authored JS; constant 13500 rejected | Test fixtures retained |
| UX-01 | Small laptop and scaling | 1280×720, 1366×768, 1920×1080, 125%/150% effective viewport | Reach taskbar, controls and code; no trapped windows | PASS all 30 cases on final renderer; `output/release-ux-20261013/window-final/window-report.json`; cafe actual CSS zoom150%; native OS DPI remains untested | Browser closed |
| UX-02 | Window switching | Resize, maximize, restore, minimize, taskbar, keyboard | Rect preserved; target editor/terminal receives input | PASS same30cases: F6/ShiftF6, taskbar arrows/Home/End/Enter, selection/draft, eight resize handles, narrow restoration | Browser closed |
| UX-03 | Language and hydration | Built Worker web demo; KO/EN/JA; region response unavailable; manual choice | Stable hydration, browser fallback, manual choice persists | PASS3 locales with zero errors; `output/release-ux-20261013/demo-boundary-locale/report.json`; domain neutrality also unit-tested | Browser closed |
| UX-04 | Stale checks | Pass Python/SQL then change source | Old pass never describes current code as validated | PASS both tracks: Passed→Not checked→Needs a fix→Passed; old reward unchanged; `output/release-ux-20261013/ops-stale/report.json` | Browser closed |
| UX-05 | Optional hints | Fail Python/SQL | Diagnostic only; answers require explicit hint action | PASS both tracks: zero hint until explicit Show hint1; locale/unit tests also pass | Browser closed |
| UX-06 | Current-job guidance | Choose Python/SQL/lab, use terminal/editor, change rules tab | Current job title/file/action follows selection; no unrelated bakery guidance | PASS KO/EN/JA; `output/release-ux-20261013/work-guidance/report.json`; command insertion requires Enter, two SQL folders, readonly data and lab context | Browser closed |
| UX-07 | Overlapping window hit testing | Python printer behind active terminal | Active input receives real mouse clicks | Reproduced background printer covering input; isolated each desktop window's stacking context; PASS KO/EN/JA click-center test | Browser closed |
| SAFE-01 | Hostile Python math | 96MiB heap / 8s subprocess, huge isqrt/comb | Terminate within interpreter budget | PASS runtime regressions within435 game tests; `output/quality-gate/game-units.log`; subsequent `6*7` recovers42 | All child processes exited |
| SAFE-02 | Huge nested repr/repetition | Same bounded children; shared nested comparisons and formatted strings | Clear bounded error; ordinary code still works | PASS expansion limits, shared comparison budget and Unicode regressions; same game-unit log | All child processes exited |
| SAFE-03 | Imported full save in demo | Python inline reads of private virtual files from parent cwd | Paid files inaccessible, cafe/sample readable, full unchanged | Reproduced before fix; PASS21 edition/Ops tests after filtering runtime virtual filesystem by edition | No host files accessed; test-only virtual data |
| DESK-01 | Windows package | New user-data dir, offline, save/relaunch | Production/QA game and renderer match; native save works | PASS `output/art-qa/offline-package-report.json` (48 game files,39 renderer files match) and `output/steam-qa/packaged-report.json` (isolated QA package, native save/reopen, Japanese retained, no Node exposed) | Electron closed; isolated profile retained |
| DESK-02 | Native terminal input | Electron, isolated profile, KO/EN/JA | Completion, copy/cancel, history, IME never unexpectedly execute/drop input | PASS33 checks; `output/full-version-quality/terminal-editing-final.json` | Electron closed; test profile retained |
| DESK-03 | Native title saves | Electron, fresh save, typed work, reset, relaunch | Continue only for actual progress; cancel preserves save | PASS with zero page errors; `output/title-save-state/native-report.json` | Electron closed; test profile retained |
| DESK-04 | Post-ending studio / export | Explicit completed-route seed, actual native UI and exported HTML | Draft restore/cancel, export, remaining work and rewards preserved | PASS KO/EN/JA; `output/full-version-quality/studio-native-report.json`; search, saved enquiry, inert hostile markup, storage quota/corruption,360px external browser;6 optional jobs remain | Electron/browser closed; QA seed and HTML retained |
| DEMO-01 | Cafe + independent bakery sample | Fresh KO/EN/JA saves on built Worker web demo | Author code, check, reply and deliver; reload keeps completion | PASS3 languages, zero console/page errors; `output/release-ux-20261013/demo/coach-report.json` | Browser closed |
| DEMO-02 | Imported full-edition save | Adversarial seed of completed full route | Paid apps,17 other contracts and studio cannot open; rewards preserved | PASS hidden launchers and private terminal paths; `output/release-ux-20261013/demo-boundary-locale/report.json` | Browser closed; source fixture unchanged |
| MEDIA-01 | Trailer accuracy | English and Korean actual gameplay captures | Typing→run→visible result; no invented feature | PASS two36s1080p30 videos; full-stream decode0errors, actual6-roll receipt12600→10000 then8-roll13600; provenance and source hashes in delivery folder | Final EN/KO videos and provenance retained; intermediates separate |
| STEAM-01 | Correct product | Authenticated app list | Correct coding-game App ID before edits/uploads | BLOCKED: no coding-game app; app credits 0; 5336990 is Veins of the Sleeping Moon | No writes made |

Maximum five QA cycles; stop a repeated identical failure after three attempts with diagnosis. Hostile code only uses the in-game interpreter in bounded child processes. No host execution of player code, production save changes, external messages, purchases, or edits to the other Steam game.

## Current diagnosis

CafeCoach's repair controls directly write correct source values (size slider, boolean switch, answer/operator controls). The existing engine checks behavior, but the default UI supplies the solution. Fix the authoring interaction rather than add arbitrary time or keystroke gates. Retain file navigation and an observable customer result for beginners; preserve editor/terminal alternatives.

Implemented full-source editing with explicit saving, Locate and opt-in hints. Full renderer and rebuilt web demo passed cafe checks in all three languages. The demo now adds a bakery sample and clearer next-client ending. Contextual guidance follows the selected Python/SQL/lab job and opens its actual source file; queued commands still require Enter.

### Harness failures and correction

- Window cycle1 measured/moved windows during arrival animation, producing27 minimum-size failures. The harness now waits for actual running window animations to finish and drags clearly beyond the size boundary. The final complete matrix contains all30 passing cases and corresponding screenshots under `output/release-ux-20261013/window-final`.
- Cafe first run stopped behind the genuine level-up modal after chapter1. The harness now acknowledges its visible OK button. Second run completed KO/EN/JA with zero page/console errors (expected static-server locale endpoint404 excluded only with explicit static QA flag).
- Ops first harness query matched both mounted track panels. Scoped queries to the selected track; the full stale/failure/recovery scenario then passed for both.
- The first post-change unit gate hit the portable runner100ms atomic-test budget while a build and nested parallel Node tests competed for CPU. Kept the runtime budget and bounded test-process concurrency to2 (inner portable corpus1). Focused13 tests and both subsequent whole gates passed.

Automated functional checks do not establish human comprehension, fun, learning outcomes, actual OS DPI compatibility or Steam approval.

The independent review identified an additional demo boundary gap: inline Python could read imported full-edition virtual files from an ancestor directory even when `cat` was blocked. The new regression failed before correction. The interpreter now receives only the edition-visible virtual files; relative and absolute private reads fail while normal notes, unlocked bakery data and full-edition behavior remain valid.

Whole verification at09:48UTC passed435 game tests, desktop tests, typecheck, dependency checks and355 linted files with zero warnings. Subsequent screenshot inspection caught an actual stacking defect: an inactive Ops printer's z-index escaped its desktop window and covered the active terminal input. `isolation:isolate` now bounds each window's internal layers. The center-point mouse regression failed before that CSS correction and then passed in KO/EN/JA. The final whole gate at10:05:36UTC passed435 game tests and40 desktop tests, zero skips/failures, typecheck, dependency mitigation and355 linted files with zero errors/warnings.

## Commands and evidence

All completed with exit0: `pnpm verify`, `pnpm desktop:build`, `pnpm desktop:package`, `node desktop/scripts/package.mjs --qa`, `node desktop/scripts/verify-offline.mjs`, `node tests/e2e/packaged.cjs`, `node tests/e2e/terminal-editing-native.cjs`, `node tests/e2e/title-save-native.cjs`, `node tests/e2e/full-studio-native.cjs`; Python harnesses `coach.py`, `window-release.py`, `ops-stale.py`, `work-guidance.py`, `demo-boundary-locale.py`. The publication checkout built successfully using the Sites build helper and served the actual Worker build for demo checks. Tests use isolated profiles and bounded action timeouts; hostile runtime probes use a hard8s child timeout and96MiB heap. Final receipt: `output/quality-gate/receipt.json`.

## Residual risks

- Automated actions establish functional behavior, not enjoyment, novice understanding or a measured playtime. A new novice session without coaching is still needed to test whether the player can explain their own repair and wants the next job.
- Actual Windows125%/150%DPI, independent low-spec hardware, Steam overlay/achievements/Cloud and native-language editorial review remain unverified.
- The Python runtime is a supported subset, not host Python. Individual expansion/budget limits are tested; total retained-object memory is not globally accounted.
- The final project/export uses prepared templates and supported fields; it is not unrestricted execution of arbitrary HTML/CSS/JavaScript on the host.
- Videos capture the09:15UTC renderer, before selected-work-context and stacking fixes; their fingerprint is preserved and they are not evidence of the final installer build.
- User-provided reference videos have not all been watched end to end. Only explicitly recorded sample observations support this turn's media changes.

## Steam state

Rechecked authenticated dashboard and All Applications on October 13. Only Veins of the Sleeping Moon (5336990) exists; app credits 0. New product registration is required before submitting this game. No submission, fee payment, or store edit has occurred.

## Cleanup and source preservation

All test browsers, native QA windows and media render processes exited. Owned preview servers on5190 and5191 stopped after verification; neither port remained listening. Isolated profiles, failure evidence and raw gameplay takes remain under ignored `output/`; the delivery folder contains final media and the production Windows folder only. No user saves were reset. A fresh comparison still found all634 original baseline files identical in both original checkouts, with zero changed or missing files. Existing D:media and agent state were preserved. Implementation lives in the isolated release branch for human merge.
