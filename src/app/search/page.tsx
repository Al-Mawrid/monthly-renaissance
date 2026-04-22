import Link from "next/link";
import { Search, FileText, MessageCircleQuestion, User, Tag, BookOpen } from "lucide-react";
import { searchAll, type SearchHit } from "@/lib/queries";

export const metadata = {
  title: "Search",
  description: "Search articles, queries, writers, topics and issues across Monthly Renaissance.",
};

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  // Single call → one parallel DB round-trip. No waterfall.
  const results = await searchAll(query);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">
        Search
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Articles, queries, writers, topics, and issues — all in one place.
      </p>

      <form action="/search" className="mt-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            name="q"
            defaultValue={query}
            autoFocus
            placeholder="Search…"
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-background border rounded-sm outline-none focus:border-[var(--mr-green-700)]"
            style={{ borderColor: "var(--border)" }}
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 text-sm font-medium rounded-sm"
          style={{ background: "var(--mr-green-700)", color: "var(--mr-ivory)" }}
        >
          Search
        </button>
      </form>

      {query.length < 2 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          Enter at least two characters to search.
        </p>
      ) : results.total === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          No matches for <span className="font-semibold">&ldquo;{query}&rdquo;</span>.
        </p>
      ) : (
        <div className="mt-10 space-y-10">
          <p className="mr-catalog">
            {results.total} RESULT{results.total === 1 ? "" : "S"} FOR &ldquo;{query}&rdquo;
          </p>
          <Section title="Articles" icon={FileText} hits={results.articles} />
          <Section title="Queries" icon={MessageCircleQuestion} hits={results.queries} />
          <Section title="Writers" icon={User} hits={results.writers} />
          <Section title="Topics" icon={Tag} hits={results.topics} />
          <Section title="Issues" icon={BookOpen} hits={results.issues} />
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  hits,
}: {
  title: string;
  icon: typeof FileText;
  hits: SearchHit[];
}) {
  if (hits.length === 0) return null;
  return (
    <section>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: "var(--border)" }}>
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-semibold text-sm uppercase tracking-[0.08em]">
          {title}
        </h2>
        <span className="text-xs text-muted-foreground ml-auto">{hits.length}</span>
      </div>
      <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
        {hits.map((hit) => (
          <li key={`${hit.kind}-${hit.href}`}>
            <Link href={hit.href} className="block py-3 group">
              <div className="font-serif text-[17px] font-semibold group-hover:text-[var(--mr-green-700)] transition-colors">
                {hit.title}
              </div>
              {hit.subtitle && (
                <div className="text-xs text-muted-foreground mt-1">{hit.subtitle}</div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
