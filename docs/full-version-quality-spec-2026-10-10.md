# Full version quality pass — 2026-10-10

## Scope and evidence boundary

The public demo stays at 6bc997b / Sites v25. Work below targets the offline full edition; no Sites deployment is authorized by this pass. Preserve existing saves, published first-release files, character art and the neighborhood identity.

Reference evidence is in `references/coverage-and-release-2026-10-10.md`. Sampled frames and complete transcripts are not continuous audiovisual viewing. The connected vidIQ tool returned six reports, including a source-access failure and reports contradicted by retained frames; the coverage ledger marks rejected and advisory results explicitly. It has not fulfilled complete viewing. Human enjoyment and learning efficacy remain playtest questions.

## Player outcome

Fix a real problem for a neighbor, see the changed result, earn a useful reward, choose the next job, and ultimately launch a personally authored web app. After the credits, unfinished jobs and the player's own app remain playable.

## Implementation slices

1. Post-release studio: preserve the first 1.0.0 release and ending as immutable history; open an independent editable copy of the authored app. Provide explicit saved/unchecked/checked state, voluntary help, preview, bounded version history and restoration that cannot award credits twice. Export a real, portable HTML app with its own searchable content and browser-local inquiry storage. Clearly label local storage and the supported app formats; do not imply a deployed backend or a general OS/IDE.
2. Actionable job feedback: after an explicit check, show how many real checks passed and the first failing case, with expected/actual output and the relevant file. Never auto-open a solution or grant completion merely for navigating. Clear stale success on edits. Preserve direct terminal and editor flows.
3. Persistent neighborhood results: present completed client work as useful outcomes and an accessible portfolio, with clear next opportunities and routes to unfinished work. Avoid repeated modal rewards, fake visitor statistics, artificial timers and generic confetti.
4. Native delivery: implement a bounded, main-process-owned app export dialog. No renderer-selected paths, no host shell, no automatic execution of exported content. Build and test a new offline Windows package. Steam upload waits for the correct AppID.

## Quality gates

- Unit behavior: immutable release, independent studio edits, migration defaults, duplicate actions, invalid/oversized files, hash freshness, version bounds, restoration, no credit inflation.
- Export/security: escaped markup and script data, language-specific UI, no external network requirement, no embedded secrets/player progress, canceled/failed native dialogs, path handling owned by native dialog.
- UX: KO/EN/JA, keyboard focus, narrow/wide viewports, voluntarily opened hints, correct expected/actual context, visible stale state.
- E2E: launch → credits → studio → edit → check → snapshot → export; edit then reopen; unfinished jobs remain available; prior campaign still passes.
- Build: lint, typecheck, game/native tests, offline renderer, QA package smoke and full distributable integrity. Run heavy operations sequentially.
- Independent architecture, security and code reviews; repair actionable findings before commit/push.

## External release gates

Full video viewing, human beginner/experienced-player sessions, native language review, another Windows PC, final title and the correct Steam AppID/store review remain explicit gates. No build success substitutes for them.
