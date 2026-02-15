export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border border-border p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-4 w-4 bg-muted rounded" />
            </div>
            <div className="h-7 w-14 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Chart Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/40">
              <div className="h-4 w-32 bg-muted rounded" />
            </div>
            <div className="p-4 h-[300px] flex items-center justify-center">
              <div className="h-40 w-40 bg-muted rounded-full opacity-30" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
