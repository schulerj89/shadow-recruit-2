# Source Notes

Research date: 2026-06-19.

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

Re-check Playwright docs before changing runner setup, screenshot thresholds, or trace collection.
