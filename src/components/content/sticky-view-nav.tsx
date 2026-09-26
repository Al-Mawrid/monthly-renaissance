"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDownUp, ChevronDown, Filter, LoaderCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewNavItem = {
  label: string;
  href: string;
  active: boolean;
  count?: number;
};

export function StickyViewNav({
  label,
  items,
  ariaLabel,
  className,
  sortControl,
  groupControl,
  filterControl,
}: {
  label?: string;
  items: ViewNavItem[];
  ariaLabel: string;
  className?: string;
  sortControl?: {
    value: string;
    options: Array<{ value: string; label: string }>;
  };
  groupControl?: {
    value: string;
    options: Array<{ value: string; label: string }>;
  };
  filterControl?: {
    writers?: Array<{ name: string; slug: string }>;
    issueYears?: number[];
  };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pendingViewHref, setPendingViewHref] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) setFilterOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setFilterOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function updateSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
  }

  function updateGroup(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("groupBy", value);
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
  }

  function updateFilter(key: "find" | "writerFilter" | "from" | "to" | "fromYear" | "toYear" | "writerSort" | "articleSort", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
  }

  function updateMultiFilter(key: "find" | "writerFilter", values: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    values.forEach((value) => params.append(key, value));
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
  }

  function navigateView(href: string) {
    setPendingViewHref(href);
    startTransition(() => router.push(href));
  }

  const findValues = searchParams.getAll("find").filter(Boolean);
  const selectedWriters = searchParams.getAll("writerFilter").filter(Boolean);

  return (
    <div
      className={cn(
        "sticky top-[72px] z-40 border-y border-border bg-background/95 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/85",
        className,
      )}
    >
      <div className="mx-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <nav
          aria-label={ariaLabel}
          className="flex min-h-10 items-center gap-2 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {label && <span className="mr-catalog mr-1 shrink-0 text-foreground">{label}</span>}
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              aria-busy={pendingViewHref === item.href}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                event.preventDefault();
                navigateView(item.href);
              }}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                item.active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {item.label}
              {pendingViewHref === item.href && <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden />}
              {item.count !== undefined && (
                <span
                  className={cn(
                    "font-mono text-[10px]",
                    item.active ? "text-primary-foreground/75" : "text-muted-foreground",
                  )}
                >
                  {item.count}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {(sortControl || groupControl || filterControl) && (
          <div className="flex min-h-10 flex-wrap items-center gap-2 px-1">
          {groupControl && (
            <label className="flex items-center gap-2">
              <span className="mr-catalog shrink-0 text-foreground">Group by</span>
              <span className="relative min-w-0">
                <select
                  value={groupControl.value}
                  onChange={(event) => updateGroup(event.target.value)}
                  disabled={isPending}
                  aria-label="Group content"
                  className="h-9 max-w-full appearance-none rounded-full border border-border bg-card py-0 pl-3 pr-8 text-sm font-semibold text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {groupControl.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {isPending ? <LoaderCircle className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin" aria-hidden /> : <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" aria-hidden />}
              </span>
            </label>
          )}
          {filterControl && (
            <div ref={filterRef} className="relative">
              <button type="button" aria-expanded={filterOpen} aria-busy={isPending} onClick={() => setFilterOpen((open) => !open)} className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-sm font-semibold text-foreground outline-none hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                {isPending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Filter className="h-3.5 w-3.5" aria-hidden />}
                Filter
              </button>
              {filterOpen && <div className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] space-y-3 rounded-xl border border-border bg-popover p-4 shadow-lg">
                {isPending && <p className="flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden />Updating results</p>}
                <KeywordFilterInput values={findValues} disabled={isPending} onChange={(values) => updateMultiFilter("find", values)} />
                {filterControl.writers && <WriterFilterSelect writers={filterControl.writers} selected={selectedWriters} disabled={isPending} onChange={(values) => updateMultiFilter("writerFilter", values)} />}
                {filterControl.issueYears ? (
                  <div className="grid grid-cols-2 gap-3">
                    <IssueYearSelect label="From year" value={searchParams.get("fromYear") ?? ""} years={filterControl.issueYears} disabled={isPending} onChange={(value) => updateFilter("fromYear", value)} />
                    <IssueYearSelect label="To year" value={searchParams.get("toYear") ?? ""} years={filterControl.issueYears} disabled={isPending} onChange={(value) => updateFilter("toYear", value)} />
                  </div>
                ) : <div className="grid grid-cols-2 gap-3">
                    <label className="text-sm font-medium">From
                      <input type="date" disabled={isPending} defaultValue={searchParams.get("from") ?? ""} onChange={(event) => updateFilter("from", event.target.value)} className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    </label>
                    <label className="text-sm font-medium">To
                      <input type="date" disabled={isPending} defaultValue={searchParams.get("to") ?? ""} onChange={(event) => updateFilter("to", event.target.value)} className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    </label>
                  </div>}
                {filterControl.writers && <>
                  <label className="block text-sm font-medium">Sort writers by
                    <select
                      value={searchParams.get("writerSort") ?? "count-desc"}
                      onChange={(event) => updateFilter("writerSort", event.target.value)}
                      disabled={isPending}
                      className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="count-desc">Most articles first</option>
                      <option value="count-asc">Fewest articles first</option>
                      <option value="alpha-asc">Alphabetically (A–Z)</option>
                      <option value="alpha-desc">Alphabetically (Z–A)</option>
                    </select>
                  </label>
                  <label className="block text-sm font-medium">Sort articles by
                    <select
                      value={searchParams.get("articleSort") ?? "newest"}
                      onChange={(event) => updateFilter("articleSort", event.target.value)}
                      disabled={isPending}
                      className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="alpha-asc">Alphabetically (A–Z)</option>
                      <option value="alpha-desc">Alphabetically (Z–A)</option>
                    </select>
                  </label>
                </>}
              </div>}
            </div>
          )}
          {sortControl && (
          <label className="flex items-center gap-2">
            <span className="mr-catalog shrink-0 text-foreground">Sort by</span>
            <span className="relative min-w-0">
              <ArrowDownUp
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary-foreground/75"
                aria-hidden
              />
              <select
                value={sortControl.value}
                onChange={(event) => updateSort(event.target.value)}
                disabled={isPending}
                aria-label="Sort directory"
                className="h-9 max-w-full appearance-none rounded-full border border-primary bg-primary py-0 pl-8 pr-9 text-sm font-semibold text-primary-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {sortControl.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {isPending ? <LoaderCircle className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-primary-foreground/75" aria-hidden /> : <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary-foreground/75" aria-hidden />}
            </span>
          </label>
          )}
          </div>
        )}
      </div>
    </div>
  );
}

