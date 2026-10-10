# Trailer music replacement — 2026-10-10

**Voxel Revolution (추천)** by Kevin MacLeod is downloaded and ready for the
new 30-second trailer. The main renderer selected its stronger section at source
**15.757700–47.233110s**,
with pitch-preserving `atempo=128/122`, for 30 output seconds at 128 BPM.
The source MP3 remains unmodified; the main renderer owns excerpting and mixing.

This is a different composition from the rejected Realizer. The official
catalogue describes synths and percussion, 122 BPM, **Grooving / Bright / Bouncy**,
and explicitly compares it to a happy video-game level-up montage. A short
waveform analysis supports an immediate attack and a stronger eight-bar entry.
These are documented selection grounds; no human headphone/speaker listening
or subjective musical approval was performed.

| Candidate | Official description and timing | Editorial tradeoff |
| --- | --- | --- |
| **Voxel Revolution (추천)** | 122 BPM; synths and percussion; Grooving/Bright/Bouncy; happy game level-up montage | Recommended source section starts on an estimated attack near 15.76s and avoids its lower-energy opening. Adjusting to 128 BPM speeds it by about 4.92% while preserving pitch. |
| Bit Shift | 130 BPM; synths; Bouncy/Bright/Grooving; happy 8-bit swing | Ready backup with steady opening energy. Its pure 8-bit identity may make the promo feel more like an arcade game. Source 0.02–29.558462s with `atempo=128/130` produces 30 seconds. |

The Voxel excerpt begins approximately eight source bars after the first estimated
attack: `0.02 + 8 × 4 × 60 / 122`. It consumes 31.475409836 source seconds to
produce 30 seconds at 128 BPM: 64 beats, 16 bars, 900 frames at 30 fps. Cumulative
frame boundaries and the alternate opening cut are in
`output/trailer-polish/audio/edit-plan.json`. This is an estimated beat phase,
not an independently confirmed musical downbeat. The song continues at the cut;
the main renderer must shape and inspect the ending rather than assuming a
natural final cadence.

## Source files and evidence

Both original files came directly from the composer's official host. Download
receipts include URLs, final URLs, content types, lengths and SHA-256 hashes.
FFprobe confirms MP3, 44.1 kHz, stereo; Voxel is 129.906950s at 160 kbps and
Bit Shift is 192.052250s at 256 kbps.

| File under `output/trailer-polish/audio/` | Bytes | SHA-256 |
| --- | ---: | --- |
| Voxel Revolution.mp3 | 2,600,392 | `9977d93c698abacc29e5da7ff0bccee2b8f6de47ed7e567cb0f1ed9b7564f74e` |
| Bit Shift.mp3 | 6,147,900 | `0d76175482b0d1742b43922624e3a3ecb8f5d43f1d6f7bb8b84abae186aeb589` |

Official source pages:

- [Voxel Revolution — ISRC USUAN2000025](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN2000025)
- [Voxel Revolution original MP3](https://incompetech.com/music/royalty-free/mp3-royaltyfree/Voxel%20Revolution.mp3)
- [Bit Shift — ISRC USUAN1600045](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1600045)
- [Bit Shift original MP3](https://incompetech.com/music/royalty-free/mp3-royaltyfree/Bit%20Shift.mp3)
- [Official catalogue](https://incompetech.com/music/royalty-free/pieces.json)

Saved evidence includes the current official catalogue, both source HTML pages,
official FAQ, CC deed and full legal code. The source HTML is a generic,
client-populated attribution template; it is **not** a screenshot of a rendered
track-specific licence. The official catalogue binds each title, ISRC, filename,
BPM and description to its source URL. The template explicitly supplies
“Licensed under Creative Commons: By Attribution 4.0 License.”

`acquisition.json`, `source-probe.json`, `waveform-analysis.json`,
`soundtrack-provenance.json`, `edit-plan.json` and `assets-sha256.json` preserve the
download, technical inspection, recommendation and asset hashes in that folder.
Generated output assets stay ignored; this review is the tracked decision record.

## Commercial use and attribution

The official [FAQ](https://incompetech.com/music/royalty-free/faq.html) permits
monetized videos with credit and describes credits for video games. The
[CC BY 4.0 deed](https://creativecommons.org/licenses/by/4.0/) explicitly permits
sharing and adaptation “for any purpose, even commercially,” under attribution,
a licence link and an indication of changes. It also prohibits implying the
creator's endorsement. Full terms are saved from the
[legal code](https://creativecommons.org/licenses/by/4.0/legalcode.en).

The prepared `ATTRIBUTION.txt` is the final credit block for the main-selected
Voxel release workflow. The original downloaded MP3 remains untouched, and
`ATTRIBUTION-original.txt` records its unmodified-source credit:

```text
"Voxel Revolution" Kevin MacLeod (incompetech.com)
Licensed under Creative Commons: By Attribution 4.0 License
https://creativecommons.org/licenses/by/4.0/
Source: https://incompetech.com/music/royalty-free/index.html?isrc=USUAN2000025
Changes: excerpt selected from 15.7577 to 47.2331098 seconds, trimmed, tempo adjusted from 122 to 128 BPM with pitch preserved, and mixed with editorial sound effects for the CODE:SHIFT trailer.
```

The main renderer executes and verifies the stated transformations. Change the
notice if its actual timings or processing differ. Embed the attribution in
metadata, keep it
beside shared MP4s, and include it in upload descriptions/public credits.
Only Voxel Revolution is selected for public release delivery; Bit Shift and
its separate credit remain local research backup.

## What was checked

The only audio processing in this acquisition task was a single-thread decode
of the first 45 source seconds to mono 16 kHz PCM **in memory** for analysis.
No excerpt, audio export, video render, fade, final mix or tempo adjustment ran.
Twenty-millisecond RMS windows place the first signal above -35 dBFS at 0.02s
in both tracks. Voxel's first-second RMS is -13.62 dBFS, with the first 15 seconds
mostly -16 to -12 dBFS and increased energy around 15 seconds, roughly -12 to
-10 dBFS. A strong attack near 15.76s supports the recommended later entry.
Bit Shift's opening is mostly -14 to -11 dBFS. These levels describe broadband
energy; they do not establish perceived brightness, musical taste or a final
mix's loudness/true peak. Final technical QA and listening remain with the final
trailer workflow.

No paid API, account, install, browser, native app, game build, user contact,
source-code edit or commit was used for this acquisition.
