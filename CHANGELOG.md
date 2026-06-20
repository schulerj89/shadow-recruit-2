# Changelog

## Unreleased

## 0.23.0 - 2026-06-20

### Minor

- Added an active mission-guidance HUD that points players to the next required objective or extraction with player-facing action text, distance, and compass direction.
- Exposed mission-guidance diagnostics through tester state, browser smoke, screenshot capture, browser playthroughs, and the generated game-tester report so future large missions must prove objective-to-objective guidance.
- Removed a hardcoded browser-playthrough completion count so future registered missions validate against their authored required-objective total.
- Tightened tester and designer guidance so screenshot-visible wallops between doors require door-pair coordinate ownership, projected coverage, and first-hit proof, while large empty levels and title heroes looking away remain P1 design failures.

## 0.22.1 - 2026-06-20

### Patch

- Replaced internal pre-mission vocabulary with player-facing operative and mission-sector language, with smoke, screenshot, and tester-report checks to keep implementation terms out of the hero-select screen.

## 0.22.0 - 2026-06-20

### Minor

- Added a committed mission-readiness matrix to the game-tester report, grading every registered mission for catalog exposure, browser playthrough evidence, route bounds, objective/door unlock wiring, density zones, landmarks, and static wall-run door-span ownership.
- Added mission-readiness findings so future large levels fail QA when they lack scalable geometry, density, wall-run, or playthrough evidence instead of only relying on the selected mission's runtime capture.

## 0.21.1 - 2026-06-20

### Patch

- Copied each registered mission's browser playthrough report and screenshots into committed QA evidence, so the playthrough matrix links to inspectable artifacts for every mission instead of ignored local `artifacts/` paths.
- Tightened the game-tester report so a mission playthrough matrix row fails when its report or screenshots are not copied into committed QA evidence.

## 0.21.0 - 2026-06-20

### Minor

- Added the registered Relay Vault mission with coordinate-authored bounds, split wall runs, sliding-door objectives, three sentries, density zones, GLB set-dressing placements, and in-world tutorial copy.
- Expanded the full tester runner to execute a browser playthrough matrix for every registered mission while preserving the default playthrough artifact for the game-tester report.
- Added game-tester report evidence and findings for the browser playthrough matrix so registered missions cannot ship without browser completion proof.

## 0.20.0 - 2026-06-20

### Minor

- Added operative trait definitions for all four hero recruits, with selected traits changing movement speed, sentry contact radius, interaction reach, extraction radius, or terminal-use timing while keeping the default operative as a baseline.
- Exposed operative mechanics, catalog comparisons, changed scalars, trait applications, and deterministic probes through the debug API and tester state.
- Updated hero-select UI, browser smoke, screenshot capture, browser playthrough, and the game-tester report so QA can prove hero choice affects gameplay mechanics rather than only swapping GLB assets.

## 0.19.1 - 2026-06-20

### Patch

- Tightened tester, QA automation, designer, and geometry-validator skills so visible wall issues between doors require screenshot-to-wall-line coordinate lookups, inter-door owner spans, projected coverage, and camera first-hit proof.
- Strengthened title and AAA density skill gates so testers fail back-facing or unreadable title heroes and large gameplay spaces that read as empty from the active player camera.

## 0.19.0 - 2026-06-20

### Minor

- Added explicit render-budget diagnostics for each performance profile, exposing draw-call, triangle, geometry, texture, pixel-ratio, shadow-policy, and headroom checks through the tester state.
- Wired browser smoke, FPS scene sampling, and the game-tester report to fail or report render-budget overages alongside frame-pacing evidence.

## 0.18.0 - 2026-06-20

### Minor

- Added runtime wall-line connection graphs, active-camera wall/door probe rows, title identity-anchor diagnostics, and gameplay negative-space density metrics to the Shadow Recruit tester state.
- Tightened browser smoke, screenshot capture, and game-tester reports so wall continuity, title hero readability, and AAA active-camera density require the new evidence.

## 0.17.1 - 2026-06-20

