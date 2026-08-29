import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import {
  getIssueBySlug,
  getArticlesForIssue,
  getQueriesForIssue,
  getEditorialForIssue,
  getMonthName,
} from "@/lib/queries";
import { SITE_URL, SITE_NAME, ISSN } from "@/lib/site-meta";
import { ContentResults } from "@/components/content/content-results";
import { StickyViewNav } from "@/components/content/sticky-view-nav";

// ISR: issue content changes only via admin mutations, which call
// revalidatePath. Time-based revalidate is just a backstop (plan I2).
export const revalidate = 3600;

const getCachedIssueBySlug = cache(getIssueBySlug);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const issue = await getCachedIssueBySlug(id).catch(() => null);
  if (!issue) return { title: SITE_NAME };

  const monthName = getMonthName(issue.month);
  const title = `Vol. ${issue.volume} · № ${issue.issueNumber}, ${monthName} ${issue.year} | ${SITE_NAME}`;
  const description = issue.description || issue.title || "Articles from this issue";
  const canonical = `${SITE_URL}/issues/${id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function IssuePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { id } = await params;
  const { view: viewParam } = await searchParams;
  const view = viewParam === "articles" || viewParam === "queries" ? viewParam : "all";
  const issue = await getCachedIssueBySlug(id);
  if (!issue) notFound();

  const [issueArticles, issueQueries, editorial] = await Promise.all([
    getArticlesForIssue(id),
    getQueriesForIssue(id),
    getEditorialForIssue(id),
  ]);

  const monthName = getMonthName(issue.month).toUpperCase();
  const startReading = editorial ?? issueArticles[0];
  const coverArticles = issueArticles.slice(0, 3);
  const coverQueries = issueQueries.slice(0, 3);
  const hasMoreArticles = issueArticles.length > 3;
  const hasMoreQueries = issueQueries.length > 3;

  // Legacy issue titles (from MSSQL) sometimes literally contain an Islamic
  // month name (e.g., "Rabi-ul-Awal"), which obscures the actual Gregorian
  // edition. Always lead with the derived "Month Year" and keep the legacy
  // title as a subtitle when it adds information beyond the month.
  const gregorianTitle = `${getMonthName(issue.month)} ${issue.year}`;
  const showLegacyTitle =
    !!issue.title &&
    issue.isSpecial &&
    issue.title.trim().toLowerCase() !== gregorianTitle.toLowerCase();
  const fallbackDescription =
    `This issue contains ${issueArticles.length} articles and ${issueQueries.length} queries - ` +
    "scholarly writing, reader questions answered, and a continued record of the journal's ongoing concerns.";
  const issueDescription = issue.description ?? fallbackDescription;
  const visibleContent =
    view === "articles"
      ? issueArticles
      : view === "queries"
        ? issueQueries
        : [...issueArticles, ...issueQueries];
  const visibleLabel = view === "articles" ? "Articles" : view === "queries" ? "Queries" : "All content";

  return (
    <div>
      {/* Breadcrumb */}
      <div
        className="border-b"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3 text-[12px] text-muted-foreground sm:px-6 lg:px-10">
          <Link href="/issues" className="text-foreground hover:text-[var(--mr-green-700)]">
            Archive
          </Link>
          <span>/</span>
          <span>{issue.year}</span>
          <span>/</span>
          <span>
            {getMonthName(issue.month)} - № {issue.issueNumber}
          </span>
        </div>
      </div>

      <StickyViewNav
        ariaLabel={`Contents of ${gregorianTitle}`}
        className="px-2 sm:px-3 lg:px-5"
        items={[
          {
            label: "Articles",
            count: issueArticles.length,
            href: `/issues/${id}?view=articles#contents`,
            active: view === "articles",
          },
          {
            label: "Queries",
            count: issueQueries.length,
            href: `/issues/${id}?view=queries#contents`,
            active: view === "queries",
          },
          {
            label: "All",
            count: issueArticles.length + issueQueries.length,
            href: `/issues/${id}?view=all#contents`,
            active: view === "all",
          },
        ]}
      />

      {/* Cover */}
      <section className="border-b" style={{ borderColor: "var(--foreground)" }}>
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-10">
          {/* Cover plate */}
          <div
            className="relative flex flex-col p-9 pt-10"
            style={{ background: "var(--card)", border: "1px solid var(--foreground)" }}
          >
            <span className="mr-corner tl" />
            <span className="mr-corner tr" />
            <span className="mr-corner bl" />
            <span className="mr-corner br" />

            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo-long.svg"
                alt="Monthly Renaissance"
                className="opacity-80"
                style={{ height: 24, width: "auto" }}
              />
            </div>

            <div className="mt-5 text-center">
              <div className="mr-catalog" style={{ color: "var(--mr-clay-700)" }}>
                VOLUME {issue.volume} · ISSUE № {issue.issueNumber}
              </div>
            </div>

            <div className="mt-5 mr-ornament">
              <span className="mr-diamond" />
              <span className="mr-star" style={{ width: 12, height: 12 }} />
              <span className="mr-diamond" />
            </div>

            <div className="py-8">
              {(coverArticles.length > 0 || coverQueries.length > 0) && (
                <div className="mt-3 grid gap-6">
                  {coverArticles.length > 0 && (
                    <div>
                      <div
                        className="mr-eyebrow mb-2.5 text-center"
                        style={{ color: "var(--mr-saffron-700)" }}
                      >
                        Articles
                      </div>
                      <div className="space-y-3 text-center">
                        {coverArticles.map((article, index) => (
                          <Link
                            key={article.id}
                            href={hasMoreArticles && index === 2 ? "#contents" : `/articles/${article.slug}`}
                            className="block rounded-sm border-b px-3 py-2 font-serif text-[16px] leading-snug transition-[color,background-color,padding] duration-150 hover:bg-[var(--paper)] hover:pl-4 hover:text-[var(--mr-green-700)]"
                            style={{ borderColor: "var(--border)" }}
                          >
                            {hasMoreArticles && index === 2 ? "And More..." : article.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {coverQueries.length > 0 && (
                    <div>
                      <div
                        className="mr-eyebrow mb-2.5 text-center"
                        style={{ color: "var(--mr-clay-700)" }}
                      >
                        Queries
                      </div>
                      <div className="space-y-3 text-center">
                        {coverQueries.map((query, index) => (
                          <Link
                            key={query.id}
                            href={hasMoreQueries && index === 2 ? "#contents" : `/articles/${query.slug}`}
                            className="block rounded-sm border-b px-3 py-2 font-serif text-[14px] italic leading-snug transition-[color,background-color,padding] duration-150 hover:bg-[var(--paper)] hover:pl-4 hover:text-[var(--mr-green-700)]"
                            style={{ borderColor: "var(--border)" }}
                          >
                            {hasMoreQueries && index === 2 ? "And More..." : `“${query.title}”`}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mb-5 mr-ornament">
              <span className="mr-diamond" />
              <span className="mr-star" style={{ width: 12, height: 12 }} />
              <span className="mr-diamond" />
            </div>

            <div className="text-center">
              <div className="mr-catalog" style={{ opacity: 0.75 }}>
                {monthName} {issue.year}
              </div>
              {ISSN && (
                <div className="mr-catalog mt-2" style={{ opacity: 0.75 }}>
                  ISSN: {ISSN}
                </div>
              )}
            </div>
          </div>

          {/* Editorial note */}
          <div className="flex flex-col justify-center">
            <div
              className="mr-eyebrow mb-2.5"
              style={{ color: "var(--mr-clay-700)" }}
            >
              - From the Editor · Dr. Shehzad Saleem -
            </div>
            <h1 className="mb-2 font-serif text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl lg:text-[2.6rem]">
              {gregorianTitle}
            </h1>
            {showLegacyTitle && (
              <div
                className="mb-4 font-serif text-[18px] italic"
                style={{ color: "var(--mr-saffron-700)" }}
              >
                {issue.title}
              </div>
            )}
            <p className="mb-4 whitespace-pre-line font-serif text-[17px] leading-[1.7] text-[var(--mr-ink-soft)]">
              {issueDescription}
            </p>
            {startReading && (
              <div className="flex flex-wrap gap-2.5">
                <Link href={`/articles/${startReading.slug}`} className="mr-btn mr-btn-primary">
                  Start reading →
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TOC proper */}
      <section id="contents" className="mx-auto max-w-7xl px-2 py-12 sm:px-3 lg:px-5">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-serif text-2xl font-semibold sm:text-3xl">Contents</h2>
          <div className="mr-catalog">
            {issueArticles.length} ARTICLES · {issueQueries.length} QUERIES
          </div>
        </div>

        <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-border pb-3">
          <h3 className="text-lg font-semibold">{visibleLabel}</h3>
          <span className="text-sm text-muted-foreground">{visibleContent.length}</span>
        </div>
        <ContentResults
          items={visibleContent}
          showWriter
          emptyMessage={`No ${view === "all" ? "content" : view} in this issue yet.`}
        />
      </section>
    </div>
  );
}
