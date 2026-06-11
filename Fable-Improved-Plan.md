# Implementation plan (revised)

Supersedes `Opus-plan.md`. Same inputs (the 21 May 2026 meeting with Azeem, the live SSH investigation of Hostinger), plus a full read of the current codebase. Three things changed:

1. **Two of the bug diagnoses in the original plan were wrong or imprecise.** The real root causes are now confirmed in code, with file and line references. The fixes get simpler and more targeted.
2. **The plan missed work the project is already committed to.** The `content.aspx?id={id}` 301 redirects are described in `CLAUDE.md` as a core migration requirement and the `oldId` column exists specifically to drive them, but they are not implemented anywhere. Same for basic SEO plumbing (sitemap, per-page metadata).
3. **A handful of security and correctness gaps surfaced during the code read** that aren't on anyone's radar yet. They're cheap to fix now and expensive to fix after launch.

Sections A through E keep the original lettering so the two plans can be compared side by side. F onward is new.

---

## Corrected diagnoses (read this first)

These supersede the "suspected cause" guesses in the original plan.

### Why article creation fails: `oldId: 0` is hardcoded

`createArticle` in `src/app/admin/actions.ts:60` writes `oldId: 0` on every new article. `Article.oldId` is `@unique` (`prisma/schema.prisma:66`). So the **first** article ever created through the admin succeeds and takes `oldId = 0`; **every subsequent create fails** with a P2002 unique-constraint error. That matches Azeem's experience exactly: he created one article (the one showing "0" in the list), then every retry silently failed.

The same hardcoded `oldId: 0` appears in:

- `createQuery` (`actions.ts:156`)
- `createIssue` (`actions.ts:254`)
- `createBook` (`actions.ts:439`)
- All four CREATE branches of `approveChangeRequest` (`actions.ts:577`, `601`, `627`, `670`)

So this is not an article bug. Creating a second query, issue, or book will fail the same way, and so will approving a second TEAM change request of any CREATE type. Fix all eight sites at once.

### Why the failure is silent, and why the original fix won't work in production

`src/app/admin/articles/new/form.tsx:68` has `catch {}` around the `createArticle` call. That part the original plan got right. But its fix ("surface the actual error message from `createArticle`") won't work as described: **Next.js redacts thrown `Error` messages from Server Actions in production builds.** The client receives a generic "An error occurred in the Server Components render" digest, not the message. Showing `err.message` in the form would work in dev and show garbage on Hostinger.

The fix has to change the action's contract instead. See A1.

### What the "0" in the admin list actually is

`src/app/admin/articles/page.tsx:77` renders `article.oldId` in the ID column. Azeem's one successfully created article has `oldId = 0`, hence the "0". The original plan guessed this was an Issue № column for unattached articles; there is no issue column in that table at all. The fix moves from "render an em-dash for unattached articles" to "stop displaying a legacy MSSQL identifier as if it were the article ID" (A4).

### `Article.slug` is not unique

`prisma/schema.prisma:68` declares `slug String @db.VarChar(255)` with no `@unique`, and the create form generates the slug from the title with no collision check (`form.tsx:45-50`). `getArticleBySlug` uses `findFirst` (`src/lib/queries.ts:343`), so two articles with the same title means one permanently shadows the other on the public site, with no error anywhere. The legacy data presumably has unique slugs by luck of the seed; new content has no such guarantee. Folded into A1.

### Deactivated users are not actually deactivated

`User.isActive` exists in the schema and the admin UI has a toggle for it (`src/app/admin/users/toggle-active.tsx`), but nothing enforces it. `src/lib/auth.ts:14-22` populates `session.user.role` and never checks `isActive`; `src/proxy.ts` checks role only. A user an admin "deactivated" keeps full TEAM or ADMIN access until their session row expires. See H1.

---

## Confirmed decisions (unchanged, already aligned with Hashaam)

