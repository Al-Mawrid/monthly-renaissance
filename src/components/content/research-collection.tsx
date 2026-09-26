"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, LoaderCircle } from "lucide-react";
import type { ResearchCollection as ResearchCollectionData, ResearchWriterSection } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function mergeSections(current: ResearchWriterSection[], incoming: ResearchWriterSection[]) {
  const next = current.map((section) => ({
    ...section,
    groups: section.groups.map((group) => ({ ...group, installments: [...group.installments] })),
    ungrouped: [...section.ungrouped],
  }));
  for (const section of incoming) {
    const match = next.find((candidate) => candidate.writer.slug === section.writer.slug);
    if (!match) { next.push(section); continue; }
    for (const group of section.groups) {
      const currentGroup = match.groups.find((candidate) => candidate.id === group.id);
      if (!currentGroup) match.groups.push(group);
      else currentGroup.installments.push(...group.installments);
    }
    match.ungrouped.push(...section.ungrouped);
  }
  return next;
}

function issueLabel(issue: ResearchCollectionData["writers"][number]["groups"][number]["installments"][number]["article"]["issue"], date: string) {
  return issue?.title ?? (date || "Publication date unavailable");
}

function InstallmentCard({ installment }: { installment: ResearchCollectionData["writers"][number]["groups"][number]["installments"][number] }) {
  const { article } = installment;
  const label = installment.installmentLabel ?? (installment.installmentNumber ? `Part ${installment.installmentNumber}` : null);
  return (
    <Card size="sm" className="h-full">
      <CardHeader>
        <CardTitle><Link className="hover:underline" href={`/articles/${article.slug}`}>{article.title}</Link></CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-xs text-muted-foreground">
        {label && <p className="font-medium text-foreground">{label}</p>}
        <p>{article.writer.name}</p>
        <p>{issueLabel(article.issue, article.createdAt)}</p>
      </CardContent>
    </Card>
  );
}

export function ResearchCollection({ initial, writer, group }: {
  initial: ResearchCollectionData;
  writer?: string;
  group?: string;
}) {
  const [collection, setCollection] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const requestMore = useCallback(async () => {
    if (!collection.nextCursor || loading) return;
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ topic: collection.topic.slug, cursor: collection.nextCursor });
      if (writer) params.set("writer", writer);
      if (group) params.set("group", group);
      const response = await fetch(`/api/research-collections?${params}`);
      if (!response.ok) throw new Error("Could not load more articles.");
      const more = await response.json() as ResearchCollectionData;
      setCollection((current) => ({ ...current, writers: mergeSections(current.writers, more.writers), nextCursor: more.nextCursor }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load more articles.");
    } finally { setLoading(false); }
  }, [collection.nextCursor, collection.topic.slug, group, loading, writer]);
  useEffect(() => {
    const target = sentinel.current;
    if (!target || !collection.nextCursor || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) void requestMore(); }, { rootMargin: "280px" });
    observer.observe(target); return () => observer.disconnect();
  }, [collection.nextCursor, requestMore]);

  const writerLinks = collection.writers.map((section) => section.writer);
  return (
    <section aria-labelledby="research-collection-heading" className="space-y-8">
      <div className="space-y-2">
        <h2 id="research-collection-heading" className="text-lg font-semibold">{collection.title}</h2>
        <p className="text-sm text-muted-foreground">Browse each writer’s work by approved Surah or subject. Monthly issues remain available from every article.</p>
        <nav aria-label="Jump to writer" className="flex flex-wrap gap-2 pt-1">
          {writerLinks.map((item) => <Link className="rounded-md border border-border px-2 py-1 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2" href={`/articles/topics/${collection.topic.slug}?view=articles&writer=${encodeURIComponent(item.slug)}#writer-${item.slug}`} key={item.slug}>{item.name}</Link>)}
        </nav>
      </div>

      {collection.writers.map((section) => (
        <section id={`writer-${section.writer.slug}`} key={section.writer.slug} className="scroll-mt-24 space-y-4 border-t border-border pt-6" aria-labelledby={`writer-title-${section.writer.slug}`}>
          <h3 id={`writer-title-${section.writer.slug}`} className="text-xl font-semibold">{section.writer.name}</h3>
          {section.groups.map((researchGroup) => <ResearchGroup key={researchGroup.id} group={researchGroup} topicSlug={collection.topic.slug} />)}
          {section.ungrouped.length > 0 && <ResearchGroup title="Other articles by this writer" group={{ id: `other-${section.writer.slug}`, slug: "other", title: "Other articles by this writer", sortOrder: 0, installments: section.ungrouped }} topicSlug={collection.topic.slug} />}
        </section>
      ))}

      <div ref={sentinel} aria-hidden="true" />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {collection.nextCursor && <Button variant="outline" onClick={() => void requestMore()} disabled={loading}>{loading && <LoaderCircle className="animate-spin" />}Load more</Button>}
      {!collection.nextCursor && <p className="text-sm text-muted-foreground">End of this collection.</p>}
    </section>
  );
}

function ResearchGroup({ group, title, topicSlug }: { group: ResearchCollectionData["writers"][number]["groups"][number]; title?: string; topicSlug: string }) {
  const [expanded, setExpanded] = useState(group.installments.length <= 3);
  const visible = expanded ? group.installments : group.installments.slice(0, 3);
  const heading = title ?? group.title;
  return <div id={`group-${group.slug}`} className="scroll-mt-24 rounded-lg border border-border p-4">
    <div className="flex items-center justify-between gap-3"><h4 className="font-medium">{title ? heading : <Link className="hover:underline" href={`/articles/topics/${topicSlug}?view=articles&group=${encodeURIComponent(group.slug)}#group-${group.slug}`}>{heading}</Link>}</h4><Button variant="ghost" size="sm" aria-expanded={expanded} aria-controls={`installments-${group.id}`} onClick={() => setExpanded((value) => !value)}>{expanded ? "Collapse" : `Show all (${group.installments.length})`}<ChevronDown className={cn("transition-transform", expanded && "rotate-180")} /></Button></div>
    <div id={`installments-${group.id}`} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{visible.map((installment) => <InstallmentCard key={installment.article.id} installment={installment} />)}</div>
  </div>;
}
