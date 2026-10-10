# Implementation and validation plan

Spec: [full-version quality](full-version-quality-spec-2026-10-10.md).

Plan critique approved a supported-format studio on these conditions: first-release bytes remain immutable, every file mutation invalidates studio checks, legacy releases migrate only into the new copy, snapshots have strict bounds, and export compiles escaped data rather than executing player source.

## Ownership and order

- `studio_implementation` — GPT-6.1 Sol / high: studio model, strict save validation, terminal invalidation, post-release editor/preview/history/export generator. Multi-module implementation.
- `career_ux_implementation` — GPT-6.1 Sol / high: contextual diagnostics and persistent delivered-work portfolio. Separate view/model ownership.
- Main — native export boundary, localization, integration QA, package evidence and commit/push. Heavy jobs run one at a time.
- `full_version_review` — GPT-6.1 Sol / high: pre-implementation architecture critique and independent security/quality review. Read-only.

These task identifiers are real collaboration calls, not external user chats. Autopilot explicitly authorizes executor/reviewer delegation. Automatic model routing was not activated.

## Scenario matrix (planned before execution)

| ID | Intent / actor | Setup and harness | Expected signal | Actual / fixes / evidence |
| --- | --- | --- | --- | --- |
| S1 | Player opens studio after release | Published current + legacy saves; model tests | New independent copy, old first release unchanged, save round-trip | PASS — studio tests + studio-native report |
| S2 | Player edits and retries | UI editor, terminal mutations, checks | Stale success removed, explicit recheck required, no reward duplication | PASS — terminal/model tests; native pending-save and draft checks |
| S3 | Player records/restores versions | More than history limit; restore/cancel | Bounded snapshots, immutable bytes, preserve current work on cancel | PASS — bounded unit history; native Escape/focus/restore/recheck |
| S4 | Malformed or oversized save/source | JSON/traversal/Unicode/missing files/stale hashes | Reject invalid save safely; no host execution or writes | PASS — legacy collision and exact-cap regressions; source bytes retained |
| S5 | Export app, then use it | KO/EN/JA standalone HTML in isolated browser | Search/category and local inquiries work; empty/no-result/error states truthful | PASS — Chrome file:// at 360px; three locales and inquiry reload |
| S6 | Hostile exported data | `</script>`, HTML attributes, storage corruption/quota | Data stays text; no injected code/network; storage failure visible | PASS — real browser hostile inquiry/quota/corruption; export runtime bounds |
| S7 | Native export write/cancel/failure | Unit fixtures and isolated desktop harness | Main-owned HTML path, byte cap, atomic write, temporary cleanup, honest result | PASS — 5 export tests, native cancel + real writes |
| S8 | Beginner sees failure | Partial/bad code, config and JS paths, draft/stale | Real count and first failed case; exact/candidate file links; hints stay closed | PASS — real 3/9, 20/20, dirty draft and syntax 0/6 native UI; not a human comprehension test |
| S9 | Player sees completed-work portfolio | Delivered/unfinished jobs; client choice | Real results and earned rewards; visit old work; available next jobs | PASS — five delivered fixture jobs, real replies/results, no re-reward, relaunch |
| S10 | Existing campaign and save flow | Native campaign E2E; fresh/reset title checks | Cafe, career, release, ending and continued work survive relaunch | PASS — current campaign native run: 3 cafe +18 jobs +release/ending/recovery; title reset dedicated test unchanged from baseline |
| S11 | Responsive and localized UI | KO/EN/JA at native minimum and large size | No clipped primary action; usable focus and readable content | PASS — studio min/large, career min; measured DPI-rounded viewport and screenshots |
| S12 | Actual package and runtime boundary | Packaged QA smoke; offline package integrity | Local save/reopen, no Node exposure/remote requests, valid distribution files | PASS — packaged smoke and 45 current-source/QA/package file matches; secure fuse checks |

Failures are classified as product, harness, or external-service errors. Same unresolved failure three cycles or five total QA cycles stops that loop with evidence. No automatic production deployment. Preserve player profiles; use isolated QA profiles. Final reports record actual outcomes and cleanup.

Final findings, commands, exact evidence and remaining release gates are in [QA-0.14-RC.md](QA-0.14-RC.md). Owned processes closed, ten marked profiles removed, isolated OMX state cleared/confirmed absent; evidence preserved.

## Skill/tool decisions

`find-skills` checked skills.sh and searched `game accessibility`. Existing local game-ui-ux, game-feel, review-game, webapp-testing and ultraqa already cover this work; no speculative skill installation is needed. `ask-matt` is used as a routing guide (spec → implementation → test → review), not as an excuse to re-interview the user or configure an unrelated issue tracker. AI Tech Studio i400 informs partial feedback; its school-demo visuals and loose tolerances do not apply. i208 was evaluated but adding floating coins would clutter the desktop, so existing earned-credit feedback is retained.
