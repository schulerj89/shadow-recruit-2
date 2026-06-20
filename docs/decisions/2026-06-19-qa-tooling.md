# QA Tooling Decision

Date: 2026-06-19

## Decision

Start Shadow Recruit 2 with a strict QA spine: scripted playthrough validation, browser smoke screenshots, nonblank canvas checks, debug-state assertions, FPS metrics, screenshot capture, and a game-tester report skill.

## Debug API Contract

Expose:

- `ready`
- `phase`
- `missionId`
- `missions`
- `settings`
- `tutorialStep`
- `cinematicFocus`
- `playerPosition`
- `playerVisible`
- `enemies`
- `objectives`
- `doors`
- `rendererMetrics`
- `framePacing`
- `memoryMetrics`
- `movePlayerTo`
- `collectObjective`
- `forceAlert`
- `forceFailure`
- `forceSuccess`
- `resetMission`
- `captureTesterState`

## Scripts

- `npm run test:playthrough`
- `npm run test:browser`
- `npm run test:fps`
- `npm run screenshots`
- `npm run tester:report`

The game tester skill reviews those artifacts for player readability, objective clarity, threat clarity, camera framing, and 60 FPS evidence.
