# Final project: player-authored pages, personal images, and a release ending

## Player flow

1. Complete the existing neighborhood route: four jobs in each of three districts.
2. Choose **website** (HTML/CSS, text and pictures) or **web app** (the same authored page plus searchable items, category filtering and browser-local inquiries).
3. Edit `index.html`, `style.css` and project metadata. The page supports semantic sections, headings, lists, images, flex/grid layouts, responsive media rules, colors and spacing. Help and examples open only on request.
4. Optionally import PNG/JPEG/WebP photos from the local PC. The importer decodes and resizes them to a bounded raster; `assets.json` retains the data, not a disk path. Insert an `asset:photo1` image tag into the actual HTML and edit its placement or description.
5. Inspect narrow/wide previews, check current sources, record version 1.0.0, and publish inside the game. Changed source or image data invalidates previous checks/builds.
6. View three fading scenes: neighbors using the released project, a coffee celebration, and the protagonist back at their desk. The player's project name, format and purpose carry into the ending. Pause, previous/next, skip, and reduced-motion manual advance are available.
7. Continue unfinished jobs or enter the real editable studio from the credits. The first publication stays immutable. Studio drafts and bounded version snapshots remain in the save.
8. Export a portable HTML file with the actual authored page and its embedded pictures. The web-app version includes supported search, filtering and local inquiries. This does not publish a real server or run arbitrary player JavaScript.

## Compatibility and limits

- Existing release saves retain legacy evaluation and source hashes. They are not silently converted.
- An explicit studio conversion preserves the pre-conversion draft snapshot and original publication. Restoring an older snapshot restores its corresponding editor mode.
- Separate release/studio format markers keep the editor stable while `project.json` is incomplete.
- Up to three imported images; the UI compresses each to at most 150,000 data-URL characters. Combined embedded data is bounded to 480,000 characters. Source files are bounded to 20,000 characters; the optional asset map has its own 500,000-character cap.
- Exported HTML remains at most 512 KiB. Repeated image placements count toward the expanded document size.
- The save retains the existing 4.1-million-character ceiling. Draft writes and snapshots check their projected size and explain capacity refusals instead of silently destroying prior work.
- CSS checks validate supported syntax and basic responsive declarations. They do not prove every possible layout fits; players can inspect the real narrow and wide previews.
- The terminal and server remain simulated. Player scripts, network resources, active HTML and executable image markup are rejected.
- Legacy exported inquiry records remain readable by converted web apps using the same app identity.

## Implementation and validation record

The shared compiler lives in `lib/game/release-authored.ts`; both the sandboxed preview and exports use it. `AuthoredProject` and `ProjectImageLibrary` provide the new editor and file import. The legacy components remain separate for old saves. Ending art provenance is in `docs/art/ending-2026-10-13.md`.

Backend implementation: `/root/authored_project_engine` (GPT-6.1 Sol/high). Independent security/save review: `/root/authored_security_review` (GPT-6.1 Sol/xhigh). Ending and native UI harness: `/root/window_ux_fix`. Art: `/root/release_trailer`. Root integrated the UI and executed the final checks. Verification receipts and native captures are recorded separately in the release QA report; this design note is not a substitute for a passing gate.
