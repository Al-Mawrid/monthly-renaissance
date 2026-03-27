@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Contains

This is the **Monthly Renaissance** website rebuild project — migrating monthly-renaissance.com from ASP.NET/MSSQL to **Next.js 15 + Tailwind CSS + PostgreSQL + Prisma**, deployed on Vercel.

### Structure
- `src/` — Next.js 15 App Router application (TypeScript, Tailwind CSS, shadcn/ui)
- `DB backups/` — MSSQL Server database backup files (`.bak`) exported from Plesk hosting
- `MIGRATION_PLAN.md` — Full migration plan

### Database Backups (in `DB backups/`)
- `MonthlyRenaissance_2026-03-27_10-50-39.bak` — Main site database (~117 MB). Contains 35 years of articles, issues, authors, topics, queries, and e-books.
- `asd_2026-03-27_12-20-10/` — Additional database export
- `renai3_mnmtesting_2026-03-27_12-33-06/` — Additional database export (testing DB)

## Development Commands
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
```

## Tech Stack
- **Framework**: Next.js 15 (App Router, Server Components)
- **Styling**: Tailwind CSS v4 + shadcn/ui v4
- **Icons**: Lucide React
- **Fonts**: Inter (UI), Lora (articles/serif), Amiri (Arabic text)
- **Database** (upcoming): PostgreSQL + Prisma

## Content Characteristics
- Articles contain inline HTML with Arabic/RTL text blocks, footnotes (`FootNote`, `FootNoteLink` CSS classes), and `ArabicInLineText`/`EnglishQuote` styled spans
- Old URL pattern: `content.aspx?id={id}` — must generate 301 redirects for SEO preservation
- Currently using static sample data in `src/lib/data.ts` — will be replaced with real DB data
