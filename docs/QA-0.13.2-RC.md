# UltraQA Report — 0.13.2 RC

## Goal and bounds

Apply useful skills to the concrete remaining release work: bought monitor usefulness, current gameplay marketing footage and novice/expert observation preparation. Baseline b8d5ab1 (0.13.1). One heavy browser/build/render/native process at a time; isolated profiles only. No player saves, pricing, reward amounts, progression conditions, Steam app configuration or public web access reductions. Maximum five cycles; repeated identical failure three times stops for diagnosis. Human enjoyment/listening/learning, separate-PC minimum specs and Steam review are not automated acceptance.

## Scenario matrix

| ID | Intent / model | Harness | Expected signal | Result / evidence | Cleanup |
| --- | --- | --- | --- | --- | --- |
| MONITOR | Player spends earned credits; novice/expert/narrow window | upgrade-preview.py KO/EN/JA | All three editors show saved-file preview after purchase, drafts do not execute, narrow window readable | PASS; upgrade-preview-report.json | Isolated contexts closed |
| BASE | Maintainer integrity | pnpm verify + playtest data tests | No lint warnings/errors; correct typed and runtime checks | PASS: 270 files, 0 lint errors/warnings, typecheck, installed mitigation, game241/desktop31, playtest9 | Bounded processes |
| CAMPAIGN | Existing player after UI layout change | payoff, freedom, learning, native | Existing rewards, alternative code, all jobs, own release and saves work | PASS: KO/EN/JA chosen12, all18, five JS alternatives and own1.0.0; native cafe3/career18, final release, Code Lab, files, persistence/recovery | Owned server/apps closed |
| OBSERVE | Observer imports legacy/synthetic sessions | playtest-kit.py + data.test.cjs | Missing observations stay missing; expert/beginner/self separate; JSON/CSV preserved; no external requests | Unit9 PASS; offline browser PASS including delayed-file import preserving concurrent edits; output/playtest-kit-qa/report.json | Synthetic records in isolated browser |
| MEDIA | Viewer needs actual current gameplay | capture-current.py, skills-edit.py | Actual source output/rewards; honest chapter jumps; multilingual type; valid30s media/audio | PASS: current capture, four30s/900frame H.264+AAC exports, full decode; all13-shot contact sheets and selected full-size frames reviewed; media-review.json | Serial capture/render, source/evidence retained |
| DELIVERY | Recipient on web/Windows | production smoke, package compare, exact-source archive | Same committed source; no QA flag in production | Native and package PASS: Japanese preference/save/reopen, isolation, offline package QA=false and 39 matching game files; final web/media/delivery receipt below | New release directory; old releases preserved |

## Observed failures

The first monitor browser check compared innerText containing layout newlines to Playwright's default textContent assertion. Captured output was correct; the harness was changed to compare textContent consistently. The rerun passed all three languages. No force click, assertion removal or product behavior relaxation was used.

Read-only final review found a pre-existing observer-import snapshot race. Reading the file now precedes collection and merge of the latest validated UI data. The new browser check holds file I/O, edits a note, adds a session, then releases the read and verifies all three records survive.

Trailer capture first exposed two harness issues: simulated Enter triggered editor completion, then an unconditional Escape closed the app when no completion popup was open. Line insertion and visible editor focus now preserve the exact typed source; successful capture records zero page errors. Initial technical exports passed, but visual review rejected undersized gameplay crops. Current outputs use reviewed, source-bound framing instead; old exports were not published as the refreshed trailer.

## Evidence and remaining requirements

Reports and logs live under output/0.13.2-qa and output/trailer-current; final delivery copies curated evidence. The upstream braces build-tool High advisory remains version-reported with the verified local mitigation from 0.13.1; no dependency changes are introduced here. Human novice/expert play observations, full listening, native-speaker review, final name/signing, clean/low-spec PC and this game's own Steam registration/integration/submission remain pending. AppID5336990 is another game and is not configured.

## Current functional evidence

`web-full-run.json` records nine serial suites: monitor, payoff, built smoke, coach, freedom, freedom regressions, learning, web security and state synchronization. `playtest-kit-qa/report.json` separately records offline imports, classification and the delayed-file race test, with no page errors or HTTP requests. These are automated functional checks with assisted/synthetic input, not participant results.

Native: `native-report.json` confirms cafe3, career18, own release, Code Lab, terminal files, calendar, save-on-close, export/import, language and corrupt-primary recovery with no page errors. `packaged-report.json` checks Japanese preference and save/reopen in the built QA executable. `offline-package-report.json` confirms production QA=false, no Steam module/AppID, license files, hardened Electron fuses, matching39 QA game files and preserved art. Windows code signing and a separate physical PC were not tested.

Security: current `security/web-security-report.json`, installed mitigation verification and bounded source review pass. Prior0.13.1 registry audit receipts are retained as historical evidence because dependencies are unchanged; no new registry audit is claimed. Their full audit reports one upstream-unpatched High build/development advisory; web and desktop production dependency reports are zero. This does not claim that no undiscovered security defects exist.

Final web production build and `built-smoke`/`final-smoke` pass with refreshed public media (three30s videos load/play/seek). Four exports: landscape1920×1080 KO/EN/JA and portrait1080×1920 KO, each900frames/30fps, AAC48kHz, encoded integrated loudness−15.95LUFS/peak−3.09dBTP. `media-review.json` records visual acceptance and the outstanding listening/native-language limits. The captured source game hashes match the current implementation; `b8d5ab1` is the recording baseline plus the recorded working-tree changes, not a claim that baseline alone contains this update.

Final source commit, matching D: mirror, Sites saved version/deployment, Windows ZIP CRC/SHA256 and delivery file hashes are recorded in the external `delivery-receipt.json`/`integrity-manifest.json` created after commit. Historical releases remain preserved. Scoped QA state is cleared on completion; isolated QA profiles are retained following the earlier automatic deletion rejection and are not player saves.
