---
name: shadow-recruit-game-tester
description: Play, review, and report on Shadow Recruit 2 builds using browser smoke artifacts, scripted playthrough output, screenshots, FPS metrics, asset-quality diagnostics, debug-state snapshots, coordinate/bounds checks, and player-readability feedback. Use when Codex needs a game tester pass, QA artifact review, screenshot-driven feedback, playthrough validation, 60 FPS evidence review, asset grading for GLBs/meshes/generated textures/materials/placement, coordinate-aware wall/door seam validation, door-gap or wall-continuity review, door-over-wall priority checks, title hero orientation review, AAA level-density critique, or a tester report for title, tutorial, level, objective, enemy, door, extraction, and completion flows.
---

# Shadow Recruit Game Tester

## Tester Contract

Use this skill after a playable or player-visible change produces evidence. Do not approve a gameplay slice from code alone.

Required evidence:

- Browser smoke result and screenshot paths.
- Scripted playthrough output.
- Nonblank canvas proof.
- Debug-state snapshot from `window.__shadowRecruitDebug.captureTesterState()`.
- Level geometry data, rendered object bounds, and world-space coordinates for walls, doors, frames, continuity meshes, objectives, enemies, extraction, and hero camera targets. If the build does not expose enough coordinate evidence to prove a claim, mark the test evidence incomplete instead of passing from screenshots alone.
- Asset-quality diagnostics covering floor/wall meshes, generated-image texture quality, wall-door seams and gaps, door-over-wall visual priority, objective models, sentries, door panels, extraction marker, and hero placement.
- Frame pacing metrics for gameplay changes.
- Any console/page errors.

## Review Lens

Report in this order:

- **P0 blockers:** crashes, blank canvas, impossible progression, missing required asset, broken start/tutorial/complete flow.
- **P1 readability:** unclear objective, enemy, door, extraction, camera target, tutorial text mismatch, bad hero framing.
- **P1 coordinate/readability failures:** screenshot-visible wall gaps, door openings, floating or buried assets, or suspicious seams must be cross-checked against coordinates. Fail when door extents, wall segment endpoints, frame bounds, or continuity mesh bounds leave a positive unintentional gap beyond tolerance, even if the screenshot is ambiguous.
- **P1 asset failures:** missing required GLB/model, invisible objective, sentry below/inside ground, unclear extraction marker, missing or corrupted door panel texture, obvious holes/gaps at wall-door seams, broken wall/floor mesh, door openings that lack wall/portal continuity when the door is open, or title hero staging that shows the back/side so strongly that the player cannot read the recruit's face, suit, or silhouette.
- **P1 performance:** no visible 60 FPS path, high p95 frame time, excessive draw calls, frame spikes after loading/unlock.
- **P1 AAA environment gaps:** a large level with mostly empty floor, repeated bare walls, no readable cover/dressing/landmarks, or missing tactical props is not AAA-quality just because the level is big. Flag sparse rooms and corridors when asset density, material variation, lighting detail, and gameplay dressing do not support the infiltration fantasy.
- **P2 polish:** bland, flat, stretched, blurry, repetitive, procedural-only, or non-AAA wall/floor/object textures; wall/floor materials that are not generated image textures attached to the relevant mesh; weak composition, UI fit issues, repeated text, music mismatch, low-impact feedback.

Separate "test failed" from "game feels unclear." A passing smoke test can still produce a P1 tester finding.

## Artifact Workflow

1. Run or inspect:

```powershell
npm run test:playthrough
npm run test:browser
npm run test:fps
npm run screenshots
npm run tester:report
```

2. Inspect screenshots together with metrics. Do not rely on logs alone.
3. Inspect coordinates together with screenshots. For wall/door issues, load the level geometry JSON and debug bounds, compute min/max edges from center/size, and name the exact IDs and edge deltas in the report.
4. Update or produce `docs/qa/<date>/v<version>/game-tester-report.md`.
5. Route fixes:
   - Rendering/performance to `$threejs-webgpu-webgl-expert`.
   - Memory/leaks to `$threejs-memory`.
   - Gameplay state to `$threejs-gameplay-systems`.
   - Level geometry to `$threejs-level-geometry-validator`.
   - AAA prop density, GLB replacement, generated environment pieces, and art-direction upgrades to `$threejs-aaa-asset-builder`.
   - UI/focus/text fit to `$threejs-ui-accessibility`.
   - Release gates to `$shadow-recruit-release-manager`.

## Coordinate-Grounded Wall And Door QA

Use screenshots to spot defects, then use coordinates to prove them:

- Convert every authored wall, blocker, door, frame, and continuity mesh to world-space min/max bounds. For axis-aligned rectangles, use `min = center - size / 2` and `max = center + size / 2`; for rendered meshes, use `Box3.setFromObject` or equivalent debug bounds.
- For each door, identify the wall line it interrupts. The wall pieces, frame, and continuity/back-wall pieces must either touch within epsilon or intentionally overlap behind the opening so the door visually takes priority. A positive gap wider than epsilon between door edge and adjacent wall/frame/continuity bounds is a P1.
- For an `x`-axis door, compare the door's left/right X edges and near/far Z faces with neighboring wall segment endpoints, frame jambs, returns, and back-wall continuity. For a `z`-axis door, perform the same checks with X/Z swapped.
- Treat "wall gap by door" screenshots as unverified until the report names the door ID, wall IDs, edge values, gap width, and whether the open/closed door state changes the visible priority.
- If runtime debug state lacks per-object world bounds for doors, walls, frames, and continuity meshes, file a P1 instrumentation gap. A tester cannot approve wall continuity without coordinate evidence.

## AAA Level-Density QA

Judge large levels by production detail, not only size:

- Report empty-space ratio by room or corridor when broad areas contain only floor texture and walls with no cover, terminals, vents, signage, pipes, crates, lighting fixtures, cables, security props, patrol landmarks, or extraction staging.
- Require tactical readability: each zone should have landmarks, cover language, objective dressing, enemy patrol context, and lighting/material variation that helps the player orient.
- Distinguish blockout from finished art. A blockout can pass geometry, but it must fail AAA art/readability if it lacks set dressing, varied materials, generated/GLB props, and believable functional detail.
- For every asset-density finding, name the screenshot plus the sparse coordinate area or room IDs so the level creator and asset builder can act on it.

## Report Shape

```text
Summary
- Build/commit tested.
- Browser and viewport.
- Result.

Evidence
- Screenshot paths.
- Metrics JSON path.
- Playthrough output.
- Console/page errors.

Tester Feedback
- Readability blockers.
- Coordinate QA: wall-door bounds, seam/gap edge deltas, frame/continuity mesh bounds, grounded object bounds, title hero orientation, and any missing debug instrumentation.
- Asset grading: wall/floor mesh quality, generated wall/floor/object texture richness, material variation, AAA prop density, empty-space ratio, door-wall seam/gap quality, whether a wall/portal still visually exists behind an opening door, objective-model clarity, terminal/keycard/codes readability, extraction visibility, sentry grounding, door-panel texture clarity.
- Control/camera feel.
- Objective clarity.
- Threat clarity.
- Failure/retry clarity.
- Performance concerns.

Required Fixes
- P0/P1/P2 findings with reproduction steps.
```

## References

Read `references/sources.md` before changing Playwright, screenshot, metrics, or frame pacing review expectations.
