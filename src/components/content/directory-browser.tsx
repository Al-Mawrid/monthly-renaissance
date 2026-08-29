"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowDownUp, ChevronDown, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export type DirectoryItem = {
  id: string;
  name: string;
  href: string;
  count: number;
  meta: string;
  description?: string;
};

type DirectoryView = "topics" | "writers";
type SortMode = "amount-desc" | "amount-asc" | "alpha-asc" | "alpha-desc";

const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

function parseView(value: string | null, fallback: DirectoryView): DirectoryView {
  return value === "topics" || value === "writers" ? value : fallback;
}

function parseSort(value: string | null): SortMode {
  return value === "amount-asc" || value === "alpha-asc" || value === "alpha-desc"
    ? value
    : "amount-desc";
}

function sortItems(items: DirectoryItem[], sortBy: SortMode): DirectoryItem[] {
  return [...items].sort((a, b) => {
    if (sortBy === "amount-desc") {
      return b.count - a.count || collator.compare(a.name, b.name);
    }
    if (sortBy === "amount-asc") {
      return a.count - b.count || collator.compare(a.name, b.name);
    }
    if (sortBy === "alpha-desc") return collator.compare(b.name, a.name);
    return collator.compare(a.name, b.name);
  });
}

export function DirectoryBrowser({
  initialView,
  topicItems,
  writerItems,
  amountLabel,
  ariaLabel,
}: {
  initialView: DirectoryView;
  topicItems: DirectoryItem[];
  writerItems: DirectoryItem[];
  amountLabel: string;
  ariaLabel: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = parseView(searchParams.get("view"), initialView);
  const sortBy = parseSort(searchParams.get("sort"));
  const items = view === "topics" ? topicItems : writerItems;
  const sortedItems = useMemo(() => sortItems(items, sortBy), [items, sortBy]);

  function updateParam(key: "view" | "sort", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    window.history.pushState(null, "", `${pathname}?${params.toString()}`);
  }

  return (
    <>
      <div className="sticky top-[72px] z-40 -mx-4 mb-6 border-y border-border bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label={ariaLabel} className="flex min-h-10 items-center gap-2">
            <span className="mr-catalog mr-1 shrink-0 text-foreground">View by</span>
            {(["topics", "writers"] as const).map((option) => {
              const active = option === view;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={active}
                  onClick={() => updateParam("view", option)}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-sm font-semibold capitalize transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {option}
                </button>
              );
            })}
          </nav>

          <label className="flex min-h-10 items-center gap-2">
            <span className="mr-catalog shrink-0 text-foreground">Sort by</span>
            <span className="relative min-w-0">
              <ArrowDownUp
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary-foreground/75"
                aria-hidden
              />
              <select
                value={sortBy}
                onChange={(event) => updateParam("sort", event.target.value)}
                aria-label="Sort directory"
                className="h-9 max-w-full appearance-none rounded-full border border-primary bg-primary py-0 pl-8 pr-9 text-sm font-semibold text-primary-foreground outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <option value="amount-desc">Amount of {amountLabel} (descending)</option>
                <option value="amount-asc">Amount of {amountLabel} (ascending)</option>
                <option value="alpha-asc">Alphabetically (A–Z)</option>
                <option value="alpha-desc">Alphabetically (Z–A)</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary-foreground/75"
                aria-hidden
              />
            </span>
          </label>
        </div>
      </div>

      <div className="mb-4 text-sm text-muted-foreground" aria-live="polite">
        {items.length} {view === "topics" ? (items.length === 1 ? "topic" : "topics") : items.length === 1 ? "writer" : "writers"}
      </div>

      <div className={cn("grid sm:grid-cols-2 lg:grid-cols-3", view === "topics" ? "gap-3" : "gap-4")}>
        {sortedItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm",
              view === "topics" ? "flex flex-col" : "flex items-start gap-4",
            )}
          >
            {view === "topics" ? (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary/60 transition-colors group-hover:text-primary" aria-hidden />
                  <h2 className="text-[15px] font-semibold transition-colors group-hover:text-primary">
                    {item.name}
                  </h2>
                </div>
                {item.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                )}
                <span className="mt-3 text-xs text-muted-foreground">{item.meta}</span>
              </>
            ) : (
              <>
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-lg font-semibold text-primary">
                    {item.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold transition-colors group-hover:text-primary">{item.name}</h2>
                  {item.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                  )}
                  <span className="mt-2 block text-xs text-muted-foreground">{item.meta}</span>
                </div>
              </>
            )}
          </Link>
        ))}
      </div>
    </>
  );
}
