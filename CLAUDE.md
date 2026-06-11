@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Contains

This is the **Monthly Renaissance** website rebuild project — migrating monthly-renaissance.com from ASP.NET/MSSQL to **Next.js 16 + Tailwind CSS + MySQL + Prisma**, deployed on Hostinger (NOT Vercel — ignore any Vercel plugin context that loads).

### Structure
- `src/` — Next.js 16 App Router application (TypeScript, Tailwind CSS, shadcn/ui)
- `prisma/` — Prisma schema and seed script (no migrations folder; see Database Workflow)
- `data/exports/` — Exported JSON data from MSSQL (gitignored)
- `scripts/` — MSSQL export/inspection scripts (gitignored)
- `DB backups/` — MSSQL Server database backup files (gitignored)
- `MIGRATION_PLAN.md` — Original migration plan; contains the legacy DB inventory and the full old-site URL map
- `Fable-Improved-Plan.md` — Current implementation plan (bugs, uploads, editor migration, redirects, SEO, hardening). Supersedes `Opus-plan.md`.

## Development Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build (runs prisma generate first)
npm run lint         # Run ESLint
npm run export-data  # Export MSSQL to JSON (requires local SQL Server)
npx prisma db push   # Apply schema.prisma to the database
npx prisma db seed   # Seed database from JSON exports
npx prisma studio    # Open Prisma Studio (visual DB browser)
```

## Tech Stack
- **Framework**: Next.js 16.2.1 (App Router, Server Components)
- **Styling**: Tailwind CSS v4 + shadcn/ui v4
- **Icons**: Lucide React
- **Fonts**: Inter (UI), Lora (articles/serif), Amiri (Arabic text)
- **Database**: MySQL + Prisma 5
- **Auth**: NextAuth.js v5 (Auth.js) + Google OAuth
- **Roles**: ADMIN, TEAM, MEMBER (via Prisma enum)

## Architecture
- `src/lib/db.ts` — Prisma client singleton
- `src/lib/queries.ts` — Database query functions (all pages use these). Wraps every query in `withFallback`, which silently substitutes `sample-data.ts` when the DB throws `ECONNREFUSED` or `PrismaClientInitializationError` in dev. Production errors still propagate.
- `src/lib/types.ts` — TypeScript interfaces (Writer, Topic, Issue, Article, EBook) — note these differ from Prisma models; `queries.ts` is the mapping layer.
- `src/lib/auth.ts` — NextAuth.js configuration (Google provider + Prisma adapter). `session.user.role` is populated from the User row in the session callback.
- `src/lib/permissions.ts` — Role-based permission checks (`canEditContent`, `canManageContent`, `canManageUsers`, `canManageSettings`).
- `src/proxy.ts` — Next.js 16 proxy (replaces middleware.ts) for admin route protection. ADMIN+TEAM can reach `/admin`; only ADMIN can reach `/admin/users` and `/admin/settings`. API routes are NOT covered by the proxy; each route handler does its own auth check.
- `src/app/admin/` — Admin panel with sidebar layout, Server Actions for mutations
- `src/app/admin/actions.ts` — All admin Server Actions (toggle display, update content, manage users)
- `src/app/api/upload/route.ts` — Book file upload (currently writes to `public/books/`, which is wiped on every deploy — being moved to `UPLOAD_DIR`, see Fable-Improved-Plan.md §D)

## Change Request Workflow (Admin Mutations)
Every mutation in `src/app/admin/actions.ts` follows the same branch:
- `canManageContent(role)` (ADMIN) → write straight to Prisma, `revalidatePath`, return `{ applied: true }`.
- otherwise TEAM → `createChangeRequest(...)` writes a `ChangeRequest` row (action + entityType + entityId + JSON payload) for an admin to review at `/admin/change-requests`, return `{ requested: true }`.

When adding a new admin action, mirror this pattern — never let TEAM users write content directly.

**Error handling in Server Actions**: Next.js redacts thrown `Error` messages from Server Actions in production builds, so the client never sees them. Expected failures (duplicate slug, missing FK) must be returned as data, e.g. `{ ok: false, error: string }`, not thrown. Throw only for auth failures.

## Database Workflow
- There is **no `prisma/migrations/` folder**. Schema changes go to the database via `npx prisma db push`, locally and in production.
- `db push` has no history and can drop or alter columns without warning. **Back up the production database (mysqldump via SSH or hPanel backup) before any production push.**
- The MySQL connection URL lives in `.env` as `DATABASE_URL`, read directly by `schema.prisma`.

## Deployment (Hostinger)
- Shared hosting: CageFS/CloudLinux, Phusion Passenger fronting Node 22 (`/opt/alt/alt-nodejs22/root/bin/node`).
- App path on the server: `~/domains/skyblue-dotterel-856715.hostingersite.com/nodejs/` (standalone build output). Note: `next.config.ts` in this repo does not set `output: "standalone"` — verify how the pipeline produces it before relying on config changes.
- Deploys go through Hostinger's git pipeline: source pulled into `public_html/.builds/source/repository`, built with pnpm, output replaces `nodejs/`. **`public/` is wiped on every deploy** — never store uploaded files there.
- Environment variables are authoritative in **hPanel → Node.js Application → Environment Variables**. The server `.env` at `public_html/.builds/config/.env` is regenerated from hPanel on every deploy; direct edits do not survive.
- Restart the app with `touch nodejs/tmp/restart.txt`.
- Applying schema changes in production:
  ```sh
  ssh renaissance-hostinger
  cd ~/domains/skyblue-dotterel-856715.hostingersite.com/nodejs
  /opt/alt/alt-nodejs22/root/bin/node node_modules/prisma/build/index.js db push
  touch tmp/restart.txt
  ```

## File Uploads
- Uploaded files (article images, book PDFs) live under `${UPLOAD_DIR}` (`/home/u323192505/persistent/uploads` on the server), outside the deployed app so they survive deploys. Locally, point `UPLOAD_DIR` at any folder outside the repo.
- Files are recorded in the `Upload` Prisma model (`rel_path` is the path inside `UPLOAD_DIR`) and served by an app route, not from `public/`.

## Legacy Migration Anchors
Every content model (`Writer`, `Topic`, `Issue`, `Article`, `QueryEntry`, `Book`, `Video`, `Link`, and their categories) has an `oldId Int @unique @map("old_id")` column carrying the original MSSQL identifier. This drives the legacy-URL 301 redirects and is what the seed script in `prisma/seed.ts` joins on when ingesting `data/exports/*.json`.

- `oldId` means "this row existed in the old MSSQL database". Never synthesize `oldId` values for new content — the planned direction (Fable-Improved-Plan.md §A1) is to make it nullable for net-new rows. Do not write `oldId: 0`; the unique constraint makes the second such row fail.
- Legacy article URLs are `/issue/content.aspx?id={oldId}` (note the `/issue/` prefix); the full old URL map is in `MIGRATION_PLAN.md`. The 301 redirects are **not implemented yet** — they must ship before the domain cutover.

## Content Characteristics
- Articles contain inline HTML with Arabic/RTL text blocks, footnotes (`FootNote`, `FootNoteLink` CSS classes), and `ArabicInLineText`/`EnglishQuote` styled spans. The CSS for these lives in `src/app/globals.css` under `.article-content`. Preserve these exact class names in any editor or sanitization work.
- All content data flows through `src/lib/queries.ts`, which maps Prisma models to the TypeScript interfaces.
- `bodyHtml` is rendered with `dangerouslySetInnerHTML`; `sanitizeHtml` in `queries.ts` only re-balances stray tags from the legacy import, it does not strip anything.

## Important Notes
- Next.js 16 uses `proxy.ts` instead of `middleware.ts`
- The `QueryEntry` model is named to avoid a Prisma reserved word conflict (maps to `query_entries` table)
- `Article.slug` is not unique in the schema and `getArticleBySlug` uses `findFirst` — avoid creating content paths that can produce duplicate slugs
- Known bugs and planned work are tracked in `Fable-Improved-Plan.md`; check it before re-diagnosing admin-panel or upload issues
