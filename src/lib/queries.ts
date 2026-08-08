import { ensurePrismaConnected, prisma } from "./db";
import type { Writer, Topic, Issue, Article, EBook } from "./types";
import { sample } from "./sample-data";
import { sanitizeArticleHtml } from "./html-sanitize";
import { logError } from "./log";

const DB_RETRY_DELAY_MS = 60_000;
const TRANSIENT_DATABASE_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "P1001",
  "P1002",
  "P1008",
  "P1017",
  "P2024",
]);

const globalForQueries = globalThis as unknown as {
  publicDatabaseUnavailableUntil?: number;
  publicDatabaseFallbackLoggedAt?: number;
};

function errorSignals(err: unknown): { codes: string[]; message: string } {
  const codes: string[] = [];
  const messages: string[] = [];
  const seen = new Set<unknown>();
  let current = err;

  for (let depth = 0; depth < 4 && current && !seen.has(current); depth += 1) {
    seen.add(current);
    if (current instanceof Error) messages.push(current.message);
    else messages.push(String(current));

    if (typeof current !== "object") break;
    const value = current as { code?: unknown; cause?: unknown };
    if (typeof value.code === "string") codes.push(value.code);
    current = value.cause;
  }

  return { codes, message: messages.join("\n") };
}

function isTransientDatabaseError(err: unknown): boolean {
  const { codes, message } = errorSignals(err);
  if (codes.some((code) => TRANSIENT_DATABASE_CODES.has(code))) return true;
  if (err instanceof Error && err.constructor.name === "PrismaClientRustPanicError") {
    return true;
  }

  return /(?:ECONNREFUSED|ECONNRESET|ETIMEDOUT|Can't reach database server|Connection pool timeout|Timed out fetching a new connection|max_connections(?:_per_hour)?|ERROR\s+42000\s+\(1226\)|Too many connections|PANIC:\s*timer has gone away)/i.test(
    message,
  );
}

function isDevelopmentConfigurationError(err: unknown): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  const { message } = errorSignals(err);
  return (
    (err instanceof Error && err.constructor.name === "PrismaClientInitializationError") ||
    message.includes("Environment variable not found")
  );
}

function noteTemporaryDatabaseFailure(err: unknown): void {
  const now = Date.now();
  globalForQueries.publicDatabaseUnavailableUntil = now + DB_RETRY_DELAY_MS;

  if (
    !globalForQueries.publicDatabaseFallbackLoggedAt ||
    now - globalForQueries.publicDatabaseFallbackLoggedAt >= DB_RETRY_DELAY_MS
  ) {
    globalForQueries.publicDatabaseFallbackLoggedAt = now;
    logError("queries.public-database-fallback", err, {
      retryAfterMs: DB_RETRY_DELAY_MS,
    });
  }
}

/** Keeps public pages available during short database outages without masking query/schema bugs. */
async function withFallback<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  if (
    globalForQueries.publicDatabaseUnavailableUntil &&
    Date.now() < globalForQueries.publicDatabaseUnavailableUntil
  ) {
    return fallback;
  }

  try {
    await ensurePrismaConnected();
    return await query();
  } catch (err: unknown) {
    if (isTransientDatabaseError(err)) {
      noteTemporaryDatabaseFailure(err);
      return fallback;
    }
    if (isDevelopmentConfigurationError(err)) {
      console.warn("[DB fallback] Database unavailable — using sample data");
      return fallback;
    }
    throw err;
  }
}

// Re-export types for convenience
export type { Writer, Topic, Issue, Article, EBook } from "./types";

// ─── Helpers ──────────────────────────────────────────────────

export function getMonthName(month: number): string {
  return [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ][month - 1];
}

