# Electron desktop security review — 0.11

2026-10-09. The reviewed source and isolated Node probes found one Medium issue in QA profile isolation, D-01. The root alias and subsequent child-directory variants have been fixed and covered by regression tests. No confirmed Critical or High renderer-to-host issue was found in the reviewed desktop shell. This is a source and lightweight test assessment; it is not a penetration-test certification or approval of a rebuilt executable.

## Scope and evidence

Reviewed `desktop/main.cjs`, `preload.cjs`, `security.cjs`, `save-store.cjs`, `profile.cjs`, `export-backup.cjs`, `steam.cjs`, and `scripts/package.mjs`. Renderer save entry points in `lib/game/save.ts`, `load-progress.ts`, `components/game/GameShell.tsx`, and `SaveTools.tsx` were traced to distinguish native envelope validation from normal import/persistence validation.

Applied [security-best-practices](C:/Users/최용우/.codex/skills/security-best-practices/SKILL.md) and its general JavaScript frontend guidance. The skill has no dedicated Electron reference, so the native boundary review also used the current official Electron security, protocol and fuse documentation listed below.

The baseline Git HEAD was `838525d730ee348563afc3612412ed5b4c2dde83`; D-01 is a subsequent working-tree change. Per-file SHA-256 values in the probe reports bind the conclusions to the files actually read. Dependency updates or later packaging changes must be reviewed using their new evidence.

| Evidence | Actual coverage |
| --- | --- |
| [desktop-probes-before-fix.json](../../output/0.11-security/desktop-probes-before-fix.json) | Vulnerable QA alias acceptance and fixture-only writes, original source hashes |
| [desktop-probes.json](../../output/0.11-security/desktop-probes.json) | Eight isolated probe groups after fix, including mocked Electron main boot and rejected QA aliases |
| [desktop-unit-tests.tap](../../output/0.11-security/desktop-unit-tests.tap) | Final source: 22 relevant unit tests passed, 0 failed, 0 skipped |
| [profile-final-verification.json](../../output/0.11-security/profile-final-verification.json) | Final child-path fix hashes and validation; older independent probe JSON describes the earlier root-only fix |
| [windows-path-probes.json](../../output/0.11-security/windows-path-probes.json) | Six Windows trailing-space/dot path attempts returned ENOENT; outside sentinel not read |
| [desktop-audit.cjs](../../output/0.11-security/desktop-audit.cjs) | Reproducible probe code; no Electron/browser launch |

Commands:

```powershell
node output/0.11-security/desktop-audit.cjs
node --test --test-reporter=tap desktop/tests/security.test.cjs desktop/tests/save-store.test.cjs desktop/tests/profile.test.cjs desktop/tests/export-backup.test.cjs desktop/tests/steam.test.cjs
git diff --check -- desktop/profile.cjs desktop/tests/profile.test.cjs docs/security/desktop-review.md
```

Node v25.9.0 on Windows ran these tests. All newly added attack fixtures are under `output/0.11-security`; no real Electron user profile or Steam account was accessed. Fixture directories contain junctions and are test artifacts, not release payloads.

## D-01 — Medium, fixed: QA junction can alias the production profile

Original location: `desktop/profile.cjs:5` (`normalize`/`overlap`), `selectProfile` and `prepareProfile`. Before the fix, `path.resolve(...).toLowerCase()` checked only lexical overlap. Windows `statSync`, `mkdirSync` and writes follow a junction's actual target.

Actual reproduction created an empty simulated `appData/CODE-SHIFT` directory and an external-looking `qa-junction` pointing to it. `selectProfile({packaged:true, qaBuild:true, argv:['--qa-user-data=<junction>']})` accepted the alias. `prepareProfile` then wrote `.codeshift-qa-profile` and created `browser` inside the simulated production directory. A future child below a junction also bypassed lexical overlap.

Impact: QA execution can accidentally use the production storage directory, undermining the isolation promised to testers and putting real progress at risk in subsequent QA runs. This requires a local junction and a QA/development launch. It is not a remote renderer exploit, privilege escalation, or demonstrated deletion of real saves. Production packaged builds already reject the QA argument.

