import Link from "next/link";
import {
  BookOpen,
  ArrowRight,
  Calendar,
  User,
  Clock,
  Library,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";
import {
  getLatestIssue,
  getFeaturedArticle,
  getRecentArticles,
  getLatestQueries,
  getFeaturedWriters,
  getFeaturedTopics,
} from "@/lib/queries";

export default async function Home() {
  const [latestIssue, featuredArticle, recentArticles, latestQueries, featuredWriters, featuredTopics] =
    await Promise.all([
      getLatestIssue(),
      getFeaturedArticle(),
      getRecentArticles(4),
      getLatestQueries(3),
      getFeaturedWriters(4),
      getFeaturedTopics(6),
    ]);

  if (!latestIssue || !featuredArticle) return null;

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            {/* Left: Featured Article */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2.5">
                <Badge variant="secondary" className="text-xs font-medium bg-primary/10 text-primary border-0">
                  {latestIssue.title}
                </Badge>
                <span className="text-xs text-muted-foreground">Latest Issue</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-[1.15] tracking-tight">
                {featuredArticle.title}
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed">
                {featuredArticle.excerpt}
              </p>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {featuredArticle.writer.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {featuredArticle.readingTime} min read
                </span>
              </div>

              <div className="flex gap-3 pt-1">
                <Link
                  href={`/articles/${featuredArticle.slug}`}
                  className={cn(buttonVariants({ size: "lg" }), "bg-primary hover:bg-teal-dark")}
                >
                  Read Article
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href={`/issues/${latestIssue.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                >
                  View Full Issue
                </Link>
              </div>
            </div>

            {/* Right: More from this issue */}
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Also in this issue
              </h2>
              <div className="flex flex-col gap-3">
                {recentArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/articles/${article.slug}`}
                    className="group flex flex-col gap-1.5 rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border text-muted-foreground">
                        {article.topic.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {article.readingTime} min
                      </span>
                    </div>
                    <h3 className="font-semibold text-[15px] leading-snug group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {article.excerpt}
                    </p>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      {article.writer.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Browse by Topic */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Browse by Topic</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Explore 35 years of scholarship across key Islamic disciplines
              </p>
            </div>
            <Link
              href="/articles/topics"
              className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:flex text-muted-foreground")}
            >
              All Topics <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {featuredTopics.map((topic) => (
              <Link
                key={topic.id}
                href={`/articles/topics/${topic.slug}`}
                className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div>
                  <h3 className="font-semibold text-[15px] group-hover:text-primary transition-colors">
                    {topic.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                    {topic.description}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground mt-3">
                  {topic.articleCount} articles
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-4 sm:hidden">
            <Link
              href="/articles/topics"
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            >
              View All Topics
            </Link>
          </div>
        </div>
      </section>

      {/* Queries Section */}
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Reader Queries</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Questions answered by our scholars on faith, practice, and life
              </p>
            </div>
            <Link
              href="/queries/topics"
              className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:flex text-muted-foreground")}
            >
              All Queries <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {latestQueries.map((query) => (
              <Link
                key={query.id}
                href={`/articles/${query.slug}`}
                className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <Badge variant="outline" className="w-fit text-[10px] px-1.5 py-0 border-border text-muted-foreground">
                  {query.topic.name}
                </Badge>
                <h3 className="font-semibold leading-snug group-hover:text-primary transition-colors">
                  {query.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {query.excerpt}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
                  <span>{query.writer.name}</span>
                  <span>{query.readingTime} min read</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Writers */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Our Writers</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Scholars and thinkers contributing to the discourse
              </p>
            </div>
            <Link
              href="/articles/writers"
              className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:flex text-muted-foreground")}
            >
              All Writers <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredWriters.map((writer) => (
              <Link
                key={writer.id}
                href={`/articles/writers/${writer.slug}`}
                className="group flex flex-col items-center text-center rounded-xl border border-border bg-card p-6 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-xl font-semibold text-primary">
                    {writer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                  {writer.name}
                </h3>
                <span className="text-xs text-muted-foreground mt-1">
                  {writer.articleCount} articles
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Archive CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="flex flex-col items-center text-center gap-5">
            <Library className="h-10 w-10 opacity-80" />
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              35 Years of Islamic Scholarship
            </h2>
            <p className="text-base opacity-85 max-w-lg">
              Explore our complete archive of over 430 issues published since 1991,
              covering every major topic in Islamic thought and practice.
            </p>
            <div className="flex gap-3 pt-1">
              <Link
                href="/issues"
                className={cn(buttonVariants({ size: "lg" }), "bg-white text-primary hover:bg-white/90")}
              >
                Browse Archive
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/ebooks"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-white/30 text-white hover:bg-white/10 hover:text-white")}
              >
                E-Books
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
