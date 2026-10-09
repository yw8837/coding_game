# Game feedback audio

The game uses five short synthesized feedback cues, not a background music loop.
The trailer soundtrack is produced separately. The existing sound toggle and
`codeshift-sound` preference remain in `GameShell`; there is no volume slider.

The cues in `lib/game/audio-feedback.ts` use C major and add9 notes. Click is a
small E5 pluck. Success rises C5–E5–G5–D6. Retry asks a lighter E5–D5–G5 question
instead of the previous low D4–C4 descent. Reward and OPEN resolve to C6, with
short filtered shaker taps at a low level. No sustained bass or noise bed is
added.

All voices route through one master gain at −8 dB. At most twelve sources may
be scheduled together; the largest tone gain is 0.09. The conservative sum of
twelve tone peaks after the master is below 0.44, leaving room below full scale.
Repeated clicks within 45 ms coalesce. Finished sources disconnect and return
voice capacity. Mute stops scheduled sources and invalidates a pending browser
audio resume; unmount disposes sources and closes the context. Audio API failures
must not block gameplay.

Validation: `node --test lib/game/audio-feedback.test.ts` covers tonal range,
master routing, voice limits and release, mute, pending resume cancellation,
click coalescing, and disposal. These checks exercise Web Audio scheduling with
a test context; they do not constitute a listening test or a measured LUFS result.
Headphone/speaker playback remains part of the final capture review.
