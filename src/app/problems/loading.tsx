import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function ProblemsLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Nav */}
      <Skeleton className="h-6 w-36 rounded-lg" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      {/* Search */}
      <Skeleton className="h-10 w-full rounded-lg" />

      {/* Filter Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 rounded-lg" />
        ))}
      </div>

      {/* Stats Summary */}
      <div className="flex gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Problem List */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
