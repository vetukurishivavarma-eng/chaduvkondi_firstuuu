import { Skeleton } from "@/components/ui/skeleton";

export default function BadgesLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton className="h-6 w-36 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
      </div>

      {/* Badge Categories */}
      {Array.from({ length: 4 }).map((_, catIdx) => (
        <div key={catIdx} className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="w-6 h-6 rounded" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
                <Skeleton className="w-14 h-14 rounded-xl mx-auto" />
                <Skeleton className="h-4 w-20 mx-auto" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
