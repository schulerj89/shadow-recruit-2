# Architecture Decision

Date: 2026-06-19

## Decision

Start Shadow Recruit 2 with a fresh Vite/Three.js app and a data-first level model, using Shadow Circuit as a reference baseline rather than copying its monolithic `Game.ts`.

## Direction

- Keep `App.ts` as the first composition root for this playable slice.
- Keep level definitions, objectives, unlocks, doors, tutorial anchors, and validation routes authored as data.
- Expose `window.__shadowRecruitDebug` early so Playwright can assert game state directly.
- Split future modules around state machine, level runtime, door system, objective system, cinematics, UI screens, audio, and QA.

## Risks

- Large levels become hard to validate if doors and unlocks are not data-driven.
- Sliding doors can desync from collision if one system does not own both visual state and blocker state.
- Cinematics need semantic anchors, not raw mesh references.
- Asset memory will grow quickly as generated GLBs and textures enter the project.
