# Level Source Of Truth Decision

Date: 2026-06-20

## Decision

Use JSON blockout files under `data/levels/` as the canonical source for level geometry and placement data. Runtime `LevelDefinition` modules adapt that validated JSON into game-ready objects and add gameplay or presentation metadata such as labels, objective radii, unlock rules, enemy behavior, and tutorial copy.

## Rules

- Validate JSON geometry before route and playthrough validation.
- Consume levels through `src/game/levels/index.ts`, not direct imports of concrete level files.
- Keep bounds, walls, blockers, doors, spawns, objective positions, extraction positions, and heights in the JSON blockout when they affect geometry.
- Keep generated art and decorative GLB meshes out of the gameplay collision source of truth.
- Add future levels by registering another adapted `LevelDefinition` in the level registry.

## Rationale

Large levels will drift if the validator proves one data file while the runtime uses duplicated TypeScript coordinates. This contract keeps geometry validation, scripted playthroughs, browser smoke, and runtime level construction on the same coordinate source without changing the existing Level 1 content.