export function groupIssuesByYear(issueList: Issue[]): Record<number, Issue[]> {
  return issueList.reduce(
    (acc, issue) => {
      if (!acc[issue.year]) acc[issue.year] = [];
      acc[issue.year].push(issue);
      return acc;
    },
    {} as Record<number, Issue[]>,
  );
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function excerpt(html: string, maxLen = 200): string {
  const text = decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  return text.length > maxLen ? text.slice(0, maxLen).trimEnd() + "..." : text;
}

function readingTime(html: string): number {
  const words = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

// Kept as a cheap read-time safety net until the A3.3 backfill cleans stored
// HTML in place; remove this call site (mapArticle / mapQuery) once
// `scripts/clean-word-residue.mjs --apply` has completed in production.
// Write-time sanitization now lives in sanitizeArticleHtml; this is a passthrough
// to a single source of truth.
function sanitizeHtml(html: string): string {
  return sanitizeArticleHtml(html);
}

// ─── Mappers (Prisma → Interface) ────────────────────────────

type PrismaWriter = {
  id: number; name: string; slug: string; email: string | null;
  displayOnSite: boolean; isQueryWriter: boolean;
  _count?: { articles?: number; queries?: number };
};

function mapWriter(w: PrismaWriter): Writer {
  return {
    id: String(w.id),
    name: w.name,
    slug: w.slug,
    bio: "", // writers in the original DB have no bio field
    articleCount: w._count?.articles ?? 0,
  };
}

type PrismaTopic = {
  id: number; title: string; slug: string; display: boolean;
  ranking: number; displayInList: boolean;
  _count?: { articles?: number; queries?: number };
};

function mapTopic(t: PrismaTopic, type?: "article" | "query"): Topic {
  return {
    id: String(t.id),
    name: t.title,
    slug: t.slug,
    description: "",
    articleCount: (t._count?.articles ?? 0) + (t._count?.queries ?? 0),
    type: type ?? "article",
  };
}

type PrismaIssue = {
  id: number; title: string; slug: string; volumeNumber: string | null;
  description: string | null; issueNumber: string | null; issueDate: Date | null;
  display: boolean; isSpecial: boolean;
  _count?: { articleLinks?: number; queryLinks?: number };
};

function mapIssue(i: PrismaIssue): Issue {
  const d = i.issueDate;
  return {
    id: i.slug, // use slug as the public id (e.g. "2026-03")
    year: d ? d.getFullYear() : 0,
    month: d ? d.getMonth() + 1 : 0,
    volume: i.volumeNumber ? parseInt(i.volumeNumber, 10) : 0,
    issueNumber: i.issueNumber ? parseInt(i.issueNumber, 10) : 0,
    title: i.title,
    description: i.description,
    isSpecial: i.isSpecial,
    articleCount: (i._count?.articleLinks ?? 0) + (i._count?.queryLinks ?? 0),
  };
}

type PrismaArticle = {
  id: number; title: string; slug: string; bodyHtml: string;
  dateAdded: Date | null; display: boolean;
  editorialIssueId?: number | null;
  introIssueId?: number | null;
  topic: PrismaTopic; writer: PrismaWriter;
  translator?: { id: number; name: string; slug: string } | null;
  issueLinks: { issue: PrismaIssue }[];
};

function mapArticle(a: PrismaArticle, contextIssue?: PrismaIssue | null): Article {
  const issue = contextIssue ?? a.issueLinks[0]?.issue ?? null;
  return {
    id: String(a.id),
    title: a.title,
    slug: a.slug,
    excerpt: excerpt(a.bodyHtml),
    bodyHtml: sanitizeHtml(a.bodyHtml),
    writer: mapWriter(a.writer),
    topic: mapTopic(a.topic),
    issue: issue ? mapIssue(issue) : null,
    translator: a.translator
      ? { name: a.translator.name, slug: a.translator.slug }
      : null,
    type: "article",
    createdAt: a.dateAdded?.toISOString().split("T")[0] ?? "",
    readingTime: readingTime(a.bodyHtml),
  };
}

type PrismaQuery = {
  id: number; title: string; slug: string;
  questionHtml: string; answerHtml: string | null;
  dateAdded: Date | null; display: boolean;
  topic: PrismaTopic; writer: PrismaWriter;
  issueLinks: { issue: PrismaIssue }[];
};

function mapQuery(q: PrismaQuery): Article {
  const issue = q.issueLinks[0]?.issue;
  const body = [q.questionHtml, q.answerHtml].filter(Boolean).join("\n");
  return {
    id: `q${q.id}`,
    title: q.title,
    slug: q.slug,
    excerpt: excerpt(q.questionHtml),
    bodyHtml: sanitizeHtml(body),
    writer: mapWriter(q.writer),
    topic: mapTopic(q.topic, "query"),
    issue: issue ? mapIssue(issue) : null,
    translator: null,
    type: "query",
    createdAt: q.dateAdded?.toISOString().split("T")[0] ?? "",
    readingTime: readingTime(body),
  };
}

// Shared includes for article queries
const articleInclude = {
  topic: true,
  writer: true,
  translator: true,
  issueLinks: { include: { issue: true }, take: 1 },
} as const;

const queryInclude = {
  topic: true,
  writer: true,
  issueLinks: { include: { issue: true }, take: 1 },
} as const;

// ─── Query Functions ─────────────────────────────────────────

// --- Home Page ---

export async function getLatestIssue(): Promise<Issue | null> {
  return withFallback(async () => {
    const issue = await prisma.issue.findFirst({
      where: { display: true },
      orderBy: { issueDate: "desc" },
      include: { _count: { select: { articleLinks: true, queryLinks: true } } },
    });
    return issue ? mapIssue(issue) : null;
  }, sample.latestIssue);
}

export async function getFeaturedArticle(): Promise<Article | null> {
  return withFallback(async () => {
    // The home hero is the "Editorial" slot (see app/page.tsx) — feature only
    // editorial articles. The most recent one normally belongs to the current
    // issue, keeping the "From this month's issue" eyebrow truthful.
    const article = await prisma.article.findFirst({
      where: { display: true, isEditorial: true },
      orderBy: { dateAdded: "desc" },
      include: articleInclude,
    });
    return article ? mapArticle(article as PrismaArticle) : null;
  }, sample.featuredArticle);
}

export async function getRecentArticles(limit: number): Promise<Article[]> {
  return withFallback(async () => {
    const articles = await prisma.article.findMany({
      where: { display: true },
      orderBy: { dateAdded: "desc" },
      take: limit + 1, // +1 to skip featured
      include: articleInclude,
    });
    return articles.slice(1, limit + 1).map((article) =>
      mapArticle(article as PrismaArticle),
    );
  }, sample.recentArticles.slice(0, limit));
}

export async function getLatestQueries(limit: number): Promise<Article[]> {
  return withFallback(async () => {
    const queries = await prisma.queryEntry.findMany({
      where: { display: true },
      orderBy: { dateAdded: "desc" },
      take: limit,
      include: queryInclude,
    });
    return queries.map((query) => mapQuery(query as PrismaQuery));
  }, sample.latestQueries.slice(0, limit));
}

export async function getFeaturedWriters(limit: number): Promise<Writer[]> {
  return withFallback(async () => {
    const writers = await prisma.writer.findMany({
      where: { displayOnSite: true },
      orderBy: { name: "asc" },
      take: limit,
      include: { _count: { select: { articles: true } } },
    });
    return writers.map(mapWriter);
  }, sample.featuredWriters.slice(0, limit));
}

export async function getFeaturedTopics(limit: number): Promise<Topic[]> {
  return withFallback(async () => {
    const topics = await prisma.topic.findMany({
      where: { displayInList: true },
      orderBy: { ranking: "asc" },
      take: limit,
      include: { _count: { select: { articles: true, queries: true } } },
    });
    return topics.map((t) => mapTopic(t));
  }, sample.featuredTopics.slice(0, limit));
}

// --- Issues ---

export async function getAllIssues(): Promise<Issue[]> {
  return withFallback(async () => {
    const issues = await prisma.issue.findMany({
      where: { display: true },
      orderBy: { issueDate: "desc" },
      include: { _count: { select: { articleLinks: true, queryLinks: true } } },
    });
    return issues.map(mapIssue);
  }, sample.allIssues);
}

export async function getSpecialIssues(): Promise<Issue[]> {
  return withFallback(async () => {
    const issues = await prisma.issue.findMany({
      where: { display: true, isSpecial: true },
      orderBy: { issueDate: "desc" },
      include: { _count: { select: { articleLinks: true, queryLinks: true } } },
    });
    return issues.map(mapIssue);
  }, sample.allIssues.filter((i) => i.isSpecial));
}

export async function getIssueBySlug(slug: string): Promise<Issue | null> {
  return withFallback(async () => {
    const issue = await prisma.issue.findUnique({
      where: { slug },
      include: { _count: { select: { articleLinks: true, queryLinks: true } } },
    });
    return issue ? mapIssue(issue) : null;
  }, sample.latestIssue);
}

export async function getIssueDbId(slug: string): Promise<number | null> {
  return withFallback(async () => {
    const issue = await prisma.issue.findUnique({ where: { slug }, select: { id: true } });
    return issue?.id ?? null;
  }, 1);
}

export async function getArticlesForIssue(issueSlug: string): Promise<Article[]> {
  return withFallback(async () => {
    const issue = await prisma.issue.findUnique({ where: { slug: issueSlug }, select: { id: true } });
    if (!issue) return [];

    const [linked, editorial, intro] = await Promise.all([
      prisma.articleIssueLink.findMany({
        where: { issueId: issue.id, article: { display: true } },
        include: { article: { include: articleInclude } },
      }),
      prisma.article.findMany({
        where: { editorialIssueId: issue.id, display: true },
        include: articleInclude,
      }),
      prisma.article.findMany({
        where: { introIssueId: issue.id, display: true },
        include: articleInclude,
      }),
    ]);

    const seen = new Set<number>();
    const ordered: Article[] = [];
    const push = (raw: PrismaArticle) => {
      if (seen.has(raw.id)) return;
      seen.add(raw.id);
      ordered.push(mapArticle(raw));
    };
    intro.forEach(push);
    editorial.forEach(push);
    linked.forEach((l) => push(l.article));
    return ordered;
  }, sample.recentArticles);
}

export async function getEditorialForIssue(issueSlug: string): Promise<Article | null> {
  return withFallback(async () => {
    const issue = await prisma.issue.findUnique({ where: { slug: issueSlug }, select: { id: true } });
    if (!issue) return null;
    const article = await prisma.article.findFirst({
      where: { editorialIssueId: issue.id, display: true },
      include: articleInclude,
      orderBy: { dateAdded: "desc" },
    });
    return article ? mapArticle(article as PrismaArticle) : null;
  }, null);
}

export async function getQueriesForIssue(issueSlug: string): Promise<Article[]> {
  return withFallback(async () => {
    const issue = await prisma.issue.findUnique({ where: { slug: issueSlug }, select: { id: true } });
    if (!issue) return [];
    const links = await prisma.queryIssueLink.findMany({
      where: { issueId: issue.id },
      include: { query: { include: queryInclude } },
    });
    return links
      .filter((l) => l.query.display)
      .map((link) => mapQuery(link.query as PrismaQuery));
  }, sample.latestQueries);
}

// --- Articles ---

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  return withFallback(async () => {
    const article = await prisma.article.findFirst({
      where: { slug, display: true },
      include: articleInclude,
    });
    if (article) {
      const a = article as PrismaArticle;
      const fallbackIssueId: number | null =
        a.introIssueId ?? a.editorialIssueId ?? null;
      let contextIssue: PrismaIssue | null = null;
      if (!a.issueLinks[0] && fallbackIssueId) {
        contextIssue = await prisma.issue.findUnique({
          where: { id: fallbackIssueId },
          include: { _count: { select: { articleLinks: true, queryLinks: true } } },
        }) as PrismaIssue | null;
      }
      return mapArticle(a, contextIssue);
    }

    // Check queries too (they share the article detail page)
    const query = await prisma.queryEntry.findFirst({
      where: { slug, display: true },
      include: queryInclude,
    });
    return query ? mapQuery(query as PrismaQuery) : null;
  }, sample.getArticle(slug));
}

export async function getRelatedArticles(topicSlug: string, excludeSlug: string, limit: number): Promise<Article[]> {
  return withFallback(async () => {
    const topic = await prisma.topic.findUnique({ where: { slug: topicSlug }, select: { id: true } });
    if (!topic) return [];
    const articles = await prisma.article.findMany({
      where: { topicId: topic.id, display: true, slug: { not: excludeSlug } },
      orderBy: { dateAdded: "desc" },
      take: limit,
      include: articleInclude,
    });
    return articles.map((article) => mapArticle(article as PrismaArticle));
  }, sample.recentArticles.filter((a) => a.slug !== excludeSlug).slice(0, limit));
}

export async function getAllArticleSlugs(): Promise<string[]> {
  return withFallback(async () => {
    const articles = await prisma.article.findMany({ where: { display: true }, select: { slug: true } });
    const queries = await prisma.queryEntry.findMany({ where: { display: true }, select: { slug: true } });
    return [...articles.map((a) => a.slug), ...queries.map((q) => q.slug)];
  }, sample.allArticleSlugs);
}

export async function getAllIssueSlugs(): Promise<string[]> {
  return withFallback(async () => {
    const issues = await prisma.issue.findMany({ where: { display: true }, select: { slug: true } });
    return issues.map((i) => i.slug);
  }, sample.allIssueSlugs);
}

// --- Writers ---

export async function getAllWriters(): Promise<Writer[]> {
  return withFallback(async () => {
    const writers = await prisma.writer.findMany({
      where: { displayOnSite: true },
      orderBy: { name: "asc" },
      include: { _count: { select: { articles: true } } },
    });
    return writers.map(mapWriter);
  }, sample.allWriters);
}

export async function getWriterBySlug(slug: string): Promise<Writer | null> {
  return withFallback(async () => {
    const writer = await prisma.writer.findUnique({
      where: { slug },
      include: { _count: { select: { articles: true } } },
    });
    return writer ? mapWriter(writer) : null;
  }, sample.getWriter(slug));
}

export async function getArticlesByWriter(writerSlug: string): Promise<Article[]> {
  return withFallback(async () => {
    const writer = await prisma.writer.findUnique({ where: { slug: writerSlug }, select: { id: true } });
    if (!writer) return [];
    const articles = await prisma.article.findMany({
      where: { writerId: writer.id, display: true },
      orderBy: { dateAdded: "desc" },
      include: articleInclude,
    });
    return articles.map((article) => mapArticle(article as PrismaArticle));
  }, sample.recentArticles);
}

export async function getArticlesByWriterPaged(
  writerSlug: string,
  page: number,
  perPage: number,
): Promise<{ articles: Article[]; total: number }> {
  const safePage = Math.max(1, page);
  return withFallback(async () => {
    const writer = await prisma.writer.findUnique({ where: { slug: writerSlug }, select: { id: true } });
    if (!writer) return { articles: [], total: 0 };
    const where = { writerId: writer.id, display: true } as const;
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { dateAdded: "desc" },
        skip: (safePage - 1) * perPage,
        take: perPage,
        include: articleInclude,
      }),
      prisma.article.count({ where }),
    ]);
    return {
      articles: articles.map((article) => mapArticle(article as PrismaArticle)),
      total,
    };
  }, {
    articles: sample.recentArticles.slice((safePage - 1) * perPage, safePage * perPage),
    total: sample.recentArticles.length,
  });
}

