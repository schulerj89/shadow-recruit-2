---
name: threejs-qa-automation
description: Design and maintain automated QA for Three.js browser games, including Playwright smoke tests, screenshot and visual regression, canvas-pixel checks, 60 FPS/frame pacing gates, debug metric assertions, input simulation, accessibility snapshots, trace artifacts, and release validation. Use when Codex adds or reviews browser tests, screenshots, performance gates, CI checks, gameplay QA, or regression harnesses.
---

# Three.js QA Automation

## QA Contract

Use this skill when a feature needs repeatable proof. Three.js game QA should verify visible output, game state, debug metrics, and input flows, not only unit tests.

Default acceptance target: visible gameplay should sustain 60 FPS, which means the interactive frame budget is about 16.7 ms. If hardware, browser, or scene complexity makes that impossible, require a documented quality fallback that restores a 60 FPS path.

Every browser smoke should define:

- Target URL and viewport.
- Scene or route entry method.
- Required debug state.
- Input path.
- Visual assertion.
- Metric assertion.
- Artifact path for failure review.

## Performance Gate

- Capture frame pacing from an app-owned debug API, not only an on-screen FPS counter.
- Assert a visible-browser 60 FPS path for gameplay scenes before release.
- Use `requestAnimationFrame` deltas, renderer counters, and app-owned metrics such as active actors, physics bodies, lights, effects, draw calls, triangles, geometries, textures, loaded assets, and queued jobs.
- Treat headless FPS as a regression signal, not the final proof of feel.
- Keep performance tests free of Playwright video and always-on trace capture unless diagnosing a failure, because those artifacts can distort timing.
- Fail the gate when a feature depends on cinematic quality settings without a lower-cost profile.

## Browser Smoke Rules

- Start from a known state: cleared storage or explicit save fixture.
- Wait for app readiness through a debug hook, not arbitrary sleeps.
- Assert canvas is nonblank before relying on screenshots.
- Assert scene state through exposed debug APIs: phase, level, player position, enemies, assets, errors, renderer metrics.
- Assert coordinate-backed QA state through exposed debug APIs when screenshots cover walls, doors, title hero staging, object grounding, or level density. The captured state should include stable object IDs, world-space bounds, wall-run interval ledgers, door open/closed priority surfaces, title camera/hero facing metrics, projected hero bounds, and per-zone density data.
- Assert screenshot-to-coordinate fusion data for defect-prone captures. Door screenshots should include door-to-door wall ownership tables, title screenshots should include hero facing/projection and UI occlusion metrics, and gameplay screenshots should include near/mid/far density-band metrics for the active camera.
- Assert gameplay-camera readability data for primary gameplay captures: camera distance, camera target, player projected bounds, screen-height ratio, and screen occupancy. Fail when the normal player camera reads as a distant tactical overview instead of a playable character view.
- Assert runtime asset provenance and quality categories for visible gameplay cover/blockers. Smoke should fail when a required cover/blocker visual is a primitive fallback, missing GLB, unloaded generated asset, buried mesh, or mismatched to its authored collision proxy.
- Assert frame pacing or an explicit performance profile for gameplay scenes. For player-facing releases, capture a multi-scene FPS matrix for title, active gameplay, completion, and failure/caught states rather than relying on one gameplay sample.
- Exercise reset/retry/load transitions for any feature that allocates resources.
- Use headed visible-browser runs for frame pacing when needed; use headless for deterministic functional smoke.

## Visual QA

- Capture baseline screenshots for menus, gameplay camera, debug overlay, new assets, and mobile viewport when relevant.
- Use Playwright visual comparisons when UI or layout should remain stable.
- Mask or disable volatile regions such as FPS counters, timers, random particles, or cursor hover.
- For WebGL screenshots, also check pixel histogram or nonblank ratio so black/transparent canvases fail quickly.
- Keep screenshots named by feature, viewport, and state.
- Pair defect-prone screenshots with JSON evidence. Door-focus captures should include the matching wall-run ledger; title captures should include hero facing and projection metrics; gameplay density captures should include zone IDs, footprint counts, and sparse-region coordinates.
- Pair primary gameplay screenshots with density-band evidence. A screenshot with empty near/mid/far space should fail even if global density metrics pass, because the player judges AAA detail from the active camera view.
- Pair primary gameplay screenshots with camera-framing evidence. The screenshot artifact should have matching JSON or debug-state data proving the player model is close enough to read and that nearby walls, floor texture, cover, objectives, and sentries can be inspected.
- Pair wall-gap screenshots with projected bounds or debug overlays when possible. QA should prove whether wall, door, frame, return, trim, or continuity objects actually own the visible space between doors instead of relying on pixel impressions alone.
- Pair title screenshots with projected hero body regions. QA should prove the face/visor/chest silhouette is visible, facing the camera enough to read, and not hidden behind title/menu UI.
- Add targeted debug-overlay captures when the normal camera cannot make a coordinate defect visible. The overlay should make bounds, intervals, floor-contact planes, and sparse zones readable without replacing the normal gameplay screenshot.
- Treat screenshot review and numeric QA as one artifact. A visual complaint must link to object IDs, world bounds, projected screen bounds, density-zone metrics, or FPS scene rows; otherwise the automation should fail as missing instrumentation instead of passing by opinion.
- Include scene-state screenshots beside FPS matrix rows. A title FPS row should point to a title screenshot, a gameplay row to the active camera, a completion row to the complete panel, and a caught row to the operation-failed state so performance issues can be tied to visible content.

## Accessibility And Input QA

- Use keyboard-only path checks for menus and modals.
- Capture ARIA snapshots for semantic UI surfaces when Playwright test runner is available.
- Simulate touch/mobile viewport for on-screen controls.
- Test active input prompt switching when keyboard/gamepad/touch support changes.

## Handoffs

- Route UI semantics to `$threejs-ui-accessibility`.
- Route renderer/performance metrics to `$threejs-webgpu-webgl-expert`.
- Route memory/reset leak checks to `$threejs-memory`.
- Route release gates to `$shadow-recruit-release-manager`.

## References

Read `references/sources.md` before changing Playwright, screenshots, traces, or accessibility snapshot workflows.
