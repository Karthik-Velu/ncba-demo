'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Catch-all for /nbfi/[id] (no subroute).
 * Redirects to the appropriate subpage (upload / input / output) based on NBFI status,
 * so that direct links to /nbfi/[id] never show a blank screen.
 */
export default function NBFIDetailRedirectPage() {
  const { getNBFI, user } = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  useEffect(() => {
    if (!user) {
      router.replace('/');
      return;
    }
    if (!id) {
      router.replace('/dashboard');
      return;
    }

    const nbfi = getNBFI(id);
    if (!nbfi) {
      router.replace('/dashboard');
      return;
    }

    const status = nbfi.status;
    if (status === 'draft' || status === 'uploading') {
      router.replace(`/nbfi/${id}/upload`);
    } else if (status === 'spreading') {
      router.replace(`/nbfi/${id}/input`);
    } else {
      router.replace(`/nbfi/${id}/output`);
    }
  }, [id, user, getNBFI, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-500">Redirecting…</p>
    </div>
  );
}
