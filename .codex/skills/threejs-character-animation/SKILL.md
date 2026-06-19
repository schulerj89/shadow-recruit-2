---
name: threejs-character-animation
description: Build and review Three.js runtime character animation systems, AnimationMixer usage, clip mapping, locomotion blend logic, crossfades, action layers, root-motion policy, hit reactions, retargeted clips, and animation QA. Use when Codex wires character movement, combat, stealth takedowns, NPC animation states, clip transitions, or animation debugging.
---

# Three.js Character Animation

## Animation Contract

Use this skill when runtime animation behavior is the main risk. Asset generation and rigging belong to `$threejs-aaa-asset-builder`; this skill owns how clips become believable gameplay feedback in Three.js.

Define before coding:

- Actor type and skeleton source.
- Clip inventory and gameplay state mapping.
- Locomotion policy: idle, walk, run, crouch, strafe, turn, stop, start, fall, land.
- Root motion policy: consume, strip, or ignore.
- Transition rules: crossfade duration, interruption priority, loop mode, clamp behavior, and recovery state.

## Mixer Rules

- Use one `AnimationMixer` per independently animated actor.
- Build an explicit clip registry by semantic name, not by array index.
- Start actions through one animation controller so gameplay code does not call clips directly.
- Stop and uncache actions when actors unload.
- Keep additive or upper-body layers optional until the base locomotion state machine is stable.
- Clamp frame delta for tab-switch spikes before passing time to mixers.

## State And Blending

- Treat animation as output from gameplay state, not as authoritative gameplay state.
- Use short crossfades for locomotion, longer blends for stance changes, and immediate cuts for critical reactions when readability matters.
- Preserve impact frames for takedowns, hits, alarms, and reload/use interactions.
- Keep foot contact, yaw, and movement speed aligned. If feet slide, fix speed scaling or root motion before adding more clips.
- Add debug controls for force clip, freeze frame, slow motion, show skeleton, show foot markers, and dump active actions.

## Retargeting And QA

- Verify bind pose, scale, hips/root naming, limb orientation, and clip frame rate after retargeting.
- Check loop seams, foot locks, hand placement, weapon/socket alignment, and camera readability from gameplay distance.
- Reject clips that require gameplay code to hide obvious rig or timing defects.
- Hand rig generation and provider retarget tasks to `$threejs-aaa-asset-builder`.

## References

Read `references/sources.md` for current Three.js animation and glTF animation behavior.
