import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "default" | "card" | "avatar" | "text" | "button" | "table-row";
  lines?: number;
}

export function Skeleton({ className, variant = "default", lines = 1 }: SkeletonProps) {
  const baseClasses = "animate-pulse bg-muted rounded";
  
  const variants = {
    default: "h-4 w-full",
    card: "h-32 w-full rounded-lg",
    avatar: "h-10 w-10 rounded-full",
    text: "h-4 w-full",
    button: "h-10 w-20 rounded-md",
    "table-row": "h-12 w-full rounded"
  };

  if (variant === "text" && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              variants[variant],
              i === lines - 1 ? "w-3/4" : "w-full",
              className
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn(baseClasses, variants[variant], className)} />
  );
}

// Specialized skeleton components
export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton variant="avatar" />
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" />
          <Skeleton variant="text" lines={1} className="w-2/3" />
        </div>
      </div>
      <Skeleton variant="text" lines={3} />
      <div className="flex space-x-2">
        <Skeleton variant="button" />
        <Skeleton variant="button" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-6 border-b">
        <Skeleton variant="text" className="w-1/3" />
      </div>
      <div className="p-6 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton variant="avatar" />
            <div className="space-y-2 flex-1">
              <Skeleton variant="text" />
              <Skeleton variant="text" className="w-2/3" />
            </div>
            <Skeleton variant="button" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton variant="text" className="w-1/2" />
              <Skeleton variant="avatar" />
            </div>
            <Skeleton variant="text" className="w-1/3 text-2xl" />
            <Skeleton variant="text" className="w-2/3" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <Skeleton variant="text" className="w-1/3" />
          <Skeleton variant="card" className="h-64" />
        </div>
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <Skeleton variant="text" className="w-1/3" />
          <Skeleton variant="card" className="h-64" />
        </div>
      </div>
    </div>
  );
}

export function LeadCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton variant="avatar" />
          <div className="space-y-1">
            <Skeleton variant="text" className="w-32" />
            <Skeleton variant="text" className="w-24" />
          </div>
        </div>
        <Skeleton variant="button" />
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" />
        <Skeleton variant="text" className="w-3/4" />
      </div>
      <div className="flex space-x-2">
        <Skeleton variant="button" className="w-16" />
        <Skeleton variant="button" className="w-20" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center space-x-6">
          <Skeleton variant="avatar" className="h-24 w-24" />
          <div className="space-y-3 flex-1">
            <Skeleton variant="text" className="w-1/3 text-xl" />
            <Skeleton variant="text" className="w-1/4" />
            <Skeleton variant="text" className="w-1/2" />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <Skeleton variant="text" className="w-1/3" />
          <Skeleton variant="text" lines={4} />
        </div>
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <Skeleton variant="text" className="w-1/3" />
          <Skeleton variant="text" lines={4} />
        </div>
      </div>
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="w-1/3" />
        <div className="flex space-x-2">
          <Skeleton variant="button" />
          <Skeleton variant="button" />
        </div>
      </div>
      <Skeleton variant="card" className="h-96" />
    </div>
  );
} 