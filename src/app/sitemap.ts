import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/site-meta";

export const dynamic = "force-dynamic";

type Entry = MetadataRoute.Sitemap[number];

const STATIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: Entry["changeFrequency"] }> = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/articles", priority: 0.9, changeFrequency: "daily" },
  { path: "/queries", priority: 0.8, changeFrequency: "weekly" },
  { path: "/issues", priority: 0.9, changeFrequency: "weekly" },
  { path: "/ebooks", priority: 0.7, changeFrequency: "weekly" },
  { path: "/search", priority: 0.3, changeFrequency: "monthly" },
  { path: "/about", priority: 0.4, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.4, changeFrequency: "yearly" },
  { path: "/support", priority: 0.4, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: Entry[] = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  let articleEntries: Entry[] = [];
  let queryEntries: Entry[] = [];
  let issueEntries: Entry[] = [];
  let writerEntries: Entry[] = [];
  let articleTopicEntries: Entry[] = [];
  let queryTopicEntries: Entry[] = [];

  try {
    const [articles, queries, issues, writers, topics] = await Promise.all([
      prisma.article.findMany({
        where: { display: true },
        select: { slug: true, dateAdded: true },
      }),
      prisma.queryEntry.findMany({
        where: { display: true },
        select: { slug: true, dateAdded: true },
      }),
      prisma.issue.findMany({
        where: { display: true },
        select: { slug: true, issueDate: true },
      }),
      prisma.writer.findMany({
        where: { displayOnSite: true },
        select: { slug: true },
      }),
      prisma.topic.findMany({
        where: { displayInList: true },
        select: {
          slug: true,
          _count: {
            select: {
              articles: { where: { display: true } },
              queries: { where: { display: true } },
            },
          },
        },
      }),
    ]);

    articleEntries = articles.map((a) => ({
      url: `${SITE_URL}/articles/${a.slug}`,
      lastModified: a.dateAdded ?? now,
      changeFrequency: "yearly",
      priority: 0.8,
    }));

    // Queries share the article detail route.
    queryEntries = queries.map((q) => ({
      url: `${SITE_URL}/articles/${q.slug}`,
      lastModified: q.dateAdded ?? now,
      changeFrequency: "yearly",
      priority: 0.6,
    }));

    issueEntries = issues.map((i) => ({
      url: `${SITE_URL}/issues/${i.slug}`,
      lastModified: i.issueDate ?? now,
      changeFrequency: "monthly",
      priority: 0.7,
    }));

    writerEntries = writers.map((w) => ({
      url: `${SITE_URL}/articles/writers/${w.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    }));

    articleTopicEntries = topics.filter((topic) => topic._count.articles > 0).map((topic) => ({
      url: `${SITE_URL}/articles/topics/${topic.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    }));

    queryTopicEntries = topics.filter((topic) => topic._count.queries > 0).map((topic) => ({
      url: `${SITE_URL}/queries/topics/${topic.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    }));
  } catch (err) {
    // If the DB is unreachable at build time the static routes still publish.
    console.warn("[sitemap] DB unavailable, returning static routes only", err);
  }

  return [
    ...staticEntries,
    ...articleEntries,
    ...queryEntries,
    ...issueEntries,
    ...writerEntries,
    ...articleTopicEntries,
    ...queryTopicEntries,
  ];
}
