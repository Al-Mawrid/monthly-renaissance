# Monthly Renaissance: ASP.NET to Next.js Migration Plan

## Current State Analysis

### What We Have
- **Website**: monthly-renaissance.com (ASP.NET / MSSQL on Plesk/Windows hosting)
- **Database**: MSSQL Server backup file (~117 MB)
- **Content**: 35+ years of Islamic scholarship publication (1991-2026)
- **Scale**: ~430+ monthly issues, 23 authors, 32 topic categories, 12 e-books

### Current Site Structure
| Page | ASP.NET URL | Content |
|------|------------|---------|
| Home | `/` | Landing page with current issue highlight |
| Current Issue | `/issue/viewissue.aspx` | Latest issue with articles grouped by section |
| Archives | `/issue/archives.aspx` | All issues (1991-2026) organized by year |
| Single Issue | `/issue/viewissue.aspx?id={id}` | Articles in a specific issue |
| Article | `/issue/content.aspx?id={id}` | Full article content (HTML with footnotes, Arabic text, RTL) |
| Articles by Writer | `/issue/writers.aspx?option=articles` | 23 writers listing |
| Articles by Topic | `/issue/topics.aspx?option=articles` | 32 categories listing |
| Queries by Writer | `/issue/writers.aspx?option=queries` | Reader Q&A by author |
| Queries by Topic | `/issue/topics.aspx?option=queries` | Reader Q&A by subject |
| E-Books | `/EBooks.aspx` | 12 downloadable e-books |
| Mission | `/mission.aspx` | About the publication |
| Team | `/team/team.aspx` | Staff/team page |
| Support Us | `/supportus.aspx` | Donation/support |
| Subscription | `/subscription.aspx` | Subscribe to publication |
| Videos | `/Videos.aspx` | YouTube lecture links |
| Links | `/Links.aspx` | External resource links |
| Contact | (mailto link) | Contact info |

---

## Migration Strategy

### Phase 0: Database Extraction (CRITICAL FIRST STEP)

**Goal**: Extract all content from the MSSQL backup into a portable format.

**What we need from you (the user)**:
1. **Restore the `.bak` file** to a local SQL Server instance (SQL Server Express is free)
2. **Export each table to CSV or JSON** using one of these methods:
   - SQL Server Management Studio (SSMS) > right-click table > Export
   - Run a script we'll provide that dumps all tables to JSON
   - Use a tool like `mssql-scripter` or `bcp` for bulk export

**What we need to extract**:
| Likely Table | Contains | Priority |
|-------------|----------|----------|
| Articles/Content | Article body (HTML), title, author ID, topic ID, issue ID | Critical |
| Issues | Issue date, volume, issue number | Critical |
| Writers/Authors | Name, bio, photo | Critical |
| Topics/Categories | Category name, description | Critical |
| Queries | Q&A content, author, topic | Critical |
| EBooks | Title, author, file path, description | High |
| Subscribers | Email list (if needed) | Low |
| Team | Team member info | Medium |
| Pages | Static page content (mission, support, etc.) | Medium |

**Deliverable**: A `/data` folder with JSON files for each table.

---

### Phase 1: Project Setup & Data Layer

```
monthly-renaissance/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with nav + footer
│   ├── page.tsx                  # Home page
│   ├── issues/
│   │   ├── page.tsx              # Archives - all issues by year
│   │   ├── [id]/
│   │   │   └── page.tsx          # Single issue view
│   │   └── special/
│   │       └── page.tsx          # Special issues
│   ├── articles/
│   │   ├── [id]/
│   │   │   └── page.tsx          # Single article view
│   │   ├── writers/
│   │   │   ├── page.tsx          # All writers
│   │   │   └── [id]/page.tsx     # Articles by specific writer
│   │   └── topics/
│   │       ├── page.tsx          # All topics
│   │       └── [id]/page.tsx     # Articles by specific topic
│   ├── queries/
│   │   ├── [id]/page.tsx         # Single query view
│   │   ├── writers/
│   │   │   ├── page.tsx          # Queries by writer
│   │   │   └── [id]/page.tsx
│   │   └── topics/
│   │       ├── page.tsx          # Queries by topic
│   │       └── [id]/page.tsx
│   ├── ebooks/
│   │   └── page.tsx              # E-books listing
│   ├── about/
│   │   ├── page.tsx              # Mission
│   │   └── team/page.tsx         # Team
│   ├── support/page.tsx          # Support us
│   ├── subscribe/page.tsx        # Subscription
│   ├── videos/page.tsx           # Video lectures
│   └── contact/page.tsx          # Contact
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Navigation.tsx
│   ├── articles/
│   │   ├── ArticleCard.tsx
│   │   ├── ArticleContent.tsx    # Handles footnotes, Arabic/RTL, quotes
│   │   └── ArticleList.tsx
│   ├── issues/
│   │   ├── IssueCard.tsx
│   │   └── IssueGrid.tsx
│   ├── search/
│   │   └── SearchBar.tsx
│   └── ui/                       # Shared UI primitives
├── lib/
│   ├── db.ts                     # Database connection (Postgres/Supabase)
│   └── queries/                  # Data access functions
├── public/
│   └── ebooks/                   # PDF files
├── prisma/
│   └── schema.prisma             # Database schema
└── styles/
    └── globals.css               # Tailwind + custom styles
```

