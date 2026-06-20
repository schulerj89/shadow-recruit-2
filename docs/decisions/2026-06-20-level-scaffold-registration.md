# Level Scaffold Registration

Date: 2026-06-20

## Context

The mission selector added in v0.14.0 exposes registered levels, but `scripts/scaffold-level.mjs` still required a level creator to manually edit `src/game/levels/index.ts`. That manual registry step is easy to forget and slows iteration on future big levels.

## Decision

Keep static TypeScript level imports for Vite and type checking, but make the registry generated from level adapter files. `npm run level:registry` scans `src/game/levels/*.ts`, parses adapters that import `data/levels/*.geometry.json` and export a `LevelDefinition`, then rewrites `src/game/levels/index.ts` with explicit static imports.

The scaffold keeps an opt-in `--register` flag. When passed, it writes the geometry file, adapter module, and generated registry content together by reusing the same registry generator logic.

The flag is opt-in so unfinished scaffolded levels do not accidentally enter the player-facing mission selector before their route, tutorial, density, and QA evidence are tuned.

## Validation

- Dry-run the scaffold with `--register` to prove the planned `src/game/levels/index.ts` update.
- Run `npm run level:registry:check` to prove the committed static registry is current.
- Run `npm run level:doctor` to prove geometry files, adapters, and the registry remain aligned.
- Run `npm run build` to prove the static import registry still type-checks.
