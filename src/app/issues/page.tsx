import Link from "next/link";
import { getAllIssues, getMonthName, groupIssuesByYear } from "@/lib/queries";

export const metadata = {
  title: "Archives",
  description: "Browse all issues of Monthly Renaissance from 1991 to present.",
};

export const dynamic = "force-dynamic";

const arMonths = [
  "محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة",
  "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة",
];

export default async function IssuesPage() {
  const issues = await getAllIssues();
  const grouped = groupIssuesByYear(issues);
  const years = Object.keys(grouped).map(Number).sort((a, b) => b - a);
  const totalIssues = issues.length;
  const latestYear = years[0];

  return (
    <div>
      {/* Page header */}
      <div className="border-b" style={{ borderColor: "var(--foreground)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-14">
          <div className="flex items-end justify-between flex-wrap gap-6">
            <div>
              <div
                className="mr-eyebrow mb-2.5"
                style={{ color: "var(--mr-saffron-700)" }}
              >
                — The Archive —
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold tracking-tight leading-none">
                Every issue, since {years[years.length - 1] ?? 1991}
              </h1>
            </div>
            <div className="text-right">
              <div
                className="font-serif font-semibold leading-none"
                style={{ fontSize: 60, color: "var(--mr-clay-700)" }}
              >
                {totalIssues}
              </div>
              <div className="mr-eyebrow mt-1">issues catalogued</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        className="border-b"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-3.5 flex gap-3 items-center flex-wrap">
          <input
            placeholder="Search by volume, date, or title…"
            className="flex-1 max-w-md px-3 py-2 text-[13px] bg-background border rounded-sm outline-none focus:border-[var(--mr-green-700)]"
            style={{ borderColor: "var(--border)" }}
          />
          <div className="mr-catalog ml-auto">SORT BY NEWEST</div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[140px_1fr] gap-8">
          {/* Year rail */}
          <aside className="hidden lg:block">
            <div className="sticky top-[100px]">
              <div className="mr-eyebrow mb-2.5">Jump to year</div>
              <div className="flex flex-col">
                {years.map((y) => (
                  <a
                    key={y}
                    href={`#year-${y}`}
                    className="font-mono text-left px-2.5 py-1 text-[12px] text-muted-foreground hover:bg-foreground hover:text-[var(--mr-ivory)] border-l-[3px] border-transparent hover:border-[var(--mr-saffron-700)] transition-colors"
                  >
                    {y}
                  </a>
                ))}
              </div>
            </div>
          </aside>

          <div>
            {years.map((year) => {
              const yearIssues = grouped[year].sort((a, b) => b.month - a.month);
              const volume = yearIssues[0]?.volume;
              const isCurrentYear = year === latestYear;
              return (
                <section key={year} id={`year-${year}`} className="mb-14">
                  <div
                    className="flex items-baseline gap-4 mb-5 pb-2.5 border-b flex-wrap"
                    style={{ borderColor: "var(--foreground)" }}
                  >
                    <h2
                      className="font-serif font-semibold leading-none tracking-tight"
                      style={{ fontSize: 48 }}
                    >
                      {year}
                    </h2>
                    <div className="mr-catalog ml-auto">
                      {yearIssues.length} ISSUES · VOLUME {volume ?? "—"}
                    </div>
                  </div>

                  <div
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
                    style={{ gap: 1, background: "var(--border)", border: "1px solid var(--border)" }}
                  >
                    {yearIssues.map((issue, i) => {
                      const isLatest = isCurrentYear && i === 0;
                      return (
                        <Link
                          key={issue.id}
                          href={`/issues/${issue.id}`}
                          className="mr-issue-tile relative flex flex-col p-5 min-h-[140px] border-l-[3px]"
                          style={{
                            background: isLatest ? "var(--mr-saffron-50)" : "var(--card)",
                            borderLeftColor: isLatest ? "var(--mr-saffron-700)" : "transparent",
                          }}
                        >
                          {isLatest && (
                            <span
                              className="absolute top-2.5 right-2.5 inline-flex text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded-sm"
                              style={{ background: "var(--mr-saffron-100)", color: "var(--mr-saffron-900)" }}
                            >
                              Current
                            </span>
                          )}
                          <div className="mr-catalog mr-issue-number">№ {issue.issueNumber}</div>
                          <div className="font-serif text-[22px] font-semibold mt-1">
                            {getMonthName(issue.month)} {year}
                          </div>
                          <div
                            className="font-arabic mt-0.5"
                            style={{ fontSize: 14, color: "var(--mr-saffron-700)" }}
                          >
                            {arMonths[(issue.month) % 12]}
                          </div>
                          <div
                            className="mt-auto pt-3 flex justify-between items-center"
                            style={{ borderTop: "1px dotted var(--border)" }}
                          >
                            <div className="mr-catalog">{issue.articleCount} ARTICLES</div>
                            <span style={{ color: "var(--mr-green-700)", fontSize: 14 }}>→</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
