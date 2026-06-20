# Completion Stats Contract

## Decision

Expose completion stats through the completion overlay and `window.__shadowRecruitDebug.captureTesterState()` so QA can prove the level ended with visible stats and the triumphant completion cue.

## Stats

- `elapsedSeconds`
- `objectivesCompleted`
- `objectivesTotal`
- `alerts`
- `performanceProfile`
- `triumphantCue`

## QA

- Browser smoke now checks the completion overlay test IDs and the `data-completion-cue="triumphant"` marker.
- Browser playthrough now asserts the final tester state includes active completion stats and a triumphant cue.
- Versioned screenshots still capture `complete.png` for manual review.
