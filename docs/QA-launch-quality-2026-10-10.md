# Launch quality pass — 2026-10-10

Baseline: `84e6cbe`. This is a source/web QA checkpoint, **not a Steam release approval**.
All browser tests used isolated profiles. Dashboard records in the evidence below
are synthetic data in local SQLite, not production visitors.

## Current changes

- Title menu contains New game, Continue and Settings. Continue reflects the
  existence of a save, including a fresh desktop saved before the first message.
  Reset cancellation preserves progress. Keyboard navigation and returning focus
  from Settings are supported in Korean, English and Japanese.
- The existing evening room remains the background. The monitor now shows a dark
  editor, file tree and terminal, projected onto the original screen. The bright
  café card and illustrated cup were removed. Monitor light, glass reflection,
  rain, coffee steam and small mouse parallax share the room's geometry. Reduced
  motion and open dialogs pause decorative motion; the menu does not move.
- `/admin` and its API require the configured owner's authenticated ChatGPT
  identity. Public demo play remains available without logging in. Anonymous
  statistics are off by default; players can opt in and turn them off in Settings.
  Feedback is separately voluntary. Code, terminal text, save files and raw IP
  addresses are not stored. Counts describe participating tab sessions, not all
  unique visitors. A last recorded step is not proof that someone was stuck.
- D1 migrations add sessions, stages, feedback and hourly keyed abuse buckets.
  Data older than 90 days is eligible for bounded cleanup on subsequent new
  sessions; there is no scheduled deletion job. Exact retention is not promised.
- Ending credits can be replayed and lead back to unfinished jobs or the desktop.
  Windows atomic save replacement retries brief EPERM/EACCES/EBUSY locks without
  deleting the existing primary save.

## Latest validation

| Check | Result | Local evidence |
| --- | --- | --- |
| Lint, typecheck, installed dependency mitigation | Passed; lint 294 files, 0 errors, 0 warnings | `output/quality-gate/receipt.json` |
| Game / desktop units | 273 / 33 passed | `output/quality-gate/game-units.log`, `desktop-units.log` |
| Production web build | Passed | `output/launch-quality-20261010/dashboard/build.log` |
| Title layout, focus, save/reset, animation preferences | KO/EN/JA, seven sizes per language passed: 1440×900, 1920×1080, 2560×1080, 1280×720, 844×390, 390×844, 320×640 | `output/launch-quality-20261010/title/title-screen-report.json` |
| Built demo smoke | No page/console errors or failed requests; room image loaded; New game opens the desktop | `output/built-smoke/built-smoke.json` |
| Dashboard API + real local SQLite | Owner reads, anonymous/non-owner denial, opt-in visit/start, feedback, invalid origin/oversize/unknown fields, opt-out persistence, inert script text and desktop/mobile layout passed | `output/launch-quality-20261010/dashboard/report.json` |
| Demo boundary and locale selection | Six region/browser combinations, manual override persistence, full-save import/export preservation, locked full-game jobs and three localized about pages passed | `output/launch-quality-20261010/demo-final/demo-release-report.json` |

The dashboard initially returned a local Wrangler proxy 503 on the request after
an early body rejection. A minimal sequence reproduced alternating 400/503
responses on a reused connection. Reading request bodies with the same 6,000-byte
stream limit before validating origin/type resolved the issue; the complete
dashboard E2E then passed. Origin checks and allowed payload fields remain strict.

## Earlier results in this pass

These results precede the final title/dashboard revision and must not be confused
with a fresh native/package pass of the final source:

- Coach, state synchronization, alternative-solution freedom, stale-check/reward
  regressions, web security, quest context and terminal UI suites passed. Evidence:
  `output/launch-quality-20261010/web-primary-run.json`, `web/` and `security/`.
- Ending credits in all three languages returned to an unfinished florist job;
  delivering it and reloading preserved the original ending, release and rewards.
  Evidence: `web/ending-credits-report.json` in the same run directory.
- Windows save stress: before fix, 6 failures in 300 writes; after fix, 0 failures
  in 300 writes, with one transient EPERM retried. Evidence:
  `store-stress-before-fix.json` and `store-stress-report.json` in that directory.
- Dependency audit: root production and desktop audit reported no advisories.
  Root development/build dependencies retained one High advisory for `braces`
  (GHSA-vfj7-8cjw-p6xm), with the installed mitigation verified. Do not report an
  entirely clean all-dependency audit.

## Release work still required

The final source still needs a new native campaign run and packaged/offline
Windows verification before replacing the delivered RC. This checkpoint does not
update the old Windows package. Steam AppID/depot registration, payment, upload,
store review, real beginner/coder playtests, native-language review and another
physical PC remain separate gates. AppID `5336990` belongs to another game.

Free-form HTML/CSS/JS app building and standalone export are not implemented.
CSV-to-validated-JSON translation management is a proposal, not a completed
migration. Full continuous viewing of all supplied reference videos is also
unfinished; see [coverage and limits](references/coverage-and-release-2026-10-10.md).

Automated passing paths are not evidence of human enjoyment, learning outcomes,
commercial readiness, playtime or Steam approval.