export async function getAllWriterSlugs(): Promise<string[]> {
  return withFallback(async () => {
    const writers = await prisma.writer.findMany({ where: { displayOnSite: true }, select: { slug: true } });
    return writers.map((w) => w.slug);
  }, sample.allWriterSlugs);
}

// --- Topics ---

export async function getAllTopics(): Promise<Topic[]> {
  return withFallback(async () => {
    const topics = await prisma.topic.findMany({
      where: { displayInList: true },
      orderBy: { ranking: "asc" },
      include: { _count: { select: { articles: true, queries: true } } },
    });
    return topics.map((t) => mapTopic(t));
  }, sample.allTopics);
}

export async function getTopicBySlug(slug: string): Promise<Topic | null> {
  return withFallback(async () => {
    const topic = await prisma.topic.findUnique({
      where: { slug },
      include: { _count: { select: { articles: true, queries: true } } },
    });
    return topic ? mapTopic(topic) : null;
  }, sample.getTopic(slug));
}

export async function getArticlesByTopic(topicSlug: string): Promise<Article[]> {
  return withFallback(async () => {
    const topic = await prisma.topic.findUnique({ where: { slug: topicSlug }, select: { id: true } });
    if (!topic) return [];
    const articles = await prisma.article.findMany({
      where: { topicId: topic.id, display: true },
      orderBy: { dateAdded: "desc" },
      include: articleInclude,
    });
    return articles.map((article) => mapArticle(article as PrismaArticle));
  }, sample.recentArticles);
}

