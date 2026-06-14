"use client";

import { useTransition } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, ArrowUpDown, Loader2 } from "lucide-react";
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentSort = searchParams.get("sort");
  const currentOrder = searchParams.get("order") ?? "asc";
  const isActive = currentSort === column;

  let nextOrder: string | null;
  if (!isActive) nextOrder = "asc";
  else if (currentOrder === "asc") nextOrder = "desc";
  else nextOrder = null;

  const params = new URLSearchParams(searchParams.toString());
  if (nextOrder) {
    params.set("sort", column);
    params.set("order", nextOrder);
  } else {
    params.delete("sort");
    params.delete("order");
  }
  params.delete("page");

  const href = `${pathname}?${params.toString()}`;

  return (
    <TableHead className={cn("select-none", className)}>
      <button
        onClick={() => startTransition(() => router.push(href))}
        disabled={isPending}
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors disabled:opacity-70"
      >
        {children}
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isActive ? (
          currentOrder === "asc" ? (
            <ArrowUp className="h-3 w-3 text-primary" />
          ) : (
            <ArrowDown className="h-3 w-3 text-primary" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </button>
    </TableHead>
  );
}
