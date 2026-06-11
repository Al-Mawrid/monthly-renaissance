import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getArticleBySlug,
  getRelatedArticles,
  getArticlesForIssue,
  getMonthName,
} from "@/lib/queries";
import { ArticleTools } from "@/components/article/article-tools";
import { ReadingToolsFab } from "@/components/article/reading-tools-fab";
import { FootnoteFocus } from "@/components/article/footnote-focus";
import { SITE_URL, SITE_NAME } from "@/lib/site-meta";

// ISR: article content changes only via admin mutations, which call
// revalidatePath. Time-based revalidate is just a backstop (plan I2).
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug).catch(() => null);
  if (!article) return { title: SITE_NAME };

  const title = `${article.title} | ${SITE_NAME}`;
  const description = article.excerpt?.slice(0, 200) || `An article from ${SITE_NAME}.`;
  const canonical = `${SITE_URL}/articles/${article.slug}`;
  const writerUrl = article.writer?.slug
    ? `${SITE_URL}/articles/writers/${article.writer.slug}`
    : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    authors: article.writer?.name
      ? [{ name: article.writer.name, url: writerUrl }]
      : undefined,
    openGraph: {
      type: "article",
      title: article.title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      authors: article.writer?.name ? [article.writer.name] : undefined,
      publishedTime: article.createdAt || undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
    },
  };
}

