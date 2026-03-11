'use client';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded bg-conduit-navy-700 ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Skeleton className="mb-1 h-3 w-16" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div>
          <Skeleton className="mb-1 h-3 w-16" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
      <div>
        <Skeleton className="mb-2 h-3 w-full" />
        <Skeleton className="h-2 w-full" />
      </div>
    </div>
  );
}

export function MetricSkeleton() {
  return (
    <div className="card">
      <Skeleton className="mb-2 h-3 w-20" />
      <Skeleton className="h-8 w-28" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="border-b border-conduit-navy-700">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className="h-4 w-20" />
        </td>
      ))}
    </tr>
  );
}