| Question | Decision |
|---|---|
| Editor upgrade scope | Migrate to Tiptap. First audit legacy article HTML and build a schema that round-trips `FootNote`, `FootNoteLink`, `ArabicInLineText`, `EnglishQuote` losslessly. No silent re-formatting of imported content. |
| Issue link on article create | Required at create time, written in the same transaction as the article row. |
| Image storage | Hostinger persistent disk at `/home/u323192505/persistent/uploads/`, served by a Next.js route handler. No external object storage. No Vercel. |
| Deploy target | Hostinger, per `CLAUDE.md`. The Vercel session context is ignored. |

One decision the original plan left open is now resolvable with a firm recommendation:

**`oldId` should be nullable for net-new content, not auto-incremented past the max.** The column's whole purpose is "this row existed in the old MSSQL database, here is its id" and it feeds the `content.aspx?id={oldId}` redirect map (section F). Synthesizing fake legacy ids for new articles pollutes that mapping: a redirect lookup could resolve an old URL that never existed to a 2026 article. MySQL allows multiple NULLs in a unique index, so `oldId Int? @unique` needs no partial-index tricks. Confirm with Hashaam, then it's a one-line schema change plus removing the `oldId: 0` literals.

---

## Hostinger findings (from the live SSH session, unchanged)

- **Hosting**: shared CageFS, CloudLinux, user `u323192505`. 18 TB free disk.
- **Runtime**: Phusion Passenger fronting Node 22 at `/opt/alt/alt-nodejs22/root/bin/node`.
- **App path**: `~/domains/skyblue-dotterel-856715.hostingersite.com/nodejs/` (standalone output).
- **Restart trigger**: `touch nodejs/tmp/restart.txt`.
- **Env file**: `public_html/.builds/config/.env`, regenerated from the hPanel "Environment Variables" UI on every deploy. hPanel is the authoritative place for new vars.
- **Deploy pipeline**: source pulled into `public_html/.builds/source/repository`, built with pnpm, build output replaces `nodejs/`. `public/` is wiped on every deploy. No post-deploy hook UI.
- **Persistence verified**: no `public/books/` exists on the server despite the books upload route writing there. Confirms uploads do not survive deploys.

**New observation from the code read**: `next.config.ts` in this repo is empty. No `output: "standalone"` is set, yet the server runs a standalone build. Either the Hostinger pipeline injects it or the deployed build came from a config that never landed in git. **Verify before the next deploy** and commit `output: "standalone"` to `next.config.ts` if the pipeline expects it. A deploy that silently changes output mode would replace `nodejs/` with something Passenger can't start.

---

## Work already done (uncommitted, awaiting review)

1. **Server**: `~/persistent/uploads/{articles,books}` created on Hostinger, permissions 750, confirmed writeable.
2. **Server**: `UPLOAD_DIR=/home/u323192505/persistent/uploads` appended to `.env`. Must also be added in hPanel or it vanishes on next deploy.
3. **Local, uncommitted**: `prisma/schema.prisma` has the new `Upload` model plus `uploads Upload[]` on `User`. Reviewed; schema looks right (see D1 for two small suggestions).
4. **Local, uncommitted**: `.env.example` documents `UPLOAD_DIR`.

---

## A. Bugs Azeem flagged

### A1. Article submit fails silently

**Root cause** (confirmed, see corrected diagnoses): hardcoded `oldId: 0` violating the unique constraint on every create after the first, swallowed by `catch {}` in the form.

**Fix, in order:**

1. **Schema**: change `oldId` to `Int? @unique` on `Article`, `QueryEntry`, `Issue`, `Book` (and leave the other content models alone until they get admin create forms). Remove `oldId: 0` from all eight create sites in `actions.ts`.
2. **Action contract**: change every mutation in `actions.ts` to return a discriminated result instead of throwing for expected failures:
   ```ts
   type MutationResult =
     | { ok: true; applied: true }
     | { ok: true; requested: true }
     | { ok: false; error: string };
   ```
   Wrap the Prisma call, map known error codes (P2002 duplicate slug, P2003 missing FK) to readable messages, and return them. Keep throwing only for auth failures. This is the only way the real message reaches the client in production.