function WriterFilterSelect({
  writers,
  selected,
  disabled,
  onChange,
}: {
  writers: Array<{ name: string; slug: string }>;
  selected: string[];
  disabled: boolean;
  onChange: (names: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [optionsOpen, setOptionsOpen] = useState(false);
  const selectedSet = new Set(selected);
  const matches = writers.filter((writer) => !selectedSet.has(writer.name) && writer.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return (
    <div className="relative">
      <label className="block text-sm font-medium" htmlFor="writer-filter-search">Writer</label>
      <div className="mt-1.5 flex min-h-9 flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2 py-1 focus-within:ring-2 focus-within:ring-ring">
        {selected.map((name) => <FilterTag key={name} label={name} disabled={disabled} onRemove={() => onChange(selected.filter((current) => current !== name))} />)}
        <input id="writer-filter-search" disabled={disabled} type="search" value={query} onFocus={() => setOptionsOpen(true)} onChange={(event) => { setQuery(event.target.value); setOptionsOpen(true); }} placeholder={selected.length ? "Add writer" : "Search and select writers"} className="h-7 min-w-24 flex-1 bg-transparent px-1 text-sm outline-none" />
      </div>
      {optionsOpen && <div className="absolute left-0 right-0 z-10 mt-1 max-h-36 overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-lg" role="listbox" aria-label="Writers for this topic">
        {selected.length > 0 && <button type="button" disabled={disabled} onClick={() => onChange([])} className="w-full rounded px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted">Clear selected writers</button>}
        {matches.map((writer) => <button key={writer.slug} type="button" role="option" aria-selected={false} disabled={disabled} onClick={() => { onChange([...selected, writer.name]); setQuery(""); }} className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted">{writer.name}</button>)}
        {matches.length === 0 && <p className="px-2 py-1.5 text-sm text-muted-foreground">No matching writers.</p>}
      </div>}
    </div>
  );
}

function KeywordFilterInput({ values, disabled, onChange }: { values: string[]; disabled: boolean; onChange: (values: string[]) => void }) {
  const [query, setQuery] = useState("");

  function addKeywords() {
    const added = query.split(/[,\n]/).map((value) => value.trim()).filter((value) => value && !values.includes(value));
    if (added.length) onChange([...values, ...added]);
    setQuery("");
  }

  return (
    <div>
      <label className="block text-sm font-medium" htmlFor="find-filter-search">Find</label>
      <div className="mt-1.5 flex min-h-9 flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2 py-1 focus-within:ring-2 focus-within:ring-ring">
        {values.map((value) => <FilterTag key={value} label={value} disabled={disabled} onRemove={() => onChange(values.filter((current) => current !== value))} />)}
        <input id="find-filter-search" disabled={disabled} type="search" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); addKeywords(); } }} onBlur={addKeywords} placeholder={values.length ? "Add keyword" : "Search titles and keywords"} className="h-7 min-w-24 flex-1 bg-transparent px-1 text-sm outline-none" />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Press Enter or comma to add a keyword.</p>
    </div>
  );
}

function IssueYearSelect({ label, value, years, disabled, onChange }: { label: string; value: string; years: number[]; disabled: boolean; onChange: (value: string) => void }) {
  return <label className="text-sm font-medium">{label}
    <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <option value="">Any year</option>
      {years.map((year) => <option key={year} value={year}>{year}</option>)}
    </select>
  </label>;
}

function FilterTag({ label, disabled, onRemove }: { label: string; disabled: boolean; onRemove: () => void }) {
  return <span className="inline-flex max-w-full items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs text-foreground"><span className="truncate">{label}</span><button type="button" disabled={disabled} onClick={onRemove} aria-label={`Remove ${label}`} className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"><X className="h-3 w-3" aria-hidden /></button></span>;
}
