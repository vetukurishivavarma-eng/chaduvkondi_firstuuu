import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton className="h-6 w-36 rounded-lg" />

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <Skeleton className="w-24 h-24 rounded-full" />
        <div className="flex-1 space-y-3 text-center md:text-left">
          <Skeleton className="h-7 w-48 mx-auto md:mx-0" />
          <Skeleton className="h-4 w-32 mx-auto md:mx-0" />
          <div className="flex gap-3 justify-center md:justify-start">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border)] pb-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-lg" />
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
