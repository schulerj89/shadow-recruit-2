# Source Notes

Research date: 2026-06-19.

## Three.js Counters And Disposal

- WebGLRenderer: https://threejs.org/docs/pages/WebGLRenderer.html
  - `renderer.info` provides GPU memory and render-process counters for debugging and monitoring.
  - `renderer.dispose()` frees GPU-related resources allocated by the renderer instance.
- Renderer: https://threejs.org/docs/pages/Renderer.html
  - `compileAsync()` can reduce shader compilation stutter, but warmup may cause temporary CPU/GPU resource spikes.
- Info: https://threejs.org/docs/pages/Info.html
  - Renderer info is intended for memory/render-process monitoring.
- BufferGeometry: https://threejs.org/docs/pages/BufferGeometry.html
  - `dispose()` frees GPU-related resources for the geometry.
- Material: https://threejs.org/docs/pages/Material.html
  - `dispose()` frees GPU-related resources for the material.
- Texture: https://threejs.org/docs/pages/Texture.html
  - Texture dimensions, format, and type cannot change after initial use; dispose and create a new texture when those must change.

## WebGL And Texture Budget

- MDN WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
  - Mipmaps add memory overhead but can provide significant sampling performance benefits in 3D.
  - GPU-compressed texture formats can be smaller in GPU memory and faster to sample than PNG/JPEG uploads.
- MDN compressed texture formats: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Compressed_texture_formats
  - Compressed texture support depends on available WebGL extensions and hardware support.
- MDN GPUDevice.lost: https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/lost
  - WebGPU devices can be lost at any time; resources from the previous device need to be recreated.
- KTX2Loader: https://threejs.org/docs/pages/KTX2Loader.html
  - KTX2Loader transcodes Basis Universal textures into supported GPU compressed formats after `detectSupport(renderer)`.
- DRACOLoader: https://threejs.org/docs/pages/DRACOLoader.html
  - Draco compresses geometry transfer, but use glTF for materials, textures, animation, and hierarchy.

Re-check these sources before changing disposal rules, texture compression guidance, or renderer counter assumptions.
