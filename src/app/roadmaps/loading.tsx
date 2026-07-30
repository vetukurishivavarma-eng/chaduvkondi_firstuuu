import { Skeleton } from "@/components/ui/skeleton";

export default function RoadmapsLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton className="h-6 w-36 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Track Selector */}
      <div className="flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-lg" />
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Sub-domains */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="p-3 rounded-lg border border-[var(--border)] space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
