import { Skeleton, SkeletonStatCard, SkeletonTableRow } from "@/components/ui/skeleton";

export default function LeaderboardLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton className="h-6 w-36 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2 p-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-lg" />
        ))}
      </div>

      {/* Ranking List */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <Skeleton className="h-4 w-32" />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonTableRow key={i} cols={4} />
        ))}
      </div>
    </div>
  );
}
