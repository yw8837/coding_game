# CODE:SHIFT Windows desktop release candidate

The desktop shell packages the existing game as an offline Windows x64 application. The working title is **CODE:SHIFT**, and the candidate version is **0.9.0-rc.0**. This is a runnable packaging architecture with native-save and Steam adapters; it is not a claim that Steam review, store setup, or release QA is complete.

## Layout and build commands

`desktop/client/entry.tsx` mounts the same `GameShell` as the web game and imports all game styles, including career styles. `desktop/vite.config.mjs` builds a plain client bundle into `desktop/renderer`; it has no Vinext server, Cloudflare worker, remote asset requirement, or runtime dependency on the public website. Game logic remains in the existing shared modules. Generated renderer, native dependencies and packaged releases are ignored by Git.

The root project's dependencies must already be installed. Desktop dependencies have their own package and lock file and do not change the root package. From the project root:

```powershell
npm --prefix desktop ci --no-audit --no-fund
node desktop/node_modules/electron/install.js
node scripts/build-desktop.mjs
npm --prefix desktop test
npm --prefix desktop start
```

Run those steps sequentially. Electron 44's npm package provides an explicit installer instead of an automatic postinstall, so the `install.js` step downloads, verifies and extracts the pinned runtime without launching it. `start` launches Electron and requires an existing renderer bundle. `node scripts/build-desktop.mjs` only builds assets; it does not launch Electron. For an unpacked Windows folder suitable for a manual smoke test or later Steam depot preparation:

```powershell
npm --prefix desktop run package:windows
```

The Windows x64 packaging command must run on Windows x64. It produces `desktop/release/CODE-SHIFT-win32-x64/CODE-SHIFT.exe` plus its Electron runtime. It does not create an installer, sign the executable, launch it, upload a depot, or call a paid service. Copy the **whole directory**, not just the executable. The offline packaging command writes an explicit `appId: null` beside the executable so it cannot silently inherit a developer's Steam configuration.

On 2026-10-09, read-only npm registry checks (`npm view <package> version`) returned and were pinned to:

| Package | Version | Purpose |
| --- | --- | --- |
| `electron` | 44.7.0 | Windows Chromium/Node runtime |
| `@electron/packager` | 20.3.0 | Unpacked Windows folder |
| `@electron/fuses` | 2.1.3 | Disable unused executable entry points |
| `steamworks.js` | 0.4.0 | Optional main-process Steam SDK adapter |

`npm install --no-audit --no-fund` completed successfully in `desktop`, creating its lock file. Node used for preparation was 25.9.0; scripts declare a minimum Node 22.13.0. These pins are a reproducible baseline, not an assertion that they will remain the latest or appropriate for every future release. Review security advisories before shipping and rebuild when updating Electron.

## Third-party notices

The renderer build derives its package list from emitted modules and directly imported global styles, then emits `THIRD-PARTY-NOTICES.txt` and `third-party-manifest.json`. Packaging requires these notices and includes Electron's license and Chromium notices. Packages without installed notice files fail the build unless an exact package/version has a committed upstream fallback whose declared license and SHA-256 match. The only current fallback is `react-remove-scroll-bar@2.3.8`: its published archive omits LICENSE, so the supplement uses the upstream license added later, with provenance and comparison of all 24 distributed source/declaration files against 2.3.7. This is not a recovered release-time LICENSE; see [vendor-notices/README.md](../desktop/vendor-notices/README.md) for the source and limits. Final build and runtime verification remains recorded in [QA-0.9-RC.md](QA-0.9-RC.md).

## Renderer boundary

The main process serves only packaged assets at `codeshift://app/index.html`, using a registered standard, secure custom protocol. The protocol resolves paths inside `desktop/renderer`, rejects other origins and invalid paths, sends a content security policy, and serves only known asset extensions. Production builds contain no source maps. Game preview frames remain sandboxed by the existing game renderer; native IPC accepts only the owned top-level frame.

