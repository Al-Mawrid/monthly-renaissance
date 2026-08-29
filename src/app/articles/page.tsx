import { DirectoryBrowser } from "@/components/content/directory-browser";
import { getAllTopics, getAllWriters } from "@/lib/queries";

export const metadata = {
  title: "Articles",
  description: "Browse Renaissance articles by topic or contributing writer.",
};

export const revalidate = 3600;

export default async function ArticlesDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const [topics, writers] = await Promise.all([getAllTopics(), getAllWriters()]);
  const articleTopics = topics.filter((topic) => topic.type === "article");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Browse Articles</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Explore Islamic scholarship by subject area or browse the work of contributing writers.
        </p>
      </div>

      <DirectoryBrowser
        initialView={view === "writers" ? "writers" : "topics"}
        ariaLabel="Browse articles"
        amountLabel="articles"
        topicItems={articleTopics.map((topic) => ({
          id: topic.id,
          name: topic.name,
          href: `/articles/topics/${topic.slug}?view=articles`,
          count: topic.articleCount,
          meta: `${topic.articleCount} ${topic.articleCount === 1 ? "article" : "articles"}`,
          description: topic.description,
        }))}
        writerItems={writers.map((writer) => ({
          id: writer.id,
          name: writer.name,
          href: `/articles/writers/${writer.slug}?view=articles`,
          count: writer.articleCount,
          meta: `${writer.articleCount} ${writer.articleCount === 1 ? "article" : "articles"} · ${writer.queryCount ?? 0} ${writer.queryCount === 1 ? "query" : "queries"}`,
          description: writer.bio,
        }))}
      />
    </div>
  );
}