### Patch

- Tightened tester, QA automation, game-designer, and geometry-validator skills so wall gaps between doors require wall-line connection graphs, camera-probe first-hit evidence, coordinate ownership rows, title identity-anchor checks, and active-camera negative-space density grading.

## 0.17.0 - 2026-06-20

### Minor

- Added active gameplay-view density diagnostics that grade near, mid, and far camera bands with projected screen occupancy and visible tactical object categories.
- Upgraded the cover-barricade GLB kit and runtime placement so blocker cover appears as repeated detailed modules instead of one stretched slab while preserving authored collision proxies.
- Added insertion-spawn foreground cover, midground security-stack cover, and floor service dressing so the first playable and keycard camera views are not empty open floor.
- Re-aimed the normal gameplay follow camera toward the mission route instead of the insertion wall so objective path detail appears in the active view.
- Added smoke, screenshot, and tester-report gates for player-camera foreground, midground, and background tactical density.

## 0.16.4 - 2026-06-20

### Patch

- Tuned the normal gameplay camera closer to the player and added camera readability diagnostics for distance, projected player bounds, screen height, and screen occupancy.
- Added smoke, screenshot, tester-report, and skill gates so the primary gameplay camera cannot regress into a distant tactical overview without failing QA.

## 0.16.3 - 2026-06-20

### Patch

- Added a multi-scene FPS gate and tester-report matrix for title, gameplay, completion, and sentry-failure states so performance evidence cannot pass from one gameplay sample alone.
- Tightened tester, designer, QA automation, and geometry skills around screenshot-to-coordinate proof, door-to-door wall ownership, title hero identity reads, active-camera AAA density, and FPS scene evidence.

## 0.16.2 - 2026-06-20

### Patch

- Added calibrated FPS overhead metrics to the performance gate and tester report so environment-limited browser runs still fail gameplay regressions instead of only reporting raw FPS.
- Moved the FPS gate into `verify` and exposed renderer pixel ratio in tester reports so the performance-profile proof is part of the standard release gate.
- Documented the 60 FPS calibration policy for local browsers that cannot prove strict 16.7 ms cadence.

## 0.16.1 - 2026-06-20

### Patch

- Added automated sentry failure/retry QA that intentionally triggers contact, captures the operation-failed overlay, proves Retry resets the mission cleanly, and feeds the evidence into the game-tester report and committed screenshots.

## 0.16.0 - 2026-06-20

### Minor

- Added a registered-level `level:density` doctor and wired it into `verify` so future big missions must meet whole-level, per-zone, landmark, and interactable density gates before release.
- Upgraded `level:scaffold` so newly generated missions start with non-overlapping wall geometry, safe validation routes, and enough non-solid GLB dressing to pass the same AAA density targets.
- Documented the level-density gate decision and validated the scaffold by temporarily registering a generated mission through doctor, density, playthrough, and build checks.
- Strengthened tester, designer, QA automation, and geometry skills so future reports must pair screenshots with door-to-door ownership tables, screen-space projection, title hero facing metrics, and active-camera near/mid/far density bands.

## 0.15.3 - 2026-06-20

### Patch

- Added coordinate-authored non-solid GLB set dressing across all four Level 1 zones so gameplay-camera density clears the AAA readiness targets while preserving collision and route validation.
- Tightened browser smoke density assertions to match the tester report's 18% whole-level and 20% per-zone AAA-readiness gates.

## 0.15.2 - 2026-06-20

### Patch

- Replaced visible Level 1 blocker boxes with a required generated `cover-barricade` GLB visual while preserving authored blocker rectangles as collision truth.
- Added blocker-cover asset provenance, browser-smoke gates, and asset-quality checks so primitive cover stand-ins cannot pass as production-ready gameplay art.
- Tightened tester, designer, QA automation, and world-builder skills around blocker GLB provenance, gameplay-camera density bands, title hero identity reads, and empty-space AAA failures.

## 0.15.1 - 2026-06-20

### Patch

