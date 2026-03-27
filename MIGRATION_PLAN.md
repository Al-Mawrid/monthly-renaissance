# Monthly Renaissance: ASP.NET to Next.js Migration Plan

## Current State Analysis

### What We Have
- **Website**: monthly-renaissance.com (ASP.NET / MSSQL on Plesk/Windows hosting)
- **Database**: MSSQL Server backup restored locally (`MonthlyRenaissance` on `localhost\SQLEXPRESS`)
- **Content**: 35+ years of Islamic scholarship publication (1991-2026)

### Verified Database Contents (March 27, 2026)

| Table | Rows | Contains |
|-------|------|----------|
| `tblContent` | 2,017 | Articles (title, HTML body, topic, writer, translator, date) |
| `tblContentIssueLink` | 2,008 | Article-to-issue mapping |
| `tblQuery` | 921 | Q&A entries (question HTML, answer HTML, questioner, topic, writer) |
| `tblQueryIssueLink` | 913 | Query-to-issue mapping |
| `tblVideo` | 571 | YouTube video links (title, URL, category, date) |
| `tblIssue` | 408 | Issues from Jan 1991 to Mar 2026 (title, volume, number, date, special flag) |
| `tblWriter` | 237 | Writers/authors (name, email, display flag, query writer flag) — 23 displayed |
| `tblBooks` | 146 | 9 books + 128 monthly PDF ebooks (title, writer, translator, filename) |
| `tblTopic` | 48 | Topic categories — 32 displayed on site |
| `tblVideoCategory` | 24 | Video categories |
| `tblLinks` | 6 | External links |
| `tblLinkCategory` | 3 | Link categories |
| `tblAdmin` | 3 | Legacy admin users (plaintext passwords — will not migrate) |

**Data verified against live site**: Latest articles (ID 38845-38849, March 2026), all 23 writers, all 32 topics, issue range Jan 1991 — Mar 2026 all match perfectly.

**Other backups**: `AsdDB` (empty) and `Renai3Testing` (3 empty tables) — not needed.

### Current Site URL Structure
| Page | ASP.NET URL |
|------|------------|
| Current Issue | `/issue/viewissue.aspx` |
| Archives | `/issue/archives.aspx` |
| Single Issue | `/issue/viewissue.aspx?id={id}` |
| Article | `/issue/content.aspx?id={id}` |
| Articles by Writer | `/issue/writers.aspx?option=articles` |
| Articles by Topic | `/issue/topics.aspx?option=articles` |
| Queries by Writer | `/issue/writers.aspx?option=queries` |
| Queries by Topic | `/issue/topics.aspx?option=queries` |
| E-Books | `/EBooks.aspx` |
| Videos | `/Videos.aspx` |
| Static pages | `/mission.aspx`, `/team/team.aspx`, `/supportus.aspx`, `/subscription.aspx` |

---

## Target Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 15 (App Router, Server Components) | Modern React, SSR/SSG, API routes |
| **Styling** | Tailwind CSS | Rapid modern UI |
| **Database** | MySQL (Hostinger Business Plan, 3 GB max per DB) | Included with hosting — 150 DBs available |
| **ORM** | Prisma | Type-safe queries, schema migrations |
| **Auth** | NextAuth.js v5 + Google OAuth | Google-only sign-in, role-based access |
| **Hosting** | Hostinger Business (Rs 599/mo, 48-mo) | Node.js + MySQL + 50 GB NVMe + CDN + SSL |
| **Search** | MySQL FULLTEXT indexes | No extra service needed |
| **Resources** | 3 GB RAM, 2 CPUs, unlimited bandwidth | Sufficient for this site's traffic |

---

## Phase 0: Export Data from MSSQL to JSON (DONE — ready to run)

Export all tables from the restored `MonthlyRenaissance` database to JSON files in `/data/exports/`.

Script: `scripts/export-to-json.mjs` (to be created)

---

## Phase 1: MySQL Database Schema (Hostinger)

### Content Tables

