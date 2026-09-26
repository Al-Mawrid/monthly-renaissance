"use client";

import { LoaderCircle, PencilLine, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type TopicOption = { name: string; slug: string };

export function TopicSwitcher({ topics, currentSlug, view }: { topics: TopicOption[]; currentSlug: string; view: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const matches = useMemo(() => topics.filter((topic) => topic.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [query, topics]);

  useEffect(() => {
    function closeOnOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("mousedown", closeOnOutside); document.removeEventListener("keydown", closeOnEscape); };
  }, []);

  function changeTopic(value: string) {
    const target = topics.find((topic) => topic.name.toLocaleLowerCase() === value.trim().toLocaleLowerCase());
    if (!target || target.slug === currentSlug) return;
    const params = new URLSearchParams();
    params.set("view", view);
    const groupBy = searchParams.get("groupBy");
    if (groupBy) params.set("groupBy", groupBy);
    setOpen(false);
    startTransition(() => router.push(`${pathname.replace(`/${currentSlug}`, `/${target.slug}`)}?${params.toString()}`));
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label="Change topic" aria-expanded={open} aria-busy={isPending} disabled={isPending} onClick={() => setOpen((value) => !value)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-wait"><span className="sr-only">{isPending ? "Changing topic" : "Change topic"}</span>{isPending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <PencilLine className="h-3.5 w-3.5" aria-hidden />}</button>
      {open && <div className="absolute left-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-border bg-popover p-3 shadow-lg">
        <label className="relative block"><span className="sr-only">Search topics</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden /><input autoFocus disabled={isPending} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search topics" className="h-9 w-full rounded-md border border-input bg-background py-0 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
        <div className="mt-2 max-h-56 overflow-y-auto" role="listbox" aria-label="Topics">{matches.map((topic) => <button key={topic.slug} type="button" role="option" aria-selected={topic.slug === currentSlug} disabled={isPending} onClick={() => changeTopic(topic.name)} className="block w-full rounded px-2 py-2 text-left text-sm hover:bg-muted disabled:cursor-wait">{topic.name}</button>)}</div>
      </div>}
    </div>
  );
}
