# Terminal editing follow-up — 2026-10-10

This is a solo Codex follow-up to full-edition RC `0.14.0-rc.0`, based on
`4944201`. No Claude review, sub-agent review, human playtest, Steam upload or
public web deployment is claimed. The previously delivered 0.14 RC is unchanged.

## Reproduced defects

In an isolated native Electron profile using the existing offline renderer:

1. Selecting `cat welcome.txt` and pressing Ctrl+C erased the input. The handler
   prevented the standard copy shortcut regardless of selection.
2. With `cat wel > result.txt` and the caret immediately after `wel`, Tab left
   the path incomplete. The completion code always inspected the end of the line.

Both scenarios failed before the fix. The baseline report is retained at
`output/full-version-quality/terminal-editing-baseline.json`.

## Changed behavior

- Ctrl+C leaves selected command/output text available to the normal copy action.
  With no selection it cancels the unsubmitted input without executing anything.
- Completion replaces the shell token under the caret. Subsequent operands,
  quotes around subsequent arguments, and redirection remain intact. The caret
  stays immediately after the completed token.
- Repeated Tab cycles multiple candidates. Moving the caret invalidates the old
  completion session. The visible Tab button and candidate buttons retain focus
  and the correct insertion point.
- Ctrl+L, draft restoration through history, Escape, Shift+Tab and the existing
  IME guard retain their behavior. No save schema or translated copy changed.
- Completion operates only on the active virtual filesystem. It does not run
  player code, create files, or grant progress/rewards.

Self-review found one extra boundary case: a redirect without separating spaces
(`cat wel>result.txt`) could be swallowed while replacing the token. A failing
regression was added, then unquoted operator boundaries were preserved. An
unsupported `&&` suffix is also retained, allowing the shell to reject the whole
line rather than silently changing it into a valid command.

## Validation

- Required `pnpm verify` passed before changes and after the final source edits:
  lint (316 files, zero errors/warnings), typecheck, dependency mitigation,
  308 game units and 38 desktop units. Final gate: 2026-10-10 10:52:59–10:53:27 UTC.
  Native UI rerun after the final rebuild: 10:53:50–10:53:58 UTC, all 33 passed.
- Three new unit cases cover multiple cursor positions, later operands, spaced
  and unspaced redirects, quoted/escaped filenames, untouched state and isolation
  between the virtual local and server filesystems.
- `pnpm desktop:build` builds the offline full-edition renderer.
- `node tests/e2e/terminal-editing-native.cjs` checks 11 scenarios in each of
  English, Korean and Japanese (33 checks) against real Electron input events.
  The fixture only creates a virtual folder to make a disposable save available;
  commands, completions and virtual file contents are then exercised through UI.
- The final report and three screenshots are under
  `output/full-version-quality/terminal-editing-final*`; build and quality-gate
  logs are retained beside the other local QA evidence.

Clipboard QA records whether the game prevented the real key event, then cancels
the OS default action at the document boundary so the user's clipboard is not
overwritten. It does not inspect clipboard contents. IME checks dispatch
composition-marked keyboard events; they are regression checks for the existing
guard, not a claim of physical keyboard/IME validation on another PC. Native QA
uses a marked temporary profile and closes its own Electron process.

## Still outstanding

These checks verify terminal editing, not human enjoyment, curriculum outcomes
or the entire release. Full continuous viewing/listening of every reference
video remains incomplete; sampled frames and automated reports are not counted
as a complete watch. The exact coverage and rejected analyses remain in
[the reference coverage record](references/coverage-and-release-2026-10-10.md).
The existing [human playtest protocol](playtest/full-edition-0.14.md) still needs
actual beginner and experienced-player observations.

The code is prepared on a review branch; final merge remains a human action under
`AGENTS.md`. The public demo and the archived Windows RC are not updated by this
follow-up.
