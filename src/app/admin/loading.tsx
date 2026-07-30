import { Skeleton, SkeletonStatCard } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <Skeleton className="h-5 w-32" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border)] last:border-0">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-2 w-20" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
