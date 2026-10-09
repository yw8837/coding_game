#!/usr/bin/env python3
"""Render real gameplay from an editable EDL with only Python stdlib and FFmpeg."""
from __future__ import annotations

import argparse
import array
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import textwrap
import unicodedata
import wave

FPS = 30
RATE = 48000
BPM = 112
NAVY = "0x101923"
ROOT = Path(__file__).resolve().parents[2]
WINDOWS_FFMPEG = Path(
    "C:/Users/최용우/AppData/Local/Microsoft/WinGet/Packages/"
    "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/"
    "ffmpeg-9.0-full_build/bin"
)
LANGUAGES = ("ko", "en", "ja")
NOTES = {
    "ko": "실제 플레이 화면 · 일부 구간 배속",
    "en": "Actual gameplay · some sections sped up",
    "ja": "実際のプレイ画面 · 一部区間は倍速",
}


def run(command: list[str], *, cwd: Path, timeout: int = 180) -> subprocess.CompletedProcess:
    """No shell, bounded time, serial execution, and a useful short failure tail."""
    print(f"  {Path(command[0]).name}: {command[-1]}", flush=True)
    try:
        result = subprocess.run(
            command, cwd=cwd, capture_output=True, text=True,
            encoding="utf-8", errors="replace", timeout=timeout, check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError(f"Media command exceeded {timeout}s") from exc
    if result.returncode:
        raise RuntimeError(f"Media command failed ({result.returncode}):\n{result.stderr[-5000:]}")
    return result


def media_binary(name: str, override: str | None) -> str:
    if override:
        candidate = Path(override).expanduser().resolve()
        if candidate.is_file():
            return str(candidate)
        raise ValueError(f"{name} executable not found: {candidate}")
    found = shutil.which(name)
    if found:
        return found
    candidate = WINDOWS_FFMPEG / (name + ".exe")
    if candidate.is_file():
        return str(candidate)
    raise ValueError(f"{name} is not installed; no installation will be attempted")


def probe(ffprobe: str, path: Path) -> dict:
    result = run(
        [ffprobe, "-v", "error", "-show_format", "-show_streams", "-of", "json", str(path)],
        cwd=path.parent, timeout=30,
    )
    return json.loads(result.stdout)


def number(value: object, label: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{label} must be a number")
    result = float(value)
    if not math.isfinite(result):
        raise ValueError(f"{label} must be finite")
    return result


def read_edl(path: Path, max_speed: float) -> tuple[Path, list[dict], int]:
    document = json.loads(path.read_text(encoding="utf-8-sig"))
    if not isinstance(document, dict) or not isinstance(document.get("source"), str):
        raise ValueError("EDL needs a source path and shots array")
    source = Path(document["source"]).expanduser()
    if not source.is_absolute():
        options = [path.parent / source, ROOT / source]
        source = next((option for option in options if option.is_file()), options[0])
    source = source.resolve()
    if not source.is_file():
        raise ValueError(f"Source recording not found: {source}")
    items = document.get("shots")
    if not isinstance(items, list) or not items:
        raise ValueError("EDL shots must be a non-empty array")
    shots: list[dict] = []
    ids: set[str] = set()
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            raise ValueError(f"Shot {index + 1} must be an object")
        identity = item.get("id")
        if not isinstance(identity, str) or not re.fullmatch(r"[A-Za-z0-9_-]+", identity) or identity in ids:
            raise ValueError("Shot ids must be unique letters/numbers/underscore/hyphen strings")
        ids.add(identity)
        start, end, duration = (number(item.get(key), f"{identity}.{key}") for key in ("start", "end", "duration"))
        if start < 0 or end <= start or duration <= 0:
            raise ValueError(f"{identity}: need 0 <= start < end and duration > 0")
        frames = round(duration * FPS)
        if frames < 1 or abs(frames / FPS - duration) > 1e-6:
            raise ValueError(f"{identity}: duration must lie on the {FPS}fps frame grid")
        speed = (end - start) / duration
        if not 0.25 <= speed <= max_speed:
            raise ValueError(f"{identity}: {speed:.2f}x speed is outside 0.25..{max_speed:g}x; edit EDL or --max-speed")
        captions = item.get("caption")
        if not isinstance(captions, dict) or any(not isinstance(captions.get(lang), str) or not captions[lang].strip() for lang in LANGUAGES):
            raise ValueError(f"{identity}: caption must contain non-empty ko/en/ja strings")
        crop = item.get("crop")
        if crop is not None:
            if not isinstance(crop, dict) or any(isinstance(crop.get(key), bool) or not isinstance(crop.get(key), int) for key in ("x", "y", "width", "height")):
                raise ValueError(f"{identity}: crop requires integer x/y/width/height")
            if crop["x"] < 0 or crop["y"] < 0 or crop["width"] <= 0 or crop["height"] <= 0:
                raise ValueError(f"{identity}: invalid crop geometry")
        shots.append({**item, "start": start, "end": end, "duration": frames / FPS, "frames": frames, "speed": speed})
    frame_count = sum(shot["frames"] for shot in shots)
    if not 30 * FPS <= frame_count <= 45 * FPS:
        raise ValueError("Trailer total duration must be 30..45 seconds")
    return source, shots, frame_count


def timestamp(seconds: float, *, ass: bool = False) -> str:
    base = 100 if ass else 1000
    total = round(seconds * base)
    hours, remainder = divmod(total, 3600 * base)
    minutes, remainder = divmod(remainder, 60 * base)
    whole, fraction = divmod(remainder, base)
    return f"{hours}:{minutes:02}:{whole:02}.{fraction:02}" if ass else f"{hours:02}:{minutes:02}:{whole:02},{fraction:03}"


def width(text: str) -> int:
    return sum(2 if unicodedata.east_asian_width(char) in "WF" else 1 for char in text)


def caption_lines(text: str, limit: int) -> list[str]:
    """Measured text-cell wrap; reject overflow rather than silently shrinking text."""
    text = " ".join(text.split())
    lines: list[str] = []
    current = ""
    # Preserve whole words in Latin text; split CJK text when necessary.
    for word in text.split(" "):
        if width(word) > limit:
            units = list(word)
        else:
            units = [word]
        for unit in units:
            separator = " " if current and len(units) == 1 else ""
            candidate = current + separator + unit
            if current and width(candidate) > limit:
                lines.append(current)
                current = unit
            else:
                current = candidate
    if current:
        lines.append(current)
    if len(lines) > 2:
        raise ValueError(f"Caption exceeds two lines; shorten it: {text}")
    return lines


def ass_escape(text: str) -> str:
    return text.replace("\\", "＼").replace("{", "｛").replace("}", "｝")


def font_name(language: str) -> str:
    fonts = Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts"
    if language == "ja" and (fonts / "YuGothR.ttc").is_file():
        return "Yu Gothic"
    if (fonts / "malgun.ttf").is_file():
        return "Malgun Gothic"
    # The render must not claim CJK glyph coverage if no verified local font exists.
    raise ValueError("Verified local CJK font missing; provide Malgun Gothic or Yu Gothic without downloading in this script")


def write_captions(output: Path, shots: list[dict], total: float, language: str, vertical: bool) -> Path:
    canvas_width, canvas_height = (1080, 1920) if vertical else (1920, 1080)
    font = font_name(language)
    caption_size, note_size = (44, 25) if vertical else (32, 18)
    ass_path = output / f"captions-{language}{'-vertical' if vertical else ''}.ass"
    heading = textwrap.dedent(f"""\
        [Script Info]
        ScriptType: v4.00+
        PlayResX: {canvas_width}
        PlayResY: {canvas_height}
        WrapStyle: 2
        ScaledBorderAndShadow: yes

        [V4+ Styles]
        Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
        Style: Caption,{font},{caption_size},&H00F4EDE5,&H00F4EDE5,&H00231910,&H00231910,0,0,0,0,100,100,0,0,1,0,0,7,48,48,12,1
        Style: Note,{font},{note_size},&H00C9BBAC,&H00C9BBAC,&H00231910,&H00231910,0,0,0,0,100,100,0,0,1,0,0,7,48,48,12,1
        Style: Title,{font},{30 if vertical else 22},&H00BFE472,&H00BFE472,&H00231910,&H00231910,1,0,0,0,100,100,0,0,1,0,0,7,48,48,12,1

        [Events]
        Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
        """)
    events = [heading]
    # All overlays sit outside the complete footage area, never over code or taskbar.
    title_pos = "{\\an7\\pos(64,400)}" if vertical else "{\\an9\\pos(1872,18)}"
    note_pos = "{\\an7\\pos(64,1470)}" if vertical else "{\\an7\\pos(48,94)}"
    caption_pos = "{\\an7\\pos(64,480)}" if vertical else "{\\an7\\pos(48,10)}"
    events.append(f"Dialogue: 0,0:00:00.00,{timestamp(total, ass=True)},Title,,0,0,0,,{title_pos}CODE:SHIFT")
    events.append(f"Dialogue: 0,0:00:00.00,{timestamp(total, ass=True)},Note,,0,0,0,,{note_pos}{NOTES[language]}")
    srt: list[str] = []
    cursor_frames = 0
    for index, shot in enumerate(shots, 1):
        start, end = cursor_frames / FPS, (cursor_frames + shot["frames"]) / FPS
        lines = caption_lines(shot["caption"][language], 40 if vertical else 88)
        formatted = r"\N".join(ass_escape(line) for line in lines)
        events.append(f"Dialogue: 1,{timestamp(start, ass=True)},{timestamp(end, ass=True)},Caption,,0,0,0,,{caption_pos}{formatted}")
        srt.append(f"{index}\n{timestamp(start)} --> {timestamp(end)}\n" + "\n".join(lines))
        cursor_frames += shot["frames"]
    ass_path.write_text("\n".join(events) + "\n", encoding="utf-8")
    if not vertical:
        (output / f"captions.{language}.srt").write_text("\n\n".join(srt) + "\n", encoding="utf-8")
    return ass_path


def synthesize_audio(path: Path, total: float, cuts: list[float]) -> dict:
    """Original 112bpm sine pulse, gentle harmonics and decaying cut accents."""
    beat = 60 / BPM
    roots = (110.0, 130.8128, 146.8324, 164.8138)
    sample_count = round(total * RATE)
    peak = 0.0
    cut_index = 0
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(RATE)
        buffer = array.array("h")
        for sample in range(sample_count):
            t = sample / RATE
            beat_index = int(t / beat)
            phase = t - beat_index * beat
            root = roots[(beat_index // 8) % len(roots)]
            fade = max(0.0, min(1.0, t / .65, (total - t) / 1.1))
            pulse = .10 * math.exp(-phase * 8) * math.sin(2 * math.pi * root * phase)
            upper = .026 * math.exp(-phase * 5) * math.sin(2 * math.pi * root * (4 if beat_index % 2 else 3) * phase)
            bar_phase = (beat_index % 8) * beat + phase
            pad_fade = math.sin(math.pi * bar_phase / (8 * beat)) ** 2
            pad = .012 * pad_fade * (math.sin(2 * math.pi * root * 2 * bar_phase) + math.sin(2 * math.pi * root * 3 * bar_phase))
            while cut_index + 1 < len(cuts) and cuts[cut_index + 1] <= t:
                cut_index += 1
            elapsed = t - cuts[cut_index] if cuts else 99
            accent = .045 * math.exp(-elapsed * 35) * math.sin(2 * math.pi * (660 + 55 * (cut_index % 3)) * elapsed) if 0 <= elapsed < .18 else 0.0
            duck = .7 + .3 * min(1.0, max(0.0, elapsed) / .18)
            music = (pulse + upper + pad) * duck
            left, right = fade * (music + accent), fade * (music + accent * .9)
            peak = max(peak, abs(left), abs(right))
            buffer.extend((round(max(-1, min(1, left)) * 32767), round(max(-1, min(1, right)) * 32767)))
            if len(buffer) >= 8192:
                if sys.byteorder != "little":
                    buffer.byteswap()
                wav.writeframesraw(buffer.tobytes())
                buffer = array.array("h")
        if buffer:
            if sys.byteorder != "little":
                buffer.byteswap()
            wav.writeframesraw(buffer.tobytes())
    return {"bpm": BPM, "sample_rate": RATE, "channels": 2, "peak_dbfs_before_normalization": round(20 * math.log10(max(peak, 1e-12)), 2), "source": "Original mathematical synthesis; no downloaded media or voices"}


def loudness_json(stderr: str) -> dict:
    blocks = re.findall(r'\{\s*"input_i".*?\}', stderr, re.S)
    if not blocks:
        raise RuntimeError("FFmpeg loudnorm measurement did not return JSON")
    data = json.loads(blocks[-1])
    for key in ("input_i", "input_tp", "input_lra", "input_thresh", "target_offset"):
        if not math.isfinite(float(data[key])):
            raise RuntimeError("Non-finite loudness measurement")
    return data


def normalize_audio(ffmpeg: str, output: Path) -> dict:
    source = output / "original-pulse.wav"
    measure = run([ffmpeg, "-hide_banner", "-nostdin", "-threads", "4", "-filter_threads", "1", "-i", str(source), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], cwd=output)
    values = loudness_json(measure.stderr)
    filters = "loudnorm=I=-16:TP=-1.5:LRA=11:" + ":".join(
        f"{name}={values[key]}" for name, key in (
            ("measured_I", "input_i"), ("measured_TP", "input_tp"),
            ("measured_LRA", "input_lra"), ("measured_thresh", "input_thresh"),
            ("offset", "target_offset"),
        )
    ) + ":linear=true:print_format=json"
    second = run([ffmpeg, "-y", "-hide_banner", "-nostdin", "-threads", "4", "-filter_threads", "1", "-i", str(source), "-af", filters, "-ar", str(RATE), "-c:a", "pcm_s16le", "normalized-pulse.wav"], cwd=output)
    return {"target_lufs": -16, "target_true_peak_db": -1.5, "first_pass": values, "second_pass": loudness_json(second.stderr)}


def validate_output(ffmpeg: str, ffprobe: str, path: Path, total_frames: int, size: tuple[int, int]) -> dict:
    info = probe(ffprobe, path)
    video = next((stream for stream in info["streams"] if stream["codec_type"] == "video"), None)
    audio = next((stream for stream in info["streams"] if stream["codec_type"] == "audio"), None)
    if not video or not audio or video["codec_name"] != "h264" or audio["codec_name"] != "aac":
        raise RuntimeError(f"Invalid H.264/AAC streams: {path.name}")
    if (video["width"], video["height"]) != size or video["r_frame_rate"] != "30/1":
        raise RuntimeError(f"Invalid video dimensions/frame rate: {path.name}")
    if abs(float(video.get("duration", info["format"]["duration"])) - total_frames / FPS) > .08:
        raise RuntimeError(f"Video duration differs from EDL: {path.name}")
    if video.get("nb_frames") and int(video["nb_frames"]) != total_frames:
        raise RuntimeError(f"Video frame count differs from EDL: {path.name}")
    run([ffmpeg, "-v", "error", "-xerror", "-nostdin", "-threads", "4", "-filter_threads", "1", "-i", str(path), "-f", "null", "-"], cwd=path.parent, timeout=300)
    measured = run([ffmpeg, "-hide_banner", "-nostdin", "-threads", "4", "-filter_threads", "1", "-i", str(path), "-vn", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], cwd=path.parent, timeout=180)
    loudness = loudness_json(measured.stderr)
    if abs(float(loudness["input_i"]) + 16) > 1.0 or float(loudness["input_tp"]) > -1.0:
        raise RuntimeError(f"Encoded audio exceeds loudness tolerance: {path.name}, {loudness}")
    return {"file": path.name, "bytes": path.stat().st_size, "width": size[0], "height": size[1], "fps": FPS, "frames": total_frames, "duration": float(info["format"]["duration"]), "full_decode": "passed", "encoded_loudness": loudness}


def render(args: argparse.Namespace) -> None:
    ffmpeg = media_binary("ffmpeg", args.ffmpeg)
    ffprobe = media_binary("ffprobe", args.ffprobe)
    edl_path = Path(args.edl).expanduser().resolve()
    if not math.isfinite(args.max_speed) or args.max_speed < 1:
        raise ValueError("--max-speed must be a finite value >= 1")
    source, shots, frames = read_edl(edl_path, args.max_speed)
    languages = list(dict.fromkeys(args.languages))
    vertical_languages = [] if args.no_vertical else list(dict.fromkeys(args.vertical_languages if args.vertical_languages is not None else languages))
    for language in LANGUAGES:
        font_name(language)
    source_info = probe(ffprobe, source)
    source_video = next((stream for stream in source_info["streams"] if stream["codec_type"] == "video"), None)
    if not source_video:
        raise ValueError("Source contains no video stream")
    source_duration = float(source_info["format"].get("duration", 0))
    for shot in shots:
        if source_duration and shot["end"] > source_duration + .1:
            raise ValueError(f"{shot['id']}: source end exceeds recording duration")
        crop = shot.get("crop")
        if crop and (crop["x"] + crop["width"] > source_video["width"] or crop["y"] + crop["height"] > source_video["height"]):
            raise ValueError(f"{shot['id']}: crop exceeds source dimensions")

    total = frames / FPS
    print(f"Source: {source}\nEDL: {len(shots)} shots / {frames} frames / {total:.3f}s", flush=True)
    output = Path(args.output).expanduser().resolve()
    output.mkdir(parents=True, exist_ok=True)
    work = output / "work"
    work.mkdir(exist_ok=True)
    shutil.copyfile(edl_path, output / "edl-used.json")
    cuts: list[float] = []
    cursor = 0
    for shot in shots:
        cuts.append(cursor / FPS)
        cursor += shot["frames"]
    synthesis = synthesize_audio(output / "original-pulse.wav", total, cuts)
    normalized = normalize_audio(ffmpeg, output)
    for language in LANGUAGES:
        write_captions(output, shots, total, language, False)
        if language in vertical_languages:
            write_captions(output, shots, total, language, True)

    base = [ffmpeg, "-y", "-hide_banner", "-nostdin", "-threads", "4", "-filter_threads", "1", "-filter_complex_threads", "1"]
    segments: list[Path] = []
    for index, shot in enumerate(shots):
        segment = work / f"{index + 1:02}-{shot['id']}.mp4"
        ratio = shot["duration"] / (shot["end"] - shot["start"])
        filters = []
        if shot.get("crop"):
            crop = shot["crop"]
            filters.append(f"crop={crop['width']}:{crop['height']}:{crop['x']}:{crop['y']}")
        filters.extend([
            f"setpts={ratio:.12f}*(PTS-STARTPTS)", "fps=30",
            "scale=1920:1080:force_original_aspect_ratio=decrease:force_divisible_by=2",
            f"pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color={NAVY}",
            "setsar=1", f"tpad=stop_mode=clone:stop_duration={shot['duration']:.6f}",
        ])
        run(base + ["-ss", f"{shot['start']:.6f}", "-t", f"{shot['end'] - shot['start']:.6f}", "-i", str(source), "-map", "0:v:0", "-an", "-vf", ",".join(filters), "-frames:v", str(shot["frames"]), "-c:v", "libx264", "-threads", "4", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", str(segment)], cwd=output, timeout=180)
        segment_info = probe(ffprobe, segment)
        count = next(stream for stream in segment_info["streams"] if stream["codec_type"] == "video").get("nb_frames")
        if count is not None and int(count) != shot["frames"]:
            raise RuntimeError(f"Wrong segment frame count: {segment.name}")
        segments.append(segment)

    (work / "concat.txt").write_text("".join(f"file '{path.name}'\n" for path in segments), encoding="utf-8")
    run(base + ["-f", "concat", "-safe", "0", "-i", str(work / "concat.txt"), "-an", "-c:v", "copy", "-movflags", "+faststart", str(output / "gameplay-master.mp4")], cwd=output, timeout=300)
    results = []
    variants = [(language, False) for language in languages] + [(language, True) for language in vertical_languages]
    for language, vertical in variants:
        name = f"codeshift-{language}{'-vertical' if vertical else ''}.mp4"
        ass = f"captions-{language}{'-vertical' if vertical else ''}.ass"
        if vertical:
            filters = f"scale=1080:608,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color={NAVY},setsar=1,ass=filename={ass}"
            size = (1080, 1920)
        else:
            filters = f"scale=1706:960,pad=1920:1080:(ow-iw)/2:120:color={NAVY},setsar=1,ass=filename={ass}"
            size = (1920, 1080)
        run(base + ["-i", "gameplay-master.mp4", "-i", "normalized-pulse.wav", "-map", "0:v:0", "-map", "1:a:0", "-vf", filters, "-frames:v", str(frames), "-t", f"{total:.6f}", "-c:v", "libx264", "-threads", "4", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", str(RATE), "-ac", "2", "-metadata", "title=CODE:SHIFT (working title) - actual gameplay", "-movflags", "+faststart", name], cwd=output, timeout=300)
        results.append(validate_output(ffmpeg, ffprobe, output / name, frames, size))
    report = {
        "edl": str(edl_path), "source": str(source), "duration": total,
        "frames": frames, "synthesis": synthesis, "audio_normalization": normalized,
        "font": {lang: font_name(lang) for lang in LANGUAGES},
        "source_audio": "Not used; playback capture is visual and the original synthesized bed contains all delivered audio",
        "shots": [{"id": shot["id"], "start": shot["start"], "end": shot["end"], "duration": shot["duration"], "speed": shot["speed"]} for shot in shots],
        "outputs": results,
        "review_remaining": "Listen and inspect caption glyphs, shot boundaries and UI readability before publication",
    }
    (output / "verification.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Complete: {len(results)} verified MP4 files. Review: {output / 'verification.json'}", flush=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--edl", default=str(ROOT / "media/trailer/edl.json"))
    parser.add_argument("--output", default=str(ROOT / "output/trailer"))
    parser.add_argument("--languages", nargs="+", choices=LANGUAGES, default=["ko"])
    parser.add_argument("--max-speed", type=float, default=8.0)
    parser.add_argument("--vertical-languages", nargs="+", choices=LANGUAGES, help="Render vertical variants only for these languages (default: selected landscape languages)")
    parser.add_argument("--no-vertical", action="store_true")
    parser.add_argument("--ffmpeg")
    parser.add_argument("--ffprobe")
    args = parser.parse_args()
    try:
        render(args)
    except (ValueError, OSError, RuntimeError, json.JSONDecodeError) as exc:
        print(f"Render stopped: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
