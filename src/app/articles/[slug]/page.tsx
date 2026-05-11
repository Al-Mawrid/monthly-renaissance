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

export const dynamic = "force-dynamic";

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

  const [related, issueArticles] = await Promise.all([
    getRelatedArticles(article.topic.slug, article.slug, 3),
    getArticlesForIssue(article.issue.id),
  ]);

  const wordCount = article.bodyHtml
    ? article.bodyHtml.replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div>
      {/* Breadcrumb strip */}
      <div
        className="border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-3.5 flex items-center gap-2.5 flex-wrap text-[12px] text-muted-foreground">
          <Link href="/issues" className="text-foreground hover:text-[var(--mr-green-700)]">Archive</Link>
          <span>/</span>
          <Link
            href={`/issues/${article.issue.id}`}
            className="text-foreground hover:text-[var(--mr-green-700)]"
          >
            Vol. {article.issue.volume} · № {article.issue.issueNumber}
          </Link>
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
                <div className="text-[11px] text-muted-foreground">
                  {getMonthName(article.issue.month)} {article.issue.year} · {article.readingTime} min read
                </div>
              </div>
            </div>

            <hr className="mr-rule-double my-7" />

            <div
              className="article-content mr-dropcap"
              dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
            />

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
            <div className="sticky top-[100px]">
              <div className="mr-eyebrow mb-3.5">Tools</div>
              <ArticleTools
                citation={`${article.writer.name} (${article.issue.year}). ${article.title}. Monthly Renaissance, ${article.issue.volume}(${article.issue.issueNumber}).`}
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
                {article.writer.name} ({article.issue.year}). {article.title}. <i>Monthly Renaissance</i>, {article.issue.volume}({article.issue.issueNumber}).
              </div>
            </div>
          </aside>
        </div>
      </div>

      <ReadingToolsFab
        citation={`${article.writer.name} (${article.issue.year}). ${article.title}. Monthly Renaissance, ${article.issue.volume}(${article.issue.issueNumber}).`}
      />
    </div>
  );
}
