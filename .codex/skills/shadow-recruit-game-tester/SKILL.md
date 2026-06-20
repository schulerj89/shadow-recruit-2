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
- Level geometry data, rendered object bounds, and world-space coordinates for walls, doors, frames, continuity meshes, objectives, enemies, extraction, set dressing, and hero/title camera targets. If the build does not expose enough coordinate evidence to prove a claim, mark the test evidence incomplete instead of passing from screenshots alone.
- A sorted wall-run interval ledger for every wall line interrupted by doors. The ledger must include walls, door openings, frame bounds, continuity/back-wall bounds, interval min/max edges, door-to-door spans, and unowned spans between adjacent intervals.
- A screenshot-to-coordinate ledger for every visual complaint. Each row must name the screenshot, visible issue, runtime object IDs, authored IDs, min/max edges, gap/overlap width, and open/closed state.
- Asset-quality diagnostics covering floor/wall meshes, generated-image texture quality, wall-door seams and gaps, door-over-wall visual priority, objective models, sentries, door panels, extraction marker, and hero placement.
- Per-zone or whole-level density diagnostics with floor area, cover/blocker footprint, set-dressing footprint, landmark/interactable counts, repeated-material exposure, and sparse coordinate regions.
- Frame pacing metrics for gameplay changes.
- Any console/page errors.

## Review Lens

Report in this order:

- **P0 blockers:** crashes, blank canvas, impossible progression, missing required asset, broken start/tutorial/complete flow.
- **P1 readability:** unclear objective, enemy, door, extraction, camera target, tutorial text mismatch, bad hero framing.
- **P1 coordinate/readability failures:** screenshot-visible wall gaps, door openings, floating or buried assets, or suspicious seams must be cross-checked against coordinates. Fail when door extents, wall segment endpoints, frame bounds, or continuity mesh bounds leave a positive unintentional gap beyond tolerance, even if the screenshot is ambiguous.
- **P1 wall-run failures:** fail any wall line where the sorted interval ledger shows a positive unowned span between nearby doors, adjacent wall segments, frame returns, or continuity/back-wall pieces. This includes spans between two door openings, not only gaps immediately beside one door.
- **P1 asset failures:** missing required GLB/model, invisible objective, sentry below/inside ground, unclear extraction marker, missing or corrupted door panel texture, obvious holes/gaps at wall-door seams, broken wall/floor mesh, door openings that lack wall/portal continuity when the door is open, or title hero staging that shows the back/side so strongly that the player cannot read the recruit's face, suit, or silhouette.
- **P1 instrumentation failures:** missing world bounds, missing wall-run ledgers, missing title hero facing vectors, missing screen-space hero occupancy, or missing per-zone density numbers are test failures when the screenshot raises that class of concern. Do not convert missing data into a pass.
- **P1 performance:** no visible 60 FPS path, high p95 frame time, excessive draw calls, frame spikes after loading/unlock.
- **P1 AAA environment gaps:** a large level with mostly empty floor, repeated bare walls, no readable cover/dressing/landmarks, or missing tactical props is not AAA-quality just because the level is big. Flag sparse rooms and corridors when asset density, material variation, lighting detail, and gameplay dressing do not support the infiltration fantasy.
- **P2 polish:** bland, flat, stretched, blurry, repetitive, procedural-only, or non-AAA wall/floor/object textures; wall/floor materials that are not generated image textures attached to the relevant mesh; weak composition, UI fit issues, repeated text, music mismatch, low-impact feedback.

Separate "test failed" from "game feels unclear." A passing smoke test can still produce a P1 tester finding.

## Artifact Workflow

1. Prefer the end-to-end play command when the user asks for a game tester pass:

```powershell
npm run tester:play
```

This starts a local Vite server unless `TESTER_URL` is provided, drives the game through browser smoke, scripted browser playthrough, screenshots, FPS metrics, and `tester:report`, then stops the server.

2. If a server is already running or a narrow rerun is needed, run or inspect:

```powershell
npm run test:playthrough
npm run test:browser
npm run test:fps
npm run screenshots
npm run tester:report
```

3. Inspect screenshots together with metrics. Do not rely on logs alone.
4. Inspect coordinates together with screenshots. For wall/door issues, load the level geometry JSON and debug bounds, compute min/max edges from center/size, and name the exact IDs and edge deltas in the report.
5. Update or produce `docs/qa/<date>/v<version>/game-tester-report.md`.
6. Route fixes:
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
- For multiple doors or wall pieces on the same line, sort all wall, frame, continuity, and door intervals along the interrupted axis. Check every adjacent interval pair, including the space between two nearby door openings, and fail positive unowned spans that should be covered by wall, frame, return, or continuity geometry. The report must include the sorted interval ledger, not only the failing gap.
- Treat local door checks and wall-run checks as different approvals: a door can pass its immediate left/right neighbors while the wall run still fails because the span between two doors or between two wall fragments is unowned.
- Treat "wall gap by door" screenshots as unverified until the report names the door ID, wall IDs, edge values, gap width, and whether the open/closed door state changes the visible priority.
- If runtime debug state lacks per-object world bounds for doors, walls, frames, continuity meshes, or wall-run interval ledgers, file a P1 instrumentation gap. A tester cannot approve wall continuity without coordinate evidence.

