# Launch quality pass — 2026-10-10

User direction: social posts are finished; prioritize game quality and release.
Baseline source: 84e6cbe. Existing Windows candidate: 16c8fab (older source).
Use review-game for read-only review, UltraQA for bounded execution and repairs.
No purchases, Steam registration/submission or social posting. The later user request authorizes updating the public demo and adding an owner-only operations dashboard; preserve the existing public demo audience.
One heavy build/browser/Electron process at a time; isolated QA profiles only.

Current results and remaining gates: [QA checkpoint](QA-launch-quality-2026-10-10.md).
The matrix below records the original planned scenarios; the checkpoint is the result ledger.

## Acceptance and scenario matrix

| ID | Intent / model | Setup and command | Expected result | Result / evidence | Cleanup |
|---|---|---|---|---|---|
| BASE | Maintainer, existing clean repo | node scripts/verify-quality.mjs | zero lint/type errors; unit suites and installed mitigation pass | Pending | No player state accessed |
| ONBOARD | First-time player, KO/EN/JA, smaller viewport | current coach/state-sync UI harnesses on local full client | visible current goal, opt-in hints, no completion from merely opening an app; window restoration | Pending | Owned server / contexts closed |
| FREEDOM | Experienced player, alternative code and stale checks | freedom-regressions.py | supported alternative solutions pass; editing invalidates proof; no duplicate reward | Pending | Isolated profiles |
| HOSTILE | Malformed save/code, bounded execution and markup | web-security.py | invalid input rejected, existing progress retained, host/network escapes blocked, legitimate repair still works | Pending | Local owned fixtures only |
| NATIVE | Installed-client player, interruption/recovery | rebuilt renderer + tests/e2e/native.cjs | cafe3, career18, final release, save/reopen/import and corrupt-save recovery | Pending | QA profile isolated; app closed |
| PACKAGE | Windows recipient | production + distinct QA packages; tests/e2e/packaged.cjs; offline package comparison | latest renderer in both, QA=false in distributed package, valid notices/fuses, no unrelated Steam AppID | Pending | Keep old release, deliver new directory |
| REFERENCES | Honest benchmarking status | verify the four reference reports and their local evidence | distinguish sampled visuals/full transcript from uninterrupted viewing; map findings to existing/remaining game work | Pending | Read-only |

Maximum five QA cycles; stop and diagnose the same failure after three repeats.
A successful automated path is not evidence of human enjoyment/understanding,
language review, another PC's minimum specifications or Steam review acceptance.
Do not mark the entire game ready for sale on the strength of this pass alone.
