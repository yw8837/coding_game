# Actual gameplay trailer

`CODE:SHIFT` is a working title. This renderer edits footage of the actual browser game. It uses Python standard library, the installed FFmpeg/FFprobe, and local Windows fonts. It downloads no media, fonts, voices, models, packages or music.

## Run

From the project root, after the capture and EDL exist:

```powershell
python media/trailer/render.py --edl media/trailer/edl.json --languages ko
python media/trailer/render.py --edl media/trailer/edl.json --languages ko en ja --vertical-languages ko
```

The first command creates Korean landscape and vertical files plus editable caption files for all three languages. The second renders **three landscape files and one Korean vertical file**, sharing a single segment assembly. Omit `--vertical-languages` to render a vertical variant for each selected landscape language. Use `--no-vertical` for landscape only. Do not run both examples unless a second export is wanted: selected output files are replaced on every render.

Defaults resolve paths independently of the current working directory. A relative EDL `source` resolves from the EDL directory first, then the project root. An absolute path is the most explicit option. `--output`, `--ffmpeg` and `--ffprobe` can override paths. The installed fallback binaries are:

```text
C:/Users/최용우/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0-full_build/bin/ffmpeg.exe
C:/Users/최용우/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0-full_build/bin/ffprobe.exe
```

## Capture and rerun timing

Start the local game server at `http://127.0.0.1:5173/`, then run `python media/trailer/capture.py` from the project root. Capture requires Python Playwright, installed Chrome, and the same local FFmpeg/FFprobe used by the renderer. It follows the visible game controls in a fresh browser context and writes a new raw recording and EDL only after calibration passes. Rerunning intentionally replaces `output/trailer/raw.webm` and `media/trailer/edl.json`; preserve an accepted pair before another capture.

Playwright's recorder starts independently of the host's monotonic clock. The first recording was 51.520 seconds while its last wall-clock cut ended at 52.438; those values alone cannot establish the startup offset because recorder shutdown can add a tail. The existing accepted EDL received a manual 0.958-second shift, including a 0.040-second tail margin. **That shift belongs to that recording and must not be reused for another capture.**

Future captures film two 0.7-second full-screen magenta calibration flashes, before and after all gameplay shots. The script brackets each flash's DOM update/paint acknowledgement with host timestamps, then reads every source frame timestamp with FFprobe and decodes 8×8 RGB thumbnails with FFmpeg. It requires exactly two full-magenta intervals, matching decoded frame counts and increasing timestamps. The overlapping offset bounds from both markers supply one constant correction for all shot timestamps; durations are never stretched to conceal a clock mismatch. A 0.25-second guard separates the markers from gameplay.

Calibration rejects missing/extra/short markers, slow paint acknowledgements, incompatible beginning/end offsets, excessive uncertainty, overlapping cuts, marker overlap, or source bounds violations. Cuts must finish at least one source frame before the recording endpoint. The `captureTiming` EDL metadata retains original wall-clock shots, both measured markers, source duration/frame rate, applied offset and estimated uncertainty. Failed calibration leaves the accepted raw/EDL pair untouched; the new unaccepted recording remains in `output/trailer/recording` for inspection.

Accuracy is limited by browser compositing, host acknowledgement latency, source frame quantization and recorder delivery. The bounds **assume** marker capture lags painting by no more than two source frames; the script does not independently prove that assumption. Uncertainty is capped at ±0.15 seconds and is normally tighter at the expected 25fps source rate. The two anchors expose larger clock disagreement but cannot rule out transient mid-recording stalls. Watch every cut boundary after rerunning, and keep extra dwell around essential actions. These flashes are production calibration overlays, outside selected footage; they do not modify game progress. The renderer's 8× default speed limit remains unchanged.

## Editable EDL

The capture owner writes `media/trailer/edl.json` with the source and real event timestamps. This example illustrates the contract, rather than referring to existing footage:

```json
{
  "source": "../../output/trailer/raw.webm",
  "shots": [
    {
      "id": "menu-width",
      "start": 12.0,
      "end": 18.0,
      "duration": 4.0,
      "caption": {
        "ko": "너비를 고치면, 메뉴판이 화면 안으로",
        "en": "Change the width. The menu fits.",
        "ja": "幅を直すと、メニューが画面に収まる"
      }
    }
  ]
}
```

A complete EDL must total 30–45 seconds, with each `duration` on the 30fps frame grid. Shot ids must be unique letters/numbers/hyphens/underscores. `start/end` are seconds in the raw source; `duration` is the edited output duration. The video timing uses `setpts=(duration/(end-start))*(PTS-STARTPTS)` and a precise frame limit. Default supported playback speed is 0.25–8x. If deliberate editorial compression needs a higher limit, pass `--max-speed 12`; the EDL and verification record retain each actual speed. Lengthy setup waits should usually be cut rather than accelerated beyond readable motion.

Optional `crop` is `{ "x": 0, "y": 0, "width": 1600, "height": 900 }` in source pixels. The script rejects crops outside the raw frame. Full-frame footage is the default and recommended option. Do not crop code, taskbar, menus or the current quest out of a shot accidentally. Only actual gameplay should supply mission results; the renderer never changes game state.

## Output and presentation

The default destination is `output/trailer`:

