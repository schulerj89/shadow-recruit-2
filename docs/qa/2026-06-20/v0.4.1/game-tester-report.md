# Shadow Recruit 2 Game Tester Report

Build: v0.4.1
Date: 2026-06-20

## Evidence

- Smoke screenshots: `artifacts/smoke/v0.4.1`
- Browser playthrough: `docs/qa/2026-06-20/v0.4.1/playthrough-report.json` (captured)
- Committed screenshots: `docs/qa/2026-06-20/v0.4.1/screenshots`
- FPS metrics: `docs/qa/2026-06-20/v0.4.1/metrics.json`
- Metrics available: yes
- Game frame pacing: 55.9 FPS, 17.9 ms median, 17.9 ms latest, 18.1 ms p95, 240 samples
- Browser baseline: 56.5 FPS, 17.7 ms median, 18.1 ms p95, 240 samples
- FPS gate: environment-limited; profile=performance; strictTarget=false; browserCanProve60=false; tracksBaseline=true
- Renderer metrics: 12 draw calls, 184629 triangles, 24 geometries, 13 textures, profile=performance, shadows=false, shadowMap=0
- Loaded assets: 5 total (2 character, 3 static): hero:shadow-operative, sentry, codes, keycard, terminal
- Settings state: debug=false; muted=false; performance=performance

## Tester Feedback

- Title flow: verify logo, rotating level-one preview, staged hero model, hero-select preview space, Start, Change Hero, and Settings are visible.
- Tutorial: verify all five General Caldwell screenshots align with hero, keycard, terminal, sentry, and extraction targets, and the final step includes "Good luck, cadet."
- Level: verify keycard, terminal, command codes, sentries, extraction, the command-codes close-up screenshot, and all three door-focus screenshots are readable.
- Playthrough: verify the browser route uses the authored validation route, keyboard interaction, door-focus pauses, and extraction completion without sentry contact.
- Camera QA: verify the normal gameplay screenshot is captured before objective interaction, with debug teleports snapping the gameplay camera to the current player position.
- Completion: verify triumphant cue starts and level stats appear.
- Performance: game pacing matches the 56.5 FPS browser baseline, but this environment cannot prove strict 16.7 ms frame cadence.

## Required Fixes

- P0: None recorded by generated report.
- P1: Current headed browser baseline measured 56.5 FPS / 17.7 ms median and cannot prove strict 16.7 ms on the performance profile. The game tracks that baseline within tolerance, so rerun on a true 60 Hz visible browser before marking the 60 FPS gate fully proven.
- P2: Manual screenshot review remains recommended for player readability and hero framing after imported GLB scale changes.
- P2: Expand tester notes after the first human play session.
