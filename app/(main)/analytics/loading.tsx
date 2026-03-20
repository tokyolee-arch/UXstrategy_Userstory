function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />
  );
}

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-24" />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-5 flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-12" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[350px] rounded-lg" />
        <Skeleton className="h-[350px] rounded-lg" />
      </div>

      <Skeleton className="h-[350px] rounded-lg" />
      <Skeleton className="h-[180px] rounded-lg" />
    </div>
  );
}
