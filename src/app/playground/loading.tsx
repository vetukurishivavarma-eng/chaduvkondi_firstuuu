import { Skeleton } from "@/components/ui/skeleton";

export default function PlaygroundLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton className="h-6 w-36 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Editor + Output Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Editor Panel */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg ml-auto" />
          </div>
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface)] border-b border-[var(--border)]">
              <div className="flex gap-1.5">
                <Skeleton className="w-2.5 h-2.5 rounded-full" />
                <Skeleton className="w-2.5 h-2.5 rounded-full" />
                <Skeleton className="w-2.5 h-2.5 rounded-full" />
              </div>
              <Skeleton className="h-3 w-16 ml-2" />
            </div>
            {/* Code area */}
            <div className="p-4 space-y-3 min-h-[400px] bg-[var(--background)]">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-4" style={{ width: `${40 + Math.random() * 50}%` }} />
              ))}
            </div>
          </div>
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>

        {/* Output Panel */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="rounded-xl border border-[var(--border)] overflow-hidden flex-1 min-h-[400px]">
            <div className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border-b border-[var(--border)]">
              <div className="flex gap-1.5">
                <Skeleton className="w-2.5 h-2.5 rounded-full" />
                <Skeleton className="w-2.5 h-2.5 rounded-full" />
                <Skeleton className="w-2.5 h-2.5 rounded-full" />
              </div>
              <Skeleton className="h-3 w-16 ml-2" />
            </div>
            <div className="p-4 space-y-2 bg-[#1a1a2e] min-h-[400px]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-3 opacity-30" style={{ width: `${30 + Math.random() * 40}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
