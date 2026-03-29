"use client";

import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function SortableHead({
  column,
  children,
  className,
}: {
  column: string;
  children: React.ReactNode;
  className?: string;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentSort = searchParams.get("sort");
  const currentOrder = searchParams.get("order") ?? "asc";
  const isActive = currentSort === column;

  // Toggle: inactive → asc, asc → desc, desc → remove sort
  let nextOrder: string | null;
  if (!isActive) {
    nextOrder = "asc";
  } else if (currentOrder === "asc") {
    nextOrder = "desc";
  } else {
    nextOrder = null;
  }

  const params = new URLSearchParams(searchParams.toString());
  if (nextOrder) {
    params.set("sort", column);
    params.set("order", nextOrder);
  } else {
    params.delete("sort");
    params.delete("order");
  }
  // Reset to page 1 when sorting changes
  params.delete("page");

  const href = `${pathname}?${params.toString()}`;

  return (
    <TableHead className={cn("select-none", className)}>
      <Link
        href={href}
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {children}
        {isActive ? (
          currentOrder === "asc" ? (
            <ArrowUp className="h-3 w-3 text-primary" />
          ) : (
            <ArrowDown className="h-3 w-3 text-primary" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </Link>
    </TableHead>
  );
}