The Electron window enables context isolation, renderer sandboxing and web security. Node integration, subframe/worker Node integration, webviews and insecure content are disabled. Production DevTools are disabled. Window opening, top-level navigation, redirects, downloads, permission requests and remote network requests are denied. The packaged executable disables RunAsNode, NODE_OPTIONS, CLI inspect arguments and loading app code outside the ASAR; embedded ASAR integrity checking and cookie encryption are enabled. Native `.node` and `.dll` files are unpacked because the OS loader needs real files.

The preload exposes only the following fixed API. It never exposes `ipcRenderer`, filesystem paths, shell commands, arbitrary IPC channels or raw Electron event objects:

```ts
type LoadResult = {raw: string | null; recovered: boolean; error?: string};
type WriteResult = {ok: boolean; error?: string};

interface DesktopBridge {
  getPlatformInfo(): Promise<{
    runtime: 'desktop';
    version: string;
    steamAvailable: boolean;
    steamLanguage?: string;
    osLanguages: string[];
  }>;
  setLanguage(language: 'ko' | 'en' | 'ja'): Promise<{ok: boolean}>;
  loadSave(): Promise<LoadResult>;
  loadBackup(): Promise<LoadResult>;
  saveGame(raw: string): Promise<WriteResult>;
  exportBackup(raw: string): Promise<WriteResult & {canceled?: boolean}>;
  unlockAchievements(ids: string[]): Promise<{ok: boolean}>;
  onBeforeClose(callback: () => void): () => void;
  confirmClose(): Promise<{ok: boolean}>;
}
```

`window.desktopBridge` is present only in the desktop shell. The shared game's platform adapter owns browser fallback, language selection, schema validation, achievement predicates and UI messages. A Steam `steamLanguage` value uses SDK names such as `koreana`, `english` or `japanese`; the renderer maps those to `ko`, `en` and `ja`. Saved explicit language preference should take priority over a first-run platform suggestion.

## Native save and closing behavior

The fixed Windows save paths are `%APPDATA%/CODE-SHIFT/saves/game.json` and `game.json.bak`. Electron's browser session data lives in `%APPDATA%/CODE-SHIFT/browser`; both directories are created before Electron path overrides are applied. No save method accepts a path. The shell allows at most **16 MiB of UTF-8 JSON**, checks version 1 and basic game structure, and rejects invalid data before writing. The shared game still applies its full schema and existing 4,000,000-character limit, including career validation.

Writes run through one ordered queue. Before replacing a valid primary save, its previous contents are atomically written to the backup. Each write uses a fixed temporary file in the same directory, flushes its contents and renames it over the destination. A corrupt primary is never copied over a valid backup. Reading a fallback backup also protects that backup until the next successful primary write, including when the renderer rejected a primary that passed the native basic shape check. Temporary files are not treated as saves. This provides recovery from common interrupted writes; it cannot guarantee persistence after forced termination, storage-device failure or sudden power loss on every filesystem.

`loadSave()` reads a valid primary first, then a valid backup with `recovered: true`. A fresh install returns `{raw: null, recovered: false}`. If files exist but both are damaged or unreadable, it also returns a user-facing `error` so the renderer can distinguish damage from a new game. Reads do not silently overwrite files. `loadBackup()` supports a second attempt when the renderer's full schema rejects a primary that passed the main process's basic shape check. The renderer should report the failure and avoid immediately overwriting damaged progress with a new game.

On a normal native window close, the main process prevents immediate exit and invokes subscribed `onBeforeClose` callbacks. The renderer should await saving its latest state, then call `confirmClose()`. The main process waits for the native save queue to drain. A failed final write or an eight-second missing acknowledgement opens a native **Keep playing / Close without saving** prompt; recent progress is discarded only after that explicit choice. `onBeforeClose` returns an unsubscribe function for the React effect cleanup. Forced process termination or OS shutdown may bypass this handshake, so normal autosaving remains necessary.

