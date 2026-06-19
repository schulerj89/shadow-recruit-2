# Source Notes

Research date: 2026-06-19.

- Three.js AnimationMixer: https://threejs.org/docs/pages/AnimationMixer.html
  - AnimationMixer plays animations on a root object. Use separate mixers for independently animated actors.
- Three.js AnimationAction: https://threejs.org/docs/
  - AnimationAction schedules playback for AnimationClip and supports transitions such as cross-fading.
- Three.js SkeletonUtils: https://threejs.org/docs/pages/module-SkeletonUtils.html
  - `retarget()` and `retargetClip()` support pose and clip retargeting between compatible skeletons.
- Khronos glTF 2.0 animation section: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
  - glTF stores keyframes for node transforms and morph target weights, but runtime playback behavior is engine-defined.
- Meshy Animation API: https://docs.meshy.ai/en/api/animation
  - Animation tasks apply action IDs to completed rigging tasks and can post-process frame rate.

Re-check sources before changing animation, retargeting, or clip import assumptions.
