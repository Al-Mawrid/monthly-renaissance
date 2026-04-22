import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";
import slugify from "slugify";

let prisma = new PrismaClient();
const dataDir = join(__dirname, "..", "data", "exports");

// Retry wrapper: on connection loss (P1001/P1017), reconnect and retry.
async function withRetry<T>(op: () => Promise<T>, label = "op"): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await op();
    } catch (e: any) {
      const code = e?.code;
      const isConn = code === "P1001" || code === "P1017" || code === "P1008";
      if (!isConn || attempt >= 5) throw e;
      attempt++;
      const delay = 1000 * 2 ** attempt;
      console.warn(`  [retry ${attempt}/5] ${label} lost connection (${code}); reconnecting in ${delay}ms`);
      try { await prisma.$disconnect(); } catch {}
      await new Promise((r) => setTimeout(r, delay));
      prisma = new PrismaClient();
    }
  }
}

function readJson<T>(filename: string): T[] {
  return JSON.parse(readFileSync(join(dataDir, filename), "utf-8"));
}

// Slug generation with collision handling
const slugCounts = new Map<string, number>();
function makeSlug(text: string): string {
  const base = slugify(text, { lower: true, strict: true, trim: true }) || "untitled";
  const count = slugCounts.get(base) || 0;
  slugCounts.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

// Generate issue slug from date: YYYY-MM
function makeIssueSlug(dateStr: string | null, title: string): string {
  if (dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const slug = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const count = slugCounts.get(slug) || 0;
      slugCounts.set(slug, count + 1);
      return count === 0 ? slug : `${slug}-${count + 1}`;
    }
  }
  return makeSlug(title);
}

// Clean ASP.NET HTML artifacts while preserving Arabic/RTL and footnote classes
function cleanHtml(html: string | null): string {
  if (!html) return "";
  let cleaned = html;
  // Remove class="MsoNormal", class="MsoBodyText", class="MsoTitle" etc
  cleaned = cleaned.replace(/\s*class="Mso\w*"/gi, "");
  // Remove class="Paragraph" (ASP.NET artifact)
  cleaned = cleaned.replace(/\s*class="Paragraph"/gi, "");
  // Remove class="Text" spans but keep content
  cleaned = cleaned.replace(/<span\s+class="Text"\s*>(.*?)<\/span>/gis, "$1");
  // Remove empty style attributes
  cleaned = cleaned.replace(/\s*style=""/gi, "");
  // Remove Word-style margin/text-indent styles but keep dir and other useful attrs
  cleaned = cleaned.replace(/\s*style="[^"]*(?:mso-|margin-|text-indent)[^"]*"/gi, "");
  // Normalize line endings
  cleaned = cleaned.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // Remove excessive whitespace but keep structure
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, "\n\n");
  return cleaned.trim();
}

// Calculate reading time from HTML content
function readingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text.split(" ").filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

