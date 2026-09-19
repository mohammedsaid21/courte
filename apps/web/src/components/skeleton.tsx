import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-brand bg-bg-subtle", className)} />;
}

export function VenueCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}