**Tech Stack**:
- **Framework**: Next.js 15 (App Router, Server Components)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (via Supabase, Neon, or self-hosted)
- **ORM**: Prisma
- **Hosting**: Vercel (ideal for Next.js) or any Node.js host
- **Search**: Built-in full-text search via Postgres, or Algolia for advanced

---

### Phase 2: Database Design (PostgreSQL)

```sql
-- Core content tables
writers (id, name, slug, bio, photo_url)
topics (id, name, slug, description, type: 'article' | 'query')
issues (id, year, month, volume, issue_number, is_special, title)

articles (
  id, title, slug, body_html,
  writer_id, topic_id, issue_id,
  type: 'article' | 'query',
  created_at
)

ebooks (id, title, author, translator, description, file_url, cover_url)
team_members (id, name, role, bio, photo_url, order)
static_pages (id, slug, title, body_html)
```

---

### Phase 3: Content Migration Script

We will write a Node.js script that:
1. Reads the exported JSON/CSV from Phase 0
2. Cleans and transforms the HTML content (strip ASP.NET artifacts, fix encoding)
3. Maps old IDs to new IDs
4. Handles Arabic/RTL text blocks and footnotes
5. Inserts everything into the new PostgreSQL database
6. Generates URL redirects map (old ASP.NET URLs -> new Next.js URLs)

---

### Phase 4: Frontend Build (Modern Redesign)

**Design Direction**: Clean, minimal, typography-focused (like Substack or Medium meets scholarly journal)

Key design decisions:
- **Typography**: Serif for article body (scholarly feel), sans-serif for UI
- **Arabic text**: Proper RTL handling with `dir="rtl"` blocks and Arabic fonts
- **Footnotes**: Inline expandable or side-margin notes (not page-bottom)
- **Reading experience**: Wide content area, comfortable line-height, dark mode support
- **Navigation**: Simplified top nav with dropdown menus
- **Search**: Prominent full-text search across all articles and queries
- **Responsive**: Mobile-first design

---

### Phase 5: SEO & URL Redirects

Critical for preserving search engine rankings:

```
/issue/content.aspx?id=38845  -->  /articles/nothing-but-the-truth-please
/issue/viewissue.aspx?id=36365 -->  /issues/2026-03
/issue/archives.aspx            -->  /issues
/issue/writers.aspx?option=articles --> /articles/writers
/issue/topics.aspx?option=articles  --> /articles/topics
/EBooks.aspx                    -->  /ebooks
```

We'll generate a `next.config.js` redirects array from the old-to-new ID mapping.

---

### Phase 6: Deployment & DNS

1. Deploy to Vercel (or similar)
2. Point `monthly-renaissance.com` DNS to new host
3. Verify all redirects work
4. Monitor 404s and fix any missed URLs

---

## Execution Order

| Step | Task | Depends On | Estimated Scope |
|------|------|-----------|-----------------|
| 0 | Restore MSSQL backup & export tables to JSON | User action needed | User task |
| 1 | Next.js project setup + Prisma schema + DB | Step 0 | We build |
| 2 | Migration script: import all content to Postgres | Step 0, 1 | We build |
| 3 | Layout: Header, Footer, Navigation | Step 1 | We build |
| 4 | Home page | Step 3 | We build |
| 5 | Issues archive + single issue page | Step 2, 3 | We build |
| 6 | Article page (with RTL, footnotes, styling) | Step 2, 3 | We build |
| 7 | Writers & Topics listing/filter pages | Step 2, 3 | We build |
| 8 | Queries section (mirrors articles structure) | Step 2, 3 | We build |
| 9 | E-books, Videos, Static pages | Step 2, 3 | We build |
| 10 | Search | Step 2 | We build |
| 11 | URL redirects from old site | Step 6, 7, 8 | We build |
| 12 | Deploy + DNS cutover | All above | Joint task |

---

## What We Need From You to Start

1. **Restore the database backup** to a SQL Server instance and either:
   - Give us the table names (run: `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES`)
   - Export all tables to JSON/CSV
   - Or give us remote access to a running SQL Server with this DB restored

2. **E-book files**: The actual PDF/document files for the 12 e-books

3. **Images/Assets**: Any logos, author photos, or images used on the current site

4. **Design preferences**:
   - Any websites whose design you like?
   - Color preferences? (keep current branding or fresh start?)
   - Any features to add or remove vs. the current site?

---

## Data Persistence Guarantee

Every piece of content will be preserved:
- All **430+ issues** with their structure
- All **articles** with full HTML content (footnotes, Arabic text, formatting)
- All **queries** (Q&A content)
- All **writer/author** information
- All **topic categorizations**
- All **e-books**
- All **static page content** (mission, team, etc.)
- **URL redirects** so no existing links or Google rankings break
