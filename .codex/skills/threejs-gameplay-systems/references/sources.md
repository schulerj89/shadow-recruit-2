# Source Notes

Research date: 2026-06-19.

## Animation And Actor State

- AnimationMixer: https://threejs.org/docs/pages/AnimationMixer.html
  - Use an AnimationMixer to play animations for a root object. Multiple independently animated objects generally need separate mixers.
  - `update(deltaTime)` advances mixer time; uncache methods release animation resources after actions are stopped.
- SkeletonUtils: https://threejs.org/docs/pages/module-SkeletonUtils.html
  - `retarget()` and `retargetClip()` can transfer skeleton pose or animation clips between compatible skeletons.

## Loop And Renderer Hooks

- WebGLRenderer: https://threejs.org/docs/pages/WebGLRenderer.html
  - `setAnimationLoop()` is recommended over manually wiring requestAnimationFrame for Three.js apps.
  - `renderer.info` provides counters that can feed debug panels and smoke tests.

## Runtime Assets

- Khronos glTF overview: https://www.khronos.org/gltf/
  - glTF/GLB supports scenes, nodes, cameras, meshes, materials, textures, skins, and animations in a runtime-oriented format.
- GLTFLoader: https://threejs.org/docs/pages/GLTFLoader.html
  - Robust GLB loading may require DRACO, KTX2, or meshopt support.

Use these sources to back animation, runtime asset, and loop decisions. Gameplay rules themselves should be validated with local tests and screenshots.