```sql
-- Writers/Authors
CREATE TABLE writers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  old_id INT UNIQUE NOT NULL,          -- maps to tblWriter.ID
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(100),
  display_on_site BOOLEAN DEFAULT TRUE,
  is_query_writer BOOLEAN DEFAULT FALSE
);

-- Topics/Categories
CREATE TABLE topics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  old_id INT UNIQUE NOT NULL,          -- maps to tblTopic.ID
  title VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  display BOOLEAN DEFAULT TRUE,
  ranking TINYINT DEFAULT 0,
  display_in_list BOOLEAN DEFAULT TRUE
);

-- Issues (monthly editions)
CREATE TABLE issues (
  id INT PRIMARY KEY AUTO_INCREMENT,
  old_id INT UNIQUE NOT NULL,          -- maps to tblIssue.ID
  title VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,   -- e.g. "2026-03"
  volume_number VARCHAR(20),
  issue_number VARCHAR(20),
  issue_date DATE,
  display BOOLEAN DEFAULT TRUE,
  is_special BOOLEAN DEFAULT FALSE
);

-- Articles
CREATE TABLE articles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  old_id INT UNIQUE NOT NULL,          -- maps to tblContent.ID
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  body_html LONGTEXT,                  -- full article HTML
  topic_id INT NOT NULL,
  writer_id INT NOT NULL,
  translator_id INT,
  date_added DATE,
  display BOOLEAN DEFAULT TRUE,
  is_important BOOLEAN DEFAULT FALSE,
  is_editorial BOOLEAN DEFAULT FALSE,
  editorial_issue_id INT,
  is_issue_intro BOOLEAN DEFAULT FALSE,
  intro_issue_id INT,
  FULLTEXT INDEX ft_articles (title, body_html),
  FOREIGN KEY (topic_id) REFERENCES topics(id),
  FOREIGN KEY (writer_id) REFERENCES writers(id),
  FOREIGN KEY (translator_id) REFERENCES writers(id)
);

-- Article-Issue links (many-to-many)
CREATE TABLE article_issue_links (
  issue_id INT NOT NULL,
  article_id INT NOT NULL,
  PRIMARY KEY (issue_id, article_id),
  FOREIGN KEY (issue_id) REFERENCES issues(id),
  FOREIGN KEY (article_id) REFERENCES articles(id)
);

-- Queries (Q&A)
CREATE TABLE queries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  old_id INT UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  question_html TEXT NOT NULL,
  answer_html LONGTEXT,
  questioner VARCHAR(50),
  questioner_email VARCHAR(100),
  topic_id INT NOT NULL,
  writer_id INT NOT NULL,
  date_added DATE,
  display BOOLEAN DEFAULT TRUE,
  is_important BOOLEAN DEFAULT FALSE,
  FULLTEXT INDEX ft_queries (title, question_html, answer_html),
  FOREIGN KEY (topic_id) REFERENCES topics(id),
  FOREIGN KEY (writer_id) REFERENCES writers(id)
);

-- Query-Issue links
CREATE TABLE query_issue_links (
  issue_id INT NOT NULL,
  query_id INT NOT NULL,
  PRIMARY KEY (issue_id, query_id),
  FOREIGN KEY (issue_id) REFERENCES issues(id),
  FOREIGN KEY (query_id) REFERENCES queries(id)
);

-- Books & Ebooks
CREATE TABLE books (
  id INT PRIMARY KEY AUTO_INCREMENT,
  old_id INT UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  is_ebook BOOLEAN DEFAULT FALSE,
  is_book BOOLEAN DEFAULT FALSE,
  writer_id INT,
  translator_id INT,
  display BOOLEAN DEFAULT TRUE,
  file_name VARCHAR(255) NOT NULL,
  post_date DATE,
  FOREIGN KEY (writer_id) REFERENCES writers(id),
  FOREIGN KEY (translator_id) REFERENCES writers(id)
);

-- Videos
CREATE TABLE videos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  old_id INT UNIQUE NOT NULL,
  category_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  url VARCHAR(255) NOT NULL,
  date_added DATE,
  display BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (category_id) REFERENCES video_categories(id)
);

-- Video Categories
CREATE TABLE video_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  old_id INT UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  ranking TINYINT DEFAULT 0,
  display BOOLEAN DEFAULT TRUE
);

-- External Links
CREATE TABLE links (
  id INT PRIMARY KEY AUTO_INCREMENT,
  old_id INT UNIQUE NOT NULL,
  category_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  url VARCHAR(255) NOT NULL,
  date_added DATE,
  display BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (category_id) REFERENCES link_categories(id)
);

-- Link Categories
CREATE TABLE link_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  old_id INT UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  ranking TINYINT DEFAULT 0,
  display BOOLEAN DEFAULT TRUE
);
```

### Authentication & Authorization Tables

