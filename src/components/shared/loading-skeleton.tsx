import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  className?: string;
  rows?: number;
  type?: "card" | "list" | "table" | "stats";
}

export function LoadingSkeleton({
  className,
  rows = 3,
  type = "list",
}: LoadingSkeletonProps) {
  if (type === "stats") {
    return (
      <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <Skeleton className="h-3.5 w-24 mb-3" />
            <Skeleton className="h-7 w-28 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "card") {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-7 w-20 rounded-md" />
              <Skeleton className="h-7 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className={cn("rounded-xl border border-border bg-card overflow-hidden", className)}>
        <div className="p-4 border-b border-border">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-7 w-7 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
          <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}
