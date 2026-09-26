import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { StickyViewNav } from "@/components/content/sticky-view-nav";
import { ResearchCollection } from "@/components/content/research-collection";
import { ProgressiveContentResults } from "@/components/content/progressive-content-results";
import { TopicSwitcher } from "@/components/content/topic-switcher";
import { buttonVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";
import {
  getArticlesByTopicPaged,
  getContentByTopicPaged,
  getQueriesByTopicPaged,
  getResearchCollection,
  getAllTopics,
  getTopicWriters,
  getTopicBySlug,
} from "@/lib/queries";

export type ContentView = "articles" | "queries" | "all";
export type TopicGroupBy = "none" | "writer";
export const getCachedTopicBySlug = cache(getTopicBySlug);

export function parseContentView(
  value: string | undefined,
  fallback: ContentView,
): ContentView {
  return value === "articles" || value === "queries" || value === "all" ? value : fallback;
}

export function parseTopicGroupBy(value: string | undefined): TopicGroupBy {
  return value === "writer" ? "writer" : "none";
}

const PER_PAGE = 20;

export async function TopicProfile({
  slug,
  view,
  writer,
  group,
  groupBy,
}: {
  slug: string;
  view: ContentView;
  writer?: string;
  group?: string;
  groupBy: TopicGroupBy;
}) {
  const [topic, topics, topicWriters] = await Promise.all([getCachedTopicBySlug(slug), getAllTopics(), getTopicWriters(slug, view)]);
  if (!topic) notFound();

  const researchCollection = view === "articles"
    ? await getResearchCollection(slug, { writer, group })
    : null;
  const result =
    view === "queries"
      ? await getQueriesByTopicPaged(slug, 1, PER_PAGE).then(({ queries, total }) => ({
          items: queries,
          total,
        }))
      : view === "all"
        ? await getContentByTopicPaged(slug, 1, PER_PAGE)
        : await getArticlesByTopicPaged(slug, 1, PER_PAGE).then(({ articles, total }) => ({
            items: articles,
            total,
          }));

  const articleTotal = topic.articleCount;
  const queryTotal = topic.queryCount ?? 0;
  const contentTotal = articleTotal + queryTotal;
  const activeLabel = view === "queries" ? "Queries" : view === "all" ? "All content" : "Articles";
  const emptyMessage =
    view === "queries"
      ? "No queries found for this topic yet."
      : view === "all"
        ? "No content found for this topic yet."
        : "No articles found for this topic yet.";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Link
        href={view === "queries" ? "/queries?view=topics" : "/articles?view=topics"}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "mb-5 -ml-2 text-muted-foreground",
        )}
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" aria-hidden />
        All Topics
      </Link>

      <StickyViewNav
        ariaLabel={`Content about ${topic.name}`}
        className="-mx-4 mb-8 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        items={[
          {
            label: "Articles",
            count: articleTotal,
            href: `/articles/topics/${slug}?view=articles`,
            active: view === "articles",
          },
          {
            label: "Queries",
            count: queryTotal,
            href: `/queries/topics/${slug}?view=queries`,
            active: view === "queries",
          },
          {
            label: "All",
            count: contentTotal,
            href: `/articles/topics/${slug}?view=all`,
            active: view === "all",
          },
        ]}
        groupControl={{
          value: groupBy,
          options: [
            { value: "none", label: "Publication order" },
            { value: "writer", label: "Writer" },
          ],
        }}
        filterControl={{ writers: topicWriters }}
      />

      <div className="mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{topic.name}</h1>
          <TopicSwitcher topics={topics.filter((item) => item.type === "article").map(({ name, slug: topicSlug }) => ({ name, slug: topicSlug }))} currentSlug={slug} view={view} />
        </div>
        {topic.description && <p className="mt-1.5 text-muted-foreground">{topic.description}</p>}
        <span className="mt-2 block text-sm text-muted-foreground">
          {contentTotal} items · {articleTotal} articles · {queryTotal} queries
        </span>
      </div>

      {researchCollection ? (
        <ResearchCollection key={`${slug}:${writer ?? "all"}:${group ?? "all"}`} initial={researchCollection} writer={writer} group={group} />
      ) : <section aria-labelledby="topic-content-heading">
        <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-border pb-3">
          <h2 id="topic-content-heading" className="text-lg font-semibold">
            {activeLabel}
          </h2>
          <span className="text-sm text-muted-foreground">{result.total}</span>
        </div>
        <ProgressiveContentResults
          key={`${slug}:${view}`}
          initialItems={result.items}
          nextPage={result.total > PER_PAGE ? 2 : null}
          endpoint={`/api/content-feed?scope=topic&slug=${encodeURIComponent(slug)}&view=${view}`}
          emptyMessage={emptyMessage}
          groupBy={groupBy}
          showType={view === "all"}
        />
      </section>}
    </div>
  );
}
