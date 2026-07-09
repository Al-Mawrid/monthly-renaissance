# Monthly Renaissance Project Guide

## Repository purpose

This repository is the Monthly Renaissance website rebuild: migrating `monthly-renaissance.com` from ASP.NET/MSSQL to Next.js 16, Tailwind CSS, MySQL, and Prisma, deployed on Hostinger rather than Vercel.

## Main structure

- `src/`: Next.js 16 App Router app in TypeScript
- `prisma/`: schema and seed script; no migrations folder
- `data/exports/`: MSSQL JSON exports used by the seed flow
- `scripts/`: export, inspection, roundtrip, and migration utility scripts
- `MIGRATION_PLAN.md`: legacy database inventory and old URL map
- `Fable-Improved-Plan.md`: current implementation plan and known issues

## Core stack

- Framework: Next.js 16.2.1
- Styling: Tailwind CSS v4 and shadcn/ui
- Icons: Lucide React
- Database: MySQL with Prisma 5
- Auth: NextAuth.js v5 / Auth.js with Google OAuth
- Roles: `ADMIN`, `TEAM`, `MEMBER`

## Important application architecture

- `src/lib/db.ts`: Prisma singleton
- `src/lib/queries.ts`: all public data access and mapping from Prisma models to app types
- `src/lib/types.ts`: app-facing TypeScript interfaces, distinct from Prisma models
- `src/lib/auth.ts`: Auth.js config; `session.user.role` is populated here
- `src/lib/permissions.ts`: role checks
- `src/proxy.ts`: Next.js 16 proxy for admin-route protection
- `src/app/admin/actions.ts`: admin Server Actions and mutation patterns
- `src/app/api/upload/route.ts`: current book upload route

## Query and fallback behavior

Pages are expected to get content through `src/lib/queries.ts`. That file wraps queries in `withFallback`, which swaps to `sample-data.ts` during local development when the database is unavailable. Do not casually reimplement direct Prisma reads in page code when equivalent query helpers already exist.

## Admin mutation workflow

Every mutation in `src/app/admin/actions.ts` follows the same split:

- `ADMIN`: write directly, revalidate, return applied result
- `TEAM`: write a `ChangeRequest` row instead of mutating content directly

When adding a new mutation that TEAM users can trigger, preserve this behavior. TEAM users must not write content directly.

## Server Action error handling

Expected business failures must be returned as data, for example `{ ok: false, error: string }`. Do not throw ordinary validation or duplicate-slug style errors from Server Actions because production builds redact thrown messages. Reserve thrown errors for auth failures and truly exceptional cases.

## Database workflow

- There is no `prisma/migrations/` directory.
- Schema changes go out through `npx prisma db push`.
- `db push` has no migration history and can make destructive changes.
- Production pushes require a database backup first.
- `DATABASE_URL` comes from `.env` and is read by `schema.prisma`.

## Deployment constraints

- Hosting is Hostinger shared hosting with Passenger and Node 22.
- Deploys go through Hostinger's git pipeline.
- `public/` is wiped on every deploy.
- Environment variables are managed in hPanel and regenerated on deploy.
- Restart is done with `touch nodejs/tmp/restart.txt`.
- `next.config.ts` intentionally does not set `output: "standalone"` because the Hostinger pipeline assembles that output itself.

## Upload rules

Persistent uploads must live under `UPLOAD_DIR`, outside the deployed app tree. Files are tracked through the `Upload` Prisma model and served by the app. Do not add new upload flows that write durable files to `public/`.

## Legacy migration anchors

Legacy content rows carry `oldId`, mapped from MSSQL identifiers. This is used for seeding and planned legacy URL redirects.

- `oldId` means the record existed in the old database.
- Do not synthesize `oldId` for newly created content.
- Do not use `oldId: 0`; uniqueness will fail as soon as a second row does the same.
- Legacy article URLs follow `/issue/content.aspx?id={oldId}`.

## Content handling rules

- Imported article bodies contain inline HTML, Arabic/RTL blocks, and footnotes.
- Preserve CSS class names such as `FootNote`, `FootNoteLink`, `ArabicInLineText`, and `EnglishQuote`.
- `bodyHtml` is rendered with `dangerouslySetInnerHTML`.
- The current `sanitizeHtml` behavior rebalances legacy markup; it is not a full sanitizer.

## Current validation commands

- `npm run dev`
- `npm run lint`
- `npm run build`
- `npm run export-data`
- `npx prisma db push`
- `npx prisma db seed`
- `npm run roundtrip`

Use `npm run roundtrip` when changing editor import/export, legacy HTML cleanup, or Tiptap translation logic.
