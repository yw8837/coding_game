# Desktop game release specification

The previous single-window café demo does not meet the user's desktop simulation requirement. This supersedes the obsolete one-mission scope in docs/spec.md. CODE:SHIFT remains a working title; no new final title is chosen.

## Player promise
A player with no coding experience starts a virtual PC, receives a concrete request, investigates the broken result, edits a small real source fragment, checks the result and delivers a working version. Three linked cases have a definite ending. The target comprehension level is a 15-year-old novice, not a claimed official age rating.

## Release scope and decisions
- Browser release on the existing public Site; keep the React/TypeScript simulation. No engine migration, store purchase, paid campaign or external post.
- Title → Start → empty Windows-like desktop, shortcuts left, taskbar bottom, persistent task at right. No auto-open app or café illustration replacing the desktop.
- Multiple real app windows, focus order, titlebar dragging, bounded resizing, minimize/restore, close/reopen, maximize, left/right arrangement. Desktop remains visible behind windows. Mobile uses one visible full-size app and retains the taskbar/task guide.
- Start menu opens installed apps, searchable by name. Clock, settings, sound and language controls function. File manager opens real simulated files. Notes persist. No decorative buttons without behavior.
- Reduce installation prerequisites through an explicit three-step setup UI backed by the same simulated commands; retain the manual terminal route. Source fixes still require player input and actual output verification.
- Keep goals visible; reward changes immediately. Add optional diagnosis/decision challenges with observable consequences and replay without resetting the story.
- Korean, English, Japanese for all added UI, persistent settings, readable focus, reduced motion, recoverable errors and schema-validated saves. Existing saves remain compatible.
- A truthful public game-information page/metadata and local promotional assets stay outside the immersive desktop. Capture actual gameplay for a 30–45 second video. No fake testimonials, invented metrics, official rating or external research links inside the game.

## Acceptance and failure cases
1. Fresh start always reaches a desktop with all windows closed. Existing save continues from desktop.
2. Open messages + browser + editor, move/resize/snap/minimize/restore/close independently. Source and local drafts survive window switches. Bounds stay reachable after viewport resize. No pointer listeners leak.
3. First request through ending using visible prompts without injected state. Wrong code must fail; correction and retest must recover. Required setup cannot be silently skipped by presentation.
4. All three languages, 1440×900 desktop, 1024×768 and 390×844 compact. Dialog stacking and Escape target only top surface. Keyboard and IME remain usable.
5. Existing saves, malformed storage, oversized notes/commands, repeated reward actions, reload mid-mission and completed save are covered.
6. Typecheck, node tests, production build, local dynamic E2E, independent review and actual media decode all pass. Record concerns honestly.
7. Source committed/pushed to yw8837/coding_game, public Site deployed, D: mirror synced, own browser/server processes closed.

## References and limits
Hackhub sampled at 00:38, 01:21 and 22:45: desktop, overlapping tools, persistent checklist and evidence-based progression. Reference repo triage: docs/reference-research.md. Marketing/SEO/video: docs/launch-plan.md. Do not imply a full video watch or full audit of all supplied engine repositories. Automated completion does not prove novice usability; live novice testing remains a launch follow-up.
