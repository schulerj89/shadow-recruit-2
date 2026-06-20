# Shadow Recruit 2 Game Tester Report

Build: v0.7.5
Date: 2026-06-20

## Evidence

- Smoke screenshots: `artifacts/smoke/v0.7.5`
- Browser playthrough: `docs/qa/2026-06-20/v0.7.5/playthrough-report.json` (captured)
- Committed screenshots: `docs/qa/2026-06-20/v0.7.5/screenshots`
- FPS metrics: `docs/qa/2026-06-20/v0.7.5/metrics.json`
- Screenshot coverage: 14/14 expected captures present (13491.3 KB)
- Metrics available: yes
- Game frame pacing: 55.6 FPS, 18.0 ms median, 18.2 ms latest, 18.1 ms p95, 240 samples
- Browser baseline: 55.6 FPS, 18.0 ms median, 18.1 ms p95, 240 samples
- FPS gate: environment-limited; profile=performance; strictTarget=false; browserCanProve60=false; tracksBaseline=true
- Renderer metrics: 5 draw calls, 95999 triangles, 32 geometries, 20 textures, profile=performance, shadows=false, shadowMap=0
- Loaded assets: 5 total (2 character, 3 static): hero:shadow-operative, sentry, codes, keycard, terminal
- Asset grades: 12 pass, 0 review, 0 fail
- Geometry diagnostics: 35 object bounds; 3 door checks; levelDensity=fail (4.0%)
- Completion stats: active=true; objectives=3/3; alerts=0; cue=triumphant; elapsed=33s
- Settings state: debug=false; muted=false; performance=performance

## Coordinate QA

- FAIL door/lobby-door: axis=x; walls=lobby-divider-west, lobby-divider-east; opening=x=-3..3, y=0..3.3, z=-18.4..-17.6; frame=x=-3.32..3.32, y=0..3.66, z=-18.69..-17.31; continuity=x=-3.29..3.29, y=0..3.3, z=-18.66..-17.34; Gap between previous wall and door/frame/continuity coverage lobby-divider-west->lobby-door:frame: 4.68m (x -8->-3.32); Gap between door/frame/continuity coverage and next wall lobby-door:frame->lobby-divider-east: 4.68m (x 3.32->8)
- FAIL door/server-door: axis=x; walls=server-divider-west, server-divider-east; opening=x=11..17, y=0..3.3, z=4.6..5.4; frame=x=10.68..17.32, y=0..3.66, z=4.31..5.69; continuity=x=10.71..17.29, y=0..3.3, z=4.34..5.66; Gap between previous wall and door/frame/continuity coverage server-divider-west->server-door:frame: 12.68m (x -2->10.68); Gap between door/frame/continuity coverage and next wall server-door:frame->server-divider-east: 2.68m (x 17.32->20)
- FAIL door/extraction-door: axis=x; walls=command-divider-west, command-divider-east; opening=x=-3..3, y=0..3.3, z=19.6..20.4; frame=x=-3.32..3.32, y=0..3.66, z=19.31..20.69; continuity=x=-3.29..3.29, y=0..3.3, z=19.34..20.66; Gap between previous wall and door/frame/continuity coverage command-divider-west->extraction-door:frame: 4.68m (x -8->-3.32); Gap between door/frame/continuity coverage and next wall extraction-door:frame->command-divider-east: 4.68m (x 3.32->8)
- FAIL level-density: floor=6048m2; dressing=250.02m2; ratio=4.0%; blockers=6; objectives=3; enemies=3. Set-dressing and gameplay footprints cover only 4.1% of the 6048m2 floor. Add tactical cover, security props, cables, signage, light fixtures, patrol landmarks, and extraction dressing before grading this as AAA-quality level presentation.

## Asset Grading

