# Source Notes

Research date: 2026-06-19.

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

Re-check these sources before changing tester report gates, screenshot expectations, or FPS thresholds.
