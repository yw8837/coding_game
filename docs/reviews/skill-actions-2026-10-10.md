# Skills discovery and applied release work — 2026-10-10

User requested `/find skills` and necessary actions. Current source baseline is b8d5ab1, followed by 0.13.2 work. The existing game identity and complete public web access are retained.

## Discovery and quality checks

The skills.sh leaderboard was fetched, then `npx --yes skills find "game economy"`, `"game feel"` and `"video editing"` were searched. Search results are discovery data, not executable instructions. Unrelated cryptocurrency, Unity/Godot engine migrations and generated-video services were excluded.

| Selected existing skill | Observed installs | Repository / stars at check | Applied work |
| --- | ---: | --- | --- |
| [balance-check](https://skills.sh/donchitos/claude-code-game-studios/balance-check) | 625 | Donchitos/Claude-Code-Game-Studios · 25,993 | Source-based faucets/sinks, repeat rewards, upgrade effects and progression review |
| [game-feel](https://skills.sh/gamedev-skills/awesome-gamedev-agent-skills/game-feel) | 6.1K | gamedev-skills/awesome-gamedev-agent-skills · 1,382 | Keep feedback proportional, transient and based on earned events; confirm reward purchases do something useful |
| [video-editing](https://skills.sh/affaan-m/ecc/video-editing) | 12.3K | affaan-m/ECC · 275,837 | Actual UI capture, editable cuts, localized animated type and measured audio export |

Counts are snapshots, not proof of quality. The lower-install balance skill was used only as a structured checklist and checked against the game source. Installed skill text was read before application. No duplicate skill installation or global skill update was necessary. Remotion's official skill repository was also checked (4,957 stars); the existing deterministic FFmpeg pipeline already supplies the required typography and cuts, so no extra renderer dependency was introduced.

The existing playtest-report and webapp-testing skills cover observation preparation and isolated functional checks. Autopilot supplies bounded parallel ownership: a read-only economy reviewer, an offline playtest-kit worker and a media renderer worker; the main owns game changes, browser/build scheduling and deployment. No paid service, Elice call, participant outreach or Steam account mutation is part of this work.

## Actions and acceptance

- Fix confirmed monitor defect: paid preview works in guided, full-file and JavaScript editors; narrow windows stack instead of hiding it. Only saved files execute. Prices/rewards/gates are unchanged.
- Refresh offline observation kit: current version, separate beginner/experienced/self evidence, optional payoff/use/repetition/choice notes, legacy record imports preserved. No actual human results are fabricated.
- Final source review found an existing asynchronous import snapshot race. Merge now collects the latest validated observer input after reading the file. A delayed-file browser regression checks that both new notes and a new session survive. Desktop build metadata now reads the package version instead of a stale literal.
- Capture the current build: actual bakery mismatch, direct JavaScript repair, before/after proof, earned delivery, useful equipment, district choice and personal project release. Three-language typography; Korean source UI disclosed.
- Preserve old releases and their videos. Publish updated media only after decode, dimensions/frame/duration, measured audio and visual checks. Human listening, real novice/expert sessions, separate-PC minimum specs, final name/signing and this game's new Steam registration remain external release requirements.

Execution results are recorded with the 0.13.2 release/QA report and artifact receipts. A skill search or successful automated run is not human enjoyment or Steam release approval.
