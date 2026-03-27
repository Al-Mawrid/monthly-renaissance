import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, User, Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/lib/variants";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { issues, articles, queries, getMonthName } from "@/lib/data";

export async function generateStaticParams() {
  return issues.map((issue) => ({ id: issue.id }));
}

export default async function IssuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const issue = issues.find((i) => i.id === id);

  if (!issue) notFound();

  // Get articles and queries for this issue
  const issueArticles = articles.filter(
    (a) => a.issue.id === issue.id && a.type === "article"
  );
  const issueQueries = queries.filter((q) => q.issue.id === issue.id);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      {/* Back link */}
      <Link
        href="/issues"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 -ml-2 text-muted-foreground")}
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        All Issues
      </Link>

      {/* Issue Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">
            Volume {issue.volume}
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {getMonthName(issue.month)} {issue.year}
        </h1>
        <p className="text-muted-foreground mt-2">
          Issue {issue.issueNumber} &middot; {issueArticles.length + issueQueries.length} items
        </p>
      </div>

      {/* Articles */}
      {issueArticles.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Articles</h2>
          <div className="space-y-3">
            {issueArticles.map((article) => (
              <Link
                key={article.id}
                href={`/articles/${article.slug}`}
                className="group flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-5 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border text-muted-foreground">
                      {article.topic.name}
                    </Badge>
                  </div>
                  <h3 className="font-semibold leading-snug group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center gap-3 mt-2.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {article.writer.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {article.readingTime} min
                    </span>
                  </div>
                </div>
                <ChevronRight className="hidden sm:block h-4 w-4 text-muted-foreground mt-1 group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Queries */}
      {issueQueries.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Queries</h2>
          <div className="space-y-3">
            {issueQueries.map((query) => (
              <Link
                key={query.id}
                href={`/articles/${query.slug}`}
                className="group flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-5 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="flex-1 min-w-0">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border text-muted-foreground mb-1.5">
                    Q&A
                  </Badge>
                  <h3 className="font-semibold leading-snug group-hover:text-primary transition-colors">
                    {query.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {query.excerpt}
                  </p>
                  <span className="text-xs text-muted-foreground mt-2 block">
                    {query.writer.name}
                  </span>
                </div>
                <ChevronRight className="hidden sm:block h-4 w-4 text-muted-foreground mt-1 group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
