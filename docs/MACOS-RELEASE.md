# macOS release readiness

## Resume after Apple enrollment (2026-10-22 KST)

Windows remains the public release target. Apple membership/payment and public Mac support are deferred by the owner. Prepared candidates must not be described as notarized or fully playtested.

### One-time credentials

After membership activation, create a **Developer ID Application** certificate with its private key and export an encrypted P12 (not an App Store certificate). Also create a **team App Store Connect API key** permitted for notarization. Individual API keys are not supported by this workflow. If no Mac is available, arrange a controlled Mac session for certificate/key setup. Never send private keys in chat or commit them.

Configure these GitHub secrets in environment `macos-release` (a required reviewer is recommended):

| Secret | Value |
| --- | --- |
| `MACOS_CERTIFICATE_P12_BASE64` | Base64 of encrypted certificate + private key P12 |
| `MACOS_CERTIFICATE_PASSWORD` | P12 password |
| `MACOS_SIGNING_IDENTITY` | Full `Developer ID Application: Name (TEAMID)` identity |
| `APPLE_API_KEY_P8_BASE64` | Base64 API private key |
| `APPLE_API_KEY_ID` | API key ID |
| `APPLE_API_ISSUER_ID` | Team API issuer UUID |

No credentials are currently configured. The script uses an ephemeral keychain and removes keys in `finally`. Hosted runners are ephemeral on cancellation. No Steam credentials are needed.

### Build once, then upload

1. Use the reviewed source ref in **macOS candidate** (`.github/workflows/macos-candidate.yml`). Push/default builds internal candidates only; Apple is not contacted.
2. After enrollment, manually dispatch with **`sign_and_notarize=true`**. Native Intel and ARM quality gates/startup probes run, then the app is merged, Developer ID signed, notarized, stapled and assessed by Gatekeeper.
3. GitHub exposes manual dispatch only once the workflow exists on the default branch. The current branch must be reviewed/merged by a human before relying on that UI; no automatic merge is authorized.
4. Download artifact **`Localhost-Hero-macOS-5441362-notarized`**. Its `Localhost-Hero-macOS-5441362.zip` contains the `.app` and license notices at root. It includes a SHA-256 and notarization/source report. Do not extract/repack on Windows, which can lose symlinks and executable modes.
5. Upload that ZIP to **Mac depot 5441362** at https://partner.steamgames.com/apps/depotuploads/5441360. The workflow deliberately does not upload or set any live branch.

Missing secrets, ad-hoc/App Store identity, incorrect app ID, or a failed notarization prevent release output. Hardened runtime, secure timestamps, JIT and Steam overlay entitlements are configured; App Sandbox/debug entitlement are excluded. This is prepared automation, not proof of actual Developer ID signing/notarization before credentials exist.

For a controlled Mac session, with the universal candidate extracted under `desktop/release/Localhost Hero-darwin-universal` and the same environment variables:

```sh
node desktop/scripts/release-macos.mjs --check-config
node desktop/scripts/release-macos.mjs
```

`--check-config` checks presence/formats only, without contacting Apple. Output is `desktop/release/macos-notarized/`; existing output is never overwritten. Certificate files are ignored by Git.

### Steam configuration and final acceptance

- App **5441360**, Windows depot **5441361**, Mac-only depot **5441362**.
- Mac depot is attached to Developer Comp **1877905**, Beta Testing **1877906**, Store package **1877907**. Metadata was published on 2026-10-22 KST; Windows default **25925147** was preserved.
- Add macOS-only launch executable **`Localhost Hero.app`** after notarized candidate creation. This launch option and public Mac support are intentionally deferred.
- Upload/test on an internal branch; confirm both existing Windows and new Mac manifests are present. Do not overwrite Windows content with the Mac ZIP.
- Real Intel/Apple Silicon Steam install/update, input, save/load, fullscreen, audio, image import and HTML/ZIP export still need verification. Verify native Steam initialization, overlay and achievements as applicable. Hosted native startup checks do not prove full gameplay or Steam client integration.
- Only then enable Mac/64-bit Intel/Apple Silicon/notarized flags and measured store requirements, promote the validated build, and submit Steam review if required.

The user currently has no Mac. Membership activation alone does not remove these acceptance checks. Do not bypass Gatekeeper to claim compatibility.

### Current evidence

- **39630565615 / 51369e3**: Intel and ARM jobs passed quality gates and native QA app startup (renderer, platform bridge, save-load bridge). Universal merge then failed on non-reproducible build timestamps; fixed by deriving `SOURCE_DATE_EPOCH` from the source commit.
- **2026-10-22 KST local `pnpm verify`: PASS**, 473 game + 50 desktop tests, 379 linted files with zero errors/warnings. Release configuration rejects missing secrets/ad-hoc signing identities.
- Latest universal archive evidence will be recorded below after verification.

References: [Steam platforms](https://partner.steamgames.com/doc/store/application/platforms), [Apple Developer ID](https://developer.apple.com/developer-id/), [Apple notarization](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution), [Electron signing](https://www.electronjs.org/docs/latest/tutorial/code-signing).

## Historical candidate instructions and evidence (2026-10-21)


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
