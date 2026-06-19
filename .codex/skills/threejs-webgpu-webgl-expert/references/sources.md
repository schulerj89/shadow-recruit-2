# Source Notes

Research date: 2026-06-19.

## Three.js Rendering

- WebGPURenderer: https://threejs.org/docs/pages/WebGPURenderer.html
  - Current docs describe WebGPURenderer as the newer alternative to WebGLRenderer with backend fallback behavior.
- WebGLRenderer: https://threejs.org/docs/pages/WebGLRenderer.html
  - WebGLRenderer uses WebGL 2. Its `info` property exposes GPU memory and render-process statistics.
  - `compileAsync()` can help precompile shaders asynchronously through parallel shader compile support.
  - `setAnimationLoop()` is the recommended animation loop entry point.
- Material: https://threejs.org/docs/pages/Material.html
  - `onBeforeCompile` is WebGLRenderer-specific; docs recommend node materials/TSL for new renderer-portable customization.

## Web Platform

- MDN `GPU.requestAdapter()`: https://developer.mozilla.org/en-US/docs/Web/API/GPU/requestAdapter
  - `requestAdapter()` can resolve to `null` when no appropriate adapter is available.
- MDN WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
  - Mipmaps usually help 3D sampling. GPU-compressed texture formats can reduce GPU memory and bandwidth.

## Asset Loading

- GLTFLoader: https://threejs.org/docs/pages/GLTFLoader.html
  - `setDRACOLoader`, `setKTX2Loader`, and `setMeshoptDecoder` are required for their corresponding compressed asset extensions.
- DRACOLoader: https://threejs.org/docs/pages/DRACOLoader.html
  - Reuse one DRACOLoader instance to avoid repeated decoder setup.
- KTX2Loader: https://threejs.org/docs/pages/KTX2Loader.html
  - Call `detectSupport(renderer)` before loading textures so transcoding picks a supported GPU format.

Re-check these sources before changing backend, shader, or loader assumptions.
