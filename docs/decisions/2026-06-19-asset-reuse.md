# Asset Reuse Decision

Date: 2026-06-19

## Decision

Reuse the Shadow Circuit hero roster, sentry GLB, objective GLBs, and selected audio tracks as the first Shadow Recruit 2 runtime assets.

## Source Assets

- Hero idle/run GLBs under `C:\Users\joshs\Projects\sneak-game\src\assets\hero`.
- Sentry GLB at `C:\Users\joshs\Projects\sneak-game\src\assets\characters\sentry\enemy_sentry.glb`.
- Objective GLBs under `C:\Users\joshs\Projects\sneak-game\src\assets\objectives`.
- Title music: `title-on-patrol.ogg`.
- Level music: `ghost-steps.mp3`.
- Loading cue: `future-loading-loop.wav`.
- Completion cue: `dark-sci-fi-urgent.mp3`.

## Implementation Notes

- Hero animation remains split across idle and run GLBs; the idle scene provides the visual model and the run GLB provides the run clip.
- Character instances use `SkeletonUtils.clone()`.
- Runtime code normalizes character and objective scale after load.
- Required GLB gameplay assets do not use primitive stand-ins. Loading failures should surface as loading errors.
