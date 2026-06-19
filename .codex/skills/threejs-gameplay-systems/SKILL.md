---
name: threejs-gameplay-systems
description: Build and review Three.js gameplay architecture for browser games, including stealth, combat, AI, input, collision proxies, state machines, camera controllers, progression, debug hooks, and testable simulation/render separation. Use when Codex implements or audits mechanics rather than art, renderer, or asset-pipeline work.
---

# Three.js Gameplay Systems

## System Contract

Use this skill for mechanics that must remain understandable, testable, and extensible as Shadow Recruit 2 grows.

Start every gameplay change by defining:

- Player verb: what the player does.
- Game state: the minimum authoritative data required.
- Feedback: what the player sees, hears, or feels.
- Failure and recovery: how the system communicates mistakes.
- Debug hook: how a tester forces or inspects the state.

## Architecture Rules

- Separate simulation state from render objects. Render meshes should reflect gameplay state, not own it.
- Use authored collision proxies or simple primitives for gameplay. Do not derive critical collision from decorative GLB geometry.
- Keep state transitions explicit: title, briefing, exploration, alert, combat, success, failure, menu, loading.
- Use deterministic data for levels, patrols, objectives, encounters, and unlocks where practical.
- Keep input mapping separate from actions so keyboard, controller, and touch can drive the same verbs.
- Avoid per-frame allocations in hot gameplay paths: raycasts, vectors, arrays, event payloads, and bounding boxes should be reused or pooled.
- Expose debug controls for teleport, force alert, force objective state, spawn enemy, force camera, and reset scene.

## Three.js Mechanics

- Use `Clock` or equivalent delta time for animation mixers and motion, with clamping for tab-switch spikes.
- Use one `AnimationMixer` per independently animated actor.
- Stop and uncache animation actions when actors unload.
- Keep camera collision and player collision separate from visual clipping.
- Budget raycasts by purpose and frequency; broad AI awareness should use cheap spatial checks before line-of-sight rays.
- Keep gameplay fallbacks when high-end GLB assets fail to load.

## Implementation Workflow

1. Add or update the data model first.
2. Implement the smallest complete loop: input or AI trigger, state transition, feedback, and reset path.
3. Add unit tests for pure logic.
4. Add browser smoke or screenshot checks for player-visible state.
5. Route renderer, asset, image, or memory concerns to the matching specialist skill.

## Review Checklist

- Can a new player tell what happened without reading debug text?
- Can a tester reproduce the state in under 30 seconds?
- Can the system survive scene reset, level change, and asset load failure?
- Does the mechanic remain readable at the actual gameplay camera distance?

## References

Read `references/sources.md` for source-backed Three.js animation, GLB, and loop notes.
