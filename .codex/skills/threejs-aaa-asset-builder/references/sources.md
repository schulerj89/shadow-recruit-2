# Source Notes

Research date: 2026-06-19.

## Meshy

- Meshy Text to 3D: https://docs.meshy.ai/en/api/text-to-3d
  - Text to 3D uses `mode: "preview"` for untextured geometry, then `mode: "refine"` to texture the accepted preview.
  - Current docs include `model_type` values such as `standard` and `lowpoly`, and `ai_model` values including `meshy-5`, `meshy-6`, and `latest`.
- Meshy Remesh: https://docs.meshy.ai/en/api/remesh
  - Remesh can export existing generated models into other formats and is useful when topology or density needs another pass.
- Meshy Rigging: https://docs.meshy.ai/en/api/rigging
  - Programmatic rigging works best with standard humanoid biped assets with clear limbs and body structure.
- Meshy Animation: https://docs.meshy.ai/en/api/animation
  - Animation tasks apply an action ID to a successfully completed rigging task and can post-process outputs.
- Meshy changelog: https://docs.meshy.ai/en/api/changelog
  - Recent updates added `target_formats`, `auto_size`, `origin_at`, `pose_mode`, PBR-related options, and rigging/animation API changes.

## Tripo

- Tripo quick start: https://developers.tripo3d.ai/en/docs/quick-start
  - Tripo v3 generation APIs are asynchronous and return `task_id`; poll task status until success.
  - Successful generation exposes `output.model_url`; docs warn model URLs expire quickly and should be downloaded immediately.
  - The game-ready character sequence uses generation, rig-check, rig, and retarget.
- Tripo animation docs: https://platform.tripo3d.ai/docs/animation
  - Animation tasks build on previous generation tasks and can add rigging/animation behavior.

## glTF And Three.js

- Khronos glTF overview: https://www.khronos.org/gltf/
  - glTF/GLB is a royalty-free runtime 3D asset delivery format for scenes and models.
- glTF 2.0 specification: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
  - glTF is API-neutral and designed to bridge authoring tools and graphics applications.
  - glTF supports node transform and morph target weight animation, but runtime playback behavior is an engine decision.
- glTF Transform: https://gltf-transform.dev/
  - glTF Transform supports reproducible reading, editing, writing, splitting, bundling, and optimizing glTF 2.0 assets.
- GLTFLoader: https://threejs.org/docs/pages/GLTFLoader.html
  - Configure DRACO, KTX2, and meshopt decoders when assets use those extensions.
- AnimationMixer: https://threejs.org/docs/pages/AnimationMixer.html
  - Use one mixer per independently animated actor and uncache resources when no longer needed.
- SkeletonUtils: https://threejs.org/docs/pages/module-SkeletonUtils.html
  - Retarget skeleton poses and animation clips when compatible rigs require animation transfer.

Re-check provider docs before spending credits or changing request shapes.
