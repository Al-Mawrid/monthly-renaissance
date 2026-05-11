import Link from "next/link";
import { getSpecialIssues, getMonthName } from "@/lib/queries";

export const metadata = {
  title: "Special Issues",
  description: "Special themed issues of Monthly Renaissance — including issues dedicated to specific topics such as Hajj.",
};

export const dynamic = "force-dynamic";

export default async function SpecialIssuesPage() {
  const issues = await getSpecialIssues();

  return (
    <div>
      <div className="border-b" style={{ borderColor: "var(--foreground)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-14">
          <div className="flex items-end justify-between flex-wrap gap-6">
            <div>
              <div
                className="mr-eyebrow mb-2.5"
                style={{ color: "var(--mr-clay-700)" }}
              >
                — Special Issues —
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold tracking-tight leading-none">
                Themed editions
              </h1>
              <p className="font-serif text-[17px] text-muted-foreground mt-4 max-w-2xl leading-relaxed">
                Editions of Renaissance devoted to a single subject — Hajj, the Prophet&rsquo;s ﷺ biography, the Qur&rsquo;an&rsquo;s structure, and other recurring themes.
              </p>
            </div>
            <div className="text-right">
              <div
                className="font-serif font-semibold leading-none"
                style={{ fontSize: 60, color: "var(--mr-clay-700)" }}
              >
                {issues.length}
              </div>
              <div className="mr-eyebrow mt-1">special issues</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-12">
        {issues.length === 0 ? (
          <p className="text-[14px] text-muted-foreground italic">No special issues catalogued yet.</p>
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            style={{ gap: 1, background: "var(--border)", border: "1px solid var(--border)" }}
          >
            {issues.map((issue) => (
              <Link
                key={issue.id}
                href={`/issues/${issue.id}`}
                className="mr-issue-tile relative flex flex-col p-6 min-h-[160px] border-l-[3px]"
                style={{
                  background: "var(--mr-saffron-50)",
                  borderLeftColor: "var(--mr-saffron-700)",
                }}
              >
                <div className="mr-catalog mr-issue-number">№ {issue.issueNumber}</div>
                <div className="font-serif text-[22px] font-semibold mt-1 leading-tight">
                  {issue.title || `${getMonthName(issue.month)} ${issue.year}`}
                </div>
                <div
                  className="text-[12px] mt-1"
                  style={{ color: "var(--mr-ink-muted)" }}
                >
                  {getMonthName(issue.month)} {issue.year}
                </div>
                <div
                  className="mt-auto pt-3 flex justify-between items-center"
                  style={{ borderTop: "1px dotted var(--border)" }}
                >
                  <div className="mr-catalog">{issue.articleCount} PIECES</div>
                  <span style={{ color: "var(--mr-clay-700)", fontSize: 14 }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
