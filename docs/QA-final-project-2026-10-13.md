# Final-project authoring — release QA, 2026-10-13

Scope: the full Windows edition on `release/ux-gameplay-20261013`. The public v29 demo is a separate, previously deployed build. This addition has not been deployed to the demo or submitted to Steam.

## What changed

| Player action | Implemented behavior |
| --- | --- |
| Choose a project | Website: personal HTML/CSS and pictures. Web app: the same authored page plus supported search, categories and browser-local inquiries. |
| Write a personal page | Player-authored headings, paragraphs, semantic sections, lists, image positions and supported CSS render in the preview and exported file. Help opens on request. |
| Import PC images | PNG/JPEG/WebP files are decoded, resized and embedded. Up to three images; the original PC path is not required after import. |
| Test and publish | Changed content invalidates previous checks/builds. The current version must pass before its in-game publication. |
| Finish the story | Three illustrated scenes fade between neighbors using the service, a celebration, and the protagonist at home. The player's project title, format and purpose appear in the story/letter. |
| Continue after credits | Continue optional jobs or open the actual studio. Edit/export a separate draft while the first release remains unchanged. |
| Resume an old save | Legacy releases remain in their original mode. Explicit studio conversion retains an old-draft snapshot; restoring it restores the legacy editor. |

## Limits that matter

- This is a bounded coding simulator. It does not execute arbitrary player JavaScript, install real packages or publish a real online server.
- Supported CSS includes ordinary colors, spacing, typography, flex/grid and responsive media rules. Checks validate syntax and basic responsive declarations, not all possible visual layouts.
- Source files are limited to 20,000 characters; exports to 512 KiB. Repeated placements of a large embedded image count toward export size.
- Image input: PNG/JPEG/WebP, up to 15 MB per original file and 40 million decoded pixels. Images are resized to at most 960 pixels on their long edge and compressed further when needed. Up to three images are kept.
- Web-app inquiries are temporary inside the isolated preview. The exported app stores them in its own browser, with no online sharing.
- Studio retains the latest five snapshots when they fit. Capacity refusals keep previous work intact.
- Large terminal output is displayed with a truncation notice. Redirection uses the complete command result. Persisted output history is bounded separately from source/image data.

## Regressions found and corrected during this work

1. Native parent CSP blocked the trusted embedded runtime: fixed with one hashed static runtime, escaped inert data and an isolated iframe. Arbitrary inline scripts remain disallowed.
2. The preview sandbox blocked form submission: allowed forms in the opaque-origin iframe while its CSP prohibits form navigation.
3. Incomplete project JSON switched away from the authored editor: added stable release/studio format markers.
4. Legacy exported inquiry records were discarded: both old and new record shapes are now read, retaining old item labels.
5. Three large images plus five snapshots and repeated terminal reads could exceed save capacity: bounded display/history after redirection, pruned history against total serialized size, and rolled back commands whose data mutation could not fit.
6. Native/export screenshots differed by fractional display scaling: test content and computed styles exactly, geometry within 1/32 CSS pixel, and a representative solid-color patch with capture dimensions differing by at most one pixel and two anti-aliased boundary pixels excluded. No image resampling is used. This is not a claim of full-page pixel equality.

## Verification

`pnpm verify` passed from 2026-10-13 13:57:42 UTC to 13:58:57 UTC: **462 game tests + 41 desktop tests**, zero failures/cancellations/skips; **366 linted files, zero errors/warnings**; typecheck and dependency mitigation passed. Receipt: `output/quality-gate/receipt.json`; test logs in the same directory.

`pnpm build` also completed. Vinext reported plugin timing advisories and that static analysis could not classify the root route; this was not a build failure. The output was not deployed. `tests/e2e/terminal-editing-native.cjs` passed all 33 KO/EN/JA input checks (completion, caret/selection preservation, history, clear and simulated IME handling) with no page errors.

Native UI and portable export: `output/authored-project-native/report.json` passed all four authored cases (EN website, EN web app, KO web app, JA web app) plus the legacy conversion/restore scenario. No page errors. All four exports loaded imported photos, made no external HTTP requests and matched preview text, image data and computed styles. Geometry differed by approximately 0.012 CSS pixels; all representative color-patch interiors matched exactly. Web-app search and local inquiry persistence worked after reloading exported HTML in Chrome.

The native run also exercised stale proof rejection, hostile HTML rejection, incomplete JSON while editing, imported image persistence, 360px previews, 390px ending layout, ending pause/manual/automatic advance, reduced motion, credits-to-studio navigation, remaining jobs, snapshots, and native restart. An earlier capture reported a hidden paragraph in a partly off-screen iframe; an unchanged-renderer rerun passed the native stages. The capture now scrolls the frame into view and waits for document completion before inspecting its content. No product change was made solely to suppress that test failure.

After the user spotted an incorrectly oriented screen in the neighbor illustration, the device was redrawn with the display facing the three people and its plain back facing the camera. The final image was visually inspected and the desktop renderer rebuilt. The final-art EN website/web-app/legacy run passed again; its report and raw English QA videos are under `output/authored-project-final-en`. Final neighbor-art SHA-256: `ac32ae127320e2beee52f09c6031796dbedf5f5115e3b266a15e294222a2e9ea`.

Both production and isolated QA Windows packages were rebuilt. `desktop/scripts/verify-offline.mjs` passed: 53 shared game/runtime/renderer files match across packages and the current source/build; 43 are renderer files. The static trusted runtime hash, eleven included art files (including all three ending images), Electron security fuses and required license files match. The actual QA package passed Japanese preference retention, save/relaunch and absence of renderer `require`. Receipts: `output/art-qa/offline-package-report.json` and `output/steam-qa/packaged-report.json`.

The production package remains an unsigned offline RC with no Steam module and `appId: null`. The QA package is for isolated testing and is not the delivered game. No merge or Steam submission is part of this update.

Independent save/security follow-up: three valid PNGs (479,244 asset-source characters) plus five snapshots produced a 3,369,016-character save. Fourteen alternating large `cat`/`grep` reads, each followed by save/reload, kept displayed output at most 12,000 characters, history JSON at most 121,296 and the resulting save at 3,490,310. Release and studio image sources remained unchanged. Raw `cat` redirection retained all 479,244 characters; appending another source retained all 15,000 characters despite the display cap. Unsupported `grep` redirection rejected the command without changing assets. A 60,000-character copy at a 4,080,000-character state was rolled back, preserving files/gameplay and leaving a readable 4,080,289-character save with the error history.

The authored-project native harness starts from a cafe-completion fixture and earns twelve neighborhood jobs through the game engine. It then uses actual UI for format selection, authoring, image import, checks, publication, story, studio, snapshots, export and restart. This does not represent a new full-campaign human playthrough.

Real beginner enjoyment, independent low-end hardware, native-language editing, Steam integration and Steam review remain outside these automatic checks. No claim is made that every reference video has been watched end to end.