- Regenerated the full game-tester evidence set for the current build so title, hero selection, settings, loading, tutorial, door-focus, gameplay, completion, FPS, and tester-report artifacts match the latest level-authoring release.

## 0.15.0 - 2026-06-20

### Minor

- Added a deterministic `level:registry` generator and check command so level adapters rewrite the static mission-selector registry from parsed `LevelDefinition` exports instead of manual index edits.
- Updated `level:scaffold --register` and `level:doctor` to use the generated registry flow, with a decision note documenting the static-import approach for future big levels.

## 0.14.1 - 2026-06-20

### Patch

- Tightened the game tester, game designer, and QA automation skills so door gaps between doors, title heroes looking away from camera, flat material reads, and empty AAA-level spaces require screenshot, coordinate, projection, asset-provenance, and density evidence before passing.

## 0.14.0 - 2026-06-20

### Minor

- Added a player-facing mission selector to the pre-mission operative screen, backed by the level catalog and mission briefing counts so future big levels have a reusable launch path.
- Added mission-catalog QA evidence to screenshots, browser smoke, playthrough startup, tester state, and the generated game-tester report.
- Recorded the subagent-driven production decision for choosing mission-catalog work as the next big-level architecture slice.

## 0.13.4 - 2026-06-20

### Patch

- Added runtime asset provenance/no-visible-fallback diagnostics for active GLB hero, sentry, objective, and set-dressing assets, plus tester-report and browser-smoke gates that fail missing GLBs, unknown sources, or visible placeholder stand-ins.
- Aligned gameplay, memory, asset-builder, and game-tester skills so Shadow Recruit QA treats production primitive stand-ins as failures instead of acceptable AAA assets.

## 0.13.3 - 2026-06-20

### Patch

- Added tutorial alignment keywords, runtime diagnostics, screenshot capture evidence, and tester-report checks proving each General Caldwell panel points at the intended target and ends with "Good luck, cadet."

## 0.13.2 - 2026-06-20

### Patch

- Strengthened the native title wordmark treatment and added title-wordmark QA diagnostics to prove the title text is final-branded, visible, and not colliding with the hero or command panel.

## 0.13.1 - 2026-06-20

### Patch

- Tightened tester, designer, director, level-geometry, world-builder, and asset-builder skills so screenshot concerns must be paired with coordinates, title hero facing/projection evidence, and per-zone AAA density grading.

## 0.13.0 - 2026-06-20

### Minor

- Added named level-density zones with per-zone tactical footprint, landmark, interactable, screenshot, and tester-report diagnostics for large-level QA.
- Added security-stack set dressing and scaffold/geometry-validator support for zone metadata so future large levels start with room-level density gates.

## 0.12.4 - 2026-06-20

### Patch

- Added projected title-hero screen bounds and occupancy diagnostics so QA can prove the recruit is large enough to read on the title screen.

## 0.12.3 - 2026-06-20

### Patch

- Added audio-state diagnostics and QA assertions for title, loading, gameplay, and completion music transitions.

## 0.12.2 - 2026-06-20

### Patch

- Tightened tester, designer, director, world-builder, and geometry skills with screenshot-to-coordinate wall-run ledgers, title hero facing/screen-occupancy evidence, and AAA level-density scorecards.

## 0.12.1 - 2026-06-20

### Patch

- Added loading-screen diagnostics and QA screenshots so mission loading progress is visible, retained in tester state, and covered by smoke/tester reports.

## 0.12.0 - 2026-06-20

### Minor

- Added a `tester:play` command that starts a local Vite build, runs the full browser playthrough, screenshot, FPS, and tester-report stack against one URL, and shuts down the server afterward.

## 0.11.1 - 2026-06-20

### Patch

- Added wall-run interval diagnostics and tester-skill rules so QA can prove spaces between doors, walls, frames, and continuity meshes by coordinates instead of relying on screenshots alone.
- Tightened game-designer and geometry-validator skills around title hero facing, large-level density evidence, and wall-run continuity handoffs.

