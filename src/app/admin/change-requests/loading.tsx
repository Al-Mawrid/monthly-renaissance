import { Skeleton } from "@/components/ui/skeleton";

export default function ChangeRequestsLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-40" />
      </div>

      <Skeleton className="h-6 w-24 mb-3" />
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-b border-border last:border-0 px-4 py-3 flex items-center gap-4">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-12" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-3 w-32 flex-1" />
            <Skeleton className="h-3 w-20" />
            <div className="flex gap-1">
              <Skeleton className="h-7 w-7 rounded" />
              <Skeleton className="h-7 w-7 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
