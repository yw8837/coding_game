# macOS release candidates

The Steam default build is still Windows-only. Do not advertise macOS support until a Mac depot is installed and playtested through Steam.

## Native builds

Run on each target Mac (Intel x64 and Apple Silicon arm64), using the Node and pnpm versions in the candidate workflow:

```sh
pnpm install --frozen-lockfile
npm ci --prefix desktop
pnpm verify
pnpm desktop:build
CODESHIFT_STEAM_APP_ID=5441360 node desktop/scripts/package.mjs --steam
```

`desktop/release/Localhost Hero-darwin-<arch>/Localhost Hero.app` contains the matching Electron runtime, unpacked Steam native library, and AppID configuration. The internal executable and save profile stay `CODE-SHIFT`. Windows retains its previous directory layout. The macOS menu supplies native copy/paste/undo shortcuts. Closing the last window quits after the same save handshake as Windows.

`.github/workflows/macos-candidate.yml` builds on standard macOS Intel and ARM runners. It checks unit tests, renderer compilation, Mach-O architectures, the native Steam binding, and ad-hoc signatures. ZIPs preserve the app bundle's symlinks and permissions. These checks do not prove gameplay, Gatekeeper acceptance, or Steam installation.

## Before distribution

- Complete real Mac gameplay: new/continue/reset, KO/EN/JA, Cmd+C/V/Z and terminal Ctrl+C, file/image import, HTML/ZIP export, window/fullscreen scaling, save-on-quit and relaunch.
- Sign the final bundle with the developer's Apple Developer ID, notarize it, and staple the ticket. No developer certificate or Apple account credentials have been supplied or assumed. Internal builds are only ad-hoc signed and labelled as candidates. Do not disable Gatekeeper or remove quarantine to claim validation.
- Configure macOS depot(s), set the Mac launch option to `Localhost Hero.app`, attach depots to store and developer packages, upload and test Steam installation/update and runtime Steam initialization. Preserve the Windows depot.
- Only after verification, enable macOS in both Steamworks and store admin and enter measured minimum requirements. Submit the updated build for review as needed.

Steam overlays and achievements require verification in the Steam client; loading the native binding on CI alone is not that verification.

## Verification on 2026-10-21

- Candidate source: `769f91b89b02784c6a1f05dca6df803ccaf86421` (workflow run [39578814272](https://github.com/yw8837/coding_game/actions/runs/39578814272)). Both Intel x64 and Apple Silicon arm64 jobs succeeded, including quality gates, renderer compilation, architecture checks, Steam native binding load, and ad-hoc signature integrity.
- Candidate ZIPs were downloaded to `D:/코딩게임/출시자료/macOS-20261021/`. They remain internal candidates, not Steam uploads. Terminal deletion fixes are included; the later top-bar CSS adjustment is not.
- ZIP SHA-256: arm64 `1221c18ab7272dadfc39e13cf28bb2e14ba273f2ff6915fa7556bdbdcc925e4c`; x64 `d2e387f625403468ae614f2ac884c21fca9033a2e7e7d5087e2abc06cd00f1ae`.
- The user has no Mac available for real-device testing. Gameplay, Gatekeeper/notarization and Steam installation remain unverified; public Mac support stays disabled.
- Steam still serves Windows default build `25925147`. Its review is pending. Store screenshots were classified and the approved store page was published as Coming Soon; the landing page reports an earliest release of November 4.
- The remaining automatic checklist item, "Played Through Steam for 5 Minutes", requires launching the owned game from the Steam library, with a qualifying recent play session (within seven days or since the current default build upload). Web demo play does not satisfy it. Steam says updates can take a few minutes after exit. No manual completion was claimed.
