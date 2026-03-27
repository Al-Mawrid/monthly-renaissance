import Link from "next/link";
import { User, ArrowRight } from "lucide-react";
import { writers } from "@/lib/data";

export const metadata = {
  title: "Writers",
  description: "Browse articles by our contributing scholars and writers.",
};

export default function WritersPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Our Writers</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Scholars and thinkers who have contributed to Renaissance over the past
          three decades.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {writers.map((writer) => (
          <Link
            key={writer.id}
            href={`/articles/writers/${writer.slug}`}
            className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all"
          >
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-semibold text-primary">
                {writer.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold group-hover:text-primary transition-colors">
                {writer.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {writer.bio}
              </p>
              <span className="text-xs text-muted-foreground mt-2 block">
                {writer.articleCount} articles
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
