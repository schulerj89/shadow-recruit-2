---
name: shadow-recruit-game-tester
description: Play, review, and report on Shadow Recruit 2 builds using browser smoke artifacts, scripted playthrough output, screenshots, FPS metrics, asset-quality diagnostics, debug-state snapshots, and player-readability feedback. Use when Codex needs a game tester pass, QA artifact review, screenshot-driven feedback, playthrough validation, 60 FPS evidence review, asset grading for GLBs/meshes/textures/materials/placement, wall/floor blandness, door seam or wall-gap review, or a tester report for title, tutorial, level, objective, enemy, door, extraction, and completion flows.
---

# Shadow Recruit Game Tester

## Tester Contract

Use this skill after a playable or player-visible change produces evidence. Do not approve a gameplay slice from code alone.

Required evidence:

- Browser smoke result and screenshot paths.
- Scripted playthrough output.
- Nonblank canvas proof.
- Debug-state snapshot from `window.__shadowRecruitDebug.captureTesterState()`.
- Asset-quality diagnostics covering floor/wall meshes, texture/material quality, wall-door seams and gaps, objective models, sentries, door panels, extraction marker, and hero placement.
- Frame pacing metrics for gameplay changes.
- Any console/page errors.

## Review Lens

Report in this order:

- **P0 blockers:** crashes, blank canvas, impossible progression, missing required asset, broken start/tutorial/complete flow.
- **P1 readability:** unclear objective, enemy, door, extraction, camera target, tutorial text mismatch, bad hero framing.
- **P1 asset failures:** missing required GLB/model, invisible objective, sentry below/inside ground, unclear extraction marker, missing or corrupted door panel texture, obvious holes/gaps at wall-door seams, broken wall/floor mesh.
- **P1 performance:** no visible 60 FPS path, high p95 frame time, excessive draw calls, frame spikes after loading/unlock.
- **P2 polish:** bland, flat, stretched, blurry, or repetitive wall/floor/object textures; simple blockout walls/floors that need authored materials or trim; weak composition, UI fit issues, repeated text, music mismatch, low-impact feedback.

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
3. Update or produce `docs/qa/<date>/v<version>/game-tester-report.md`.
4. Route fixes:
   - Rendering/performance to `$threejs-webgpu-webgl-expert`.
   - Memory/leaks to `$threejs-memory`.
   - Gameplay state to `$threejs-gameplay-systems`.
   - Level geometry to `$threejs-level-geometry-validator`.
   - UI/focus/text fit to `$threejs-ui-accessibility`.
   - Release gates to `$shadow-recruit-release-manager`.

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
- Asset grading: wall/floor mesh quality, wall/floor/object texture richness, material variation, door-wall seam/gap quality, objective-model clarity, terminal/keycard/codes readability, extraction visibility, sentry grounding, door-panel texture clarity.
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
