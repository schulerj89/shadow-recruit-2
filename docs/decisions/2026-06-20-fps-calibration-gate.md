# FPS Calibration Gate

Date: 2026-06-20

## Decision

Keep the strict 16.7 ms visible-browser target, but calibrate local QA against the measured browser `requestAnimationFrame` baseline when the browser itself cannot prove 60 Hz.

`npm run test:fps` now records median and p95 overhead between Shadow Recruit player-facing scenes and the blank-page browser baseline. The gate samples title, active gameplay, completion, and sentry-failure/caught states so the tester can catch menu or overlay regressions instead of relying on a single gameplay sample. The gate still passes strict 60 when the browser can prove it. When the browser baseline is slower than 16.7 ms, the gate is only allowed to return `environment-limited` if every sampled scene remains inside the configured overhead budget.

## Rationale

The v0.16.1 report showed the local headed browser baseline at roughly 55.9 FPS / 17.9 ms and the game at roughly 56.2 FPS / 17.8 ms on the performance profile. That is useful evidence that gameplay tracks the browser cadence, but it is not enough to claim strict 60 FPS.

The calibrated overhead budget prevents regressions on this machine while preserving an honest requirement: rerun on a true 60 Hz visible browser before declaring the strict 60 FPS target fully proven.

## Consequences

- A true 60 Hz browser still fails the gate if gameplay exceeds the strict frame budget.
- A sub-60 local browser can only pass as `environment-limited` when game overhead remains within budget.
- Tester reports must show both strict target status and baseline-overhead evidence for each sampled scene.
- Title, gameplay, completion, and failure/caught scenes should each have a screenshot row beside their frame-pacing data so performance evidence is tied to visible content.
