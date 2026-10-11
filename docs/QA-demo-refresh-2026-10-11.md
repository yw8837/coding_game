# Demo refresh verification — 2026-10-11

Scope: inspect the user's latest Localhost Hero demo changes and redeploy the existing public Site at https://code.yeolmaeapps.kr/ . The starting code was C: commit `984a896`, equivalent to the application files in D: commit `8971c7a` after normalizing line endings. D: additionally contains local release assets. The prior public Site was version 25 (`6bc997b`).

## Corrections

- Reproduced title overflow at 390px: the mobile rule joined `Localhost` and `Hero`, producing a 413px content width. Kept the two-line wordmark and adjusted the mobile font scale. The 320px and 390px layouts now pass in all three languages.
- Aligned the live About pages, structured game data, social metadata and site branding with Localhost Hero. Removed outdated title-voting/working-title copy. The English trailer description now correctly identifies its English UI. Internal save keys and media URLs remain compatible.
- Updated the legacy-save regression to explicitly expect the new `studio: null` default while requiring exact equality for all existing career data. Updated the reset test to use the new dedicated settings control.
- Added `tests/e2e/demo-refresh.py` for manual CLI setup, Tab/history/clear, tiling, language/sound flyouts and persisted audio controls, plus three-language About metadata and mobile layout.

## Executed checks

All browser checks use one headless system Chrome at a time, isolated browser contexts, and the production Worker on loopback port 5183. The existing development server on 5173 and player profiles were not modified. The ignored runner only redirects existing tests' loopback base URL and evidence output.

| Check | Result |
| --- | --- |
| `pnpm verify`, before and after corrections | PASS: 332 linted files, zero errors/warnings; typecheck; dependency mitigation; 337 game tests and 40 desktop tests |
| Official Sites production build | PASS. A rebuild initially hit a Windows file lock from the owned preview; stopping that preview resolved it. Plugin timing/static route-classification notices are not silently presented as lint failures or suppressed. |
| `coach.py`, demo edition | PASS: KO/EN/JA, fresh UI play through all 3 cafe chapters and OPEN; incorrect inputs, empty-value blocking, manual hints, real file edits, customer orders/API checks, demo completion and reload |
| `demo-release.py` | PASS: six simulated country/browser combinations, manual language persistence; old full-save import/export preservation; full-game content locked; three About routes |
| `web-security.py` | PASS: malformed/oversized imports preserve existing data, literal history escaping, preview sandbox/CSP, inert injected HTML/scripts, no probe network requests, locked Code Lab; zero page errors |
| `final-smoke.py` | PASS: three localized trailers play and seek, posters decode, canonical/share metadata and music attribution, empty desktop start and localized terminal help |
| `title-save-state.py` | PASS: fresh/reset save does not enable Continue; real typed work resumes; canceled reset preserves it; settings reset remains empty after reload |
| `title-screen.py` after title fix | PASS: KO/EN/JA × seven viewport sizes, keyboard focus, no overflow, title movement/code animation, save and reset behavior |
| `quest-context.py` | PASS: KO/EN/JA × 1280/1366/390px; opening, minimizing, closing, Escape/reopening, manual help, notification dismissal; opening an app does not complete a quest |
| `demo-refresh.py` | PASS: six actual typed setup commands, no completion injection, terminal Tab/history/clear, tiled windows, three tray languages, volume/mute persistence and 1280/390px flyouts; current branding/metadata in KO/EN/JA |

The complete gameplay run uses the existing optional setup assistant. The separate refresh test types `git clone`, `sudo apt update`, `sudo apt install nodejs npm`, `cd menu-site`, `npm install`, and `npm run dev` through visible inputs. Neither constitutes a human novice study.

## Dependency audit and limits

`pnpm audit` still reports **one High development dependency advisory** for `braces@3.0.3` (GHSA-vfj7-8cjw-p6xm); no other severities were reported. The audit's patched_versions field is null. The existing tracked pnpm patch is actually installed on both dependency paths. The mitigation verifier passed 73 hostile probes, 47 normal patterns and 10 bounded-output checks. This is a verified local mitigation, not a claim that the upstream version advisory disappeared or that all security risks are eliminated.

This pass does not validate Steam packaging, account registration, human learning/fun, or new full-edition campaigns. Region detection uses mocked country responses; it is not overseas field testing. No production analytics events or feedback submissions are intentionally created by QA.

## Evidence and publication

Local evidence: `output/demo-redeploy-20261011/`, `output/demo-redeploy-20261011-*.log`, `output/demo-redeploy-20261011-audit.json`, and `output/quality-gate/` in the C: working checkout. Final publication receipts and live checks are delivered separately under D: `출시자료/데모-재배포-2026-10-11/` after deployment.
