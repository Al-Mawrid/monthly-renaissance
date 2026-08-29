import { DirectoryBrowser } from "@/components/content/directory-browser";
import { getQueryTopics, getQueryWriters } from "@/lib/queries";

export const metadata = {
  title: "Queries",
  description: "Browse reader queries by topic or answering scholar.",
};

export const revalidate = 3600;

export default async function QueriesDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const [topics, writers] = await Promise.all([getQueryTopics(), getQueryWriters()]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Browse Queries</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Explore reader questions by subject or browse answers from individual scholars.
        </p>
      </div>

      <DirectoryBrowser
        initialView={view === "writers" ? "writers" : "topics"}
        ariaLabel="Browse queries"
        amountLabel="queries"
        topicItems={topics.map((topic) => ({
          id: topic.id,
          name: topic.name,
          href: `/queries/topics/${topic.slug}?view=queries`,
          count: topic.queryCount ?? 0,
          meta: `${topic.queryCount ?? 0} ${topic.queryCount === 1 ? "query" : "queries"}`,
          description: topic.description,
        }))}
        writerItems={writers.map((writer) => ({
          id: writer.id,
          name: writer.name,
          href: `/articles/writers/${writer.slug}?view=queries`,
          count: writer.queryCount ?? 0,
          meta: `${writer.queryCount ?? 0} ${writer.queryCount === 1 ? "query" : "queries"} answered`,
          description: writer.bio,
        }))}
      />
    </div>
  );
}