Fix: `canonicalPath` at `desktop/profile.cjs:10` resolves the nearest existing ancestor with `realpathSync` and appends missing components. `assertQASeparate` at `desktop/profile.cjs:41` rejects canonical overlap with the production profile and aliases to a filesystem root. Selection and preparation both check separation; preparation rechecks after directory creation. The selected QA profile retains the production directory needed for these later checks. Filesystem errors fail startup rather than falling back to the production profile.

Regression coverage in `desktop/tests/profile.test.cjs:36` includes a pure mocked ancestor resolver, an actual Windows junction, a missing descendant below that junction, and a junction introduced between selection and preparation. The production fixture remained empty in all rejection cases. The independent after-fix probe also rejects both alias variants. These checks do not claim to defeat an actively racing same-user process changing reparse points between every filesystem operation; the app runs without elevated privileges and does not treat a same-user malicious process as a privilege boundary.

### D-01 follow-up — child directories, fixed

A subsequent read-only source check found that an isolated marked QA root could still contain `browser/` or `saves/` junctions into production. This is a local same-user isolation accident risk, not a remote or elevated-privilege exploit. With the parent's authorization, the fix now validates canonical containment for `browser`, `saves`, `.codeshift-qa-profile`, `saves/game.json`, `saves/game.json.bak`, and both save temporary filenames during selection/preparation, before writing the QA marker. `canonicalPath` uses lstat so an existing dangling reparse entry does not masquerade as a missing ordinary path; unresolved targets fail startup. The checks inspect only known startup paths, not the Chromium cache tree.

Tests cover marked roots containing real Windows junctions for both child directories, marker and all four save filenames; a child junction introduced between selection/preparation; and a dangling outside target that must not be created. File-named path tests use directory junctions to avoid relying on Windows file-symlink privileges; they establish target-containment rejection, not native save parsing of those entries. All 22 relevant unit tests passed with no skips. Added test fixtures validate their output boundary and junction target before unlinking entries and removing empty directories without recursive delete calls. The final profile source hash is `523c12625882202e43b84df892b7e8eb0e8f748531ff19a1c3bafa58d8bdd3e7`. The fix does not continuously police paths after startup or claim to prevent an actively racing same-user process from changing them.

## Boundaries verified, and their practical limits

**Host-file protocol access.** `security.cjs:13` allows only the `codeshift://app` authority with no user info or port. `resolveAsset` at line 21 decodes once, rejects separators/dot segments/NUL, and bounds the resolved path under the renderer bundle. `main.cjs:86` serves only GET, known MIME extensions, and applies CSP plus nosniff headers. The corpus rejects file/HTTPS/other-origin/credential/port/encoded traversal/encoded backslash/NUL/malformed UTF-8 requests. WHATWG-normalized `../` paths stay within the renderer root; they do not reach host files. Double encoding remains a literal filename after a single decode. Additional Windows suffix probes did not read an outside sentinel. Asset symlinks or mutable unpackaged directories are not separately canonicalized; the release design relies on packaged ASAR integrity, so this result does not cover a locally modified development bundle.

**Renderer and IPC.** `main.cjs:104` enables context isolation and sandboxing and disables Node in the main renderer, workers and subframes; webSecurity remains enabled, webviewTag and insecure content are disabled. `preload.cjs:3` exposes fixed methods rather than `ipcRenderer`, filesystem APIs, arbitrary channels, or Electron event objects. Every native handler is registered through `main.cjs:63`, checking owned webContents, identical mainFrame, origin, and URL via `security.cjs:36`. Mocked main boot confirms all eight handlers reject an untrusted frame before executing their callback. These are code-level tests with fabricated WebFrame objects, not evidence that Chromium frame behavior was attacked in a real binary.

**Network and navigation.** `main.cjs:79` denies permissions, line 81 cancels requests except packaged origin/data/blob/about, and line 85 blocks downloads. CSP has `connect-src 'none'`, `worker-src 'none'`, and scripts restricted to self. Lines 111–114 deny new windows, navigation, redirects and attached webviews. No `shell.openExternal` or host command IPC is exposed. The main mock confirms HTTPS/file/WS/other custom-origin requests are canceled and navigation hooks call preventDefault. Native WebSocket, iframe and download event behavior remains a runtime verification item. Data/blob/about allowances support in-memory game previews; they do not grant a host-file read API.

