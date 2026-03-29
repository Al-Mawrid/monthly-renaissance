import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/lib/variants";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  getAllTopicSlugs,
  getTopicBySlug,
  getArticlesByTopic,
} from "@/lib/queries";

export async function generateStaticParams() {
  const slugs = await getAllTopicSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = await getTopicBySlug(slug);
  if (!topic) notFound();

  const topicArticles = await getArticlesByTopic(slug);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <Link
        href="/articles/topics"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 -ml-2 text-muted-foreground")}
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        All Topics
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{topic.name}</h1>
        <p className="text-muted-foreground mt-1.5">{topic.description}</p>
        <span className="text-sm text-muted-foreground mt-1 block">
          {topicArticles.length} articles
        </span>
      </div>

      <Separator className="mb-8" />

      <div className="space-y-3">
        {topicArticles.map((article) => (
          <Link
            key={article.id}
            href={`/articles/${article.slug}`}
            className="group flex flex-col gap-1.5 rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all"
          >
            <h3 className="font-semibold leading-snug group-hover:text-primary transition-colors">
              {article.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {article.excerpt}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {article.writer.name}
              </span>
              <span>{article.issue.title}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {article.readingTime} min
              </span>
            </div>
          </Link>
        ))}

        {topicArticles.length === 0 && (
          <p className="text-muted-foreground text-center py-12">
            No articles found for this topic yet.
          </p>
        )}
      </div>
    </div>
  );
}
