# Changelog

## Unreleased

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
