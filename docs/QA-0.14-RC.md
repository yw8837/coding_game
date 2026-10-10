# UltraQA Report — 0.14.0 RC full edition

2026-10-10. This pass improves the **offline full edition**. The public demo stays
unchanged. This is an engineering release candidate, not a completed Steam release
or a claim that human enjoyment or learning outcomes have been validated.

## Goal and safety bounds

Preserve all existing progress and first-release work while adding useful failed
check feedback, persistent client outcomes and a post-release app studio. Exercise
real native UI/IPC, save/reopen and exported HTML behavior. Only isolated marked QA
profiles are used. No production saves, social posts, Steam uploads, payments or
public web deployment are part of this pass. Heavy build/browser jobs run serially.

## Player-facing changes

- Job checks show the actual passed count and first failing expected/actual result.
  Relevant file navigation focuses the editor; line numbers require real parser
  evidence. Unchecked/stale/unsaved results cannot claim a pass. Hints stay closed.
- Delivered work collects actual customer replies, before/after results, earned
  credits and available unfinished jobs. Navigation does not issue rewards again.
- The first published app remains immutable. A separate workbench lets the player
  edit supported directory, event and portfolio projects, check them, keep the
  latest five snapshots and restore with explicit loss confirmation.
- A checked studio project exports a readable HTML/CSS/JavaScript file through a
  native Save dialog. Search, categories and browser-local inquiries work outside
  the game. This is not an arbitrary-code IDE, online backend or hosted deployment.
- Save status distinguishes pending, saved and failed. New edits clear old check
  celebration messages without clearing delivery/milestone rewards.
- Studio layouts respond to their actual container width, and preview/dialog text
  uses colors suited to its light surface. New views support KO/EN/JA.

## Scenario matrix

| ID | Intent / actor | Setup / command | Expected signal | Actual / fix / evidence |
| --- | --- | --- | --- | --- |
| S1 | Post-release player opens studio | Published current/legacy fixtures; studio unit tests; native studio UI | Independent draft, immutable first release | Studio native report and source tests; final run recorded below |
| S2 | Player edits/checks/retries | Editor and terminal mutations; native UI | Invalidated proof and truthful pending save; no extra reward | Canonical-source hash checks; native report records pending/saved and unchanged rewards |
| S3 | Player restores unsnapshotted work | More than five snapshots; native cancel/confirm/Escape/focus | Bounded history; cancel preserves source; restore needs recheck | Unit snapshots and native restoration scenario |
| S4 | Malformed/oversized/old save | Legacy workbench collision, exact 4M chars, current 4.1M boundary | Preserve old source; reject invalid input without replacing storage | studio/save tests; schema parse precedes relocation and final canonical size guard |
| S5 | Use exported application | Native HTML export, Chrome file URL in 3 locales | Search, categories and local inquiry reload | studio-native report and portable app screenshots |
| S6 | Hostile data/storage failures | HTML-shaped inquiry, quota throw and corrupted storage in real Chrome; generated-source runtime tests | Inert text, no external requests, no false saved state or overwrite | Dynamic report plus escaped-data/50 long-message/Unicode runtime regressions |
| S7 | Native export cancellation/failure | Fake native dialogs and real isolated main-process writes | Main owns path; bounded bytes; cancellation/failure honest | 5 export-app tests and native cancellation/write assertions |
| S8 | Beginner sees partial failure | Real native config+JavaScript UI, then dirty draft/syntax error | Accurate count, expected/actual, relevant file focus, no auto hint | career-feedback-native report; unsaved draft/notification regressions |
| S9 | Revisit customer work | Five real fixture deliveries, optional jobs, native UI/relaunch | Replies/results from real state; no duplicate credit | career-feedback-native report and portfolio tests |
| S10 | Existing campaign | `node tests/e2e/native.cjs` | Cafe 3 chapters, 18 jobs, own app, ending and save/recovery | Final execution results below |
| S11 | Small/large/native localized views | Native minimum and large window; 360px portable HTML | Usable primary actions, focus and no layout overflow | Native screenshots and recorded actual viewport sizes; OS/DPI may round requested outer size |
| S12 | Actual packaged runtime | QA package smoke, offline ASAR/source/fuse verification | Reopen local save, no Node exposure, production QA disabled | Final package results below |

## Failures found and fixed

1. Studio JSX brace and two implementation/test TypeScript errors prevented the
   first baseline checks. Fixed before any successful build claim. A legacy fixture
   equality assertion also needed the new explicit `studio: null` default.
2. Reserving the new workbench path could reject an old valid save. Old colliding
   files and local path references now move to a free `/home/dev/old-studio-N`.
   File bytes, command text, independent server files and first release remain.
3. Inquiry writes allowed escaped strings whose serialized size exceeded the read
   cap. Both paths now use the same bounded 400,000-character limit; long quoted,
   backslash and surrogate-containing messages reopen successfully in runtime tests.
4. Exactly 4,000,000-character legacy saves needed bounded room for migration/default
   fields. Old input remains capped at 4M, current/canonical saves at 4.1M. Read and
   write check the final normalized representation; native 16 MiB stays unchanged.
5. Dynamic UI testing found a previous all-pass notification beside a new failure.
   Only check notifications now clear after new actions or input. An initial capture
   handler caused controlled-input draft loss; clearing moved after child input
   handling. The E2E asserts both retained unsaved draft and absence of stale success.
6. Visual inspection found pale preview body text and narrow two-column studio
   layouts. Scoped light-surface text and container-based stacking correct them.

