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
- Assert frame pacing or an explicit performance profile for gameplay scenes.
- Exercise reset/retry/load transitions for any feature that allocates resources.
- Use headed visible-browser runs for frame pacing when needed; use headless for deterministic functional smoke.

## Visual QA

- Capture baseline screenshots for menus, gameplay camera, debug overlay, new assets, and mobile viewport when relevant.
- Use Playwright visual comparisons when UI or layout should remain stable.
- Mask or disable volatile regions such as FPS counters, timers, random particles, or cursor hover.
- For WebGL screenshots, also check pixel histogram or nonblank ratio so black/transparent canvases fail quickly.
- Keep screenshots named by feature, viewport, and state.

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
