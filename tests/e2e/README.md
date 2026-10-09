# Desktop browser checks

From the repository root, run a local dev server and execute these Python Playwright scripts serially, never in parallel. They launch headless system Chrome with isolated profiles and close them in finally blocks. Install Python Playwright if your machine does not already provide it. No production/player storage is touched.

```
python tests/e2e/campaign.py
python tests/e2e/adversarial.py
python tests/e2e/final-smoke.py
```

The campaign is UI-only from fresh storage to the ending, then checks window operations and notes. The adversarial script covers EN/JA first-case completion at 390×844, actual alternate-script cafe names, invalid/repeated practice submissions, save reload, malformed storage, terminal completion/history, oversized file paths, window bounds and about pages. Evidence is written to ignored output/pc-qa. Assertions and failed screenshots surface errors; a CLI exit alone is not completion.

The authored promotional capture is media/trailer/capture.py. It also advances only through visible controls, with deliberate filmed pauses. Rendering is serial and described alongside its editable EDL.

The final smoke checks actual playback/seek of each localized trailer, canonical metadata, empty desktop after Start and localized terminal help. It needs the rendered public/media files. All scripts target http://127.0.0.1:5173 and create their evidence directory when missing.

## 0.8 career and native checks

Run `campaign.py` first: its real UI-earned cafe save is the fixture for `career.py` and `career-tools.py`. Career completion reads optional example answers on screen and fills the real editors. It is an assisted functional test, not a novice study. The three language routes each deliver 18 jobs and record an ending; tools checks include checkpoint restore, Undo across tabs, JSON completion, paired output, file navigation, and rejected imports.

```powershell
python tests/e2e/career.py
python tests/e2e/career-tools.py
node scripts/build-desktop.mjs
node tests/e2e/native.cjs
node desktop/scripts/package.mjs --qa
node tests/e2e/packaged.cjs
```

The Node native harnesses use the installed skill Playwright package by default; set `PLAYWRIGHT_PACKAGE` to the absolute directory of a local `playwright-core` package elsewhere. They need the Electron dependency/runtime under desktop. `native.cjs` uses a new marked QA profile and checks cafe/career UI, native IPC, local save/close/reopen, export/import, blocked external fetch and corrupt-primary recovery. Native export selection is mocked to a file within the test profile, while actual writing uses the real export handler. `packaged.cjs` launches only the specially flagged QA package and uses Chromium CDP because Node inspector fuses are disabled. Neither touches the production user profile.

Evidence is written under ignored `output/steam-qa`. A current test receipt must distinguish source runtime, packaged QA smoke and actual production/Steam verification. The QA package must never be distributed as the player release.

## 0.9 visual/gameplay checks

`game-art.py` checks decoded title art, empty desktop, portraits and the real map → job → delivery/stamp route, followed by narrow layouts and reduced motion. `art-languages.py` checks EN/JA map text, keyboard pins, locks, a visible mobile CTA and opening the actual request. Both need the UI-earned cafe fixture from `campaign.py`. Their evidence is under `output/art-qa`.

After rebuilding the renderer and completing packaged QA, run the default `node desktop/scripts/package.mjs`, then `node desktop/scripts/verify-offline.mjs`. The latter compares game files to the QA archive, checks all four images against source, checks production flags/fuses, Steam exclusion and license notices. Its report is a static package integrity check, not a real Steam or clean-machine run.
