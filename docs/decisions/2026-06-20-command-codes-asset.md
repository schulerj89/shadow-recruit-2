# Command Codes Asset Decision

Date: 2026-06-20

## Decision

Ship `src/assets/objectives/command-codes-cinematic.glb` as the distinct Level 1 command-codes pickup instead of reusing the keycard asset.

## Asset Brief

- Role: required objective that unlocks the extraction door.
- Gameplay use: top-down readable pickup at the command room objective point.
- Camera distance: readable from the normal gameplay camera and tutorial focus camera.
- Silhouette: encrypted data core with cyan code lanes, red security clasps, a raised holographic ring, and floating shards.
- Runtime path: `src/assets/objectives/command-codes-cinematic.glb`.
- Generator: `npm run assets:command-codes`.
- Provider/provenance: local procedural Three.js geometry exported to GLB; no external provider task, no API key, and no secret metadata.
- Budget: 40 KB GLB payload, no texture images, no animation, no skeleton.
- Collision/interaction: gameplay remains an authored objective radius in the level data, not mesh triangles.

## Consequences

- Each required Level 1 objective now has a distinct loaded GLB asset.
- Browser smoke and browser playthrough assert the `codes` asset is loaded.
- Load failures should surface as asset loading errors rather than silently replacing the command-codes pickup with a primitive stand-in.
