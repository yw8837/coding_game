# CODE:SHIFT

A Korean coding simulator with a shared virtual desktop, terminal, editor, browser/search, CatHub, API client and Ubuntu server. Release 0.1 is a playable opening chapter of three connected Mono Cafe contracts.

## Play

Open the site, accept the first contract and use COOCLE to find `mono cafe`. Read CatHub's README, then work through the current objective. Commands are simulated: no player command installs software or runs on the real computer. `help` lists the supported command set; the game documents explain setup and debugging. Progress saves in the current browser.

## Source

- `lib/game/engine.ts`: deterministic command, machine, Git, API and reward state.
- `lib/game/content.ts`: contracts, initial files and authored learning material.
- `lib/game/preview.ts`: isolated HTML/CSS rendering and layout checks.
- `lib/game/save.ts`: validated local persistence.
- `components/game`: connected desktop applications.
- `docs/spec.md`: release specification.
- `docs/verification.md`: tested behavior and explicit limitations.

## Development

Use the provided dependency setup and framework commands:

```sh
npm run install:ci
npm run dev
node --experimental-strip-types --test lib/game/engine.test.ts lib/game/save.test.ts
node node_modules/typescript/bin/tsc --noEmit
npm run build
```

Production publication is managed by the Sites workflow, which pushes the exact source commit and packages its build output. Player saves are not bundled with the game.

## Scope

Main-only Git flow, HTML/CSS, a bounded JavaScript arithmetic evaluator, and a documented Python API template. The NPC provides authored contextual hints. A real local LLM tutor and the full beginner-to-upper-intermediate curriculum are future development work.
