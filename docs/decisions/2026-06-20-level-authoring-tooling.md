# Level Authoring Tooling Decision

Date: 2026-06-20

## Decision

Add first-class level authoring commands so future Shadow Recruit missions start from validated coordinate data instead of copied runtime code.

## Commands

- `npm run level:scaffold -- -- <level-slug> --name "Mission Name" --chapter "Operation Name"` creates a large mission geometry JSON file and a matching TypeScript adapter stub.
- `npm run level:doctor` checks that every `data/levels/*.geometry.json` file has a TypeScript adapter, every adapter imports an existing geometry file, every adapter is imported by `src/game/levels/index.ts`, every imported level is present in the exported `levels` array, and every geometry file passes the math validator.
- `npm run verify` runs the doctor before geometry, route, build, and browser smoke validation.

## Rules

- Keep bounds, walls, blockers, set dressing, doors, spawns, objectives, extraction, and route-critical coordinates in JSON first.
- Split wall segments around every door opening; never hide a door inside a continuous wall.
- Keep GLB art as dressing or objective assets, not as collision truth.
- Register a scaffolded level only after its geometry validator and scripted route pass.
- Treat doctor failures as release blockers because they indicate a level file, adapter, registry entry, or validator gate has drifted.

## Rationale

The game needs larger levels without losing the coordinate QA that catches wall gaps, bad door openings, sparse layout, and impossible routes. A scaffold gives designers a known-good starting shape, while the doctor keeps the registry and validation pipeline honest as more missions are added.
