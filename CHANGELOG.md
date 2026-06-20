# Changelog

## Unreleased

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