function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const issue = article.issue;
  const [related, issueArticles] = await Promise.all([
    getRelatedArticles(article.topic.slug, article.slug, 3),
    issue ? getArticlesForIssue(issue.id) : Promise.resolve([]),
  ]);

  const wordCount = article.bodyHtml
    ? article.bodyHtml.replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean).length
    : 0;

  const chipMonth = issue ? getMonthName(issue.month).toUpperCase() : "";
  const citationYear = issue ? issue.year : "";
  const citationVolume = issue ? issue.volume : "";
  const citationIssue = issue ? issue.issueNumber : "";

  return (
    <div>
      {/* Breadcrumb strip */}
      <div
        className="border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-3.5 flex items-center gap-2.5 flex-wrap text-[12px] text-muted-foreground">
          <Link href="/issues" className="text-foreground hover:text-[var(--mr-green-700)]">Archive</Link>
          {issue && (
            <>
              <span>/</span>
              <Link
                href={`/issues/${issue.id}`}
                className="text-foreground hover:text-[var(--mr-green-700)]"
              >
                Vol. {issue.volume} · № {issue.issueNumber}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="truncate max-w-[280px]">{article.title}</span>
          <div className="ml-auto mr-catalog">
            ARTICLE ID {article.id}
          </div>
        </div>
      </div>

      {/* Main 3-column grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="grid lg:grid-cols-[200px_1fr_240px] gap-0">
          {/* Left rail — in-issue nav */}
          <aside
            className="hidden lg:block py-12 pr-6 border-r"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="mr-eyebrow mb-3.5">In this issue</div>
            <div className="text-[12px] leading-[1.7] text-muted-foreground">
              {issueArticles.slice(0, 8).map((a) => {
                const active = a.id === article.id;
                return (
                  <Link
                    key={a.id}
                    href={`/articles/${a.slug}`}
                    className="block py-1 pl-2.5 transition-colors"
                    style={{
                      borderLeft: active
                        ? "2px solid var(--mr-saffron-700)"
                        : "2px solid transparent",
                      color: active ? "var(--foreground)" : undefined,
                      fontWeight: active ? 500 : 400,
                    }}
                  >
                    {a.title}
                  </Link>
                );
              })}
            </div>
            <hr className="my-6" style={{ borderColor: "var(--border)" }} />
            <div className="mr-eyebrow mb-2.5">Reading</div>
            <div className="text-[12px] text-muted-foreground leading-[1.8]">
              <div>{article.readingTime} min · {wordCount.toLocaleString()} words</div>
              <div>{article.topic.name}</div>
            </div>
          </aside>

          {/* Center column */}
          <article className="py-12 lg:px-16 max-w-[760px] mx-auto w-full">
            <div
              className="mr-eyebrow mb-3.5"
              style={{ color: "var(--mr-clay-700)" }}
            >
              — {article.topic.name} —
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.85rem] font-semibold tracking-tight leading-[1.1] mb-3 text-balance">
              {article.title}
            </h1>

            {issue && (
              <Link
                href={`/issues/${issue.id}`}
                className="mr-catalog inline-flex items-center gap-2 mb-4 px-2 py-1 border transition-colors hover:text-[var(--mr-green-700)]"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--mr-cream)",
                  color: "var(--mr-clay-700)",
                }}
              >
                <span>{chipMonth} {issue.year}</span>
                <span aria-hidden style={{ opacity: 0.5 }}>·</span>
                <span>ISSUE № {issue.issueNumber}</span>
              </Link>
            )}

            {/* Author line */}
            <div
              className="flex items-center gap-3.5 pb-5 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-[13px]"
                style={{ background: "var(--mr-green-100)", color: "var(--mr-green-800)" }}
              >
                {initials(article.writer.name)}
              </div>
              <div>
                <Link
                  href={`/articles/writers/${article.writer.slug}`}
                  className="text-[14px] font-medium hover:text-[var(--mr-green-700)] transition-colors"
                >
                  {article.writer.name}
                </Link>
                {article.translator && (
                  <div className="text-[11px] text-muted-foreground">
                    Translated by{" "}
                    <Link
                      href={`/articles/writers/${article.translator.slug}`}
                      className="hover:text-[var(--mr-green-700)]"
                    >
                      {article.translator.name}
                    </Link>
                  </div>
                )}
                <div className="text-[11px] text-muted-foreground">
                  {issue ? `${getMonthName(issue.month)} ${issue.year} · ` : ""}
                  {article.readingTime} min read
                </div>
              </div>
            </div>

            <hr className="mr-rule-double my-7" />

            <div
              className="article-content mr-dropcap"
              dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
            />
            <FootnoteFocus />

            <hr className="my-10" style={{ borderColor: "var(--border)" }} />

            {/* Author bio */}
            <section
              className="p-6 flex gap-4 items-start"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-semibold"
                style={{ background: "var(--mr-green-100)", color: "var(--mr-green-800)" }}
              >
                {initials(article.writer.name)}
              </div>
              <div>
                <Link
                  href={`/articles/writers/${article.writer.slug}`}
                  className="font-serif font-semibold hover:text-[var(--mr-green-700)]"
                >
                  {article.writer.name}
                </Link>
                <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">{article.writer.bio}</p>
                <Link
                  href={`/articles/writers/${article.writer.slug}`}
                  className="text-[13px] mt-2 inline-block"
                  style={{ color: "var(--mr-green-700)" }}
                >
                  View all articles →
                </Link>
              </div>
            </section>

            {related.length > 0 && (
              <section className="mt-10">
                <div
                  className="mr-eyebrow mb-4"
                  style={{ color: "var(--mr-saffron-700)" }}
                >
                  — Related reading —
                </div>
                <div className="grid gap-3">
                  {related.map((item) => (
                    <Link
                      key={item.id}
                      href={`/articles/${item.slug}`}
                      className="block p-4 transition-colors hover:shadow-sm"
                      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                    >
                      <h3 className="font-serif font-semibold text-[15px] leading-snug hover:text-[var(--mr-green-700)]">
                        {item.title}
                      </h3>
                      <p className="text-[13px] text-muted-foreground line-clamp-2 mt-1">{item.excerpt}</p>
                      <div className="text-[11px] text-muted-foreground mt-2">
                        {item.writer.name} · {item.readingTime} min
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* Right rail — tools + cite */}
          <aside
            className="hidden lg:block py-12 pl-6 border-l"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="sticky top-[140px]">
              <div className="mr-eyebrow mb-3.5">Tools</div>
              <ArticleTools
                citation={`${article.writer.name} (${citationYear}). ${article.title}. Monthly Renaissance, ${citationVolume}(${citationIssue}).`}
              />
              <hr className="my-5" style={{ borderColor: "var(--border)" }} />
              <div
                className="mr-eyebrow mb-2.5"
                style={{ color: "var(--mr-clay-700)" }}
              >
                Cite
              </div>
              <div
                className="font-mono text-[10px] leading-[1.6] text-muted-foreground p-2.5"
                style={{ background: "var(--mr-cream)", border: "1px solid var(--border)" }}
              >
                {article.writer.name} ({citationYear}). {article.title}. <i>Monthly Renaissance</i>, {citationVolume}({citationIssue}).
              </div>
            </div>
          </aside>
        </div>
      </div>

      <ReadingToolsFab
        citation={`${article.writer.name} (${citationYear}). ${article.title}. Monthly Renaissance, ${citationVolume}(${citationIssue}).`}
      />
    </div>
  );
}
