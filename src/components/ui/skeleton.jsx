import { cn } from "@/lib/utils";
export function Skeleton({ className }) {
  return <div className={cn("animate-pulse rounded-md bg-ink/8", className)} />;
}
export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[24px] bg-surface shadow-[var(--shadow-border)]">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-32" />
      </div>
    </div>
  );
}
