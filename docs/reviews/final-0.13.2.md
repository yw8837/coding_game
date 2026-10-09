# Final source review — 0.13.2 RC

Date: 2026-10-10. Baseline: `b8d5ab1f88880455f18d87289c3d812031040f86`; reviewed the current uncommitted changes in `C:/codex-workspaces/codeshift-game`.

**Decision: approve the reviewed changes. No outstanding defect or security regression was found within the bounded source-review scope.** This approval does not certify builds, browser results, packaging, deployment, trailer footage, or human enjoyment/learning outcomes.

## Findings and resolution

| Finding | Severity | Source-reviewed disposition |
| --- | --- | --- |
| Second monitor did not provide its promised output panel in guided/JavaScript editing, and its panel was hidden in narrow containers | P1 purchase-behavior defect at baseline | Resolved in `components/game/CareerView.tsx:148` and `app/career.css:143`: a shared editing stack renders the owned-monitor panel outside the mode branches; narrow containers retain the panel in one column. |
| Offline report import could overwrite edits/new sessions made while awaiting file reading | P2 pre-existing data-loss defect | Resolved in `tools/playtest/kit.js:28`: the existing report is collected and validated after `await file.text()` and incoming parsing. There is no further asynchronous yield before conflict checking, merge validation, and persistence. Concurrent reads consequently merge against the current report rather than an earlier snapshot. |
| Offline renderer metadata contained a hardcoded 0.13.1 version | P2 metadata consistency defect | Resolved in `scripts/build-desktop.mjs:8`: version comes from the project-root `package.json`, resolved relative to the script. Root and desktop package sources currently both declare `0.13.2-rc.0`. |

The monitor still displays evaluations derived from saved canonical career files. Its shared panel does not execute unsaved JavaScript drafts or grant proof, completion, credits, or XP. Existing dirty-state, inspection, fresh-test, reply, and delivery checks remain in place. Narrow-screen visibility is correct in the CSS rules inspected; actual rendering remains a separate runtime check.

The report-import fix preserves the existing size/type/schema checks, duplicate-ID conflict rejection, merge-size validation, and all-or-nothing report persistence. Validation and merge happen synchronously after reading, so an invalid incoming file does not mutate the report. The source continues to display imported notes through `textContent` and input `value`, with no new HTML/code execution or network request path.

Experience classification (`tools/playtest/data.js:39–41`) retains self-record priority, distinguishes experienced records, and classifies older `beginner + experienced` records without rewriting them. JSON version 1, the 22 CSV columns and seven task IDs remain intact. Confirmed participant counts still require consent and the relevant experience response; blank ratings, untested observations, and uncertain independent outcomes remain separate. The overview explicitly distinguishes session buckets from confirmed participant counts.

The build-metadata change reads trusted local package metadata using the established project path. It adds no network access, shell execution, or dependency. It removes the stale literal while preserving the metadata's runtime and network-required fields.

## Evidence and limits

Inspected source/diffs: `components/game/CareerView.tsx`, `components/game/CareerCode.tsx`, `app/career.css`, `tools/playtest/data.js`, `tools/playtest/kit.js`, `tools/playtest/index.html`, `tools/playtest/data.test.cjs`, `tests/e2e/playtest-kit.py`, `tests/e2e/upgrade-preview.py`, `scripts/build-desktop.mjs`, root and desktop `package.json`, and `docs/playtest/protocol.md`. Related career transaction/evaluation boundaries were inspected during the economy review documented in `economy-2026-10-10.md`.

The new held-`Blob.text()` browser-test source deliberately pauses an import, edits notes and adds a session, then asserts the imported session and both live sessions survive with the note preserved. Its assertions address the identified race rather than merely mirroring the implementation. Existing classification/import tests cover legacy records, separate groups, missing ratings and preserved notes. These observations describe test content; this reviewer did not execute those tests.

This reviewer ran read-only file/diff searches and created this report only. No product source was changed, and no tests, browser, build, install, server, packaging, or deployment operation was run. Main-task QA/build statements were not independently verified and are not treated as this report's execution evidence. This is a bounded correctness/security review of the named changes, not a full application security audit or release acceptance record.
