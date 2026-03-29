import { prisma } from "./db";
import type { Writer, Topic, Issue, Article, EBook } from "./types";

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

function excerpt(html: string, maxLen = 200): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > maxLen ? text.slice(0, maxLen).trimEnd() + "..." : text;
}

function readingTime(html: string): number {
  const words = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
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
  issueNumber: string | null; issueDate: Date | null;
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
    isSpecial: i.isSpecial,
    articleCount: (i._count?.articleLinks ?? 0) + (i._count?.queryLinks ?? 0),
  };
}

type PrismaArticle = {
  id: number; title: string; slug: string; bodyHtml: string;
  dateAdded: Date | null; display: boolean;
  topic: PrismaTopic; writer: PrismaWriter;
  issueLinks: { issue: PrismaIssue }[];
};

function mapArticle(a: PrismaArticle): Article {
  const issue = a.issueLinks[0]?.issue;
  return {
    id: String(a.id),
    title: a.title,
    slug: a.slug,
    excerpt: excerpt(a.bodyHtml),
    bodyHtml: a.bodyHtml,
    writer: mapWriter(a.writer),
    topic: mapTopic(a.topic),
    issue: issue ? mapIssue(issue) : { id: "", year: 0, month: 0, volume: 0, issueNumber: 0, title: "", isSpecial: false, articleCount: 0 },
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
    bodyHtml: body,
    writer: mapWriter(q.writer),
    topic: mapTopic(q.topic, "query"),
    issue: issue ? mapIssue(issue) : { id: "", year: 0, month: 0, volume: 0, issueNumber: 0, title: "", isSpecial: false, articleCount: 0 },
    type: "query",
    createdAt: q.dateAdded?.toISOString().split("T")[0] ?? "",
    readingTime: readingTime(body),
  };
}

// Shared includes for article queries
const articleInclude = {
  topic: true,
  writer: true,
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
  const issue = await prisma.issue.findFirst({
    where: { display: true },
    orderBy: { issueDate: "desc" },
    include: { _count: { select: { articleLinks: true, queryLinks: true } } },
  });
  return issue ? mapIssue(issue) : null;
}

export async function getFeaturedArticle(): Promise<Article | null> {
  const article = await prisma.article.findFirst({
    where: { display: true },
    orderBy: { dateAdded: "desc" },
    include: articleInclude,
  });
  return article ? mapArticle(article as any) : null;
}

export async function getRecentArticles(limit: number): Promise<Article[]> {
  const articles = await prisma.article.findMany({
    where: { display: true },
    orderBy: { dateAdded: "desc" },
    take: limit + 1, // +1 to skip featured
    include: articleInclude,
  });
  return articles.slice(1, limit + 1).map((a) => mapArticle(a as any));
}

export async function getLatestQueries(limit: number): Promise<Article[]> {
  const queries = await prisma.queryEntry.findMany({
    where: { display: true },
    orderBy: { dateAdded: "desc" },
    take: limit,
    include: queryInclude,
  });
  return queries.map((q) => mapQuery(q as any));
}

export async function getFeaturedWriters(limit: number): Promise<Writer[]> {
  const writers = await prisma.writer.findMany({
    where: { displayOnSite: true },
    orderBy: { name: "asc" },
    take: limit,
    include: { _count: { select: { articles: true } } },
  });
  return writers.map(mapWriter);
}

export async function getFeaturedTopics(limit: number): Promise<Topic[]> {
  const topics = await prisma.topic.findMany({
    where: { displayInList: true },
    orderBy: { ranking: "asc" },
    take: limit,
    include: { _count: { select: { articles: true, queries: true } } },
  });
  return topics.map((t) => mapTopic(t));
}

// --- Issues ---

export async function getAllIssues(): Promise<Issue[]> {
  const issues = await prisma.issue.findMany({
    where: { display: true },
    orderBy: { issueDate: "desc" },
    include: { _count: { select: { articleLinks: true, queryLinks: true } } },
  });
  return issues.map(mapIssue);
}

export async function getIssueBySlug(slug: string): Promise<Issue | null> {
  const issue = await prisma.issue.findUnique({
    where: { slug },
    include: { _count: { select: { articleLinks: true, queryLinks: true } } },
  });
  return issue ? mapIssue(issue) : null;
}

export async function getIssueDbId(slug: string): Promise<number | null> {
  const issue = await prisma.issue.findUnique({ where: { slug }, select: { id: true } });
  return issue?.id ?? null;
}

export async function getArticlesForIssue(issueSlug: string): Promise<Article[]> {
  const issue = await prisma.issue.findUnique({ where: { slug: issueSlug }, select: { id: true } });
  if (!issue) return [];
  const links = await prisma.articleIssueLink.findMany({
    where: { issueId: issue.id },
    include: { article: { include: articleInclude } },
  });
  return links
    .filter((l) => l.article.display)
    .map((l) => mapArticle(l.article as any));
}

export async function getQueriesForIssue(issueSlug: string): Promise<Article[]> {
  const issue = await prisma.issue.findUnique({ where: { slug: issueSlug }, select: { id: true } });
  if (!issue) return [];
  const links = await prisma.queryIssueLink.findMany({
    where: { issueId: issue.id },
    include: { query: { include: queryInclude } },
  });
  return links
    .filter((l) => l.query.display)
    .map((l) => mapQuery(l.query as any));
}

// --- Articles ---

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const article = await prisma.article.findFirst({
    where: { slug, display: true },
    include: articleInclude,
  });
  if (article) return mapArticle(article as any);

  // Check queries too (they share the article detail page)
  const query = await prisma.queryEntry.findFirst({
    where: { slug, display: true },
    include: queryInclude,
  });
  return query ? mapQuery(query as any) : null;
}

