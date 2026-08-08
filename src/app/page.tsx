import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  getLatestIssue,
  getFeaturedArticle,
  getLatestQueries,
  getFeaturedTopics,
  getAllIssues,
  getMonthName,
} from "@/lib/queries";

export const revalidate = 300;


async function loadHomeData() {
  const [latestIssue, featuredArticle, latestQueries, featuredTopics, allIssues] =
    await Promise.all([
      getLatestIssue(),
      getFeaturedArticle(),
      getLatestQueries(3),
      getFeaturedTopics(6),
      getAllIssues(),
    ]);

  return {
    latestIssue,
    featuredArticle,
    latestQueries,
    featuredTopics,
    allIssues,
  };
}

function HomeFallback() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-20 text-center">
      <h1 className="font-serif text-4xl font-semibold">Monthly Renaissance</h1>
      <p className="mt-3 text-muted-foreground">Content loading — please try again shortly.</p>
    </div>
  );
}

export default async function Home() {
  const data = await loadHomeData();
  if (!data.latestIssue || !data.featuredArticle) return <HomeFallback />;
  const { latestIssue, featuredArticle, latestQueries, featuredTopics, allIssues } = data;

  const year = latestIssue.year;
  const vol = latestIssue.volume;
  const issueNum = latestIssue.issueNumber;
  const monthName = getMonthName(latestIssue.month).toUpperCase();

  const totalArticles = allIssues.reduce((acc, i) => acc + (i.articleCount ?? 0), 0) || 2017;
  const totalIssues = allIssues.length || 408;
  const writersCount = 237;
  const queriesCount = 921;

  // Decade tape
  const earliestYear = allIssues.length
    ? Math.min(...allIssues.map((i) => i.year))
    : 1991;
  const currentYear = year;
  const yearsRange = Array.from(
    { length: currentYear - earliestYear + 1 },
    (_, i) => earliestYear + i,
  );
  const countsByYear = allIssues.reduce<Record<number, number>>((acc, i) => {
    acc[i.year] = (acc[i.year] ?? 0) + 1;
    return acc;
  }, {});
  const maxCount = Math.max(12, ...Object.values(countsByYear));

  return (
    <div>
      {/* Masthead strip — catalog line */}
      <div
        className="border-b"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="mx-auto max-w-7xl px-2 sm:px-3 lg:px-5 py-2.5 flex items-center justify-between flex-wrap gap-2">
          <div className="mr-catalog">
            VOL. {vol}<span className="dot">·</span>№ {issueNum}<span className="dot">·</span>{monthName} {year}
          </div>
          <div className="mr-eyebrow hidden sm:block" style={{ color: "var(--mr-saffron-700)" }}>— Est. 1991 —</div>
          <div className="mr-catalog">
            {totalArticles.toLocaleString()} ARTICLES<span className="dot">·</span>{totalIssues} ISSUES<span className="dot">·</span>{writersCount} WRITERS
          </div>
        </div>
      </div>

      {/* HERO */}
      <section
        className="border-b"
        style={{ borderColor: "var(--foreground)" }}
      >
        <div className="mx-auto max-w-7xl px-2 sm:px-3 lg:px-5 py-14">
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16 items-center">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <span
                  className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] uppercase rounded-sm"
                  style={{ background: "#f3dfd8", color: "var(--mr-clay-700)" }}
                >
                  Editorial
                </span>
                <span className="mr-eyebrow">From this month&apos;s issue</span>
              </div>

              <h1 className="font-serif text-[2.5rem] lg:text-[3.2rem] font-semibold leading-[1.05] tracking-tight text-balance mb-4">
                {(() => {
                  const words = featuredArticle.title.trim().split(/\s+/);
                  if (words.length < 2) {
                    return <em style={{ color: "var(--mr-green-800)" }}>{featuredArticle.title}</em>;
                  }
                  const last = words.pop();
                  return (
                    <>
                      {words.join(" ")}{" "}
                      <em style={{ fontStyle: "italic", color: "var(--mr-green-800)" }}>{last}</em>
                    </>
                  );
                })()}
              </h1>

              <p className="font-serif text-lg lg:text-[19px] leading-relaxed text-[var(--mr-ink-soft)] max-w-xl mb-5">
                {featuredArticle.excerpt}
              </p>

              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground mb-7">
                <span>
                  By <span className="text-foreground font-medium">{featuredArticle.writer.name}</span>
                </span>
                <span className="opacity-40">·</span>
                <span>{featuredArticle.readingTime} min read</span>
                {featuredArticle.topic?.name && (
                  <>
                    <span className="opacity-40">·</span>
                    <span>{featuredArticle.topic.name}</span>
                  </>
                )}
              </div>

              <div className="flex gap-2.5 flex-wrap">
                <Link
                  href={`/articles/${featuredArticle.slug}`}
                  className="mr-btn mr-btn-primary"
                >
                  Read article <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href={`/issues/${latestIssue.id}`}
                  className="mr-btn mr-btn-outline"
                >
                  View full issue
                </Link>
              </div>
            </div>

            {/* Illuminated cover plate */}
            <div
              className="relative p-8 pt-10"
              style={{
                background: "var(--card)",
                border: "1px solid var(--foreground)",
              }}
            >
              <span className="mr-corner tl" />
              <span className="mr-corner tr" />
              <span className="mr-corner bl" />
              <span className="mr-corner br" />

              <div className="space-y-7">
                <div>
                  <div
                    className="mr-eyebrow text-center text-[12px] mb-3"
                    style={{ color: "var(--mr-green-800)" }}
                  >
                    Our Prayer
                  </div>
                  <div className="font-serif text-[14px] leading-[1.55] text-center text-foreground">
                    <p>[Lord!] Set us firm on the straight path.</p>
                    <p>The path of those you have blessed,</p>
                    <p>not of those who have earned your wrath,</p>
                    <p>nor of those who have gone astray.</p>
                    <p className="mt-3 text-[13px] text-muted-foreground">
                      (The Qur&apos;an, 1:4-6)
                    </p>
                  </div>
                </div>

                <div className="mr-ornament">
                  <span className="mr-diamond" />
                  <span className="mr-star" style={{ width: 12, height: 12 }} />
                  <span className="mr-diamond" />
                </div>

                <div>
                  <div
                    className="mr-eyebrow text-center text-[12px] mb-3"
                    style={{ color: "var(--mr-green-800)" }}
                  >
                    Our Motto
                  </div>
                  <div className="font-serif text-[14px] leading-[1.55] text-center text-foreground">
                    <p>Stand upright, speak thy thoughts, declare</p>
                    <p>The truth thou hast, that all may share,</p>
                    <p>Be bold, proclaim it everywhere:</p>
                    <p>They only live who dare.</p>
                    <p className="mt-3 text-[13px] text-muted-foreground">
                      (Lewis Morris)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Archive depth strip */}
      <section className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-7xl px-2 sm:px-3 lg:px-5 py-12">
          <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
            <div>
              <div
                className="mr-eyebrow mb-1.5"
                style={{ color: "var(--mr-saffron-700)" }}
              >
                — The Archive —
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight">
                {yearsRange.length} years of scholarship, catalogued
              </h2>
            </div>
            <Link
              href="/issues"
              className="mr-link text-[13px] text-muted-foreground"
            >
              Browse full archive →
            </Link>
          </div>

          <div
            className="p-5 relative"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-end gap-0 h-20 relative">
              {yearsRange.map((y, i) => {
                const c = countsByYear[y] ?? 0;
                const h = 18 + (c / maxCount) * 60;
                const isActive = y === currentYear;
                const opacity = isActive ? 1 : 0.2 + (i / yearsRange.length) * 0.55;
                const showLabel = y % 5 === 0 || y === earliestYear || y === currentYear;
                return (
                  <Link
                    key={y}
                    href={`/issues#year-${y}`}
                    className="mr-archive-year flex-1 flex flex-col items-center gap-1 no-underline relative"
                  >
                    <div className="mr-archive-tooltip" role="tooltip">
                      <div className="mr-archive-tooltip-head">
                        <span className="mr-archive-tooltip-year">{y}</span>
                        <span className="mr-archive-tooltip-vol font-mono">VOL. {y - earliestYear + 1}</span>
                      </div>
                      <div className="mr-archive-tooltip-grid">
                        <span>Articles</span>
                        <span className="font-mono mr-archive-tooltip-accent">{c}</span>
                      </div>
                      <div className="mr-archive-tooltip-foot">Open archive →</div>
                      <span className="mr-archive-tooltip-arrow" />
                    </div>
                    <div
                      className="mr-archive-bar"
                      data-active={isActive ? "true" : "false"}
                      style={{
                        height: h,
                        background: isActive ? "var(--mr-clay-700)" : "var(--mr-green-700)",
                        opacity,
                      }}
                    />
                    {showLabel && (
                      <span
                        className="mr-archive-label font-mono"
                        data-active={isActive ? "true" : "false"}
                        style={{
                          fontSize: 9,
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? "var(--mr-clay-700)" : "var(--muted-foreground)",
                        }}
                      >
                        ’{String(y).slice(2)}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Browse by topic */}
      <section className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-7xl px-2 sm:px-3 lg:px-5 py-12">
          <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold">Browse by topic</h2>
            <div className="mr-eyebrow">{featuredTopics.length}+ disciplines</div>
          </div>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            style={{ gap: 1, background: "var(--border)", border: "1px solid var(--border)" }}
          >
            {featuredTopics.map((t) => (
              <Link
                key={t.id}
                href={`/articles/topics/${t.slug}`}
                className="mr-topic-card flex flex-col gap-2 p-6"
                style={{ background: "var(--card)" }}
              >
                <div className="flex justify-between items-baseline gap-3">
                  <div className="mr-topic-title font-serif text-lg font-semibold">
                    {t.name}
                  </div>
                  <div className="mr-catalog">
                    {String(t.articleCount).padStart(3, "0")}
                  </div>
                </div>
                {t.description && (
                  <p className="text-[13px] text-muted-foreground line-clamp-2">{t.description}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Queries */}
      <section
        className="border-b"
        style={{ background: "var(--mr-cream)", borderColor: "var(--border)" }}
      >
        <div className="mx-auto max-w-7xl px-2 sm:px-3 lg:px-5 py-12">
          <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
            <div>
              <div
                className="mr-eyebrow mb-1"
                style={{ color: "var(--mr-clay-700)" }}
              >
                — Queries —
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold">
                Questions answered by our scholars
              </h2>
            </div>
            <div className="mr-catalog">{queriesCount.toLocaleString()} ENTRIES IN THE RECORD</div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {latestQueries.map((q, i) => (
              <Link
                key={q.id}
                href={`/articles/${q.slug}`}
                className="mr-hover-card flex flex-col gap-3 p-6"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="font-mono text-[11px]"
                    style={{ color: "var(--mr-clay-700)" }}
                  >
                    Q №{842 + i}
                  </span>
                  <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-sm border text-muted-foreground" style={{ borderColor: "var(--border)" }}>
                    {q.topic?.name}
                  </span>
                </div>
                <p className="font-serif text-[15px] italic leading-snug">&quot;{q.title}&quot;</p>
                <div className="text-[12px] text-muted-foreground mt-auto">
                  Answered by <span className="text-foreground">{q.writer.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Archive CTA — dark mihrab */}
      <section style={{ background: "var(--mr-green-800)", color: "var(--mr-ivory)" }}>
        <div className="mx-auto max-w-7xl px-2 sm:px-3 lg:px-5 py-16">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <div
                className="text-[12px] font-semibold tracking-[0.18em] mb-3"
                style={{ color: "var(--mr-saffron-300)" }}
              >
                — {yearsRange.length} YEARS ON —
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight mb-4">
                A continuous monthly record, since {earliestYear}.
              </h2>
              <p className="text-[15px] opacity-75 leading-relaxed mb-5 max-w-lg">
                Every issue, every article, every response — preserved, searchable, and free to read.
              </p>
              <div className="flex gap-2.5 flex-wrap">
                <Link href="/issues" className="mr-btn mr-btn-saffron">
                  Browse archive <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link href="/ebooks" className="mr-btn mr-btn-outline-inverse">
                  Download e-books
                </Link>
              </div>
            </div>

            <div
              className="grid grid-cols-2"
              style={{ gap: 1, background: "rgba(250,244,228,0.15)" }}
            >
              {[
                { n: totalArticles.toLocaleString(), l: "Articles" },
                { n: totalIssues, l: "Issues" },
                { n: queriesCount, l: "Queries" },
                { n: writersCount, l: "Writers" },
              ].map((s) => (
                <div
                  key={s.l}
                  style={{ background: "var(--mr-green-800)" }}
                  className="p-7"
                >
                  <div
                    className="font-serif font-semibold leading-none"
                    style={{ fontSize: 48, color: "var(--mr-saffron-300)" }}
                  >
                    {s.n}
                  </div>
                  <div
                    className="mr-eyebrow mt-2"
                    style={{ color: "rgba(250,244,228,0.65)" }}
                  >
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
