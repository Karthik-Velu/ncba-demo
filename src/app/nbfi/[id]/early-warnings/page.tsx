'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Redirect to merged Covenant & Early Warnings page with EWS tab selected.
 */
export default function EarlyWarningsRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  useEffect(() => {
    if (id) router.replace(`/nbfi/${id}/covenants?tab=early-warnings`);
    else router.replace('/dashboard');
  }, [id, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-500">Redirecting to Covenant & Early Warnings…</p>
    </div>
  );
}
