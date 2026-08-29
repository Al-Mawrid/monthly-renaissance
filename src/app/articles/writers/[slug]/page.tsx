import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/lib/variants";
import { PaginationNav } from "@/components/ui/pagination-nav";
import { ContentResults } from "@/components/content/content-results";
import { StickyViewNav } from "@/components/content/sticky-view-nav";
import { cn } from "@/lib/utils";
import {
  getWriterBySlug,
  getArticlesByWriterPaged,
  getQueriesByWriterPaged,
  getContentByWriterPaged,
} from "@/lib/queries";
import { SITE_URL, SITE_NAME } from "@/lib/site-meta";

export const revalidate = 3600;

const getCachedWriterBySlug = cache(getWriterBySlug);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const writer = await getCachedWriterBySlug(slug).catch(() => null);
  if (!writer) return { title: SITE_NAME };

  const title = `${writer.name} | ${SITE_NAME}`;
  const description = `Articles and query answers by ${writer.name} on ${SITE_NAME}`;
  const canonical = `${SITE_URL}/articles/writers/${writer.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "profile",
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

const PER_PAGE = 20;
type ContentView = "articles" | "queries" | "all";

function parseView(value: string | undefined): ContentView {
  return value === "queries" || value === "all" ? value : "articles";
}

export default async function WriterPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; view?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam, view: viewParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const view = parseView(viewParam);

  const writer = await getCachedWriterBySlug(slug);
  if (!writer) notFound();

  const result =
    view === "queries"
      ? await getQueriesByWriterPaged(slug, page, PER_PAGE).then(({ queries, total }) => ({
          items: queries,
          total,
        }))
      : view === "all"
        ? await getContentByWriterPaged(slug, page, PER_PAGE)
        : await getArticlesByWriterPaged(slug, page, PER_PAGE).then(({ articles, total }) => ({
            items: articles,
            total,
          }));

  const articleTotal = writer.articleCount;
  const queryTotal = writer.queryCount ?? 0;
  const contentTotal = articleTotal + queryTotal;
  const totalPages = Math.max(1, Math.ceil(result.total / PER_PAGE));
  const activeLabel =
    view === "queries" ? "Queries answered" : view === "all" ? "All contributions" : "Articles";
  const emptyMessage =
    view === "queries"
      ? "No queries answered by this writer yet."
      : view === "all"
        ? "No contributions found for this writer yet."
        : "No articles found for this writer yet.";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Link
        href={view === "queries" ? "/queries?view=writers" : "/articles?view=writers"}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "mb-5 -ml-2 text-muted-foreground",
        )}
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" aria-hidden />
        All Writers
      </Link>

      <StickyViewNav
        ariaLabel={`Content by ${writer.name}`}
        className="-mx-4 mb-8 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        items={[
          {
            label: "Articles",
            count: articleTotal,
            href: `/articles/writers/${slug}?view=articles`,
            active: view === "articles",
          },
          {
            label: "Queries",
            count: queryTotal,
            href: `/articles/writers/${slug}?view=queries`,
            active: view === "queries",
          },
          {
            label: "All",
            count: contentTotal,
            href: `/articles/writers/${slug}?view=all`,
            active: view === "all",
          },
        ]}
      />

      <div className="mb-8 flex items-start gap-5">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
          <span className="text-2xl font-semibold text-primary">
            {writer.name
              .split(" ")
              .map((name) => name[0])
              .join("")
              .slice(0, 2)}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{writer.name}</h1>
          {writer.bio && (
            <p className="mt-1.5 max-w-xl leading-relaxed text-muted-foreground">{writer.bio}</p>
          )}
          <span className="mt-2 block text-sm text-muted-foreground">
            {contentTotal} contributions · {articleTotal} articles · {queryTotal} queries
          </span>
        </div>
      </div>

      <section aria-labelledby="writer-content-heading">
        <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-border pb-3">
          <h2 id="writer-content-heading" className="text-lg font-semibold">
            {activeLabel}
          </h2>
          <span className="text-sm text-muted-foreground">{result.total}</span>
        </div>

        <ContentResults items={result.items} emptyMessage={emptyMessage} />
      </section>

      {totalPages > 1 && (
        <PaginationNav
          page={page}
          totalPages={totalPages}
          prevHref={`/articles/writers/${slug}?view=${view}&page=${page - 1}`}
          nextHref={`/articles/writers/${slug}?view=${view}&page=${page + 1}`}
          className="mt-8 gap-4"
        />
      )}
    </div>
  );
}
