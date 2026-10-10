# Gameplay review implementation QA — 2026-10-10

Review source: [Claude CR-01–CR-22](claude-review/2026-10-10-gameplay-review.md).
This record distinguishes implementation checks from the review's unmeasured
player-experience hypotheses. Codex owns integration and executable validation;
Claude's original review text is preserved, with its status table updated below
each verified work group. The public demo remains frozen.

## P0 — CR-01 and CR-02

Goal: replace answer-bearing guide headings with decision prompts and frame eight
later job briefs as client symptoms and business rules. Keep essential business
constraints, original source-protection rules and all three languages. Detailed
field guidance remains in opt-in hints. Do not change accepted solutions, reward
rules, saved-file formats or save compatibility.

| ID | Scenario / actor | Harness | Expected signal | Result / evidence |
| --- | --- | --- | --- | --- |
| P0-1 | Returning player opens every affected guided job in EN/KO/JA | `career-guidance-native.cjs`, isolated 8-job progression fixture | Headings do not contain complete answer lines; input placeholder exposes format only | Baseline old renderer reproduces answer leakage; final result recorded after rebuild |
| P0-2 | Player asks for help and chooses an example | Native UI input/click events | Help starts closed; opening/selecting only changes the draft, not the source or rewards | Compare native saved source and wallet before/after |
| P0-3 | Player enters malformed JSON, then a valid but wrong value | Native UI plus persisted save readback | Malformed text rejected; wrong value saved honestly without marking the job complete | Actual virtual file, completion and credit checks |
| P0-4 | Player corrects that value after closing help | Native UI in 3 locales | Source changes only after Apply; no automatic delivery or credit | Save readback and screenshot |
| P0-5 | Existing alternative solutions, protection and old saves | `pnpm verify` | Existing engine, unit and desktop regressions remain green | Baseline and final quality-gate logs |
| P0-6 | Repeated locale/job navigation | Native UI in one isolated session | Input resets between steps, help stays opt-in, no page errors | Report captures errors and every scenario |

No player code is evaluated on the host. Native tests use their own marked
profiles and close their Electron process. Existing D: `.omc/state` and the
reviewer's source file are preserved. Temporary QA state belongs only to
`output/qa-cr-p0-20261010`; retained reports and screenshots are evidence, not
human playtest results.

Remaining review items and the eight playtest hypotheses are tracked in the
original review. No unimplemented CR item is counted as completed by this P0 pass.
