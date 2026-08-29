import Link from "next/link";
import { getAllIssues, getMonthName, groupIssuesByYear } from "@/lib/queries";
import { StickyViewNav } from "@/components/content/sticky-view-nav";

export const metadata = {
  title: "Archives",
  description: "Browse all issues of Monthly Renaissance from 1991 to present.",
};

export const revalidate = 3600;

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; sort?: string }>;
}) {
  const { view: viewParam, sort: sortParam } = await searchParams;
  const view = viewParam === "special" ? "special" : "all";
  const sort = sortParam === "oldest" ? "oldest" : "newest";
  const issues = await getAllIssues();
  const visibleIssues = view === "special" ? issues.filter((issue) => issue.isSpecial) : issues;
  const grouped = groupIssuesByYear(visibleIssues);
  const years = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => (sort === "newest" ? b - a : a - b));
  const totalIssues = visibleIssues.length;
  const latestYear = years.length > 0 ? Math.max(...years) : 0;
  const earliestYear = years.length > 0 ? Math.min(...years) : 1991;

  return (
    <div>
      {/* Page header */}
      <div className="border-b" style={{ borderColor: "var(--foreground)" }}>
        <div className="mx-auto max-w-7xl px-2 sm:px-3 lg:px-5 py-14">
          <div className="flex items-end justify-between flex-wrap gap-6">
            <div>
              <div
                className="mr-eyebrow mb-2.5"
                style={{ color: "var(--mr-saffron-700)" }}
              >
                {view === "special" ? "— Special Issues —" : "— The Archive —"}
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold tracking-tight leading-none">
                {view === "special"
                  ? "Themed editions"
                  : `Every issue, since ${earliestYear}`}
              </h1>
            </div>
            <div className="text-right">
              <div
                className="font-serif font-semibold leading-none"
                style={{ fontSize: 60, color: "var(--mr-clay-700)" }}
              >
                {totalIssues}
              </div>
              <div className="mr-eyebrow mt-1">
                {view === "special" ? "special issues" : "issues catalogued"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <StickyViewNav
        label="View"
        ariaLabel="Browse issues"
        className="px-2 sm:px-3 lg:px-5"
        items={[
          {
            label: "All Issues",
            href: `/issues?view=all&sort=${sort}`,
            active: view === "all",
          },
          {
            label: "Special Issues",
            href: `/issues?view=special&sort=${sort}`,
            active: view === "special",
          },
        ]}
        sortControl={{
          value: sort,
          options: [
            { value: "newest", label: "Newest first" },
            { value: "oldest", label: "Oldest first" },
          ],
        }}
      />

      <div className="mx-auto max-w-7xl px-2 sm:px-3 lg:px-5 py-10">
        {years.length === 0 ? (
          <p className="py-12 text-center text-sm italic text-muted-foreground">
            No {view === "special" ? "special issues" : "issues"} catalogued yet.
          </p>
        ) : (
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
              const yearIssues = grouped[year].sort((a, b) =>
                sort === "newest" ? b.month - a.month : a.month - b.month,
              );
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
                      const isLatest =
                        isCurrentYear && i === (sort === "newest" ? 0 : yearIssues.length - 1);
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
                          {issue.isSpecial && issue.title && (
                            <div
                              className="text-[12px] italic mt-0.5"
                              style={{ color: "var(--mr-saffron-700)" }}
                            >
                              {issue.title}
                            </div>
                          )}
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
        )}
      </div>
    </div>
  );
}
