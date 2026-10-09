# CODE:SHIFT 0.8 RC

Prepared on 2026-10-09. **CODE:SHIFT remains a working title.** This document describes the implemented release-candidate scope; it is not a production deployment receipt, an approval of a packaged executable, or a Steam release announcement.

## Implemented game scope

- Three Mono Cafe introduction chapters cover the menu/sign and mobile width, checkout arithmetic, and order route/storage. The existing simulated PC, guided setup, terminal, editor, browser, CatHub review/deployment, and saved OPEN ending remain the introduction.
- After OPEN, 18 neighborhood jobs are available in three acts of six. Completing every job in an earlier act unlocks the next act. Each job uses actual files in the game's local machine state under `/home/dev/jobs/<id>`.
- A career job follows acceptance, inspection of broken output, direct file edits, a current passing check, a chosen client reply, and delivery. Delivery records the choice and pays once. Editing or restoring a checkpoint requires fresh checks. Completed jobs can be revisited as read-only records.
- The 18 jobs are short configuration and data-editing puzzles. They cover JSON settings, CSV records, one bounded form model, one bounded CSS box model, and log/time calculations. They are not 18 full software projects or a general development environment. Evaluation interprets supported formats and returns safe text; player source is not executed as arbitrary JavaScript, Python, or HTML.
- Each career job offers three localized hints and an optional example answer to read. Viewing an answer does not apply it or establish passing evidence.
- Three earned-credit upgrades provide a per-job recovery checkpoint (250 cr), file/output comparison on a sufficiently wide screen (600 cr), and a desktop studio sign (900 cr). Narrow layouts use file/output/check tabs.
- All 18 deliveries unlock a saved career ending based on client replies: community with at least 12 care choices, independent studio with at most 6, and balanced with 7–11. The ending records the player's completed jobs and reply history.
- Six optional exercises remain available: totals, discount boundaries, stock comparison, delivery arithmetic, route matching, and percentage width. They do not gate the café or career endings. First-success rewards do not repeat on replay.

The 18 career jobs award a combined **6,600 cr / 2,460 XP** before spending. Cafe rewards, optional exercises, bonuses, and cosmetics are separate. Fictional credits are not purchases with real money.

## Saving and language

Browser progress autosaves locally under the existing `codeshift-intro-demo-v1` key. Settings supports JSON backup export and validated import with a replace-progress confirmation. Existing saves without career fields receive default career progress. The main save limit remains 4,000,000 characters, with career source capped at 20,000 characters per file. Local autosave is not cloud synchronization.

The shared UI and authored career content support Korean, English, and Japanese. Explicit language preference takes priority; automatic detection uses a supported Steam language, then OS/browser preferences, then English. Source keys, filenames, command text, and authored sample data keep their original spelling.

The desktop candidate has a native save bridge, an ordered save queue, primary/backup recovery, native export, and a close/save handshake. Its Electron renderer and packaged folder are a separate delivery target from the public browser site. An actual offline Electron run completed all three cafe chapters and 18 career jobs through the UI, then checked close/reopen saving, browser-save import, native export, manual dialog language and corrupt-primary recovery. Career completion used visible optional examples and does not establish unassisted novice comprehension. A separate packaged QA executable checks launch, Japanese preference and persistence. See [QA-0.8-RC.md](QA-0.8-RC.md) and [desktop-release.md](desktop-release.md) for evidence and clean-machine/Steam limits.

## Public description and Steam status

The Korean, English, and Japanese `/about` pages describe the 3 + 18 + 6 scope, direct edits and tests, local autosave/backup, and the separate desktop candidate. Four new 42-second trailer exports (Korean, English, Japanese, and Korean portrait) show actual cafe gameplay and selected career gameplay. The three landscape exports replace `public/media/codeshift-{ko,en,ja}.mp4`. The footage is an edited selection, not a continuous playthrough of all 18 jobs. Captions are localized; recorded UI is Korean. Metadata uses the matching localized descriptions and identifies the page as 0.8 RC.

The browser version remains free with no signup. The planned Steam price is **KRW 21,000**. A real App ID and store page have not been provided or confirmed in this work; their registration status is unknown. Steam SDK behavior, achievement delivery, store review, depot upload, and Cloud in a real Steam environment are not verified. No release date or purchase link is claimed. See [STEAM-RELEASE-PLAN.md](STEAM-RELEASE-PLAN.md) for the separate plan.

No 6–8 hour playtime is claimed. Novice comprehension, completion rate, educational outcomes, official age classification, and measured campaign duration still require their own evidence. The design audience is coding newcomers around age 15.

## Verification boundaries

The dated execution record is [QA-0.8-RC.md](QA-0.8-RC.md): 93 game tests, 20 native/packaging-helper tests, TypeScript, browser campaign/language/tool checks, native full campaign, packaged QA smoke and media verification. ESLint is blocked by the installed framework parser dependency and is not claimed as passed. The 0.7 reports retain their historical scope and do not replace 0.8 evidence.

The reviewed architecture connects the same GameShell to web and desktop, keeps the simulated machine files canonical, rechecks current files before delivery, and separates acceptance/inspection from success. Computer file navigation targets a career job and filename. UI state and saved ending are derived from canonical progress rather than a UI-only completion flag. Terminal writes now protect delivered career paths: copy destinations, move sources/destinations, touch, and directory creation reject changes; reading and copying a delivered file to a separate experimental folder remain available. The source review confirmed the guard runs before mutation and the command exception handler restores the prior state. `lib/game/delivered-files.test.ts` covers these paths; the main task reported the new regression passing.

Source review found and repaired checkpoint/save-schema inconsistencies, forged passing-proof guidance, altered immutable-input acceptance and terminal writes to completed jobs. Regression tests cover the repaired cases. Architecture, evaluation and native-boundary reviews found no remaining P1/P2 issue within their inspected scope. Real-AppID Steam verification, clean-machine compatibility, measured playtime and novice playtesting remain separate requirements; source review is not store-release approval.

Supporting references: [career-content.md](career-content.md), [desktop-release.md](desktop-release.md), and [STEAM-RELEASE-PLAN.md](STEAM-RELEASE-PLAN.md). Older release and QA documents retain their original historical scope.