async function main() {
  console.log("Reading JSON exports...");

  const writers = readJson<any>("writers.json");
  const topics = readJson<any>("topics.json");
  const issues = readJson<any>("issues.json");
  const content = readJson<any>("content.json");
  const queries = readJson<any>("queries.json");
  const books = readJson<any>("books.json");
  const videos = readJson<any>("videos.json");
  const videoCategories = readJson<any>("video-categories.json");
  const contentIssueLinks = readJson<any>("content-issue-links.json");
  const queryIssueLinks = readJson<any>("query-issue-links.json");
  const links = readJson<any>("links.json");
  const linkCategories = readJson<any>("link-categories.json");

  // Maps: oldId -> newId
  const writerMap = new Map<number, number>();
  const topicMap = new Map<number, number>();
  const issueMap = new Map<number, number>();
  const articleMap = new Map<number, number>();
  const queryMap = new Map<number, number>();
  const videoCatMap = new Map<number, number>();
  const linkCatMap = new Map<number, number>();

  // Pre-fetch existing rows so we can resume after a failed/partial run.
  console.log("Checking for existing rows (resume mode)...");
  const existing = await withRetry(
    () =>
      Promise.all([
        prisma.writer.findMany({ select: { id: true, oldId: true } }),
        prisma.topic.findMany({ select: { id: true, oldId: true } }),
        prisma.issue.findMany({ select: { id: true, oldId: true } }),
        prisma.article.findMany({ select: { id: true, oldId: true } }),
        prisma.queryEntry.findMany({ select: { id: true, oldId: true } }),
        prisma.videoCategory.findMany({ select: { id: true, oldId: true } }),
        prisma.linkCategory.findMany({ select: { id: true, oldId: true } }),
        prisma.book.findMany({ select: { oldId: true } }),
        prisma.video.findMany({ select: { oldId: true } }),
        prisma.link.findMany({ select: { oldId: true } }),
      ]),
    "pre-fetch existing"
  );
  const [eW, eT, eI, eA, eQ, eVC, eLC, eB, eV, eL] = existing;
  for (const r of eW) writerMap.set(r.oldId, r.id);
  for (const r of eT) topicMap.set(r.oldId, r.id);
  for (const r of eI) issueMap.set(r.oldId, r.id);
  for (const r of eA) articleMap.set(r.oldId, r.id);
  for (const r of eQ) queryMap.set(r.oldId, r.id);
  for (const r of eVC) videoCatMap.set(r.oldId, r.id);
  for (const r of eLC) linkCatMap.set(r.oldId, r.id);
  const existingBooks = new Set(eB.map((r) => r.oldId));
  const existingVideos = new Set(eV.map((r) => r.oldId));
  const existingLinks = new Set(eL.map((r) => r.oldId));
  console.log(
    `  existing: ${writerMap.size} writers, ${topicMap.size} topics, ${issueMap.size} issues, ${articleMap.size} articles, ${queryMap.size} queries`
  );

  // 1. Writers
  console.log(`Seeding ${writers.length} writers...`);
  for (const w of writers) {
    if (writerMap.has(w.ID)) continue;
    const record = await withRetry(() => prisma.writer.create({
      data: {
        oldId: w.ID,
        name: w.Name || "Unknown",
        slug: makeSlug(w.Name || "unknown"),
        email: w.Email || null,
        displayOnSite: w.DisplayOnSite ?? true,
        isQueryWriter: w.IsQueryWriter ?? false,
      },
    }), `writer ${w.ID}`);
    writerMap.set(w.ID, record.id);
  }

  // 2. Topics
  console.log(`Seeding ${topics.length} topics...`);
  for (const t of topics) {
    if (topicMap.has(t.ID)) continue;
    const record = await withRetry(() => prisma.topic.create({
      data: {
        oldId: t.ID,
        title: t.TopicTitle || "Untitled",
        slug: makeSlug(t.TopicTitle || "untitled"),
        display: t.Display ?? true,
        ranking: t.Ranking ?? 0,
        displayInList: t.DisplayInList ?? true,
      },
    }), `topic ${t.ID}`);
    topicMap.set(t.ID, record.id);
  }

  // 3. Video Categories
  console.log(`Seeding ${videoCategories.length} video categories...`);
  for (const vc of videoCategories) {
    if (videoCatMap.has(vc.ID)) continue;
    const record = await withRetry(() => prisma.videoCategory.create({
      data: {
        oldId: vc.ID,
        title: vc.Title || "Untitled",
        ranking: vc.Ranking ?? 0,
        display: vc.Display ?? true,
      },
    }), `videoCat ${vc.ID}`);
    videoCatMap.set(vc.ID, record.id);
  }

  // 4. Link Categories
  console.log(`Seeding ${linkCategories.length} link categories...`);
  for (const lc of linkCategories) {
    if (linkCatMap.has(lc.ID)) continue;
    const record = await withRetry(() => prisma.linkCategory.create({
      data: {
        oldId: lc.ID,
        title: lc.Title || "Untitled",
        ranking: lc.Ranking ?? 0,
        display: lc.Display ?? true,
      },
    }), `linkCat ${lc.ID}`);
    linkCatMap.set(lc.ID, record.id);
  }

  // 5. Issues
  console.log(`Seeding ${issues.length} issues...`);
  for (const i of issues) {
    if (issueMap.has(i.ID)) continue;
    const record = await withRetry(() => prisma.issue.create({
      data: {
        oldId: i.ID,
        title: i.IssueTitle || "Untitled Issue",
        slug: makeIssueSlug(i.IssueDate, i.IssueTitle || "issue"),
        volumeNumber: i.VolumeNumber ? String(i.VolumeNumber) : null,
        issueNumber: i.IssueNumber ? String(i.IssueNumber) : null,
        issueDate: i.IssueDate ? new Date(i.IssueDate) : null,
        display: i.Display ?? true,
        isSpecial: i.IsSpecial ?? false,
      },
    }), `issue ${i.ID}`);
    issueMap.set(i.ID, record.id);
  }

  // 6. Articles
  console.log(`Seeding ${content.length} articles...`);
  let articleSkipped = 0;
  let articleDone = 0;
  for (const a of content) {
    if (articleMap.has(a.ID)) continue;
    const writerId = writerMap.get(a.WriterID);
    const topicId = topicMap.get(a.TopicID);
    if (!writerId || !topicId) {
      articleSkipped++;
      continue;
    }
    const translatorId = a.TranslatorID ? writerMap.get(a.TranslatorID) : null;
    const record = await withRetry(() => prisma.article.create({
      data: {
        oldId: a.ID,
        title: a.Title || "Untitled",
        slug: makeSlug(a.Title || "untitled"),
        bodyHtml: cleanHtml(a.Content),
        topicId,
        writerId,
        translatorId: translatorId || null,
        dateAdded: a.DateAdded ? new Date(a.DateAdded) : null,
        display: a.Display ?? true,
        isImportant: a.IsImportant ?? false,
        isEditorial: a.IsEditorial ?? false,
        editorialIssueId: a.EditorialIssueID || null,
        isIssueIntro: a.IsIssueIntro ?? false,
        introIssueId: a.IntroIssueID || null,
      },
    }), `article ${a.ID}`);
    articleMap.set(a.ID, record.id);
    articleDone++;
    if (articleDone % 100 === 0) console.log(`  ...${articleDone} articles inserted`);
  }
  if (articleSkipped > 0) console.log(`  (skipped ${articleSkipped} articles with missing writer/topic)`);

  // Pre-fetch existing article-issue & query-issue link pairs to allow resume
  const existingAIL = await withRetry(
    () => prisma.articleIssueLink.findMany({ select: { articleId: true, issueId: true } }),
    "fetch existing AIL"
  );
  const existingQIL = await withRetry(
    () => prisma.queryIssueLink.findMany({ select: { queryId: true, issueId: true } }),
    "fetch existing QIL"
  );
  const ailSet = new Set(existingAIL.map((r) => `${r.articleId}:${r.issueId}`));
  const qilSet = new Set(existingQIL.map((r) => `${r.queryId}:${r.issueId}`));

  // 7. Queries
  console.log(`Seeding ${queries.length} queries...`);
  let querySkipped = 0;
  for (const q of queries) {
    if (queryMap.has(q.ID)) continue;
    const writerId = writerMap.get(q.WriterID);
    const topicId = topicMap.get(q.TopicID);
    if (!writerId || !topicId) {
      querySkipped++;
      continue;
    }
    const record = await withRetry(() => prisma.queryEntry.create({
      data: {
        oldId: q.ID,
        title: q.Title || "Untitled Query",
        slug: makeSlug(q.Title || "untitled-query"),
        questionHtml: cleanHtml(q.Question),
        answerHtml: cleanHtml(q.Answer),
        questioner: q.Questioner || null,
        questionerEmail: q.QuestionerEmail || null,
        topicId,
        writerId,
        dateAdded: q.DateAdded ? new Date(q.DateAdded) : null,
        display: q.Display ?? true,
        isImportant: q.IsImportant ?? false,
      },
    }), `query ${q.ID}`);
    queryMap.set(q.ID, record.id);
  }
  if (querySkipped > 0) console.log(`  (skipped ${querySkipped} queries with missing writer/topic)`);

  // 8. Books
  console.log(`Seeding ${books.length} books...`);
  for (const b of books) {
    if (existingBooks.has(b.ID)) continue;
    await withRetry(() => prisma.book.create({
      data: {
        oldId: b.ID,
        title: b.Title || "Untitled",
        slug: makeSlug(b.Title || "untitled"),
        isEbook: b.IsEbook ?? false,
        isBook: b.IsBook ?? false,
        writerId: b.WriterID ? writerMap.get(b.WriterID) || null : null,
        translatorId: b.TranslatorID ? writerMap.get(b.TranslatorID) || null : null,
        display: b.Display ?? true,
        fileName: b.FileName || "",
        postDate: b.PostDate ? new Date(b.PostDate) : null,
      },
    }), `book ${b.ID}`);
  }

  // 9. Videos
  console.log(`Seeding ${videos.length} videos...`);
  let videoSkipped = 0;
  for (const v of videos) {
    if (existingVideos.has(v.ID)) continue;
    const categoryId = videoCatMap.get(v.CategoryID);
    if (!categoryId) {
      videoSkipped++;
      continue;
    }
    await withRetry(() => prisma.video.create({
      data: {
        oldId: v.ID,
        title: v.Title || "Untitled",
        url: v.URL || "",
        categoryId,
        dateAdded: v.DateAdded ? new Date(v.DateAdded) : null,
        display: v.Display ?? true,
      },
    }), `video ${v.ID}`);
  }
  if (videoSkipped > 0) console.log(`  (skipped ${videoSkipped} videos with missing category)`);

  // 10. Links
  console.log(`Seeding ${links.length} links...`);
  for (const l of links) {
    if (existingLinks.has(l.ID)) continue;
    const categoryId = linkCatMap.get(l.CategoryID);
    if (!categoryId) continue;
    await withRetry(() => prisma.link.create({
      data: {
        oldId: l.ID,
        title: l.Title || "Untitled",
        url: l.URL || "",
        categoryId,
        dateAdded: l.DateAdded ? new Date(l.DateAdded) : null,
        display: l.Display ?? true,
      },
    }), `link ${l.ID}`);
  }

  // 11. Article-Issue Links
  console.log(`Seeding ${contentIssueLinks.length} article-issue links...`);
  let linkSkipped = 0;
  for (const cl of contentIssueLinks) {
    const articleId = articleMap.get(cl.ContentID);
    const issueId = issueMap.get(cl.IssueID);
    if (!articleId || !issueId) {
      linkSkipped++;
      continue;
    }
    if (ailSet.has(`${articleId}:${issueId}`)) continue;
    await withRetry(() => prisma.articleIssueLink.create({
      data: { articleId, issueId },
    }), `AIL ${articleId}/${issueId}`);
  }
  if (linkSkipped > 0) console.log(`  (skipped ${linkSkipped} with missing article/issue)`);

  // 12. Query-Issue Links
  console.log(`Seeding ${queryIssueLinks.length} query-issue links...`);
  let qLinkSkipped = 0;
  for (const ql of queryIssueLinks) {
    const queryId = queryMap.get(ql.QueryID);
    const issueId = issueMap.get(ql.IssueID);
    if (!queryId || !issueId) {
      qLinkSkipped++;
      continue;
    }
    if (qilSet.has(`${queryId}:${issueId}`)) continue;
    await withRetry(() => prisma.queryIssueLink.create({
      data: { queryId, issueId },
    }), `QIL ${queryId}/${issueId}`);
  }
  if (qLinkSkipped > 0) console.log(`  (skipped ${qLinkSkipped} with missing query/issue)`);

  console.log("\nSeed complete!");
  console.log(`  Writers: ${writerMap.size}`);
  console.log(`  Topics: ${topicMap.size}`);
  console.log(`  Issues: ${issueMap.size}`);
  console.log(`  Articles: ${articleMap.size}`);
  console.log(`  Queries: ${queryMap.size}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