`exportBackup(raw)` validates the same bounded game JSON and opens a native save dialog with a JSON filter and overwrite confirmation. Only the main process receives the user-chosen path. It atomically writes the selected backup and returns `{ok: true}`, `{ok: false, canceled: true}`, or a user-facing error. Automatic browser Blob downloads are blocked in the shell, so desktop save tools must call this method. Browser file selection can still supply an explicitly chosen import to the renderer's existing full-schema validation. Native dialogs initially select Korean, English or Japanese from Steam's game language, then OS preferences. Once the game resolves a saved or manually selected language, `setLanguage` updates the native export and close dialogs to match. Startup dialogs shown before renderer initialization still use the platform language.

## Steam configuration and achievements

Steam initialization occurs only in the main process and only with a valid user-supplied integer AppID. Missing configuration, a missing optional module, failed initialization or a mismatched actual Steam AppID leaves the game usable offline with `steamAvailable: false`. The example SDK AppID 480 is explicitly rejected. No guessed app or depot identifiers are supplied.

Copy `desktop/steam/steam-config.example.json` to ignored `desktop/steam-config.json` and replace `null` with the real AppID supplied by the owner, or set the process environment variable `CODESHIFT_STEAM_APP_ID`. The environment variable takes precedence. For the Steam candidate build:

```powershell
# First populate desktop/steam-config.json with the owner's real AppID.
npm --prefix desktop run package:steam
```

The Steam packaging command requires the installed Windows x64 native Steam module and `steam_api64.dll`. The installed 0.4.0 module was inspected and contains both in `dist/win64`; the command copies the DLL next to the executable and writes the configured AppID there. A developer-provided licensed SDK DLL at ignored `desktop/vendor/steam_api64.dll` takes precedence. Confirm Steam SDK redistribution terms and third-party license notices before distribution. The wrapper is MIT licensed; that does not replace Steamworks SDK terms. Development `steam_appid.txt` is never included in the depot.

The adapter uses `init(appId)`, `utils.getAppId()`, `apps.currentGameLanguage()`, `achievement.isActivated()/activate()` and `stats.store()` from the inspected upstream SDK wrapper. `init` already runs its callback loop. Unlock calls accept only the allowlisted names in `desktop/achievements.json`, and SDK failure returns `{ok: false}`. The renderer should retry earned achievements on load or later successful actions; offline local progress remains the source of game completion. There is no game reset or arbitrary achievement mutation API.

| Steam API name | Game milestone |
| --- | --- |
| `CAFE_FIRST_DEPLOY` | First cafe mission completed |
| `CAFE_BILL_FIXED` | Cafe bill calculation mission completed |
| `CAFE_ORDERS_ONLINE` | Cafe server/order mission completed |
| `CAFE_OPEN` | Three cafe missions and the OPEN ending |
| `PRACTICE_ALL` | All six practice jobs completed |
| `CAREER_ACT_1` | Career act 1 completed |
| `CAREER_ACT_2` | Career act 2 completed |
| `CAREER_ACT_3` | Career act 3 completed |
| `CAREER_ENDING` | Career ending completed |

These are application achievement names, not numeric Steam identifiers. Register matching API names, localized display names and descriptions, icons and publishing state in the owner's Steamworks dashboard. This shell does not create that configuration. It also does not claim an authenticated online competitive score system or enforce a Steam entitlement gate; offline play is intentional. Steam Overlay is not enabled by the shell and needs separate review and runtime QA if added.

## Depot and Cloud setup

`desktop/steam/app_build.template.vdf` and `depot_build.template.vdf` provide SteamPipe templates with **YOUR_STEAM_APP_ID / YOUR_WINDOWS_DEPOT_ID** placeholders. Replace them with identifiers from the owner's Steamworks account and review content/build paths for the actual SteamCMD builder location. The app template defaults to `Preview "1"`; a preview is not a release or live branch change. No upload command is run by these scripts. Steam's Windows launch configuration should point to `CODE-SHIFT.exe`.

