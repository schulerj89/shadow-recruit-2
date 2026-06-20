# Source Notes

Research date: 2026-06-20.

- Playwright visual comparisons: https://playwright.dev/docs/test-snapshots
  - `expect(page).toHaveScreenshot()` can create and compare screenshot baselines.
- Playwright screenshots: https://playwright.dev/docs/screenshots
  - `page.screenshot()` captures page or clipped screenshots and supports output options.
- Playwright PageAssertions: https://playwright.dev/docs/api/class-pageassertions
  - Screenshot assertions wait for two consecutive matching screenshots before comparing to expectations.
- Playwright ARIA snapshots: https://playwright.dev/docs/aria-snapshots
  - ARIA snapshots capture a YAML representation of the accessibility tree.
- Playwright trace viewer: https://playwright.dev/docs/trace-viewer
  - Trace viewer helps inspect actions, DOM snapshots, network, attachments, and visual diffs.
- Playwright best practices: https://playwright.dev/docs/best-practices
  - Traces are useful for CI failure diagnosis.
- MDN `requestAnimationFrame`: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
  - The callback cadence generally matches display refresh rate, with 60 Hz described as the most common refresh rate.
- web.dev animation smoothness: https://web.dev/articles/smoothness
  - FPS is useful but incomplete; smoothness work should consider frame updates and perceived quality, not only a single average number.
- Three.js Box3: https://threejs.org/docs/pages/Box3.html
  - Object-derived world bounds support runtime QA for rendered wall, door, prop, hero, and sentry placement.
- Three.js Object3D: https://threejs.org/docs/pages/Object3D.html
  - Object world transforms and world-position helpers support stable debug-state coordinates for hero, props, walls, doors, and camera-facing checks.
- Three.js Raycaster: https://threejs.org/docs/pages/Raycaster.html
  - Raycaster supports screenshot-region camera probes and debug picking so visual gaps can be linked to first-hit objects instead of only AABB proximity.
- Three.js Vector3 projection: https://threejs.org/docs/pages/Vector3.html
  - `Vector3.project(camera)` converts world-space points into camera/NDC space, which supports screenshot-to-coordinate fusion, title hero occupancy, and UI-occlusion checks.
- Khronos glTF 2.0 materials: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#materials
  - Material texture slots and PBR factors are useful QA evidence for proving wall, floor, and prop materials are image-backed production assets rather than flat blockout colors.

Re-check Playwright and Three.js docs before changing runner setup, screenshot thresholds, trace collection, coordinate projection, or bounds instrumentation.
