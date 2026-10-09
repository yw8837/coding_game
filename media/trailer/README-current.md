# Current gameplay trailer

This 30-second edit starts with an actual bakery pricing bug: six buns should
cost 10,000 won, but the game shows 12,600. The player edits real code and tests
both six buns (10,000) and eight buns (13,600), completes the job for +200 cr and
+80 XP, buys the 600 cr second monitor, and uses its real comparison tool.
The map, fourth-job district unlock, authored toolbox and working filters lead
to the player's in-game version 1.0.0 release. CODE:SHIFT is the working title.

The source is actual Korean browser gameplay with automated inputs. A previously
UI-earned three-job cafe save is visibly imported. Later career jobs and the
final project are completed through the UI on the recording. “내가 만든 도구함”
introduces the player-authored portfolio describing the repaired bakery,
workshop and library-lending tools. Its working filters select descriptions;
the preview does not execute those calculators or tools. The trailer omits
intervening actions and retimes selected shots; it is a montage with chapter
jumps. The release shown is the player's app inside the game. The final CTA
links the playable browser game at `codeshift-lab.bsfire1237.chatgpt.site`.

`skills-edit.py` reuses bounded media commands, final encoding and media
verification from `rebuild-edit.py` through importlib. The current serial shot
composition honors explicit, reviewed footage rectangles instead of inheriting
narrow panoramic-video slots. Current EDL, captions, audio cues and source
validation are separate. Historical scripts and outputs
remain available for reproducing their own trailers.

## Source and editable decisions

Keep `output/trailer-current/raw.webm` and `capture-evidence.json` together. The
evidence needs a `gameCommit`, `viewport: [1600, 900]`, calibrated `shots` with
`id`, `start`, `end`, and optional `focus: {x, y, width, height}`, plus capture
events and timing provenance. Required shot IDs are `broken`, `desktop`, `code`,
`fixed`, `delivery`, `monitor`, `monitor-use`, `map`, `district`, `project`,
`project-filter`, and `release`. The capture can additionally include `request`
and `title`; the final title/CTA is explicitly editorial typography.

The renderer writes `output/trailer-current/edit/edl-current.json`. It binds the
raw file and capture evidence by SHA-256, carries the recorded game commit,
version, working-tree diff hash, game-source hashes, events, save-import and
calibration information, and records every source range,
focus rectangle, crop, speed, localized caption and output frame interval.
Output intervals must be contiguous and total 900 frames. Source ranges must
stay inside the actual recording and may play at no more than 8x speed. Focus
crops normally use the intersection of recorded focus and viewport, with 24
pixels of clamped recorded safety margin. The accepted raw screenshots also
support reviewed, tighter selections for results and editor text. Both the
original focus and each selected crop/reason remain in the EDL. Offscreen UI is
never reconstructed. Overview shots retain context; portrait frames contain
selected evidence without stretching it. Static containment preserves every
selected pixel; recorded inputs and editorial type supply the motion.

The reviewed layout gives wide evidence a 1840×775 area below the landscape
headline. The actual six-bun receipt replaces the entire pricing panel in the
opening close-up. The editor crop excludes unused textarea width, while the
fixed and delivery scenes include their real toast and six/eight result cards.
The app's own narrow viewport receives a larger right-hand showcase, with the
type alongside it. The release uses the full real release scene—toast, banner,
source code and project preview—instead of an 87-pixel-high banner strip.
Each aspect's footage rectangle is also written in the EDL. The revised
`current-readable-v2` cache signature forces old small-footage compositions to
be rebuilt when the renderer next runs.

| Output seconds (ideal beat grid) | Actual screen / editorial copy |
| --- | --- |
| 0–2.8125 | Broken six-bun price; expected 10,000 / actual 12,600 |
| 2.8125–3.75 | Desktop; local code fixer |
| 3.75–6.5625 | Real code input and execution |
| 6.5625–9.375 | Six and eight buns both rechecked correctly |
| 9.375–11.25 | Actual job completion, +200 cr and +80 XP |
| 11.25–12.1875 | Actual second-monitor purchase, 600 cr |
| 12.1875–14.0625 | Actual JavaScript editor and results side by side |
| 14.0625–15.9375 | Choose four of six jobs per district; final project requires 12 |
| 15.9375–17.8125 | Fourth completed job unlocks the next district |
| 17.8125–20.625 | User-authored portfolio describing repaired neighborhood tools |
| 20.625–22.5 | Actual app filters change the shown projects |
| 22.5–26.25 | Player's in-game version 1.0.0 release |
| 26.25–30 | Editorial CODE:SHIFT working title and browser-play CTA |

Cuts use cumulative rounding at 30 fps on a 128 BPM grid, so the precise frame
boundaries in the EDL differ from ideal time by at most half a frame. Large type
enters with short slide/scale motion, with measured KO/EN/JA glyph widths keeping
the entire entrance within the frame. Korean gameplay stays visible in all
languages; English and Japanese localize the editorial copy.

## Reproduce serially

Use the existing Python/Pillow and installed FFmpeg/FFprobe environment. Do not
start a browser capture, game build or another heavy render at the same time.
The renderer does not install packages, download assets, call a paid API, or
recapture the browser.

```powershell
python media/trailer/skills-edit.py --edl-only
python media/trailer/skills-edit.py --lang all
python media/trailer/skills-edit.py --lang ko --vertical
```

The three landscape exports are 1920×1080; the Korean portrait export is
1080×1920. Outputs live under `output/trailer-current/final/`. `--verify-only`
rechecks requested existing exports only when their saved QA hashes match the
current raw source, capture evidence, EDL and encoded file. Render cache keys include the current
shot/typography-independent layout and raw-source SHA-256; final captions are
reburned on every render. Generated timestamps and EDL are kept in ignored
output rather than added to tracked editorial history.

## Music, attribution and checks

The accepted soundtrack is “Realizer” by Kevin MacLeod (incompetech.com),
CC BY 4.0. Its official description is Grooving/Bright/Driving, with synths and
drums. The existing excerpt was adjusted from 125 to 128 BPM with pitch preserved.
Pinned SHA-256 values protect the accepted music, deterministic editorial foley
and attribution. Missing current audio files are copied from the accepted
`output/trailer-rebuild/audio/` assets; changed files fail rather than being
silently replaced. No audio acquisition or generation runs during rendering.

The browser capture is silent. Added clicks, impacts and success chords are
editorial effects. Their cues follow cuts and actual results. Keep the complete
`final/ATTRIBUTION.txt` beside shared MP4s and include its text in every upload
description; the renderer also embeds it in each MP4's comment metadata.

Every export is fully decoded and checked for 30 seconds, 900 frames, 30 fps,
H.264 yuv420p, stereo AAC at 48 kHz, encoded integrated loudness between -18 and
-14 LUFS, and true peak at or below -1 dBTP. QA JSON also records source/evidence/
EDL hashes and commit. Contact sheets and full-size review frames are saved
under `edit/review/`. These technical checks do not establish human listening,
subjective musical taste, or beginner playtesting.
