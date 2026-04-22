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
- `src/lib/queries.ts` — Database query functions (all pages use these)
- `src/lib/types.ts` — TypeScript interfaces (Writer, Topic, Issue, Article, EBook)
- `src/lib/auth.ts` — NextAuth.js configuration (Google provider + Prisma adapter)
- `src/lib/permissions.ts` — Role-based permission checks
- `src/proxy.ts` — Next.js 16 proxy (replaces middleware.ts) for admin route protection
- `src/app/admin/` — Admin panel with sidebar layout, Server Actions for mutations
- `src/app/admin/actions.ts` — All admin Server Actions (toggle display, update content, manage users)

## Content Characteristics
- Articles contain inline HTML with Arabic/RTL text blocks, footnotes (`FootNote`, `FootNoteLink` CSS classes), and `ArabicInLineText`/`EnglishQuote` styled spans
- Old URL pattern: `content.aspx?id={id}` — must generate 301 redirects for SEO preservation
- All content data flows through `src/lib/queries.ts` which maps Prisma models to the TypeScript interfaces

## Important Notes
- Next.js 16 uses `proxy.ts` instead of `middleware.ts`
- `prisma.config.ts` declares the schema path; the MySQL connection URL lives in `.env` as `DATABASE_URL` and is read by `schema.prisma`
- The `QueryEntry` model is named to avoid Prisma reserved word conflict (maps to `query_entries` table)