export async function getArticlesByTopicPaged(
  topicSlug: string,
  page: number,
  perPage: number,
): Promise<{ articles: Article[]; total: number }> {
  const safePage = Math.max(1, page);
  return withFallback(async () => {
    const topic = await prisma.topic.findUnique({ where: { slug: topicSlug }, select: { id: true } });
    if (!topic) return { articles: [], total: 0 };
    const where = { topicId: topic.id, display: true } as const;
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { dateAdded: "desc" },
        skip: (safePage - 1) * perPage,
        take: perPage,
        include: articleInclude,
      }),
      prisma.article.count({ where }),
    ]);
    return {
      articles: articles.map((article) => mapArticle(article as PrismaArticle)),
      total,
    };
  }, {
    articles: sample.recentArticles.slice((safePage - 1) * perPage, safePage * perPage),
    total: sample.recentArticles.length,
  });
}

export async function getAllTopicSlugs(): Promise<string[]> {
  return withFallback(async () => {
    const topics = await prisma.topic.findMany({ where: { displayInList: true }, select: { slug: true } });
    return topics.map((t) => t.slug);
  }, sample.allTopicSlugs);
}

// --- Queries by writer/topic ---

export async function getQueryWriters(): Promise<Writer[]> {
  return withFallback(async () => {
    const writers = await prisma.writer.findMany({
      where: { displayOnSite: true, queries: { some: { display: true } } },
      orderBy: { name: "asc" },
      include: { _count: { select: { queries: true } } },
    });
    return writers.map((w) => ({
      ...mapWriter(w),
      articleCount: w._count?.queries ?? 0,
    }));
  }, sample.queryWriters);
}

