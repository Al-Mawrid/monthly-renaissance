"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, MessageCircleQuestion, User, Tag, BookOpen, X } from "lucide-react";
import type { SearchHit, SearchResults } from "@/lib/queries";

type Props = { onClose: () => void };

const DEBOUNCE_MS = 250;
const MIN_CHARS = 2;
const DROPDOWN_LIMIT = 5;

const EMPTY: SearchResults = {
  query: "", articles: [], queries: [], writers: [], topics: [], issues: [], total: 0,
};

// Module-level cache — persists while the SPA session lives, so retyping the
// same query doesn't re-hit the API.
const cache = new Map<string, SearchResults>();

export function SearchBox({ onClose }: Props) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Debounced fetch. Skips if <MIN_CHARS. Aborts any prior in-flight request.
  // Caches results by normalized query to avoid duplicate round-trips.
  useEffect(() => {
    const q = value.trim();
    if (q.length < MIN_CHARS) {
      setResults(EMPTY);
      setLoading(false);
      abortRef.current?.abort();
      return;
    }
    const cached = cache.get(q);
    if (cached) {
      setResults(cached);
      setLoading(false);
      return;
    }
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(q)}&limit=${DROPDOWN_LIMIT}`, {
        signal: ac.signal,
      })
        .then((r) => r.json() as Promise<SearchResults>)
        .then((data) => {
          cache.set(q, data);
          setResults(data);
          setLoading(false);
        })
        .catch((err) => {
          if (err?.name !== "AbortError") setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  // Click outside + Esc to close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [onClose]);

  const q = value.trim();
  const showDropdown = q.length >= MIN_CHARS;
  const hasAny = results.total > 0;
  const hasMore =
    results.articles.length >= DROPDOWN_LIMIT ||
    results.queries.length >= DROPDOWN_LIMIT ||
    results.writers.length >= DROPDOWN_LIMIT ||
    results.topics.length >= DROPDOWN_LIMIT ||
    results.issues.length >= DROPDOWN_LIMIT;

  return (
    <div ref={containerRef} className="relative">
      <form
        action="/search"
        onSubmit={(e) => {
          if (!q) {
            e.preventDefault();
            return;
          }
          e.preventDefault();
          onClose();
          router.push(`/search?q=${encodeURIComponent(q)}`);
        }}
      >
        <div className="relative">
          <input
            autoFocus
            name="q"
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search articles, issues, queries, writers…"
            className="w-full pl-4 pr-10 py-2.5 text-sm bg-background border rounded-sm outline-none focus:border-[var(--mr-green-700)] [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
            style={{ borderColor: "var(--border)" }}
            aria-autocomplete="list"
            aria-expanded={showDropdown}
          />
          {value && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setValue("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-6 w-6 rounded-sm transition-colors hover:bg-[var(--mr-saffron-50)]"
              style={{ color: "var(--mr-clay-700)" }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </form>

      {showDropdown && (
        <div
          className="absolute left-0 right-0 mt-1 max-h-[70vh] overflow-y-auto rounded-sm shadow-lg z-50"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          role="listbox"
        >
          {loading && !hasAny ? (
            <div className="px-4 py-5 text-sm text-muted-foreground">Searching…</div>
          ) : !hasAny ? (
            <div className="px-4 py-5 text-sm text-muted-foreground">
              No matches for <span className="font-semibold">&ldquo;{q}&rdquo;</span>.
            </div>
          ) : (
            <>
              <Group title="Articles" icon={FileText} hits={results.articles} onPick={onClose} />
              <Group title="Queries" icon={MessageCircleQuestion} hits={results.queries} onPick={onClose} />
              <Group title="Writers" icon={User} hits={results.writers} onPick={onClose} />
              <Group title="Topics" icon={Tag} hits={results.topics} onPick={onClose} />
              <Group title="Issues" icon={BookOpen} hits={results.issues} onPick={onClose} />
              {hasMore && (
                <Link
                  href={`/search?q=${encodeURIComponent(q)}`}
                  onClick={onClose}
                  className="block px-4 py-3 text-[13px] font-semibold text-center border-t hover:bg-[var(--mr-green-50)] transition-colors"
                  style={{ color: "var(--mr-green-700)", borderColor: "var(--border)" }}
                >
                  Show more results →
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Group({
  title,
  icon: Icon,
  hits,
  onPick,
}: {
  title: string;
  icon: typeof FileText;
  hits: SearchHit[];
  onPick: () => void;
}) {
  if (hits.length === 0) return null;
  return (
    <div className="py-1 border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2 px-4 pt-2 pb-1">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {title}
        </span>
      </div>
      <ul>
        {hits.map((hit) => (
          <li key={`${hit.kind}-${hit.href}`}>
            <Link
              href={hit.href}
              onClick={onPick}
              className="block px-4 py-2 hover:bg-[var(--mr-green-50)] transition-colors"
            >
              <div className="text-sm font-medium truncate">{hit.title}</div>
              {hit.subtitle && (
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  {hit.subtitle}
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
