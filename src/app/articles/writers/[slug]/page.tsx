import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/lib/variants";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  getAllWriterSlugs,
  getWriterBySlug,
  getArticlesByWriter,
} from "@/lib/queries";

export async function generateStaticParams() {
  const slugs = await getAllWriterSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function WriterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const writer = await getWriterBySlug(slug);
  if (!writer) notFound();

  const writerArticles = await getArticlesByWriter(slug);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <Link
        href="/articles/writers"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 -ml-2 text-muted-foreground")}
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        All Writers
      </Link>

      {/* Writer Header */}
      <div className="flex items-start gap-5 mb-8">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-semibold text-primary">
            {writer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{writer.name}</h1>
          <p className="text-muted-foreground mt-1.5 leading-relaxed max-w-xl">
            {writer.bio}
          </p>
          <span className="text-sm text-muted-foreground mt-2 block">
            {writerArticles.length} articles
          </span>
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Articles List */}
      <div className="space-y-3">
        {writerArticles.map((article) => (
          <Link
            key={article.id}
            href={`/articles/${article.slug}`}
            className="group flex flex-col gap-1.5 rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border text-muted-foreground">
                {article.topic.name}
              </Badge>
              {article.type === "query" && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border text-muted-foreground">
                  Q&A
                </Badge>
              )}
            </div>
            <h3 className="font-semibold leading-snug group-hover:text-primary transition-colors">
              {article.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {article.excerpt}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span>{article.issue.title}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {article.readingTime} min
              </span>
            </div>
          </Link>
        ))}

        {writerArticles.length === 0 && (
          <p className="text-muted-foreground text-center py-12">
            No articles found for this writer yet.
          </p>
        )}
      </div>
    </div>
  );
}
