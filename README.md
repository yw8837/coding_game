# CODE:SHIFT — 입문 데모

One guided beginner mission: find the Mono Cafe project, prepare it in the simulated terminal, edit an HTML title and a CSS width, inspect the result, then submit and deploy through CatHub. The demo ends with the first-deployment badge.

Use the top guide for the next action. “명령어 넣기” fills the terminal; press Enter to execute. In the editor, “① HTML 제목” and “② CSS 너비” open the two places to change. Everything the player installs or runs is simulated game state.

## Source and checks

- `lib/game/engine.ts`: machine, command, Git, API and reward state.
- `lib/game/demo.ts`: current-state beginner guide.
- `lib/game/preview.ts`: script-free HTML/CSS rendering and actual layout checks.
- `lib/game/save.ts`: validated local persistence with a dedicated demo save key.
- `components/game`: connected desktop applications and the demo ending.
- `docs/spec.md`: current requested scope.
- `docs/intro-demo-verification.md`: demo verification.

```sh
npm run dev
node --experimental-strip-types --test lib/game/engine.test.ts lib/game/save.test.ts lib/game/demo.test.ts
node node_modules/typescript/bin/tsc --noEmit
npm run build
```

The earlier multi-contract engine remains in source; only the introductory mission is presented in this demo. No local LLM or full beginner-to-intermediate campaign is claimed. Hosting pushes the exact source and packages its production build. Player saves are not bundled.
