# UltraQA Report — desktop simulator 0.7

Verified locally on 2026-10-09. Goal: fresh desktop → three cases → saved ending, independent app windows, novice setup, optional practice and three languages. Maximum five repair cycles; diagnose three repeated identical failures before further work. This run used one isolated Chrome context at a time, synthetic game inputs, and no real commands from player input. Production publishing is a separate authorized delivery step.

## Scenario matrix

| ID | Intent / player model | Setup and harness | Expected signal | Actual result and evidence | Cleanup |
|---|---|---|---|---|---|
| A1 | Novice normal campaign | Empty storage; `tests/e2e/campaign.py`, visible UI actions only | Three delivered cases, OPEN ending, saved progress | PASS: Korean full campaign, incorrect heading rejected, correction passed; 1,720 cr / 560 XP; ending survives reload; `campaign-report.json` has ok=true and no page errors | Context closed |
| A2 | Desktop manipulation | Campaign harness, desktop 1440×900, later 1024×768/760×620 | Multiple independent windows and reachable controls | PASS: Start search, notes, real pointer drag, snap-right, minimize/restore/close, focus recovery, bounded resize; screenshots `multitasking.png`, `resized-1024.png` | Browser closed |
| A3 | Malformed / hostile input | `adversarial.py`; bad JSON save, executable-looking rule, oversized path; engine tests | Safe failure without rewards or partial file changes | PASS: malformed save retained before player action; invalid rule rejected; final path limit enforced for touch/mkdir/cp/mv/clone/pull; 55 unit tests pass | Isolated local storage |
| A4 | Cancel/resume / stale evidence | Reload between cases, completed-save reload, changed source tests, replay practice | Resume correctly; obsolete evidence rejected; reward once | PASS: EN/JA progress and language survive reload; practice earns 25 cr once; engine regressions cover changed source/evidence invalidation | Context closed |
| A5 | Language / compact / keyboard | EN/JA 390×844 first chapter; KO 1440×900 campaign; keyboard/window probes | No blocked critical action or horizontal page overflow | PASS: English and Japanese first chapter through reward/next case, native-script cafe names accepted; Tab completion and terminal draft history; Escape closes settings only; final smoke verifies localized help and empty desktop in all languages | Browser closed |
| A6 | Dirty tree / bounded processes | C: NTFS build checkout; clean initial Git state; one browser/render/build | No unrelated modifications or process termination | PASS for local checks: no unrelated dirty edits; serial FFmpeg with 4 threads; owned dev server stopped and 5173 listener absent. Final release receipt records build and final cleanup | Own sessions only |
| A7 | Misleading success / artifacts | `final-smoke.py`; renderer ffprobe and full decode | Actual outputs match claimed media and pages | PASS: KO/EN/JA about pages and 42-second 1920×1080 videos play; four exports have 1,260 frames/H.264/AAC, full decode and loudness checks. Build/publish outcome recorded separately in release receipt | No production test mutations |

## Commands and evidence

- `node node_modules/typescript/bin/tsc --noEmit`: exit 0, including final rerun after terminal localization. `output/pc-qa/typecheck.log` is empty on success; the process exit code is the success evidence.
- `node --test lib/game/*.test.ts`: exit 0, **55 passed / 0 failed**, `output/pc-qa/unit.log`.
- Python/Playwright `tests/e2e/campaign.py`, `adversarial.py`, `final-smoke.py`: exit 0. Installed skill venv and system Chrome, no package installation. JSON and PNG evidence in `output/pc-qa/`.
- `media/trailer/render.py --languages ko en ja --vertical-languages ko`: exit 0. Four MP4s, 42.0 seconds, 30 fps, 1260 frames. Landscape 1920×1080; portrait 1080×1920. Final encoded audio −16.01 LUFS / −3.37 dBTP. See `output/trailer/verification.json`.
- `git diff --check`: no whitespace defects. CRLF normalization warnings are checkout warnings, not failed checks.
- ESLint did **not** run: the existing framework alias lacks `next/dist/compiled/babel/eslint-parser`. This is recorded as a tooling limitation, not a passing lint result.
- Dev server emitted React multiple-renderer warnings during SSR/HMR. Local pages returned 200 and browser `pageerror` checks passed. Production build has a separate log; no claim that development stderr was warning-free.

## Defects repaired

Window close/minimize focus could remain in hidden content: window manager now moves focus to the active app or Start. Setup completed-state CSS used the wrong element/class: selectors corrected. Narrow file lists hid file status: descriptive purpose hides first instead. Long paths could create a state rejected by the next save: final absolute paths and content size are validated before mutation, with regression tests and rollback. Café headings now accept Korean, English and Japanese consistently in source and rendered checks. Terminal authored system guidance follows language while user/code/path content remains unchanged.

Harness-only failures were separated from product defects: an accessible-name badge, dialog exit-animation timing and practice success-class selector were corrected before rerunning. Video capture wall-clock offset was diagnosed against actual media duration before encoding; current EDL records the correction. These were not treated as intermittent product passes.

## Review and limits

Independent source review covered architecture, progress/reward integrity, save bounds and preview sandbox boundaries. No direct host-shell execution path was found; this is not a complete browser security audit. Korean campaign completion and EN/JA first-chapter completion do not establish the usability of every later translated scene. IME support is retained in the editor; this release did not perform a physical Japanese IME device study.

The trailer was visually inspected across 42 one-second frames plus full-size Japanese and portrait samples; captions and final cut are readable and game results are actual captured states. Audio was measured and fully decoded; a human headphones/speakers listening session was not performed. English/Japanese exports translate captions; the captured game UI is Korean. Portrait preserves the whole desktop and is best for overall flow; the landscape version is more legible for code details.

No independent first-time teenage play study, formal 15+ certification, Steam/mobile-store package, purchase flow or cloud-save service is claimed. The final game name remains undecided. The browser edition is the delivery scope.

## Delivery and cleanup

Build and deployment are checked against the committed source by the Sites workflow. Its verified SHA, public deployment status, GitHub push, D: mirror head and media hashes are written to the release bundle's `verification/release-receipt.json` after successful delivery; this pre-publish source report does not substitute for that receipt. Rollback target is the previous public Sites version 6, commit `e6a4918b90fad839e46f35e57a3b03d78000fdab`.

QA state is isolated under `output/ultraqa-desktop`, never the user's shared `.omx` state. Cleanup uses the state CLI, verifies absence, and closes only owned processes. Useful screenshots, logs, test saves and source footage are retained as ignored evidence / release materials; no personal browser profile was changed.
