import { lazy, Suspense } from 'react';
import { FormSkeleton } from '@/components/ui/loading-skeletons';

// Lazy load heavy form components
const CreateLeadDialog = lazy(() => import('@/components/leads/CreateLeadDialog'));
const DeleteLeadDialog = lazy(() => import('@/components/leads/DeleteLeadDialog'));

// Wrapper components with loading states
export function LazyCreateLeadDialog(props: any) {
  return (
    <Suspense fallback={<FormSkeleton fields={6} />}>
      <CreateLeadDialog {...props} />
    </Suspense>
  );
}

export function LazyDeleteLeadDialog(props: any) {
  return (
    <Suspense fallback={<div className="p-4"><FormSkeleton fields={2} /></div>}>
      <DeleteLeadDialog {...props} />
    </Suspense>
  );
}