export async function getRelatedArticles(topicSlug: string, excludeSlug: string, limit: number): Promise<Article[]> {
  const topic = await prisma.topic.findUnique({ where: { slug: topicSlug }, select: { id: true } });
  if (!topic) return [];
  const articles = await prisma.article.findMany({
    where: { topicId: topic.id, display: true, slug: { not: excludeSlug } },
    orderBy: { dateAdded: "desc" },
    take: limit,
    include: articleInclude,
  });
  return articles.map((a) => mapArticle(a as any));
}

export async function getAllArticleSlugs(): Promise<string[]> {
  const articles = await prisma.article.findMany({ where: { display: true }, select: { slug: true } });
  const queries = await prisma.queryEntry.findMany({ where: { display: true }, select: { slug: true } });
  return [...articles.map((a) => a.slug), ...queries.map((q) => q.slug)];
}

export async function getAllIssueSlugs(): Promise<string[]> {
  const issues = await prisma.issue.findMany({ where: { display: true }, select: { slug: true } });
  return issues.map((i) => i.slug);
}

// --- Writers ---

export async function getAllWriters(): Promise<Writer[]> {
  const writers = await prisma.writer.findMany({
    where: { displayOnSite: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: true } } },
  });
  return writers.map(mapWriter);
}

export async function getWriterBySlug(slug: string): Promise<Writer | null> {
  const writer = await prisma.writer.findUnique({
    where: { slug },
    include: { _count: { select: { articles: true } } },
  });
  return writer ? mapWriter(writer) : null;
}

export async function getArticlesByWriter(writerSlug: string): Promise<Article[]> {
  const writer = await prisma.writer.findUnique({ where: { slug: writerSlug }, select: { id: true } });
  if (!writer) return [];
  const articles = await prisma.article.findMany({
    where: { writerId: writer.id, display: true },
    orderBy: { dateAdded: "desc" },
    include: articleInclude,
  });
  return articles.map((a) => mapArticle(a as any));
}

export async function getAllWriterSlugs(): Promise<string[]> {
  const writers = await prisma.writer.findMany({ where: { displayOnSite: true }, select: { slug: true } });
  return writers.map((w) => w.slug);
}

// --- Topics ---

export async function getAllTopics(): Promise<Topic[]> {
  const topics = await prisma.topic.findMany({
    where: { displayInList: true },
    orderBy: { ranking: "asc" },
    include: { _count: { select: { articles: true, queries: true } } },
  });
  return topics.map((t) => mapTopic(t));
}

export async function getTopicBySlug(slug: string): Promise<Topic | null> {
  const topic = await prisma.topic.findUnique({
    where: { slug },
    include: { _count: { select: { articles: true, queries: true } } },
  });
  return topic ? mapTopic(topic) : null;
}

export async function getArticlesByTopic(topicSlug: string): Promise<Article[]> {
  const topic = await prisma.topic.findUnique({ where: { slug: topicSlug }, select: { id: true } });
  if (!topic) return [];
  const articles = await prisma.article.findMany({
    where: { topicId: topic.id, display: true },
    orderBy: { dateAdded: "desc" },
    include: articleInclude,
  });
  return articles.map((a) => mapArticle(a as any));
}

export async function getAllTopicSlugs(): Promise<string[]> {
  const topics = await prisma.topic.findMany({ where: { displayInList: true }, select: { slug: true } });
  return topics.map((t) => t.slug);
}

// --- Queries by writer/topic ---

export async function getQueryWriters(): Promise<Writer[]> {
  const writers = await prisma.writer.findMany({
    where: { displayOnSite: true, queries: { some: { display: true } } },
    orderBy: { name: "asc" },
    include: { _count: { select: { queries: true } } },
  });
  return writers.map((w) => ({
    ...mapWriter(w),
    articleCount: w._count?.queries ?? 0,
  }));
}

export async function getQueryTopics(): Promise<Topic[]> {
  const topics = await prisma.topic.findMany({
    where: { displayInList: true, queries: { some: { display: true } } },
    orderBy: { ranking: "asc" },
    include: { _count: { select: { queries: true } } },
  });
  return topics.map((t) => ({
    ...mapTopic(t, "query"),
    articleCount: t._count?.queries ?? 0,
  }));
}

export async function getQueriesByWriter(writerSlug: string): Promise<Article[]> {
  const writer = await prisma.writer.findUnique({ where: { slug: writerSlug }, select: { id: true } });
  if (!writer) return [];
  const queries = await prisma.queryEntry.findMany({
    where: { writerId: writer.id, display: true },
    orderBy: { dateAdded: "desc" },
    include: queryInclude,
  });
  return queries.map((q) => mapQuery(q as any));
}

export async function getQueriesByTopic(topicSlug: string): Promise<Article[]> {
  const topic = await prisma.topic.findUnique({ where: { slug: topicSlug }, select: { id: true } });
  if (!topic) return [];
  const queries = await prisma.queryEntry.findMany({
    where: { topicId: topic.id, display: true },
    orderBy: { dateAdded: "desc" },
    include: queryInclude,
  });
  return queries.map((q) => mapQuery(q as any));
}

// --- E-Books ---

export async function getAllEbooks(): Promise<EBook[]> {
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
    coverUrl: `/ebooks/${b.slug}-cover.jpg`,
    fileUrl: `/ebooks/${b.fileName}`,
  }));
}
