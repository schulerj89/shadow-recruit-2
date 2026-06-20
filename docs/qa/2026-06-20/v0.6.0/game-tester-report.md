# Shadow Recruit 2 Game Tester Report

Build: v0.6.0
Date: 2026-06-20

## Evidence

- Smoke screenshots: `artifacts/smoke/v0.6.0`
- Browser playthrough: `docs/qa/2026-06-20/v0.6.0/playthrough-report.json` (captured)
- Committed screenshots: `docs/qa/2026-06-20/v0.6.0/screenshots`
- FPS metrics: `docs/qa/2026-06-20/v0.6.0/metrics.json`
- Metrics available: yes
- Game frame pacing: 56.2 FPS, 17.8 ms median, 17.9 ms latest, 18.2 ms p95, 240 samples
- Browser baseline: 55.9 FPS, 17.9 ms median, 18.2 ms p95, 240 samples
- FPS gate: environment-limited; profile=performance; strictTarget=false; browserCanProve60=false; tracksBaseline=true
- Renderer metrics: 12 draw calls, 184629 triangles, 24 geometries, 13 textures, profile=performance, shadows=false, shadowMap=0
- Loaded assets: 5 total (2 character, 3 static): hero:shadow-operative, sentry, codes, keycard, terminal
- Asset grades: 6 pass, 2 review, 3 fail
- Settings state: debug=false; muted=false; performance=performance

## Asset Grading

- REVIEW level-mesh/level-floor: Floor mesh; visible=true; grounded=true. pos=(0,0,0); y=0..0; h=0; xz=84x72 Floor mesh covers the authored level bounds. Floor uses runtime mesh/material; schedule an art pass if it should become a textured kit asset.
- REVIEW level-mesh/level-walls: Wall meshes; visible=true; grounded=true. 12 wall meshes are present as readable blockout geometry; replace with authored wall/floor kit assets when art direction is ready.
- PASS door/sliding-doors: Sliding door panels; visible=true; grounded=true. 3 sliding door assemblies are present and use the generated door-panel texture.
- PASS objective/access-keycard: Recover the lobby keycard; visible=true; grounded=true. pos=(-31,0,-25); y=0..0.9; h=0.9; xz=1.49x0.02 keycard GLB is visible, grounded, and available for interaction.
- PASS objective/security-terminal: Hack the security terminal; visible=true; grounded=true. pos=(30,0,-3); y=0..1.55; h=1.55; xz=1.16x2.45 terminal GLB is visible, grounded, and available for interaction.
- PASS objective/command-codes: Copy the command codes; visible=true; grounded=true. pos=(-32,0,14); y=0..1; h=1; xz=1.81x1.28 codes GLB is visible, grounded, and available for interaction.
- FAIL enemy/sentry-lobby: Lobby sentry; visible=true; grounded=false. pos=(5.83,0,-24.15); y=-1.96..2.01; h=3.97; xz=1.58x3.9 Lobby sentry placement needs review: originY=0.00, minY=-1.96, maxY=2.01.
- FAIL enemy/sentry-server: Server sentry; visible=true; grounded=false. pos=(26.99,0,14.08); y=-1.92..1.97; h=3.89; xz=1.75x3.74 Server sentry placement needs review: originY=0.00, minY=-1.92, maxY=1.97.
- FAIL enemy/sentry-command: Command sentry; visible=true; grounded=false. pos=(-4.28,0,25); y=-1.88..1.93; h=3.81; xz=1.46x3.75 Command sentry placement needs review: originY=0.00, minY=-1.88, maxY=1.93.
- PASS hero/hero: Playable hero; visible=true; grounded=true. pos=(0,0,-29); y=0..1.45; h=1.45; xz=1.17x0.79 Hero GLB is visible and grounded at the current player position.
- PASS extraction/extraction: Extraction point; visible=true; grounded=true. pos=(0,0.08,33); y=0..0.16; h=0.15; xz=4.96x4.96 Extraction marker is visible and readable as the level-completion target.

## Tester Feedback

- Title flow: verify logo, rotating level-one preview, staged hero model, hero-select preview space, Start, Change Hero, and Settings are visible.
- Tutorial: verify all five General Caldwell screenshots align with hero, keycard, terminal, sentry, and extraction targets, and the final step includes "Good luck, cadet."
- Level: verify keycard, terminal, command codes, sentries, extraction, wall/floor meshes, and all three door-focus screenshots are readable and properly grounded.
- Playthrough: verify the browser route uses the authored validation route, keyboard interaction, door-focus pauses, and extraction completion without sentry contact.
- Camera QA: verify the normal gameplay screenshot is captured before objective interaction, with debug teleports snapping the gameplay camera to the current player position.
- Asset QA: verify objective GLBs, sentry GLBs, floor/wall meshes, door panels, and extraction marker pass or have explicit review notes.
- Completion: verify triumphant cue starts and level stats appear.
- Performance: game pacing matches the 55.9 FPS browser baseline, but this environment cannot prove strict 16.7 ms frame cadence.

## Required Fixes

- P0: None recorded by generated report.
- P1: Current headed browser baseline measured 55.9 FPS / 17.9 ms median and cannot prove strict 16.7 ms on the performance profile. The game tracks that baseline within tolerance, so rerun on a true 60 Hz visible browser before marking the 60 FPS gate fully proven.
- P1: Asset sentry-lobby failed grading: Lobby sentry placement needs review: originY=0.00, minY=-1.96, maxY=2.01.
- P1: Asset sentry-server failed grading: Server sentry placement needs review: originY=0.00, minY=-1.92, maxY=1.97.
- P1: Asset sentry-command failed grading: Command sentry placement needs review: originY=0.00, minY=-1.88, maxY=1.93.
- P2: Asset level-floor needs art/readability review: Floor mesh covers the authored level bounds. Floor uses runtime mesh/material; schedule an art pass if it should become a textured kit asset.
- P2: Asset level-walls needs art/readability review: 12 wall meshes are present as readable blockout geometry; replace with authored wall/floor kit assets when art direction is ready.
- P2: Manual screenshot review remains recommended for player readability and hero framing after imported GLB scale changes.
- P2: Expand tester notes after the first human play session.