Harness findings are separate: the studio test initially used a button available
only inside an individual delivered job instead of the persistent app header.
The career harness initially assumed exact Windows outer dimensions; it now
records actual dimensions and tests the configured minimum. Neither was reported
as a game defect. The review's overescaped-regex concern was withdrawn after
checking generated script bytes and executing a real ISO-date record.

## Commands and final evidence

| Command | Exit / result | Bound and evidence |
| --- | --- | --- |
| `node scripts/verify-quality.mjs` | 0; lint 314 files, 0 errors/0 warnings; typecheck; mitigation; **305 game + 38 desktop tests**, 0 skipped | Each subprocess capped at 120s; receipt completed 2026-10-10T08:57:04Z |
| `node scripts/build-desktop.mjs` | 0; offline renderer built | No server/deployment; three-locale source renderer used below |
| `node tests/e2e/career-feedback-native.cjs` | 0; `passed:true`, `errors:[]` | Bounded UI waits; partial 3/9, saved JS 20/20, dirty draft, syntax 0/6; all locale records and screenshots |
| `node tests/e2e/full-studio-native.cjs` | 0; `passed:true`, `errors:[]` | Bounded UI waits; cancel/restore/focus, export in 3 locales, local reload, inert markup, quota/corrupt storage, 0 external requests |
| `node tests/e2e/native.cjs` | 0; `errors:[]` | Cafe 3 chapters, 18 delivered jobs, final release, Code Lab, typed terminal, calendar, import/backup/recovery and close/reopen |
| `node desktop/scripts/package.mjs --qa` | 0 | Explicit isolated QA build, never for distribution |
| `node tests/e2e/packaged.cjs` | 0 | Actual packaged executable; Japanese preference, local save/reopen, renderer Node unavailable |
| `pnpm audit --prod --json` / desktop npm audit | 0 / 0 | Registry audit receipts retained |
| `pnpm audit --json` | 1 | One known development-only High; not suppressed as a passing audit |

The final distribution package and cleanup receipt are recorded below. Logs live
under `output/quality-gate`, `output/full-version-quality`, `output/steam-qa` and
`output/art-qa`; selected results ship in the RC's `qa` folder. Core functions were
tested in units and dynamic UI; these are automated scripted runs, not independent
human playtests or measured playtime.

Native minimum requested 960×640 measured outer 963×643 and viewport 948×606 at
1.05 DPR. Large studio requested 1600×900 measured outer 1602×902 and viewport
1587×865. Portable HTML was tested at 360×740 in Chrome. KO/EN/JA screenshots were
inspected, and normal quest-backdrop closing was used at the small size. Scrolled
screenshots show their current viewport, not the entirety of a long page.

Independent read-only architecture/security/code review approved the corrected
studio state boundaries, native export, portfolio truthfulness and save migration.
Browser/native tests remain the behavioral evidence; the review is not a substitute.

## Security and remaining release gates

Fresh audits: production dependency audit **0**, desktop audit **0** reported
vulnerabilities. The full development dependency audit still reports **one High**
in the build-time `braces` path. The installed mitigation check passes; this is not
an all-dependencies-zero claim. See the retained audit JSON and prior reachability
analysis in `security/web-review.md`.

The native renderer remains sandboxed and has no host shell/Node API. Exported
player data is escaped/assigned with textContent and uses no network. Checks apply
to tested boundaries, not a guarantee of absence of every vulnerability.

Still needed: correct new Steam AppID and depot/store setup, Steam runtime QA and
review, independent beginner/experienced-player observations, native-language
review, another Windows PC/minimum-spec check, final title and optional signing.
Do not use AppID 5336990; it belongs to another game. Planned Korean price is
₩11,000, with a 20% first-seven-day launch discount (₩8,800), not yet applied.

All reference videos have **not** been continuously watched. The first six vidIQ
requests returned mixed-quality reports, including source-access failure and a
fabricated timeline. A post-delivery follow-up retrieved the other 17 playlist
reports and checked them against frames; it found additional inaccuracies and
resolved several end-state ambiguities. Rejected and advisory results are separated
in `references/coverage-and-release-2026-10-10.md` and its linked follow-up. The
direct visual-frame/transcript analysis supports the applied UX lessons but does
not replace the requested full audiovisual review or human playtesting. The
follow-up changes research/playtest documents only, not this tested RC build.

## Cleanup and delivery

`node desktop/scripts/package.mjs` and `node desktop/scripts/verify-offline.mjs`
both exited 0. Production QA flag is false, Steam AppID is null, native Steam code
is excluded from this offline package, and required license notices are present.
The verifier matched 45 native/renderer files to both the tested QA package and
current source/build, including 36 renderer files. Source art hashes, ASAR-only
loading/integrity, disabled RunAsNode/Node options/debug arguments and cookie
encryption were checked. This does not claim a signed installer or Steam build.

Owned Electron processes were closed. Ten marked fixture profiles from this pass
were removed after resolving their exact paths inside the two QA output folders;
no real player profile was touched. Test reports, failure evidence and screenshots
remain. Isolated UltraQA state was completed, cleared and checked absent; repository
or other task state was not cleared. Regression harnesses remain as source tests.

The scoped engineering QA is complete after baseline repair and dynamic regression
repair. Full-game release and the reference-viewing request remain open for the
external gates above. `scripts/deliver-offline-rc.py` creates a new delivery folder
only, checks the current committed source and passing receipts, copies the complete
runtime, CRC-tests its ZIP and writes/verifies a SHA-256 manifest. The delivery
receipt identifies the final commit; no public demo deployment is performed.
