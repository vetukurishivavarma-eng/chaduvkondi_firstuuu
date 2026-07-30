import { Skeleton } from "@/components/ui/skeleton";

export default function AiGenerateLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Form Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
          <Skeleton className="h-5 w-28" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            ))}
          </div>
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>

        {/* Preview Section */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
          <Skeleton className="h-5 w-24" />
          <div className="space-y-3 min-h-[300px]">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
