# CODE:SHIFT 0.7 gameplay verification — 2026-10-09

This is the current verification overview for three chapters, the saved OPEN ending and six optional practice jobs. The former 0.3 one-mission verification, `intro-demo-verification.md` and older screenshots are historical. Their balances, focus behavior and public-access statements do not establish 0.7 results. The main task maintains the full current checklist in [QA-0.7.md](QA-0.7.md).

| Evidence | Recorded result |
| --- | --- |
| `output/pc-qa/unit.log` | 55 tests, 55 passes; failure/cancelled/skipped/todo all 0 |
| Final-source `tsc --noEmit` | Main task confirmed exit 0; `typecheck.log` has no diagnostics |
| `output/pc-qa/campaign-report.json` | `ok: true`, errors empty; three chapter deliveries, simulated server/API work, OPEN ending |
| `output/pc-qa/adversarial-report.json` | EN/JA first chapter, practice and reload succeeded; overflow false; malformed-save recovery, terminal Tab/history, oversized-path rejection and bounded resize cases |
| `output/pc-qa/final-smoke.json` | KO/EN/JA information-page metadata, 1920×1080/42-second video loaded and began playing, no media/page errors |

The campaign report begins at first-chapter staging, so its step list alone does not document every preceding onboarding action. The main task separately reported final Start-to-empty-desktop and localized terminal `help` smoke checks. These observations are separate from the final-smoke JSON's page/media fields. The video checks show advancing playback time, not full viewing of all 42 seconds in each language.

The campaign-only result was 1,720 cr / 560 XP, three completed chapters, four story badges and a saved ending. No practice or bonus was claimed in that fixture; later optional rewards and cosmetic spending must be accounted for separately. Player-save fixture contents are not published.

Reports establish bounded automated scenarios. They do not show browser completion of every practice job, every keyboard/assistive-technology path or every device. Unit tests cover additional rule/reward contracts. Session draft retention is distinct from persistence of every window position or temporary input across reload. Screenshot presence alone is not an interaction test.

The main task owns production build/deploy and records public delivery at `D:/코딩게임/출시자료/0.7/verification/release-receipt.json`. Consult that receipt for source/build alignment and public release outcome. Development logs, screenshots, fixtures and player saves stay outside the release archive.

Automated completion confirms a working tested route. It does not prove a novice's comprehension/enjoyment, official age-15 certification, broad accessibility/security certification or Steam/mobile-store packaging and approval. Simulation restrictions and preview isolation are implementation/regression evidence, not a formal penetration-test result.
