---
name: test-and-fix
description: Run validation for the Monthly Renaissance repo, diagnose failures, apply fixes, and iterate efficiently. Use when Codex needs to lint, build, or verify editor roundtrip behavior after code changes in this repository.
---

# Test And Fix

This repository does not have a broad automated test suite wired into `package.json`. Validation is centered on linting, production build checks, and the Tiptap roundtrip script when editor or legacy HTML handling changes.

## Primary commands

- `npm run lint`
- `npm run build`
- `npm run roundtrip`

## When to run what

- Run `npm run lint` for any code change.
- Run `npm run build` for changes that affect types, routing, config, auth, data flow, or shared components.
- Run `npm run roundtrip` when changing:
  - Tiptap editor code
  - import/export transformations
  - legacy HTML cleanup
  - article body parsing or serialization

## Workflow

1. Read the changed files and decide which validation set applies.
2. Run the relevant commands.
3. Collect all failures before editing.
4. Fix root causes in batches.
5. Re-run only the failed validations.
6. Finish with a final pass of the commands that match the change surface.

## Repo-specific failure patterns

### Lint

- unused imports or variables
- client/server boundary mistakes
- accidental dead code from admin-panel changes

### Build

- Next.js route or Server Component typing issues
- Prisma type drift
- auth/session typing regressions
- path or import mistakes

### Roundtrip

- lost HTML structure from legacy content
- dropped footnote markup or custom class names
- Arabic/RTL fragments changing shape
- editor serialization producing noisy or unstable diffs

## Fixing guidance

- Prefer fixing production code over weakening validation.
- Preserve legacy-content class names and semantics.
- When build and lint both fail, fix build-shaping issues first.
- When roundtrip fails, inspect the transformation layer before touching fixtures or expected output.

## Reporting

Summarize:

- commands run
- pass/fail state
- files changed to fix issues
- any remaining blockers or unverified areas
