# TODO - User Steps to Complete Setup

Everything below is what **you** need to do. All code, schema, pages, auth, and admin panel are already built by Claude.

---

## 1. Install PostgreSQL (pick ONE)

### Option A: Docker (Recommended - easiest)
```bash
docker run -d --name mr-postgres -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=monthly_renaissance postgres
```

### Option B: Windows Installer
1. Download from https://www.postgresql.org/download/windows/
2. Run installer, set password to `password` (or whatever you prefer)
3. Create database: open pgAdmin or run:
   ```bash
   psql -U postgres -c "CREATE DATABASE monthly_renaissance;"
   ```

### Option C: Chocolatey
```bash
choco install postgresql
```

- [ ] PostgreSQL is running and `monthly_renaissance` database exists

---

## 2. Update `.env` with your PostgreSQL password

Open `.env` and update the DATABASE_URL if your password is different:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/monthly_renaissance?schema=public"
```

- [ ] `.env` has correct DATABASE_URL

---

## 3. Tell Claude to run database setup

Once PostgreSQL is running, tell me:
> "PostgreSQL is ready, run migrations and seed"

I will run:
- `npx prisma migrate dev --name init` (creates all tables)
- `npx prisma db seed` (imports 5,000+ records from JSON exports)

- [ ] Database migrated and seeded

---

## 4. Set up Google OAuth (for authentication)

1. Go to https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Go to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add authorized redirect URI:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
7. Copy the **Client ID** and **Client Secret**
8. Paste them in `.env`:
   ```
   AUTH_GOOGLE_ID="your-client-id-here"
   AUTH_GOOGLE_SECRET="your-client-secret-here"
   ```

> **Note:** You also need to configure the OAuth consent screen (APIs & Services > OAuth consent screen). Set it to "External" for testing, add your email as a test user.

- [ ] Google OAuth credentials added to `.env`

---

## 5. Generate AUTH_SECRET

Run this in your terminal:
```bash
npx auth secret
```
It will add `AUTH_SECRET` to your `.env` file automatically.

Or generate manually:
```bash
openssl rand -base64 32
```
Then paste it in `.env` as `AUTH_SECRET="the-generated-value"`

- [ ] AUTH_SECRET is set in `.env`

---

## 6. Start the app

```bash
npm run dev
```

- [ ] App is running at http://localhost:3000

---

## 7. Make yourself Admin

1. Sign in with Google at http://localhost:3000/signin
2. Open Prisma Studio:
   ```bash
   npx prisma studio
   ```
3. Go to the `users` table
4. Find your account, change `role` from `MEMBER` to `ADMIN`
5. Save
6. Go to http://localhost:3000/admin

- [ ] You are an ADMIN and can access /admin

---

## Summary of what's already done (by Claude)

| Component | Status |
|-----------|--------|
| MSSQL data exported to JSON (12 tables, 5K+ records) | Done |
| Prisma schema (14 models + auth tables) | Done |
| Database seed script (slug gen, HTML cleanup, FK mapping) | Done |
| Query layer (`src/lib/queries.ts` - 25+ functions) | Done |
| All 11 pages migrated to database queries | Done |
| Google Auth (NextAuth v5 + Prisma adapter) | Done |
| Route protection (`proxy.ts` for /admin) | Done |
| Sign-in page, unauthorized page, user menu | Done |
| Admin panel (10 pages + sidebar layout) | Done |
| Server Actions for all admin mutations | Done |
| Role-based access (ADMIN/TEAM/MEMBER) | Done |
| CLAUDE.md updated with new architecture | Done |

---

## Order of operations

```
Step 1 --> Install PostgreSQL
Step 2 --> Update .env
Step 3 --> Tell Claude to run migrations + seed
Step 4 --> Set up Google OAuth  (can be done in parallel with Step 3)
Step 5 --> Generate AUTH_SECRET  (can be done in parallel with Step 3)
Step 6 --> npm run dev
Step 7 --> Sign in + promote to Admin
```

Steps 3-5 can happen in any order. Steps 1-2 must be first.