export async function getQueryTopics(): Promise<Topic[]> {
  return withFallback(async () => {
    const topics = await prisma.topic.findMany({
      where: { displayInList: true, queries: { some: { display: true } } },
      orderBy: { ranking: "asc" },
      include: { _count: { select: { queries: true } } },
    });
    return topics.map((t) => ({
      ...mapTopic(t, "query"),
      articleCount: t._count?.queries ?? 0,
    }));
  }, sample.queryTopics);
}

export async function getQueriesByWriter(writerSlug: string): Promise<Article[]> {
  return withFallback(async () => {
    const writer = await prisma.writer.findUnique({ where: { slug: writerSlug }, select: { id: true } });
    if (!writer) return [];
    const queries = await prisma.queryEntry.findMany({
      where: { writerId: writer.id, display: true },
      orderBy: { dateAdded: "desc" },
      include: queryInclude,
    });
    return queries.map((query) => mapQuery(query as PrismaQuery));
  }, sample.latestQueries);
}

export async function getQueriesByTopic(topicSlug: string): Promise<Article[]> {
  return withFallback(async () => {
    const topic = await prisma.topic.findUnique({ where: { slug: topicSlug }, select: { id: true } });
    if (!topic) return [];
    const queries = await prisma.queryEntry.findMany({
      where: { topicId: topic.id, display: true },
      orderBy: { dateAdded: "desc" },
      include: queryInclude,
    });
    return queries.map((query) => mapQuery(query as PrismaQuery));
  }, sample.latestQueries);
}

