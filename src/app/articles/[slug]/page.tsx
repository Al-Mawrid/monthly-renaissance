import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, User, Clock, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/lib/variants";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { articles, queries, getMonthName } from "@/lib/data";

const allContent = [...articles, ...queries];

export async function generateStaticParams() {
  return allContent.map((a) => ({ slug: a.slug }));
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = allContent.find((a) => a.slug === slug);

  if (!article) notFound();

  // Get related articles (same topic, different article)
  const related = allContent
    .filter((a) => a.topic.id === article.topic.id && a.id !== article.id)
    .slice(0, 3);

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      {/* Back link */}
      <Link
        href={`/issues/${article.issue.id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-8 -ml-2 text-muted-foreground")}
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        {getMonthName(article.issue.month)} {article.issue.year} Issue
      </Link>

      {/* Article Header */}
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Badge className="bg-primary/10 text-primary border-0 text-xs">
            {article.type === "query" ? "Reader Query" : article.topic.name}
          </Badge>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight mb-5">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <Link
            href={`/articles/writers/${article.writer.slug}`}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">
                {article.writer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </span>
            </div>
            {article.writer.name}
          </Link>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {getMonthName(article.issue.month)} {article.issue.year}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {article.readingTime} min read
          </span>
        </div>
      </header>

      <Separator className="mb-10" />

      {/* Article Body */}
      <div
        className="article-content"
        dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
      />

      <Separator className="my-10" />

      {/* Author Bio */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-semibold text-primary">
              {article.writer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </span>
          </div>
          <div>
            <Link
              href={`/articles/writers/${article.writer.slug}`}
              className="font-semibold hover:text-primary transition-colors"
            >
              {article.writer.name}
            </Link>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {article.writer.bio}
            </p>
            <Link
              href={`/articles/writers/${article.writer.slug}`}
              className="text-sm text-primary hover:underline mt-2 inline-block"
            >
              View all articles &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Related Articles */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold mb-4">Related Articles</h2>
          <div className="space-y-3">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/articles/${item.slug}`}
                className="group flex flex-col gap-1.5 rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <h3 className="font-semibold text-[15px] leading-snug group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.excerpt}
                </p>
                <span className="text-xs text-muted-foreground">
                  {item.writer.name} &middot; {item.readingTime} min read
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
