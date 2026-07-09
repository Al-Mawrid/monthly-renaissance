---
name: commit-changes
description: Prepare clean commits for the Monthly Renaissance repo using small logical groups, conventional commit messages, and conservative version bumping. Use when Codex is explicitly asked to commit work in this repository.
---

# Commit Changes

Use this only when the user explicitly asks for a commit.

## Workflow

1. Inspect `git status --short`.
2. Inspect diffs for the files relevant to the requested work.
3. Separate unrelated changes from the requested change set.
4. Group the requested changes into the smallest sensible logical commits.
5. Stage only the files for the current logical group.
6. Commit with a specific conventional-style message.

## Commit style

Prefer:

- `feat(scope): add ...`
- `fix(scope): correct ...`
- `refactor(scope): simplify ...`
- `docs(scope): update ...`
- `chore(scope): adjust ...`

Use a scope that matches the repo area, for example `admin`, `articles`, `uploads`, `auth`, `prisma`, `editor`, or `docs`.

## Versioning

The root package version lives in `package.json`. Do not bump it automatically for every commit.

Only change the version when the user asked for a release/version bump or when the repository already follows that step as part of the requested workflow.

## Guardrails

- Do not sweep unrelated user changes into the commit.
- Do not rewrite or revert user work to make commit grouping easier.
- Keep docs-only changes out of code commits unless the docs are inseparable from the change.
- Avoid mixing schema changes, UI changes, and deployment changes in one commit unless they are one objective.

## Pre-commit checks

Before committing, run the smallest validation that matches the change:

- at minimum `npm run lint` for code changes
- add `npm run build` for shared or risky changes
- add `npm run roundtrip` for editor or content transformation changes

If validation cannot be run, state that clearly before committing.