- PASS level-mesh/level-floor: Floor mesh; visible=true; grounded=true. pos=(0,0,0); y=0..0; h=0; xz=84x72 Floor mesh covers the authored level bounds with a generated tactical floor-panel image texture. Floor uses src/assets/generated/tactical-floor-panel.png as a repeated runtime texture.
- PASS level-mesh/level-walls: Wall meshes; visible=true; grounded=true. 12 wall meshes are present and use src/assets/generated/blacksite-wall-panel.png as the repeated generated wall texture.
- PASS door/sliding-doors: Sliding door panels; visible=true; grounded=true. 3 sliding door assemblies are present and use the generated door-panel texture.
- PASS door/door-wall-seams: Door-wall seams; visible=true; grounded=true. 3 sliding-door openings have door frames plus wall/portal continuity meshes behind the door layer, so the door panels visually take priority without reading as missing wall gaps.
- PASS objective/access-keycard: Recover the lobby keycard; visible=true; grounded=true. pos=(-31,0,-25); y=0..0.9; h=0.9; xz=1.49x0.02 keycard GLB is visible, grounded, and available for interaction.
- PASS objective/security-terminal: Hack the security terminal; visible=true; grounded=true. pos=(30,0,-3); y=0..1.55; h=1.55; xz=1.16x2.45 terminal GLB is visible, grounded, and available for interaction.
- PASS objective/command-codes: Copy the command codes; visible=true; grounded=true. pos=(-32,0,14); y=0..1; h=1; xz=1.81x1.28 codes GLB is visible, grounded, and available for interaction.
- PASS enemy/sentry-lobby: Lobby sentry; visible=true; grounded=true. pos=(5.82,0,-24.15); y=0.02..1.57; h=1.55; xz=1.58x1.58 Sentry GLB is visible above the floor and aligned to its patrol route.
- PASS enemy/sentry-server: Server sentry; visible=true; grounded=true. pos=(27.01,0,14.08); y=0.02..1.57; h=1.55; xz=1.75x1.75 Sentry GLB is visible above the floor and aligned to its patrol route.
- PASS enemy/sentry-command: Command sentry; visible=true; grounded=true. pos=(-4.27,0,25); y=0.02..1.57; h=1.55; xz=1.46x1.46 Sentry GLB is visible above the floor and aligned to its patrol route.
- PASS hero/hero: Playable hero; visible=true; grounded=true. pos=(0,0,-29); y=0.02..1.47; h=1.45; xz=1.17x0.79 Hero GLB is visible and grounded at the current player position.
- PASS extraction/extraction: Extraction point; visible=true; grounded=true. pos=(0,0.08,33); y=0..0.16; h=0.15; xz=4.96x4.96 Extraction marker is visible and readable as the level-completion target.

## Screenshot Coverage

- PASS screenshot/title.png: captured (678.4 KB)
- PASS screenshot/settings.png: captured (535.2 KB)
- PASS screenshot/hero-select.png: captured (638.9 KB)
- PASS screenshot/tutorial-01-insertion.png: captured (1120.2 KB)
- PASS screenshot/tutorial-02-keycard.png: captured (892.9 KB)
- PASS screenshot/tutorial-03-terminal.png: captured (1119.2 KB)
- PASS screenshot/tutorial-04-sentry.png: captured (1037.9 KB)
- PASS screenshot/tutorial-05-extraction.png: captured (991.4 KB)
- PASS screenshot/gameplay-level-one.png: captured (1010.5 KB)
- PASS screenshot/focus-lobby-door.png: captured (1155.1 KB)
- PASS screenshot/focus-server-door.png: captured (1153.4 KB)
- PASS screenshot/gameplay-command-codes.png: captured (1076.3 KB)
- PASS screenshot/focus-extraction-door.png: captured (1151.5 KB)
- PASS screenshot/complete.png: captured (930.1 KB)

## Tester Feedback

- Title flow: verify logo, rotating level-one preview, staged hero model, hero-select preview space, Start, Change Hero, and Settings are visible.
- Tutorial: verify all five General Caldwell screenshots align with hero, keycard, terminal, sentry, and extraction targets, and every step ends with "Good luck, cadet."
- Level: verify keycard, terminal, command codes, sentries, extraction, wall/floor meshes, wall/floor texture quality, and all three door-focus screenshots are readable and properly grounded.
- Playthrough: verify the browser route uses the authored validation route, keyboard interaction, door-focus pauses, and extraction completion without sentry contact.
- Coordinate QA: verify door/wall continuity by edge coordinates, not screenshot impression alone. Wall gaps must name door ID, wall IDs, frame/continuity bounds, and measured gap widths.
- Camera QA: verify the normal gameplay screenshot is captured before objective interaction, with debug teleports snapping the gameplay camera to the current player position.
- Asset QA: verify objective GLBs, sentry GLBs, floor/wall meshes, floor/wall/object texture quality, door-panel clarity, wall-door gaps/seams, and extraction marker pass or have explicit review notes.
- Completion: verify triumphant cue starts and level stats appear.
- Performance: game pacing matches the 55.6 FPS browser baseline, but this environment cannot prove strict 16.7 ms frame cadence.

## Required Fixes

- P0: None recorded by generated report.
- P1: Current headed browser baseline measured 55.6 FPS / 18.0 ms median and cannot prove strict 16.7 ms on the performance profile. The game tracks that baseline within tolerance, so rerun on a true 60 Hz visible browser before marking the 60 FPS gate fully proven.
- P1: None from generated asset grading.
- P1: Door-wall coordinate gaps for lobby-door: lobby-divider-west->lobby-door:frame 4.68m on x; lobby-door:frame->lobby-divider-east 4.68m on x.
- P1: Door-wall coordinate gaps for server-door: server-divider-west->server-door:frame 12.68m on x; server-door:frame->server-divider-east 2.68m on x.
- P1: Door-wall coordinate gaps for extraction-door: command-divider-west->extraction-door:frame 4.68m on x; extraction-door:frame->command-divider-east 4.68m on x.
- P1: Level density is below AAA presentation target: 4.0% floor coverage. Set-dressing and gameplay footprints cover only 4.1% of the 6048m2 floor. Add tactical cover, security props, cables, signage, light fixtures, patrol landmarks, and extraction dressing before grading this as AAA-quality level presentation.
- P1: None from generated screenshot coverage.
