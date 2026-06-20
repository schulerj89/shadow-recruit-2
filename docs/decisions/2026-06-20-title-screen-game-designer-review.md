# Title Screen Game Designer Review

## Findings

- P1: `v0.6.4/title.png` reads as a zoomed-out level preview with a tiny hero, so the first impression is closer to debug flyover than tactical recruit fantasy.
- P1: The emblem image competes with the title and does not improve the screen; use strong native typography and cinematic staging instead.
- P1: The gameplay camera in `gameplay-level-one.png` keeps the hero too small for reading body direction, nearby wall texture, and door seams.
- P2: The title background should frame a close stealth tableau: hero, door panel, corridor lighting, fog, and extraction color hints.

## Direction

- Remove the PNG logo from the title overlay.
- Stage the hero near a lit door/corridor set piece instead of relying on the full level as the main title background.
- Use a closer title orbit with low camera height and shallow tactical framing.
- Tighten gameplay camera distance while preserving enough visibility for walls, objectives, doors, and sentry routes.
- Recapture `title.png`, `hero-select.png`, `gameplay-level-one.png`, and door-focus screenshots after the pass.

## Research Used

- Unity Cinemachine position composition: screen position, dead zone, and damping informed the title camera framing checklist.
- Unity Cinemachine third-person follow: camera distance and target offset informed the closer gameplay camera direction.
- Unreal cinematic camera docs: title scene should be treated as a deliberate cinematic camera setup, not a debug/gameplay camera.
- W3C WCAG 2.2 contrast and images-of-text criteria: prefer native title typography over a weak logo image and keep menu text readable.
