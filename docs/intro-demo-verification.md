# Introductory demo verification

## Browser flow

Used the actual game UI to accept the single mission, search COOCLE, open CatHub, and prepare the project using the suggested commands. Verified command insertion waits for Enter, current-directory guidance, package installation, development-server startup, and separate Git add/commit/push guidance.

Initial checks: missing cafe name failed, 984px content at a 360px viewport failed, PC layout passed. CSS-only change reduced content to 360px and passed both layout checks while the title check still failed. Adding the cafe name to the h1 passed all three checks.

Completed the PR review, merge and deployment using the UI. Final screen displayed DEMO COMPLETE, 1/1 mission, 470cr and 120XP. API/server applications and next-mission prompts are absent from the demo surface.

Reloaded the browser and verified the single completed mission, first-deployment badge, credits and XP restored. `intro-demo.jpg` records the completed game state.

## Automated coverage

The original 13 state/persistence regressions remain. An additional guide regression follows the complete setup command sequence and the staged/committed/pushed states through the demo ending. The publishing workflow runs all 14 tests, TypeScript, and the production build before committing/pushing and packaging the exact source.

## Scope

This is one introductory HTML/CSS demo as requested. Authored guidance, simulated installations, five desktop apps and local saves. Existing prior-version saves use a different key and remain untouched. No real local LLM or full campaign is claimed.
