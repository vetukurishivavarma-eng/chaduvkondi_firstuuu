import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[var(--soft)]",
        className
      )}
      {...props}
    />
  );
}

export function SkeletonCard({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3",
        className
      )}
      {...props}
    >
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-full" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonStatCard({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center gap-3",
        className
      )}
      {...props}
    >
      <Skeleton className="w-10 h-10 rounded-lg" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

export function SkeletonTableRow({ cols = 4, className, ...props }: SkeletonProps & { cols?: number }) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 px-4 py-3 border-b border-[var(--border)]",
        className
      )}
      {...props}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}
