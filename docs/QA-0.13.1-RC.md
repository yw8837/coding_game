# UltraQA Report — 0.13.1 RC

## Goal and success criteria

2026-10-10. Baseline commit `86f40b3`. Resolve the 71 reported lint warnings at their source, remediate or substantiate the exact build dependency advisory, and validate changed browser/native behavior with fresh evidence. No weakening rules, hiding advisories, increasing bundle-warning thresholds, or altering player saves. One heavy browser/build/native process at a time. Maximum five QA cycles, stop and diagnose the same failure after three recurrences. Real human learning/fun and Steam approval are outside automated acceptance.

## Scenario matrix

| ID | Intent / model | Setup and harness | Expected signal | Actual / fix / evidence | Cleanup |
|---|---|---|---|---|---|
| BASE | Maintainer, enforce static quality | Fresh lint --max-warnings 0, typecheck, game + desktop units | Zero lint errors/warnings; passing tests | PASS: 270 lint files, 0 errors/warnings; 241 game + 31 desktop units; quality-gate/receipt.json | Serial bounded processes |
| DEP | Malformed patterns against local tooling | Raw audit, bounded child processes, actual installed dependency chains | Reject resource abuse; preserve normal output; disclose official advisory | Local mitigation verified; upstream High 1 remains. Final probe counts and copied/installed evidence in security reports | 5-second, 64-MB, 256-KB-stack child limits |
| FLOW | New and experienced player | Three-language chosen route + guided route, native campaign | Correct outputs/rewards/ending, no browser errors | PASS: coach, freedom, learning, native reports | Isolated profiles; no player-save mutation |
| PAYOFF | Earned feedback, novice and repeat player | KO/EN/JA wrong, fresh, repeated and unsaved checks; delivery; 390px; reload | Actual before/after; no unearned/replayed reward; accessible next action | PASS: all three languages; payoff-report.json | Isolated profiles; overlays closed through UI |
| STATE | Interrupted player / stale app state | Browser history, external file changes, drafts, terminal clear/history | No duplicate requests, overwritten selection/draft, stale preview or render loop | PASS: 4 scenarios / 40 assertions in state-sync-report.json | Browser contexts closed |
| INPUT | Malformed/oversized saves and code | Security browser suite + unit boundaries | Reject invalid input; prior save intact; bounded code runtime | PASS: security/web-security-report.json; freedom-regressions.json | Isolated probes |
| RECOVER | Interrupted local execution | Native close/reopen, backup restore, corrupt primary, packaged executable | Recovered progress; no renderer Node access | PASS: native-report.json, packaged-report.json | Owned apps closed |
| BUILD | Consumer on web and Windows | Production start, image decode, chunk report, package comparison | Assets load offline; production QA flag false; licenses included | PASS: built-smoke.json, bundle-metrics.json, offline-package-report.json | Previous releases preserved |
| INTEGRITY | Misleading success / mixed source | Process exit plus structured evidence, final source/archive checks | No skipped failures or mixed builds | Gates fail closed; final Git/archive identifiers recorded in delivery-receipt.json | Run cleanup recorded in cleanup.json |

## Commands, failures, fixes, residual risks and evidence

### Scope of passing functional checks

- `coach.py`: fresh start in KO/EN/JA; all three cafe chapters, typed names/operators/addresses, width changes, real order/API results, manual hints, wrong/blank input recovery. This is an assisted automated functional test, not a human novice test.
- `freedom.py`: KO/EN/JA chosen route of 12 jobs, all five JavaScript alternatives, another valid timetable, personal project content/search/category/inquiry, ending, optional job and reload.
- `learning.py`: KO/EN/JA all 18 customer situations, direct guided editing, current test evidence and reward gates, final project and balanced ending. Uses manual help where necessary; does not measure learning or playtime.
- `payoff.py`: actual before/after output, failed/unsaved suppression, repeat-check feedback suppression, earned payout only, scoped result scrolling, mobile shop action, reload without replay and Japanese reduced motion. Customer reply and delivery follow the result card before the detailed check table.
- `state-sync.py`: Ghrom back/forward/history branching, preserving address drafts, repeatable queued commands without automatic execution, `clear`/history/Ctrl+L, manual file selection and removal fallback, one-time job focus requests.
- `freedom-regressions.py`: unsaved drafts survive changing jobs and block testing/mode switches; malformed mode recovery; unsupported jobs retain their editor; live preview contrast. Load button normal/hover/focus measured at least 8.66:1 against its background.
- `web-security.py`: invalid/oversized import rejection with previous save retained, inert stored HTML history, preview script/network restrictions, bounded code failure and recovery.
- `native.cjs`: real Electron 0.13.1 renderer, empty desktop, actual image decode, three cafe chapters, all 18 jobs, final release/ending, Code Lab and virtual terminal files, calendar, close/reopen, native import/export language, corrupt primary recovery. No renderer `require`/`process`; external network request rejected; no page errors.
- `packaged.cjs`: actual QA executable, Japanese preference, native disk save, orderly close and reopen. Production package has QA flag false and matches 39 QA-tested game files; 8 game-art files match source; licenses and required Electron fuses checked.
- `final-smoke.py`: KO/EN/JA introduction metadata, existing 30-second videos decode/play/seek, desktop/terminal help. The videos remain 0.11.1 footage.

