# Tutorial Briefing Copy Contract

## Decision

Every General Caldwell tutorial text box must end with `Good luck, cadet.` rather than reserving that sign-off only for the final extraction briefing.

## Reasoning

The game goal asks for each briefing text box to align with the target being shown and for the General to always end with a "good luck cadet" style line. Keeping the sign-off in every tutorial step makes that requirement testable and consistent.

## QA

- `scripts/browser-smoke.ts` now asserts every tutorial step ends with `Good luck, cadet.`
- Versioned screenshots still capture all five tutorial steps for manual review.
