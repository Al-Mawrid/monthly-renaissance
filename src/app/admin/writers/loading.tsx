import { Skeleton } from "@/components/ui/skeleton";

export default function WritersLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-8 w-28 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-4 py-3 flex gap-4">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b border-border last:border-0 px-4 py-3 flex items-center gap-4">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-7 w-40 rounded" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-10 rounded-full" />
            <Skeleton className="h-7 w-7 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
