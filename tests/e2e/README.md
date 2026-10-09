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