3. **Form**: replace `catch {}` in `form.tsx:52-71` (and the same pattern in the edit form and the query/issue/book forms) with handling of `{ ok: false }`: render the error in a callout below the buttons, keep the user's input intact, re-enable the button.
4. **Slug uniqueness**: add `@unique` to `Article.slug` (verify the seeded data has no duplicates first: `SELECT slug, COUNT(*) FROM articles GROUP BY slug HAVING COUNT(*) > 1`). In `createArticle`, on P2002 for slug, auto-suffix (`my-title-2`) rather than erroring; titles repeat legitimately in a 35-year archive.
5. **Validation**: check topic and writer exist before insert and return a clean error if not. The form sends `parseInt` of select values, so garbage is unlikely, but TEAM change-request payloads replay through the same path months later when the writer may be deleted.

### A2. "Display on Site" toggle has no effect for new articles

**Diagnosis confirmed as written**: the create form has no Issue picker, so new articles get no `ArticleIssueLink` row, and every issue-based listing (`getArticlesForIssue`, `src/lib/queries.ts:311-323`) never sees them. Additionally `mapArticle` (`queries.ts:140-155`) fabricates an empty issue object for unlinked articles, which is what would render as "Vol. 0 · № 0" on the article page if reached directly.

**Fix:**

1. Add a required Issue select (search-as-you-type, same control pattern as Topic/Writer) to the **create form and the edit form**. The edit form (`src/app/admin/articles/[id]/edit/form.tsx`) currently has no way to attach or move an article either; fixing only the create form leaves Azeem's already-created orphan article stranded.
2. `createArticle` writes the article and the `ArticleIssueLink` row in one `prisma.$transaction`.
3. `updateArticle` accepts an optional `issueId` and reconciles the link row in the same transaction.
4. Revalidation: the toggle action (`actions.ts:117-136`) currently revalidates only `/admin/articles` and `/`. Add `/articles/[slug]`, `/issues/[id]` for the linked issue, and `/issues`. Same gap exists in `updateArticle` and `deleteArticle`; fix them in the same pass.
5. Admin articles list: add an Issue column and an "Unattached" filter so legacy or orphaned rows are findable (absorbs the long-term part of A4).

### A3. White / dotted vertical line on Word-pasted articles

**Diagnosis refined.** Two confirmed contributing facts:

- The current editor (`src/app/admin/_components/html-editor.tsx`) has **no paste handler at all**; raw Word HTML lands in the document verbatim, including `mso-border-left-alt: dotted` style fragments and `<o:p>` tags. The seed-time cleaner (`prisma/seed.ts` `cleanHtml`) only ran on imported legacy content, so anything pasted through the admin since launch is dirty.
- `globals.css` has selectors that can draw the line on Word markup: `.article-content blockquote { border-left: 3px solid var(--primary) }` (`globals.css:297-303`), and the broad `.article-content [align="right"]` / `[dir="rtl"]` rule (`globals.css:305-323`) which applies a saffron `border-right` plus cream background to **any** right-aligned element. Word emits `align` attributes freely, so an English paragraph Word happened to mark up can get the full Arabic-quote treatment.

**Fix:**

1. **Interim (before Tiptap)**: add an `onPaste` handler to the current `html-editor.tsx` that runs the same cleanup the seed used: strip `<o:p>`, `mso-*` style declarations, `class="Mso*"`, inline `border*` declarations, empty spans. Twenty lines, reuses `cleanHtml` logic, kills the bug for all new pastes without waiting for C1.
2. **CSS**: narrow the `[align="right"]` selector so it can't fire on Word residue, e.g. require `lang="ar"`/`dir="rtl"` or the known Arabic classes, and audit the remaining `border-left` rules at `globals.css:611` and `855` for reachability inside `.article-content`.
3. **Backfill**: one-shot script over existing `bodyHtml` (and `questionHtml`/`answerHtml`) rows that strips the same residue. Dry-run mode required: write a diff log per row, review, then run the UPDATE. Run this **after** the Tiptap round-trip audit fixture set is captured (section E) so the audit tests against real pre-cleanup HTML.
4. **Permanent**: `transformPastedHTML` in Tiptap (C1) replaces the interim handler.

