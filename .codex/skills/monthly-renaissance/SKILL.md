---
name: monthly-renaissance
description: Project-specific operating guide for work in the Monthly Renaissance repository. Use when Codex is making code, content, schema, deployment, or admin-panel changes in this repo so it follows the site's architecture, data migration constraints, Hostinger deployment model, and existing content handling rules.
---

# Monthly Renaissance

Read `references/project-guide.md` at the start of repo work when implementation details, deployment assumptions, data rules, or admin behavior matter.

## Focus areas

- Prefer existing query-layer and permission patterns over adding parallel paths.
- Treat imported legacy content and redirects as migration-sensitive.
- Keep upload and deployment behavior aligned with Hostinger constraints.

## Immediate rules

- Use `src/lib/queries.ts` as the content mapping layer. Do not bypass it casually.
- Mirror the admin change-request workflow for any new TEAM-capable mutation.
- Return expected Server Action failures as structured data, not thrown errors.
- Do not store persistent uploads in `public/`.
- Do not invent `oldId` values for net-new content.

## Validation cues

- Run `npm run lint` for code changes.
- Run `npm run build` when changing shared behavior, typing, config, or route structure.
- Run `npm run roundtrip` when changing Tiptap import/export or legacy HTML cleanup behavior.
