# Empty-save Continue regression — 2026-10-10

Baseline: `433bbe6`. The reported sequence was reproduced in the built browser
app before changing the implementation: start, reload, reset, reload. Continue
was enabled even though no player work remained.

## Cause and change

`GameShell.update()` set `hasSave` to true for every update, including a freshly
created reset state and that state's later load. The button reflected the
presence of a storage envelope rather than resumable play.

`hasGameProgress()` compares persistent play state to the initial workstation.
System notices/logs and schema revisions are excluded. Unfinished player files,
terminal history, read messages and mission work count without requiring a
completed job. Existing stored progress is retained; no save-key migration or
automatic deletion occurs. The shared state-update path covers browser and
Windows load, reset and imported saves.

The title's edition eyebrow was removed in KO/EN/JA at the user's request.
Demo content boundaries remain as previously configured.

## Evidence

- Before fix: `tests/e2e/title-save-state.py` failed with Continue enabled after
  reset. Receipt: `output/title-save-state/before-fix.json`.
- After fix: the same E2E passed, extended to actual typed file creation,
  unfinished-work Continue after reload, new-game cancellation preservation,
  Settings reset, immediate title return and subsequent reload. No page errors.
- `tests/e2e/title-screen.py`: three languages and seven viewport sizes each;
  no title eyebrow, empty-save Continue disabled, real terminal work resumable,
  keyboard focus, reset cancellation and previous title motion behavior passed.
- `tests/e2e/title-save-native.cjs`: actual Electron, an isolated disk profile
  and repeated process exit/relaunch. Empty saves stay disabled; typed work
  survives relaunch; cancelling reset preserves it; reset stays empty on the
  next process launch. No page errors. Steam runtime was not used.
- The current native campaign suite also passed: three cafe chapters, 18 career
  jobs, final app release/ending, code lab/terminal files, settings persistence,
  real disk close/reload, save import/export and corrupt-primary backup recovery.
  Evidence: `output/title-save-state/native-campaign.log` and
  `output/steam-qa/native-report.json`. This remains a source Electron run.
- Three progress unit tests cover fresh and legacy default saves, early command
  work, source-only imported data, accepted jobs and reset independence.
- Quality gate: lint 298 files, 0 errors and 0 warnings; typecheck, installed
  dependency mitigation, 276 game tests and 33 desktop tests passed. Production
  web and offline Windows renderer builds passed.

Artifacts: `output/title-save-state/` and
`output/launch-quality-20261010/title/title-screen-report.json`.

## Release scope

This fixes the reported title/reset behavior; it does not complete the separate
remaining release requirements. Full continuous reference-video viewing,
independent human playtests, free-form app builder/export, native-language
review, packaged release verification and actual Steam registration/review
remain tracked in `QA-launch-quality-2026-10-10.md` and the reference coverage
report. Do not label these requirements done based on this regression test.