### A4. "0" rendering in the article admin list

**Corrected**: it's the `oldId` column (`admin/articles/page.tsx:77`), not an issue number. After A1 makes `oldId` nullable:

- Render `article.oldId ?? "—"` and retitle the column "Legacy ID", or better, show the real `article.id` and move `oldId` to a tooltip. Admins never need the MSSQL id day to day.
- Backfill Azeem's existing article: `UPDATE articles SET old_id = NULL WHERE old_id = 0` (after the schema change deploys).

---

## B. Public read-side fixes

### B1. Issue context on the article page

As originally planned: add a chip near the title, `MAY 2026 · ISSUE № 5`, linked to `/issues/[slug]`. Keep the byline, uppercase the topic eyebrow. One addition: `mapArticle` returns a zero-valued fake issue for unlinked articles (`queries.ts:150`), so the chip must render only when `article.issue.id !== ""`. Better, change the `Article` type's `issue` to be nullable and fix the handful of call sites; the sentinel object is a bug factory.

### B2. Translator name on article and in admin

Confirmed: `Article.translatorId` exists in the schema, is seeded (`prisma/seed.ts:237`), and is rendered nowhere. The `Article` interface in `src/lib/types.ts` has no translator field and `articleInclude` (`queries.ts:184-188`) doesn't fetch the relation.

- Add `translator?: { name: string; slug: string }` to the `Article` interface, add `translator: true` to `articleInclude`, map it in `mapArticle`.
- Article page: "Translated by [Name]" under the writer line, linked to the writer page, only when set.
- Admin create/edit forms: optional Translator select using the same searchable writer dropdown.
- `createArticle`/`updateArticle`: accept optional `translatorId`.

### B3. Editorial missing from the current issue

Confirmed: editorials (`editorialIssueId`) and intros (`introIssueId`) are seeded but `getArticlesForIssue` only reads `ArticleIssueLink`. The issue page's "From the Editor" block is a static label, not the editorial's content.

- Update `getArticlesForIssue` (`queries.ts:311-323`) to union three sources: linked articles, `editorialIssueId = issue.id`, `introIssueId = issue.id`, all filtered on `display: true`, deduped by article id (an editorial might also be linked).
- Order: intro, editorial, then linked articles.
- Wire the issue page's "From the Editor" block to the actual editorial article when one exists (link "Start reading" to it).
- Admin: the create/edit forms need a way to set these flags, otherwise no future issue ever gets an editorial. Simplest faithful-to-schema version: a three-way "Role in issue" select (Regular / Editorial / Issue intro) next to the Issue picker, which writes `editorialIssueId`/`introIssueId` instead of (or alongside) the link row. This was open question 4 in the original plan; recommend this inline approach over a separate admin route, since it's one extra field on a form that's already being rebuilt in A2.

### B4. ISSN display

As originally planned: issue cover plate under "VOLUME / ISSUE №", and the footer next to the copyright line (`src/components/layout/footer.tsx:85`). Create `src/lib/site-meta.ts` holding ISSN, site name, base URL (the base URL is also needed by F and G). Blocked on Azeem supplying the actual ISSN string.

---

## C. Editor upgrade (Tiptap migration)

Unchanged in substance from the original plan; the current editor is confirmed to be `contentEditable` + `document.execCommand` with three modes (visual/HTML/split) and zero paste handling.

### C1. Tiptap with legacy-safe schema

