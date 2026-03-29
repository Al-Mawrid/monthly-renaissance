import Link from "next/link";
import { Calendar, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getAllIssues, getMonthName, groupIssuesByYear } from "@/lib/queries";

export const metadata = {
  title: "Archives",
  description: "Browse all issues of Monthly Renaissance from 1991 to present.",
};

export default async function IssuesPage() {
  const issues = await getAllIssues();
  const grouped = groupIssuesByYear(issues);
  const years = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Issue Archives</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Browse over 430 issues spanning 35 years of Islamic scholarship, from
          March 1991 to the present.
        </p>
      </div>

      {/* Issues by Year */}
      <div className="space-y-10">
        {years.map((year) => (
          <section key={year}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold">{year}</h2>
              <Badge variant="secondary" className="text-xs">
                {grouped[year].length} issues
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {grouped[year]
                .sort((a, b) => b.month - a.month)
                .map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/issues/${issue.id}`}
                    className="group flex flex-col items-center justify-center rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all text-center"
                  >
                    <Calendar className="h-5 w-5 text-primary/60 mb-2 group-hover:text-primary transition-colors" />
                    <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                      {getMonthName(issue.month)}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      Vol. {issue.volume}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
                      <FileText className="h-3 w-3" />
                      {issue.articleCount} articles
                    </div>
                  </Link>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
