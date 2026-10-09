# Steam package preflight and SteamPipe files

`node desktop/scripts/steam-preflight.mjs` checks an **existing Windows x64 Steam package** without starting the game, loading a native binding, invoking SteamCMD, uploading, or publishing. A successful result means local artifacts passed these checks; it does not verify Steamworks account ownership, app/depot association, store review, Steam runtime behavior, achievements, or Cloud.

Obtain the game's real AppID and Windows depot ID from its Steamworks dashboard first. AppID 480 and missing IDs fail. An account with no game app or available app registration credit cannot supply these identifiers yet; this tool cannot create an app or purchase a credit.

Build the renderer, set the real AppID in `desktop/steam-config.json` (or `CODESHIFT_STEAM_APP_ID`), and run the existing `npm --prefix desktop run package:steam` command. The SDK binding and licensed DLL must be installed. The ordinary `package:windows` output has `appId:null` and is rejected even if a process environment variable supplies a valid ID. QA packages are also rejected. Do not edit an offline package's config to convert it; rebuild with `--steam`.

Create a separate local preflight JSON file with these fields. Replace `null` IDs with **numeric IDs from your dashboard**, and choose actual absolute paths. This example intentionally fails until completed. A location under the ignored `desktop/release/` directory keeps owner-specific configuration out of Git.

```json
{
  "appId": null,
  "depotId": null,
  "packagePath": "C:/SteamDepot/CODE-SHIFT-win32-x64",
  "buildOutput": "C:/SteamBuildLogs/CODE-SHIFT",
  "description": "CODE:SHIFT reviewed Windows build"
}
```

Read-only verification:

```powershell
node desktop/scripts/steam-preflight.mjs --config 'C:/SteamBuilds/codeshift-preflight.json'
```

Generate the app/depot VDF and a hash-bearing preflight report in a new output directory:

```powershell
node desktop/scripts/steam-preflight.mjs --config 'C:/SteamBuilds/codeshift-preflight.json' --out 'C:/SteamBuilds/CODE-SHIFT-reviewed-build'
```

Generated names are `app_<AppID>.vdf`, `depot_<DepotID>.vdf`, and `preflight.json`. Paths in the VDF are absolute, use forward slashes, and support spaces. The app references the sibling depot file. `Preview "1"` is always enabled and `SetLive` is absent: even a later manual SteamCMD use is a build preview, not an upload or live branch change. Existing generated files are never overwritten. Select a new directory for a later reviewed build. No login, password, authentication token, or other credential field is accepted or written.

Checks include packaged AppID equality, production QA flag, expected desktop entry/renderer, matching renderer/external notices, Electron notices, pinned Steam wrapper and its license, real nonempty unpacked native binding and SDK DLL with x64 PE headers and ASAR integrity, and required executable. Symlinks, development app IDs, QA markers and known credential files are rejected both in the filesystem and ASAR. Log/output directories must not overlap depot content. Quotes, braces, control characters, wildcards, device/ADS paths, relative paths and UNC paths are rejected before VDF generation.

The committed `.template.vdf` files remain editable references, not generated artifacts. `cloud-settings.example.json` is a manual Auto-Cloud dashboard reference; generation does not enable Cloud. After receiving IDs, verify app/depot ownership and Windows launch settings in Steamworks, perform Steam runtime/achievement testing with the actual app, complete store/review materials, and only then decide how to upload and publish. Do not submit a QA directory.

Unit tests create tiny synthetic ASAR and PE fixtures and never exercise Steam or package the game:

```powershell
node --test desktop/tests/steam-preflight.test.cjs
```