- `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-table`, `@tiptap/extension-image`, `@tiptap/extension-link`.
- Custom extensions preserving exact legacy class names: `FootNote` (block node), `FootNoteLink` (inline mark/node with anchor), `ArabicInLineText` (inline mark, must also preserve `dir`/`lang` attributes so the CSS at `globals.css:305-340` keeps matching), `EnglishQuote` (inline mark).
- Also preserve: `p.Heading`/`.ArticleHeading` (`globals.css:285`), `blockquote.arabic-quote`, raw `align`/`dir`/`lang` attributes on paragraphs. The round-trip audit (E) is the source of truth for what else must survive; expect this list to grow.
- `transformPastedHTML` strips Word residue (same ruleset as the A3 interim handler, now shared as a `src/lib/word-clean.ts` utility used by paste handler, backfill script, and seed).
- Slash-command popover: H1/H2/H3, blockquote, bullet list, ordered list, table, image, paragraph.
- Keep the HTML source mode. Tiptap is a controlled component over HTML strings, so the existing visual/HTML toggle survives; Azeem's team occasionally needs raw access and it's the escape hatch if the schema rejects something.

### C2. Inline image upload

Tiptap image button and drag-drop both hit `POST /api/upload-image` (D3) and insert the returned `/files/...` URL as a plain `<img>`.

### C3. Tables

Tiptap table extension, default controls (insert/delete row/column, delete table). Word-pasted Hadith tables come through once C1's sanitizer preserves `<table>` markup while stripping `mso-*` styling.

### C4. Paste-from-Word cleanup

Covered by C1's `transformPastedHTML`. The interim A3 handler is deleted in the same PR.

---

## D. Uploads infrastructure

### D1. Prisma `Upload` model

Already in the working tree; reviewed. Two adjustments before committing:

