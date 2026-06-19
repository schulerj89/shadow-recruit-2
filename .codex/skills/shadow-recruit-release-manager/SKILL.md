---
name: shadow-recruit-release-manager
description: Manage Shadow Recruit 2 change bucketing, SemVer decisions, changelog updates, validation gates, version bumps, commits, and pushes. Use when Codex must classify work as major/minor/patch, update CHANGELOG.md, decide whether a version source exists, bump versions, prepare release commits, or ensure commit-and-push happens after versioned work.
---

# Shadow Recruit Release Manager

## Release Contract

Use this skill whenever a request includes multiple changes, changelog work, versioning, release notes, commits, or pushes. This skill owns the process; feature expertise still belongs to the matching Three.js specialist.

## Bucket Rules

Classify each discrete change before implementation:

- **Major:** breaking project, save-data, public API, asset-schema, toolchain, workflow, or compatibility change.
- **Minor:** new backwards-compatible skill, feature, system, level, asset capability, command, workflow capability, or production pipeline.
- **Patch:** bug fix, docs/rules update, tuning, validation, cleanup, typo, narrow refactor, or backwards-compatible refinement.

Do not mix unrelated buckets in one version bump. Split the work and finish one bucket at a time.

## Changelog Rules

- Always update `CHANGELOG.md` for user-visible, workflow, skill, tooling, or game changes.
- Keep unreleased work under `## Unreleased`, grouped by `### Major`, `### Minor`, and `### Patch` as needed.
- Use concise, human-readable entries. Do not paste git logs.
- When a version source exists and a bump is made, move the relevant entries to the versioned section with date, then recreate `Unreleased`.

## Version And Push Rules

1. Find the version source first: `package.json`, app manifest, plugin manifest, or project-specific version file.
2. If there is no version source, record the bucket in the changelog and say no bump was possible.
3. If a version bump is made, validate, commit, and push immediately after the bump, even when more todos remain.
4. The commit must include the version source and `CHANGELOG.md`.
5. Keep unrelated dirty work out of release commits.

## Validation Gate

Before commit:

- Run relevant skill validators for skill changes.
- Run code tests/builds once the app exists.
- Run browser smoke and screenshots for player-facing changes.
- Run `git diff --check`.
- Scan for secrets and TODO placeholders when adding skills, scripts, or docs.

## Handoffs

- Route feature implementation to the relevant specialist skill first.
- Use this skill again before committing, bumping, or pushing.

## References

Read `references/sources.md` for SemVer, changelog, npm, and GitHub workflow source notes.