```sql
-- Users (Google Auth managed)
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(500),
  role ENUM('admin', 'team', 'member') DEFAULT 'member',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sessions (NextAuth.js managed)
CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  expires DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Accounts (NextAuth.js managed — stores Google OAuth tokens)
CREATE TABLE accounts (
  id VARCHAR(255) PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INT,
  token_type VARCHAR(255),
  scope VARCHAR(255),
  id_token TEXT,
  UNIQUE (provider, provider_account_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Verification tokens (NextAuth.js managed)
CREATE TABLE verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires DATETIME NOT NULL,
  PRIMARY KEY (identifier, token)
);
```

### Role-Based Permissions

| Permission | Admin | Team | Member |
|-----------|-------|------|--------|
| Manage all content (CRUD articles, issues, queries) | Yes | — | — |
| Manage users & roles | Yes | — | — |
| Manage site settings | Yes | — | — |
| Reply to queries / answer questions | Yes | Yes | — |
| Create/edit posts in assigned topics | Yes | Yes | — |
| Manage videos & books | Yes | Yes | — |
| Comment on articles | Yes | Yes | Yes |
| Submit questions (queries) | Yes | Yes | Yes |
| View published content | Yes | Yes | Yes |

---

## Phase 2: Content Migration Script

Node.js script that:
1. Connects to local MSSQL (`localhost\SQLEXPRESS` → `MonthlyRenaissance`)
2. Reads each table
3. Transforms data:
   - Generates slugs from titles
   - Cleans HTML (strip ASP.NET artifacts like `class="Paragraph"`, fix encoding)
   - Preserves Arabic/RTL blocks (`ArabicInLineText`, `unicode-bidi: embed`, `dir="rtl"`)
   - Preserves footnotes (`FootNote`, `FootNoteLink` CSS classes)
   - Maps old IDs → new IDs via `old_id` columns
4. Inserts into Hostinger MySQL
5. Generates URL redirect map

---

