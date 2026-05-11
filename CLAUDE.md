@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Contains

This is the **Monthly Renaissance** website rebuild project — migrating monthly-renaissance.com from ASP.NET/MSSQL to **Next.js 16 + Tailwind CSS + MySQL + Prisma**, deployed on Hostinger.

### Structure
- `src/` — Next.js 16 App Router application (TypeScript, Tailwind CSS, shadcn/ui)
- `prisma/` — Prisma schema and seed script
- `data/exports/` — Exported JSON data from MSSQL (gitignored)
- `scripts/` — MSSQL export/inspection scripts (gitignored)
- `DB backups/` — MSSQL Server database backup files (gitignored)
- `MIGRATION_PLAN.md` — Full migration plan

## Development Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint
npm run export-data  # Export MSSQL to JSON (requires local SQL Server)
npx prisma migrate dev  # Run database migrations
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
- `src/proxy.ts` — Next.js 16 proxy (replaces middleware.ts) for admin route protection. ADMIN+TEAM can reach `/admin`; only ADMIN can reach `/admin/users` and `/admin/settings`.
- `src/app/admin/` — Admin panel with sidebar layout, Server Actions for mutations
- `src/app/admin/actions.ts` — All admin Server Actions (toggle display, update content, manage users)

## Change Request Workflow (Admin Mutations)
Every mutation in `src/app/admin/actions.ts` follows the same branch:
- `canManageContent(role)` (ADMIN) → write straight to Prisma, `revalidatePath`, return `{ applied: true }`.
- otherwise TEAM → `createChangeRequest(...)` writes a `ChangeRequest` row (action + entityType + entityId + JSON payload) for an admin to review at `/admin/change-requests`, return `{ requested: true }`.

When adding a new admin action, mirror this pattern — never let TEAM users write content directly.

## Legacy Migration Anchors
Every content model (`Writer`, `Topic`, `Issue`, `Article`, `QueryEntry`, `Book`, `Video`, `Link`, and their categories) has a `oldId Int @unique @map("old_id")` column carrying the original MSSQL identifier. This is what drives the `content.aspx?id={id}` → new-URL 301 redirects and what the seed script in `prisma/seed.ts` joins on when ingesting `data/exports/*.json`. Preserve `oldId` on any new content-table work.

## Content Characteristics
- Articles contain inline HTML with Arabic/RTL text blocks, footnotes (`FootNote`, `FootNoteLink` CSS classes), and `ArabicInLineText`/`EnglishQuote` styled spans
- Old URL pattern: `content.aspx?id={id}` — must generate 301 redirects for SEO preservation
- All content data flows through `src/lib/queries.ts` which maps Prisma models to the TypeScript interfaces

## Important Notes
- Next.js 16 uses `proxy.ts` instead of `middleware.ts`
- `prisma.config.ts` declares the schema path; the MySQL connection URL lives in `.env` as `DATABASE_URL` and is read by `schema.prisma`
- The `QueryEntry` model is named to avoid Prisma reserved word conflict (maps to `query_entries` table)
