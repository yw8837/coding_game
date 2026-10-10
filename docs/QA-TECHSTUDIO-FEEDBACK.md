# AI Tech Studio feedback integration — 2026-10-10

Version: 0.13.2-rc.0. This update improves interaction feedback; it does not declare the full game or Steam release complete.

## Reference and connection

- Source: https://github.com/uibsee/ai-techstudio at `6f13e8b8e0c33beeb8bababd09aff35a81885a86`.
- MCP endpoint: https://ai-techstudio.web.app/mcp, registered globally as `ai-techstudio` with Streamable HTTP. Initialization, tool listing, `search_techniques` and `get_technique` succeeded. The current chat did not hot-load a native tool namespace; the public MCP JSON-RPC endpoint was used directly for verification and research.
- Applied references: [i499 procedural sound](https://ai-techstudio.web.app/ai/t/i499.md), [i147 round-robin UI variation](https://ai-techstudio.web.app/ai/t/i147.md), [i165 audio buses](https://ai-techstudio.web.app/ai/t/i165.md), [i202 numeric feedback](https://ai-techstudio.web.app/ai/t/i202.md).
- The implementation adapts these techniques to the game's existing Web Audio player and real economy state. No third-party artwork or downloaded sound assets were imported. MIT attribution is in `public/licenses/ai-techstudio.txt`; desktop builds copy it and append it to the shipped notices. Pixelghost artwork is excluded from the upstream MIT grant and is not used.
- The game has no runtime dependency on this MCP server and sends it no player data. Only generic public research queries were sent during development.

## Shipped behavior

- Short cues distinguish opening/closing windows, terminal commands, checkpoints, purchases, checks, rewards and releases. UI sounds have three restrained variants; meaningful success/reward pitches stay consistent. Editor autosave does not sound on every keystroke.
- Separate master, interface and success/reward volume controls, previews, mute and persistent settings in Korean, English and Japanese. Zero volume is silence. The existing mute preference is retained.
- Voice count and repeat-rate limits avoid input bursts. Important events release interface sounds. Hidden tabs suspend audio; returning and using the same cue resumes correctly. Muting and disposal clear active voices.
- Wallet changes use actual balance differences, display the exact new balance immediately, and never grant rewards. Initial loading does not replay a payout.
- Manual and OS reduced-motion preferences cover the game and portal dialogs. Language selection now has its own full-width row to avoid clipped option text.

## Verification

- Game unit suite: **247 passed**. Native shell suite: **31 passed**.
- Full TypeScript check, focused ESLint, web production build and offline renderer build passed.
- Real Chrome: KO/EN/JA settings, channel mute, actual oscillator starts, hidden-tab suspend/resume, persistence, real 90-credit purchase, no delta replay, and 390px layout passed. Production OfflineAudioContext rendered all 11 cues; highest absolute sample was 0.094992 at full mixer volume, with no clipping in this sampler. This is signal verification, not human listening or a claim about every playback device.
- Existing payoff E2E passed in three languages: actual repair previews, no success feedback for failed/unsaved changes, no repeated payout, real delivery reward and reduced-motion behavior.
- Existing final smoke passed: localized terminal help, an empty desktop on start, promotional video playback and metadata.
- Electron source-runtime E2E passed: three cafe chapters, 18 career jobs, final release and ending, code lab, terminal files, calendar, native save/export/import and corrupt-primary recovery. New audio settings persist after a complete process restart. No page errors.
- Browser security probes passed: malformed/oversized saves rejected without replacing progress, imported markup remained inert, preview scripts/outbound URLs removed, infinite-loop execution bounded, global/constructor access rejected, and normal code still earned its real reward afterward. No unexpected outbound requests or page errors were observed.
- A separately packaged QA executable passed native-save/reopen and Japanese-language checks with Node unavailable to the renderer. Production and QA packages are distinct; only the production offline package is delivered.

Evidence is retained in `output/techstudio-qa` and copied to the separate delivery directory. Security probe results and the publication receipt accompany that delivery.

## Limits

Steam integration is disabled in the delivered offline candidate (`appId: null`). Store approval, the correct game's AppID/depot setup, actual Steam achievements/Cloud and clean-machine/player acceptance remain separate release work. No claim is made that automated tests establish fun or learning outcomes. The new cues still benefit from listening on the target speakers/headphones. Existing BGM and promotional videos are unchanged by this update.
