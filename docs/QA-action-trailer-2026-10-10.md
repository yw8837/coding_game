# English gameplay action cut — 2026-10-10

The user asked for more terminal typing and actual play, and a less static ending.
This revision replaces the delivered English 30-second edit. Public website
videos, the posted X/Threads copy and Steam packages were not changed.

## Delivered media

- `gameplay-trailer-en.mp4`: 30.00 s, 1920×1080, 30 fps, 900 frames,
  H.264 yuv420p + AAC 48 kHz stereo, 3,629,508 bytes.
- SHA256: `6fee03dd48cb4eeb4faca5bc61cf80da3a9698496f1f739de241cadc5a24b4cd`.
- Actual code/terminal scenes occupy 14.067 seconds, versus the prior edit's
  2.813-second editor shot and no Terminal scene.
- `reddit-gameplay-en.gif`: 10.33 s, 960×540, 1,593,870 bytes, silent. Its selected
  range is code input → node execution → passing tests. Full decode passed.
- `gameplay-cover-en.jpg`: 1280×720 editorial video-frame composition, with the
  actual captured code and three words, FIX. RUN. SHIP. Reviewed at full size
  and 320×180; no generated game screen or person was added.

## Capture evidence

Source: `output/trailer-action-20261010/take2/`. Raw recording is 89.88 s with
20 recorded shot ranges and zero page errors. Source SHA256:
`597f5dbc31c4a85d9cd84b2c6545d6dbe00de28e11f3fb0ec5fcc25e0839c7dd`.
Capture evidence SHA256:
`5b440a2bb266dcf7d93ddcd603dbf13cc495b905cc8afd40c10dc8dec5124257`.

The full-edition client runs locally through desktop/vite.config.mjs. The prior
UI-earned English café save is imported through Settings. No localStorage save
injection or fabricated output is used. This is automated real UI capture, not
a continuous human playthrough or Steam package validation.

The accepted bakery job is put into JavaScript mode through the UI. The player
types cd and node commands, observes the starter fail, opens `code solution.js`,
inputs the function through the editor, returns to Terminal and runs:

```
node solution.js '{"quantity":8}'
node --test solution.js
```

The real results are 13600 and 20 tests passed / 0 failed. Terminal proof is
asserted fresh before returning to the job, delivering it for 200 cr and buying
the 600 cr second monitor. All 12 selected career jobs are completed through UI,
followed by an authored English app, its filters, build, publish and final letter.
These full-game scenes exceed the café-only public demo scope.

Take 1 was rejected: simulated newline key presses interacted with the editor's
auto-indent/pair behavior and the exact-value assertion failed. Take 2 inserts
individual characters as text input events, including newlines, and asserts the
saved source and test outcome. The rejected take was never delivered.

## Editing and validation

`media/trailer/action-edit.py` retains the existing bounded serial FFmpeg encoder
and validators. Its EDL binds capture, source hashes, actual crop ranges and cuts.
Maximum retiming is 2.233×. Terminal shots place two synchronous bands from the
same recorded frame together, omitting empty space between output and input.
The terminal-open shot and editor are shown as recorded. No fake terminal output
or generated gameplay is composited. Final beats show the actual build/publish
actions and the letter from Jiwoo, followed by “Now it’s your turn.”

All 13 final scene samples were visually inspected. Full decoding, dimension,
frame count, duration, codec and audio checks passed. Integrated loudness is
−16.09 LUFS; true peak is −1.73 dBTP. The bright Voxel Revolution track and its
CC BY 4.0 attribution are preserved, with new editorial typing/cut/release cues.
Human listening, native-speaker review and viewer engagement testing are not
claimed. No synthetic video model was used: this request needs real gameplay.

The existing thumbnail skill's face recommendation is superseded by the user's
explicit preference for no people in promotional artwork. The video strategy
skill is applied to the bug → action → result → first release sequence. The AI
video-generation workflow was reviewed but generated behavior would misrepresent
this demonstration, so capture and deterministic editing were used.

## Reproduction

Start the full local Vite client on an unused local port. For capture, set
`CODESHIFT_CAPTURE_LANGUAGE=en`, `CODESHIFT_CAPTURE_ACTION=1`,
`CODESHIFT_CAPTURE_URL` and a fresh `CODESHIFT_CAPTURE_OUTPUT`, then run
`python media/trailer/capture-current.py`. Set `CODESHIFT_TRAILER_OUTPUT` to that
directory and run `python media/trailer/action-edit.py`. The `--assets-only`
flag exports the cover/GIF from an existing rendered action edit.

Reddit is on hold. The user's template requires a playable link, description of
at least 100 words, demo status and development involvement. The separate draft
at `docs/marketing/reddit-demo-en.md` follows that supplied template. No post or
upload was made; the gallery restriction is not treated as a subreddit-wide
video ban. X/Threads already posted by the user remain unchanged.