// --- Search ---

export type SearchHit = {
  kind: "article" | "query" | "writer" | "topic" | "issue";
  title: string;
  href: string;
  subtitle: string;
};

export type SearchResults = {
  query: string;
  articles: SearchHit[];
  queries: SearchHit[];
  writers: SearchHit[];
  topics: SearchHit[];
  issues: SearchHit[];
  total: number;
};

export async function searchAll(rawQuery: string, limit = 20): Promise<SearchResults> {
  const query = rawQuery.trim().slice(0, 100);
  const empty: SearchResults = {
    query, articles: [], queries: [], writers: [], topics: [], issues: [], total: 0,
  };
  if (query.length < 2) return empty;

  return withFallback(
    async () => {
      // One DB round-trip: five independent findMany calls run in parallel.
      // Each uses `select` to skip the LongText `bodyHtml`/`questionHtml` columns.
      const [articles, queries, writers, topics, issues] = await Promise.all([
        prisma.article.findMany({
          where: { display: true, title: { contains: query } },
          orderBy: { dateAdded: "desc" },
          take: limit,
          select: {
            title: true, slug: true, dateAdded: true,
            writer: { select: { name: true } },
            topic: { select: { title: true } },
          },
        }),
        prisma.queryEntry.findMany({
          where: { display: true, title: { contains: query } },
          orderBy: { dateAdded: "desc" },
          take: limit,
          select: {
            title: true, slug: true, dateAdded: true,
            writer: { select: { name: true } },
            topic: { select: { title: true } },
          },
        }),
        prisma.writer.findMany({
          where: { displayOnSite: true, name: { contains: query } },
          orderBy: { name: "asc" },
          take: limit,
          select: { slug: true, name: true, _count: { select: { articles: true } } },
        }),
        prisma.topic.findMany({
          where: { displayInList: true, title: { contains: query } },
          orderBy: { ranking: "asc" },
          take: limit,
          select: {
            slug: true, title: true,
            _count: { select: { articles: true, queries: true } },
          },
        }),
        prisma.issue.findMany({
          where: { display: true, title: { contains: query } },
          orderBy: { issueDate: "desc" },
          take: limit,
          select: {
            slug: true, title: true, issueDate: true,
            _count: { select: { articleLinks: true, queryLinks: true } },
          },
        }),
      ]);

      const fmtDate = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

      const articleHits: SearchHit[] = articles.map((a) => ({
        kind: "article",
        title: a.title,
        href: `/articles/${a.slug}`,
        subtitle: [a.writer.name, a.topic.title, fmtDate(a.dateAdded)].filter(Boolean).join(" · "),
      }));
      const queryHits: SearchHit[] = queries.map((q) => ({
        kind: "query",
        title: q.title,
        href: `/articles/${q.slug}`,
        subtitle: [q.writer.name, q.topic.title, fmtDate(q.dateAdded)].filter(Boolean).join(" · "),
      }));
      const writerHits: SearchHit[] = writers.map((w) => ({
        kind: "writer",
        title: w.name,
        href: `/articles/writers/${w.slug}`,
        subtitle: `${w._count?.articles ?? 0} articles`,
      }));
      const topicHits: SearchHit[] = topics.map((t) => ({
        kind: "topic",
        title: t.title,
        href: `/articles/topics/${t.slug}`,
        subtitle: `${(t._count?.articles ?? 0) + (t._count?.queries ?? 0)} pieces`,
      }));
      const issueHits: SearchHit[] = issues.map((i) => ({
        kind: "issue",
        title: i.title,
        href: `/issues/${i.slug}`,
        subtitle: [
          `${(i._count?.articleLinks ?? 0) + (i._count?.queryLinks ?? 0)} pieces`,
          fmtDate(i.issueDate),
        ].filter(Boolean).join(" · "),
      }));

      return {
        query,
        articles: articleHits,
        queries: queryHits,
        writers: writerHits,
        topics: topicHits,
        issues: issueHits,
        total:
          articleHits.length + queryHits.length + writerHits.length +
          topicHits.length + issueHits.length,
      };
    },
    searchSampleFallback(query, limit),
  );
}

