# Monthly Renaissance

Website for **Monthly Renaissance**, the Islamic scholarship journal published by Al-Mawrid from Lahore since 1991. This repository is the rebuild of [monthly-renaissance.com](https://www.monthly-renaissance.com), migrating 35 years of content (2,000+ articles, 900+ Q&A entries, 400+ issues) from a legacy ASP.NET/MSSQL site to Next.js and MySQL, deployed on Hostinger.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | MySQL via Prisma 5 |
| Auth | NextAuth.js v5 (Auth.js) with Google OAuth |
| Fonts | Inter (UI), Lora (articles), Amiri (Arabic text) |
| Hosting | Hostinger (Phusion Passenger + Node 22, standalone build) |

## Getting started

Prerequisites: Node 20+. A local MySQL server is optional: for a quick local
check, the development server can use the same MySQL database as the deployed
site (see [Testing locally with the deployed database](#testing-locally-with-the-deployed-database)).

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — MySQL connection string
   - `DATABASE_CONNECTION_LIMIT` — optional per-process Prisma pool cap (defaults to `1` for shared hosting)
   - `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` — Auth.js + Google OAuth credentials
   - `UPLOAD_DIR` — absolute path to a directory outside the repo for uploaded files

3. Create the schema. This project uses `db push` (there is no migrations folder):

   ```bash
   npx prisma db push
   ```

4. Seed the database. The seed reads JSON exports from `data/exports/`, which are gitignored; they are produced by `npm run export-data` against a locally restored MSSQL backup (see `MIGRATION_PLAN.md`). Without the exports the site still runs in dev using built-in sample data.

   ```bash
   npx prisma db seed
   ```

5. Start the dev server:

   ```bash
   npm run dev
   ```

If the database is unreachable in dev, pages fall back to sample data from `src/lib/sample-data.ts` instead of erroring, so the front end is browsable without a database at all.

### Testing locally with the deployed database

To reproduce the deployed site locally, use the production database connection
string from Hostinger rather than a localhost MySQL URL:

1. In Hostinger hPanel, open the site's Node.js/environment-variable settings
   and copy the exact value of `DATABASE_URL`. Do not commit it or paste it into
   an issue or chat.
2. Put that value in your local `.env` as `DATABASE_URL`. Keep
   `DATABASE_CONNECTION_LIMIT="1"` so local development does not open an
   unnecessarily large pool on shared hosting.
3. Set `AUTH_URL="http://localhost:3000"`. If Google sign-in is needed, add
   `http://localhost:3000/api/auth/callback/google` to the Google OAuth client's
   authorized redirect URIs; otherwise use the deployed site for sign-in.
4. Set `UPLOAD_DIR` to a local directory outside this repository. Do not point
   local uploads at the production upload directory.
5. Start the site:

   ```bash
   npm run dev
   ```

This makes local Prisma reads use the deployed database, but it does not copy
the database locally. Treat the database as shared production data: avoid
running seed scripts, destructive admin actions, or ad-hoc writes while testing.
Never run `npx prisma db push` against this URL just to make local development
work. This repository has no migration history, and `db push` can change or
remove production columns. Back up the database and coordinate a deployment if
the remote schema genuinely needs to change.

#### If `research_group_id` does not exist

That error means the checkout is newer than the schema currently used by the
deployed site. The safe choices are:

- Check out the same commit currently deployed on Hostinger and test that
  version against the deployed database; or
- Deploy the code and its Prisma schema change through the normal release
  process, take a database backup first, then run the planned schema update on
  Hostinger and restart Passenger.

Do not solve this by pointing the local app at production and running `db push`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm run lint` | ESLint |
| `npm run export-data` | Export the legacy MSSQL database to JSON (requires local SQL Server) |
| `npx prisma db push` | Apply `schema.prisma` to the database |
| `npx prisma db seed` | Seed from `data/exports/*.json` |
| `npx prisma studio` | Visual database browser |

## Project structure

```
src/app/            Public pages (articles, issues, queries, ebooks, search)
src/app/admin/      Admin panel (articles, issues, queries, books, users, change requests)
src/app/api/        Route handlers (auth, search, uploads)
src/components/     Layout, article, and shadcn/ui components
src/lib/            Prisma client, query layer, auth, permissions, types
src/proxy.ts        Route protection for /admin (Next.js 16 proxy)
prisma/             Schema and seed script
data/exports/       Legacy MSSQL JSON exports (gitignored)
DB backups/         Legacy MSSQL .bak files (gitignored)
```

## Roles and the admin panel

Signing in with Google creates a `MEMBER` user. An `ADMIN` promotes users at `/admin/users`:

- **ADMIN** — full access; content writes apply immediately.
- **TEAM** — can use the admin panel, but every mutation becomes a `ChangeRequest` an admin reviews at `/admin/change-requests`.
- **MEMBER** — public site only.

## Deployment

The site deploys through Hostinger's git pipeline to shared hosting (Passenger + Node 22). Things to know:

- Environment variables are managed in hPanel; the server's `.env` is regenerated from hPanel on every deploy, so direct edits to it do not survive.
- Prisma reuses one client per Passenger process and defaults to one database connection per process. Set `DATABASE_CONNECTION_LIMIT` in hPanel only if the database plan can sustain a larger pool.
- `public/` is wiped on every deploy. Uploaded files live outside the app in the directory pointed to by `UPLOAD_DIR` and are served through the app, never from `public/`.
- Schema changes are applied on the server with `prisma db push` after the code deploys, followed by `touch tmp/restart.txt` to restart Passenger. Take a database backup first; `db push` has no migration history.

Full mechanics are in `.codex/skills/monthly-renaissance/references/project-guide.md` and `Fable-Improved-Plan.md`.

## Documentation

- `MIGRATION_PLAN.md` — the original migration plan: legacy database inventory, old URL structure, content mapping.
- `Fable-Improved-Plan.md` — the current implementation plan: open bugs, uploads infrastructure, editor migration, redirects, SEO, hardening.
- `.codex/skills/monthly-renaissance/` — Codex project guidance and repo-specific workflow references.
- `CLAUDE.md` / `AGENTS.md` — legacy Claude guidance and repo agent notes.