- `onDelete` is unspecified on `uploadedBy`; deleting a user with uploads will fail the FK. Use `onDelete: Restrict` explicitly (intentional: don't orphan files) or relax to `SetNull` with `uploadedById String?`. Recommend `Restrict` plus the existing `isActive` toggle as the deactivation path.
- Consider `sizeBytes Int` → fine for the 10 MB / 50 MB caps; no change needed, just noting it was checked.

### D2. Persistent disk and env var

Done on the server. **Remaining action**: add `UPLOAD_DIR` in hPanel so it survives the next deploy. Also add `UPLOAD_DIR` to local dev `.env` files (already documented in `.env.example`).

### D3. `POST /api/upload-image`

As originally specified: auth-gated by `canEditContent`, multipart, MIME whitelist (`image/png`, `image/jpeg`, `image/webp`, `image/gif`, SVG rejected), 10 MB cap, writes to `${UPLOAD_DIR}/articles/{yyyy}/{mm}/{slug}-{timestamp}.{ext}`, inserts an `Upload` row, returns `{ url, uploadId }`. Two additions:

- Validate magic bytes, not just the client-supplied MIME string (a `Content-Type` header is attacker-controlled; checking the first bytes is ~10 lines for these four formats).
- Reject path-hostile original filenames before slugifying (slugify handles most of it, but assert the final path stays under `UPLOAD_DIR` the same way D4 does).

### D4. `GET /files/[...path]`

As originally specified: resolve absolute path, verify it stays inside `UPLOAD_DIR`, stream with stored `mimeType`, `Cache-Control: public, max-age=31536000, immutable`, 404 on missing file or DB row. Addition: set `X-Content-Type-Options: nosniff` and `Content-Disposition: inline` for images / `attachment` for book files, so a future relaxation of the MIME whitelist can't turn the route into a stored-XSS vector.

### D5. Refactor existing `POST /api/upload` (books)

Confirmed broken as described: writes to `public/books/` (wiped on deploy), and `getAllEbooks` (`queries.ts:769-786`) builds `/ebooks/${fileName}` URLs pointing at files that don't exist. Refactor as originally planned: write to `${UPLOAD_DIR}/books/`, return `/files/books/...` URLs, insert `Upload` rows, update `getAllEbooks` to the new URL shape. For cover images: add a cover upload field on the book form (recommendation unchanged), and until then hide the cover `<img>` instead of rendering a dead link.

### D6. Legacy image references in article body HTML

Unchanged: hot-linked `http://www.monthly-renaissance.com/images/...` and relative `*_files/image001.gif` references are dead. Recommendation unchanged: pull from the old GoDaddy server into `${UPLOAD_DIR}/legacy/` and rewrite URLs via a one-shot script (not at seed time; the database is already seeded, so this is a backfill UPDATE like A3's, with the same dry-run requirement). Blocked on GoDaddy access (open question 3).

---

## E. Legacy data audit for Tiptap migration

Unchanged in approach, two refinements:

1. Source the fixture set from the **live database**, not `data/exports/content.json`, because seed-time `cleanHtml` already transformed the data. The editor round-trips what's in MySQL, so that's what must be audited.
2. Success criterion stays byte-identical `bodyHtml` after open-save-without-edit. Build the audit as a script (`scripts/tiptap-roundtrip.ts`) that can run headless against all ~thousands of rows and emit a report of diffing article ids. This script is also the regression gate in CI (J2) for any future Tiptap extension change.

Sequencing note: capture fixtures **before** the A3/D6 backfills run, then re-run the audit after the backfills to confirm the cleaned HTML also round-trips.

---

## F. Legacy 301 redirects (new, missing migration requirement)

`CLAUDE.md` calls the `content.aspx?id={id}` → new-URL 301 redirects a core requirement and `oldId` exists to drive them. Nothing implements them: no hit for `content.aspx` anywhere in `src/`, `next.config.ts` is empty, `src/proxy.ts` handles only `/admin` auth. Every inbound link and search-engine result pointing at the old site 404s today. This is the single highest-SEO-impact item in the plan and it's a half-day of work.

1. **Route handler** at `src/app/issue/content.aspx/route.ts` (App Router accepts dots in segment names). The legacy URL carries an `/issue/` prefix: `MIGRATION_PLAN.md` documents the old structure as `/issue/content.aspx?id={id}` for articles, `/issue/viewissue.aspx?id={id}` for issues, plus `archives.aspx`, `writers.aspx`, `topics.aspx`. Read `id` from `request.nextUrl.searchParams`, look up by `oldId` across `article` → `/articles/[slug]`, `queryEntry` → its public URL, `book` → `/ebooks`, return `NextResponse.redirect(new URL(target, SITE_URL), 301)`. Unknown id → 301 to `/` or a 410, decide with Hashaam.
2. **Cover the rest of the documented URL map.** `MIGRATION_PLAN.md` already inventories the legacy patterns (`viewissue.aspx`, `archives.aspx`, `writers.aspx?option=...`, `topics.aspx?option=...`); add a handler per pattern with inbound traffic. Cross-check against Google Search Console / old IIS logs before the domain cutover in case the list is incomplete.
3. This only matters fully once `monthly-renaissance.com` points at the new site, but it must be **live before** that cutover, so schedule it now, not "later".

---

## G. SEO and metadata (new)

Found during the read: no `generateMetadata` on article, issue, writer, or topic pages (only the root layout template and two static pages), no `sitemap.ts`, no `robots.ts`, no canonical URLs, no Open Graph tags. For a content archive whose entire value is organic discovery, this is load-bearing, not polish.

1. `generateMetadata` on `articles/[slug]`: title, description from the existing `excerpt()`, canonical URL, `article:author`, OG title/description. The data is already fetched for the page; cost is near zero.
2. Same for `issues/[id]`, `articles/writers/[slug]`, `articles/topics/[slug]`.
3. `src/app/sitemap.ts` using the already-existing `getAllArticleSlugs()` and `getAllIssueSlugs()` (`queries.ts:372-385`), plus writers and topics. `src/app/robots.ts` allowing all, disallowing `/admin` and `/api`, pointing at the sitemap.
4. `SITE_URL` constant in `src/lib/site-meta.ts` (shared with B4 and F).
5. Optional, later: OG image generation per article. Skip for now.

---

## H. Security hardening (new)

In rough priority order:

1. **Enforce `isActive`** (confirmed gap, see corrected diagnoses). Cheapest correct fix with database sessions: check `isActive` in the `session` callback in `src/lib/auth.ts` and return a session without role (or throw) when false, plus check it in `requireAuth()` in `actions.ts`. Also add a `signIn` callback rejecting inactive users at login.
2. **Validate change-request payloads at approval time.** `approveChangeRequest` casts `cr.data` and passes it nearly raw into `prisma.article.update` (`actions.ts:588`). A TEAM user who calls the server action directly (it's a public POST endpoint; TypeScript types don't exist at runtime) can put arbitrary column writes into `data`, e.g. `oldId`, `editorialIssueId`, or relation operations, and an admin click applies them. Define zod schemas per entity type, parse on both creation of the request and approval, reject anything extra.
3. **XSS posture for `bodyHtml`.** `sanitizeHtml` (`queries.ts:72-75`) only re-balances tags; it strips nothing. Content is rendered with `dangerouslySetInnerHTML`, and TEAM users author HTML. Today TEAM is a small trusted group, so a full allowlist sanitizer may be overkill, but at minimum strip `<script>`, `on*` attributes, and `javascript:` URLs server-side in `createArticle`/`updateArticle`/`createQuery`/`updateQuery` (one shared function next to `word-clean.ts`). Decide explicitly rather than by omission; write the decision down in `CLAUDE.md`.
4. **Wrap multi-statement mutations in transactions.** `deleteArticle` (`actions.ts:106-107`), `deleteIssue`, `deleteQuery`, and the approval DELETE branches each run `deleteMany` then `delete` unwrapped; a failure between the two leaves half-deleted state. `prisma.$transaction([...])` everywhere, and A2's create-with-link is born transactional.
5. **Upload route depth** is covered in D3/D4 (magic bytes, nosniff, traversal guard).

---

## I. Performance (new, small)

1. **`sanitizeHtml` runs `node-html-parser` on every article read**, on `LongText` columns, on a shared CloudLinux host, and every public page is `force-dynamic`. After the A3 backfill cleans stored HTML, tag-balancing can happen at **write time** (run it in `createArticle`/`updateArticle` before insert) and the read path becomes a passthrough. Keep the read-side call as a cheap no-op safety until the backfill has run everywhere, then remove it.
2. **Issue/article pages don't need `force-dynamic`.** Content changes only on admin mutations, and every mutation already calls `revalidatePath`. Switching the public pages to default caching (or `revalidate = 3600` as a backstop) takes real load off MySQL on shared hosting. Verify the standalone build on Passenger serves ISR correctly before flipping the whole site; test on one route first.
3. `searchAll` uses `contains` LIKE queries across five tables; fine at current scale. If search gets slow post-launch, add MySQL FULLTEXT indexes on `articles.title`, `query_entries.title`. Noted, not scheduled.

---

## J. Ops and developer experience (new)

1. **Database backup before any `prisma db push`.** `db push` has no migration history and will happily drop/alter columns. Before the Upload-model push and the `oldId`-nullable push: `mysqldump` via SSH (or hPanel backup), verify the file exists, then push. Longer term, adopt `prisma migrate dev` with a baseline migration so production changes are reviewable; this repo has no `prisma/migrations/` folder today and `db push` is undocumented tribal knowledge. At minimum, document the push procedure in `CLAUDE.md`.
2. **Minimal CI** (GitHub Actions, none exists): `npm run lint` + `npm run build` on PR, plus the E round-trip script once it exists. The build step alone would have caught an empty `next.config.ts` / standalone mismatch at deploy time.
3. **Error visibility in production.** Server-action errors currently vanish into Passenger logs at best. The typed-result refactor (A1) handles expected errors; for unexpected ones, add a tiny `logError` helper writing structured lines to stderr (Passenger captures it) so SSH debugging has something to grep. Full Sentry-style monitoring is optional later; on shared hosting, stderr plus log rotation is the pragmatic floor.
4. **Dead code sweep**: `src/app/home-1/` and `src/app/home-2/` are design-variant pages reachable in production and indexed-able. Delete them or gate behind dev (they also confuse the sitemap work in G).

---

## K. Admin UX improvements (new, low priority)

Cheap quality-of-life items surfaced while reading the admin code; none block anything above.

1. Change-request review page shows raw JSON payloads; for UPDATE requests, render a field-by-field before/after diff (fetch current row, compare). Admins are approving content edits blind today.
2. Articles list: add the Issue column and "Unattached" filter (folded into A2 step 5).
3. The query/issue/book forms share the silent-`catch {}` pattern; the A1 form fix should be applied as a shared `useMutation`-style hook rather than copy-pasted four times.

---

## Sequencing

| Order | Group | Why |
|---|---|---|
| 1 | A1 + A2 + A4 (create flow: nullable `oldId`, typed errors, issue picker, transactions) | Azeem cannot ship content until this works. A4 falls out of A1 for free. **Requires one `db push` (backup first, J1).** |
| 2 | D2 hPanel env var (manual) + H1 `isActive` enforcement | Both are minutes of work. H1 is a live access-control hole. |
| 3 | A3 interim paste cleanup + CSS narrowing | Twenty-line stopgap; stops new dirty content accumulating while the big items land. |
| 4 | F content.aspx redirects + G sitemap/metadata | Highest SEO leverage in the plan, no dependencies, must precede the domain cutover. |
| 5 | D1 + D3 + D4 + D5 (uploads infrastructure) | Foundation for the editor; fixes books. Second `db push`. |
| 6 | B1 + B2 + B3 + B4 (read-side: issue chip, translator, editorial union, ISSN) | Mostly `queries.ts` + form fields; B3's admin part rides on the A2 form rebuild. |
| 7 | E fixture capture, then A3 backfill + D6 legacy images | Capture round-trip fixtures from live data **before** mutating it. Dry-run both backfills. |
| 8 | C1–C4 Tiptap migration (gated by E passing) | Biggest change, ships last so a regression doesn't block content work. |
| 9 | H2–H4, I1–I2, J2–J4, K | Hardening, performance, ops, polish. Schedule opportunistically. |

---

## Deploy / migration mechanics

Unchanged from the original plan, with two additions (in bold):

1. **Before any schema push: take a backup.** `ssh renaissance-hostinger 'mysqldump ... > ~/backups/pre-upload-model-$(date +%F).sql'` and confirm size > 0.
2. Apply schema to production after the code deploys:
   ```sh
   ssh renaissance-hostinger
   cd ~/domains/skyblue-dotterel-856715.hostingersite.com/nodejs
   /opt/alt/alt-nodejs22/root/bin/node node_modules/prisma/build/index.js db push
   touch tmp/restart.txt
   ```
3. Add `UPLOAD_DIR` via hPanel → Node.js Application → Environment Variables. Next deploy writes it into `.env` automatically.
4. **Verify `output: "standalone"`**: confirm how the current production build gets standalone output and commit the setting to `next.config.ts` so the repo matches reality.

---

## Open questions

1. ~~Is `oldId` allowed to be null?~~ **Recommended: yes, nullable.** Rationale under "Confirmed decisions". Needs Hashaam's sign-off, then it's settled.
2. **ISSN string** — still needed from Azeem (B4).
3. **GoDaddy access** for legacy images (D6) — pull if yes, strip if no.
4. ~~Editorial flow in admin~~ — **recommended: inline "Role in issue" select on the article form** (B3). Needs sign-off.
5. **Book covers**: recoverable from anywhere, or ship without until uploaded? (D5)
6. **New**: unknown `content.aspx?id=` values — redirect to `/` or serve 410 Gone? (F1)
7. **New**: XSS stance for TEAM-authored HTML — strip script/event handlers only, or full allowlist sanitizer? (H3)

---

## Out of scope (unchanged)

- Notion-style blocks beyond the basic set (callouts, toggles, embeds).
- AI-assisted content conversion tooling.
- The `monthly-renaissance.com` domain cutover itself (though F and G are prerequisites for it).
- Admin preview-before-publish mode.
