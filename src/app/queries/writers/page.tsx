import Link from "next/link";
import { writers, queries } from "@/lib/data";

export const metadata = {
  title: "Queries by Writer",
  description: "Browse reader queries answered by our scholars.",
};

export default function QueriesByWriterPage() {
  // Get writers who have answered queries
  const queryWriterIds = new Set(queries.map((q) => q.writer.id));
  const queryWriters = writers.filter((w) => queryWriterIds.has(w.id));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Queries by Writer</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Reader questions answered by our panel of scholars, organized by
          respondent.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {queryWriters.map((writer) => {
          const writerQueries = queries.filter(
            (q) => q.writer.id === writer.id
          );
          return (
            <Link
              key={writer.id}
              href={`/articles/writers/${writer.slug}`}
              className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-base font-semibold text-primary">
                  {writer.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </span>
              </div>
              <div>
                <h2 className="font-semibold group-hover:text-primary transition-colors">
                  {writer.name}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {writerQueries.length} queries answered
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
