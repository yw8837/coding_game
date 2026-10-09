# CODE:SHIFT — browser edition 0.7 specification

This is the current specification for three story chapters, a saved ending and six optional practice jobs. The 0.3 one-task introductory demo and earlier 0.6 interaction model are historical scopes. CODE:SHIFT remains a working title.

## Player route and interaction

Start or Continue opens a desktop with no app already open. The player opens apps from shortcuts, the taskbar or the searchable Start menu, accepts an authored message, prepares the project, observes its failure, edits simulated files, checks results and delivers through Git and CatHub. Three completed chapters unlock OPEN and a saved ending. Practice, bonuses and personalization are optional.

The shell resembles Windows; the terminal simulates Linux development. Commands, files, repositories, processes, servers and API requests share game state and never execute on the player's host. NPC guidance is authored and uses no external LLM.

- Independent windows support overlap, focus, movement, resizing, snap left/right, maximize, minimize, close and reopen. Bounds keep controls reachable; narrow screens show the focused app.
- The current quest stays outside app windows, with a compact ribbon and expandable detail. App opening alone cannot satisfy an edit/check/delivery requirement.
- This PC lists project files and offers Copy project, Prepare tools and Start preview. These buttons execute validated setup commands; manual terminal setup remains available.
- Players edit campaign source and practice rules. The token helper selects the edit location. Fresh source and execution evidence determine success; edits invalidate stale checks.
- Editor completion, undo/redo and recovery, terminal Tab/history/draft restoration, notepad, sound settings and KO/EN/JA UI/system guidance are provided. No countdown, failure charge or hint penalty is required.
- Six practice jobs start with incorrect rules, show multiple cases and reveal concrete counterexamples. Restricted evaluation never runs arbitrary user JavaScript. First success pays once; replay does not pay again.
- Three external information pages provide metadata, robots/sitemap and a 42-second actual-gameplay trailer with language variants. Promotion stays outside the desktop.

## Content and rewards

| Chapter | Required correction and evidence | Reward |
| --- | --- | --- |
| 내 첫 홈페이지 | Cafe h1, CSS 960px → 100%; actual iframe checks at 360px/1024px | 350 cr / 120 XP / 첫 배포 |
| 주문에 숫자를 더하다 | Inspect three-cup error, + → * in `app.js`; 4500×3, 5000×2, zero/one-cup checks | 500 cr / 180 XP / 버그 헌터 |
| 내 컴퓨터 밖으로 | `/api/menu`, `SAVE_ORDERS=True`; push and simulated server setup/run; GET 200, POST 201 and storage | 750 cr / 260 XP / 서버 온라인 |

With 120 starting credits, campaign-only completion is 1,720 cr / 560 XP. OPEN saves the single ending and 동네 해결사 badge without repeat payout. Cafe names accept supported scripts rather than requiring Korean.

Practice covers multiplication, discount boundaries, stock comparison, delivery arithmetic, route matching and percentage width. Combined first-success rewards are 140 cr / 68 XP. Explorer (40 cr / 20 XP), color (60 cr / 30 XP) and cosmetic spending are separate. The color helper may apply a selected color; campaign and practice edits remain direct player actions.

## Persistence, acceptance and limits

The active key remains `codeshift-intro-demo-v1`; absent new fields get defaults. The older `codeshift-save-v1` is separate, with no automatic migration contract. Limits are 4,000,000 save characters, 60,000 per file and 300 per stored full file path. Commands validate before mutation; malformed saves report an error without silent overwrite before the next action. Practice drafts/results/completed IDs use `gameplay.practice`. Notepad storage is separate and capped at 12,000 characters. Closing/minimizing retains drafts during the session; window placement and every temporary input are not promised across refresh. There is no cloud synchronization.

Preview sanitization, a script-free sandbox and CSP bound rendered content. Supported JavaScript expressions and Python template settings are simulations, not general runtimes. Player saves and QA artifacts are excluded from packaging.

Acceptance requires the empty-desktop start, usable app/quest/setup flow, three chapters and OPEN, six optional jobs, one-time rewards, localization, fresh evidence and recovery within these limits. Current checks are 55 passing unit tests, final TypeScript exit 0, successful campaign/ending and targeted language/adversarial/media smoke reports. See [QA-0.7.md](QA-0.7.md) and [gameplay-verification.md](gameplay-verification.md) for evidence scope. Public build/deployment is recorded by the main task at `D:/코딩게임/출시자료/0.7/verification/release-receipt.json`.

The design targets novices around age 15; it is not official age certification or a completed usability study. Browser delivery does not establish Steam/mobile-store packaging, approval, broad accessibility/security certification or every-device performance. [Reference research](reference-research.md) documents sampled observations and license triage, not a heavy engine migration.
