---
name: threejs-audio-haptics
description: Design and implement browser-game audio, Web Audio graphs, spatial audio, stealth sound propagation, music states, SFX pooling, compression budgets, accessibility-friendly feedback, and optional gamepad haptics. Use when Codex touches sound effects, music, positional audio, alert cues, audio loading, mixer routing, or tactile feedback.
---

# Three.js Audio Haptics

## Audio Contract

Use this skill when sound or feedback changes player understanding. In stealth games, audio is both presentation and gameplay signal.

Define each sound by:

- Gameplay event and priority.
- Source position or UI bus.
- Mix bus: music, ambience, UI, enemy, player, objective, voice, or debug.
- Playback rule: one-shot, loop, cooldown, random variant, ducking, or state transition.
- Memory rule: streamed, decoded buffer, procedural, or lazy-loaded.

## Web Audio Rules

- Create/resume `AudioContext` from user gesture paths when browsers require it.
- Use a small routing graph: master, music, SFX, UI, ambience, and sidechain/ducking nodes when needed.
- Pool short SFX buffers and source node creation. Avoid decoding or fetching during critical interactions.
- Use `PannerNode` for true world sounds and stereo/UI panning for screen-space feedback.
- Keep listener transform synced to the gameplay camera or player according to design.
- Expose debug controls for mute buses, force cues, show active sounds, and report decoded audio memory estimates.

## Stealth Audio

- Separate player-heard sound from AI-heard sound. AI hearing should be gameplay data with radius, occlusion, material, and alert weight.
- Make alert stages audible: suspicion tick, investigate cue, chase sting, recovery cue, success cue.
- Keep loudness and repetition fatigue under control. Use cooldowns and variants for frequent actions.
- Use ducking or priority rules so objective, alert, and damage cues are not masked by ambience or music.

## Haptics

- Use gamepad haptics only as optional reinforcement. Never make it required for gameplay readability.
- Gate haptics behind capability checks and player settings.
- Map haptic strength to event priority: light interaction, medium detection, strong damage or takedown.

## Handoffs

- Route UI state and accessible alternatives to `$threejs-ui-accessibility`.
- Route gameplay AI hearing rules to `$threejs-gameplay-systems`.
- Route audio asset payload and decoded memory to `$threejs-memory`.

## References

Read `references/sources.md` for Web Audio and Gamepad API source notes.
