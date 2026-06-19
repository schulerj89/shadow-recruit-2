---
name: threejs-ui-accessibility
description: Design and review Three.js game HUDs, menus, overlays, touch controls, gamepad/keyboard input surfaces, accessibility semantics, focus handling, contrast, responsive layout, and readable state feedback. Use when Codex touches menus, HUD, settings, subtitles, prompts, control remapping, mobile UI, ARIA, or WCAG-sensitive game interfaces.
---

# Three.js UI Accessibility

## UI Contract

Use this skill when player-facing interface clarity or input access is the risk. Game UI should be fast to scan, reachable by multiple input methods, and stable over the 3D canvas.

Define every UI surface by:

- State it represents.
- Action it enables.
- Input methods: keyboard, mouse, touch, gamepad.
- Focus behavior and escape/back behavior.
- Minimum viewport and text-length constraints.
- Accessibility fallback for color, audio, motion, or haptics-only signals.

## HUD Rules

- Keep HUD state dense and predictable. Avoid marketing-style panels during gameplay.
- Prioritize mission objective, detection/alert state, health/stamina, interaction prompt, and weapon/tool status.
- Use icon plus text for unfamiliar mechanics; icons alone are acceptable only after a clear tutorial or when conventional.
- Keep prompts near the relevant object only when they do not occlude hazards or controls.
- Validate text fit at mobile and desktop widths.

## Menus And Accessibility

- Use semantic HTML controls for menus/settings when possible, even over a WebGL canvas.
- Maintain visible keyboard focus, logical focus order, and focus trapping in modal dialogs.
- Do not rely on color alone for alert, rarity, faction, lock, or health state.
- Provide reduced motion, audio level controls, subtitle/caption options when dialogue or critical audio exists, and remappable controls once input complexity grows.
- Preserve back/escape behavior across keyboard, gamepad, and touch.

## Input Surface

- Keep game actions independent from device events.
- Normalize keyboard, pointer, touch, and gamepad into the same action model.
- Poll gamepad state on the game loop, but keep UI navigation repeat rates and dead zones separate from movement.
- Show control prompts from the active input method, with a stable fallback.

## Handoffs

- Route gameplay action semantics to `$threejs-gameplay-systems`.
- Route browser smoke, ARIA snapshots, and visual regression to `$threejs-qa-automation`.
- Route audio-only cues and haptic alternatives to `$threejs-audio-haptics`.

## References

Read `references/sources.md` before making accessibility, ARIA, WCAG, or gamepad assumptions.
