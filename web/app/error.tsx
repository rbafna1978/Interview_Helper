'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { PageContainer } from '@/components/layout/PageContainer';

export default function RootError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageContainer className="space-y-4">
      <h1 className="text-2xl font-semibold text-[color:var(--text)]">Something went wrong</h1>
      <p className="text-sm text-[color:var(--text-muted)]">
        The page hit an error. Try again, or refresh if this keeps happening.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>
    </PageContainer>
  );
}
