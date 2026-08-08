"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function PaginationNav({
  page,
  totalPages,
  prevHref,
  nextHref,
  className,
}: {
  page: number;
  totalPages: number;
  prevHref: string;
  nextHref: string;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingDir, setPendingDir] = useState<"prev" | "next" | null>(null);

  function navigate(href: string, dir: "prev" | "next") {
    setPendingDir(dir);
    startTransition(() => router.push(href));
  }

  return (
    <div className={cn("flex items-center justify-center gap-2 mt-6", className)}>
      {page > 1 ? (
        <button
          onClick={() => navigate(prevHref, "prev")}
          disabled={isPending}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline disabled:opacity-50"
        >
          {isPending && pendingDir === "prev" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <span>&larr;</span>
          )}{" "}
          Previous
        </button>
      ) : (
        <span className="text-sm text-muted-foreground/50">&larr; Previous</span>
      )}
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <button
          onClick={() => navigate(nextHref, "next")}
          disabled={isPending}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline disabled:opacity-50"
        >
          Next{" "}
          {isPending && pendingDir === "next" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <span>&rarr;</span>
          )}
        </button>
      ) : (
        <span className="text-sm text-muted-foreground/50">Next &rarr;</span>
      )}
    </div>
  );
}