function searchSampleFallback(query: string, limit: number): SearchResults {
  const q = query.toLowerCase();
  const has = (s: string) => s.toLowerCase().includes(q);
  const articles = sample.recentArticles
    .filter((a) => a.type === "article" && has(a.title))
    .slice(0, limit)
    .map<SearchHit>((a) => ({
      kind: "article",
      title: a.title,
      href: `/articles/${a.slug}`,
      subtitle: [a.writer.name, a.topic.name, a.createdAt].filter(Boolean).join(" · "),
    }));
  const queries = sample.latestQueries
    .filter((a) => has(a.title))
    .slice(0, limit)
    .map<SearchHit>((a) => ({
      kind: "query",
      title: a.title,
      href: `/articles/${a.slug}`,
      subtitle: [a.writer.name, a.topic.name, a.createdAt].filter(Boolean).join(" · "),
    }));
  const writers = sample.allWriters
    .filter((w) => has(w.name))
    .slice(0, limit)
    .map<SearchHit>((w) => ({
      kind: "writer",
      title: w.name,
      href: `/articles/writers/${w.slug}`,
      subtitle: `${w.articleCount} articles`,
    }));
  const topics = sample.allTopics
    .filter((t) => has(t.name))
    .slice(0, limit)
    .map<SearchHit>((t) => ({
      kind: "topic",
      title: t.name,
      href: `/articles/topics/${t.slug}`,
      subtitle: `${t.articleCount} pieces`,
    }));
  const issues = sample.allIssues
    .filter((i) => has(i.title))
    .slice(0, limit)
    .map<SearchHit>((i) => ({
      kind: "issue",
      title: i.title,
      href: `/issues/${i.id}`,
      subtitle: `${i.articleCount} pieces`,
    }));
  return {
    query,
    articles, queries, writers, topics, issues,
    total: articles.length + queries.length + writers.length + topics.length + issues.length,
  };
}

// --- E-Books ---

export async function getAllEbooks(): Promise<EBook[]> {
  return withFallback(async () => {
    const books = await prisma.book.findMany({
      where: { display: true },
      orderBy: { postDate: "desc" },
      include: { writer: true, translator: true },
    });
    return books.map((b) => ({
      id: String(b.id),
      title: b.title,
      author: b.writer?.name ?? "Unknown",
      translator: b.translator?.name,
      description: "",
      coverUrl: null,
      fileUrl: `/files/books/${b.fileName}`,
    }));
  }, sample.allEbooks);
}
