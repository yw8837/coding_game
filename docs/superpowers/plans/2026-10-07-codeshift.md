# CODE:SHIFT Implementation Plan

> **For agentic workers:** Use the Sites owner workflow for implementation; bounded research/review agents return findings without editing the Site.

**Goal:** Deliver a playable Korean developer simulator with three connected client contracts.

**Architecture:** A pure TypeScript state engine owns virtual machines, files, git snapshots, services, checks and rewards. React desktop applications read that state; browser-only layout measurements supply version-bound evidence. Device-local saves preserve a single-player session.

**Tech Stack:** Vinext/React, TypeScript, installed Radix primitives, Lucide, CSS, Node test runner.

**Spec:** `docs/spec.md`

Implementation and verification evidence are recorded in `docs/verification.md`. Deployment status is reported by the Sites publishing operation.

## Global Constraints

- All installs and networks are simulated game state; never execute player text on a host shell.
- Korean UI; readable 14px controls and 16px body text.
- Dedicated new checkout; Sites owns registration, source synchronization and publishing.
- No model is represented as loaded or running without a real local inference implementation.

## Review Focus

- Quoted command arguments and relative paths must work without exact-string solutions.
- Wrong working directories, absent tools and missing dependencies have distinct failures.
- Editing after commit or test cannot silently alter a remote or approved snapshot.
- Repeated deployment cannot duplicate rewards.
- Invalid saved data and unsupported code cannot crash the game or earn success.

### Task 1: State engine and supported language semantics

Files: `lib/game/content.ts`, `lib/game/engine.ts`, `lib/game/engine.test.ts`.
Interfaces: `createGame(): GameState`, `runCommand(state, input): CommandResult`, `act(state, action): GameState`, `projectFiles(state): Files`, `missionSteps(state): Step[]`.

- Write tests for setup/path errors, staging snapshots, code evaluation, stale checks, API process state and single rewards.
- Observe failures against the engine skeleton.
- Implement deterministic state transitions and bounded expression parsing.
- Run `node --experimental-strip-types --test lib/game/engine.test.ts`; all tests pass.

### Task 2: Playable desktop

Files: `app/page.tsx`, `app/globals.css`, `app/layout.tsx`, `components/game/*.tsx`, `lib/game/preview.ts`.
Consumes Task 1 state/actions. Produces a complete shared-state flow across the desktop apps.

- Build desktop, browser/search/repo, terminal, editor, contract and hint panels.
- Add native rendered CSS checks, live JS totals, API and server panels.
- Add local save recovery, reset confirmation and concise WebMCP state/command tools.
- Verify typecheck and all engine tests; exercise the full game flow in permitted preview if available.

### Task 3: Review and delivery

Files: `docs/verification.md` plus fixes to their owning modules.

- Obtain bounded independent review of the core game consistency.
- Fix material defects and run required verification once on final source.
- Build, push exact source, package and publish private Site.
- Confirm deployment succeeds; provide playable link and clear first-release scope.
