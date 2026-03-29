import Link from "next/link";
import { Tag } from "lucide-react";
import { getQueryTopics } from "@/lib/queries";

export const metadata = {
  title: "Queries by Topic",
  description: "Browse reader queries organized by subject area.",
};

export default async function QueriesByTopicPage() {
  const queryTopics = await getQueryTopics();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Queries by Topic</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Reader questions organized by subject, covering faith, practice, and
          contemporary issues.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {queryTopics.map((topic) => (
            <Link
              key={topic.id}
              href={`/articles/topics/${topic.slug}`}
              className="group flex flex-col rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-primary/60 group-hover:text-primary transition-colors" />
                <h3 className="font-semibold text-[15px] group-hover:text-primary transition-colors">
                  {topic.name}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {topic.description}
              </p>
              <span className="text-xs text-muted-foreground mt-3">
                {topic.articleCount} queries
              </span>
            </Link>
        ))}
      </div>
    </div>
  );
}
