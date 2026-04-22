import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getIssueBySlug,
  getArticlesForIssue,
  getQueriesForIssue,
  getMonthName,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

const arMonths = [
  "محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة",
  "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة",
];

function toRoman(n: number): string {
  const map: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  for (const [v, s] of map) { while (n >= v) { out += s; n -= v; } }
  return out;
}

export default async function IssuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const issue = await getIssueBySlug(id);
  if (!issue) notFound();

  const [issueArticles, issueQueries] = await Promise.all([
    getArticlesForIssue(id),
    getQueriesForIssue(id),
  ]);

  const monthName = getMonthName(issue.month).toUpperCase();
  const arMonth = arMonths[Math.max(0, Math.min(11, issue.month - 1))];
  const featured = issueArticles[0];

  return (
    <div>
      {/* Breadcrumb */}
      <div
        className="border-b"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-3 text-[12px] text-muted-foreground flex items-center gap-2 flex-wrap">
          <Link href="/issues" className="text-foreground hover:text-[var(--mr-green-700)]">Archive</Link>
          <span>/</span>
          <span>{issue.year}</span>
          <span>/</span>
          <span>{getMonthName(issue.month)} — № {issue.issueNumber}</span>
        </div>
      </div>

      {/* Cover */}
      <section className="border-b" style={{ borderColor: "var(--foreground)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-14 grid lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Cover plate */}
          <div
            className="relative p-9 pt-12"
            style={{ background: "var(--card)", border: "1px solid var(--foreground)" }}
          >
            <span className="mr-corner tl" />
            <span className="mr-corner tr" />
            <span className="mr-corner bl" />
            <span className="mr-corner br" />

            <div
              className="mr-eyebrow text-center"
              style={{ color: "var(--mr-saffron-700)" }}
            >
              — Monthly Renaissance —
            </div>
            <div className="flex justify-center mt-3.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/al-mawrid-wordmark.svg"
                alt="Al-Mawrid"
                className="opacity-80"
                style={{ height: 28, width: "auto" }}
              />
            </div>

            <div className="mr-ornament">
              <span className="mr-diamond" />
              <span className="mr-star" style={{ width: 12, height: 12 }} />
              <span className="mr-diamond" />
            </div>

            <div className="text-center my-3">
              <div
                className="font-serif font-semibold leading-[0.9] tracking-[-0.05em]"
                style={{ fontSize: 140, color: "var(--mr-clay-700)" }}
              >
                {issue.issueNumber}
              </div>
              <div className="mr-catalog text-center mt-1">
                VOLUME {toRoman(issue.volume)} · ISSUE № {issue.issueNumber}
              </div>
            </div>

            <div className="mr-ornament">
              <span className="mr-diamond" />
              <span className="mr-star" style={{ width: 12, height: 12 }} />
              <span className="mr-diamond" />
            </div>

            <div className="text-center mt-3.5">
              <div className="font-serif text-[22px] font-semibold">
                {monthName} {issue.year}
              </div>
              <div
                className="font-arabic mt-1"
                style={{ fontSize: 18, color: "var(--mr-saffron-700)" }}
              >
                {arMonth} {issue.year}
              </div>
            </div>
          </div>

          {/* Editorial note */}
          <div className="flex flex-col justify-center">
            <div
              className="mr-eyebrow mb-2.5"
              style={{ color: "var(--mr-clay-700)" }}
            >
              — From the Editor · Dr. Shehzad Saleem —
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.6rem] font-semibold tracking-tight leading-[1.1] mb-4">
              {issue.title || `${getMonthName(issue.month)} ${issue.year}`}
            </h1>
            <p className="font-serif text-[17px] leading-[1.7] text-[var(--mr-ink-soft)] mb-4">
              This issue contains {issueArticles.length} articles and {issueQueries.length} queries —
              scholarly writing, reader questions answered, and a continued record
              of the journal's ongoing concerns.
            </p>
            {featured && (
              <div className="flex gap-2.5 flex-wrap">
                <Link
                  href={`/articles/${featured.slug}`}
                  className="mr-btn mr-btn-primary"
                >
                  Start reading →
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TOC proper */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-12">
        <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold">Contents</h2>
          <div className="mr-catalog">
            {issueArticles.length} ARTICLES · {issueQueries.length} QUERIES
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-10">
          <div>
            <div
              className="mr-eyebrow mb-3.5"
              style={{ color: "var(--mr-saffron-700)" }}
            >
              — Articles —
            </div>
            {issueArticles.map((a, i) => (
              <Link
                key={a.id}
                href={`/articles/${a.slug}`}
                className="mr-toc-row--cream grid py-4 border-b cursor-pointer"
                style={{
                  gridTemplateColumns: "40px 1fr 60px",
                  gap: 14,
                  alignItems: "baseline",
                  borderColor: "var(--border)",
                }}
              >
                <div
                  className="font-serif font-semibold leading-none"
                  style={{ fontSize: 26, color: "var(--mr-saffron-700)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <div className="mr-toc-title font-serif text-[18px] font-semibold">
                    {a.title}
                  </div>
                  <div className="text-[12px] text-muted-foreground mt-1">
                    {a.writer.name} · {a.topic.name}
                  </div>
                </div>
                <div className="mr-catalog text-right">{a.readingTime}′</div>
              </Link>
            ))}
            {issueArticles.length === 0 && (
              <p className="text-[14px] text-muted-foreground italic">No articles yet.</p>
            )}
          </div>

          <div>
            <div
              className="mr-eyebrow mb-3.5"
              style={{ color: "var(--mr-clay-700)" }}
            >
              — Queries —
            </div>
            {issueQueries.map((q, i) => (
              <Link
                key={q.id}
                href={`/articles/${q.slug}`}
                className="mr-toc-row--cream block py-3.5 border-b cursor-pointer"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="font-mono text-[10px] font-semibold"
                    style={{ color: "var(--mr-clay-700)" }}
                  >
                    Q.{i + 1}
                  </span>
                  <span
                    className="inline-flex text-[10px] font-semibold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-sm border text-muted-foreground"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {q.topic.name}
                  </span>
                </div>
                <div className="font-serif text-[14px] italic leading-snug">"{q.title}"</div>
                <div className="text-[11px] text-muted-foreground mt-1">— {q.writer.name}</div>
              </Link>
            ))}
            {issueQueries.length === 0 && (
              <p className="text-[14px] text-muted-foreground italic">No queries in this issue.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