## Wall-Run Coordinate Ledger

Use this stricter ledger when a screenshot shows gaps between doors or between wall pieces:

- Group intervals by physical wall line, not by door. A wall line is the same axis, same centerline within epsilon, compatible thickness/depth, and matching room/corridor boundary.
- Include every interval that visually owns that line: wall segments, door closed surfaces, door open surfaces when they slide across the line, frame jambs, frame headers/returns, continuity/back-wall surfaces, trim, and intentional portal backing.
- Sort intervals along the interrupted axis and compute `next.min - current.max`. Any positive span must be named and owned by an authored surface. If the span is between two door openings, it still fails unless a wall, return, frame, or continuity mesh covers it.
- Check depth as well as length. A wall can touch along X but still leave a visible Z-depth gap near the door face, floor, header, or jamb.
- Record both states when doors animate: `closed` should present a believable door surface, and `open` should not reveal an unowned hole behind or between the doors. The report should say which surface wins visual priority in each state.
- Require a better debug overlay or camera angle when screenshot evidence and coordinates disagree. Use the coordinates as the source of truth for continuity, then capture the screenshot needed to make the defect visible to humans.

## Screenshot And Coordinate Fusion Gate

Never let visual review and coordinate review run as separate approvals:

- When a screenshot suggests a gap, overlap, buried asset, floating asset, empty room, or title-camera mistake, the report must pair the screenshot name with the matching runtime object IDs and min/max coordinates.
- When coordinates show a defect that the screenshot angle hides, still fail it and request a QA screenshot from a better camera or debug overlay. A defect does not become acceptable because the default camera missed it.
- For door priority, capture or inspect both open and closed states. The tester must confirm that an open sliding door visually overrides the wall/portal surface without leaving a hole, and that the closed door does not hide missing surrounding wall geometry.
- For title screens, inspect the screenshot plus camera target, hero world position, and hero forward/rotation data when exposed. Fail if the torso/head/visor points mostly away from the camera, if the hero-to-camera facing dot is below the project readability threshold, or if the camera is so distant that the recruit identity is unreadable.
- For title hero visibility, require screen-space evidence. The report should include hero projected bounds or occupancy percentage, camera distance, facing dot/yaw-to-camera, and whether the face/visor/chest silhouette are readable. If the hero is turned away or too small, fail the title composition even when the menu UI works.

## AAA Level-Density QA

Judge large levels by production detail, not only size:

- Report empty-space ratio by room or corridor when broad areas contain only floor texture and walls with no cover, terminals, vents, signage, pipes, crates, lighting fixtures, cables, security props, patrol landmarks, or extraction staging.
- Require tactical readability: each zone should have landmarks, cover language, objective dressing, enemy patrol context, and lighting/material variation that helps the player orient.
- Distinguish blockout from finished art. A blockout can pass geometry, but it must fail AAA art/readability if it lacks set dressing, varied materials, generated/GLB props, and believable functional detail.
- For every asset-density finding, name the screenshot plus the sparse coordinate area or room IDs so the level creator and asset builder can act on it.
- Treat a "large" level as suspicious until density is measured. Require per-zone or whole-level data for floor area, blocker/cover footprint, set-dressing footprint, landmark count, interactable count, and repeated-material exposure. If the runtime lacks those metrics, file a P1 instrumentation gap.
- Fail AAA readiness when the dominant player view is empty floor and repeated walls, even if generated textures are attached. Generated images improve materials, but they do not replace terminals, machinery, cover, decals, lights, cables, props, patrol context, or extraction staging.
- Do not collapse the density review into a single flattering sentence. Record a scorecard for each sparse room/corridor or for the whole level when per-zone data is unavailable, and mark missing per-zone instrumentation as a follow-up finding.
- Grade density by what the player can read from the active camera. A large room should not pass because props exist off-screen or at the edges; the screenshot and coordinates must show useful foreground, midground, and background detail.
- Use a simple scorecard when no project threshold exists: `0` empty blockout, `1` texture-only, `2` sparse props, `3` functional cover/landmarks, `4` strong tactical dressing/material variation, `5` AAA-ready scene with layered silhouettes, lighting, interactables, and narrative detail. Scores below `4` are not AAA-ready.

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
- Wall-run interval QA: sorted interval ledger per interrupted wall line, adjacent interval gaps, door-to-door spans, and whether every positive span is owned by a wall, frame, return, continuity mesh, or door surface.
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
