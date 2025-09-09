import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load map components
const TerritoryMap = lazy(() => import('@/components/territories/TerritoryMap'));

// Wrapper components with loading states
export function LazyTerritoryMap(props: any) {
  return (
    <Suspense fallback={
      <div className="h-96 w-full rounded-lg border">
        <Skeleton className="h-full w-full" />
      </div>
    }>
      <TerritoryMap {...props} />
    </Suspense>
  );
}