Steam Cloud is not automatically configured or advertised as active. `cloud-settings.example.json` is a manual Steamworks Auto-Cloud dashboard reference, not an importable VDF. Configure Windows `WinAppDataRoaming`, subdirectory `CODE-SHIFT/saves`, with two explicit file patterns `game.json` and `game.json.bak`, no recursion and no `.tmp` files. Suggested per-account quota is 32 MiB and two files, matching the native cap and backup. The main process does not call Steam Remote Storage APIs.

Test Cloud download before launch, upload after normal exit, offline conflicts, clean reinstall, backup recovery and two Steam accounts on the same Windows account before enabling it. The fixed local path is shared by users of that Windows account; account switching and Steam's conflict behavior therefore require actual testing. Store copy should say local saves until that integration is enabled and verified.

## Isolated desktop QA profiles

Do not rely on changing the `APPDATA` environment variable or Chromium's `--user-data-dir` flag. Electron's `app.getPath('appData')` resolves the Windows known folder, and this shell explicitly overrides userData/sessionData. A dev run can use a new absolute directory:

```powershell
$qaProfile = Join-Path ([IO.Path]::GetTempPath()) ('codeshift-qa-' + [guid]::NewGuid())
npm --prefix desktop start -- "--qa-user-data=$qaProfile"
```

The path must be outside the production profile and may not be its parent or child. Existing nonempty directories are rejected unless they contain the `.codeshift-qa-profile` marker from a previous QA run. No profile is deleted by the application. Saves, browser caches and language preferences all use the isolated directory. Steam is disabled when an isolated QA profile is active.

For a packaged-runtime test, build a separate QA package explicitly:

```powershell
node desktop/scripts/package.mjs --qa
& 'desktop/release/CODE-SHIFT-QA-win32-x64/CODE-SHIFT.exe' "--qa-user-data=$qaProfile"
```

This command sets an internal QA flag in the temporary packaging staging copy, requires an explicit profile at runtime, disables Steam, and adds `QA-NOT-FOR-DISTRIBUTION.txt`. The checked-in flag and default/Steam package always disable packaged QA overrides. Production packages reject `--qa-user-data`; the QA package must never be uploaded or distributed. The packaging hook resets the flag on every default build even if the source flag was accidentally edited.

## Verification status and remaining release checks

Current execution results and their limits are maintained in [QA-0.9-RC.md](QA-0.9-RC.md). Native unit tests cover save ordering, bounded JSON and shape validation, malformed saves, backup recovery and preservation, write failures, asset-origin/path restrictions, main-frame IPC authorization, missing/invalid Steam configuration, optional SDK failure, achievement allowlisting, native export, dialog language and QA-profile separation. These use temporary directories and fake Steam clients; separate UI harnesses launch the actual Electron runtime and a packaged QA executable.

Real Steam initialization, depot upload, executable signing and a clean separate Windows machine remain outside the current verified scope. With the real AppID, launch through Steam, test every achievement and SDK DLL loading, then verify Cloud if configured. Complete Steam dashboard/store assets, launch options, depot IDs and any desired executable signing. Keep measured performance, supported OS versions and QA results with the reviewed build. A portable offline build does not establish Steam store release approval.

Primary sources inspected: [Electron security guidance](https://github.com/electron/electron/blob/main/docs/tutorial/security.md), [Electron protocol API](https://www.electronjs.org/docs/latest/api/protocol), [Steamworks.js README](https://github.com/ceifa/steamworks.js), [Steamworks.js declarations](https://github.com/ceifa/steamworks.js/blob/main/client.d.ts), [SteamPipe](https://partner.steamgames.com/doc/sdk/uploading), and [Steam Cloud](https://partner.steamgames.com/doc/features/cloud). Upstream Steamworks.js renderer configuration examples do not apply here because the native wrapper stays in the main process and only the fixed preload API crosses into the sandboxed renderer.
