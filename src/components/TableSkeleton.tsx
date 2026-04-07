import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  columns?: number;
  rows?: number;
}

export function TableSkeleton({ columns = 6, rows = 5 }: Props) {
  return (
    <div className="overflow-hidden">
      <div className="flex gap-3 p-3 border-b border-border">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 rounded" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3 p-3 border-b border-border last:border-0">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function KpiSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <Skeleton className="h-4 w-32 mb-4 rounded" />
      <div className="flex justify-around items-end h-[200px]">
        {[60, 100, 40, 80, 50, 90].map((h, i) => (
          <Skeleton key={i} className="w-8 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}
