"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Clock, ExternalLink, FileText, LoaderCircle, MessageCircleQuestion, User } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { Article } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type FeedResponse = { items: Article[]; nextPage: number | null };
type GroupBy = "none" | "writer";
type WriterSort = "count-desc" | "count-asc" | "alpha-asc" | "alpha-desc";
type ArticleSort = "newest" | "oldest" | "alpha-asc" | "alpha-desc";
const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

function ContentCard({ item, compact, showType }: { item: Article; compact: boolean; showType: boolean }) {
  const isQuery = item.type === "query";
  const TypeIcon = isQuery ? MessageCircleQuestion : FileText;
  return (
    <article className="group relative h-full">
      <Link href={`/articles/${item.slug}`} className="flex h-full flex-col gap-2 rounded-xl border border-border bg-card p-4 pr-11 transition-all hover:border-primary/30 hover:shadow-sm">
        {(showType || !compact) && (
          <div className="flex flex-wrap items-center gap-2">
            {showType && <Badge variant="outline" className="gap-1 border-border px-1.5 py-0 text-[10px] text-muted-foreground">
              <TypeIcon className="h-3 w-3" aria-hidden />
              {isQuery ? "Query" : "Article"}
            </Badge>}
            {!compact && <Badge variant="outline" className="border-border px-1.5 py-0 text-[10px] text-muted-foreground">{item.topic.name}</Badge>}
          </div>
        )}
        <h3 className="text-[17px] font-semibold leading-snug transition-colors group-hover:text-primary">{item.title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{item.excerpt}</p>
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><User className="h-3 w-3" aria-hidden />{item.writer.name}</span>
          {item.issue && <span>{item.issue.title}</span>}
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden />{item.readingTime} min</span>
        </div>
      </Link>
      <Link href={`/articles/${item.slug}`} target="_blank" rel="noreferrer" aria-label={`Open ${item.title} in a new tab`} className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><ExternalLink className="h-3.5 w-3.5" aria-hidden /></Link>
    </article>
  );
}

export function ProgressiveContentResults({
  initialItems,
  nextPage,
  endpoint,
  emptyMessage,
  groupBy = "none",
  showType = false,
}: {
  initialItems: Article[];
  nextPage: number | null;
  endpoint: string;
  emptyMessage: string;
  groupBy?: GroupBy;
  showType?: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(nextPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsedWriters, setCollapsedWriters] = useState<Set<string>>(new Set());
  const sentinel = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const findTerms = searchParams.getAll("find").map((value) => value.trim().toLocaleLowerCase()).filter(Boolean);
  const writerFilters = searchParams.getAll("writerFilter").map((value) => value.trim().toLocaleLowerCase()).filter(Boolean);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const writerSortParam = searchParams.get("writerSort");
  const writerSort: WriterSort = writerSortParam === "count-asc"
    || writerSortParam === "alpha-asc"
    || writerSortParam === "alpha-desc"
    ? writerSortParam
    : "count-desc";
  const articleSortParam = searchParams.get("articleSort");
  const articleSort: ArticleSort = articleSortParam === "oldest"
    || articleSortParam === "alpha-asc"
    || articleSortParam === "alpha-desc"
    ? articleSortParam
    : "newest";

  const loadMore = useCallback(async () => {
    if (!page || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${endpoint}${endpoint.includes("?") ? "&" : "?"}page=${page}`);
      if (!response.ok) throw new Error("Could not load more content.");
      const data = await response.json() as FeedResponse;
      setItems((current) => [...current, ...data.items]);
      setPage(data.nextPage);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load more content.");
    } finally {
      setLoading(false);
    }
  }, [endpoint, loading, page]);

  useEffect(() => {
    const target = sentinel.current;
    if (!target || !page || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void loadMore();
    }, { rootMargin: "320px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, page]);

  const filteredItems = useMemo(() => items.filter((item) => {
    const publishedOn = item.createdAt.slice(0, 10);
    const searchableText = [item.title, item.excerpt, item.writer.name, item.topic.name, item.issue?.title]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();
    const matchesFind = findTerms.length === 0 || findTerms.every((term) => searchableText.includes(term));
    return matchesFind
      && (writerFilters.length === 0 || writerFilters.includes(item.writer.name.toLocaleLowerCase()))
      && (!from || publishedOn >= from)
      && (!to || publishedOn <= to);
  }), [findTerms, from, items, to, writerFilters]);

  const byWriter = useMemo(() => {
    const groups = new Map<string, { name: string; items: Article[] }>();
    for (const item of filteredItems) {
      const current = groups.get(item.writer.slug) ?? { name: item.writer.name, items: [] };
      current.items.push(item);
      groups.set(item.writer.slug, current);
    }
    return [...groups.entries()];
  }, [filteredItems]);

  const sortedItems = useMemo(() => {
    if (articleSort === "newest") return filteredItems;
    if (articleSort === "oldest") return [...filteredItems].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const direction = articleSort === "alpha-asc" ? 1 : -1;
    return [...filteredItems].sort((a, b) => direction * collator.compare(a.title, b.title));
  }, [articleSort, filteredItems]);

  const sortedWriterSections = useMemo(() => [...byWriter]
    .map(([slug, section]) => ({
      slug,
      name: section.name,
      items: articleSort === "newest" ? section.items
        : articleSort === "oldest" ? [...section.items].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
          : [...section.items].sort((a, b) => (articleSort === "alpha-asc" ? 1 : -1) * collator.compare(a.title, b.title)),
    }))
    .sort((a, b) => {
      if (writerSort === "count-asc") return a.items.length - b.items.length || collator.compare(a.name, b.name);
      if (writerSort === "alpha-asc") return collator.compare(a.name, b.name);
      if (writerSort === "alpha-desc") return collator.compare(b.name, a.name);
      return b.items.length - a.items.length || collator.compare(a.name, b.name);
    }), [articleSort, byWriter, writerSort]);

  if (items.length === 0) return <p className="py-12 text-center text-muted-foreground">{emptyMessage}</p>;

  return (
    <div className="space-y-8">
      {groupBy === "writer" ? sortedWriterSections.map((section) => {
        const { slug } = section;
        const collapsed = collapsedWriters.has(slug);
        return (
        <section key={slug} id={`writer-${slug}`} className="scroll-mt-28" aria-labelledby={`writer-${slug}-heading`}>
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-border pb-2">
            <h3 id={`writer-${slug}-heading`} className="text-lg font-semibold">{section.name}</h3>
            <Button type="button" variant="ghost" size="sm" aria-expanded={!collapsed} aria-controls={`writer-${slug}-articles`} onClick={() => setCollapsedWriters((current) => {
              const next = new Set(current);
              if (next.has(slug)) next.delete(slug); else next.add(slug);
              return next;
            })}>
              {section.items.length} loaded
              <ChevronDown className={`transition-transform ${collapsed ? "-rotate-90" : ""}`} aria-hidden />
              <span className="sr-only">{collapsed ? "Expand" : "Collapse"} {section.name}</span>
            </Button>
          </div>
          {!collapsed && <div id={`writer-${slug}-articles`} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{section.items.map((item) => <ContentCard key={`${item.type}-${item.id}`} item={item} compact showType={showType} />)}</div>}
        </section>
        );
      }) : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{sortedItems.map((item) => <ContentCard key={`${item.type}-${item.id}`} item={item} compact showType={showType} />)}</div>}
      {filteredItems.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No loaded content matches these filters. More matching results may load as you scroll.</p>}
      <div ref={sentinel} aria-hidden="true" />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {page && <Button type="button" variant="outline" onClick={() => void loadMore()} disabled={loading}>{loading && <LoaderCircle className="animate-spin" />}Load more</Button>}
      {!page && <p className="text-sm text-muted-foreground">You’ve reached the end.</p>}
    </div>
  );
}
