import { Skeleton } from "@/components/ui/skeleton";

export default function AiTutorLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chat Area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 min-h-[500px] space-y-4">
            {/* Chat messages */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className={`space-y-2 ${i % 2 === 0 ? '' : 'items-end'} flex flex-col`}>
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
          {/* Input */}
          <div className="flex gap-2">
            <Skeleton className="h-11 flex-1 rounded-lg" />
            <Skeleton className="h-11 w-20 rounded-lg" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
            <Skeleton className="h-5 w-24" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