**Save and export integrity.** `save-store.cjs:7` bounds native input at 16 MiB and checks a basic version/mission/object envelope, not the full game schema. Invalid JSON/envelope input preserves primary and backup and leaves `drain()` failed. Writes serialize, sync a temporary file, and rename; recovery protects the prior backup for the next save. `lib/game/save.ts` applies the full schema and career/lab proofs before normal persistence/import; `load-progress.ts` retries the backup if full parsing fails, while `GameShell.tsx:63` validates before save IPC. The shape-only native probe intentionally succeeds: it documents the trust boundary rather than claiming arbitrary malformed imports are blocked in main. An already-compromised owned renderer can replace local progress through the offered save method, including with an envelope-valid invalid state; no normal malicious-import path to that state was reproduced. Full validation in main would be additional hardening, but is not reported as a confirmed independent escalation. Fixed save names prevent a renderer-chosen path. `main.cjs:128` obtains export destinations from a native save dialog, and `export-backup.cjs:7` validates before a UUID temporary file and atomic rename. Invalid exports preserve a sentinel; a valid export overwrites only the explicitly selected file. Same-user filesystem junction/symlink manipulation of save folders is not an elevated-user boundary.

**Steam claims.** `steam.cjs:6` rejects SDK AppID 480 and invalid IDs. Identity mismatch, missing module and thrown native calls leave Steam unavailable; activation/store failures return `ok:false`. Unlock input is limited to the fixed catalog. The tests use a simulated native client and do not prove ownership of a real AppID or live achievement integration. Offline continuation is intentional and does not report successful Steam unlocking. A compromised renderer may request any catalog achievement without main recomputing its gameplay proof; this is a local achievement-integrity limitation, not a host-code execution path. `steamAvailable` means adapter initialization with a matching configured AppID, not confirmed ownership, release approval or store availability.

**Packaging fuses.** `scripts/package.mjs:47` disables RunAsNode, NodeOptions environment handling and CLI inspect; it enables cookie encryption, embedded ASAR integrity validation and OnlyLoadAppFromAsar. The Steam build requires a nonexample AppID and native SDK files; QA and Steam flags are incompatible. Offline packaging excludes steamworks and writes null Steam config. These settings were reviewed in source only in this task. A new package must be inspected with `getCurrentFuseWire` and ASAR file comparison; source intent alone is not proof of fuse bits in the shipped EXE. External Steam config and unpacked native DLLs are not authenticated by the application ASAR integrity setting.

## Scoped review disposition and remaining verification

D-01's root and child isolation variants are resolved in source and regression evidence. No open Critical/High or reproduced renderer-to-host traversal/IPC escalation was found within this scope. Release approval remains conditional on inspecting the rebuilt package, validating native sandbox/preload/origin behavior, and checking the final dependency audit; this reviewer did not start a browser, native executable, build, packager, or Steam session. The broader renderer/parser/dependency audit belongs to the other review owners and is not subsumed by this document.

The three probe fixture trees were later removed after validating their absolute paths and actual junction targets within `output/0.11-security`, unlinking junctions first, and deleting only files and empty directories without recursion. Before/after JSON, TAP, scripts and logs remain. [cleanup.json](../../output/0.11-security/cleanup.json) records the checks, deletion outcomes and preserved evidence hashes. Rerunning probes creates new fixture trees; old JSON paths document the original run rather than existing fixture data.

## Official references inspected on 2026-10-09

- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security): recommends sandbox/context isolation, narrow IPC exposure, sender/origin validation, limited navigation/new windows, custom protocols and fuse review.
- [Electron protocol](https://www.electronjs.org/docs/latest/api/protocol): custom protocol registration belongs to the window's actual session; this app uses the same local session for the handler and BrowserWindow.
- [Electron Fuses](https://www.electronjs.org/docs/latest/tutorial/fuses): documents the ASAR-only search behavior and embedded ASAR validation combination, plus disabling unused Node/inspect options.