- `codeshift-ko.mp4`, and optionally `codeshift-en.mp4` / `codeshift-ja.mp4`: 1920×1080, 30fps H.264 + stereo 48kHz AAC, faststart. Complete gameplay is fitted below a modest 120px caption strip.
- Corresponding `codeshift-*-vertical.mp4`: 1080×1920 with the full gameplay view centered on a dark navy canvas. Title, larger captions and editing note occupy the space outside the UI.
- `captions.ko.srt`, `captions.en.srt`, `captions.ja.srt`: editable UTF-8 subtitles, plus `.ass` overlays for each layout.
- `gameplay-master.mp4`, `work/*.mp4`, `work/concat.txt`: the uncaptained edited sequence and intermediate cuts.
- `original-pulse.wav`, `normalized-pulse.wav`: the original synthesized audio and its two-pass normalized master.
- `edl-used.json`, `verification.json`: exact input EDL snapshot and output/media/loudness evidence.

The source capture is expected at `output/trailer/raw.webm`. Raw recordings and generated output are local production artifacts; keep them outside the public game bundle. The browser game is currently at https://codeshift-lab.bsfire1237.chatgpt.site, but the renderer deliberately uses a small working-title treatment instead of a large URL over gameplay.

Local `C:/Windows/Fonts/malgun.ttf` and `malgunbd.ttf` were found read-only on 2026-10-09. The renderer uses **Malgun Gothic** for Korean/English. `YuGothR.ttc` and related files were also found; **Yu Gothic** is selected for Japanese. These system fonts are used locally and are not redistributed. The script stops if the expected CJK font is absent rather than claiming that an unverified fallback covers all glyphs. Captions are wrapped to at most two lines; longer text fails with an instruction to shorten it.

## Audio and verification

The quiet 112bpm pulse is new mathematical synthesis: sine bass, soft harmonics, small decaying accents at cuts, gentle fades, and a music dip under accents. It uses `wave`, `math`, and `array` only, with no downloaded samples or voice. Source audio is not used, since browser playback capture is visual. This makes the final track deterministic and avoids pitch-shifting source effects during accelerated cuts.

The mix follows the audio-design skill’s group/headroom practice: music and accents are separate mathematical layers; accents briefly lower music; a two-pass FFmpeg `loudnorm` targets **−16 LUFS / −1.5 dBTP**. AAC is then measured again. The script accepts ±1 LUFS and no encoded true peak above −1 dBTP, to allow encoding variation, and records the measured values. This is a measured delivery tolerance, not a claim of perfectly equal loudness on all speakers.

Rendering is **serial**, with at most four FFmpeg codec threads and one filter/filter-complex thread. Each segment has a 180-second subprocess timeout; each export and full-file decode has a 300-second timeout. Every MP4 must have H.264/AAC, the expected dimensions and 30fps, the EDL’s frame count and duration, valid measured loudness, and a successful full decode. Failure stops the script; partial files must not be described as a finished trailer.

After automated verification, watch the complete video, inspect cut boundaries and CJK glyphs, and listen on headphones and speakers. Check that input, changed code, and result remain readable at mobile size. The script records this review as remaining work. There is no publishing or upload command.

Sources for the local editing method: [FFmpeg filters](https://ffmpeg.org/ffmpeg-filters.html), [Playwright recording](https://playwright.dev/docs/videos), and the game’s [launch plan](../../docs/launch-plan.md). The full user reference triage, including tool existence and licensing limits, is in the launch plan.

## 0.8 RC recording

`capture-release.py` captures a new UI-only route from a fresh title screen through the cafe and all 18 career jobs. It reads the optional answer panel and types the examples into the visible editor; it never injects completion state. Only selected scenes appear in the 42-second edit. The original `capture.py` / `edl.json` pair remains the historical cafe trailer.

```powershell
python media/trailer/capture-release.py
python media/trailer/render.py --edl media/trailer/edl-0.8.json --output output/trailer-0.8 --languages ko en ja --vertical-languages ko
```

The 0.8 clips include the title, empty desktop, request, setup, visible repair and check, delivery, cafe OPEN, new clients, customer reply, upgrades and career conclusion. Captions are localized; recorded UI is Korean. The working-title caption does not imply an available Steam store listing. Output timing and media checks are recorded in `output/trailer-0.8/verification.json`.

The 2026-10-09 review inspected a contact sheet covering all 42 seconds, a full-resolution Japanese sample, and browser playback/seeking for all three landscape exports. Full-file decode and encoded loudness checks passed for all four exports. No human headphone/speaker listening session was performed. Source capture and EDL are retained so timing and wording can be revised without inventing gameplay footage.

## 0.9 RC recording

`capture-art.py` records the same UI-only campaign with the new title environment, portraits, cafe art, selectable neighborhood map, delivery feedback and studio scene. It uses stable tools/record button identifiers after the new map entry was added. The old captures and EDL files remain historical records.

```powershell
python media/trailer/capture-art.py
python media/trailer/render.py --edl media/trailer/edl-0.9.json --output output/trailer-0.9 --languages ko en ja --vertical-languages ko
```

All four exports pass complete decoding, duration/frame count and encoded loudness checks in `output/trailer-0.9/verification.json`. Visual review and its limits are recorded in [0.9 QA](../../docs/QA-0.9-RC.md). Built-in image generation produced the environment/portrait images visible in the recorded game; [the prompts and asset paths](../game-art-prompts.json) are retained. No generated video substitutes for gameplay.