## Phase 3: Next.js App Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout (nav + footer)
│   ├── page.tsx                      # Home page
│   ├── (auth)/
│   │   ├── signin/page.tsx           # Google sign-in page
│   │   └── unauthorized/page.tsx     # Access denied page
│   ├── issues/
│   │   ├── page.tsx                  # Archives (all issues by year)
│   │   ├── [slug]/page.tsx           # Single issue (e.g. /issues/2026-03)
│   │   └── special/page.tsx          # Special issues
│   ├── articles/
│   │   ├── [slug]/page.tsx           # Single article view
│   │   ├── writers/
│   │   │   ├── page.tsx              # All writers
│   │   │   └── [slug]/page.tsx       # Articles by writer
│   │   └── topics/
│   │       ├── page.tsx              # All topics
│   │       └── [slug]/page.tsx       # Articles by topic
│   ├── queries/
│   │   ├── [slug]/page.tsx           # Single query view
│   │   ├── ask/page.tsx              # Submit a question (members+)
│   │   ├── writers/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   └── topics/
│   │       ├── page.tsx
│   │       └── [slug]/page.tsx
│   ├── books/page.tsx                # Books & ebooks listing
│   ├── videos/page.tsx               # Video lectures
│   ├── about/
│   │   ├── page.tsx                  # Mission
│   │   └── team/page.tsx             # Team
│   ├── support/page.tsx              # Support us
│   ├── contact/page.tsx              # Contact
│   ├── search/page.tsx               # Full-text search results
│   ├── admin/                        # Admin panel (admin role only)
│   │   ├── layout.tsx                # Admin layout with sidebar
│   │   ├── page.tsx                  # Dashboard
│   │   ├── articles/page.tsx         # Manage articles
│   │   ├── queries/page.tsx          # Manage queries
│   │   ├── issues/page.tsx           # Manage issues
│   │   ├── users/page.tsx            # Manage users & roles
│   │   └── settings/page.tsx         # Site settings
│   └── api/
│       ├── auth/[...nextauth]/route.ts  # NextAuth.js Google OAuth
│       ├── articles/route.ts
│       ├── queries/route.ts
│       ├── search/route.ts
│       └── comments/route.ts
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Navigation.tsx
│   ├── articles/
│   │   ├── ArticleCard.tsx
│   │   ├── ArticleContent.tsx        # Handles footnotes, Arabic/RTL, quotes
│   │   └── ArticleList.tsx
│   ├── auth/
│   │   ├── SignInButton.tsx
│   │   ├── UserMenu.tsx
│   │   └── RoleGuard.tsx             # Wraps protected content by role
│   ├── comments/
│   │   ├── CommentForm.tsx
│   │   └── CommentList.tsx
│   ├── search/
│   │   └── SearchBar.tsx
│   └── ui/                           # shadcn/ui primitives
├── lib/
│   ├── auth.ts                       # NextAuth config (Google provider)
│   ├── db.ts                         # Prisma client
│   └── permissions.ts                # Role-based permission checks
├── prisma/
│   └── schema.prisma                 # Full schema (content + auth tables)
└── middleware.ts                      # Auth middleware for protected routes
```

---

## Phase 4: Authentication & Authorization

### Google OAuth Flow
1. User clicks "Sign in with Google"
2. NextAuth.js redirects to Google consent screen
3. Google returns profile (email, name, avatar)
4. NextAuth creates/updates user record in `users` table
5. New users default to `member` role
6. Admins can promote users to `team` or `admin` via admin panel

### Route Protection
```
Public (no auth):        /articles/*, /issues/*, /queries/*, /books, /videos, /about, /search
Member required:         /queries/ask, /articles/[slug]#comments
Team required:           /admin (limited — can manage posts, reply to queries)
Admin required:          /admin/users, /admin/settings, full CRUD on everything
```

### Middleware
```typescript
// middleware.ts — protects /admin/* routes
// Checks session → redirects to /signin if not authenticated
// Checks role → redirects to /unauthorized if insufficient permissions
```

---

## Phase 5: SEO & URL Redirects

```
Old URL                                    →  New URL
/issue/content.aspx?id=38845              →  /articles/nothing-but-the-truth-please
/issue/viewissue.aspx?id=36365            →  /issues/2026-03
/issue/viewissue.aspx                     →  /issues (latest)
/issue/archives.aspx                      →  /issues
/issue/writers.aspx?option=articles       →  /articles/writers
/issue/writers.aspx?option=queries        →  /queries/writers
/issue/topics.aspx?option=articles        →  /articles/topics
/issue/topics.aspx?option=queries         →  /queries/topics
/EBooks.aspx                              →  /books
/Videos.aspx                              →  /videos
/mission.aspx                             →  /about
/team/team.aspx                           →  /about/team
/supportus.aspx                           →  /support
```

Generated via migration script → `next.config.ts` redirects array.

---

## Phase 6: Deployment on Hostinger

1. Push Next.js app to GitHub
2. Connect Hostinger to GitHub repo for auto-deploy
3. Configure MySQL database on Hostinger
4. Run Prisma migrations against Hostinger MySQL
5. Run migration script to import all content
6. Set up Google OAuth credentials (Google Cloud Console)
7. Configure environment variables on Hostinger:
   - `DATABASE_URL` (Hostinger MySQL)
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_URL=https://monthly-renaissance.com`
8. Point DNS to Hostinger
9. Verify SSL, redirects, search indexing

---

## Execution Order

| Step | Task | Status |
|------|------|--------|
| 0a | Install SQL Server Express, restore .bak | DONE |
| 0b | Verify DB matches live site | DONE |
| 1 | Export MSSQL data to JSON | Ready |
| 2 | Set up Next.js project + Prisma schema + MySQL | Next |
| 3 | Write & run migration script (MSSQL JSON → MySQL) | Next |
| 4 | Set up NextAuth.js + Google OAuth + roles | Next |
| 5 | Build layout (Header, Footer, Nav, Auth UI) | Next |
| 6 | Build content pages (articles, issues, queries, etc.) | Next |
| 7 | Build admin panel | Next |
| 8 | Build comments & question submission | Next |
| 9 | Full-text search | Next |
| 10 | SEO redirects | Next |
| 11 | Deploy to Hostinger + DNS cutover | Final |

---

## Data Persistence Guarantee

Every piece of content is verified present in the backup:
- All **2,017 articles** with full HTML (footnotes, Arabic text, formatting)
- All **921 queries** (Q&A) with question and answer HTML
- All **408 issues** (Jan 1991 — Mar 2026) including special issues
- All **23 displayed writers** (237 total including hidden)
- All **32 displayed topics** (48 total)
- All **571 videos** with YouTube links
- All **146 books/ebooks** with file references
- `old_id` columns preserve original IDs for redirect mapping
