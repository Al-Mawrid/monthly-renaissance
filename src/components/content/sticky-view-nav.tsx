"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDownUp, ChevronDown } from "lucide-react";
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
}: {
  label?: string;
  items: ViewNavItem[];
  ariaLabel: string;
  className?: string;
  sortControl?: {
    value: string;
    options: Array<{ value: string; label: string }>;
  };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

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
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                item.active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {item.label}
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

        {sortControl && (
          <label className="flex min-h-10 items-center gap-2 px-1">
            <span className="mr-catalog shrink-0 text-foreground">Sort by</span>
            <span className="relative min-w-0">
              <ArrowDownUp
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary-foreground/75"
                aria-hidden
              />
              <select
                value={sortControl.value}
                onChange={(event) => updateSort(event.target.value)}
                aria-label="Sort directory"
                className="h-9 max-w-full appearance-none rounded-full border border-primary bg-primary py-0 pl-8 pr-9 text-sm font-semibold text-primary-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {sortControl.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary-foreground/75"
                aria-hidden
              />
            </span>
          </label>
        )}
      </div>
    </div>
  );
}
