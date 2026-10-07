# CODE:SHIFT 0.1 — verification record

## Tested release scope

Three connected Mono Cafe contracts in a Korean virtual desktop. Player shell commands, installs, repositories, services and API traffic operate only on game state. HTML/CSS is rendered in script-free, network-blocked preview frames. JavaScript supports the documented arithmetic function subset; Python supports the supplied template's route and order-storage settings. Authored NPC guidance is not an LLM.

## Automated checks

`node --experimental-strip-types --test lib/game/engine.test.ts lib/game/save.test.ts` — 13 tests pass, 0 failures.

Coverage: missing tools vs missing manifests vs missing dependencies; quoted arguments and relative paths; staged/committed/pushed snapshot separation; supported equivalent arithmetic expressions and rejected syntax; stale test evidence; stopped API processes; one-time rewards; same-file moves; restored staging and tracked deletions; early fixes of later contracts; per-machine order storage; project-specific frontend process roots; invalid/oversized autosave preserving the previous record.

`node node_modules/typescript/bin/tsc --noEmit` — passes.

## Browser playthrough

Completed all three contracts through the actual React interface in the supervised preview at `http://terminal.local:4173/` using the cloud Chrome browser.

1. Searched the game internet, opened CatHub, cloned the project and recovered from absent npm, incorrect working directory and absent project dependencies. Started the simulated development server. The initial CSS produced 984px of content in the 360px check; the player's responsive CSS reduced it to 360px. The visible menu/button checks and 1024px desktop three-column checks passed. Committed, pushed, requested PR review, merged and deployed. First reward: balance 470cr / 120XP.
2. Observed failing arithmetic checks: 4503, 5002, 4500, 5501. Changed the arithmetic function to multiplication. All four checks passed; the interactive order total changed with quantity. Committed, pushed, reviewed, merged and deployed. Balance 970cr / 300XP.
3. Edited `MENU_PATH` and `SAVE_ORDERS`, committed and pushed. Installed simulated Ubuntu, connected via SSH, installed server-specific Git/Python/pip, cloned, installed Python dependencies and started the API. GET `/api/menu` returned 200. POST `/api/orders` returned 201 with the submitted item/quantity and `stored: true`. The server order table contained the request. All three checks passed; PR review, merge and deployment completed. Final balance: 1720cr / 560XP, three completed contracts and all three badges.
4. Reloaded the page and verified that the completed contracts, credits, XP, badges, files and running-machine state restored after hydration.
5. Verified the preview's 360px control selected mobile mode and the actual iframe width was 360px. This is an in-game preview check, not a claim of phone-device browser testing.

## Review fixes and focused verification

Two independent read-only reviews found eight issues in total. Fixed all: same-path move deletion; stale stage when restoring a file; inability to stage tracked deletion; later-contract early fixes blocked from review; local/server order stores mixed; development preview ignoring process root; unreadable oversized saves replacing valid progress; SVG `xlink:href` escaping the simulated network through frame navigation.

After the final fixes, repeated the other-folder runtime path through the UI. The browser correctly displayed the actual wrong folder and recovery instructions. Stopping that process and starting in `menu-site` restored the preview. Added an SVG test link through the editor: frame DOM inspection showed only its `id` attribute, no `href`/`xlink:href`, and zero SVG animation elements. Restored the original HTML after the test.

The regression suite and TypeScript check passed on the updated source. The publishing workflow must also complete its production build before pushing and packaging the exact source commit.

## Limits and handoff

- No live local LLM, SQL, authentication curriculum, branch/merge-conflict lessons, arbitrary Python/JavaScript execution or full upper-intermediate campaign is claimed.
- Orders are per-machine process memory and clear when that Python process restarts.
- Saves are local to the browser, with no cross-device sync or export/import UI in this release.
- Desktop Chrome was exercised. Full physical mobile-device testing was not available through this browser capability.
- The browser reported no available WebMCP tools; UI testing did not depend on them.
- The screenshot `qa-playthrough.jpg` records the completed chapter with its deployed cafe and quest state. It is QA evidence, not a Site thumbnail.