## 0.11.0 - 2026-06-20

### Minor

- Added a deterministic Level 1 title-orbit preview with a holographic mission map, 360 camera diagnostics, smoke assertions, and committed title orbit screenshots.

## 0.10.1 - 2026-06-20

### Patch

- Removed player-facing set-dressing fallback geometry so failed optional GLB loads are omitted and flagged by QA diagnostics instead of being replaced with placeholder props.

## 0.10.0 - 2026-06-20

### Minor

- Added level authoring scaffold and doctor commands so future large missions can start from validated JSON geometry, matching TypeScript adapters, registry checks, route validation, and release-gated drift detection.

## 0.9.1 - 2026-06-20

### Patch

- Hardened runtime QA by making decorative set-dressing GLBs fail soft with visible fallbacks while tester diagnostics now verify every authored dressing placement has loaded assets, rendered bounds, floor contact, and coordinate footprint coverage.
- Fixed sliding-door cinematic focus to use authored door-center coordinates, aligned screenshot capture with the performance profile, and added browser smoke to the release verify gate.

## 0.9.0 - 2026-06-20

### Minor

- Replaced Level 1 tactical set dressing primitives with reusable generated GLB kit assets for cable trays, wall machinery, and extraction equipment, with typed asset loading, manifest metadata, smoke assertions, and runtime placement diagnostics.

## 0.8.1 - 2026-06-20

### Patch

- Fixed title-screen recruit staging to face the camera in a readable three-quarter pose and added title-composition diagnostics to smoke, screenshots, and tester reports.

## 0.8.0 - 2026-06-20

### Minor

- Added coordinate-authored Level 1 tactical set dressing and density diagnostics so tester reports can verify AAA environment coverage without turning visual dressing into collision blockers.

## 0.7.7 - 2026-06-20

### Patch

- Tightened tester and design skills with screenshot-plus-coordinate QA gates for wall gaps, multi-door wall runs, title hero facing, and measured AAA level-density findings.

## 0.7.6 - 2026-06-20

### Patch

- Closed Level 1 divider wall gaps around all three sliding doors by aligning authored wall segments to the door collision extents so coordinate QA can prove door/wall continuity.

## 0.7.5 - 2026-06-20

### Patch

- Added coordinate-aware geometry diagnostics to tester state, browser smoke, and game-tester reports so door/wall gaps, object bounds, and sparse level dressing are measured instead of judged from screenshots alone.

## 0.7.4 - 2026-06-20

### Patch

- Equipped tester, designer, geometry, world-building, and AAA asset skills with coordinate-backed door/wall QA, title-hero orientation checks, and large-level asset-density critique.

## 0.7.3 - 2026-06-20

### Patch

- Added machine-readable completion stats and triumphant cue checks to the completion overlay, debug tester state, browser smoke, and browser playthrough evidence.

## 0.7.2 - 2026-06-20

### Patch

- Updated every General Caldwell tutorial briefing to end with "Good luck, cadet." and tightened browser smoke coverage to enforce the tutorial copy contract on every step.

## 0.7.1 - 2026-06-20

### Patch

- Replaced procedural level floor and wall materials with generated sci-fi panel textures and added door wall-continuity meshes so door openings no longer grade as wall gaps.

## 0.7.0 - 2026-06-20

### Minor

- Added a Shadow Recruit game-designer skill for cinematic title-screen and camera composition reviews.
- Redesigned the title screen toward a closer cinematic recruit composition and tightened the gameplay camera framing.

## 0.6.4 - 2026-06-20

### Patch

- Added generated screenshot coverage checks to the game tester report so QA feedback records missing title, tutorial, door-focus, gameplay, settings, and completion captures explicitly.
- Updated game-tester asset grading to flag procedural wall/floor textures as below AAA/generated-image quality and to fail door openings that lack wall/portal continuity behind the door.

## 0.6.3 - 2026-06-20

### Patch

- Tightened asset-grounding QA so character and objective meshes cannot pass grading while extending below the floor, and corrected the playable hero visual offset.

