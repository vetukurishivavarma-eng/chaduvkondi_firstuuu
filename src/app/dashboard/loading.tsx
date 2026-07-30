import { Skeleton, SkeletonStatCard } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Track Progress & Daily Challenge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-6 h-6 rounded" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>

      {/* Sub-domain & Coding Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
          <Skeleton className="h-5 w-36" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
        <Skeleton className="h-5 w-28" />
        <div className="flex gap-1">
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-4 rounded-sm" />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
        <Skeleton className="h-5 w-28" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2 w-1/3" />
            </div>
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
