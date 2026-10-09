# My First Release — 30-second trailer

The story is concrete: repair a cafe till, verify customer orders, earn credits,
open the cafe, personalize the desktop, take neighborhood jobs, and release a
working local-life web app. `동네ON` is the name typed into that recorded player
project, not a compulsory game title. CODE:SHIFT remains the working game title.

## Source and editorial boundary

- Actual browser UI footage, driven by automated mouse and keyboard inputs.
- Fresh cafe progression; later chapters use a visibly imported, previously
  UI-earned save. This is a montage with chapter jumps, not one continuous run.
- Gameplay is Korean. EN/JA exports localize the editorial typography, and state
  that the underlying gameplay is Korean.
- Browser recording is silent. Added clicks, impacts and success cues are
  editorial effects. They are not represented as recorded in-game audio.
- A displayed +750 cr belongs to the order-inbox mission. Serving a customer by
  itself does not award that payment. A second monitor purchase unlocks an actual
  comparison tool/badge, not an animated physical monitor.
- The opening explicitly labels expected13,500 and actual4,503 so viewers do not
  have to infer the bug from an unexplained number.
- The repaired 13,500 close-up rechecks the same three-coffee input before
  serving a new customer. It is a calculation probe, not a completed delivery.
- The final release is the player's in-game web app version1.0.0. It is not a
  claim that this game has launched on Steam or that the app reached the Internet.

## Reproduce

Use Python with Pillow for the renderer, and the installed Playwright environment
plus Chrome for captures. FFmpeg/FFprobe are resolved through `render.py`.
Run one browser or heavy renderer/build at a time.

```
python media/trailer/audio-rebuild/acquire.py
python media/trailer/audio-rebuild/prepare.py
python media/trailer/rebuild-edit.py --lang all
python media/trailer/rebuild-edit.py --lang ko --vertical
```

Keep the accepted raw files and matching evidence together under
`output/trailer-rebuild/`: `raw.webm`, `code-insert/`, `insert/`, `wallpaper/`.
Their capture scripts are `rebuild-capture.py`, `rebuild-code-insert.py`,
`rebuild-insert.py`, and `rebuild-wallpaper.py`. The main capture was refreshed
after the direct-control cafe tutorial changes. Its editor/app inserts show the
real operator fix and final app; the wallpaper insert shows the free blue desktop
and an actual 180-credit officetel purchase. The capture's Git value identifies
the base checkout; recordings include the working-tree changes of this release,
not a claim that the previous commit contains these new screens.
The audio scripts require Internet only to download
the official licensed music, never a paid API. Generated outputs are ignored by
Git; the delivered MP4s are copied to `public/media/`.

The editable EDL contains source ranges, crops, languages and frame boundaries.
Cumulative cuts follow128BPM with half-bar cuts where useful. Type enters with a
short slide/scale; long translations have bounded entrance geometry. Cache keys
include source SHA-256. Local Malgun Gothic, Arial and Yu Gothic supply glyphs.

## Music and checks

“Realizer” by Kevin MacLeod (incompetech.com), CC BY4.0. Official description:
Grooving/Bright/Driving, Disco, synths/drums.125BPM source is adjusted to128BPM
with pitch-preserving atempo, trimmed and mixed. Keep the full attribution in
`final/ATTRIBUTION.txt` with shared files and in every upload description. It is
also included in MP4 comment metadata and on the public About page.

Each export is30s/900frames/30fps, H.264 yuv420p + stereo AAC48kHz. The verification
decodes the full file and checks encoded loudness and true peak, resolution,
frame count and codecs. Contact sheets and full-size proof frames cover the
operator edit, receipt, order, reward, release and translated typography. These
checks do not constitute human listening or a beginner playtest.