## 0.6.2 - 2026-06-20

### Patch

- Added low-cost tactical floor and wall texture materials plus door-frame seam trim so tester asset grading no longer flags the level shell as flat blockout art.

## 0.6.1 - 2026-06-20

### Patch

- Separated sentry detection cones from sentry visual asset bounds and preserved normalized GLB visual offsets under gameplay roots so game-tester grading measures grounded enemy and objective meshes instead of helper geometry.
- Expanded game-tester texture-quality grading for bland wall/floor materials and wall-door seam or gap review.

## 0.6.0 - 2026-06-20

### Minor

- Added game-tester asset grading for wall and floor meshes, door panels, objective GLBs, sentries, hero placement, and extraction readability.

## 0.5.0 - 2026-06-20

### Minor

- Added level-id driven playthrough tooling so scripted and browser validation can target future missions with `PLAYTHROUGH_LEVEL_ID`.

## 0.4.1 - 2026-06-20

### Patch

- Improved gameplay camera QA framing by snapping debug teleports to the current player position and capturing normal gameplay before objective interaction.

## 0.4.0 - 2026-06-20

### Minor

- Added render-quality behavior for performance, balanced, and cinematic profiles, with FPS QA measuring the low-cost performance path by default.

## 0.3.2 - 2026-06-20

### Patch

- Improved hero-selection layout so the staged 3D hero preview remains visible while changing recruits.

## 0.3.1 - 2026-06-20

### Patch

- Improved title-screen hero model framing with a staged plinth, focused lighting, and smoke coverage.

## 0.3.0 - 2026-06-20

### Minor

- Added a distinct command-codes GLB objective asset with a reproducible generator and browser QA assertions.

## 0.2.0 - 2026-06-20

### Minor

- Added a browser playthrough runner that drives the authored route, keyboard objective interactions, door-focus cinematics, and extraction completion with artifacts.

## 0.1.7 - 2026-06-20

### Patch

- Added cinematic door-focus debug state, smoke assertions, and screenshots for each objective unlock.

## 0.1.6 - 2026-06-20

### Patch

- Added tutorial-step debug state, smoke assertions, and screenshots for every cinematic tutorial beat.

## 0.1.5 - 2026-06-20

### Patch

- Added settings-state QA coverage for debug, mute, and performance profile controls and moved new QA artifacts to a current-date default.

## 0.1.4 - 2026-06-20

### Patch

- Added real loaded-asset memory metrics to the debug/tester state and browser smoke assertions.

## 0.1.3 - 2026-06-20

### Patch

- Made the validated Level 1 JSON blockout the runtime geometry source and added a level registry plus geometry validation to the release verify path.

## 0.1.2 - 2026-06-19

### Patch

- Strengthened the level geometry skill into a level creator workflow with explicit boundary, doorway, clearance, and wall-overlap math gates.

## 0.1.1 - 2026-06-19

### Patch

- Added calibrated FPS baseline reporting so game frame pacing is compared against both the 60 FPS target and the current browser cadence.

## 0.1.0 - 2026-06-19

### Minor

- Expanded all six Three.js skills with advanced production, renderer, gameplay, image-generation, GLB asset, and memory guidance backed by fresh source research.
- Added seven specialist handoff skills for level/world building, physics/navigation, character animation, audio/haptics, UI/accessibility, QA automation, and release management.
- Added a level geometry validation skill with scripted blockout checks for bounds, wall overlaps, clearance gaps, and spawn/objective placement.
- Added the Shadow Recruit 2 playable foundation with title logo art, hero selection, generated briefing art, Level 1 data, sliding-door unlocks, extraction completion, reusable assets, QA/playthrough scripts, and a game tester skill.

### Patch

- Added agent workflow rules requiring changelog entries, SemVer bucket decisions, one-bucket-at-a-time request handling, and immediate commit/push after each version bump.
- Added a standing 60 FPS performance gate and strengthened QA skill rules for player-facing Three.js changes.
