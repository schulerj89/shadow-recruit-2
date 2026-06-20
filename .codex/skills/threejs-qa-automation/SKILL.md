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
- Assert screenshot-to-camera-probe data for suspect gaps and holes. Door and wall captures should expose a small set of active-camera rays, projected rectangles, or depth probes through the suspect screen region, with expected owner object, actual first hit, hit distance, and whether the ray reaches background or an unrelated far surface.
- Assert wall-line connection graphs for interrupted wall runs. Smoke should fail when two adjacent doors have valid local seams but the graph still contains a `void`, unowned span, or missing open-door priority owner between them.
- Assert inter-door wall-span ownership for adjacent door openings on the same physical wall line. Automation should compute or read `previousDoor.max`, `nextDoor.min`, the between-door span width, the named owner interval, depth match, projected coverage, and open/closed visual priority; a door-local seam pass is not enough.
- Assert screenshot-to-wall-line lookup for any door or wall screenshot used in QA. The artifact should identify the suspect screenshot region, nearest door pair, wall-line ID, expected owner surface, projected owner rectangle, camera first hit, and whether the visible pixels are blocked by the intended wall, return, trim, frame, continuity mesh, or door surface.
- Assert pixel-to-world traces for defect-prone screenshots. Automation should store the screenshot pixel or normalized region, NDC sample point, active camera pose, ray direction or projected bounds, closest hit object, expected object, runtime/authored IDs, and the matching wall-line or density-zone ID.
- Assert gameplay-camera readability data for primary gameplay captures: camera distance, camera target, player projected bounds, screen-height ratio, and screen occupancy. Fail when the normal player camera reads as a distant tactical overview instead of a playable character view.
- Assert title hero identity data, not only title menu state. The build should expose camera-relative facing, yaw-to-camera or facing dot, projected head/visor/chest/body bounds, screen occupancy, UI occlusion, and whether the hero is front/three-quarter readable from the first title screenshot.
- Assert runtime asset provenance and quality categories for visible gameplay cover/blockers. Smoke should fail when a required cover/blocker visual is a primitive fallback, missing GLB, unloaded generated asset, buried mesh, or mismatched to its authored collision proxy.
- Assert active-camera negative-space metrics for primary gameplay captures. The build should expose near/mid/far empty floor/wall exposure separately from prop counts so automation can fail a large but visually bare room.
- Assert active-camera AAA density, not only whole-level density. Primary gameplay screenshots should fail when near, mid, or far camera bands are dominated by empty floor, repeated walls, or off-screen props, even when aggregate level counts look acceptable.
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
- Pair wall-gap screenshots with first-hit or depth-probe evidence. QA should prove what the camera sees through the suspect pixels, not only that authored boxes exist somewhere near the opening.
- Pair every visible "gap between doors" screenshot with an inter-door span row. The row must name the adjacent door IDs, shared wall-line ID, span min/max, owner surface, depth match, projected coverage, first hit, and door state.
- Pair every visible "wallop" or wall/door oddity with a screenshot-region resolver. Use fixed sample points in the visible region, convert to NDC, run camera probes or projected-owner coverage, and fail the smoke if the first hit is not the intended wall, frame, trim, return, continuity mesh, or door-priority surface.
- Pair title screenshots with projected hero body regions. QA should prove the face/visor/chest silhouette is visible, facing the camera enough to read, and not hidden behind title/menu UI.
- Pair title screenshots with a negative assertion too: automation should fail when the hero is back-facing, side-facing without a face/visor/chest read, looking away from the camera language of the shot, or too small for identity inspection.
- Pair title screenshots with root-facing and identity-anchor evidence. If the model exposes head, chest, visor, or look-at anchors, capture their projected positions and occlusion status; if not, record that missing instrumentation as a follow-up instead of treating root yaw as enough.
- Pair active gameplay screenshots with a production-detail matrix. The artifact should record near/mid/far band scores, negative-space ratio, visible category counts, sparse zone coordinates, and whether the band includes route, objective, patrol, or extraction context.
- Add targeted debug-overlay captures when the normal camera cannot make a coordinate defect visible. The overlay should make bounds, intervals, floor-contact planes, and sparse zones readable without replacing the normal gameplay screenshot.
- Treat screenshot review and numeric QA as one artifact. A visual complaint must link to object IDs, world bounds, projected screen bounds, density-zone metrics, or FPS scene rows; otherwise the automation should fail as missing instrumentation instead of passing by opinion.
- Treat visible level density as a camera-space assertion. A global level-density pass cannot override a gameplay screenshot whose near or mid band is mostly empty floor/walls, lacks silhouettes, or only contains props outside the readable player route.
- Treat large-level QA as suspicious until the active camera proves production value. A pass requires visible foreground, midground, and background function in the captured player view, plus coordinates that identify the sparse or dressed zone.
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
