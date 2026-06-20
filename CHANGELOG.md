# Changelog

## Unreleased

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
