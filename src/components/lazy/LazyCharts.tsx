import { lazy, Suspense } from 'react';
import { ChartSkeleton } from '@/components/ui/loading-skeletons';

// Lazy load heavy chart components
const EnhancedLineChart = lazy(() => import('@/components/charts/EnhancedCharts').then(module => ({ default: module.EnhancedLineChart })));
const EnhancedBarChart = lazy(() => import('@/components/charts/EnhancedCharts').then(module => ({ default: module.EnhancedBarChart })));
const EnhancedPieChart = lazy(() => import('@/components/charts/EnhancedCharts').then(module => ({ default: module.EnhancedPieChart })));
const LeadsGrowthChart = lazy(() => import('@/components/charts/LeadsGrowthChart'));

// Wrapper components with loading states
export function LazyEnhancedLineChart(props: any) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <EnhancedLineChart {...props} />
    </Suspense>
  );
}

export function LazyEnhancedBarChart(props: any) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <EnhancedBarChart {...props} />
    </Suspense>
  );
}

export function LazyEnhancedPieChart(props: any) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <EnhancedPieChart {...props} />
    </Suspense>
  );
}

export function LazyLeadsGrowthChart(props: any) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <LeadsGrowthChart {...props} />
    </Suspense>
  );
}
