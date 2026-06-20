# Source Notes

Research date: 2026-06-20.

- Playwright screenshots: https://playwright.dev/docs/screenshots
  - Page and element screenshots support stable visual artifacts for smoke and manual review.
- Playwright visual comparisons: https://playwright.dev/docs/test-snapshots
  - Screenshot comparisons are useful when UI or camera framing should stay stable.
- Playwright best practices: https://playwright.dev/docs/best-practices
  - Tests should use resilient locators and collect traces only when useful for diagnosis.
- MDN `requestAnimationFrame`: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
  - Animation callbacks generally match display refresh rate; 60 Hz is common.
- web.dev smoothness: https://web.dev/articles/smoothness
  - Frame rate is useful but incomplete; evaluate visible smoothness and frame timing, not only averages.
- Three.js Box3: https://threejs.org/docs/pages/Box3.html
  - Box3 supports object-derived world bounds for rendered meshes; use it to validate object placement and broad-phase continuity before computing exact edge gaps.
- Three.js Object3D: https://threejs.org/docs/pages/Object3D.html
  - Object3D world transforms and world-position helpers support stable runtime IDs, world-space placement, and camera-relative hero/object checks.
- Three.js Raycaster: https://threejs.org/docs/pages/Raycaster.html
  - Raycaster supports active-camera picking/probes through screen regions, which helps prove whether a visible wall or door gap is actually blocked by the intended object.
- Three.js Vector3 projection: https://threejs.org/docs/pages/Vector3.html
  - Vector3 projection turns world-space hero or object points into camera/NDC space, which supports title hero screen-occupancy and screenshot-to-coordinate checks.
- Three.js Box2: https://threejs.org/docs/pages/Box2.html
  - Box2 covers 2D axis-aligned bounds on the gameplay plane and is useful for wall/door min/max checks.
- Khronos glTF 2.0 materials: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#materials
  - glTF material and texture bindings are the source of truth for whether a wall, floor, prop, or objective is using image-backed PBR material data instead of flat placeholder color.
- Unity Cinemachine Position Composer: https://docs.unity3d.com/Packages/com.unity.cinemachine@3.1/manual/CinemachinePositionComposer.html
  - Shot composition should reason about target screen position, dead/soft zones, and framing, not just camera existence.
- Unreal Engine Level Design Content Examples: https://dev.epicgames.com/documentation/unreal-engine/level-design-content-examples
  - Level presentation moves through prototype, meshing, lighting, and polish; a large blockout is not finished AAA environment work.

Re-check these sources before changing tester report gates, screenshot expectations, coordinate/bounds checks, title framing expectations, AAA level-density expectations, or FPS thresholds.
