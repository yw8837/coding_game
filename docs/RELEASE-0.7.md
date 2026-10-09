# CODE:SHIFT 0.7 — desktop simulator browser edition

CODE:SHIFT is a working title. The browser edition has three connected cases, a saved ending and six optional rule experiments. It is a contained simulation of a developer's desktop; Linux commands, processes, files, Git and API requests share game state and never operate on the player's real machine.

## What changed

- Start/Continue opens a desktop with no app already open. Left shortcuts, bottom taskbar, searchable Start menu, clock, sound, language settings and Show Desktop work.
- Independent app windows can overlap, move, resize, snap left/right, maximize, minimize, close and reopen. React identity retains per-window drafts; file edits persist in the game save. Bounds keep controls reachable after viewport changes. Small screens show the focused app.
- This PC provides three explicit preparation actions backed by validated simulator commands and a live file list. Manual terminal setup still works. The quest tracker describes the next action and its purpose without making the source edit for the player.
- Six optional jobs compare a player-authored restricted rule against several input/output cases. Incorrect rules reveal an actual counterexample; first success pays once. No countdown or failure penalty.
- Korean/English/Japanese UI, localized system terminal guidance, local notepad, sound feedback, one-time story/practice rewards and backward-compatible saves. The cafe heading may be typed in any supported script.
- Three crawlable game-information pages, canonical/hreflang metadata, robots/sitemap and a 42-second actual-gameplay trailer with three subtitle variants. Promotion stays outside the desktop.

## Evidence and limitations

See QA-0.7.md for current verification. Prior 0.3/0.6 review files are historical, not evidence for this release. The Hackhub video was sampled at three documented times, not watched in full. Repository references were triaged; no large engine was imported or migrated. No borrowed game art, video footage or soundtrack was used.

This release targets novice comprehension around age 15. It has not received an official age certificate or an independent novice play study. Automated completion proves the route functions, not that every new player will understand it. Browser release does not imply Steam/mobile-store packaging or store approval. Saves stay in the current browser and are not cloud accounts.

## Recovery and operations

The previous live source is e6a4918b90fad839e46f35e57a3b03d78000fdab (Sites version 6). An owner can redeploy that saved version if required. New save fields have defaults; existing progress is preserved. Corrupt saves display an error and are not silently overwritten before an action. Unsupported shell paths are rejected before any partial file mutation.

Development/build is on the C: NTFS checkout because pnpm links on the user's D: exFAT volume fail. D: is a source mirror synchronized by Git after successful push. Keep one headless browser/build/render at a time; render caps FFmpeg threads and timeouts. Do not terminate an old lock PID without checking the actual owned process.

## Skill application

autopilot provided the spec → bounded parallel work → QA → independent review sequence; ask-matt routed to durable requirements and module ownership. gstack-spec informed the explicit acceptance and rollback specification. The separate tracker/bootstrap interview was unnecessary for the user's autonomous build request; this release uses local docs and the existing GitHub repository. find-skills confirmed existing tools were sufficient. UI/game-feel/review and ultraqa informed interaction and failure checks. Marketing psychology and acquisition/product/SEO/AEO/GEO skills informed truthful presentation, explicit player feedback and accessible external game information. No advertising or social posts were sent.

Video-editing uses actual local gameplay, editable EDL, deterministic FFmpeg cuts, authored captions and original synthesized audio. Optional cloud voice/generation/editing layers were not needed. Native Chromium capture and FFmpeg were already installed. License triage is in reference-research.md and launch-plan.md; the lists are references, not dependencies.
