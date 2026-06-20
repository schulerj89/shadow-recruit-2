# Generated Surface Textures

## Decision

Use generated square runtime textures for the Level 1 floor and wall surfaces, then repeat them through Three.js materials rather than keeping canvas-drawn procedural panels.

## Assets

- `src/assets/generated/tactical-floor-panel.png`: 1024x1024 generated tactical floor panel texture.
- `src/assets/generated/blacksite-wall-panel.png`: 1024x1024 generated blacksite wall panel texture.

## Prompts

Floor prompt: seamless tileable tactical sci-fi floor panel texture, dark gunmetal plates, cyan guide lines, rivets, worn seams, brushed metal scuffs, neutral orthographic lighting, no text, no logos, no characters.

Wall prompt: seamless tileable tactical sci-fi wall panel texture, reinforced vertical armor panels, service seams, teal diagnostic lights, vents, weathered paint, scratches, neutral orthographic lighting, no text, no doors, no characters.

## Runtime Notes

- The generated source images were resized to 1024x1024 before committing so repeated 3D textures stay power-of-two and avoid unnecessary decoded texture memory.
- Three.js `TextureLoader` supplies the image textures, `SRGBColorSpace` keeps color maps correct, and `RepeatWrapping` keeps long level walls and floors from stretching the source image.
- The memory scan reports `src/assets` at 159 MB total, with the two new PNGs at about 2.05 MB and 1.98 MB transfer size.

## Research Used

- Three.js texture and material docs for `TextureLoader`, `Texture`, and `MeshStandardMaterial` color maps.
- MDN WebGL best practices for mipmaps, texture memory, and compressed-texture tradeoffs.
