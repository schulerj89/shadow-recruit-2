# Render Budget Gate

## Decision

Expose a render-budget state for each performance profile and require the performance profile to stay inside explicit draw-call, triangle, geometry, texture, pixel-ratio, and shadow-policy caps.

## Rationale

The local browser baseline cannot currently prove strict 16.7 ms cadence, but the game can still protect the 60 FPS path by tracking renderer counter headroom. This gives future level, GLB, texture, and UI work a measurable budget before the scene grows beyond what the performance profile can defend.

## Consequences

- Browser smoke fails when the performance profile exceeds the render-budget headroom.
- FPS scene rows include render-budget grade and counter headroom next to frame pacing.
- Game-tester reports now separate frame-pacing limitations from renderer-counter overages.