The final full web run used the production build after the earned-feedback changes and customer-reply placement update. All nine browser suites passed; contrast checks also covered normal, hover and focus states. Final source packaging repeats the production build and start/image smoke. Reports distinguish this narrow final check from the preceding full campaign run.

### Failures that were fixed

1. Baseline ESLint had 71 warnings. Removed unused code, repaired effect dependencies/state synchronization and replaced art markup with explicitly sized, unoptimized images. `pnpm lint` now rejects any warning. `lint-config-check.mjs` still rejects intentionally invalid hooks and explicit-any examples; no rule was disabled.
2. Splitting client chunks initially caused React initialization failure on a real production start. The shared chunk config now preserves strict execution order; both browser hydration and desktop launch were tested. Largest JavaScript chunks are approximately 229.5 kB across both targets, without raising the warning threshold.
3. A first desktop image-shim route lacked verifiable shipped license text for transitive packages. The license gate was not bypassed. Actual Next browser Image was used, then an ESM adapter selected its named component to fix a CommonJS wrapper causing React error #130. Two failing startup attempts are retained locally; the successful native report is separate.
4. Native failure cleanup could wait on the unsaved-close dialog. The isolated QA harness now records renderer error stacks and destroys its own QA windows on failure before closing. The stalled owned test process was terminated; user applications were not targeted.
5. The payoff harness initially resized to mobile with the mission overlay still open, so the overlay correctly intercepted its shop click. The harness now closes that panel through its visible close button before continuing; no force-click bypass was added.
6. Independent braces review found numeric coercion, cumulative compile work/output and argument-overload gaps in intermediate local patches. They were corrected and rechecked against untouched upstream behavior. The installed-path gate was updated with the final probe count. Intermediate passes are not used as final security evidence. See [security review](security/review-0.13.1.md).

The production build prints Vinext's informational note that its static analyzer cannot classify `/` as static/dynamic. This is not treated as an execution test or silently removed; actual production-start checks cover the route. Raw registry audits still report one High in build tooling because upstream has no fixed release; web and desktop production audits report zero. Local mitigation is not described as an official advisory fix or proof of universal security.

### Reproduce and inspect

```sh
pnpm verify
node scripts/lint-config-check.mjs
pnpm build
pnpm desktop:build
node tests/e2e/native.cjs
node desktop/scripts/package.mjs --qa
node tests/e2e/packaged.cjs
node desktop/scripts/package.mjs
node desktop/scripts/verify-offline.mjs
```

The browser Python scripts use the configured local Playwright environment and a production server on 127.0.0.1:5173. Run only one heavy build/browser/native/package operation at a time. The owned wrapper stops its server even on test failure. Do not execute tests against a player's production browser profile.

Final passing logs and reports are delivered in `D:/코딩게임/출시자료/0.13.1-RC/qa/`; `delivery-receipt.json` binds source SHA, public deployment, package, ZIP and artifact hashes. Earlier failures remain in local ignored output for diagnosis, not as evidence of a pass. Only this run's UltraQA state is cleared; cleanup receipt records the absence of its state and owned QA processes.

### Remaining release checks

The current artifact is an unsigned offline Windows x64 RC. It has no configured Steam AppID. AppID 5336990 is another game and must not be used. Steam registration/upload/review, real Steam launch/achievements/Cloud, signing and a separate clean/low-spec PC remain pending. No launch price or discount was applied to Steam.

Human beginner/expert enjoyment, comprehension and learning transfer are pending, as are native-speaker EN/JA review. [The playtest protocol](playtest/protocol.md) now includes actual reference-derived usability observations. The new [reference comparison](references/benchmark-2026-10-10.md) specifies sampled frames/subtitles and does not claim full-video viewing. No external participant was contacted and no human results were invented.
